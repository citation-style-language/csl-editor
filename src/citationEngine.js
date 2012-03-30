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

		var result = {"statusMessage":"", "formattedCitations":[], "formattedBibliography":""};

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


		result.formattedBibliography = "<p>";
		result.formattedBibliography += bibliography.join("<\/p><p>");
		result.formattedBibliography += "<\/p>";

		return result;
	};

	var runCiteprocAndDisplayOutput = function (statusOut, exampleOut, citationsOut, bibliographyOut, callback) {
		var style = CSLEDIT.code.get();
		var inLineCitations = "";
		var citations = [];
		var formattedResult;

		statusOut.html("");

		formattedResult = formatCitations(
			style, cslEditorExampleData.jsonDocuments, cslEditorExampleData.citationsItems);

		oldFormattedCitation = newFormattedCitation;
		newFormattedCitation = "<p>";
		newFormattedCitation += formattedResult.formattedCitations.join("<\/p><p>");
		newFormattedCitation += "<\/p>";

		oldFormattedBibliography = newFormattedBibliography;
		newFormattedBibliography = formattedResult.formattedBibliography;

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

		var dmp = diffMatchPatch;
		var diffs = dmp.diff_main(stripTags(oldFormattedCitation, "span"), stripTags(newFormattedCitation, "span"));
		dmp.diff_cleanupSemantic(diffs);
		var diffFormattedCitation = unescape(CSLEDIT.diff.prettyHtml(diffs));

		diffs = dmp.diff_main(stripTags(oldFormattedBibliography, "span"), stripTags(newFormattedBibliography, "span"));
		dmp.diff_cleanupSemantic(diffs);
		var diffFormattedBibliography = unescape(CSLEDIT.diff.prettyHtml(diffs));

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

		statusOut.html(formattedResult.statusMessage);
	}

	// Return public members:
	return {
		runCiteprocAndDisplayOutput : runCiteprocAndDisplayOutput
	};

}());
