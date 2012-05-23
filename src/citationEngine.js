
"use strict";

var CSLEDIT = CSLEDIT || {};

var jsonDocuments;

CSLEDIT.citationEngine = (function () {
	var oldFormattedCitation = "",
		newFormattedCitation = "",
		oldFormattedBibliography = "",
		newFormattedBibliography = "",
		diffTimeout,
		dmp = null; // for diff_match_patch object

	var stripTags = function (html, tag) {
		var stripRegExp = new RegExp("<" + tag + ".*?>|<\/\s*" + tag + "\s*?\>", "g");

		// creating new string because of bug where some html from generateExampleCitations.js
		// was type object instead of string and didn't have the replace() function
		var stripped = new String(html);
		stripped = stripped.replace(stripRegExp, "");
		return stripped;
	};

	var formatCitations = function (style, documents, citationClusters, taggedOutput) {
		// TODO: this shouldn't be a global
		jsonDocuments = documents;

		var result = { "statusMessage":"", "formattedCitations":[], "formattedBibliography": [] };
		result.statusMessage = "";
		try
		{
			var sys = new Sys(abbreviations);
			var citeproc = new CSL.Engine(sys, style);
			citeproc.opt.development_extensions.csl_reverse_lookup_support = true;
		}
		catch(err)
		{
			result.statusMessage = "Citeproc initialisation exception: " + err;
			return result;
		}
		
		var inLineCitations = "";
		var inLineCitationArray = new Array();
		
		for (var cluster=0; cluster<citationClusters.length; cluster++)
		{
			try
			{
				var citations = citeproc.appendCitationCluster(citationClusters[cluster],false);
			}
			catch(err)
			{
				result.statusMessage = "Citeproc exception: " + err;
				return result;
			}
			
			for (var i = 0; i < citations.length; i++)
			{
				var pos = citations[i][0];
				
				if (inLineCitations != "")
				{
					inLineCitations += "<br>";
				}
				
				if (taggedOutput !== true) {
					citations[i][1] = stripTags(citations[i][1], "span");
				}

				inLineCitations += citations[i][1];
				inLineCitationArray.push(citations[i][1]);
			}
		}
		result.formattedCitations = inLineCitationArray;
		
		var makeBibliographyArgument;
		
		var enumerateCitations = true;
		if (enumerateCitations == true) {
			makeBibliographyArgument = undefined;
		}
		else {
			makeBibliographyArgument = "citation-number";
		}
		
		try
		{
			var bibliography = citeproc.makeBibliography(makeBibliographyArgument);
		}
		catch(err)
		{
			result.statusMessage = "Citeproc exception: " + err;
			return result;
		}

		var hangingindent = false;
		var has_bibliography = (bibliography !== false);

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
			var index;
			for (index = 0; index < bibliography.length; index++) {
				bibliography[index] = stripTags(bibliography[index], "span");
			}
		}

		result.formattedBibliography = bibliography;
		return result;
	};

	var runCiteprocAndDisplayOutput = function (
			statusOut, exampleOut, citationsOut, bibliographyOut, callback,
			citationNodeCslId, bibliographyNodeCslId) {

		console.time("runCiteprocAndDisplayOutput");

		var style = CSLEDIT.data.getCslCode(),
			inLineCitations = "",
			citations = [],
			formattedResult,
			citationTagStart = "<p>",
			citationTagEnd = "<\/p>",
			bibliographyTagStart = "<p>",
			bibliographyTagEnd = "<\/p>",
			startTime,
			citationDiffs,
			bibliographyDiffs,
			diffFormattedCitation,
			diffFormattedBibliography;

		statusOut.html("<i>Re-formatting citations...</i>");
	
		console.time("formatCitations");

		formattedResult = formatCitations(
			style, cslEditorExampleData.jsonDocuments, cslEditorExampleData.citationsItems, true);
		
		console.timeEnd("formatCitations");

		statusOut.html(formattedResult.statusMessage);

		// add syntax highlighting at highest level
		if (typeof citationNodeCslId !== "undefined") {
			citationTagStart = '<p><span cslid="' + citationNodeCslId + '">';
		    citationTagEnd = '<\/span><\/p>';
		}
		if (typeof bibliographyNodeCslId !== "undefined") {
			bibliographyTagStart = '<p><span cslid="' + bibliographyNodeCslId + '">';
			bibliographyTagEnd = '<\/span><\/p>';
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

		if (newFormattedBibliography.indexOf("<second-field-align>") > -1) {
			exampleOut.css({
				// TODO: don't change the whole output panel CSS, just the relevant lines
				"padding-left" : "2.5em",
				"text-indent" : "-2em"
			});
		} else {
			exampleOut.css({
				"padding-left" : "0.5em",
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
		diffFormattedCitation = unescape(CSLEDIT.diff.prettyHtml(citationDiffs));

		bibliographyDiffs =
			dmp.diff_main(stripTags(oldFormattedBibliography, "span"), stripTags(newFormattedBibliography, "span"));
		dmp.diff_cleanupSemantic(bibliographyDiffs);
		diffFormattedBibliography = unescape(CSLEDIT.diff.prettyHtml(bibliographyDiffs));

		if (dmp.diff_levenshtein(citationDiffs) === 0 && dmp.diff_levenshtein(bibliographyDiffs) === 0) {
			citationsOut.html(newFormattedCitation);
			bibliographyOut.html(newFormattedBibliography);
			if (typeof callback !== "undefined") {
				callback();
			}

		} else {
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
		}
		
		console.timeEnd("runCiteprocAndDisplayOutput");
	}

	// Return public members:
	return {
		formatCitations : formatCitations,
		runCiteprocAndDisplayOutput : runCiteprocAndDisplayOutput
	};

}());
