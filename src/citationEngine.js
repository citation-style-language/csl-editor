"use strict";

// Uses citeproc-js to generate example citaitons

define([	'src/options',
			'src/exampleCitations',
			'src/diff',
			'src/debug',
			'src/citeprocLoadSys',
			'external/citeproc/citeproc',
			'jquery'
		],
		function (
			CSLEDIT_options,
			CSLEDIT_exampleCitations,
			CSLEDIT_diff,
			debug,
			citeprocSys,
			CSL,
			$
		) {
	var oldFormattedCitation = "",
		newFormattedCitation = "",
		oldFormattedBibliography = "",
		newFormattedBibliography = "",
		diffTimeout,
		dmp = null, // for diff_match_patch object
		previousStyle = "", // to skip initializing citeproc when using the same style
		citeproc;

	// Remove the tags with the given tagName from the given html and return the result
	//
	// The contents of the removed tags are retained
	var stripTags = function (html, tagName) {
		var stripRegExp = new RegExp("<" + tagName + ".*?>|</\\s*" + tagName + "\\s*?>", "g");

		// creating new string because of bug where some html from generateExampleCitations.js
		// was type object instead of string and didn't have the replace() function
		var stripped = html.toString();
		stripped = stripped.replace(stripRegExp, "");
		return stripped;
	};

	// Formats the given citationClusters, containing the given documents, in the given
	// style
	//
	// If taggedOutput is true, the output will contain <span cslid=???> tags where the cslid
	// attribute points to the input CSL node responsible for that part of the output
	//
	// Returns a result containing the following properties:
	//
	// - statusMessage - used for errors, if everything went well, this will be an empty string
	// - formattedCitations - a list of formatted inline citation strings
	// - formattedBibliography - the formatted bibliography string
	var formatCitations = function (style, documents, citationClusters, taggedOutput) {
		var bibliography,
			result,
			citations,
			inLineCitations,
			inLineCitationArray,
			pos,
			makeBibliographyArgument,
			enumerateCitations;

		citeprocSys.setJsonDocuments(documents);

		result = { "statusMessage": "", "formattedCitations": [], "formattedBibliography": [] };
		result.statusMessage = "";
		if (style !== previousStyle) {
			try {
				citeproc = new CSL.Engine(citeprocSys, style);
				previousStyle = style;
			}
			catch (err) {
				result.statusMessage = "Citeproc initialisation exception: " + err;
				return result;
			}
		} else {
			citeproc.restoreProcessorState([]);
		}
		
		inLineCitations = "";
		inLineCitationArray = [];
		
		$.each(citationClusters, function (clusterIndex, cluster) {
			if (cluster.citationItems.length === 0) {
				return;
			}
			try {
				citations = citeproc.appendCitationCluster(cluster, false);
			}
			catch (err) {
				result.statusMessage = "Citeproc exception: " + err;
				return false;
			}
			
			$.each(citations, function (i, citation) {
				pos = citation[0];
				
				if (inLineCitations !== "")
				{
					inLineCitations += "<br>";
				}
				
				if (taggedOutput !== true) {
					citation[1] = stripTags(citation[1], "span");
				}

				inLineCitations += citation[1];

				if (citation[1] !== "") {
					inLineCitationArray.push(citation[1]);
				}
			});
		});
		if (result.statusMessage !== "") {
			return result;
		}
		result.formattedCitations = inLineCitationArray;
		
		enumerateCitations = true;
		if (enumerateCitations === true) {
			makeBibliographyArgument = undefined;
		}
		else {
			makeBibliographyArgument = "citation-number";
		}
		
		try {
			bibliography = citeproc.makeBibliography(makeBibliographyArgument);
		}
		catch (err) {
			result.statusMessage = "Citeproc exception: " + err;
			return result;
		}

		if (bibliography !== false) {
			if ("hangingindent" in bibliography[0]) {
				result.hangingIndent = bibliography[0].hangingindent;
			}
			bibliography = bibliography[1];
		}
		else {
			bibliography = [[(citations[0][1])]];
		}

		if (taggedOutput !== true) {
			$.each(bibliography, function (i, entry) {
				bibliography[i] = stripTags(entry, "span");
			});
		}

		result.formattedBibliography = bibliography;
		return result;
	};

	// This function formats the current style in CSLEDIT_data and populates
	// the given elements with the output
	//
	// Note on diffs:
	//   There is currently unused code to show a diff for a second after each change.
	//   This can be enabled by adding 'showDiffOnChange' to the CSLEDIT_options via the
	//   CSLEDIT_VisualEditor or CSLEDIT_CodeEditor contructors.
	//
	//   It hasn't worked so well since adding the reverse lookup <span cslid=??> tags to
	//   the citeproc output.
	//
	//   Could be good to fix for use in the Code Editor, but not so essential for the Visual Editor.
	var runCiteprocAndDisplayOutput = function (
			data, statusOut, citationsOut, bibliographyOut, callback,
			exampleReferences, exampleCitations) {

		debug.time("runCiteprocAndDisplayOutput");

		var style = data.getCslCode(),
			inLineCitations = "",
			citations = [],
			formattedResult,
			citationTagStart = "",
			citationTagEnd = "",
			bibliographyTagStart = "",
			bibliographyTagEnd = "",
			startTime,
			citationDiffs,
			bibliographyDiffs,
			diffFormattedCitation,
			diffFormattedBibliography,
			cslData = data.get(),
			citationNode = data.getNodesFromPath("style/citation/layout", cslData),
			bibliographyNode = data.getNodesFromPath("style/bibliography/layout", cslData);

		statusOut.html("<i>Re-formatting citations...</i>");
	
		debug.time("formatCitations");

		exampleReferences = exampleReferences || CSLEDIT_exampleCitations.getCiteprocReferences();
		exampleCitations = exampleCitations || CSLEDIT_exampleCitations.getCitations();

		formattedResult = formatCitations(style, exampleReferences, exampleCitations, true);
		
		debug.timeEnd("formatCitations");

		statusOut.html(formattedResult.statusMessage);

		// add syntax highlighting at highest level
		if (citationNode.length > 0) {
			// wrap in outer div since the .inline-csl-entry one is an inline-block
			citationTagStart = 
				'<div class="csl-entry-container">' +
				'<div class="inline-csl-entry" cslid="' + citationNode[0].cslId + '">';
			citationTagEnd = '</div></div>';
		}
		if (bibliographyNode.length > 0) {
			bibliographyTagStart =
				'<div class="csl-entry-container">' +
				'<div class="bibliography-csl-entry" cslid="' + bibliographyNode[0].cslId + '">';
			bibliographyTagEnd = '</div></div>';
		}

		oldFormattedCitation = newFormattedCitation;
		newFormattedCitation = citationTagStart;
		newFormattedCitation += formattedResult.formattedCitations.join(
			citationTagEnd + citationTagStart);
		newFormattedCitation += citationTagEnd;

		oldFormattedBibliography = newFormattedBibliography;
		newFormattedBibliography = bibliographyTagStart;
		newFormattedBibliography += formattedResult.formattedBibliography.join(
			bibliographyTagEnd + bibliographyTagStart);
		newFormattedBibliography += bibliographyTagEnd;

		// lazy instantiation of diff_match_patch
		if (dmp === null) {
			dmp = new diff_match_patch();
		}

		citationDiffs =
			dmp.diff_main(stripTags(oldFormattedCitation, "span"), stripTags(newFormattedCitation, "span"));
		dmp.diff_cleanupSemantic(citationDiffs);
		diffFormattedCitation = unescape(CSLEDIT_diff.prettyHtml(citationDiffs));

		bibliographyDiffs =
			dmp.diff_main(stripTags(oldFormattedBibliography, "span"), stripTags(newFormattedBibliography, "span"));
		dmp.diff_cleanupSemantic(bibliographyDiffs);
		diffFormattedBibliography = unescape(CSLEDIT_diff.prettyHtml(bibliographyDiffs));

		if (dmp.diff_levenshtein(citationDiffs) === 0 && dmp.diff_levenshtein(bibliographyDiffs) === 0) {
			citationsOut.html(newFormattedCitation);
			bibliographyOut.html(newFormattedBibliography);
			if (typeof callback !== "undefined") {
				callback();
			}
		} else {
			if (CSLEDIT_options.get('showDiffOnChange') === true) {
				// display the diff
				citationsOut.html(diffFormattedCitation);
				bibliographyOut.html(diffFormattedBibliography);

				// display the new version in 1000ms
				clearTimeout(diffTimeout);
				diffTimeout = setTimeout(
					function () {
						citationsOut.html(newFormattedCitation);
						bibliographyOut.html(newFormattedBibliography);
						if (typeof callback !== "undefined") {
							callback();
						}
					},
				1000);
			} else {
				// display the real result
				citationsOut.html(newFormattedCitation);
				bibliographyOut.html(newFormattedBibliography);
				if (typeof callback !== "undefined") {
					callback();
				}
			}
		}

		if ("hangingIndent" in formattedResult) {
			bibliographyOut.find('.bibliography-csl-entry').css({
				"padding-left" : formattedResult.hangingIndent + "em",
				"text-indent" : "-" + formattedResult.hangingIndent + "em"
			});
		} else {
			bibliographyOut.find('.bibliography-csl-entry').css({
				"padding-left" : "0",
				"text-indent" : "0"
			});
		}
		
		debug.timeEnd("runCiteprocAndDisplayOutput");
	};

	// Public members:
	return {
		formatCitations : formatCitations,
		runCiteprocAndDisplayOutput : runCiteprocAndDisplayOutput
	};

});
