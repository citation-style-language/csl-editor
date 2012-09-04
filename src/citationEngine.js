"use strict";

define([	'src/storage',
			'src/options',
			'src/dataInstance',
			'src/exampleCitations',
			'src/diff',
			'src/debug',
			'external/citeproc/citeproc',
			'src/citeprocLoadSys'
		],
		function (
			CSLEDIT_storage,
			CSLEDIT_options,
			CSLEDIT_data,
			CSLEDIT_exampleCitations,
			CSLEDIT_diff,
			debug,
			CSL,
			citeprocSys
		) {
	var oldFormattedCitation = "",
		newFormattedCitation = "",
		oldFormattedBibliography = "",
		newFormattedBibliography = "",
		diffTimeout,
		dmp = null, // for diff_match_patch object
		previousStyle = "", // to skip initializing citeproc when using the same style
		citeproc;

	var stripTags = function (html, tag) {
		var stripRegExp = new RegExp("<" + tag + ".*?>|</\\s*" + tag + "\\s*?>", "g");

		// creating new string because of bug where some html from generateExampleCitations.js
		// was type object instead of string and didn't have the replace() function
		var stripped = new String(html);
		stripped = stripped.replace(stripRegExp, "");
		return stripped;
	};

	var formatCitations = function (style, documents, citationClusters, taggedOutput) {
		var bibliography,
			result,
			citations,
			cluster,
			inLineCitations,
			inLineCitationArray,
			i,
			pos,
			makeBibliographyArgument,
			hangingindent,
			has_bibliography,
			index,
			enumerateCitations;

		citeprocSys.setJsonDocuments(documents);

		result = { "statusMessage": "", "formattedCitations": [], "formattedBibliography": [] };
		result.statusMessage = "";
		if (style !== previousStyle) {
			try
			{
				citeproc = new CSL.Engine(citeprocSys, style);
				citeproc.opt.development_extensions.csl_reverse_lookup_support = true;
				previousStyle = style;
			}
			catch (err)
			{
				result.statusMessage = "Citeproc initialisation exception: " + err;
				return result;
			}
		} else {
			citeproc.restoreProcessorState([]);
		}
		
		inLineCitations = "";
		inLineCitationArray = [];
		
		for (cluster = 0; cluster < citationClusters.length; cluster++)
		{
			try
			{
				citations = citeproc.appendCitationCluster(citationClusters[cluster], false);
			}
			catch (err)
			{
				result.statusMessage = "Citeproc exception: " + err;
				return result;
			}
			
			for (i = 0; i < citations.length; i++)
			{
				pos = citations[i][0];
				
				if (inLineCitations !== "")
				{
					inLineCitations += "<br>";
				}
				
				if (taggedOutput !== true) {
					citations[i][1] = stripTags(citations[i][1], "span");
				}

				inLineCitations += citations[i][1];

				if (citations[i][1] !== "") {
					inLineCitationArray.push(citations[i][1]);
				}
			}
		}
		result.formattedCitations = inLineCitationArray;
		
		enumerateCitations = true;
		if (enumerateCitations === true) {
			makeBibliographyArgument = undefined;
		}
		else {
			makeBibliographyArgument = "citation-number";
		}
		
		try
		{
			bibliography = citeproc.makeBibliography(makeBibliographyArgument);
		}
		catch (err)
		{
			result.statusMessage = "Citeproc exception: " + err;
			return result;
		}

		hangingindent = false;
		has_bibliography = (bibliography !== false);

		if (has_bibliography)
		{
			hangingindent = (bibliography[0].hangingindent != 0 && "undefined" !== typeof(bibliography[0].hangingindent));
			bibliography = bibliography[1];
		}
		else
		{
			bibliography = [[(citations[0][1])]];
		}

		if (taggedOutput !== true) {
			for (index = 0; index < bibliography.length; index++) {
				bibliography[index] = stripTags(bibliography[index], "span");
			}
		}

		result.formattedBibliography = bibliography;
		return result;
	};

	var runCiteprocAndDisplayOutput = function (
			statusOut, exampleOut, citationsOut, bibliographyOut, callback) {

		debug.time("runCiteprocAndDisplayOutput");

		var style = CSLEDIT_data.getCslCode(),
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
			cslData = CSLEDIT_data.get(),
			citationNode = CSLEDIT_data.getNodesFromPath("style/citation/layout", cslData),
			bibliographyNode = CSLEDIT_data.getNodesFromPath("style/bibliography/layout", cslData);

		statusOut.html("<i>Re-formatting citations...</i>");
	
		debug.time("formatCitations");

		formattedResult = formatCitations(
			style, CSLEDIT_exampleCitations.getCiteprocReferences(), CSLEDIT_exampleCitations.getCitations(), true);
		
		debug.timeEnd("formatCitations");

		statusOut.html(formattedResult.statusMessage);

		// add syntax highlighting at highest level
		if (citationNode.length > 0) {
			citationTagStart = '<div cslid="' + citationNode[0].cslId + '">';
			citationTagEnd = '</div>';
		}
		if (bibliographyNode.length > 0) {
			bibliographyTagStart = '<div cslid="' + bibliographyNode[0].cslId + '">';
			bibliographyTagEnd = '</div>';
		}
/*
		// convert div tags to span tags
		// because we can't have divs within a span
		$.each(formattedResult.formattedCitations, function (i, citation) {
			formattedResult.formattedCitations[i] = citation
				.replace(/<div/g, "<span")
				.replace(/<\/div>/g, "</span>");
		});
		$.each(formattedResult.formattedBibliography, function (i, bibliographyEntry) {
			formattedResult.formattedBibliography[i] = bibliographyEntry
				.replace(/<div/g, "<span")
				.replace(/<\/div>/g, "</span>");
		});
*/
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

		if (newFormattedBibliography.indexOf("<second-field-align>") > -1) {
			exampleOut.css({
				// TODO: don't change the whole output panel CSS, just the relevant lines
				"padding-left" : "3em",
				"text-indent" : "-2em"
			});
		} else {
			exampleOut.css({
				"padding-left" : "1em",
				"text-indent" : "0"
			});
		}

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
			if (CSLEDIT_storage.getItem('CSLEDIT_options.visualEditorDiffs') === "true") {
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
		
		debug.timeEnd("runCiteprocAndDisplayOutput");
	};

	// Return public members:
	return {
		formatCitations : formatCitations,
		runCiteprocAndDisplayOutput : runCiteprocAndDisplayOutput
	};

});
