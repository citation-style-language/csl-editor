var CSLEDIT = CSLEDIT || {};

CSLEDIT.citationEngine = (function () {
	var oldFormattedCitation = "",
		newFormattedCitation = "",
		oldFormattedBibliography = "",
		newFormattedBibliography = "",
		diffTimeout,
		diffMatchPatch = new diff_match_patch();

	var stripTags = function (html, tag) {
		var stripRegExp = new RegExp("<" + tag + ".*?>|<\/\s*" + tag + "\s*?\>", "g");
		var stripped = html;
		stripped = stripped.replace(stripRegExp, "");
		return stripped;
	};

	var formatCitations = function (style, documents, citationClusters) {
		// TODO: this shouldn't be a global
		jsonDocuments = documents;

		var result = { "statusMessage":"", "formattedCitations":[], "formattedBibliography": [] };
		result.statusMessage = "";
		try
		{
			var sys = new Sys(abbreviations);
			var citeproc = new CSL.Engine(sys, style);
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
				
				inLineCitations += citations[i][1];
				inLineCitationArray.push(citations[i][1]);
			}
		}
		result.formattedCitations = inLineCitationArray;
		
		var makeBibliographyArgument;
		
		var enumerateCitations = true;
		if (enumerateCitations == true)
		{
			makeBibliographyArgument = undefined;
		}
		else
		{
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

		result.formattedBibliography = bibliography;

		return result;
	};

	var runCiteprocAndDisplayOutput = function (
			statusOut, exampleOut, citationsOut, bibliographyOut, callback,
			citationNodeCslId, bibliographyNodeCslId) {

		console.time("runCiteprocAndDisplayOutput");

		var style = CSLEDIT.code.get(),
			inLineCitations = "",
			citations = [],
			formattedResult,
			citationTagStart = "<p>",
			citationTagEnd = "<\/p>",
			bibliographyTagStart = "<p>",
			bibliographyTagEnd = "<\/p>",
			startTime;

		statusOut.html("<i>Re-formatting citations...</i>");
	
		console.time("formatCitations");

		formattedResult = formatCitations(
			style, cslEditorExampleData.jsonDocuments, cslEditorExampleData.citationsItems);
		
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
				"padding-left" : "2em",
				"text-indent" : "-2em"
			});
		} else {
			exampleOut.css({
				"padding-left" : "0",
				"text-indent" : "0"
			});
		}

		console.time("citeproc diffs");

		var dmp = diffMatchPatch;
		var citationDiffs =
			dmp.diff_main(stripTags(oldFormattedCitation, "span"), stripTags(newFormattedCitation, "span"));
		dmp.diff_cleanupSemantic(citationDiffs);
		var diffFormattedCitation = unescape(CSLEDIT.diff.prettyHtml(citationDiffs));

		bibliographyDiffs =
			dmp.diff_main(stripTags(oldFormattedBibliography, "span"), stripTags(newFormattedBibliography, "span"));
		dmp.diff_cleanupSemantic(bibliographyDiffs);
		var diffFormattedBibliography = unescape(CSLEDIT.diff.prettyHtml(bibliographyDiffs));

		console.timeEnd("citeproc diffs");

		if (dmp.diff_levenshtein(citationDiffs) === 0 && dmp.diff_levenshtein(bibliographyDiffs) === 0) {
			console.log("no change");
		} else {
			console.log("output changed");
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
		runCiteprocAndDisplayOutput : runCiteprocAndDisplayOutput
	};

}());
