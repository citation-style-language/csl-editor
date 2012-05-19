// CSLEDIT.searchByExample built from commit $gitCommit
"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.xmlUtility = {
	stripUnsupportedTagsAndContents : function (html, supportedTags) {
		var element;

		element = $("<all>" + html + "<\/all>");		
		element.find("*").not(supportedTags.join(", ")).remove();

		return element.html();
	},

	stripUnsupportedTags : function (xml, supportedTags) {
		var regExpText = "<\/?(?:" + supportedTags.join("|") + ")[^<>]*>|(<\/?[^<>]*>)",
			stripUnsupportedTags,
			match,
			matches = [];

		// will only contain a captured group for unsupported tags
		stripUnsupportedTags = new RegExp(regExpText, "g");

		match = stripUnsupportedTags.exec(xml);
		while (match !== null) {
			if (match.length > 1 && typeof match[1] !== "undefined") {
				matches.push(match[1]);
			}
			match = stripUnsupportedTags.exec(xml);
		}

		$.each(matches, function (index, value) {
			xml = xml.replace(value, "");
		});

		return xml;
	},
	stripAttributesFromTags : function (xml, tags) {
		var regExp = new RegExp("<(" + tags.join("|") + ")[^<>]*>", "g");

		// remove any attributes the tags may have
		xml = xml.replace(regExp, "<$1>");
		return xml;
	},
	stripComments : function (xml) {
		return xml.replace(/<!--[\s\S]*?-->/g,"");
	}
};

var CSLEDIT = CSLEDIT || {};

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
			startTime;

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

		var citationDiffs =
			dmp.diff_main(stripTags(oldFormattedCitation, "span"), stripTags(newFormattedCitation, "span"));
		dmp.diff_cleanupSemantic(citationDiffs);
		var diffFormattedCitation = unescape(CSLEDIT.diff.prettyHtml(citationDiffs));

		bibliographyDiffs =
			dmp.diff_main(stripTags(oldFormattedBibliography, "span"), stripTags(newFormattedBibliography, "span"));
		dmp.diff_cleanupSemantic(bibliographyDiffs);
		var diffFormattedBibliography = unescape(CSLEDIT.diff.prettyHtml(bibliographyDiffs));

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

var cslServerConfig = (function(){
	// private members
	
	return {
		// paths relative to repo root
		"cslStylesPath" : "external/csl-styles",
		"dataPath" : "generated",

		// example document data
		jsonDocuments : { "ITEM-1" : { /*"DOI" : "10.1088/0143-0807/27/4/007", "URL" : "http://bavard.fourmilab.ch/etexts/einstein/specrel/specrel.pdf",*/ "abstract" : "General description of special relativity", "author" : [ { "family" : "Einstein", "given" : "Albert" } ], "chapter-number" : "3", "container-title" : "Annalen der Physik", "editor" : [  ], "id" : "ITEM-1", "issue" : "4", "issued" : { "date-parts" : [ [ "1905" ] ] }, "page" : "1-26", "publisher" : "Dover Publications", "title" : "On the electrodynamics of moving bodies", "translator" : [  ], "type" : "article-journal", "volume" : "17" }, "ITEM-2" : { /*"DOI" : "10.1038/171737a0", "URL" : "http://www.ncbi.nlm.nih.gov/pubmed/13054692",*/ "abstract" : "We wish to suggest a structure for the salt of deoxyribose nucleic acid (D.N.A.). This structure has novel features which are of considerable biological interest.", "author" : [ { "family" : "Watson", "given" : "J D" }, { "family" : "Crick", "given" : "F H" } ], "container-title" : "Nature", "editor" : [  ], "id" : "ITEM-2", "issue" : "4356", "issued" : { "date-parts" : [ [ "1953" ] ] }, "page" : "737-738", "publisher" : "Am Med Assoc", "title" : "Molecular structure of nucleic acids; a structure for deoxyribose nucleic acid.", "translator" : [  ], "type" : "article-journal", "volume" : "171" } },
		citationsItems : [
			{ "citationId" : "CITATION-0", "citationItems" : [ { "id" : "ITEM-1", "uris" : [] } ], "properties" : { "noteIndex" : 0 }, "schema" : "https://github.com/citation-style-language/schema/raw/master/csl-citation.json" }//,
	//		{ "citationId" : "CITATION-1", "citationItems" : [ { "id" : "ITEM-1", "uris" : [] },  { "id" : "ITEM-2", "uris" : [] } ], "properties" : { "noteIndex" : 0 }, "schema" : "https://github.com/citation-style-language/schema/raw/master/csl-citation.json" }
	]
	};
}());

var exampleCitations = {
	"masterIdFromId": {
		"http://www.zotero.org/styles/acm-sig-proceedings-long-author-list": "http://www.zotero.org/styles/acm-sig-proceedings-long-author-list",
		"http://www.zotero.org/styles/acm-sig-proceedings": "http://www.zotero.org/styles/acm-sig-proceedings",
		"http://www.zotero.org/styles/acm-sigchi-proceedings": "http://www.zotero.org/styles/acm-sigchi-proceedings",
		"http://www.zotero.org/styles/acm-siggraph": "http://www.zotero.org/styles/acm-siggraph",
		"http://www.zotero.org/styles/acs-chemical-biology": "http://www.zotero.org/styles/acs-chemical-biology",
		"http://www.zotero.org/styles/acs-nano": "http://www.zotero.org/styles/acs-nano",
		"http://www.zotero.org/styles/acta-materialia": "http://www.zotero.org/styles/acta-materialia",
		"http://www.zotero.org/styles/acta-universitatis-agriculturae-sueciae": "http://www.zotero.org/styles/acta-universitatis-agriculturae-sueciae",
		"http://www.zotero.org/styles/administrative-science-quaterly": "http://www.zotero.org/styles/administrative-science-quaterly",
		"http://www.zotero.org/styles/advanced-engineering-materials": "http://www.zotero.org/styles/advanced-engineering-materials",
		"http://www.zotero.org/styles/advanced-materials": "http://www.zotero.org/styles/advanced-materials",
		"http://www.zotero.org/styles/advances-in-complex-systems": "http://www.zotero.org/styles/advances-in-complex-systems",
		"http://www.zotero.org/styles/aging-cell": "http://www.zotero.org/styles/aging-cell",
		"http://www.zotero.org/styles/aids": "http://www.zotero.org/styles/aids",
		"http://www.zotero.org/styles/all": "http://www.zotero.org/styles/all",
		"http://www.zotero.org/styles/alternatives-to-animal-experimentation": "http://www.zotero.org/styles/alternatives-to-animal-experimentation",
		"http://www.zotero.org/styles/american-anthropological-association": "http://www.zotero.org/styles/american-anthropological-association",
		"http://www.zotero.org/styles/american-antiquity": "http://www.zotero.org/styles/american-antiquity",
		"http://www.zotero.org/styles/american-association-for-cancer-research": "http://www.zotero.org/styles/american-association-for-cancer-research",
		"http://www.zotero.org/styles/american-association-of-petroleum-geologists": "http://www.zotero.org/styles/american-association-of-petroleum-geologists",
		"http://www.zotero.org/styles/american-chemical-society-with-titles-brackets": "http://www.zotero.org/styles/american-chemical-society-with-titles-brackets",
		"http://www.zotero.org/styles/american-chemical-society-with-titles": "http://www.zotero.org/styles/american-chemical-society-with-titles",
		"http://www.zotero.org/styles/american-chemical-society": "http://www.zotero.org/styles/american-chemical-society",
		"http://www.zotero.org/styles/american-geophysical-union": "http://www.zotero.org/styles/american-geophysical-union",
		"http://www.zotero.org/styles/american-heart-association": "http://www.zotero.org/styles/american-heart-association",
		"http://www.zotero.org/styles/american-institute-of-physics": "http://www.zotero.org/styles/american-institute-of-physics",
		"http://www.zotero.org/styles/american-journal-of-archaeology": "http://www.zotero.org/styles/american-journal-of-archaeology",
		"http://www.zotero.org/styles/american-journal-of-botany": "http://www.zotero.org/styles/american-journal-of-botany",
		"http://www.zotero.org/styles/american-journal-of-epidemiology": "http://www.zotero.org/styles/american-journal-of-epidemiology",
		"http://www.zotero.org/styles/american-journal-of-medical-genetics": "http://www.zotero.org/styles/american-journal-of-medical-genetics",
		"http://www.zotero.org/styles/american-journal-of-physical-anthropology": "http://www.zotero.org/styles/american-journal-of-physical-anthropology",
		"http://www.zotero.org/styles/american-journal-of-political-science": "http://www.zotero.org/styles/american-journal-of-political-science",
		"http://www.zotero.org/styles/american-medical-association-alphabetical": "http://www.zotero.org/styles/american-medical-association-alphabetical",
		"http://www.zotero.org/styles/american-medical-association-no-et-al": "http://www.zotero.org/styles/american-medical-association-no-et-al",
		"http://www.zotero.org/styles/american-medical-association-no-url": "http://www.zotero.org/styles/american-medical-association-no-url",
		"http://www.zotero.org/styles/american-medical-association": "http://www.zotero.org/styles/american-medical-association",
		"http://www.zotero.org/styles/american-meteorological-society": "http://www.zotero.org/styles/american-meteorological-society",
		"http://www.zotero.org/styles/american-physics-society": "http://www.zotero.org/styles/american-physics-society",
		"http://www.zotero.org/styles/american-physiological-society": "http://www.zotero.org/styles/american-physiological-society",
		"http://www.zotero.org/styles/american-phytopathological-society-numeric": "http://www.zotero.org/styles/american-phytopathological-society-numeric",
		"http://www.zotero.org/styles/american-phytopathological-society": "http://www.zotero.org/styles/american-phytopathological-society",
		"http://www.zotero.org/styles/american-society-for-microbiology": "http://www.zotero.org/styles/american-society-for-microbiology",
		"http://www.zotero.org/styles/american-society-of-civil-engineers": "http://www.zotero.org/styles/american-society-of-civil-engineers",
		"http://www.zotero.org/styles/american-society-of-mechanical-engineers": "http://www.zotero.org/styles/american-society-of-mechanical-engineers",
		"http://www.zotero.org/styles/amiens": "http://www.zotero.org/styles/amiens",
		"http://www.zotero.org/styles/analytica-chimica-acta": "http://www.zotero.org/styles/analytica-chimica-acta",
		"http://www.zotero.org/styles/anesthesia-and-analgesia": "http://www.zotero.org/styles/anesthesia-and-analgesia",
		"http://www.zotero.org/styles/angewandte-chemie": "http://www.zotero.org/styles/angewandte-chemie",
		"http://www.zotero.org/styles/animal-behaviour": "http://www.zotero.org/styles/animal-behaviour",
		"http://www.zotero.org/styles/annalen-des-naturhistorischen-museums-wien": "http://www.zotero.org/styles/annalen-des-naturhistorischen-museums-wien",
		"http://www.zotero.org/styles/annals-of-biomedical-engineering": "http://www.zotero.org/styles/annals-of-biomedical-engineering",
		"http://www.zotero.org/styles/annals-of-botany": "http://www.zotero.org/styles/annals-of-botany",
		"http://www.zotero.org/styles/annals-of-neurology": "http://www.zotero.org/styles/annals-of-neurology",
		"http://www.zotero.org/styles/annals-of-the-association-of-american-geographers": "http://www.zotero.org/styles/annals-of-the-association-of-american-geographers",
		"http://www.zotero.org/styles/annual-reviews-alphabetically": "http://www.zotero.org/styles/annual-reviews-alphabetically",
		"http://www.zotero.org/styles/annual-reviews-by-appearance": "http://www.zotero.org/styles/annual-reviews-by-appearance",
		"http://www.zotero.org/styles/antarctic-science": "http://www.zotero.org/styles/antarctic-science",
		"http://www.zotero.org/styles/antonie-van-leeuwenhoek": "http://www.zotero.org/styles/antonie-van-leeuwenhoek",
		"http://www.zotero.org/styles/apa": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/apa5th": "http://www.zotero.org/styles/apa5th",
		"http://www.zotero.org/styles/applied-spectroscopy": "http://www.zotero.org/styles/applied-spectroscopy",
		"http://www.zotero.org/styles/apsa": "http://www.zotero.org/styles/apsa",
		"http://www.zotero.org/styles/archives-of-physical-medicine-and-rehabilitation": "http://www.zotero.org/styles/archives-of-physical-medicine-and-rehabilitation",
		"http://www.zotero.org/styles/art-history": "http://www.zotero.org/styles/art-history",
		"http://www.zotero.org/styles/arzneimitteltherapie": "http://www.zotero.org/styles/arzneimitteltherapie",
		"http://www.zotero.org/styles/asa-cssa-sssa": "http://www.zotero.org/styles/asa-cssa-sssa",
		"http://www.zotero.org/styles/asa": "http://www.zotero.org/styles/asa",
		"http://www.zotero.org/styles/associacao-brasileira-de-normas-tecnicas-ufpr": "http://www.zotero.org/styles/associacao-brasileira-de-normas-tecnicas-ufpr",
		"http://www.zotero.org/styles/associacao-brasileira-de-normas-tecnicas": "http://www.zotero.org/styles/associacao-brasileira-de-normas-tecnicas",
		"http://www.zotero.org/styles/australian-historical-studies": "http://www.zotero.org/styles/australian-historical-studies",
		"http://www.zotero.org/styles/australian-journal-of-grape-and-wine-research": "http://www.zotero.org/styles/australian-journal-of-grape-and-wine-research",
		"http://www.zotero.org/styles/australian-legal": "http://www.zotero.org/styles/australian-legal",
		"http://www.zotero.org/styles/avian-pathology": "http://www.zotero.org/styles/avian-pathology",
		"http://www.zotero.org/styles/aviation-space-and-environmental-medicine": "http://www.zotero.org/styles/aviation-space-and-environmental-medicine",
		"http://www.zotero.org/styles/basic-and-applied-ecology": "http://www.zotero.org/styles/basic-and-applied-ecology",
		"http://www.zotero.org/styles/bba-biochimica-et-biophysica-acta": "http://www.zotero.org/styles/bba-biochimica-et-biophysica-acta",
		"http://www.zotero.org/styles/bibtex": "http://www.zotero.org/styles/bibtex",
		"http://www.zotero.org/styles/biochemistry": "http://www.zotero.org/styles/biochemistry",
		"http://www.zotero.org/styles/bioconjugate-chemistry": "http://www.zotero.org/styles/bioconjugate-chemistry",
		"http://www.zotero.org/styles/bioelectromagnetics": "http://www.zotero.org/styles/bioelectromagnetics",
		"http://www.zotero.org/styles/bioessays": "http://www.zotero.org/styles/bioessays",
		"http://www.zotero.org/styles/bioinformatics": "http://www.zotero.org/styles/bioinformatics",
		"http://www.zotero.org/styles/biological-psychiatry": "http://www.zotero.org/styles/biological-psychiatry",
		"http://www.zotero.org/styles/bioorganic-and-medicinal-chemistry-letters": "http://www.zotero.org/styles/bioorganic-and-medicinal-chemistry-letters",
		"http://www.zotero.org/styles/biophysical-journal": "http://www.zotero.org/styles/biophysical-journal",
		"http://www.zotero.org/styles/biotechnology-and-bioengineering": "http://www.zotero.org/styles/biotechnology-and-bioengineering",
		"http://www.zotero.org/styles/biotropica": "http://www.zotero.org/styles/biotropica",
		"http://www.zotero.org/styles/blank": "http://www.zotero.org/styles/blank",
		"http://www.zotero.org/styles/blood": "http://www.zotero.org/styles/blood",
		"http://www.zotero.org/styles/bluebook-inline": "http://www.zotero.org/styles/bluebook-inline",
		"http://www.zotero.org/styles/bluebook-law-review": "http://www.zotero.org/styles/bluebook-law-review",
		"http://www.zotero.org/styles/bluebook2": "http://www.zotero.org/styles/bluebook2",
		"http://www.zotero.org/styles/bmc-bioinformatics": "http://www.zotero.org/styles/bmc-bioinformatics",
		"http://www.zotero.org/styles/bmj": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/bone-marrow-transplantation": "http://www.zotero.org/styles/bone-marrow-transplantation",
		"http://www.zotero.org/styles/bone": "http://www.zotero.org/styles/bone",
		"http://www.zotero.org/styles/brain": "http://www.zotero.org/styles/brain",
		"http://www.zotero.org/styles/brazilian-journal-of-nature-conservation": "http://www.zotero.org/styles/brazilian-journal-of-nature-conservation",
		"http://www.zotero.org/styles/briefings-in-bioinformatics": "http://www.zotero.org/styles/briefings-in-bioinformatics",
		"http://www.zotero.org/styles/british-ecological-society": "http://www.zotero.org/styles/british-ecological-society",
		"http://www.zotero.org/styles/british-journal-of-haematology": "http://www.zotero.org/styles/british-journal-of-haematology",
		"http://www.zotero.org/styles/british-journal-of-political-science": "http://www.zotero.org/styles/british-journal-of-political-science",
		"http://www.zotero.org/styles/british-psychological-society": "http://www.zotero.org/styles/british-psychological-society",
		"http://www.zotero.org/styles/building-structure": "http://www.zotero.org/styles/building-structure",
		"http://www.zotero.org/styles/bulletin-de-la-societe-prehistorique-francaise": "http://www.zotero.org/styles/bulletin-de-la-societe-prehistorique-francaise",
		"http://www.zotero.org/styles/catholic-biblical-association": "http://www.zotero.org/styles/catholic-biblical-association",
		"http://www.zotero.org/styles/cell-calcium": "http://www.zotero.org/styles/cell-calcium",
		"http://www.zotero.org/styles/cell-numeric": "http://www.zotero.org/styles/cell-numeric",
		"http://www.zotero.org/styles/cell-transplantation": "http://www.zotero.org/styles/cell-transplantation",
		"http://www.zotero.org/styles/cell": "http://www.zotero.org/styles/cell",
		"http://www.zotero.org/styles/centaurus": "http://www.zotero.org/styles/centaurus",
		"http://www.zotero.org/styles/cerebral-cortex": "http://www.zotero.org/styles/cerebral-cortex",
		"http://www.zotero.org/styles/chemical-research-in-toxicology": "http://www.zotero.org/styles/chemical-research-in-toxicology",
		"http://www.zotero.org/styles/chest": "http://www.zotero.org/styles/chest",
		"http://www.zotero.org/styles/chicago-annotated-bibliography": "http://www.zotero.org/styles/chicago-annotated-bibliography",
		"http://www.zotero.org/styles/chicago-author-date-basque": "http://www.zotero.org/styles/chicago-author-date-basque",
		"http://www.zotero.org/styles/chicago-author-date-de": "http://www.zotero.org/styles/chicago-author-date-de",
		"http://www.zotero.org/styles/chicago-author-date": "http://www.zotero.org/styles/chicago-author-date",
		"http://www.zotero.org/styles/chicago-dated-note-biblio-no-ibid": "http://www.zotero.org/styles/chicago-dated-note-biblio-no-ibid",
		"http://www.zotero.org/styles/chicago-fullnote-bibliography-delimiter-fixes": "http://www.zotero.org/styles/chicago-fullnote-bibliography-delimiter-fixes",
		"http://www.zotero.org/styles/chicago-fullnote-bibliography-no-ibid-delimiter-fixes": "http://www.zotero.org/styles/chicago-fullnote-bibliography-no-ibid-delimiter-fixes",
		"http://www.zotero.org/styles/chicago-fullnote-bibliography-no-ibid": "http://www.zotero.org/styles/chicago-fullnote-bibliography-no-ibid",
		"http://www.zotero.org/styles/chicago-fullnote-bibliography": "http://www.zotero.org/styles/chicago-fullnote-bibliography",
		"http://www.zotero.org/styles/chicago-library-list": "http://www.zotero.org/styles/chicago-library-list",
		"http://www.zotero.org/styles/chicago-note-biblio-no-ibid": "http://www.zotero.org/styles/chicago-note-biblio-no-ibid",
		"http://www.zotero.org/styles/chicago-note-bibliography": "http://www.zotero.org/styles/chicago-note-bibliography",
		"http://www.zotero.org/styles/chicago-quick-copy": "http://www.zotero.org/styles/chicago-quick-copy",
		"http://www.zotero.org/styles/chinese-gb7714-1987-numeric": "http://www.zotero.org/styles/chinese-gb7714-1987-numeric",
		"http://www.zotero.org/styles/chinese-gb7714-2005-numeric": "http://www.zotero.org/styles/chinese-gb7714-2005-numeric",
		"http://www.zotero.org/styles/circulation": "http://www.zotero.org/styles/circulation",
		"http://www.zotero.org/styles/climatic-change": "http://www.zotero.org/styles/climatic-change",
		"http://www.zotero.org/styles/clinical-cancer-research": "http://www.zotero.org/styles/clinical-cancer-research",
		"http://www.zotero.org/styles/clinical-infectious-diseases": "http://www.zotero.org/styles/clinical-infectious-diseases",
		"http://www.zotero.org/styles/clinical-neurophysiology": "http://www.zotero.org/styles/clinical-neurophysiology",
		"http://www.zotero.org/styles/clinical-orthopaedics-and-related-research": "http://www.zotero.org/styles/clinical-orthopaedics-and-related-research",
		"http://www.zotero.org/styles/cns-and-neurological-disorders-drug-targets": "http://www.zotero.org/styles/cns-and-neurological-disorders-drug-targets",
		"http://www.zotero.org/styles/cold-spring-harbor-laboratory-press": "http://www.zotero.org/styles/cold-spring-harbor-laboratory-press",
		"http://www.zotero.org/styles/conservation-biology": "http://www.zotero.org/styles/conservation-biology",
		"http://www.zotero.org/styles/copernicus-publications": "http://www.zotero.org/styles/copernicus-publications",
		"http://www.zotero.org/styles/council-of-science-editors-author-date": "http://www.zotero.org/styles/council-of-science-editors-author-date",
		"http://www.zotero.org/styles/council-of-science-editors": "http://www.zotero.org/styles/council-of-science-editors",
		"http://www.zotero.org/styles/critical-care-medicine": "http://www.zotero.org/styles/critical-care-medicine",
		"http://www.zotero.org/styles/culture-medicine-and-psychiatry": "http://www.zotero.org/styles/culture-medicine-and-psychiatry",
		"http://www.zotero.org/styles/current-opinion": "http://www.zotero.org/styles/current-opinion",
		"http://www.zotero.org/styles/current-protocols": "http://www.zotero.org/styles/current-protocols",
		"http://www.zotero.org/styles/currents-in-biblical-research": "http://www.zotero.org/styles/currents-in-biblical-research",
		"http://www.zotero.org/styles/cytometry": "http://www.zotero.org/styles/cytometry",
		"http://www.zotero.org/styles/dendrochronologia": "http://www.zotero.org/styles/dendrochronologia",
		"http://www.zotero.org/styles/din-1505-2": "http://www.zotero.org/styles/din-1505-2",
		"http://www.zotero.org/styles/diplo": "http://www.zotero.org/styles/diplo",
		"http://www.zotero.org/styles/drug-and-alcohol-dependence": "http://www.zotero.org/styles/drug-and-alcohol-dependence",
		"http://www.zotero.org/styles/earth-surface-processes-and-landforms": "http://www.zotero.org/styles/earth-surface-processes-and-landforms",
		"http://www.zotero.org/styles/ecological-modelling": "http://www.zotero.org/styles/ecological-modelling",
		"http://www.zotero.org/styles/ecology-letters": "http://www.zotero.org/styles/ecology-letters",
		"http://www.zotero.org/styles/ecology": "http://www.zotero.org/styles/ecology",
		"http://www.zotero.org/styles/ecoscience": "http://www.zotero.org/styles/ecoscience",
		"http://www.zotero.org/styles/elsevier-harvard-without-titles": "http://www.zotero.org/styles/elsevier-harvard-without-titles",
		"http://www.zotero.org/styles/elsevier-harvard": "http://www.zotero.org/styles/elsevier-harvard",
		"http://www.zotero.org/styles/elsevier-radiological": "http://www.zotero.org/styles/elsevier-radiological",
		"http://www.zotero.org/styles/elsevier-vancouver": "http://www.zotero.org/styles/elsevier-vancouver",
		"http://www.zotero.org/styles/elsevier-with-titles": "http://www.zotero.org/styles/elsevier-with-titles",
		"http://www.zotero.org/styles/elsevier-without-titles": "http://www.zotero.org/styles/elsevier-without-titles",
		"http://www.zotero.org/styles/emerald-harvard": "http://www.zotero.org/styles/emerald-harvard",
		"http://www.zotero.org/styles/entomologia-experimentalis-et-applicata": "http://www.zotero.org/styles/entomologia-experimentalis-et-applicata",
		"http://www.zotero.org/styles/environmental-and-engineering-geoscience": "http://www.zotero.org/styles/environmental-and-engineering-geoscience",
		"http://www.zotero.org/styles/environmental-and-experimental-botany": "http://www.zotero.org/styles/environmental-and-experimental-botany",
		"http://www.zotero.org/styles/environmental-conservation": "http://www.zotero.org/styles/environmental-conservation",
		"http://www.zotero.org/styles/environmental-health-perspectives": "http://www.zotero.org/styles/environmental-health-perspectives",
		"http://www.zotero.org/styles/environmental-microbiology": "http://www.zotero.org/styles/environmental-microbiology",
		"http://www.zotero.org/styles/epidemiologie-et-sante-animale": "http://www.zotero.org/styles/epidemiologie-et-sante-animale",
		"http://www.zotero.org/styles/ergoscience": "http://www.zotero.org/styles/ergoscience",
		"http://www.zotero.org/styles/ethics-book-reviews": "http://www.zotero.org/styles/ethics-book-reviews",
		"http://www.zotero.org/styles/european-cells-and-materials": "http://www.zotero.org/styles/european-cells-and-materials",
		"http://www.zotero.org/styles/european-heart-journal": "http://www.zotero.org/styles/european-heart-journal",
		"http://www.zotero.org/styles/european-journal-of-neuroscience": "http://www.zotero.org/styles/european-journal-of-neuroscience",
		"http://www.zotero.org/styles/european-journal-of-ophthalmology": "http://www.zotero.org/styles/european-journal-of-ophthalmology",
		"http://www.zotero.org/styles/european-journal-of-soil-science": "http://www.zotero.org/styles/european-journal-of-soil-science",
		"http://www.zotero.org/styles/european-retail-research": "http://www.zotero.org/styles/european-retail-research",
		"http://www.zotero.org/styles/eye": "http://www.zotero.org/styles/eye",
		"http://www.zotero.org/styles/fachhochschule-vorarlberg": "http://www.zotero.org/styles/fachhochschule-vorarlberg",
		"http://www.zotero.org/styles/febs-journal": "http://www.zotero.org/styles/febs-journal",
		"http://www.zotero.org/styles/fems": "http://www.zotero.org/styles/fems",
		"http://www.zotero.org/styles/fish-and-fisheries": "http://www.zotero.org/styles/fish-and-fisheries",
		"http://www.zotero.org/styles/french1": "http://www.zotero.org/styles/french1",
		"http://www.zotero.org/styles/french2": "http://www.zotero.org/styles/french2",
		"http://www.zotero.org/styles/french3": "http://www.zotero.org/styles/french3",
		"http://www.zotero.org/styles/french4": "http://www.zotero.org/styles/french4",
		"http://www.zotero.org/styles/freshwater-biology": "http://www.zotero.org/styles/freshwater-biology",
		"http://www.zotero.org/styles/frontiers": "http://www.zotero.org/styles/frontiers",
		"http://www.zotero.org/styles/fungal-ecology": "http://www.zotero.org/styles/fungal-ecology",
		"http://www.zotero.org/styles/future-medicine-journals": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/gastroenterology": "http://www.zotero.org/styles/gastroenterology",
		"http://www.zotero.org/styles/genetics": "http://www.zotero.org/styles/genetics",
		"http://www.zotero.org/styles/genome-biology-and-evolution": "http://www.zotero.org/styles/genome-biology-and-evolution",
		"http://www.zotero.org/styles/genome-biology": "http://www.zotero.org/styles/genome-biology",
		"http://www.zotero.org/styles/geoderma": "http://www.zotero.org/styles/geoderma",
		"http://www.zotero.org/styles/geological-magazine": "http://www.zotero.org/styles/geological-magazine",
		"http://www.zotero.org/styles/geological-society-of-america": "http://www.zotero.org/styles/geological-society-of-america",
		"http://www.zotero.org/styles/geomorphology": "http://www.zotero.org/styles/geomorphology",
		"http://www.zotero.org/styles/geopolitics": "http://www.zotero.org/styles/geopolitics",
		"http://www.zotero.org/styles/global-ecology-and-biogeography": "http://www.zotero.org/styles/global-ecology-and-biogeography",
		"http://www.zotero.org/styles/gost-r-7-0-5-2008-csl-1-0": "http://www.zotero.org/styles/gost-r-7-0-5-2008-csl-1-0",
		"http://www.zotero.org/styles/gost-r-7-0-5-2008-numeric": "http://www.zotero.org/styles/gost-r-7-0-5-2008-numeric",
		"http://www.zotero.org/styles/gost-r-7-0-5-2008": "http://www.zotero.org/styles/gost-r-7-0-5-2008",
		"http://www.zotero.org/styles/graefes-archive-clinical-and-experimental-ophthalmology": "http://www.zotero.org/styles/graefes-archive-clinical-and-experimental-ophthalmology",
		"http://www.zotero.org/styles/harvard-anglia-ruskin": "http://www.zotero.org/styles/harvard-anglia-ruskin",
		"http://www.zotero.org/styles/harvard-cardiff-university": "http://www.zotero.org/styles/harvard-cardiff-university",
		"http://www.zotero.org/styles/harvard-european-archaeology": "http://www.zotero.org/styles/harvard-european-archaeology",
		"http://www.zotero.org/styles/harvard-imperial-college-london": "http://www.zotero.org/styles/harvard-imperial-college-london",
		"http://www.zotero.org/styles/harvard-institut-fur-praxisforschung-de": "http://www.zotero.org/styles/harvard-institut-fur-praxisforschung-de",
		"http://www.zotero.org/styles/harvard-kings-college-london": "http://www.zotero.org/styles/harvard-kings-college-london",
		"http://www.zotero.org/styles/harvard-leeds-metropolitan-university": "http://www.zotero.org/styles/harvard-leeds-metropolitan-university",
		"http://www.zotero.org/styles/harvard-limerick": "http://www.zotero.org/styles/harvard-limerick",
		"http://www.zotero.org/styles/harvard-manchester-business-school": "http://www.zotero.org/styles/harvard-manchester-business-school",
		"http://www.zotero.org/styles/harvard-sheffield": "http://www.zotero.org/styles/harvard-sheffield",
		"http://www.zotero.org/styles/harvard-sheffield1": "http://www.zotero.org/styles/harvard-sheffield1",
		"http://www.zotero.org/styles/harvard-staffordshire-university": "http://www.zotero.org/styles/harvard-staffordshire-university",
		"http://www.zotero.org/styles/harvard-university-of-leeds": "http://www.zotero.org/styles/harvard-university-of-leeds",
		"http://www.zotero.org/styles/harvard-university-of-sunderland": "http://www.zotero.org/styles/harvard-university-of-sunderland",
		"http://www.zotero.org/styles/harvard-university-of-the-west-of-england": "http://www.zotero.org/styles/harvard-university-of-the-west-of-england",
		"http://www.zotero.org/styles/harvard-university-of-wolverhampton": "http://www.zotero.org/styles/harvard-university-of-wolverhampton",
		"http://www.zotero.org/styles/harvard1-unisa-gbfe": "http://www.zotero.org/styles/harvard1-unisa-gbfe",
		"http://www.zotero.org/styles/harvard1": "http://www.zotero.org/styles/harvard1",
		"http://www.zotero.org/styles/harvard1de": "http://www.zotero.org/styles/harvard1de",
		"http://www.zotero.org/styles/harvard3": "http://www.zotero.org/styles/harvard3",
		"http://www.zotero.org/styles/harvard7de": "http://www.zotero.org/styles/harvard7de",
		"http://www.zotero.org/styles/hawaii-international-conference-on-system-sciences-proceedings": "http://www.zotero.org/styles/hawaii-international-conference-on-system-sciences-proceedings",
		"http://www.zotero.org/styles/health-services-research": "http://www.zotero.org/styles/health-services-research",
		"http://www.zotero.org/styles/hepatology": "http://www.zotero.org/styles/hepatology",
		"http://www.zotero.org/styles/heredity": "http://www.zotero.org/styles/heredity",
		"http://www.zotero.org/styles/history-and-theory": "http://www.zotero.org/styles/history-and-theory",
		"http://www.zotero.org/styles/history-of-the-human-sciences": "http://www.zotero.org/styles/history-of-the-human-sciences",
		"http://www.zotero.org/styles/hong-kong-journal-of-radiology": "http://www.zotero.org/styles/hong-kong-journal-of-radiology",
		"http://www.zotero.org/styles/hormone-and-metabolic-research": "http://www.zotero.org/styles/hormone-and-metabolic-research",
		"http://www.zotero.org/styles/human-resource-management-journal": "http://www.zotero.org/styles/human-resource-management-journal",
		"http://www.zotero.org/styles/hwr-berlin": "http://www.zotero.org/styles/hwr-berlin",
		"http://www.zotero.org/styles/hydrogeology-journal": "http://www.zotero.org/styles/hydrogeology-journal",
		"http://www.zotero.org/styles/hydrological-sciences-journal": "http://www.zotero.org/styles/hydrological-sciences-journal",
		"http://www.zotero.org/styles/hypotheses-in-the-life-sciences": "http://www.zotero.org/styles/hypotheses-in-the-life-sciences",
		"http://www.zotero.org/styles/ieee-w-url": "http://www.zotero.org/styles/ieee-w-url",
		"http://www.zotero.org/styles/ieee": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/inflammatory-bowel-diseases": "http://www.zotero.org/styles/inflammatory-bowel-diseases",
		"http://www.zotero.org/styles/information-communication-and-society": "http://www.zotero.org/styles/information-communication-and-society",
		"http://www.zotero.org/styles/institute-of-physics-harvard": "http://www.zotero.org/styles/institute-of-physics-harvard",
		"http://www.zotero.org/styles/institute-of-physics-numeric": "http://www.zotero.org/styles/institute-of-physics-numeric",
		"http://www.zotero.org/styles/inter-research-science-center": "http://www.zotero.org/styles/inter-research-science-center",
		"http://www.zotero.org/styles/inter-ro": "http://www.zotero.org/styles/inter-ro",
		"http://www.zotero.org/styles/international-journal-of-audiology": "http://www.zotero.org/styles/international-journal-of-audiology",
		"http://www.zotero.org/styles/international-journal-of-cancer": "http://www.zotero.org/styles/international-journal-of-cancer",
		"http://www.zotero.org/styles/international-journal-of-exercise-science": "http://www.zotero.org/styles/international-journal-of-exercise-science",
		"http://www.zotero.org/styles/international-journal-of-hydrogen-energy": "http://www.zotero.org/styles/international-journal-of-hydrogen-energy",
		"http://www.zotero.org/styles/international-journal-of-production-economics": "http://www.zotero.org/styles/international-journal-of-production-economics",
		"http://www.zotero.org/styles/international-journal-of-radiation-oncology-biology-physics": "http://www.zotero.org/styles/international-journal-of-radiation-oncology-biology-physics",
		"http://www.zotero.org/styles/international-journal-of-solids-and-structures": "http://www.zotero.org/styles/international-journal-of-solids-and-structures",
		"http://www.zotero.org/styles/international-organization": "http://www.zotero.org/styles/international-organization",
		"http://www.zotero.org/styles/international-pig-veterinary-society-congress-proceedings": "http://www.zotero.org/styles/international-pig-veterinary-society-congress-proceedings",
		"http://www.zotero.org/styles/international-studies-association": "http://www.zotero.org/styles/international-studies-association",
		"http://www.zotero.org/styles/investigative-radiology": "http://www.zotero.org/styles/investigative-radiology",
		"http://www.zotero.org/styles/invisu": "http://www.zotero.org/styles/invisu",
		"http://www.zotero.org/styles/irish-historical-studies": "http://www.zotero.org/styles/irish-historical-studies",
		"http://www.zotero.org/styles/iso690-author-date-en": "http://www.zotero.org/styles/iso690-author-date-en",
		"http://www.zotero.org/styles/iso690-author-date-fr": "http://www.zotero.org/styles/iso690-author-date-fr",
		"http://www.zotero.org/styles/iso690-author-date": "http://www.zotero.org/styles/iso690-author-date",
		"http://www.zotero.org/styles/iso690-numeric-en": "http://www.zotero.org/styles/iso690-numeric-en",
		"http://www.zotero.org/styles/iso690-numeric-fr": "http://www.zotero.org/styles/iso690-numeric-fr",
		"http://www.zotero.org/styles/iso690-numeric-sk": "http://www.zotero.org/styles/iso690-numeric-sk",
		"http://www.zotero.org/styles/javnost-the-public": "http://www.zotero.org/styles/javnost-the-public",
		"http://www.zotero.org/styles/journal-of-agricultural-and-food-chemistry": "http://www.zotero.org/styles/journal-of-agricultural-and-food-chemistry",
		"http://www.zotero.org/styles/journal-of-alzheimers-disease": "http://www.zotero.org/styles/journal-of-alzheimers-disease",
		"http://www.zotero.org/styles/journal-of-applied-animal-science": "http://www.zotero.org/styles/journal-of-applied-animal-science",
		"http://www.zotero.org/styles/journal-of-applied-ecology": "http://www.zotero.org/styles/journal-of-applied-ecology",
		"http://www.zotero.org/styles/journal-of-biological-chemistry": "http://www.zotero.org/styles/journal-of-biological-chemistry",
		"http://www.zotero.org/styles/journal-of-biomolecular-structure-and-dynamics": "http://www.zotero.org/styles/journal-of-biomolecular-structure-and-dynamics",
		"http://www.zotero.org/styles/journal-of-chemical-ecology": "http://www.zotero.org/styles/journal-of-chemical-ecology",
		"http://www.zotero.org/styles/journal-of-clinical-investigation": "http://www.zotero.org/styles/journal-of-clinical-investigation",
		"http://www.zotero.org/styles/journal-of-clinical-oncology": "http://www.zotero.org/styles/journal-of-clinical-oncology",
		"http://www.zotero.org/styles/journal-of-community-health": "http://www.zotero.org/styles/journal-of-community-health",
		"http://www.zotero.org/styles/journal-of-dental-research": "http://www.zotero.org/styles/journal-of-dental-research",
		"http://www.zotero.org/styles/journal-of-elections-public-opinion-and-parties": "http://www.zotero.org/styles/journal-of-elections-public-opinion-and-parties",
		"http://www.zotero.org/styles/journal-of-evolutionary-biology": "http://www.zotero.org/styles/journal-of-evolutionary-biology",
		"http://www.zotero.org/styles/journal-of-field-ornithology": "http://www.zotero.org/styles/journal-of-field-ornithology",
		"http://www.zotero.org/styles/journal-of-fish-diseases": "http://www.zotero.org/styles/journal-of-fish-diseases",
		"http://www.zotero.org/styles/journal-of-food-protection": "http://www.zotero.org/styles/journal-of-food-protection",
		"http://www.zotero.org/styles/journal-of-forensic-sciences": "http://www.zotero.org/styles/journal-of-forensic-sciences",
		"http://www.zotero.org/styles/journal-of-geography-in-higher-education": "http://www.zotero.org/styles/journal-of-geography-in-higher-education",
		"http://www.zotero.org/styles/journal-of-health-economics": "http://www.zotero.org/styles/journal-of-health-economics",
		"http://www.zotero.org/styles/journal-of-hellenic-studies": "http://www.zotero.org/styles/journal-of-hellenic-studies",
		"http://www.zotero.org/styles/journal-of-hepatology": "http://www.zotero.org/styles/journal-of-hepatology",
		"http://www.zotero.org/styles/journal-of-management-information-systems": "http://www.zotero.org/styles/journal-of-management-information-systems",
		"http://www.zotero.org/styles/journal-of-marketing": "http://www.zotero.org/styles/journal-of-marketing",
		"http://www.zotero.org/styles/journal-of-molecular-biology": "http://www.zotero.org/styles/journal-of-molecular-biology",
		"http://www.zotero.org/styles/journal-of-molecular-endocrinology": "http://www.zotero.org/styles/journal-of-molecular-endocrinology",
		"http://www.zotero.org/styles/journal-of-neurophysiology": "http://www.zotero.org/styles/journal-of-neurophysiology",
		"http://www.zotero.org/styles/journal-of-neurosurgery": "http://www.zotero.org/styles/journal-of-neurosurgery",
		"http://www.zotero.org/styles/journal-of-orthopaedic-trauma": "http://www.zotero.org/styles/journal-of-orthopaedic-trauma",
		"http://www.zotero.org/styles/journal-of-pollination-ecology": "http://www.zotero.org/styles/journal-of-pollination-ecology",
		"http://www.zotero.org/styles/journal-of-pragmatics": "http://www.zotero.org/styles/journal-of-pragmatics",
		"http://www.zotero.org/styles/journal-of-psychiatry-and-neuroscience": "http://www.zotero.org/styles/journal-of-psychiatry-and-neuroscience",
		"http://www.zotero.org/styles/journal-of-shoulder-and-elbow-surgery": "http://www.zotero.org/styles/journal-of-shoulder-and-elbow-surgery",
		"http://www.zotero.org/styles/journal-of-social-archaeology": "http://www.zotero.org/styles/journal-of-social-archaeology",
		"http://www.zotero.org/styles/journal-of-studies-on-alcohol-and-drugs": "http://www.zotero.org/styles/journal-of-studies-on-alcohol-and-drugs",
		"http://www.zotero.org/styles/journal-of-the-academy-of-nutrition-and-dietetics": "http://www.zotero.org/styles/journal-of-the-academy-of-nutrition-and-dietetics",
		"http://www.zotero.org/styles/journal-of-the-air-and-waste-management-association": "http://www.zotero.org/styles/journal-of-the-air-and-waste-management-association",
		"http://www.zotero.org/styles/journal-of-the-american-college-of-cardiology": "http://www.zotero.org/styles/journal-of-the-american-college-of-cardiology",
		"http://www.zotero.org/styles/journal-of-the-american-society-of-nephrology": "http://www.zotero.org/styles/journal-of-the-american-society-of-nephrology",
		"http://www.zotero.org/styles/journal-of-the-american-water-resources-association": "http://www.zotero.org/styles/journal-of-the-american-water-resources-association",
		"http://www.zotero.org/styles/journal-of-the-royal-anthropological-institute": "http://www.zotero.org/styles/journal-of-the-royal-anthropological-institute",
		"http://www.zotero.org/styles/journal-of-the-torrey-botanical-society": "http://www.zotero.org/styles/journal-of-the-torrey-botanical-society",
		"http://www.zotero.org/styles/journal-of-tropical-ecology": "http://www.zotero.org/styles/journal-of-tropical-ecology",
		"http://www.zotero.org/styles/journal-of-vertebrate-paleontology": "http://www.zotero.org/styles/journal-of-vertebrate-paleontology",
		"http://www.zotero.org/styles/journal-of-wildlife-diseases": "http://www.zotero.org/styles/journal-of-wildlife-diseases",
		"http://www.zotero.org/styles/journal-of-wildlife-management": "http://www.zotero.org/styles/journal-of-wildlife-management",
		"http://www.zotero.org/styles/journalistica": "http://www.zotero.org/styles/journalistica",
		"http://www.zotero.org/styles/juristische-zitierweise-deutsch": "http://www.zotero.org/styles/juristische-zitierweise-deutsch",
		"http://www.zotero.org/styles/karger-journals-author-date": "http://www.zotero.org/styles/karger-journals-author-date",
		"http://www.zotero.org/styles/karger-journals": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/knee-surgery-sports-traumatology-arthroscopy": "http://www.zotero.org/styles/knee-surgery-sports-traumatology-arthroscopy",
		"http://www.zotero.org/styles/kolner-zeitschrift-fur-soziologie-und-sozialpsychologie": "http://www.zotero.org/styles/kolner-zeitschrift-fur-soziologie-und-sozialpsychologie",
		"http://www.zotero.org/styles/kritische-ausgabe": "http://www.zotero.org/styles/kritische-ausgabe",
		"http://www.zotero.org/styles/lancet": "http://www.zotero.org/styles/lancet",
		"http://www.zotero.org/styles/language-in-society": "http://www.zotero.org/styles/language-in-society",
		"http://www.zotero.org/styles/language": "http://www.zotero.org/styles/language",
		"http://www.zotero.org/styles/law1-de": "http://www.zotero.org/styles/law1-de",
		"http://www.zotero.org/styles/les-journees-de-la-recherche-porcine": "http://www.zotero.org/styles/les-journees-de-la-recherche-porcine",
		"http://www.zotero.org/styles/lettres-et-sciences-humaines-fr": "http://www.zotero.org/styles/lettres-et-sciences-humaines-fr",
		"http://www.zotero.org/styles/leviathan": "http://www.zotero.org/styles/leviathan",
		"http://www.zotero.org/styles/lichenologist": "http://www.zotero.org/styles/lichenologist",
		"http://www.zotero.org/styles/limnology-and-oceanography": "http://www.zotero.org/styles/limnology-and-oceanography",
		"http://www.zotero.org/styles/lncs": "http://www.zotero.org/styles/lncs",
		"http://www.zotero.org/styles/lncs2": "http://www.zotero.org/styles/lncs2",
		"http://www.zotero.org/styles/mammal-review": "http://www.zotero.org/styles/mammal-review",
		"http://www.zotero.org/styles/manchester-university-press": "http://www.zotero.org/styles/manchester-university-press",
		"http://www.zotero.org/styles/marine-policy": "http://www.zotero.org/styles/marine-policy",
		"http://www.zotero.org/styles/mbio": "http://www.zotero.org/styles/mbio",
		"http://www.zotero.org/styles/mcgill-guide-v7": "http://www.zotero.org/styles/mcgill-guide-v7",
		"http://www.zotero.org/styles/mcgill-legal": "http://www.zotero.org/styles/mcgill-legal",
		"http://www.zotero.org/styles/mcrj7": "http://www.zotero.org/styles/mcrj7",
		"http://www.zotero.org/styles/medecine-sciences": "http://www.zotero.org/styles/medecine-sciences",
		"http://www.zotero.org/styles/media-culture-and-society": "http://www.zotero.org/styles/media-culture-and-society",
		"http://www.zotero.org/styles/medicine-and-science-in-sports-and-exercise": "http://www.zotero.org/styles/medicine-and-science-in-sports-and-exercise",
		"http://www.zotero.org/styles/metabolic-engineering": "http://www.zotero.org/styles/metabolic-engineering",
		"http://www.zotero.org/styles/metallurgical-and-materials-transactions": "http://www.zotero.org/styles/metallurgical-and-materials-transactions",
		"http://www.zotero.org/styles/meteoritics-and-planetary-science": "http://www.zotero.org/styles/meteoritics-and-planetary-science",
		"http://www.zotero.org/styles/methods-information-medicine": "http://www.zotero.org/styles/methods-information-medicine",
		"http://www.zotero.org/styles/mhra": "http://www.zotero.org/styles/mhra",
		"http://www.zotero.org/styles/microbial-ecology": "http://www.zotero.org/styles/microbial-ecology",
		"http://www.zotero.org/styles/microscopy-and-microanalysis": "http://www.zotero.org/styles/microscopy-and-microanalysis",
		"http://www.zotero.org/styles/mis-quarterly": "http://www.zotero.org/styles/mis-quarterly",
		"http://www.zotero.org/styles/mla-notes": "http://www.zotero.org/styles/mla-notes",
		"http://www.zotero.org/styles/mla-underline": "http://www.zotero.org/styles/mla-underline",
		"http://www.zotero.org/styles/mla-url": "http://www.zotero.org/styles/mla-url",
		"http://www.zotero.org/styles/mla": "http://www.zotero.org/styles/mla",
		"http://www.zotero.org/styles/molecular-biochemical-parasitology": "http://www.zotero.org/styles/molecular-biochemical-parasitology",
		"http://www.zotero.org/styles/molecular-biology-and-evolution": "http://www.zotero.org/styles/molecular-biology-and-evolution",
		"http://www.zotero.org/styles/mol-eco": "http://www.zotero.org/styles/mol-eco",
		"http://www.zotero.org/styles/molecular-psychiatry-letters": "http://www.zotero.org/styles/molecular-psychiatry-letters",
		"http://www.zotero.org/styles/molecular-psychiatry": "http://www.zotero.org/styles/molecular-psychiatry",
		"http://www.zotero.org/styles/molecular-therapy": "http://www.zotero.org/styles/molecular-therapy",
		"http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/multiple-sclerosis-journal": "http://www.zotero.org/styles/multiple-sclerosis-journal",
		"http://www.zotero.org/styles/nano-biomedicine-and-engineering": "http://www.zotero.org/styles/nano-biomedicine-and-engineering",
		"http://www.zotero.org/styles/nanotechnology": "http://www.zotero.org/styles/nanotechnology",
		"http://www.zotero.org/styles/national-archives-of-australia": "http://www.zotero.org/styles/national-archives-of-australia",
		"http://www.zotero.org/styles/national-library-of-medicine-grant": "http://www.zotero.org/styles/national-library-of-medicine-grant",
		"http://www.zotero.org/styles/nature-neuroscience-brief-communication": "http://www.zotero.org/styles/nature-neuroscience-brief-communication",
		"http://www.zotero.org/styles/nature-no-superscript": "http://www.zotero.org/styles/nature-no-superscript",
		"http://www.zotero.org/styles/nature": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/neuropsychologia": "http://www.zotero.org/styles/neuropsychologia",
		"http://www.zotero.org/styles/neuropsychopharmacology": "http://www.zotero.org/styles/neuropsychopharmacology",
		"http://www.zotero.org/styles/neuroreport": "http://www.zotero.org/styles/neuroreport",
		"http://www.zotero.org/styles/neuroscience-letters": "http://www.zotero.org/styles/neuroscience-letters",
		"http://www.zotero.org/styles/neuroscience-research": "http://www.zotero.org/styles/neuroscience-research",
		"http://www.zotero.org/styles/new-england-journal-of-medicine": "http://www.zotero.org/styles/new-england-journal-of-medicine",
		"http://www.zotero.org/styles/new-phytologist": "http://www.zotero.org/styles/new-phytologist",
		"http://www.zotero.org/styles/new-zealand-plant-protection": "http://www.zotero.org/styles/new-zealand-plant-protection",
		"http://www.zotero.org/styles/northeastern-naturalist": "http://www.zotero.org/styles/northeastern-naturalist",
		"http://www.zotero.org/styles/nucleic-acids-research": "http://www.zotero.org/styles/nucleic-acids-research",
		"http://www.zotero.org/styles/oecologia": "http://www.zotero.org/styles/oecologia",
		"http://www.zotero.org/styles/oikos": "http://www.zotero.org/styles/oikos",
		"http://www.zotero.org/styles/oncogene": "http://www.zotero.org/styles/oncogene",
		"http://www.zotero.org/styles/open-university-a251": "http://www.zotero.org/styles/open-university-a251",
		"http://www.zotero.org/styles/open-university-harvard": "http://www.zotero.org/styles/open-university-harvard",
		"http://www.zotero.org/styles/open-university-numeric": "http://www.zotero.org/styles/open-university-numeric",
		"http://www.zotero.org/styles/ophthalmology": "http://www.zotero.org/styles/ophthalmology",
		"http://www.zotero.org/styles/optical-society-of-america": "http://www.zotero.org/styles/optical-society-of-america",
		"http://www.zotero.org/styles/organic-geochemistry": "http://www.zotero.org/styles/organic-geochemistry",
		"http://www.zotero.org/styles/organization-science": "http://www.zotero.org/styles/organization-science",
		"http://www.zotero.org/styles/oryx": "http://www.zotero.org/styles/oryx",
		"http://www.zotero.org/styles/oscola-no-ibid": "http://www.zotero.org/styles/oscola-no-ibid",
		"http://www.zotero.org/styles/oscola": "http://www.zotero.org/styles/oscola",
		"http://www.zotero.org/styles/osterreichische-zeitschrift-fur-politikwissenschaft": "http://www.zotero.org/styles/osterreichische-zeitschrift-fur-politikwissenschaft",
		"http://www.zotero.org/styles/oxford-art-journal": "http://www.zotero.org/styles/oxford-art-journal",
		"http://www.zotero.org/styles/padagogische-hochschule-heidelberg": "http://www.zotero.org/styles/padagogische-hochschule-heidelberg",
		"http://www.zotero.org/styles/palaeontologia-electronica": "http://www.zotero.org/styles/palaeontologia-electronica",
		"http://www.zotero.org/styles/palaeontology": "http://www.zotero.org/styles/palaeontology",
		"http://www.zotero.org/styles/pbsjournals-asbp": "http://www.zotero.org/styles/pbsjournals-asbp",
		"http://www.zotero.org/styles/pharmacoeconomics": "http://www.zotero.org/styles/pharmacoeconomics",
		"http://www.zotero.org/styles/plant-cell": "http://www.zotero.org/styles/plant-cell",
		"http://www.zotero.org/styles/plant-physiology": "http://www.zotero.org/styles/plant-physiology",
		"http://www.zotero.org/styles/plos": "http://www.zotero.org/styles/plos",
		"http://www.zotero.org/styles/pnas": "http://www.zotero.org/styles/pnas",
		"http://www.zotero.org/styles/political-studies": "http://www.zotero.org/styles/political-studies",
		"http://www.zotero.org/styles/politische-vierteljahresschrift": "http://www.zotero.org/styles/politische-vierteljahresschrift",
		"http://www.zotero.org/styles/pontifical-biblical-institute": "http://www.zotero.org/styles/pontifical-biblical-institute",
		"http://www.zotero.org/styles/proceedings-of-the-royal-society-b": "http://www.zotero.org/styles/proceedings-of-the-royal-society-b",
		"http://www.zotero.org/styles/protein-science": "http://www.zotero.org/styles/protein-science",
		"http://www.zotero.org/styles/proteomics": "http://www.zotero.org/styles/proteomics",
		"http://www.zotero.org/styles/psychiatry-and-clinical-neurosciences": "http://www.zotero.org/styles/psychiatry-and-clinical-neurosciences",
		"http://www.zotero.org/styles/public-health-nutrition": "http://www.zotero.org/styles/public-health-nutrition",
		"http://www.zotero.org/styles/radiopaedia": "http://www.zotero.org/styles/radiopaedia",
		"http://www.zotero.org/styles/research-policy": "http://www.zotero.org/styles/research-policy",
		"http://www.zotero.org/styles/resources-conservation-and-recycling": "http://www.zotero.org/styles/resources-conservation-and-recycling",
		"http://www.zotero.org/styles/revista-brasileira-de-botanica": "http://www.zotero.org/styles/revista-brasileira-de-botanica",
		"http://www.zotero.org/styles/revue-dhistoire-moderne-et-contemporaine": "http://www.zotero.org/styles/revue-dhistoire-moderne-et-contemporaine",
		"http://www.zotero.org/styles/rockefeller-university-press": "http://www.zotero.org/styles/rockefeller-university-press",
		"http://www.zotero.org/styles/romanian-humanities": "http://www.zotero.org/styles/romanian-humanities",
		"http://www.zotero.org/styles/rose-school": "http://www.zotero.org/styles/rose-school",
		"http://www.zotero.org/styles/royal-society-of-chemistry": "http://www.zotero.org/styles/royal-society-of-chemistry",
		"http://www.zotero.org/styles/rtf-scan": "http://www.zotero.org/styles/rtf-scan",
		"http://www.zotero.org/styles/sage-harvard": "http://www.zotero.org/styles/sage-harvard",
		"http://www.zotero.org/styles/sage-vancouver": "http://www.zotero.org/styles/sage-vancouver",
		"http://www.zotero.org/styles/sbl-fullnote-bibliography": "http://www.zotero.org/styles/sbl-fullnote-bibliography",
		"http://www.zotero.org/styles/scandinavian-political-studies": "http://www.zotero.org/styles/scandinavian-political-studies",
		"http://www.zotero.org/styles/science-of-the-total-environment": "http://www.zotero.org/styles/science-of-the-total-environment",
		"http://www.zotero.org/styles/science-translational-medicine": "http://www.zotero.org/styles/science-translational-medicine",
		"http://www.zotero.org/styles/science": "http://www.zotero.org/styles/science",
		"http://www.zotero.org/styles/sexual-development": "http://www.zotero.org/styles/sexual-development",
		"http://www.zotero.org/styles/small-wiley": "http://www.zotero.org/styles/small-wiley",
		"http://www.zotero.org/styles/social-science-and-medicine": "http://www.zotero.org/styles/social-science-and-medicine",
		"http://www.zotero.org/styles/social-studies-of-science": "http://www.zotero.org/styles/social-studies-of-science",
		"http://www.zotero.org/styles/sociedade-brasileira-de-computacao": "http://www.zotero.org/styles/sociedade-brasileira-de-computacao",
		"http://www.zotero.org/styles/societe-nationale-des-groupements-techniques-veterinaires": "http://www.zotero.org/styles/societe-nationale-des-groupements-techniques-veterinaires",
		"http://www.zotero.org/styles/society-for-american-archaeology": "http://www.zotero.org/styles/society-for-american-archaeology",
		"http://www.zotero.org/styles/society-for-general-microbiology": "http://www.zotero.org/styles/society-for-general-microbiology",
		"http://www.zotero.org/styles/society-for-historical-archaeology": "http://www.zotero.org/styles/society-for-historical-archaeology",
		"http://www.zotero.org/styles/socio-economic-review": "http://www.zotero.org/styles/socio-economic-review",
		"http://www.zotero.org/styles/spanish-legal": "http://www.zotero.org/styles/spanish-legal",
		"http://www.zotero.org/styles/spie-bios": "http://www.zotero.org/styles/spie-bios",
		"http://www.zotero.org/styles/spie-journals": "http://www.zotero.org/styles/spie-journals",
		"http://www.zotero.org/styles/spip-cite": "http://www.zotero.org/styles/spip-cite",
		"http://www.zotero.org/styles/springer-author-date": "http://www.zotero.org/styles/springer-author-date",
		"http://www.zotero.org/styles/springer-plasmonics": "http://www.zotero.org/styles/springer-plasmonics",
		"http://www.zotero.org/styles/springer-vancouver": "http://www.zotero.org/styles/springer-vancouver",
		"http://www.zotero.org/styles/standards-in-genomic-sciences": "http://www.zotero.org/styles/standards-in-genomic-sciences",
		"http://www.zotero.org/styles/stroke": "http://www.zotero.org/styles/stroke",
		"http://www.zotero.org/styles/surgical-neurology-international": "http://www.zotero.org/styles/surgical-neurology-international",
		"http://www.zotero.org/styles/tah-gkw": "http://www.zotero.org/styles/tah-gkw",
		"http://www.zotero.org/styles/tah-soz": "http://www.zotero.org/styles/tah-soz",
		"http://www.zotero.org/styles/taylor-and-francis-harvard-x": "http://www.zotero.org/styles/taylor-and-francis-harvard-x",
		"http://www.zotero.org/styles/tgm-wien-diplom": "http://www.zotero.org/styles/tgm-wien-diplom",
		"http://www.zotero.org/styles/the-academy-of-management-review": "http://www.zotero.org/styles/the-academy-of-management-review",
		"http://www.zotero.org/styles/the-accounting-review": "http://www.zotero.org/styles/the-accounting-review",
		"http://www.zotero.org/styles/the-american-journal-of-gastroenterology": "http://www.zotero.org/styles/the-american-journal-of-gastroenterology",
		"http://www.zotero.org/styles/the-american-journal-of-geriatric-pharmacotherapy": "http://www.zotero.org/styles/the-american-journal-of-geriatric-pharmacotherapy",
		"http://www.zotero.org/styles/the-american-journal-of-psychiatry": "http://www.zotero.org/styles/the-american-journal-of-psychiatry",
		"http://www.zotero.org/styles/the-british-journal-of-psychiatry": "http://www.zotero.org/styles/the-british-journal-of-psychiatry",
		"http://www.zotero.org/styles/the-british-journal-of-sociology": "http://www.zotero.org/styles/the-british-journal-of-sociology",
		"http://www.zotero.org/styles/the-embo-journal": "http://www.zotero.org/styles/the-embo-journal",
		"http://www.zotero.org/styles/the-historical-journal": "http://www.zotero.org/styles/the-historical-journal",
		"http://www.zotero.org/styles/the-holocene": "http://www.zotero.org/styles/the-holocene",
		"http://www.zotero.org/styles/the-isme-journal": "http://www.zotero.org/styles/the-isme-journal",
		"http://www.zotero.org/styles/the-journal-of-comparative-neurology": "http://www.zotero.org/styles/the-journal-of-comparative-neurology",
		"http://www.zotero.org/styles/the-journal-of-eukaryotic-microbiology": "http://www.zotero.org/styles/the-journal-of-eukaryotic-microbiology",
		"http://www.zotero.org/styles/the-journal-of-experimental-biology": "http://www.zotero.org/styles/the-journal-of-experimental-biology",
		"http://www.zotero.org/styles/the-journal-of-immunology": "http://www.zotero.org/styles/the-journal-of-immunology",
		"http://www.zotero.org/styles/the-journal-of-neuropsychiatry-and-clinical-neurosciences": "http://www.zotero.org/styles/the-journal-of-neuropsychiatry-and-clinical-neurosciences",
		"http://www.zotero.org/styles/the-journal-of-neuroscience": "http://www.zotero.org/styles/the-journal-of-neuroscience",
		"http://www.zotero.org/styles/the-journal-of-physiology": "http://www.zotero.org/styles/the-journal-of-physiology",
		"http://www.zotero.org/styles/the-journal-of-the-acoustical-society-of-america": "http://www.zotero.org/styles/the-journal-of-the-acoustical-society-of-america",
		"http://www.zotero.org/styles/the-journal-of-urology": "http://www.zotero.org/styles/the-journal-of-urology",
		"http://www.zotero.org/styles/the-neuroscientist": "http://www.zotero.org/styles/the-neuroscientist",
		"http://www.zotero.org/styles/the-oncologist": "http://www.zotero.org/styles/the-oncologist",
		"http://www.zotero.org/styles/the-pharmacogenomics-journal": "http://www.zotero.org/styles/the-pharmacogenomics-journal",
		"http://www.zotero.org/styles/the-plant-journal": "http://www.zotero.org/styles/the-plant-journal",
		"http://www.zotero.org/styles/theory-culture-and-society": "http://www.zotero.org/styles/theory-culture-and-society",
		"http://www.zotero.org/styles/toxicon": "http://www.zotero.org/styles/toxicon",
		"http://www.zotero.org/styles/traces": "http://www.zotero.org/styles/traces",
		"http://www.zotero.org/styles/traffic": "http://www.zotero.org/styles/traffic",
		"http://www.zotero.org/styles/trends-journal": "http://www.zotero.org/styles/trends-journal",
		"http://www.zotero.org/styles/tu-wien-dissertation": "http://www.zotero.org/styles/tu-wien-dissertation",
		"http://www.zotero.org/styles/turabian-fullnote-bibliography": "http://www.zotero.org/styles/turabian-fullnote-bibliography",
		"http://www.zotero.org/styles/un-eclac-cepal-english": "http://www.zotero.org/styles/un-eclac-cepal-english",
		"http://www.zotero.org/styles/un-eclac-cepal-spanish": "http://www.zotero.org/styles/un-eclac-cepal-spanish",
		"http://www.zotero.org/styles/unctad-english": "http://www.zotero.org/styles/unctad-english",
		"http://www.zotero.org/styles/unified-style-linguistics": "http://www.zotero.org/styles/unified-style-linguistics",
		"http://www.zotero.org/styles/unisa-harvard": "http://www.zotero.org/styles/unisa-harvard",
		"http://www.zotero.org/styles/unisa-harvard3": "http://www.zotero.org/styles/unisa-harvard3",
		"http://www.zotero.org/styles/universidad-evangelica-del-paraguay": "http://www.zotero.org/styles/universidad-evangelica-del-paraguay",
		"http://www.zotero.org/styles/universita-di-bologna-lettere": "http://www.zotero.org/styles/universita-di-bologna-lettere",
		"http://www.zotero.org/styles/universite-de-liege-histoire": "http://www.zotero.org/styles/universite-de-liege-histoire",
		"http://www.zotero.org/styles/universite-laval-com": "http://www.zotero.org/styles/universite-laval-com",
		"http://www.zotero.org/styles/university-of-melbourne": "http://www.zotero.org/styles/university-of-melbourne",
		"http://www.zotero.org/styles/urban-forestry-and-urban-greening": "http://www.zotero.org/styles/urban-forestry-and-urban-greening",
		"http://www.zotero.org/styles/urban-habitats": "http://www.zotero.org/styles/urban-habitats",
		"http://www.zotero.org/styles/urban-studies": "http://www.zotero.org/styles/urban-studies",
		"http://www.zotero.org/styles/us-geological-survey": "http://www.zotero.org/styles/us-geological-survey",
		"http://www.zotero.org/styles/user-modeling-and-useradapted-interaction": "http://www.zotero.org/styles/user-modeling-and-useradapted-interaction",
		"http://www.zotero.org/styles/vancouver-brackets": "http://www.zotero.org/styles/vancouver-brackets",
		"http://www.zotero.org/styles/vancouver-superscript-bracket-only-year": "http://www.zotero.org/styles/vancouver-superscript-bracket-only-year",
		"http://www.zotero.org/styles/vancouver-superscript": "http://www.zotero.org/styles/vancouver-superscript",
		"http://www.zotero.org/styles/vancouver": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/veterinary-medicine-austria": "http://www.zotero.org/styles/veterinary-medicine-austria",
		"http://www.zotero.org/styles/vienna-legal": "http://www.zotero.org/styles/vienna-legal",
		"http://www.zotero.org/styles/water-research": "http://www.zotero.org/styles/water-research",
		"http://www.zotero.org/styles/water-science-and-technology": "http://www.zotero.org/styles/water-science-and-technology",
		"http://www.zotero.org/styles/wceam2010": "http://www.zotero.org/styles/wceam2010",
		"http://www.zotero.org/styles/wetlands": "http://www.zotero.org/styles/wetlands",
		"http://www.zotero.org/styles/wheaton-college-phd-in-biblical-and-theological-studies": "http://www.zotero.org/styles/wheaton-college-phd-in-biblical-and-theological-studies",
		"http://www.zotero.org/styles/world-journal-of-biological-psychiatry": "http://www.zotero.org/styles/world-journal-of-biological-psychiatry",
		"http://www.zotero.org/styles/yeast": "http://www.zotero.org/styles/yeast",
		"http://www.zotero.org/styles/zeitschrift-fur-medienwissenschaft": "http://www.zotero.org/styles/zeitschrift-fur-medienwissenschaft",
		"http://www.zotero.org/styles/academic-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/academy-of-management-journal": "http://www.zotero.org/styles/the-academy-of-management-review",
		"http://www.zotero.org/styles/accounts-of-chemical-research": "http://www.zotero.org/styles/american-chemical-society-with-titles",
		"http://www.zotero.org/styles/acs-applied-materials-and-interfaces": "http://www.zotero.org/styles/american-chemical-society",
		"http://www.zotero.org/styles/acta-anatomica": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/acta-chirurgica-hellenica": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/acta-cytologica": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/acta-gastroenterologica-boliviana": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/acta-haematologica": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/acta-medica-colombiana": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/acta-medica-hellenica": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/acta-medica-scandinavica": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/acta-medica": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/acta-orthopaedica": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/acta-otorrinolaringologica-espanola": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/acta-paediatrica-japonica": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/acta-paediatrica-scandinavica": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/acta-pharmacologica-sinica": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/acta-tropica": "http://www.zotero.org/styles/elsevier-harvard",
		"http://www.zotero.org/styles/activox": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/acupuncture-in-medicine": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/acute-care": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/administrative-sciences": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/adolescent-and-pediatric-gynecology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/advances-physiology-education": "http://www.zotero.org/styles/american-physiological-society",
		"http://www.zotero.org/styles/aging-health": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/agricultural-and-forest-meteorology": "http://www.zotero.org/styles/elsevier-harvard",
		"http://www.zotero.org/styles/agriculture-ecosystems-environment": "http://www.zotero.org/styles/elsevier-harvard",
		"http://www.zotero.org/styles/agriculture": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/agronomy-journal": "http://www.zotero.org/styles/asa-cssa-sssa",
		"http://www.zotero.org/styles/agronomy": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/ajp-cell-physiology": "http://www.zotero.org/styles/american-physiological-society",
		"http://www.zotero.org/styles/ajp-endocrinology-and-metabolism": "http://www.zotero.org/styles/american-physiological-society",
		"http://www.zotero.org/styles/ajp-gastrointestinal-and-liver-physiology": "http://www.zotero.org/styles/american-physiological-society",
		"http://www.zotero.org/styles/ajp-heart-circulatory-physiology": "http://www.zotero.org/styles/american-physiological-society",
		"http://www.zotero.org/styles/ajp-lung-cellular-and-molecular-physiology": "http://www.zotero.org/styles/american-physiological-society",
		"http://www.zotero.org/styles/ajp-regulatory-integrative-comparative-physiology": "http://www.zotero.org/styles/american-physiological-society",
		"http://www.zotero.org/styles/ajp-renal-physiology": "http://www.zotero.org/styles/american-physiological-society",
		"http://www.zotero.org/styles/algorithms": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/american-educational-research-journal": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/american-family-physician": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/american-heart-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/american-journal-of-alzheimers-disease-and-other-dementias": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/american-journal-of-bioethics": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/american-journal-of-cardiology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/american-journal-of-cardiovascular-drugs": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/american-journal-of-chiropractic-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/american-journal-of-clinical-dermatology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/american-journal-of-clinical-nutrition": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/american-journal-of-clinical-research": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/american-journal-of-diseases-of-children": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/american-journal-of-emergency-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/american-journal-of-hospital-pharmacy": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/american-journal-of-human-genetics": "http://www.zotero.org/styles/cell",
		"http://www.zotero.org/styles/american-journal-of-hypertension": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/american-journal-of-infection-control": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/american-journal-of-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/american-journal-of-nephrology": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/american-journal-of-noninvasive-cardiology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/american-journal-of-obstetrics-and-gynecology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/american-journal-of-optometry-and-physiological-optics": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/american-journal-of-orthodontics-and-dentofacial-orthopedics": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/american-journal-of-orthopsychiatry": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/american-journal-of-pathology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/american-journal-of-public-health": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/american-journal-of-reproductive-immunology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/american-journal-of-roentgenology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/american-journal-of-sports-medicine": "http://www.zotero.org/styles/american-medical-association-alphabetical",
		"http://www.zotero.org/styles/american-journal-of-surgery": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/american-medical-writers-association": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/american-political-science-review": "http://www.zotero.org/styles/apsa",
		"http://www.zotero.org/styles/american-psychologist": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/american-review-of-respiratory-disease": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/american-sociological-review": "http://www.zotero.org/styles/asa",
		"http://www.zotero.org/styles/american-surgeon": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/amino-acids": "http://www.zotero.org/styles/springer-author-date",
		"http://www.zotero.org/styles/anaesthesia-and-intensive-care": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/anaesthesia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/anales-de-pediatria": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/analytical-chemistry": "http://www.zotero.org/styles/american-chemical-society",
		"http://www.zotero.org/styles/analytische-psychologie": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/animals": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/annales-de-dermatologie-et-de-venereologie": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/annales-nestle-english-ed": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/annals-academy-of-medicine-singapore": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/annals-of-allergy": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/annals-of-clinical-and-laboratory-science": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/annals-of-clinical-biochemistry": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/annals-of-emergency-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/annals-of-epidemiology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/annals-of-internal-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/annals-of-nutrition-and-metabolism": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/annals-of-otology-rhinology-and-laryngology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/annals-of-saudi-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/annals-of-surgery": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/annals-of-the-rheumatic-diseases": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/annals-of-the-royal-college-of-physicians-and-surgeons-of-canada": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/annals-of-the-royal-college-of-surgeons-of-england": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/annals-of-thoracic-surgery": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/annals-of-tropical-paediatrics": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/annual-review-of-analytical-chemistry": "http://www.zotero.org/styles/annual-reviews-by-appearance",
		"http://www.zotero.org/styles/annual-review-of-biomedical-engineering": "http://www.zotero.org/styles/annual-reviews-by-appearance",
		"http://www.zotero.org/styles/annual-review-of-biophysics": "http://www.zotero.org/styles/annual-reviews-alphabetically",
		"http://www.zotero.org/styles/annual-review-of-entomology": "http://www.zotero.org/styles/annual-reviews-alphabetically",
		"http://www.zotero.org/styles/annual-review-of-environment-and-resources": "http://www.zotero.org/styles/annual-reviews-by-appearance",
		"http://www.zotero.org/styles/annual-review-of-genetics": "http://www.zotero.org/styles/annual-reviews-alphabetically",
		"http://www.zotero.org/styles/annual-review-of-genomics-and-human-genetics": "http://www.zotero.org/styles/annual-reviews-alphabetically",
		"http://www.zotero.org/styles/annual-review-of-immunology": "http://www.zotero.org/styles/annual-reviews-by-appearance",
		"http://www.zotero.org/styles/annual-review-of-materials-research": "http://www.zotero.org/styles/annual-reviews-by-appearance",
		"http://www.zotero.org/styles/annual-review-of-medicine": "http://www.zotero.org/styles/annual-reviews-by-appearance",
		"http://www.zotero.org/styles/annual-review-of-microbiology": "http://www.zotero.org/styles/annual-reviews-alphabetically",
		"http://www.zotero.org/styles/annual-review-of-nutrition": "http://www.zotero.org/styles/annual-reviews-alphabetically",
		"http://www.zotero.org/styles/annual-review-of-pathology-mechanisms-of-disease": "http://www.zotero.org/styles/annual-reviews-by-appearance",
		"http://www.zotero.org/styles/annual-review-of-pharmacology-and-toxicology": "http://www.zotero.org/styles/annual-reviews-by-appearance",
		"http://www.zotero.org/styles/annual-review-of-physical-chemistry": "http://www.zotero.org/styles/annual-reviews-by-appearance",
		"http://www.zotero.org/styles/annual-review-of-physiology": "http://www.zotero.org/styles/annual-reviews-by-appearance",
		"http://www.zotero.org/styles/annual-review-of-phytopathology": "http://www.zotero.org/styles/annual-reviews-alphabetically",
		"http://www.zotero.org/styles/annual-review-of-plant-biology": "http://www.zotero.org/styles/annual-reviews-alphabetically",
		"http://www.zotero.org/styles/annual-review-of-public-health": "http://www.zotero.org/styles/annual-reviews-alphabetically",
		"http://www.zotero.org/styles/anthropod-structure-development": "http://www.zotero.org/styles/urban-forestry-and-urban-greening",
		"http://www.zotero.org/styles/antibiotics": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/antibodies": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/antimicrobial-agents-and-chemotherapy": "http://www.zotero.org/styles/american-society-for-microbiology",
		"http://www.zotero.org/styles/applied-and-environmental-microbiology": "http://www.zotero.org/styles/american-society-for-microbiology",
		"http://www.zotero.org/styles/applied-clay-science": "http://www.zotero.org/styles/elsevier-harvard",
		"http://www.zotero.org/styles/applied-mechanics-reviews": "http://www.zotero.org/styles/american-society-of-mechanical-engineers",
		"http://www.zotero.org/styles/applied-neurophysiology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/applied-pathology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/applied-physics-letters": "http://www.zotero.org/styles/american-institute-of-physics",
		"http://www.zotero.org/styles/applied-sciences": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/aquaculture-environment-interactions": "http://www.zotero.org/styles/inter-research-science-center",
		"http://www.zotero.org/styles/aquatic-biology": "http://www.zotero.org/styles/inter-research-science-center",
		"http://www.zotero.org/styles/aquatic-microbial-ecology": "http://www.zotero.org/styles/inter-research-science-center",
		"http://www.zotero.org/styles/archives-of-dermatology": "http://www.zotero.org/styles/american-medical-association",
		"http://www.zotero.org/styles/archives-of-disease-in-childhood": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/archives-of-facial-plastic-surgery": "http://www.zotero.org/styles/american-medical-association",
		"http://www.zotero.org/styles/archives-of-general-psychiatry": "http://www.zotero.org/styles/american-medical-association",
		"http://www.zotero.org/styles/archives-of-internal-medicine": "http://www.zotero.org/styles/american-medical-association",
		"http://www.zotero.org/styles/archives-of-neurology": "http://www.zotero.org/styles/american-medical-association",
		"http://www.zotero.org/styles/archives-of-ophthalmology": "http://www.zotero.org/styles/american-medical-association",
		"http://www.zotero.org/styles/archives-of-otolaryngology-head-and-neck-surgery": "http://www.zotero.org/styles/american-medical-association",
		"http://www.zotero.org/styles/archives-of-pathology-and-laboratory-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/archives-of-pediatrics-and-adolescent-medicine": "http://www.zotero.org/styles/american-medical-association",
		"http://www.zotero.org/styles/archives-of-surgery": "http://www.zotero.org/styles/american-medical-association",
		"http://www.zotero.org/styles/archivos-de-bronconeumologia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/archivos-de-investigacion-medica": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/archivos-de-medicina-interna": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/archivos-de-neurolbiologia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/archivos-del-instituto-de-cardiologia-de-mexico": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/arizona-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/arquivos-brasileiros-de-cardiologia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/arquivos-brasileiros-de-endocrinologia-e-metabologia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/arteriosclerosis-thrombosis-and-vascular-biology": "http://www.zotero.org/styles/american-medical-association-no-et-al",
		"http://www.zotero.org/styles/asaio-transactions": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/asia-pacific-journal-of-pharmacology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/asian-journal-of-andrology": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/asian-journal-of-ophthalmology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/asian-journal-of-oral-and-maxillofacial-surgery": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/atmosphere": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/audiology-and-neurotology-extra": "http://www.zotero.org/styles/karger-journals-author-date",
		"http://www.zotero.org/styles/audiology-and-neurotology": "http://www.zotero.org/styles/karger-journals-author-date",
		"http://www.zotero.org/styles/audiology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/australasian-journal-of-dermatology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/australasian-radiology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/australian-and-new-zealand-journal-of-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/australian-and-new-zealand-journal-of-ophthalmology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/australian-and-new-zealand-journal-of-surgery": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/australian-clinical-review": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/australian-family-physician": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/australian-journal-of-hospital-pharmacy": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/australian-journal-of-medical-herbalism": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/australian-journal-of-ophthalmology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/australian-journal-of-optometry": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/australian-journal-of-rural-health": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/australian-orthoptic-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/australian-paediatric-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/austrian-studies": "http://www.zotero.org/styles/mhra",
		"http://www.zotero.org/styles/axioms": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/bangladesh-paediatrics": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/bba-bioenergetics": "http://www.zotero.org/styles/bba-biochimica-et-biophysica-acta",
		"http://www.zotero.org/styles/bba-biomembranes": "http://www.zotero.org/styles/bba-biochimica-et-biophysica-acta",
		"http://www.zotero.org/styles/bba-gene-regulatory-mechanisms": "http://www.zotero.org/styles/bba-biochimica-et-biophysica-acta",
		"http://www.zotero.org/styles/bba-general-subjects": "http://www.zotero.org/styles/bba-biochimica-et-biophysica-acta",
		"http://www.zotero.org/styles/bba-molecular-and-cell-biology-of-lipids": "http://www.zotero.org/styles/bba-biochimica-et-biophysica-acta",
		"http://www.zotero.org/styles/bba-molecular-basis-of-disease": "http://www.zotero.org/styles/bba-biochimica-et-biophysica-acta",
		"http://www.zotero.org/styles/bba-molecular-cell-research": "http://www.zotero.org/styles/bba-biochimica-et-biophysica-acta",
		"http://www.zotero.org/styles/bba-proteins-and-proteomics": "http://www.zotero.org/styles/bba-biochimica-et-biophysica-acta",
		"http://www.zotero.org/styles/bba-reviews-on-cancer": "http://www.zotero.org/styles/bba-biochimica-et-biophysica-acta",
		"http://www.zotero.org/styles/behavioral-ecology": "http://www.zotero.org/styles/council-of-science-editors-author-date",
		"http://www.zotero.org/styles/behavioral-neuroscience": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/behavioral-sciences": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/bibliotek-for-laeger": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/bio-medical-reviews": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/bioanalysis": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/biochemical-and-biophysical-research-communications": "http://www.zotero.org/styles/elsevier-with-titles",
		"http://www.zotero.org/styles/biodrugs": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/biofuels": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/biogeochemistry": "http://www.zotero.org/styles/springer-author-date",
		"http://www.zotero.org/styles/biological-conservation": "http://www.zotero.org/styles/elsevier-harvard",
		"http://www.zotero.org/styles/biology-letters": "http://www.zotero.org/styles/proceedings-of-the-royal-society-b",
		"http://www.zotero.org/styles/biology-of-the-neonate": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/biology": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/biomacromolecules": "http://www.zotero.org/styles/american-chemical-society",
		"http://www.zotero.org/styles/biomarkers-in-medicine": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/biomass-and-bioenergy": "http://www.zotero.org/styles/elsevier-vancouver",
		"http://www.zotero.org/styles/biomedical-bulletin": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/biomedical-imaging-and-intervention-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/biomedical-research": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/biomicrofluidics": "http://www.zotero.org/styles/american-institute-of-physics",
		"http://www.zotero.org/styles/biomolecules": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/bioresource-technology": "http://www.zotero.org/styles/elsevier-harvard",
		"http://www.zotero.org/styles/biosensors-and-bioelectronics": "http://www.zotero.org/styles/elsevier-harvard-without-titles",
		"http://www.zotero.org/styles/biosensors": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/biotechnology-progress": "http://www.zotero.org/styles/american-chemical-society",
		"http://www.zotero.org/styles/blood-purification": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/blood-vessels": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/bmj-case-reports": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/bmj-open": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/bmj-supportive-palliative-care": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/boletin-de-la-asociacion-medica-de-puerto-rico": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/boletin-medico-del-hospital-infantil-de-mexico": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/bordeaux-medical": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/brain-and-development-english-language": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/brain-behavior-and-evolution": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/brain-dysfunction": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/brain-sciences": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/breast-care": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/british-dental-journal": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/british-heart-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/british-homoeopathic-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/british-journal-of-anaesthesia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/british-journal-of-biomedical-science": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/british-journal-of-cancer": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/british-journal-of-clinical-psychology": "http://www.zotero.org/styles/british-psychological-society",
		"http://www.zotero.org/styles/british-journal-of-clinical-research": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/british-journal-of-developmental-psychology": "http://www.zotero.org/styles/british-psychological-society",
		"http://www.zotero.org/styles/british-journal-of-educational-psychology": "http://www.zotero.org/styles/british-psychological-society",
		"http://www.zotero.org/styles/british-journal-of-health-psychology": "http://www.zotero.org/styles/british-psychological-society",
		"http://www.zotero.org/styles/british-journal-of-industrial-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/british-journal-of-mathematical-and-statistical-psychology": "http://www.zotero.org/styles/british-psychological-society",
		"http://www.zotero.org/styles/british-journal-of-medical-economics": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/british-journal-of-obstetrics-and-gynaecology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/british-journal-of-occupational-therapy": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/british-journal-of-ophthalmology": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/british-journal-of-pain": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/british-journal-of-pharmacology": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/british-journal-of-plastic-surgery": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/british-journal-of-psychology": "http://www.zotero.org/styles/british-psychological-society",
		"http://www.zotero.org/styles/british-journal-of-social-psychology": "http://www.zotero.org/styles/british-psychological-society",
		"http://www.zotero.org/styles/british-journal-of-sports-medicine": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/british-journal-of-surgery": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/british-medical-bulletin": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/british-medical-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/british-osteopathic-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/british-volume-of-the-journal-of-bone-and-joint-surgery": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/buildings": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/bulletin-of-the-american-meteorological-society": "http://www.zotero.org/styles/american-meteorological-society",
		"http://www.zotero.org/styles/bulletin-of-the-medical-library-association": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/bulletin-who": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/canada-journal-of-public-health": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/canadian-family-physician": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/canadian-journal-of-anaesthesia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/canadian-journal-of-behavioral-science": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/canadian-journal-of-comparative-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/canadian-journal-of-experimental-psychology": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/canadian-journal-of-hospital-pharmacy": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/canadian-journal-of-occupational-therapy": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/canadian-journal-of-ophthalmology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/canadian-journal-of-surgery": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/canadian-medical-association-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/canadian-pharmacists-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/canadian-psychology": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/canadian-society-of-clinical-chemists": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/canadian-veterinary-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/cancer-cell": "http://www.zotero.org/styles/cell",
		"http://www.zotero.org/styles/cancer-detection-and-prevention": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/cancer-epidemiology-biomarkers-prevention": "http://www.zotero.org/styles/american-association-for-cancer-research",
		"http://www.zotero.org/styles/cancer-gene-therapy": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/cancer-prevention-research": "http://www.zotero.org/styles/american-association-for-cancer-research",
		"http://www.zotero.org/styles/cancer-research": "http://www.zotero.org/styles/american-association-for-cancer-research",
		"http://www.zotero.org/styles/cancers": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/carbon-management": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/cardiology-cardiovascular-medicine": "http://www.zotero.org/styles/sage-vancouver",
		"http://www.zotero.org/styles/cardiology": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/cardiorenal-medicine": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/cardiovascular-pharmacology-and-therapeutics": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/cardiovascular-research": "http://www.zotero.org/styles/sage-vancouver",
		"http://www.zotero.org/styles/caries-research": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/case-reports-in-dermatology": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/case-reports-in-gastroenterology": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/case-reports-in-nephrology-and-urology": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/case-reports-in-neurology": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/case-reports-in-oncology": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/case-reports-in-ophthalmology": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/catalysts": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/catholic-biblical-quarterly": "http://www.zotero.org/styles/catholic-biblical-association",
		"http://www.zotero.org/styles/cell-death-and-differentiation": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/cell-host-and-microbe": "http://www.zotero.org/styles/cell",
		"http://www.zotero.org/styles/cell-metabolism": "http://www.zotero.org/styles/cell",
		"http://www.zotero.org/styles/cell-research": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/cell-stem-cell": "http://www.zotero.org/styles/cell",
		"http://www.zotero.org/styles/cells-tissues-organs": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/cells": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/cellular-physiology-and-biochemistry": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/central-african-journal-of-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/central-asian-survey": "http://www.zotero.org/styles/taylor-and-francis-harvard-x",
		"http://www.zotero.org/styles/cephalalgia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/cerebrovascular-diseases-extra": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/cerebrovascular-diseases": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/cervix-and-the-lower-female-genital-tract": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/ceylon-journal-of-medical-science": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/ceylon-medical-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/challenges": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/chaos": "http://www.zotero.org/styles/american-institute-of-physics",
		"http://www.zotero.org/styles/chemical-reviews": "http://www.zotero.org/styles/american-chemical-society",
		"http://www.zotero.org/styles/chemistry-and-biology": "http://www.zotero.org/styles/cell",
		"http://www.zotero.org/styles/chemistry-of-materials": "http://www.zotero.org/styles/american-chemical-society",
		"http://www.zotero.org/styles/chemotherapy": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/chicago-note-no-ibid": "http://www.zotero.org/styles/chicago-note-biblio-no-ibid",
		"http://www.zotero.org/styles/chicago-note": "http://www.zotero.org/styles/chicago-note-bibliography",
		"http://www.zotero.org/styles/chinese-journal-of-anesthesiology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-cardiovascular-disease": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-clinical-oncology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-dermatology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-digestion": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-endocrinology-and-metabolism": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-epidemiology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-experimental-surgery": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-geriatology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-hematology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-hospital-administration": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-industrial-hygiene-and-occupational-disease": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-infectious-diseases": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-internal-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-lung-cancer": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-medical-history": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-medical-laboratory-technology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-microbiology-and-immunology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-nephrology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-neurology-and-psychiatry": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-neurosurgery": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-nuclear-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-obstetrics-and-gynecology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-oncology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-ophthalmology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-organ-transplantation": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-orthopedics": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-otorhinolaryngology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-pain": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-pathology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-pediatric-surgery": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-pediatrics": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-physical-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-physical-therapy": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-plastic-surgery-and-burns": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-preventive-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-radiological-medicine-and-protection": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-radiology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-stomatology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-surgery": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-tuberculosis-and-respiratory-diseases": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-journal-of-urology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-language-edition-of-jama": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chinese-medical-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chiropractic-journal-of-australia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/chronic-diseases-in-canada": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/cirugia-y-cirujanos": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/cirujano-general": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/climacteric": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/climate-research": "http://www.zotero.org/styles/inter-research-science-center",
		"http://www.zotero.org/styles/clinica-chimica-acta": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/clinical-and-experimental-optometry": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/clinical-and-experimental-pharmacology-and-physiology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/clinical-and-investigative-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/clinical-and-vaccine-immunology": "http://www.zotero.org/styles/american-society-for-microbiology",
		"http://www.zotero.org/styles/clinical-biochemistry": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/clinical-biomechanics": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/clinical-chemistry": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/clinical-diabetes": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/clinical-drug-investigation": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/clinical-investigation": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/clinical-lipidology": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/clinical-microbiology-reviews": "http://www.zotero.org/styles/american-society-for-microbiology",
		"http://www.zotero.org/styles/clinical-nutrition": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/clinical-pediatrics": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/clinical-pharmacokinetics": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/clinical-pharmacology-and-therapeutics": "http://www.zotero.org/styles/nature-no-superscript",
		"http://www.zotero.org/styles/clinical-pharmacy": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/clinical-physiology-and-biochemistry": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/clinical-practice": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/clinical-preventive-dentistry": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/clinical-science": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/clinicians-research-digest": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/cns-drugs": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/coatings": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/college-of-physicians-and-surgeons-pakistan": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/colo-proctology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/colombia-medica": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/community-dentistry-and-oral-epidemiology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/community-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/complement": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/comprehensive-psychiatry": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/computational-materials-science": "http://www.zotero.org/styles/elsevier-with-titles",
		"http://www.zotero.org/styles/computers": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/consulting-psychology-journal-practice-and-research": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/contemporary-sociology-a-journal-of-reviews": "http://www.zotero.org/styles/asa",
		"http://www.zotero.org/styles/contexts": "http://www.zotero.org/styles/asa",
		"http://www.zotero.org/styles/cor-et-vasa": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/cornell-veternarian": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/coronary-artery-disease": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/corrosion-science": "http://www.zotero.org/styles/elsevier-with-titles",
		"http://www.zotero.org/styles/crop-science": "http://www.zotero.org/styles/asa-cssa-sssa",
		"http://www.zotero.org/styles/crystal-growth-and-design": "http://www.zotero.org/styles/american-chemical-society",
		"http://www.zotero.org/styles/crystals": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/cuadernos-del-hospital-de-clinicas": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/cultural-diversity-and-ethnic-minority-psychology": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/current-biology": "http://www.zotero.org/styles/cell-numeric",
		"http://www.zotero.org/styles/current-opinion-biotechnology": "http://www.zotero.org/styles/current-opinion",
		"http://www.zotero.org/styles/current-opinion-cell-biology": "http://www.zotero.org/styles/current-opinion",
		"http://www.zotero.org/styles/current-opinion-chemical-biology": "http://www.zotero.org/styles/current-opinion",
		"http://www.zotero.org/styles/current-opinion-environmental-sustainability": "http://www.zotero.org/styles/current-opinion",
		"http://www.zotero.org/styles/current-opinion-genetics-development": "http://www.zotero.org/styles/current-opinion",
		"http://www.zotero.org/styles/current-opinion-immunology": "http://www.zotero.org/styles/current-opinion",
		"http://www.zotero.org/styles/current-opinion-microbiology": "http://www.zotero.org/styles/current-opinion",
		"http://www.zotero.org/styles/current-opinion-neurobiology": "http://www.zotero.org/styles/current-opinion",
		"http://www.zotero.org/styles/current-opinion-pharmacology": "http://www.zotero.org/styles/current-opinion",
		"http://www.zotero.org/styles/current-opinion-plant-biology": "http://www.zotero.org/styles/current-opinion",
		"http://www.zotero.org/styles/current-opinion-structural-biology": "http://www.zotero.org/styles/current-opinion",
		"http://www.zotero.org/styles/current-urology": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/cytogenetic-and-genome-research": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/danish-dental-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/danish-medical-bulletin": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/das-arztliche-laboratorium": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/daseinsanalyse": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/dementia-and-geriatric-cognitive-disorders-extra": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/dementia-and-geriatric-cognitive-disorders": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/dental-abstracts": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/dental-teamwork": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/dentomaxillopfacial-radiology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/der-chirurg": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/dermatologica": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/dermatology": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/deutsches-arzteblatt": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/development": "http://www.zotero.org/styles/the-journal-of-experimental-biology",
		"http://www.zotero.org/styles/developmental-biology": "http://www.zotero.org/styles/elsevier-harvard",
		"http://www.zotero.org/styles/developmental-cell": "http://www.zotero.org/styles/cell",
		"http://www.zotero.org/styles/developmental-neuroscience": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/developmental-pharmacology-and-therapeutics": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/developmental-psychology": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/diabetes-care": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/diabetes-management": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/diabetes-vascular-disease-research": "http://www.zotero.org/styles/sage-vancouver",
		"http://www.zotero.org/styles/diabetes": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/diabetologia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/diagnostic-cytopathology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/diagnostics": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/digestion": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/digestive-diseases": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/digestive-surgery": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/disaster-management-and-response": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/disease-management-and-health-outcomes": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/disease-models-mechanisms": "http://www.zotero.org/styles/the-journal-of-experimental-biology",
		"http://www.zotero.org/styles/diseases-aquatic-organisms": "http://www.zotero.org/styles/inter-research-science-center",
		"http://www.zotero.org/styles/diseases-of-the-colon-and-rectum": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/diversity": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/dreaming": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/drug-intelligence-and-clinical-pharmacy": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/drug-safety": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/drugs-and-aging": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/drugs-in-r-and-d": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/drugs": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/earth-and-planetary-science-letters": "http://www.zotero.org/styles/elsevier-harvard",
		"http://www.zotero.org/styles/earth-interactions": "http://www.zotero.org/styles/american-meteorological-society",
		"http://www.zotero.org/styles/edizioni-minerva-medica": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/educacion-medica-superior": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/education": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/educational-evaluation-and-policy-analysis": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/educational-researcher": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/eighteenth-century-life": "http://www.zotero.org/styles/chicago-note-bibliography",
		"http://www.zotero.org/styles/electronics": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/embo-reports": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/emergency-medicine-journal": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/emotion": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/endangered-species-research": "http://www.zotero.org/styles/inter-research-science-center",
		"http://www.zotero.org/styles/endocrine-related-cancer": "http://www.zotero.org/styles/journal-of-molecular-endocrinology",
		"http://www.zotero.org/styles/energies": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/energy-and-fuels": "http://www.zotero.org/styles/american-chemical-society",
		"http://www.zotero.org/styles/enfermedades-infecciosas-y-microbiologia-clinica": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/entropy": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/environmental-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/environmental-science-and-policy": "http://www.zotero.org/styles/elsevier-harvard",
		"http://www.zotero.org/styles/environmental-science-and-technology": "http://www.zotero.org/styles/american-chemical-society-with-titles",
		"http://www.zotero.org/styles/enzyme": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/epigenomics": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/ethics-science-environmental-politics": "http://www.zotero.org/styles/inter-research-science-center",
		"http://www.zotero.org/styles/eukaryotic-cell": "http://www.zotero.org/styles/american-society-for-microbiology",
		"http://www.zotero.org/styles/european-addiction-research": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/european-journal-of-cancer-and-clinical-oncology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/european-journal-of-clinical-investigation": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/european-journal-of-clinical-nutrition": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/european-journal-of-clinical-research": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/european-journal-of-gastroenterology-and-hepatology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/european-journal-of-gerontology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/european-journal-of-human-genetics": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/european-journal-of-physical-medicine-and-rehabilitation": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/european-journal-of-rheumatology-and-inflammation": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/european-neurology": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/european-respiratory-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/european-surgical-research": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/european-thyroid-journal": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/european-urology": "http://www.zotero.org/styles/elsevier-vancouver",
		"http://www.zotero.org/styles/evidence-based-dentistry": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/evidence-based-medicine": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/evidence-based-mental-health": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/evidence-based-nursing": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/excel": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/experimental-and-clinical-immunogenetics": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/experimental-and-clinical-psychopharmacology": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/experimental-cell-biology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/experimental-physiology": "http://www.zotero.org/styles/the-journal-of-physiology",
		"http://www.zotero.org/styles/expert-review-of-anti-infective-therapy": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/expert-review-of-anticancer-therapy": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/expert-review-of-cardiovascular-therapy": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/expert-review-of-clinical-immunology": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/expert-review-of-clinical-pharmacology": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/expert-review-of-dermatology": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/expert-review-of-endocrinology-and-metabolism": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/expert-review-of-gastroenterology-and-hepatology": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/expert-review-of-hematology": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/expert-review-of-medical-devices": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/expert-review-of-molecular-diagnostics": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/expert-review-of-neurotherapeutics": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/expert-review-of-obstetrics-and-gynecology": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/expert-review-of-ophthalmology": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/expert-review-of-pharmacoeconomics-and-outcomes-research": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/expert-review-of-proteomics": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/expert-review-of-respiratory-medicine": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/expert-review-of-vaccines": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/families-systems-and-health": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/family-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/family-practice-research-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/farmacia-hospitalaria": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/fems-immunology-and-medical-microbiology": "http://www.zotero.org/styles/fems",
		"http://www.zotero.org/styles/fems-microbiology-ecology": "http://www.zotero.org/styles/fems",
		"http://www.zotero.org/styles/fems-microbiology-letters": "http://www.zotero.org/styles/fems",
		"http://www.zotero.org/styles/fems-microbiology-reviews": "http://www.zotero.org/styles/fems",
		"http://www.zotero.org/styles/fems-yeast-research": "http://www.zotero.org/styles/fems",
		"http://www.zotero.org/styles/fetal-diagnosis-and-therapy": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/fetal-therapy": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/finnish-medical-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/fitness-and-performance-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/focus-on-critical-care": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/folia-phoniatrica-et-logopaedica": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/folia-phoniatrica": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/folia-primatologica": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/folio-primatologica": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/food-science-and-technology-research": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/foreign-policy-analysis": "http://www.zotero.org/styles/international-studies-association",
		"http://www.zotero.org/styles/forest-ecology-and-management": "http://www.zotero.org/styles/elsevier-harvard",
		"http://www.zotero.org/styles/forests": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/french-historical-studies": "http://www.zotero.org/styles/chicago-note-bibliography",
		"http://www.zotero.org/styles/frontiers-in-endocrinology": "http://www.zotero.org/styles/frontiers",
		"http://www.zotero.org/styles/frontiers-in-genetics": "http://www.zotero.org/styles/frontiers",
		"http://www.zotero.org/styles/frontiers-in-immunology": "http://www.zotero.org/styles/frontiers",
		"http://www.zotero.org/styles/frontiers-in-microbiology": "http://www.zotero.org/styles/frontiers",
		"http://www.zotero.org/styles/frontiers-in-neurology": "http://www.zotero.org/styles/frontiers",
		"http://www.zotero.org/styles/frontiers-in-neuroscience": "http://www.zotero.org/styles/frontiers",
		"http://www.zotero.org/styles/frontiers-in-oncology": "http://www.zotero.org/styles/frontiers",
		"http://www.zotero.org/styles/frontiers-in-pharmacology": "http://www.zotero.org/styles/frontiers",
		"http://www.zotero.org/styles/frontiers-in-physiology": "http://www.zotero.org/styles/frontiers",
		"http://www.zotero.org/styles/frontiers-in-plant-science": "http://www.zotero.org/styles/frontiers",
		"http://www.zotero.org/styles/frontiers-in-psychiatry": "http://www.zotero.org/styles/frontiers",
		"http://www.zotero.org/styles/frontiers-in-psychology": "http://www.zotero.org/styles/frontiers",
		"http://www.zotero.org/styles/frontline-gastroenterology": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/functional-ecology": "http://www.zotero.org/styles/british-ecological-society",
		"http://www.zotero.org/styles/fungal-biology": "http://www.zotero.org/styles/fungal-ecology",
		"http://www.zotero.org/styles/future-cardiology": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/future-internet": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/future-medicinal-chemistry": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/future-microbiology": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/future-neurology": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/future-oncology": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/future-science": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/future-virology": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/gaceta-sanitaria": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/games": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/gastroenterologia-y-hepatologia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/gastrointestinal-endoscopy": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/gene-therapy": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/genes-and-development": "http://www.zotero.org/styles/cold-spring-harbor-laboratory-press",
		"http://www.zotero.org/styles/genes-and-immunity": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/genes": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/genome-research": "http://www.zotero.org/styles/cold-spring-harbor-laboratory-press",
		"http://www.zotero.org/styles/geological-society-america-bulletin": "http://www.zotero.org/styles/geological-society-of-america",
		"http://www.zotero.org/styles/geology": "http://www.zotero.org/styles/geological-society-of-america",
		"http://www.zotero.org/styles/geosciences": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/geosphere": "http://www.zotero.org/styles/geological-society-of-america",
		"http://www.zotero.org/styles/geriatric-cardiovascular-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/geriatrics": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/gerontology": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/group-dynamics-theory-research-and-practice": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/gsa-today": "http://www.zotero.org/styles/geological-society-of-america",
		"http://www.zotero.org/styles/gullet": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/gut": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/gynakologische-rundschau": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/gynecologic-and-obstetric-investigation": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/haematologica": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/haemostasis": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/harvard-educational-review": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/hawaii-medical-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/headache": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/health-economics-policy-and-law": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/health-psychology": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/health-trends": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/heart-and-lung-the-journal-of-critical-care": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/heart-asia": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/heart": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/hellenic-journal-of-cardiology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/helleniki-cheirougirke": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/helliniki-iatriki": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/hispanic-american-historical-review": "http://www.zotero.org/styles/chicago-note-bibliography",
		"http://www.zotero.org/styles/history-of-political-economy": "http://www.zotero.org/styles/chicago-note-bibliography",
		"http://www.zotero.org/styles/history-of-psychology": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/history-of-the-journal-nature": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/hiv-therapy": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/hong-kong-journal-of-ophthalmology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/hong-kong-journal-of-orthopaedic-surgery": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/hong-kong-journal-of-psychiatry": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/hong-kong-medical-technology-association-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/hormone-research-in-paediatrics": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/hormone-research": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/hospital-chronicles": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/hospital-pharmacy": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/huisarts-en-wetenschap": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/human-development": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/human-heredity": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/human-molecular-genetics": "http://www.zotero.org/styles/nucleic-acids-research",
		"http://www.zotero.org/styles/human-resources-for-health": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/humanities": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/hungarian-journal-of-obstetrics-and-gynecology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/hypertension-research": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/iatriki": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/ieee-advanced-packaging": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-aerospace-and-electronic-systems": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-antennas-and-propagation": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-antennas-and-wireless-propagation-letters": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-applied-superconductivity": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-audio-speech-and-language-processing": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-automatic-control": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-automation-science-and-engineering": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-biomedical-circuits-and-systems": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-biomedical-engineering": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-broadcasting": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-circuits-and-systems-for-video-technology": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-circuits-and-systems-i-regular-papers": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-circuits-and-systems-ii-express-briefs": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-communications-letters": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-communications-magazine": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-communications": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-components-and-packaging-technologies": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-computational-biology-and-bioinformatics": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-computer-aided-design-of-integrated-circuits-and-systems": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-computer-architecture-letters": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-computers": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-computing-in-science-and-engineering": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-consumer-electronics": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-control-systems-technology": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-dependable-and-secure-computing": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-device-and-materials-reliability": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-dielectrics-and-electrical-insulation": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-display-technology": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-education": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-electrical-and-computer-engineering-canadian": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-electromagnetic-compatibility": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-electron-device-letters": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-electron-devices": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-electronic-materials-tms": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-electronics-packaging-manufacturing": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-energy-conversion": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-engineering-management": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-evolutionary-computation": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-fuzzy-systems": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-geoscience-and-remote-sensing-letters": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-geoscience-and-remote-sensing": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-image-processing": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-industrial-electronics": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-industrial-informatics": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-industry-applications": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-information-forensics-and-security": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-information-technology-in-biomedicine": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-information-theory": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-instrumentation-and-measurement": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-intelligent-transportation-systems": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-knowledge-and-data-engineering": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-latin-america-transactions": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-lightwave-technology": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-magnetics": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-manufacturing-technology": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-mechatronics-asme-transactions-on": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-medical-imaging": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-microelectromechanical-systems": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-microwave-and-wireless-components-letters": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-microwave-theory-and-techniques": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-mobile-computing": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-multimedia": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-nanobioscience": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-nanotechnology": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-network-and-service-management": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-networking": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-neural-networks": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-neural-systems-and-rehabilitation-engineering": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-nuclear-science": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-oceanic-engineering": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-parallel-and-distributed-systems": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-pattern-analysis-and-machine-intelligence": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-photonics-technology-letters": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-plasma-science": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-power-delivery": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-power-electronics-letters": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-power-electronics": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-power-systems": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-professional-communication": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-project-safety-engineering": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-quantum-electronics": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-reliability": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-robotics": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-selected-areas-in-communications": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-selected-topics-in-quantum-electronics": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-selected-topics-in-signal-processing": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-semiconductor-manufacturing": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-sensors-journal": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-signal-processing-letters": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-signal-processing": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-software-engineering": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-solid-state-circuits": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-systems-journal": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-systems-man-and-cybernetics-part-a": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-systems-man-and-cybernetics-part-b": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-systems-man-and-cybernetics-part-c": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-ultrasonics-ferroelectrics-and-frequency-control": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-vehicular-technology": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-very-large-scale-integration-systems": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-visualization-and-computer-graphics": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/ieee-wireless-communications": "http://www.zotero.org/styles/ieee",
		"http://www.zotero.org/styles/imaging-in-medicine": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/immunity": "http://www.zotero.org/styles/cell",
		"http://www.zotero.org/styles/immunologica-research": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/immunology-and-cell-biology": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/immunotherapy": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/in-practice": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/indian-journal-for-practising-doctor": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/indian-journal-of-anaesthesia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/indian-journal-of-cancer": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/indian-journal-of-critical-care-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/indian-journal-of-dermatology-venereology-and-leprology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/indian-journal-of-dermatology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/indian-journal-of-gastroenterology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/indian-journal-of-human-genetics": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/indian-journal-of-medical-informatics": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/indian-journal-of-medical-microbiology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/indian-journal-of-medical-sciences": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/indian-journal-of-occupational-and-environmental-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/indian-journal-of-ophthalmology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/indian-journal-of-otolaryngology-and-head-and-neck-surgery": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/indian-journal-of-palliative-care": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/indian-journal-of-pharmacology": "http://www.zotero.org/styles/vancouver-superscript-bracket-only-year",
		"http://www.zotero.org/styles/indian-journal-of-plastic-surgery": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/indian-journal-of-surgery": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/indian-journal-of-urology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/indian-pacing-and-electrophysiology-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/industrial-and-engineering-chemistry-research": "http://www.zotero.org/styles/american-chemical-society",
		"http://www.zotero.org/styles/industrial-crops-and-products": "http://www.zotero.org/styles/elsevier-harvard",
		"http://www.zotero.org/styles/infection-and-immunity": "http://www.zotero.org/styles/american-society-for-microbiology",
		"http://www.zotero.org/styles/inflammopharmocology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/information": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/injury-prevention": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/innovate": "http://www.zotero.org/styles/chicago-author-date",
		"http://www.zotero.org/styles/inorganic-chemistry": "http://www.zotero.org/styles/american-chemical-society",
		"http://www.zotero.org/styles/insects": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/instituto-nacional-de-cardiologia-ignacio-chavez": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/international-archives-of-allergy-and-applied-immunology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/international-archives-of-allergy-and-immunology": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/international-disability-studies": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/international-journal-cross-cultural-management": "http://www.zotero.org/styles/sage-harvard",
		"http://www.zotero.org/styles/international-journal-of-biological-sciences": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/international-journal-of-biosocial-and-medical-research": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/international-journal-of-clinical-rheumatology": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/international-journal-of-environmental-research-and-public-health": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/international-journal-of-epidemiology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/international-journal-of-impotence-research": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/international-journal-of-integrative-biology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/international-journal-of-legal-medicine": "http://www.zotero.org/styles/springer-vancouver",
		"http://www.zotero.org/styles/international-journal-of-medical-sciences": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/international-journal-of-molecular-sciences": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/international-journal-of-nursing-practice": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/international-journal-of-obesity": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/international-journal-of-pediatric-nephrology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/international-journal-of-pharmacy-practice": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/international-journal-of-play-therapy": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/international-journal-of-psychiatry-in-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/international-journal-of-std-and-aids": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/international-journal-of-stress-management": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/international-journal-of-systematic-and-evolutionary-microbiology": "http://www.zotero.org/styles/society-for-general-microbiology",
		"http://www.zotero.org/styles/international-political-sociology": "http://www.zotero.org/styles/international-studies-association",
		"http://www.zotero.org/styles/international-studies-perspectives": "http://www.zotero.org/styles/international-studies-association",
		"http://www.zotero.org/styles/international-studies-quarterly": "http://www.zotero.org/styles/international-studies-association",
		"http://www.zotero.org/styles/international-studies-review": "http://www.zotero.org/styles/international-studies-association",
		"http://www.zotero.org/styles/international-surgery": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/interventional-cardiology": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/interviology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/intervirology": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/invasion-and-metastasis": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/iranian-journal-of-allergy-asthma-and-immunology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/iraqi-journal-of-veterinary-sciences": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/irish-journal-of-psychological-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/isprs-international-journal-of-geo-information": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/israel-journal-of-psychiatry-and-related-sciences": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/italian-journal-of-gastroenterology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/jid-symposium-proceedings": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/jnci-journal-of-the-national-cancer-institute": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/jornal-de-pediatria": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-klinische-monatsblatter-fur-augenheilkunde": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-abnormal-psychology": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/journal-of-allergy-and-clinical-immunology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-alloys-and-compounds": "http://www.zotero.org/styles/elsevier-without-titles",
		"http://www.zotero.org/styles/journal-of-animal-ecology": "http://www.zotero.org/styles/british-ecological-society",
		"http://www.zotero.org/styles/journal-of-applied-mechanics": "http://www.zotero.org/styles/american-society-of-mechanical-engineers",
		"http://www.zotero.org/styles/journal-of-applied-meteorology-and-climatology": "http://www.zotero.org/styles/american-meteorological-society",
		"http://www.zotero.org/styles/journal-of-applied-nutrition": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-applied-physics": "http://www.zotero.org/styles/american-institute-of-physics",
		"http://www.zotero.org/styles/journal-of-applied-physiology": "http://www.zotero.org/styles/american-physiological-society",
		"http://www.zotero.org/styles/journal-of-applied-psychology": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/journal-of-applied-remote-sensing": "http://www.zotero.org/styles/spie-journals",
		"http://www.zotero.org/styles/journal-of-archaeological-science": "http://www.zotero.org/styles/elsevier-harvard",
		"http://www.zotero.org/styles/journal-of-assisted-reproduction-and-genetics": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-atmospheric-and-oceanic-technology": "http://www.zotero.org/styles/american-meteorological-society",
		"http://www.zotero.org/styles/journal-of-bacteriology": "http://www.zotero.org/styles/american-society-for-microbiology",
		"http://www.zotero.org/styles/journal-of-biological-standardization": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-biomechanical-engineering": "http://www.zotero.org/styles/american-society-of-mechanical-engineers",
		"http://www.zotero.org/styles/journal-of-biomedical-optics": "http://www.zotero.org/styles/spie-journals",
		"http://www.zotero.org/styles/journal-of-biotechnology": "http://www.zotero.org/styles/elsevier-harvard",
		"http://www.zotero.org/styles/journal-of-cancer-research-and-therapeutics": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-cardiovascular-surgery": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-cell-biology": "http://www.zotero.org/styles/rockefeller-university-press",
		"http://www.zotero.org/styles/journal-of-cell-science": "http://www.zotero.org/styles/the-journal-of-experimental-biology",
		"http://www.zotero.org/styles/journal-of-cerebral-blood-flow-and-metabolism": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/journal-of-chemical-and-engineering-data": "http://www.zotero.org/styles/american-chemical-society",
		"http://www.zotero.org/styles/journal-of-chemical-information-and-modeling": "http://www.zotero.org/styles/american-chemical-society",
		"http://www.zotero.org/styles/journal-of-chemical-physics": "http://www.zotero.org/styles/american-institute-of-physics",
		"http://www.zotero.org/styles/journal-of-chemical-theory-and-computation": "http://www.zotero.org/styles/american-chemical-society",
		"http://www.zotero.org/styles/journal-of-chemotherapy": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-chronic-diseases": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-climate": "http://www.zotero.org/styles/american-meteorological-society",
		"http://www.zotero.org/styles/journal-of-clinical-endocrinology-and-metabolism": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-clinical-gastroenterology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-clinical-microbiology": "http://www.zotero.org/styles/american-society-for-microbiology",
		"http://www.zotero.org/styles/journal-of-clinical-pathology": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/journal-of-clinical-psychiatry": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-combinatorial-chemistry": "http://www.zotero.org/styles/american-chemical-society",
		"http://www.zotero.org/styles/journal-of-comparative-psychology": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/journal-of-computational-and-nonlinear-dynamics": "http://www.zotero.org/styles/american-society-of-mechanical-engineers",
		"http://www.zotero.org/styles/journal-of-consulting-and-clinical-psychology": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/journal-of-counseling-psychology": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/journal-of-dental-education": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-dentistry": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-diabetic-complications": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-diarrhoeal-disease-research": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-diversity-in-higher-education": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/journal-of-dynamic-systems-measurement-and-control": "http://www.zotero.org/styles/american-society-of-mechanical-engineers",
		"http://www.zotero.org/styles/journal-of-ecology": "http://www.zotero.org/styles/british-ecological-society",
		"http://www.zotero.org/styles/journal-of-educational-and-behavioral-statistics": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/journal-of-educational-evaluation-for-health-professions": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-educational-psychology": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/journal-of-electronic-imaging": "http://www.zotero.org/styles/spie-journals",
		"http://www.zotero.org/styles/journal-of-electronic-packaging": "http://www.zotero.org/styles/american-society-of-mechanical-engineers",
		"http://www.zotero.org/styles/journal-of-emergency-nursing": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-endocrinology": "http://www.zotero.org/styles/journal-of-molecular-endocrinology",
		"http://www.zotero.org/styles/journal-of-energy-resources-technology": "http://www.zotero.org/styles/american-society-of-mechanical-engineers",
		"http://www.zotero.org/styles/journal-of-engineering-for-gas-turbines-and-power": "http://www.zotero.org/styles/american-society-of-mechanical-engineers",
		"http://www.zotero.org/styles/journal-of-engineering-materials-and-technology": "http://www.zotero.org/styles/american-society-of-mechanical-engineers",
		"http://www.zotero.org/styles/journal-of-enterostomal-therapy": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-epidemiology-and-community-health": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-epidemiology-community-health": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/journal-of-experimental-and-clinical-assisted-reproduction": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-experimental-and-clinical-cancer-research": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-experimental-medicine": "http://www.zotero.org/styles/rockefeller-university-press",
		"http://www.zotero.org/styles/journal-of-experimental-psychology-animal-behavior-processes": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/journal-of-experimental-psychology-applied": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/journal-of-experimental-psychology-general": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/journal-of-experimental-psychology-human-perception-and-performance": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/journal-of-experimental-psychology-learning-memory-and-cognition": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/journal-of-exposure-science-and-environmental-epidemiology": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/journal-of-family-psychology": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/journal-of-fluids-engineering": "http://www.zotero.org/styles/american-society-of-mechanical-engineers",
		"http://www.zotero.org/styles/journal-of-fuel-cell-science-and-technology": "http://www.zotero.org/styles/american-society-of-mechanical-engineers",
		"http://www.zotero.org/styles/journal-of-functional-biomaterials": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/journal-of-gastroenterology-and-hepatology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-gastrointestinal-and-liver-diseases": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-general-internal-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-general-physiology": "http://www.zotero.org/styles/rockefeller-university-press",
		"http://www.zotero.org/styles/journal-of-general-virology": "http://www.zotero.org/styles/society-for-general-microbiology",
		"http://www.zotero.org/styles/journal-of-hand-surgery": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-hazardous-materials": "http://www.zotero.org/styles/elsevier-with-titles",
		"http://www.zotero.org/styles/journal-of-health-and-social-behavior": "http://www.zotero.org/styles/asa",
		"http://www.zotero.org/styles/journal-of-heart-and-lung-transplantation": "http://www.zotero.org/styles/annals-of-neurology",
		"http://www.zotero.org/styles/journal-of-heart-transplantation": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-hong-kong-medical-association": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-hong-kong-medical-technology-association": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-human-hypertension": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/journal-of-hydrometeorology": "http://www.zotero.org/styles/american-meteorological-society",
		"http://www.zotero.org/styles/journal-of-hypertension": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-indian-association-for-child-and-adolescent-mental-health": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-indian-association-of-pediatric-surgeons": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-indian-prosthodontic-society": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-innate-immunity": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/journal-of-internal-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-investigative-dermatology": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/journal-of-laboratory-and-clinical-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-low-power-electronics-and-applications": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/journal-of-magnetism-and-magnetic-materials": "http://www.zotero.org/styles/elsevier-without-titles",
		"http://www.zotero.org/styles/journal-of-manipulative-and-physiological-therapeutics": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-maternal-and-child-health": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-mathematical-physics": "http://www.zotero.org/styles/american-institute-of-physics",
		"http://www.zotero.org/styles/journal-of-medical-ethics": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/journal-of-medical-genetics": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/journal-of-medical-microbiology": "http://www.zotero.org/styles/society-for-general-microbiology",
		"http://www.zotero.org/styles/journal-of-medical-physics": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-medicinal-chemistry": "http://www.zotero.org/styles/american-chemical-society",
		"http://www.zotero.org/styles/journal-of-medieval-and-early-modern-studies": "http://www.zotero.org/styles/chicago-note-bibliography",
		"http://www.zotero.org/styles/journal-of-micro-nanolithography-mems-and-moems": "http://www.zotero.org/styles/spie-journals",
		"http://www.zotero.org/styles/journal-of-microbiology-immunology-and-infection": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-midwifery-and-womens-health": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-minimal-access-surgery": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-modern-history": "http://www.zotero.org/styles/chicago-note-bibliography",
		"http://www.zotero.org/styles/journal-of-molecular-microbiology-and-biotechnology": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/journal-of-nanophotonics": "http://www.zotero.org/styles/spie-journals",
		"http://www.zotero.org/styles/journal-of-natural-products": "http://www.zotero.org/styles/american-chemical-society",
		"http://www.zotero.org/styles/journal-of-neuro-interventional-surgery": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/journal-of-neurology-neurosurgery-and-psychiatry": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-neurooncology": "http://www.zotero.org/styles/vancouver-brackets",
		"http://www.zotero.org/styles/journal-of-neuropathology-and-experimental-neurology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-neuropsychology": "http://www.zotero.org/styles/british-psychological-society",
		"http://www.zotero.org/styles/journal-of-neurosurgery-pediatrics": "http://www.zotero.org/styles/journal-of-neurosurgery",
		"http://www.zotero.org/styles/journal-of-neurosurgery-spine": "http://www.zotero.org/styles/journal-of-neurosurgery",
		"http://www.zotero.org/styles/journal-of-neurovirology": "http://www.zotero.org/styles/springer-author-date",
		"http://www.zotero.org/styles/journal-of-nuclear-materials": "http://www.zotero.org/styles/elsevier-without-titles",
		"http://www.zotero.org/styles/journal-of-nuclear-medicine-technology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-nuclear-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-nurse-midwifery": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-nutrigenetics-and-nutrigenomics": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/journal-of-occupational-and-organizational-psychology": "http://www.zotero.org/styles/british-psychological-society",
		"http://www.zotero.org/styles/journal-of-occupational-health-psychology": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/journal-of-organic-chemistry": "http://www.zotero.org/styles/american-chemical-society",
		"http://www.zotero.org/styles/journal-of-paediatrics-and-child-health": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-palliative-care": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-pathology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-pediatric-nephrology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-pediatric-neurosciences": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-pediatrics": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-perinatology": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/journal-of-periodontology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-personality-and-social-psychology": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/journal-of-personalized-medicine": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/journal-of-pharmacology-and-pharmacotherapeutics": "http://www.zotero.org/styles/vancouver-superscript-bracket-only-year",
		"http://www.zotero.org/styles/journal-of-pharmacy-technology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-physical-and-chemical-reference-data": "http://www.zotero.org/styles/american-institute-of-physics",
		"http://www.zotero.org/styles/journal-of-physical-chemistry": "http://www.zotero.org/styles/american-chemical-society",
		"http://www.zotero.org/styles/journal-of-physical-oceanography": "http://www.zotero.org/styles/american-meteorological-society",
		"http://www.zotero.org/styles/journal-of-postgraduate-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-power-sources": "http://www.zotero.org/styles/elsevier-without-titles",
		"http://www.zotero.org/styles/journal-of-prosthetic-dentistry": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-proteome-research": "http://www.zotero.org/styles/american-chemical-society",
		"http://www.zotero.org/styles/journal-of-proteomics": "http://www.zotero.org/styles/elsevier-vancouver",
		"http://www.zotero.org/styles/journal-of-psychosomatic-research": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-psychotherapy-integration": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/journal-of-quality-in-clinical-practice": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-rehabilitation-research-and-development": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-rehabilitation": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-renewable-and-sustainable-energy": "http://www.zotero.org/styles/american-institute-of-physics",
		"http://www.zotero.org/styles/journal-of-research-in-science-teaching": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/journal-of-sensor-and-actuator-networks": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/journal-of-spirochetal-and-tick-borne-diseases": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-the-american-academy-of-dermatology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-the-american-academy-of-physician-assistants": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-the-american-board-of-family-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-the-american-chemical-society": "http://www.zotero.org/styles/american-chemical-society",
		"http://www.zotero.org/styles/journal-of-the-american-dental-association": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-the-american-medical-association": "http://www.zotero.org/styles/american-medical-association",
		"http://www.zotero.org/styles/journal-of-the-american-medical-informatics-association": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/journal-of-the-american-osteopathic-association": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-the-american-society-of-echocardiography": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-the-atmospheric-sciences": "http://www.zotero.org/styles/american-meteorological-society",
		"http://www.zotero.org/styles/journal-of-the-british-association-for-immediate-care": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-the-canadian-association-of-radiologists": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-the-canadian-chiropractic-association": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-the-danish-medical-association": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-the-egyptian-public-health-association": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-the-faculty-of-medicine-baghdad": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-the-faculty-of-medicine-selcuk-university": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-the-formosan-medical-association": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-the-indian-society-of-pedodontics-and-preventative-dentistry": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-the-institute-of-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-the-international-aids-society": "http://www.zotero.org/styles/bmc-bioinformatics",
		"http://www.zotero.org/styles/journal-of-the-irish-colleges-of-physicians-and-surgeons": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-the-kuwait-medical-association": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-the-national-medical-association": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-the-norwegian-medical-association": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-the-royal-army-medical-corps": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-the-royal-college-of-physicians-of-london": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-the-royal-college-of-surgeons-of-edinburgh": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-the-royal-naval-medical-service": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-the-royal-society-of-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-the-vivekananda-institute-of-medical-sciences": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-theoretical-and-philosophical-psychology": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/journal-of-thoracic-and-cardiovascular-surgery": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-vascular-research": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/journal-of-vascular-surgery": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/journal-of-virology": "http://www.zotero.org/styles/american-society-for-microbiology",
		"http://www.zotero.org/styles/kenya-veterinarian": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/kidney-and-blood-pressure-research": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/kidney-international": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/klinische-labor-clinical-laboratory": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/klinische-monatsblatter-fur-augenheilkunde": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/korean-journal-of-gynecologic-oncology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/la-prensa-medica-argentina": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/laboratory-investigation": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/lakartidningen": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/lancet-infectious-diseases": "http://www.zotero.org/styles/lancet",
		"http://www.zotero.org/styles/lancet-neurology": "http://www.zotero.org/styles/lancet",
		"http://www.zotero.org/styles/lancet-oncology": "http://www.zotero.org/styles/lancet",
		"http://www.zotero.org/styles/langmuir": "http://www.zotero.org/styles/american-chemical-society",
		"http://www.zotero.org/styles/laws": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/learning-and-memory": "http://www.zotero.org/styles/cold-spring-harbor-laboratory-press",
		"http://www.zotero.org/styles/legal-and-criminological-psychology": "http://www.zotero.org/styles/british-psychological-society",
		"http://www.zotero.org/styles/leprosy-review": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/leukemia": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/life": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/lijecnicki-vjesnik": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/lithosphere": "http://www.zotero.org/styles/geological-society-of-america",
		"http://www.zotero.org/styles/low-temperature-physics": "http://www.zotero.org/styles/american-institute-of-physics",
		"http://www.zotero.org/styles/lung-india": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/macedonian-journal-of-medical-sciences": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/macedonian-stomatologial-review": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/macromolecules": "http://www.zotero.org/styles/american-chemical-society",
		"http://www.zotero.org/styles/magnesium": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/magyar-noorvosok-lapja": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/maladies-chroniques-au-canada": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/malaysian-journal-of-pathology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/manedsskrift-for-praktk-laegegerning": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/marine-drugs": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/marine-ecology-progress-series": "http://www.zotero.org/styles/inter-research-science-center",
		"http://www.zotero.org/styles/materials-science-and-engineering-a": "http://www.zotero.org/styles/elsevier-without-titles",
		"http://www.zotero.org/styles/materials-science-and-engineering-b": "http://www.zotero.org/styles/elsevier-without-titles",
		"http://www.zotero.org/styles/materials-science-and-engineering-c": "http://www.zotero.org/styles/elsevier-without-titles",
		"http://www.zotero.org/styles/materials-science-and-engineering-r": "http://www.zotero.org/styles/elsevier-without-titles",
		"http://www.zotero.org/styles/materials": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/medical-acupuncture": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/medical-and-pediatric-oncology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/medical-care": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/medical-education": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/medical-humanities": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/medical-journal-of-australia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/medical-laboratory-sciences": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/medical-principles-and-practice": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/medicina-clinica": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/medicina-croatian-med-assoc": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/medicina-intensiva": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/medicina-militar": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/medula-espinal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/membranes": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/metabolites": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/metals": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/meteorological-monographs": "http://www.zotero.org/styles/american-meteorological-society",
		"http://www.zotero.org/styles/mhra_note_without_bibliography": "http://www.zotero.org/styles/mhra",
		"http://www.zotero.org/styles/microarrays": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/microbiology-and-molecular-biology-reviews": "http://www.zotero.org/styles/american-society-for-microbiology",
		"http://www.zotero.org/styles/microbiology": "http://www.zotero.org/styles/society-for-general-microbiology",
		"http://www.zotero.org/styles/micromachines": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/micron": "http://www.zotero.org/styles/elsevier-with-titles",
		"http://www.zotero.org/styles/military-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/mineral-and-electrolyte-metabolism": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/minerals": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/modern-language-review": "http://www.zotero.org/styles/mhra",
		"http://www.zotero.org/styles/modern-pathology": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/molbank": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/molecular-and-cellular-biology": "http://www.zotero.org/styles/american-society-for-microbiology",
		"http://www.zotero.org/styles/molecular-cancer-research": "http://www.zotero.org/styles/american-association-for-cancer-research",
		"http://www.zotero.org/styles/molecular-cancer-therapeutics": "http://www.zotero.org/styles/american-association-for-cancer-research",
		"http://www.zotero.org/styles/molecular-cell": "http://www.zotero.org/styles/cell",
		"http://www.zotero.org/styles/molecular-diagnosis-and-therapy": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/molecular-pharmaceutics": "http://www.zotero.org/styles/american-chemical-society-with-titles",
		"http://www.zotero.org/styles/molecular-syndromology": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/molecular-systems-biology": "http://www.zotero.org/styles/the-embo-journal",
		"http://www.zotero.org/styles/molecules": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/monthly-weather-review": "http://www.zotero.org/styles/american-meteorological-society",
		"http://www.zotero.org/styles/mount-sinai-journal-of-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/mucosal-immunology": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nano-letters": "http://www.zotero.org/styles/american-chemical-society",
		"http://www.zotero.org/styles/nanomaterials": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/nanomedicine": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/national-library-of-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/national-medical-journal-of-china": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/natural-immunity-and-cell-growth-regulation": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/nature-biotechnology": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-cell-biology": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-chemical-biology": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-chemistry": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-clinical-practice-cardiovascular-medicine": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-clinical-practice-endocrinology-and-metabolism": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-clinical-practice-gastroenterology-and-hepatology": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-clinical-practice-journals": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-clinical-practice-nephrology": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-clinical-practice-neurology": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-clinical-practice-oncology": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-clinical-practice-rheumatology": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-clinical-practice-urology": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-digest": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-genetics": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-geoscience": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-immunology": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-materials": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-medicine": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-methods": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-nanotechnology": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-neuroscience": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-photonics": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-physics": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-protocols": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-research-journals": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-reviews-cancer": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-reviews-drug-discovery": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-reviews-genetics": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-reviews-immunology": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-reviews-journals": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-reviews-microbiology": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-reviews-molecular-cell-biology": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-reviews-neuroscience": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nature-structural-and-molecular-biology": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/nederlands-tijdschrift-voor-geneeskunde": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/neonatology": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/nephrology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/nephron-clinical-practice": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/nephron-experimental-nephrology": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/nephron-extra": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/nephron-physiology": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/nephron": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/netherlands-journal-of-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/neumologica-y-cirugia-de-torax-neurofibromatosis": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/neurochemistry-international": "http://www.zotero.org/styles/elsevier-harvard",
		"http://www.zotero.org/styles/neurodegenerative-disease-management": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/neurodegenerative-diseases": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/neuroendocrinology": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/neuroepidemiology": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/neuroimmunomodulation": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/neurology-india": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/neurology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/neuron": "http://www.zotero.org/styles/cell",
		"http://www.zotero.org/styles/neuropsychiatry": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/neuropsychobiology": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/neuropsychology": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/neuroscience-and-biobehavioral-reviews": "http://www.zotero.org/styles/elsevier-harvard",
		"http://www.zotero.org/styles/neurosignals": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/neurosurgical-focus": "http://www.zotero.org/styles/journal-of-neurosurgery",
		"http://www.zotero.org/styles/neurourology-and-urodynamics": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/new-biotechnology": "http://www.zotero.org/styles/vancouver-brackets",
		"http://www.zotero.org/styles/new-doctor": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/new-iraqi-journal-of-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/new-zealand-dental-journal": "http://www.zotero.org/styles/journal-of-dental-research",
		"http://www.zotero.org/styles/new-zealand-family-physician": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/new-zealand-journal-of-medical-laboratory-technology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/new-zealand-journal-of-ophthalmology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/new-zealand-medical-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/nigerian-medical-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/no-to-hattatsu": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/nordisk-medicin": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/north-carolina-medical-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/nosokomiaka-chronica": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/nursing-inquiry": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/nursing": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/nutrients": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/obesity-facts": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/obesity": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/occupational-and-environmental-medicine": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/oncology": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/onkologie": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/ophthalmic-research": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/ophthalmologica": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/optical-engineering": "http://www.zotero.org/styles/spie-journals",
		"http://www.zotero.org/styles/optical-fiber-technology": "http://www.zotero.org/styles/elsevier-with-titles",
		"http://www.zotero.org/styles/optics-communications": "http://www.zotero.org/styles/elsevier-without-titles",
		"http://www.zotero.org/styles/oral-oncology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/organic-electronics": "http://www.zotero.org/styles/elsevier-without-titles",
		"http://www.zotero.org/styles/organic-letters": "http://www.zotero.org/styles/american-chemical-society",
		"http://www.zotero.org/styles/organic-process-research-and-development": "http://www.zotero.org/styles/american-chemical-society",
		"http://www.zotero.org/styles/organometallics": "http://www.zotero.org/styles/american-chemical-society",
		"http://www.zotero.org/styles/orl": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/osteoarthritis-and-cartilage": "http://www.zotero.org/styles/vancouver-superscript",
		"http://www.zotero.org/styles/otolaryngology-and-head-and-neck-surgery": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/oxford-german-studies": "http://www.zotero.org/styles/mhra",
		"http://www.zotero.org/styles/pain-management": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/pakistan-journal-of-medical-research": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/pakistan-journal-of-otolaryngology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/pancreatology": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/papua-new-guinea-medical-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/pathobiology": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/pathogens": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/pathology-international": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/pathology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/pathophysiology-of-haemostasis-and-thrombosis": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/patient-patient-centered-outcomes-research": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/pediatric-critical-care-medicine": "http://www.zotero.org/styles/critical-care-medicine",
		"http://www.zotero.org/styles/pediatric-drugs": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/pediatric-health": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/pediatric-nephrology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/pediatric-neurosurgery": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/pediatrics": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/peptide-and-proteine-research": "http://www.zotero.org/styles/springer-author-date",
		"http://www.zotero.org/styles/personalized-medicine": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/perspectives-on-politics": "http://www.zotero.org/styles/apsa",
		"http://www.zotero.org/styles/pharmaceutical-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/pharmaceuticals": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/pharmaceutics": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/pharmaceutisch-weekblad-scientific-edition": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/pharmaceutisch-weekblad": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/pharmacogenomics": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/pharmacognosy-magazine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/pharmacognosy-reviews": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/pharmacological-research-communications": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/pharmacology": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/pharmacotherapy": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/pharmacy-management": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/philosophical-transactions-roy-soc-b": "http://www.zotero.org/styles/proceedings-of-the-royal-society-b",
		"http://www.zotero.org/styles/phonetica": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/photonics-and-nanostructures": "http://www.zotero.org/styles/elsevier-without-titles",
		"http://www.zotero.org/styles/physical-review-a": "http://www.zotero.org/styles/american-physics-society",
		"http://www.zotero.org/styles/physical-review-b": "http://www.zotero.org/styles/american-institute-of-physics",
		"http://www.zotero.org/styles/physical-review-c": "http://www.zotero.org/styles/american-physics-society",
		"http://www.zotero.org/styles/physical-review-d": "http://www.zotero.org/styles/american-physics-society",
		"http://www.zotero.org/styles/physical-review-e": "http://www.zotero.org/styles/american-physics-society",
		"http://www.zotero.org/styles/physical-review-letters": "http://www.zotero.org/styles/american-physics-society",
		"http://www.zotero.org/styles/physician-and-sports-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/physics-of-fluids": "http://www.zotero.org/styles/american-institute-of-physics",
		"http://www.zotero.org/styles/physics-of-plasmas": "http://www.zotero.org/styles/american-institute-of-physics",
		"http://www.zotero.org/styles/physiological-genomics": "http://www.zotero.org/styles/american-physiological-society",
		"http://www.zotero.org/styles/phytochemistry": "http://www.zotero.org/styles/elsevier-harvard",
		"http://www.zotero.org/styles/phytopathology": "http://www.zotero.org/styles/american-phytopathological-society-numeric",
		"http://www.zotero.org/styles/plant-disease": "http://www.zotero.org/styles/american-phytopathological-society-numeric",
		"http://www.zotero.org/styles/plos-bio": "http://www.zotero.org/styles/plos",
		"http://www.zotero.org/styles/plos-comp-bio": "http://www.zotero.org/styles/plos",
		"http://www.zotero.org/styles/plos-genetics": "http://www.zotero.org/styles/plos",
		"http://www.zotero.org/styles/plos-medicine": "http://www.zotero.org/styles/plos",
		"http://www.zotero.org/styles/plos-neglected-tropical-diseases": "http://www.zotero.org/styles/plos",
		"http://www.zotero.org/styles/plos-one": "http://www.zotero.org/styles/plos",
		"http://www.zotero.org/styles/plos-pathogens": "http://www.zotero.org/styles/plos",
		"http://www.zotero.org/styles/polymers": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/portuguese-journal-of-cardiology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/portuguese-studies": "http://www.zotero.org/styles/mhra",
		"http://www.zotero.org/styles/postgraduate-doctor-africa": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/postgraduate-doctor-asia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/postgraduate-doctor-middle-east": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/postgraduate-medical-journal": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/postgraduate-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/powder-technology": "http://www.zotero.org/styles/elsevier-with-titles",
		"http://www.zotero.org/styles/practical-neurology": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/primary-care-companion-to-the-journal-of-clinical-psychiatry": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/professional-psychology-research-and-practice": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/progress-in-materials-science": "http://www.zotero.org/styles/elsevier-vancouver",
		"http://www.zotero.org/styles/progress-in-natural-science": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/prostate-cancer-and-prostatic-diseases": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/ps-political-science-and-politics": "http://www.zotero.org/styles/apsa",
		"http://www.zotero.org/styles/psychiatria-fennica": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/psychiatria-hungarica": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/psychoanalytic-psychology": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/psychological-assessment": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/psychological-bulletin": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/psychological-methods": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/psychological-review": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/psychological-services": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/psychological-trauma-theory-research-practice-and-policy": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/psychology-and-aging": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/psychology-and-psychotherapy-theory-research-and-practice": "http://www.zotero.org/styles/british-psychological-society",
		"http://www.zotero.org/styles/psychology-of-addictive-behaviors": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/psychology-of-aesthetics-creativity-and-the-arts": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/psychology-of-men-and-masculinity": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/psychology-of-religion-and-spirituality": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/psychology-public-policy-and-law": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/psychopathology": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/psychotherapy-and-psychosomatics": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/psychotherapy-theory-research-practice-training": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/public-health-genomics": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/public-health": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/puerto-rico-health-sciences-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/quality-safety-in-health-care": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/quarterly-journal-of-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/quimica-clinica": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/radiology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/regenerative-medicine": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/rehabilitation-psychology": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/religions": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/remote-sensing": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/renal-physiology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/respiration": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/resumed": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/review-of-educational-research": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/review-of-general-psychology": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/review-of-research-in-education": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/review-of-scientific-instruments": "http://www.zotero.org/styles/american-institute-of-physics",
		"http://www.zotero.org/styles/revista-argentina-de-cirugia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-brasileira-de-reumatologia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-chilena-de-pediatria": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-clinica-espanola": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-colombiana-de-ciencias-pecuarias": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-cubana-de-alimentacion-y-nutiricion": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-cubana-de-cardiologia-y-cirugia-cardiovascular": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-cubana-de-cirugia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-cubana-de-endocrinologia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-cubana-de-enfermeria": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-cubana-de-estomatologia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-cubana-de-farmacia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-cubana-de-hematologia-immunologia-y-hemoterapia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-cubana-de-higiene-y-epidemiologia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-cubana-de-investigaciones-biomedicas": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-cubana-de-medicina-general-integral": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-cubana-de-medicina-militar": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-cubana-de-medicina-tropical": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-cubana-de-medicina": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-cubana-de-obstetricia-y-ginecologia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-cubana-de-oftalmologia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-cubana-de-oncologia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-cubana-de-ortodonica": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-cubana-de-ortopedia-y-traumatologia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-cubana-de-pediatria": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-cubana-di-salud-publica": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-de-diagnostico-biologico": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-de-gastoenterologia-de-mexico": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-de-investigacion-clinica": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-de-la-sociedad-espanola-de-quimica-clinica": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-de-sanidad-e-higiene-publica": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-del-instituto-nacional-de-enfermedades-respiratorias": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-espanola-de-anestesiologia-y-reanimacion": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-espanola-de-reumatologia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-ginecologia-y-obstetricia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-iberoamericana-de-trombosis-y-hemostasia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-medica-de-cardiologia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-medica-de-chile": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-medica-del-instituto-mexicano-del-seguro-social": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-mexicana-de-anestesiologia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-mexicana-de-radiologia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revista-portuguesa-de-cardiologia": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/revue-des-maladies-respiratoires": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/rheumatology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/rna": "http://www.zotero.org/styles/cold-spring-harbor-laboratory-press",
		"http://www.zotero.org/styles/salud-colectiva": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/salud-publica-de-mexico": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/saudi-medical-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/scandinavian-journal-of-clinical-research": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/scandinavian-journal-of-dental-research": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/scandinavian-journal-of-haematology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/scandinavian-journal-of-respiratory-diseases": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/scandinavian-journal-of-social-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/school-psychology-quarterly": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/schumpert-medical-quarterly": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/schweizerische-zeitschrift-fur-ganzheitsmedizin": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/scibx-science-business-exchange": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/scripta-materialia": "http://www.zotero.org/styles/elsevier-without-titles",
		"http://www.zotero.org/styles/sensors-and-actuators-b": "http://www.zotero.org/styles/elsevier-with-titles",
		"http://www.zotero.org/styles/sensors": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/sexually-transmitted-diseases": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/sexually-transmitted-infections": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/shinkei-byorigaku-neuropathology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/skin-pharmacology-and-physiology": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/skin-pharmacology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/slavonic-and-east-european-review": "http://www.zotero.org/styles/mhra",
		"http://www.zotero.org/styles/social-psychiatry-and-psychiatric-epidemiology": "http://www.zotero.org/styles/springer-vancouver",
		"http://www.zotero.org/styles/social-psychology-quarterly": "http://www.zotero.org/styles/asa",
		"http://www.zotero.org/styles/social-sciences": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/societies": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/sociological-methodology": "http://www.zotero.org/styles/asa",
		"http://www.zotero.org/styles/sociological-theory": "http://www.zotero.org/styles/asa",
		"http://www.zotero.org/styles/sociology-of-education": "http://www.zotero.org/styles/asa",
		"http://www.zotero.org/styles/soil-biology-biochemistry": "http://www.zotero.org/styles/elsevier-harvard",
		"http://www.zotero.org/styles/solid-state-electronics": "http://www.zotero.org/styles/elsevier-with-titles",
		"http://www.zotero.org/styles/south-african-medical-journal": "http://www.zotero.org/styles/vancouver-superscript",
		"http://www.zotero.org/styles/southern-medical-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/special-care-dentistry": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/special-care-in-dentistry": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/speech-communication": "http://www.zotero.org/styles/elsevier-harvard",
		"http://www.zotero.org/styles/spinal-cord": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/sports-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/springfield-clinic": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/sri-lankan-family-physician": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/stereotactic-and-functional-neurosurgery": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/structure": "http://www.zotero.org/styles/cell",
		"http://www.zotero.org/styles/superlattices-and-microstructures": "http://www.zotero.org/styles/elsevier-without-titles",
		"http://www.zotero.org/styles/surgery": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/sustainability": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/swedish-medical-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/swiss-medical-weekly": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/symmetry": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/synthetic-metals": "http://www.zotero.org/styles/elsevier-without-titles",
		"http://www.zotero.org/styles/taylor-and-francis-harvard-v": "http://www.zotero.org/styles/taylor-and-francis-harvard-x",
		"http://www.zotero.org/styles/teaching-sociology": "http://www.zotero.org/styles/asa",
		"http://www.zotero.org/styles/technovation": "http://www.zotero.org/styles/elsevier-harvard",
		"http://www.zotero.org/styles/tectonophysics": "http://www.zotero.org/styles/elsevier-harvard",
		"http://www.zotero.org/styles/theoretical-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/therapeutic-delivery": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/thin-solid-films": "http://www.zotero.org/styles/elsevier-without-titles",
		"http://www.zotero.org/styles/thorax": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/thrombosis-and-haemostasis": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/tidsskrift-for-den-norske-laegeforening": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/tijdschrift-voor-nucleaire-geneeskunde": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/tobacco-control": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/toxins": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/training-and-education-in-professional-psychology": "http://www.zotero.org/styles/apa",
		"http://www.zotero.org/styles/transfusion-medicine-and-hemotherapy": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/transfusion": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/trends-biochemical-sciences": "http://www.zotero.org/styles/trends-journal",
		"http://www.zotero.org/styles/trends-biotechnology": "http://www.zotero.org/styles/trends-journal",
		"http://www.zotero.org/styles/trends-cell-biology": "http://www.zotero.org/styles/trends-journal",
		"http://www.zotero.org/styles/trends-cognitive-sciences": "http://www.zotero.org/styles/trends-journal",
		"http://www.zotero.org/styles/trends-ecology-and-evolution": "http://www.zotero.org/styles/trends-journal",
		"http://www.zotero.org/styles/trends-endocrinology-and-metabolism": "http://www.zotero.org/styles/trends-journal",
		"http://www.zotero.org/styles/trends-genetics": "http://www.zotero.org/styles/trends-journal",
		"http://www.zotero.org/styles/trends-immunology": "http://www.zotero.org/styles/trends-journal",
		"http://www.zotero.org/styles/trends-microbiology": "http://www.zotero.org/styles/trends-journal",
		"http://www.zotero.org/styles/trends-molecular-medicine": "http://www.zotero.org/styles/trends-journal",
		"http://www.zotero.org/styles/trends-neurosciences": "http://www.zotero.org/styles/trends-journal",
		"http://www.zotero.org/styles/trends-parasitology": "http://www.zotero.org/styles/trends-journal",
		"http://www.zotero.org/styles/trends-pharmacological-sciences": "http://www.zotero.org/styles/trends-journal",
		"http://www.zotero.org/styles/trends-plant-science": "http://www.zotero.org/styles/trends-journal",
		"http://www.zotero.org/styles/tropical-doctor": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/tropical-gastroenterology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/tumor-biology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/turabian-author-date": "http://www.zotero.org/styles/chicago-author-date",
		"http://www.zotero.org/styles/turkish-journal-of-trauma-and-emergency-surgery": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/ugeskrift-for-laeger": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/ukrainian-medical-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/ulster-medical-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/undersea-biomedical-research": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/urologia-internationalis": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/vascular-medicine": "http://www.zotero.org/styles/sage-vancouver",
		"http://www.zotero.org/styles/verhaltenstherapie": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/veterinary-radiology": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/veterinary-record": "http://www.zotero.org/styles/bmj",
		"http://www.zotero.org/styles/virus-research": "http://www.zotero.org/styles/elsevier-harvard",
		"http://www.zotero.org/styles/viruses": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/viszeralmedizin": "http://www.zotero.org/styles/karger-journals",
		"http://www.zotero.org/styles/vital": "http://www.zotero.org/styles/nature",
		"http://www.zotero.org/styles/vox-sanguinis": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/water": "http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute",
		"http://www.zotero.org/styles/weather-and-forecasting": "http://www.zotero.org/styles/american-meteorological-society",
		"http://www.zotero.org/styles/weather-climate-and-society": "http://www.zotero.org/styles/american-meteorological-society",
		"http://www.zotero.org/styles/west-virginia-medical-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/western-journal-of-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/who-chronicle": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/who-monog-service": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/who-tech-rep-service": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/womens-health": "http://www.zotero.org/styles/future-medicine-journals",
		"http://www.zotero.org/styles/world-health-organization-journals": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/world-health-statistics-quarterly": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/world-medical-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/yakuzai-ekigaku": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/yale-journal-of-biology-and-medicine": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/yearbook-of-english-studies": "http://www.zotero.org/styles/mhra",
		"http://www.zotero.org/styles/zagazig-university-medical-journal": "http://www.zotero.org/styles/vancouver",
		"http://www.zotero.org/styles/zdravniski-vestnik": "http://www.zotero.org/styles/vancouver"
	},
	"exampleCitationsFromMasterId": {
		"http://www.zotero.org/styles/acm-sig-proceedings-long-author-list": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "[1] Einstein, A. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>. 17, 4 (1905), 1\u201326."
		},
		"http://www.zotero.org/styles/acm-sig-proceedings": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "[1] Einstein, A. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>. 17, 4 (1905), 1\u201326."
		},
		"http://www.zotero.org/styles/acm-sigchi-proceedings": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1. Einstein, A. On the electrodynamics of moving bodies. <i>Annalen der Physik 17</i>, 4 (1905), 1\u201326."
		},
		"http://www.zotero.org/styles/acm-siggraph": {
			"statusMessage": "",
			"formattedCitations": [
				"[Einstein 1905]"
			],
			"formattedBibliography": "Einstein, A. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <i>17</i>, 4, 1\u201326."
		},
		"http://www.zotero.org/styles/acs-chemical-biology": {
			"statusMessage": "",
			"formattedCitations": [
				"(<i>1</i>)"
			],
			"formattedBibliography": "1.  Einstein, A. (1905) On the electrodynamics of moving bodies, <i>Annalen der Physik</i>, Dover Publications <i>17</i>, 1\u201326."
		},
		"http://www.zotero.org/styles/acs-nano": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1. Einstein, A. On the Electrodynamics of Moving Bodies. <i>Annalen der Physik</i> <b>1905</b>, <i>17</i>, 1\u201326."
		},
		"http://www.zotero.org/styles/acta-materialia": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "[1] Einstein A. Annalen der Physik 1905;17:1."
		},
		"http://www.zotero.org/styles/acta-universitatis-agriculturae-sueciae": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905). On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17(4), 1\u201326 Dover Publications."
		},
		"http://www.zotero.org/styles/administrative-science-quaterly": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "\n\n    <div class=\"csl-block\">Einstein, A.</div>\n1905  \u00e2\u20ac\u0153On the electrodynamics of moving bodies.\u00e2\u20ac\ufffd Annalen der Physik, 17: 1\u201326. Dover Publications."
		},
		"http://www.zotero.org/styles/advanced-engineering-materials": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>[1]</sup>"
			],
			"formattedBibliography": "[1]  A. Einstein, <i>Annalen Der Physik</i> <b>1905</b>, <i>17</i>, 1."
		},
		"http://www.zotero.org/styles/advanced-materials": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "[1]  A. Einstein, <i>Annalen der Physik</i> <b>1905</b>, <i>17</i>, 1\u201326."
		},
		"http://www.zotero.org/styles/advances-in-complex-systems": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "[1]  Einstein, A., On the electrodynamics of moving bodies, <i>Annalen Der Physik</i> <b>17</b> (1905) 1\u201326."
		},
		"http://www.zotero.org/styles/aging-cell": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein A (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17, 1\u201326."
		},
		"http://www.zotero.org/styles/aids": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1  Einstein A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 1905; <b>17</b>:1\u201326."
		},
		"http://www.zotero.org/styles/all": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, A., 1905, p.)"
			],
			"formattedBibliography": "Type is article&#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; Type is article-journal&#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160;  AUTHOR LONG=Albert Einstein SHORT=Einstein&#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160;  ISSUED: YEAR=1905 (05)&#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160;  TITLE SHORT=On the electrodynamics of moving bodies LONG=On the electrodynamics of moving bodies&#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; CONTAINER-TITLE SHORT=Annalen der Physik LONG=Annalen der Physik&#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; PUBLISHER SHORT=Dover Publications LONG=Dover Publications&#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; PAGE SHORT=1\u201326 LONG=1\u201326&#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160;  VOLUME SHORT=17 LONG=17&#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160;  ISSUE SHORT=4 LONG=4&#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; CHAPTER-NUMBER SHORT=3 LONG=3&#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160;  ABSTRACT SHORT=General description of special relativity LONG=General description of special relativity&#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160;  CITATION-NUMBER SHORT=1 LONG=1                                                                            CITATION-LABEL SHORT=Eins05 LONG=Eins05&#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160;  "
		},
		"http://www.zotero.org/styles/alternatives-to-animal-experimentation": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17: p.1\u201326."
		},
		"http://www.zotero.org/styles/american-anthropological-association": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "\n\n    <div class=\"csl-block\">Einstein, Albert</div>\n 1905 On the Electrodynamics of Moving Bodies. Annalen Der Physik 17(4). Dover Publications: 1\u201326."
		},
		"http://www.zotero.org/styles/american-antiquity": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "\n\n    <div class=\"csl-block\">Einstein, Albert</div>\n<div class=\"csl-indent\">1905 On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17(4): 1\u201326.</div>\n  "
		},
		"http://www.zotero.org/styles/american-association-for-cancer-research": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1. Einstein A. On the electrodynamics of moving bodies. Annalen der Physik. 1905;17(4):1\u201326."
		},
		"http://www.zotero.org/styles/american-association-of-petroleum-geologists": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A., 1905, On the electrodynamics of moving bodies: Annalen der Physik, v. 17, no. 4, p. 1\u201326."
		},
		"http://www.zotero.org/styles/american-chemical-society-with-titles-brackets": {
			"statusMessage": "",
			"formattedCitations": [
				"(<i>1</i>)"
			],
			"formattedBibliography": "(1)  Einstein, A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>1905</b>, <i>17</i>, 1\u201326."
		},
		"http://www.zotero.org/styles/american-chemical-society-with-titles": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "(1)  Einstein, A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>1905</b>, <i>17</i>, 1\u201326."
		},
		"http://www.zotero.org/styles/american-chemical-society": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "(1)  Einstein, A. <i>Annalen der Physik</i> <b>1905</b>, <i>17</i>, 1\u201326."
		},
		"http://www.zotero.org/styles/american-geophysical-union": {
			"statusMessage": "",
			"formattedCitations": [
				"[<i>Einstein</i>, 1905]"
			],
			"formattedBibliography": "Einstein, A. (1905), On the electrodynamics of moving bodies, <i>Annalen der Physik</i>, <i>17</i>(4), 1\u201326."
		},
		"http://www.zotero.org/styles/american-heart-association": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>. 1905;17(4):1\u201326."
		},
		"http://www.zotero.org/styles/american-institute-of-physics": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "<sup>1</sup> A. Einstein, Annalen Der Physik <b>17</b>, 1 (1905)."
		},
		"http://www.zotero.org/styles/american-journal-of-archaeology": {
			"statusMessage": "",
			"formattedCitations": [
				"Einstein 1905"
			],
			"formattedBibliography": "Einstein, Albert. 1905. \u00e2\u20ac\u0153On the electrodynamics of moving bodies.\u00e2\u20ac\ufffd <i>Annalen der Physik</i> 17 4: 1\u201326."
		},
		"http://www.zotero.org/styles/american-journal-of-botany": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17: p.1\u201326."
		},
		"http://www.zotero.org/styles/american-journal-of-epidemiology": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>. 1905;17(4):1\u201326. "
		},
		"http://www.zotero.org/styles/american-journal-of-medical-genetics": {
			"statusMessage": "",
			"formattedCitations": [
				"[Einstein, 1905]"
			],
			"formattedBibliography": "Einstein, A. 1905. On the electrodynamics of moving bodies. Annalen der Physik 17: 1\u201326."
		},
		"http://www.zotero.org/styles/american-journal-of-physical-anthropology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein A. 1905. On the electrodynamics of moving bodies. Annalen der Physik 17:1\u201326."
		},
		"http://www.zotero.org/styles/american-journal-of-political-science": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, Albert. 1905. \u00e2\u20ac\u0153On the electrodynamics of moving bodies.\u00e2\u20ac\ufffd <i>Annalen der Physik</i> 17(4): 1\u201326."
		},
		"http://www.zotero.org/styles/american-medical-association-alphabetical": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1. Einstein A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>. 1905;17(4):1\u201326."
		},
		"http://www.zotero.org/styles/american-medical-association-no-et-al": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1. Einstein A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>. 1905;17(4):1\u201326."
		},
		"http://www.zotero.org/styles/american-medical-association-no-url": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1. Einstein A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>. 1905;17(4):1\u201326."
		},
		"http://www.zotero.org/styles/american-medical-association": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1. Einstein A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>. 1905;17(4):1\u201326."
		},
		"http://www.zotero.org/styles/american-meteorological-society": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A., 1905: On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, <b>17</b>, 1\u201326."
		},
		"http://www.zotero.org/styles/american-physics-society": {
			"statusMessage": "",
			"formattedCitations": [
				"\u00c2\u00a0[1]"
			],
			"formattedBibliography": "[1]  A. Einstein, Annalen Der Physik <b>17</b>, 1 (1905)."
		},
		"http://www.zotero.org/styles/american-physiological-society": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1.  <b>Einstein A</b>. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17: 1\u201326, 1905."
		},
		"http://www.zotero.org/styles/american-phytopathological-society-numeric": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1. Einstein, A. 1905. On the electrodynamics of moving bodies. Annalen der Physik. 17:1\u201326"
		},
		"http://www.zotero.org/styles/american-phytopathological-society": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. 1905. On the electrodynamics of moving bodies. Annalen der Physik. 17:1\u201326"
		},
		"http://www.zotero.org/styles/american-society-for-microbiology": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1.  <b>Einstein A.</b> 1905. On the electrodynamics of moving bodies. Annalen der Physik <b>17</b>:1\u201326."
		},
		"http://www.zotero.org/styles/american-society-of-civil-engineers": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905). \u00e2\u20ac\u0153On the electrodynamics of moving bodies.\u00e2\u20ac\ufffd <i>Annalen der Physik</i>, Dover Publications, 17(4), 1\u201326."
		},
		"http://www.zotero.org/styles/american-society-of-mechanical-engineers": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "[1]  Einstein A., 1905, \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd Annalen der Physik, <b>17</b>(4), pp. 1\u201326."
		},
		"http://www.zotero.org/styles/amiens": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "[1] <b>Einstein A</b>. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 1905;17:1\u201326. "
		},
		"http://www.zotero.org/styles/analytica-chimica-acta": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "[1] A. Einstein, Annalen der Physik, 17 (1905) 1\u201326."
		},
		"http://www.zotero.org/styles/anesthesia-and-analgesia": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1. Einstein, A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>, 1\u201326 (1905)."
		},
		"http://www.zotero.org/styles/angewandte-chemie": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>[1]</sup>"
			],
			"formattedBibliography": "[1]  A. Einstein, <i>Annalen der Physik</i> <b>1905</b>, <i>17</i>, 1\u201326."
		},
		"http://www.zotero.org/styles/animal-behaviour": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "<b>Einstein, A.</b> 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, <b>17</b>, 1\u201326."
		},
		"http://www.zotero.org/styles/annalen-des-naturhistorischen-museums-wien": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905): On the electrodynamics of moving bodies. \u00e2\u20ac\u201c <i>Annalen der Physik</i>, <b>17</b>/4: 1\u201326. (Dover Publications)."
		},
		"http://www.zotero.org/styles/annals-of-biomedical-engineering": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1. Einstein, A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17:1\u201326, 1905."
		},
		"http://www.zotero.org/styles/annals-of-botany": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "<b><b>Einstein A</b></b>. <b>1905</b>. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>: 1\u201326."
		},
		"http://www.zotero.org/styles/annals-of-neurology": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. Annalen der Physik 1905;17(4):1\u201326."
		},
		"http://www.zotero.org/styles/annals-of-the-association-of-american-geographers": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17 (4):1\u201326."
		},
		"http://www.zotero.org/styles/annual-reviews-alphabetically": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1.  Einstein A. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17(4):1\u201326. Dover Publications."
		},
		"http://www.zotero.org/styles/annual-reviews-by-appearance": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1.  Einstein A. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17(4):1\u201326. Dover Publications."
		},
		"http://www.zotero.org/styles/antarctic-science": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, <b>17</b>, 1\u201326."
		},
		"http://www.zotero.org/styles/antonie-van-leeuwenhoek": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein A (1905) On the electrodynamics of moving bodies. Annalen der Physik 17:1\u201326"
		},
		"http://www.zotero.org/styles/apa": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905). On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, <i>17</i>(4), 1\u201326. Dover Publications."
		},
		"http://www.zotero.org/styles/apa5th": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905). On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, <i>17</i>(4), 1\u201326. Dover Publications."
		},
		"http://www.zotero.org/styles/applied-spectroscopy": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1.  A. Einstein, Annalen der Physik <b>17</b>, 4, 1\u201326 (1905)."
		},
		"http://www.zotero.org/styles/apsa": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, Albert. 1905. \u00e2\u20ac\u0153On the electrodynamics of moving bodies.\u00e2\u20ac\ufffd <i>Annalen der Physik</i> 17(4): 1\u201326."
		},
		"http://www.zotero.org/styles/archives-of-physical-medicine-and-rehabilitation": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. Annalen der Physik. 1905;17:1\u201326. "
		},
		"http://www.zotero.org/styles/art-history": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, \u00e2\u20ac\u02dcOn the electrodynamics of moving bodies\u00e2\u20ac<sup>TM</sup>, Annalen der Physik, 17: 4, 1905, 1\u201326."
			],
			"formattedBibliography": "Albert Einstein, \u00e2\u20ac\u02dcOn the electrodynamics of moving bodies\u00e2\u20ac<sup>TM</sup>, Annalen der Physik, 17: 4, 1905, 1\u201326."
		},
		"http://www.zotero.org/styles/arzneimitteltherapie": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. Annalen der Physik. 1905;17(4):1\u201326. "
		},
		"http://www.zotero.org/styles/asa-cssa-sssa": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. 1905. On the electrodynamics of moving bodies. Annalen der Physik 17(4): 1\u201326."
		},
		"http://www.zotero.org/styles/asa": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, Albert. 1905. \u00e2\u20ac\u0153On the electrodynamics of moving bodies.\u00e2\u20ac\ufffd <i>Annalen der Physik</i> 17(4):1\u201326."
		},
		"http://www.zotero.org/styles/associacao-brasileira-de-normas-tecnicas-ufpr": {
			"statusMessage": "",
			"formattedCitations": [
				"Einstein (1905)"
			],
			"formattedBibliography": "EINSTEIN, A. On the electrodynamics of moving bodies. <b>Annalen der Physik</b>, v. 17, n. 4, p. 1\u201326, 1905. Dover Publications."
		},
		"http://www.zotero.org/styles/associacao-brasileira-de-normas-tecnicas": {
			"statusMessage": "",
			"formattedCitations": [
				"(EINSTEIN, 1905)"
			],
			"formattedBibliography": "EINSTEIN, A. On the electrodynamics of moving bodies. <b>Annalen der Physik</b>, v. 17, n. 4, p. 1-26, 1905. "
		},
		"http://www.zotero.org/styles/australian-historical-studies": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, \u00e2\u20ac\u02dcOn the electrodynamics of moving bodies\u00e2\u20ac<sup>TM</sup>, <i>Annalen der Physik</i> 17, no. 4 (1905): 1\u201326."
			],
			"formattedBibliography": "Albert Einstein, \u00e2\u20ac\u02dcOn the electrodynamics of moving bodies\u00e2\u20ac<sup>TM</sup>, <i>Annalen der Physik</i> 17, no. 4 (1905): 1\u201326."
		},
		"http://www.zotero.org/styles/australian-journal-of-grape-and-wine-research": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A., (1905) On the electrodynamics of moving bodies. Annalen der Physik <b>17</b>, 1\u201326."
		},
		"http://www.zotero.org/styles/australian-legal": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, \u00e2\u20ac\u0153On the electrodynamics of moving bodies\u00e2\u20ac\ufffd (1905) 17(4) <i>Annalen der Physik</i> 1\u201326."
			],
			"formattedBibliography": "Albert Einstein, \u00e2\u20ac\u0153On the electrodynamics of moving bodies\u00e2\u20ac\ufffd (1905) 17(4) <i>Annalen der Physik</i> 1\u201326."
		},
		"http://www.zotero.org/styles/avian-pathology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905). On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, <i>17</i>, 1\u201326. Dover Publications."
		},
		"http://www.zotero.org/styles/aviation-space-and-environmental-medicine": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. Annalen der Physik 1905; 17:1\u201326. "
		},
		"http://www.zotero.org/styles/basic-and-applied-ecology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905). On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, <i>17</i>, 1\u201326."
		},
		"http://www.zotero.org/styles/bba-biochimica-et-biophysica-acta": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "[1]  A. Einstein, On the electrodynamics of moving bodies, Annalen Der Physik, 17 (1905) 1\u201326."
		},
		"http://www.zotero.org/styles/bibtex": {
			"statusMessage": "",
			"formattedCitations": [
				"Einstein_1905"
			],
			"formattedBibliography": " @article{Einstein_1905, chapter={3}, title={On the electrodynamics of moving bodies}, volume={17}, abstractNote={General description of special relativity}, number={4}, journal={Annalen der Physik}, publisher={Dover Publications}, author={Einstein, Albert}, year={1905}, pages={1\u201326}}"
		},
		"http://www.zotero.org/styles/biochemistry": {
			"statusMessage": "",
			"formattedCitations": [
				"(<i>1</i>)"
			],
			"formattedBibliography": "1.  Einstein, A. (1905) On the electrodynamics of moving bodies, <i>Annalen der Physik</i> <i>17</i>, 1\u201326."
		},
		"http://www.zotero.org/styles/bioconjugate-chemistry": {
			"statusMessage": "",
			"formattedCitations": [
				"(<i>1</i>)"
			],
			"formattedBibliography": "1.  Einstein, A. (1905) On the electrodynamics of moving bodies. , <i>Annalen der Physik</i>. Dover Publications <i>17</i>, 1\u201326."
		},
		"http://www.zotero.org/styles/bioelectromagnetics": {
			"statusMessage": "",
			"formattedCitations": [
				"[Einstein, 1905]"
			],
			"formattedBibliography": "Einstein A. 1905. On the electrodynamics of moving bodies. Annalen der physik 17:1\u201326."
		},
		"http://www.zotero.org/styles/bioessays": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1.  <b>Einstein A</b>. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>: 1\u201326. "
		},
		"http://www.zotero.org/styles/bioinformatics": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein,A. (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, <b>17</b>, 1\u201326."
		},
		"http://www.zotero.org/styles/biological-psychiatry": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1. Einstein A (1905): On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17: Dover Publications1\u201326."
		},
		"http://www.zotero.org/styles/bioorganic-and-medicinal-chemistry-letters": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1.  Einstein, A. <i>Annalen der Physik</i> <b><b>1905</b></b>, <i>17</i>, 1\u201326."
		},
		"http://www.zotero.org/styles/biophysical-journal": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1.  Einstein, A. 1905. On the electrodynamics of moving bodies. Annalen der Physik. 17: 1\u201326."
		},
		"http://www.zotero.org/styles/biotechnology-and-bioengineering": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein A. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>:1\u201326."
		},
		"http://www.zotero.org/styles/biotropica": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A., 1905. On the electrodynamics of moving bodies. Annalen der Physik 17: p.1\u201326."
		},
		"http://www.zotero.org/styles/blank": {
			"statusMessage": "",
			"formattedCitations": [
				"[CSL STYLE ERROR: reference with no printed form.]"
			],
			"formattedBibliography": "\n[CSL STYLE ERROR: reference with no printed form.]\n"
		},
		"http://www.zotero.org/styles/blood": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1. Einstein A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>. 1905;17(4):1\u201326. "
		},
		"http://www.zotero.org/styles/bluebook-inline": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, <i>On the electrodynamics of moving bodies</i>, 17 Annalen der Physik 1\u201326 (1905)"
			],
			"formattedBibliography": "Albert Einstein, <i>On the electrodynamics of moving bodies</i>, 17 Annalen der Physik 1\u201326 (1905)"
		},
		"http://www.zotero.org/styles/bluebook-law-review": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, <i>On the electrodynamics of moving bodies</i>, 17 Annalen der Physik 1\u201326 (1905)."
			],
			"formattedBibliography": "Albert Einstein, <i>On the electrodynamics of moving bodies</i>, 17 Annalen der Physik 1\u201326 (1905)."
		},
		"http://www.zotero.org/styles/bluebook2": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, <i>On the electrodynamics of moving bodies</i>, 17 Annalen der Physik 1\u201326 (1905)"
			],
			"formattedBibliography": "Albert Einstein, <i>On the electrodynamics of moving bodies</i>, 17 Annalen der Physik 1\u201326 (1905)"
		},
		"http://www.zotero.org/styles/bmc-bioinformatics": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1. Einstein A: <b>On the electrodynamics of moving bodies</b>. <i>Annalen der Physik</i> 1905, <b>17</b>:1\u201326."
		},
		"http://www.zotero.org/styles/bmj": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1  Einstein A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 1905;<b>17</b>:1\u201326."
		},
		"http://www.zotero.org/styles/bone-marrow-transplantation": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1. Einstein, A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>, 1\u201326 (1905)."
		},
		"http://www.zotero.org/styles/bone": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "[1]  Einstein A. On the electrodynamics of moving bodies. Annalen der Physik 1905;17:1\u201326."
		},
		"http://www.zotero.org/styles/brain": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein A. On the electrodynamics of moving bodies. Annalen der Physik 1905; 17: 1\u201326."
		},
		"http://www.zotero.org/styles/brazilian-journal-of-nature-conservation": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein A, 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, 17(4):1-26. "
		},
		"http://www.zotero.org/styles/briefings-in-bioinformatics": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1. Einstein, A. On the electrodynamics of moving bodies. Annalen der Physik 1905; 17:1\u201326"
		},
		"http://www.zotero.org/styles/british-ecological-society": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, <b>17</b>, 1\u201326."
		},
		"http://www.zotero.org/styles/british-journal-of-haematology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, <b>17</b><b>,</b> 1\u201326."
		},
		"http://www.zotero.org/styles/british-journal-of-political-science": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, \u00e2\u20ac\u02dcOn the Electrodynamics of Moving Bodies\u00e2\u20ac<sup>TM</sup>, <i>Annalen Der Physik</i>, 17 (1905)."
			],
			"formattedBibliography": "Albert Einstein, \u00e2\u20ac\u02dcOn the Electrodynamics of Moving Bodies\u00e2\u20ac<sup>TM</sup>, <i>Annalen Der Physik</i>, 17 (1905)."
		},
		"http://www.zotero.org/styles/british-psychological-society": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905). On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, <i>17</i>(4), 1\u201326. Dover Publications."
		},
		"http://www.zotero.org/styles/building-structure": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "[1] Einstein Albert. On the electrodynamics of moving bodies[J]. Annalen der Physik,1905, 17(4):1\u201326."
		},
		"http://www.zotero.org/styles/bulletin-de-la-societe-prehistorique-francaise": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "EINSTEIN A. (1905)\u00c2\u00a0\u00e2\u20ac\u2019 On the electrodynamics of moving bodies, <i>Annalen der Physik</i>, 17, 4, p.p.\u00c2\u00a01-26. "
		},
		"http://www.zotero.org/styles/catholic-biblical-association": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd <i>Annalen der Physik</i> 17 (1905) 1\u201326"
			],
			"formattedBibliography": "Albert Einstein, \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd <i>Annalen der Physik</i> 17 (1905) 1\u201326"
		},
		"http://www.zotero.org/styles/cell-calcium": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "[1]  A. Einstein, On the electrodynamics of moving bodies, Annalen Der Physik. 17 (1905) 1\u201326."
		},
		"http://www.zotero.org/styles/cell-numeric": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1. Einstein, A. (1905). On the electrodynamics of moving bodies. Annalen der Physik <i>17</i>, 1\u201326."
		},
		"http://www.zotero.org/styles/cell-transplantation": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1. Einstein, A. On the electrodynamics of moving bodies. Annalen der Physik. 17: 1\u201326; 1905."
		},
		"http://www.zotero.org/styles/cell": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905). On the electrodynamics of moving bodies. Annalen Der Physik <i>17</i>, 1\u201326."
		},
		"http://www.zotero.org/styles/centaurus": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, Dover Publications, 17(4), 1\u201326."
		},
		"http://www.zotero.org/styles/cerebral-cortex": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein A. 1905. On the electrodynamics of moving bodies. Annalen der Physik. 17:1\u201326."
		},
		"http://www.zotero.org/styles/chemical-research-in-toxicology": {
			"statusMessage": "",
			"formattedCitations": [
				"(<i>1</i>)"
			],
			"formattedBibliography": "(1)  Einstein, A. (1905) On the electrodynamics of moving bodies, <i>Annalen der Physik</i>, Dover Publications <i>17</i>, 1\u201326."
		},
		"http://www.zotero.org/styles/chest": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. Annalen der Physik 1905;17(4):1\u201326. "
		},
		"http://www.zotero.org/styles/chicago-annotated-bibliography": {
			"statusMessage": "",
			"formattedCitations": [
				"Einstein, \u00e2\u20ac\u0153On the Electrodynamics of Moving Bodies.\u00e2\u20ac\ufffd"
			],
			"formattedBibliography": "Einstein, Albert. \u00e2\u20ac\u0153On the Electrodynamics of Moving Bodies.\u00e2\u20ac\ufffd <i>Annalen Der Physik</i> 17, no. 4 (1905): 1\u201326."
		},
		"http://www.zotero.org/styles/chicago-author-date-basque": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, Albert. 1905. \u00c2\u00abOn the electrodynamics of moving bodies\u00c2\u00bb. <i>Annalen der Physik</i> 17 (4): 1\u201326."
		},
		"http://www.zotero.org/styles/chicago-author-date-de": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, Albert. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17, Nr. 4: 1\u201326."
		},
		"http://www.zotero.org/styles/chicago-author-date": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, Albert. 1905. \u00e2\u20ac\u0153On the Electrodynamics of Moving Bodies.\u00e2\u20ac\ufffd <i>Annalen Der Physik</i> 17 (4): 1\u201326."
		},
		"http://www.zotero.org/styles/chicago-dated-note-biblio-no-ibid": {
			"statusMessage": "",
			"formattedCitations": [
				"Einstein 1905."
			],
			"formattedBibliography": "Einstein, Albert. \u00e2\u20ac\u0153On the Electrodynamics of Moving Bodies.\u00e2\u20ac\ufffd <i>Annalen Der Physik</i> <b>17</b> (4) (1905): 1\u201326."
		},
		"http://www.zotero.org/styles/chicago-fullnote-bibliography-delimiter-fixes": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd <i>Annalen der Physik</i> 17, no. 4 (1905): 1\u201326."
			],
			"formattedBibliography": "Einstein, Albert. \u00e2\u20ac\u0153On the electrodynamics of moving bodies.\u00e2\u20ac\ufffd <i>Annalen der Physik</i> 17, no. 4 (1905): 1\u201326."
		},
		"http://www.zotero.org/styles/chicago-fullnote-bibliography-no-ibid-delimiter-fixes": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd <i>Annalen der Physik</i> 17, no. 4 (1905): 1\u201326."
			],
			"formattedBibliography": "Einstein, Albert. \u00e2\u20ac\u0153On the electrodynamics of moving bodies.\u00e2\u20ac\ufffd <i>Annalen der Physik</i> 17, no. 4 (1905): 1\u201326."
		},
		"http://www.zotero.org/styles/chicago-fullnote-bibliography-no-ibid": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, \u00e2\u20ac\u0153On the Electrodynamics of Moving Bodies,\u00e2\u20ac\ufffd <i>Annalen Der Physik</i> 17, no. 4 (1905): 1\u201326."
			],
			"formattedBibliography": "Einstein, Albert. \u00e2\u20ac\u0153On the Electrodynamics of Moving Bodies.\u00e2\u20ac\ufffd <i>Annalen Der Physik</i> 17, no. 4 (1905): 1\u201326."
		},
		"http://www.zotero.org/styles/chicago-fullnote-bibliography": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, \u00e2\u20ac\u0153On the Electrodynamics of Moving Bodies,\u00e2\u20ac\ufffd <i>Annalen Der Physik</i> 17, no. 4 (1905): 1\u201326."
			],
			"formattedBibliography": "Einstein, Albert. \u00e2\u20ac\u0153On the Electrodynamics of Moving Bodies.\u00e2\u20ac\ufffd <i>Annalen Der Physik</i> 17, no. 4 (1905): 1\u201326."
		},
		"http://www.zotero.org/styles/chicago-library-list": {
			"statusMessage": "",
			"formattedCitations": [
				"Einstein, \u00e2\u20ac\u0153On the Electrodynamics of Moving Bodies.\u00e2\u20ac\ufffd"
			],
			"formattedBibliography": "Einstein, Albert. \u00e2\u20ac\u0153On the Electrodynamics of Moving Bodies.\u00e2\u20ac\ufffd <i>Annalen Der Physik</i> 17, no. 4 (1905): 1\u201326."
		},
		"http://www.zotero.org/styles/chicago-note-biblio-no-ibid": {
			"statusMessage": "",
			"formattedCitations": [
				"Einstein, \u00e2\u20ac\u0153On the Electrodynamics of Moving Bodies.\u00e2\u20ac\ufffd"
			],
			"formattedBibliography": "Einstein, Albert. \u00e2\u20ac\u0153On the Electrodynamics of Moving Bodies.\u00e2\u20ac\ufffd <i>Annalen Der Physik</i> 17, no. 4 (1905): 1\u201326."
		},
		"http://www.zotero.org/styles/chicago-note-bibliography": {
			"statusMessage": "",
			"formattedCitations": [
				"Einstein, \u00e2\u20ac\u0153On the Electrodynamics of Moving Bodies.\u00e2\u20ac\ufffd"
			],
			"formattedBibliography": "Einstein, Albert. \u00e2\u20ac\u0153On the Electrodynamics of Moving Bodies.\u00e2\u20ac\ufffd <i>Annalen Der Physik</i> 17, no. 4 (1905): 1\u201326."
		},
		"http://www.zotero.org/styles/chicago-quick-copy": {
			"statusMessage": "",
			"formattedCitations": [
				"Einstein, \u00e2\u20ac\u0153On the Electrodynamics of Moving Bodies.\u00e2\u20ac\ufffd"
			],
			"formattedBibliography": "Albert Einstein, \u00e2\u20ac\u0153On the Electrodynamics of Moving Bodies,\u00e2\u20ac\ufffd <i>Annalen der Physik</i> 17, no. 4 (1905): 1\u201326."
		},
		"http://www.zotero.org/styles/chinese-gb7714-1987-numeric": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>[1]</sup>"
			],
			"formattedBibliography": "[1] Einstein A. On the electrodynamics of moving bodies[J]. Annalen der Physik, Dover Publications, 1905, 17(4): 1\u201326."
		},
		"http://www.zotero.org/styles/chinese-gb7714-2005-numeric": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>[1]</sup>"
			],
			"formattedBibliography": "[1] Einstein A. On the electrodynamics of moving bodies[J]. Annalen der Physik, Dover Publications, 1905, 17(4): 1\u201326."
		},
		"http://www.zotero.org/styles/circulation": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>. 1905; 17:1\u201326. "
		},
		"http://www.zotero.org/styles/climatic-change": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein A (1905) On the electrodynamics of moving bodies. Annalen der Physik 17:1\u201326."
		},
		"http://www.zotero.org/styles/clinical-cancer-research": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. Annalen der Physik 1905 ;17:1\u201326."
		},
		"http://www.zotero.org/styles/clinical-infectious-diseases": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. Annalen der Physik <b>1905</b>; 17:1\u201326. "
		},
		"http://www.zotero.org/styles/clinical-neurophysiology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein A. On the electrodynamics of moving bodies. Annalen der Physik. Dover Publications; 1905;17(4):1\u201326. "
		},
		"http://www.zotero.org/styles/clinical-orthopaedics-and-related-research": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1. Einstein A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>. 1905;17:1\u201326."
		},
		"http://www.zotero.org/styles/cns-and-neurological-disorders-drug-targets": {
			"statusMessage": "",
			"formattedCitations": [
				"[]1]"
			],
			"formattedBibliography": "(1)  Einstein, A. <i>Annalen der Physik</i> <b>1905</b>, <i>17</i>, 1\u201326."
		},
		"http://www.zotero.org/styles/cold-spring-harbor-laboratory-press": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein A. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>: 1\u201326."
		},
		"http://www.zotero.org/styles/conservation-biology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. 1905. On the electrodynamics of moving bodies. Annalen der Physik <b>17</b>:1\u201326. Dover Publications."
		},
		"http://www.zotero.org/styles/copernicus-publications": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A.: On the electrodynamics of moving bodies, Annalen der Physik, 17(4), 1\u201326, 1905."
		},
		"http://www.zotero.org/styles/council-of-science-editors-author-date": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein A. 1905. On the electrodynamics of moving bodies. Annalen der Physik 17:1\u201326."
		},
		"http://www.zotero.org/styles/council-of-science-editors": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1. Einstein A. On the electrodynamics of moving bodies. Annalen der Physik. 1905;17(4):1\u201326."
		},
		"http://www.zotero.org/styles/critical-care-medicine": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1.  Einstein A: On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 1905; 17:1\u201326"
		},
		"http://www.zotero.org/styles/culture-medicine-and-psychiatry": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, Albert 1905 On the electrodynamics of moving bodies. Annalen der Physik 17(4): 1\u201326."
		},
		"http://www.zotero.org/styles/current-opinion": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1.  Einstein A: <b>On the electrodynamics of moving bodies</b>. <i>Annalen der Physik</i> 1905, <b>17</b>:1\u201326."
		},
		"http://www.zotero.org/styles/current-protocols": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17:1\u201326."
		},
		"http://www.zotero.org/styles/currents-in-biblical-research": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "\n\n    <div class=\"csl-block\">Einstein, A.</div>\n&#160; &#160;  1905&#160; &#160;  \u00e2\u20ac\u02dcOn the electrodynamics of moving bodies\u00e2\u20ac\u2122, <i>Annalen der Physik</i> 17 (4): 1\u201326. "
		},
		"http://www.zotero.org/styles/cytometry": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1. Einstein A. On the electrodynamics of moving bodies. Annalen der Physik 1905;17:1\u201326."
		},
		"http://www.zotero.org/styles/dendrochronologia": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A., 1905. On the electrodynamics of moving bodies. Annalen der Physik Dover Publications 17, 1\u201326."
		},
		"http://www.zotero.org/styles/din-1505-2": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, Albert: On the electrodynamics of moving bodies. In: <i>Annalen der Physik</i> vol. 17, Dover Publications (1905), Nr.\u00c2\u00a04, pp.\u00c2\u00a01\u201326"
		},
		"http://www.zotero.org/styles/diplo": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, , 1905)"
			],
			"formattedBibliography": "Einstein A (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17(4), p.pp. 1\u201326."
		},
		"http://www.zotero.org/styles/drug-and-alcohol-dependence": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A., 1905. On the electrodynamics of moving bodies. Annalen der Physik 17, 1\u201326."
		},
		"http://www.zotero.org/styles/earth-surface-processes-and-landforms": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein A. 1905. On the electrodynamics of moving bodies. Annalen der Physik <b>17</b> : 1\u201326."
		},
		"http://www.zotero.org/styles/ecological-modelling": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A., 1905. On the electrodynamics of moving bodies. Annalen der Physik 17, 1\u201326."
		},
		"http://www.zotero.org/styles/ecology-letters": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905). On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, 17, 1\u201326."
		},
		"http://www.zotero.org/styles/ecology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. 1905. On the electrodynamics of moving bodies. Annalen der Physik 17:1\u201326. Dover Publications."
		},
		"http://www.zotero.org/styles/ecoscience": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A., 1905. On the electrodynamics of moving bodies. Annalen der Physik, 17: 1\u201326. Dover Publications."
		},
		"http://www.zotero.org/styles/elsevier-harvard-without-titles": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A., 1905. Annalen der Physik 17, 1\u201326."
		},
		"http://www.zotero.org/styles/elsevier-harvard": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A., 1905. On the electrodynamics of moving bodies. Annalen der Physik 17, 1\u201326."
		},
		"http://www.zotero.org/styles/elsevier-radiological": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "[1]  Einstein A (1905) On the electrodynamics of moving bodies. Annalen Der Physik 17(4):1\u201326"
		},
		"http://www.zotero.org/styles/elsevier-vancouver": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "[1]  Einstein A. On the electrodynamics of moving bodies. Annalen Der Physik 1905;17:1\u201326."
		},
		"http://www.zotero.org/styles/elsevier-with-titles": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "[1]  A. Einstein, On the electrodynamics of moving bodies, Annalen Der Physik. 17 (1905) 1\u201326."
		},
		"http://www.zotero.org/styles/elsevier-without-titles": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "[1]  A. Einstein, Annalen Der Physik 17 (1905) 1."
		},
		"http://www.zotero.org/styles/emerald-harvard": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905), \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd <i>Annalen der Physik</i>, Dover Publications, Vol. 17 No. 4, pp. 1\u201326."
		},
		"http://www.zotero.org/styles/entomologia-experimentalis-et-applicata": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein A (1905) On the electrodynamics of moving bodies. Annalen der Physik 17:1\u201326."
		},
		"http://www.zotero.org/styles/environmental-and-engineering-geoscience": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A., 1905, On the electrodynamics of moving bodies: <i>Annalen der Physik</i>, v. 17, no. 4, p. 1\u201326."
		},
		"http://www.zotero.org/styles/environmental-and-experimental-botany": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A., 1905. On the electrodynamics of moving bodies. Annalen der Physik 17, 1\u201326."
		},
		"http://www.zotero.org/styles/environmental-conservation": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein A. (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b><b>:</b> 1\u201326"
		},
		"http://www.zotero.org/styles/environmental-health-perspectives": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein A. 1905. On the electrodynamics of moving bodies. Annalen der Physik 17: 1\u201326."
		},
		"http://www.zotero.org/styles/environmental-microbiology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein,A. (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>: 1\u201326."
		},
		"http://www.zotero.org/styles/epidemiologie-et-sante-animale": {
			"statusMessage": "",
			"formattedCitations": [
				"[Einstein, 1905]"
			],
			"formattedBibliography": "Einstein A. - On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, 1905, <b>17</b> (4), 1\u201326."
		},
		"http://www.zotero.org/styles/ergoscience": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "[1] Einstein A. On the Electrodynamics of Moving Bodies. Annalen Der Physik 1905; 17(4): 1\u201326."
		},
		"http://www.zotero.org/styles/ethics-book-reviews": {
			"statusMessage": "",
			"formattedCitations": [
				"(Albert Einstein, \u00e2\u20ac\u0153On the Electrodynamics of Moving Bodies,\u00e2\u20ac\ufffd <i>Annalen Der Physik</i> 17, no. 4 [1905]: 1\u201326)"
			],
			"formattedBibliography": "(Albert Einstein, \u00e2\u20ac\u0153On the Electrodynamics of Moving Bodies,\u00e2\u20ac\ufffd <i>Annalen Der Physik</i> 17, no. 4 [1905]: 1\u201326)"
		},
		"http://www.zotero.org/styles/european-cells-and-materials": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein A (1905) On the electrodynamics of moving bodies. Annalen der Physik <b>17</b>: 1\u201326."
		},
		"http://www.zotero.org/styles/european-heart-journal": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. Annalen der Physik. Dover Publications; 1905;17(4):1\u201326. "
		},
		"http://www.zotero.org/styles/european-journal-of-neuroscience": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, <b>17</b>, 1\u201326."
		},
		"http://www.zotero.org/styles/european-journal-of-ophthalmology": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. Annalen der Physik. 1905; 17: 1\u201326. "
		},
		"http://www.zotero.org/styles/european-journal-of-soil-science": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>, 1\u201326."
		},
		"http://www.zotero.org/styles/european-retail-research": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905): On the electrodynamics of moving bodies, in: Annalen der Physik, Vol. 17, No. 4, pp. 1\u201326."
		},
		"http://www.zotero.org/styles/eye": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1. Einstein A. On the electrodynamics of moving bodies. Annalen der Physik. 1905; 17(4): 1\u201326."
		},
		"http://www.zotero.org/styles/fachhochschule-vorarlberg": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein\u00c2\u00a01905)"
			],
			"formattedBibliography": "Einstein, Albert\u00c2\u00a0(1905):\u00c2\u00a0\u00e2\u20ac\u017eOn the electrodynamics of moving bodies.\u00e2\u20ac\u0153 In:\u00c2\u00a0Annalen der Physik,\u00c2\u00a0Dover Publications17\u00c2\u00a0(1905),\u00c2\u00a04,\u00c2\u00a0pp.\u00c2\u00a01\u201326."
		},
		"http://www.zotero.org/styles/febs-journal": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1 Einstein A (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>, 1\u201326."
		},
		"http://www.zotero.org/styles/fems": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein A (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17: 1\u201326."
		},
		"http://www.zotero.org/styles/fish-and-fisheries": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>, 1\u201326."
		},
		"http://www.zotero.org/styles/french1": {
			"statusMessage": "",
			"formattedCitations": [
				" [1]"
			],
			"formattedBibliography": "[1] EINSTEIN A. \u00c2\u00ab\u00c2\u00a0On the electrodynamics of moving bodies\u00c2\u00a0\u00c2\u00bb. <i>Annalen der Physik</i>. 1905. Vol. 17, n\u00c2\u00b04, p.\u00c2\u00a01-26. "
		},
		"http://www.zotero.org/styles/french2": {
			"statusMessage": "",
			"formattedCitations": [
				" [1]"
			],
			"formattedBibliography": "[1] Einstein A. \u00c2\u00ab\u00c2\u00a0On the electrodynamics of moving bodies\u00c2\u00a0\u00c2\u00bb. <i>Annalen der Physik</i>. 1905. Vol. 17, n\u00c2\u00b04, p.\u00c2\u00a01-26. "
		},
		"http://www.zotero.org/styles/french3": {
			"statusMessage": "",
			"formattedCitations": [
				" (Einstein, 1905)"
			],
			"formattedBibliography": "EINSTEIN A. \u00c2\u00ab\u00c2\u00a0On the electrodynamics of moving bodies\u00c2\u00a0\u00c2\u00bb. <i>Annalen der Physik</i>. 1905. Vol. 17, n\u00c2\u00b04, p.\u00c2\u00a01-26. "
		},
		"http://www.zotero.org/styles/french4": {
			"statusMessage": "",
			"formattedCitations": [
				" (Einstein, 1905)"
			],
			"formattedBibliography": "Einstein A. \u00c2\u00ab\u00c2\u00a0On the electrodynamics of moving bodies\u00c2\u00a0\u00c2\u00bb. <i>Annalen der Physik</i>. 1905. Vol. 17, n\u00c2\u00b04, p.\u00c2\u00a01-26. "
		},
		"http://www.zotero.org/styles/freshwater-biology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein A. (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>, 1\u201326."
		},
		"http://www.zotero.org/styles/frontiers": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905). On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17, 1\u201326."
		},
		"http://www.zotero.org/styles/fungal-ecology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein A, 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>: 1\u201326."
		},
		"http://www.zotero.org/styles/future-medicine-journals": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>. 17(4), 1\u201326 (1905)."
		},
		"http://www.zotero.org/styles/gastroenterology": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. Annalen der Physik 1905;17:1\u201326."
		},
		"http://www.zotero.org/styles/genetics": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein A., 1905&#160;  On the electrodynamics of moving bodies. Annalen der Physik <b>17</b>: 1\u201326."
		},
		"http://www.zotero.org/styles/genome-biology-and-evolution": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein A. 1905. On the electrodynamics of moving bodies. Annalen der Physik. 17:1\u201326."
		},
		"http://www.zotero.org/styles/genome-biology": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1. Einstein A: <b>On the electrodynamics of moving bodies</b>. <i>Annalen der Physik</i> 1905, <b>17</b>:1\u201326."
		},
		"http://www.zotero.org/styles/geoderma": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A., 1905. On the electrodynamics of moving bodies. Annalen der Physik 17, 1\u201326."
		},
		"http://www.zotero.org/styles/geological-magazine": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>(4), 1\u201326."
		},
		"http://www.zotero.org/styles/geological-society-of-america": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A., 1905, On the electrodynamics of moving bodies: Annalen der Physik, v. 17, no. 4, p. 1\u201326."
		},
		"http://www.zotero.org/styles/geomorphology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905), On the electrodynamics of moving bodies, Annalen der Physik, 17(4), 1\u201326."
		},
		"http://www.zotero.org/styles/geopolitics": {
			"statusMessage": "",
			"formattedCitations": [
				"A. Einstein, \u00e2\u20ac\u02dcOn the Electrodynamics of Moving Bodies\u00e2\u20ac<sup>TM</sup>, <i>Annalen Der Physik</i>, 17 (1905)."
			],
			"formattedBibliography": "A. Einstein, \u00e2\u20ac\u02dcOn the Electrodynamics of Moving Bodies\u00e2\u20ac<sup>TM</sup>, <i>Annalen Der Physik</i>, 17 (1905)."
		},
		"http://www.zotero.org/styles/global-ecology-and-biogeography": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, <b>17</b>, 1\u201326."
		},
		"http://www.zotero.org/styles/gost-r-7-0-5-2008-csl-1-0": {
			"statusMessage": "",
			"formattedCitations": [
				"[Einstein, 1905]"
			],
			"formattedBibliography": "1. Einstein A. On the electrodynamics of moving bodies // Annalen der Physik. 1905. \u00d0\u00a2. 17. \u00e2\u201e\u2013 4. \u00d0\u00a1. 1\u201326."
		},
		"http://www.zotero.org/styles/gost-r-7-0-5-2008-numeric": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies // Annalen der Physik. Dover Publications, 1905. Vol. 17, \u00e2\u201e\u2013 4. P. 1\u201326."
		},
		"http://www.zotero.org/styles/gost-r-7-0-5-2008": {
			"statusMessage": "",
			"formattedCitations": [
				"[Einstein, 1905]"
			],
			"formattedBibliography": "1. Einstein A. On the electrodynamics of moving bodies. // Annalen der Physik. 1905. \u00e2\u201e\u2013 17. \u00d0\u00a1. 1\u201326."
		},
		"http://www.zotero.org/styles/graefes-archive-clinical-and-experimental-ophthalmology": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1.  Einstein A (1905) On the electrodynamics of moving bodies. Annalen der Physik Dover Publications 17:1\u201326"
		},
		"http://www.zotero.org/styles/harvard-anglia-ruskin": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A., 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, 17(4), pp.1\u201326."
		},
		"http://www.zotero.org/styles/harvard-cardiff-university": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17(4), p.pp. 1\u201326."
		},
		"http://www.zotero.org/styles/harvard-european-archaeology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17(4): p.1\u201326."
		},
		"http://www.zotero.org/styles/harvard-imperial-college-london": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i>. 17 (4), 1\u201326."
		},
		"http://www.zotero.org/styles/harvard-institut-fur-praxisforschung-de": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, Albert (1905): \u00e2\u20ac\u017eOn the electrodynamics of moving bodies\u00e2\u20ac\u0153. In: <i>Annalen der Physik</i>. Dover Publications 17 (4), pp. 1\u201326."
		},
		"http://www.zotero.org/styles/harvard-kings-college-london": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i>. 17 (4), 1\u201326."
		},
		"http://www.zotero.org/styles/harvard-leeds-metropolitan-university": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, 17 (4), pp.1\u201326."
		},
		"http://www.zotero.org/styles/harvard-limerick": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905) \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd <i>Annalen der Physik</i>, 17(4), 1\u201326."
		},
		"http://www.zotero.org/styles/harvard-manchester-business-school": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905). On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, 17(4), pp.1\u201326."
		},
		"http://www.zotero.org/styles/harvard-sheffield": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905). On the Electrodynamics of Moving Bodies. <i>Annalen der Physik</i>, 17(4), 1\u201326."
		},
		"http://www.zotero.org/styles/harvard-sheffield1": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, Albert (1905), On the Electrodynamics of Moving Bodies. <i>Annalen der Physik</i>, 17(4): 1\u201326."
		},
		"http://www.zotero.org/styles/harvard-staffordshire-university": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905). On the electrodynamics of moving bodies. <i>Annalen der Physik</i>. 17 (4). p.pp. 1\u201326."
		},
		"http://www.zotero.org/styles/harvard-university-of-leeds": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, <b>17</b>(4), pp.1\u201326."
		},
		"http://www.zotero.org/styles/harvard-university-of-sunderland": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905). On the electrodynamics of moving bodies. <i>Annalen der Physik</i>. 17 (4). p.pp. 1\u201326."
		},
		"http://www.zotero.org/styles/harvard-university-of-the-west-of-england": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i>. 17 (4), 1\u201326."
		},
		"http://www.zotero.org/styles/harvard-university-of-wolverhampton": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905) \u00e2\u20ac\u02dcOn the electrodynamics of moving bodies\u00e2\u20ac<sup>TM</sup>, <i>Annalen der Physik</i>, Dover Publications, 17(4), pp. 1\u201326."
		},
		"http://www.zotero.org/styles/harvard1-unisa-gbfe": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, Albert 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17, 4, 1\u201326."
		},
		"http://www.zotero.org/styles/harvard1": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A., 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, 17(4), pp.1\u201326."
		},
		"http://www.zotero.org/styles/harvard1de": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A., 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, 17(4), Pp. 1\u201326."
		},
		"http://www.zotero.org/styles/harvard3": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A 1905, \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd <i>Annalen der Physik</i>, vol. 17, no. 4, Dover Publications, pp. 1\u201326."
		},
		"http://www.zotero.org/styles/harvard7de": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, Albert (1905): \u00e2\u20ac\u017eOn the electrodynamics of moving bodies\u00e2\u20ac\u0153. In: <i>Annalen der Physik</i>. Dover Publications 17 (4), pp.\u00c2\u00a01\u201326."
		},
		"http://www.zotero.org/styles/hawaii-international-conference-on-system-sciences-proceedings": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "[1] Einstein, A. On the electrodynamics of moving bodies. <i>Annalen der Physik 17</i>, 4 (1905), 1\u201326."
		},
		"http://www.zotero.org/styles/health-services-research": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein. 1905. \u00e2\u20ac\u0153On the Electrodynamics of Moving Bodies.\u00e2\u20ac\ufffd <i>Annalen der Physik</i> 17(4): 1\u201326."
		},
		"http://www.zotero.org/styles/hepatology": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. Annalen der Physik. 1905;17:1\u201326. "
		},
		"http://www.zotero.org/styles/heredity": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein A (1905). On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>: 1\u201326."
		},
		"http://www.zotero.org/styles/history-and-theory": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd <i>Annalen der Physik</i> (Dover Publications, 1905), 17: 4, 1\u201326."
			],
			"formattedBibliography": "Albert Einstein, \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd <i>Annalen der Physik</i> (Dover Publications, 1905), 17: 4, 1\u201326."
		},
		"http://www.zotero.org/styles/history-of-the-human-sciences": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905) \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd <i>Annalen der Physik</i>. Dover Publications 17: 1\u201326."
		},
		"http://www.zotero.org/styles/hong-kong-journal-of-radiology": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. Annalen der Physik. 1905;17:1\u201326. "
		},
		"http://www.zotero.org/styles/hormone-and-metabolic-research": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "<sup>1</sup> <i>Einstein A. </i>On the electrodynamics of moving bodies. Annalen der Physik 1905; 17: 1\u201326"
		},
		"http://www.zotero.org/styles/human-resource-management-journal": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905). 'On the electrodynamics of moving bodies', <i>Annalen der Physik</i>, 17: 4, 1\u201326, Dover Publications."
		},
		"http://www.zotero.org/styles/hwr-berlin": {
			"statusMessage": "",
			"formattedCitations": [
				"Einstein, Albert (1905)."
			],
			"formattedBibliography": "<b>Einstein, Albert (<b>1905</b>):</b> On the electrodynamics of moving bodies<i> In: </i><i>Annalen der Physik</i>, Band 17, Ausgabe 4, 1905, S. 1\u201326."
		},
		"http://www.zotero.org/styles/hydrogeology-journal": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein A (1905) On the electrodynamics of moving bodies. Annalen der Physik Dover Publications, 17(4): 1\u201326"
		},
		"http://www.zotero.org/styles/hydrological-sciences-journal": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>(4), 1\u201326. Dover Publications."
		},
		"http://www.zotero.org/styles/hypotheses-in-the-life-sciences": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "[1] Einstein A. On the electrodynamics of moving bodies. <i>Annalen der Physik, </i>(1905) 17(4), 1\u201326. "
		},
		"http://www.zotero.org/styles/ieee-w-url": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "[1]  A. Einstein, \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd <i>Annalen der Physik</i>, vol. 17, 1905, pp. 1\u201326."
		},
		"http://www.zotero.org/styles/ieee": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "[1]  A. Einstein, \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd <i>Annalen der Physik</i>, vol. 17, no. 4, pp. 1\u201326, 1905."
		},
		"http://www.zotero.org/styles/inflammatory-bowel-diseases": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>. 1905;17:1\u201326."
		},
		"http://www.zotero.org/styles/information-communication-and-society": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905) \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd <i>Annalen der Physik</i>, vol. 17, no. 4, pp. 1\u201326."
		},
		"http://www.zotero.org/styles/institute-of-physics-harvard": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein A 1905 On the electrodynamics of moving bodies <i>Annalen der Physik</i> <b>17</b> 1\u201326"
		},
		"http://www.zotero.org/styles/institute-of-physics-numeric": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "[1]  Einstein A 1905 On the electrodynamics of moving bodies <i>Annalen der Physik</i> <b>17</b> 1\u201326"
		},
		"http://www.zotero.org/styles/inter-research-science-center": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein A (1905) On the electrodynamics of moving bodies. Annalen der Physik 17:1\u201326"
		},
		"http://www.zotero.org/styles/inter-ro": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, \u00e2\u20ac\u0153On the electrodynamics of moving bodies\u00e2\u20ac\ufffd, <i>Annalen der Physik</i> 17, 4 (1905), Dover Publications."
			],
			"formattedBibliography": "Einstein, Albert, \u00e2\u20ac\u0153On the electrodynamics of moving bodies\u00e2\u20ac\ufffd, <i>Annalen der Physik</i> 17, 4 (1905), Dover Publications, pp. 1\u201326."
		},
		"http://www.zotero.org/styles/international-journal-of-audiology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A., 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, 17(4), p.1\u201326."
		},
		"http://www.zotero.org/styles/international-journal-of-cancer": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. <i>Annalen der Physik </i>1905;17:1\u201326. "
		},
		"http://www.zotero.org/styles/international-journal-of-exercise-science": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. Annalen der Physik 17: 1\u201326, 1905."
		},
		"http://www.zotero.org/styles/international-journal-of-hydrogen-energy": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "[1]  Einstein A. On the electrodynamics of moving bodies. Annalen Der Physik 1905;17(4):1\u201326."
		},
		"http://www.zotero.org/styles/international-journal-of-production-economics": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A., 1905. On the electrodynamics of moving bodies. Annalen der Physik, 17(4), 1\u201326."
		},
		"http://www.zotero.org/styles/international-journal-of-radiation-oncology-biology-physics": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1. Einstein A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>. 1905;17:1\u201326."
		},
		"http://www.zotero.org/styles/international-journal-of-solids-and-structures": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A., 1905. On the electrodynamics of moving bodies. Annalen der Physik, 17(4), pp.1\u201326."
		},
		"http://www.zotero.org/styles/international-organization": {
			"statusMessage": "",
			"formattedCitations": [
				"Einstein 1905."
			],
			"formattedBibliography": "Einstein, Albert. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b> (4). Dover Publications: 1\u201326."
		},
		"http://www.zotero.org/styles/international-pig-veterinary-society-congress-proceedings": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1. Einstein, A. (1905). Annalen der Physik, 17, 1\u201326"
		},
		"http://www.zotero.org/styles/international-studies-association": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, Albert. (1905) On the Electrodynamics of Moving Bodies. <i>Annalen der Physik</i> 17: 1\u201326."
		},
		"http://www.zotero.org/styles/investigative-radiology": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1. Einstein A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>. 1905;17(4):1\u201326."
		},
		"http://www.zotero.org/styles/invisu": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, \u00c2\u00ab\u00c2\u00a0On the electrodynamics of moving bodies\u00c2\u00a0\u00c2\u00bb, <i>Annalen der Physik</i>, vol.\u00c2\u00a017, no.\u00c2\u00a04, 1905, Dover Publications, p.\u00c2\u00a01-26."
			],
			"formattedBibliography": "Einstein Albert, \u00c2\u00ab\u00c2\u00a0On the electrodynamics of moving bodies\u00c2\u00a0\u00c2\u00bb, <i>Annalen der Physik</i>, vol.\u00c2\u00a017, no.\u00c2\u00a04, 1905, Dover Publications, p.\u00c2\u00a01-26."
		},
		"http://www.zotero.org/styles/irish-historical-studies": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, \u00e2\u20ac\u02dcOn the electrodynamics of moving bodies\u00e2\u20ac\u2122 in <i>Annalen der Physik</i>, xvii, no. 4 (1905), pp 1\u201326."
			],
			"formattedBibliography": "Einstein, Albert, \u00e2\u20ac\u02dcOn the electrodynamics of moving bodies\u00e2\u20ac\u2122 in <i>Annalen der Physik</i>, xvii, no. 4 (1905), pp 1\u201326"
		},
		"http://www.zotero.org/styles/iso690-author-date-en": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "\n\n    <div class=\"csl-block\">EINSTEIN, Albert, 1905. On the electrodynamics of moving bodies. In: <i>Annalen der Physik</i>. 1905. Vol.\u00c2\u00a017, no.\u00c2\u00a04, pp.\u00c2\u00a01\u201326. </div>\n\n\n    <div class=\"csl-block\">General description of special relativity</div>\n"
		},
		"http://www.zotero.org/styles/iso690-author-date-fr": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "\n\n    <div class=\"csl-block\">EINSTEIN, Albert, 1905. On the electrodynamics of moving bodies. In\u00c2\u00a0: <i>Annalen der Physik</i>. 1905. Vol.\u00c2\u00a017, n\u00c2\u00b0\u00c2\u00a04, pp.\u00c2\u00a01-26. </div>\n\n\n    <div class=\"csl-block\">General description of special relativity</div>\n"
		},
		"http://www.zotero.org/styles/iso690-author-date": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, Albert. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17, 1905, 1\u201326."
		},
		"http://www.zotero.org/styles/iso690-numeric-en": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1.  EINSTEIN, Albert. On the electrodynamics of moving bodies. In: <i>Annalen der Physik</i>. 1905, Vol.\u00c2\u00a017, no.\u00c2\u00a04, pp.\u00c2\u00a01\u201326. General description of special relativity"
		},
		"http://www.zotero.org/styles/iso690-numeric-fr": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1.  EINSTEIN, Albert. On the electrodynamics of moving bodies. In\u00c2\u00a0: <i>Annalen der Physik</i>. 1905, Vol.\u00c2\u00a017, n\u00c2\u00b0\u00c2\u00a04, pp.\u00c2\u00a01-26. General description of special relativity"
		},
		"http://www.zotero.org/styles/iso690-numeric-sk": {
			"statusMessage": "Citeproc initialisation exception: TypeError: Cannot call method \"attribute\" of undefined",
			"formattedCitations": [],
			"formattedBibliography": ""
		},
		"http://www.zotero.org/styles/javnost-the-public": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, Albert. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17, 4, 1\u201326."
		},
		"http://www.zotero.org/styles/journal-of-agricultural-and-food-chemistry": {
			"statusMessage": "",
			"formattedCitations": [
				"<i>(1)</i>"
			],
			"formattedBibliography": "(1)  Einstein, A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>1905</b>, <i>17</i>, 1\u201326."
		},
		"http://www.zotero.org/styles/journal-of-alzheimers-disease": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "[1]  Einstein A (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>, 1\u201326."
		},
		"http://www.zotero.org/styles/journal-of-applied-animal-science": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein A. On the electrodynamics of moving bodies. Annalen der Physik. Dover Publications; 1905;17(4):1\u201326. "
		},
		"http://www.zotero.org/styles/journal-of-applied-ecology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, <b>17</b>, 1\u201326."
		},
		"http://www.zotero.org/styles/journal-of-biological-chemistry": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1.  Einstein, A. (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>, 1\u201326"
		},
		"http://www.zotero.org/styles/journal-of-biomolecular-structure-and-dynamics": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1.  A. Einstein. <i>Annalen Der Physik</i> <i>17</i>, 1\u201326 (1905)."
		},
		"http://www.zotero.org/styles/journal-of-chemical-ecology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "EINSTEIN, A. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17:1\u201326. Dover Publications."
		},
		"http://www.zotero.org/styles/journal-of-clinical-investigation": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1. Einstein A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>. 1905;17(4):1\u201326."
		},
		"http://www.zotero.org/styles/journal-of-clinical-oncology": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "<b>1</b>. Einstein A: On the electrodynamics of moving bodies. Annalen der Physik 17:1\u201326, 1905"
		},
		"http://www.zotero.org/styles/journal-of-community-health": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1. Einstein, A. (1905). On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, <i>17</i>(4), 1\u201326. Dover Publications."
		},
		"http://www.zotero.org/styles/journal-of-dental-research": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein A (1905). On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17:1\u201326."
		},
		"http://www.zotero.org/styles/journal-of-elections-public-opinion-and-parties": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, Albert. (1905) \u00e2\u20ac\u0153On the electrodynamics of moving bodies.\u00e2\u20ac\ufffd <i>Annalen der Physik</i> 17:1\u201326."
		},
		"http://www.zotero.org/styles/journal-of-evolutionary-biology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>: 1\u201326. Dover Publications."
		},
		"http://www.zotero.org/styles/journal-of-field-ornithology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. 1905. On the electrodynamics of moving bodies. Annalen der Physik 17: 1\u201326. Dover Publications."
		},
		"http://www.zotero.org/styles/journal-of-fish-diseases": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein A. (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>, 1\u201326."
		},
		"http://www.zotero.org/styles/journal-of-food-protection": {
			"statusMessage": "",
			"formattedCitations": [
				"(<i>1</i>)"
			],
			"formattedBibliography": "1.  Einstein, A. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>. Dover Publications 17:1\u201326."
		},
		"http://www.zotero.org/styles/journal-of-forensic-sciences": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1.  Einstein A.&#160; On the electrodynamics of moving bodies.&#160; Annalen der Physik&#160; 1905;17(4):1\u201326. "
		},
		"http://www.zotero.org/styles/journal-of-geography-in-higher-education": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905). On the electrodynamics of moving bodies, <i>Annalen der Physik</i>, 17(4), pp. 1\u201326 (Dover Publications)."
		},
		"http://www.zotero.org/styles/journal-of-health-economics": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein A. On the electrodynamics of moving bodies. Annalen Der Physik 1905; 17; 1\u201326."
		},
		"http://www.zotero.org/styles/journal-of-hellenic-studies": {
			"statusMessage": "",
			"formattedCitations": [
				"Einstein (1905)"
			],
			"formattedBibliography": "Einstein, A. (1905) \u00e2\u20ac\u02dcOn the electrodynamics of moving bodies\u00e2\u20ac\u2122, <i>Annalen der Physik</i> 17, 1\u201326"
		},
		"http://www.zotero.org/styles/journal-of-hepatology": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "[1] Einstein A. On the electrodynamics of moving bodies. Annalen der Physik. 1905;17:1\u201326. "
		},
		"http://www.zotero.org/styles/journal-of-management-information-systems": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1. Einstein, A. On the electrodynamics of moving bodies. <i>Annalen der Physik 17</i>, 4 (1905), 1\u201326."
		},
		"http://www.zotero.org/styles/journal-of-marketing": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, Albert (1905), \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd <i>Annalen der Physik</i>, Dover Publications, 17(4), 1\u201326."
		},
		"http://www.zotero.org/styles/journal-of-molecular-biology": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1. Einstein, A. (1905). On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>, 1\u201326"
		},
		"http://www.zotero.org/styles/journal-of-molecular-endocrinology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein A 1905 On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b> 1\u201326."
		},
		"http://www.zotero.org/styles/journal-of-neurophysiology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "<b>Einstein A</b>. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17: 1\u201326, 1905."
		},
		"http://www.zotero.org/styles/journal-of-neurosurgery": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1. Einstein A: On the electrodynamics of moving bodies. <b>Annalen der Physik</b> <b>17</b>:1\u201326, 1905"
		},
		"http://www.zotero.org/styles/journal-of-orthopaedic-trauma": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. Annalen der Physik. 1905;17(4):1\u201326. "
		},
		"http://www.zotero.org/styles/journal-of-pollination-ecology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein A (1905) On the electrodynamics of moving bodies. Annalen der Physik 17:1\u201326."
		},
		"http://www.zotero.org/styles/journal-of-pragmatics": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, Albert. 1905. \u00e2\u20ac\u0153On the electrodynamics of moving bodies.\u00e2\u20ac\ufffd <i>Annalen der Physik</i> 17 (4), 1\u201326."
		},
		"http://www.zotero.org/styles/journal-of-psychiatry-and-neuroscience": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> Dover Publications; 1905;17:1\u201326. "
		},
		"http://www.zotero.org/styles/journal-of-shoulder-and-elbow-surgery": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. Annalen der Physik. 1905;17(4):1\u201326. "
		},
		"http://www.zotero.org/styles/journal-of-social-archaeology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905) \u00e2\u20ac\u02dcOn the Electrodynamics of Moving Bodies\u00e2\u20ac<sup>TM</sup>, <i>Annalen der Physik</i> 17(4):1\u201326."
		},
		"http://www.zotero.org/styles/journal-of-studies-on-alcohol-and-drugs": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905). On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, <i>17</i>(4), 1\u201326. Dover Publications."
		},
		"http://www.zotero.org/styles/journal-of-the-academy-of-nutrition-and-dietetics": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1. Einstein A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>. 1905;17(4):1\u201326."
		},
		"http://www.zotero.org/styles/journal-of-the-air-and-waste-management-association": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1.  Einstein, A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>1905</b>, <i>17</i>, 1\u201326."
		},
		"http://www.zotero.org/styles/journal-of-the-american-college-of-cardiology": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1. Einstein A. On the electrodynamics of moving bodies. Annalen der Physik 1905;17(4):1\u201326."
		},
		"http://www.zotero.org/styles/journal-of-the-american-society-of-nephrology": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1.  Einstein A: On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17: 1\u201326, 1905"
		},
		"http://www.zotero.org/styles/journal-of-the-american-water-resources-association": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A., 1905. On the Electrodynamics of Moving Bodies. Annalen Der Physik 17:1\u201326."
		},
		"http://www.zotero.org/styles/journal-of-the-royal-anthropological-institute": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>, 1\u201326."
		},
		"http://www.zotero.org/styles/journal-of-the-torrey-botanical-society": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. 1905. On the electrodynamics of moving bodies. Annalen der Physik 17:1\u201326. Dover Publications."
		},
		"http://www.zotero.org/styles/journal-of-tropical-ecology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "EINSTEIN, A. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17:1\u201326. Dover Publications."
		},
		"http://www.zotero.org/styles/journal-of-vertebrate-paleontology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. 1905. On the electrodynamics of moving bodies. Annalen Der Physik 17:1\u201326."
		},
		"http://www.zotero.org/styles/journal-of-wildlife-diseases": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. 1905. On the electrodynamics of moving bodies. Dover Publications. Annalen der Physik 17: 1\u201326."
		},
		"http://www.zotero.org/styles/journal-of-wildlife-management": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. 1905. On the electrodynamics of moving bodies. Annalen der Physik 17:1\u201326. Dover Publications."
		},
		"http://www.zotero.org/styles/journalistica": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, Albert (1905). On the electrodynamics of moving bodies, <i>Annalen der Physik</i>, 17. \u00c3\u00a5rgang, s. 1\u201326."
		},
		"http://www.zotero.org/styles/juristische-zitierweise-deutsch": {
			"statusMessage": "",
			"formattedCitations": [
				"<i>Einstein</i>, Annalen der Physik 1905, "
			],
			"formattedBibliography": "<i>Einstein, Albert</i> , On the electrodynamics of moving bodies, Annalen der Physik 1905, 1\u201326."
		},
		"http://www.zotero.org/styles/karger-journals-author-date": {
			"statusMessage": "",
			"formattedCitations": [
				"[Einstein, 1905]"
			],
			"formattedBibliography": "Einstein A: On the electrodynamics of moving bodies. Annalen der Physik 1905;17:1\u201326. "
		},
		"http://www.zotero.org/styles/karger-journals": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1.  Einstein A: On the electrodynamics of moving bodies. Annalen der Physik 1905;17:1\u201326. "
		},
		"http://www.zotero.org/styles/knee-surgery-sports-traumatology-arthroscopy": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1.  Einstein A (1905) On the electrodynamics of moving bodies. Annalen der Physik Dover Publications 17:1\u201326"
		},
		"http://www.zotero.org/styles/kolner-zeitschrift-fur-soziologie-und-sozialpsychologie": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, Albert. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17: 1\u201326."
		},
		"http://www.zotero.org/styles/kritische-ausgabe": {
			"statusMessage": "",
			"formattedCitations": [
				"Einstein, Albert: On the electrodynamics of moving bodies. In: Annalen der Physik 17/4 (1905). Pp. 1\u201326."
			],
			"formattedBibliography": "Einstein, Albert: On the electrodynamics of moving bodies. In: Annalen der Physik 17/4 (1905). Pp. 1\u201326."
		},
		"http://www.zotero.org/styles/lancet": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1 Einstein A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 1905; <b>17</b>: 1\u201326."
		},
		"http://www.zotero.org/styles/language-in-society": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, Albert (1905). On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, 17(4), p.1\u201326."
		},
		"http://www.zotero.org/styles/language": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, Albert. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17. Dover Publications.1\u201326."
		},
		"http://www.zotero.org/styles/law1-de": {
			"statusMessage": "",
			"formattedCitations": [
				"Einstein, \u00e2\u20ac\u017eOn the electrodynamics of moving bodies\u00e2\u20ac\u0153."
			],
			"formattedBibliography": "<i>Einstein, Albert</i>\n\u00e2\u20ac\u017eOn the electrodynamics of moving bodies\u00e2\u20ac\u0153. <i>Annalen der Physik</i> 17, no. 4 (1905): 1\u201326."
		},
		"http://www.zotero.org/styles/les-journees-de-la-recherche-porcine": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein A., 1905. On the electrodynamics of moving bodies. Annalen der Physik, 17, 1-26."
		},
		"http://www.zotero.org/styles/lettres-et-sciences-humaines-fr": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, \u00c2\u00ab\u00c2\u00a0On the electrodynamics of moving bodies\u00c2\u00a0\u00c2\u00bb, <i>Annalen der Physik</i>, vol.\u00c2\u00a017\u00c2\u00a0/\u00c2\u00a04, Dover Publications, 1905, p.\u00c2\u00a01-26."
			],
			"formattedBibliography": "EINSTEIN, Albert, \u00c2\u00ab\u00c2\u00a0On the electrodynamics of moving bodies\u00c2\u00a0\u00c2\u00bb, <i>Annalen der Physik</i>, vol.\u00c2\u00a017\u00c2\u00a0/\u00c2\u00a04, Dover Publications, 1905, p.\u00c2\u00a01-26."
		},
		"http://www.zotero.org/styles/leviathan": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, Albert, 1905: On the electrodynamics of moving bodies, in: Annalen der Physik 4/17, pp. 1\u201326."
		},
		"http://www.zotero.org/styles/lichenologist": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>: 1\u201326."
		},
		"http://www.zotero.org/styles/limnology-and-oceanography": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. 1905. On the electrodynamics of moving bodies. Annalen der Physik <b>17</b>: 1\u201326."
		},
		"http://www.zotero.org/styles/lncs": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1.  Einstein, A.: On the electrodynamics of moving bodies. Annalen der Physik. 17, 1\u201326 (1905)."
		},
		"http://www.zotero.org/styles/lncs2": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1. Einstein, A.: On the electrodynamics of moving bodies. Annalen der Physik. 17, 4, 1\u201326 (1905)."
		},
		"http://www.zotero.org/styles/mammal-review": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein A (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17: 1\u201326."
		},
		"http://www.zotero.org/styles/manchester-university-press": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, \u00e2\u20ac\u02dcOn the electrodynamics of moving bodies\u00e2\u20ac<sup>TM</sup>, <i>Annalen der Physik</i>, 17:4 (1905), pp. 1\u201326."
			],
			"formattedBibliography": "Albert Einstein, \u00e2\u20ac\u02dcOn the electrodynamics of moving bodies\u00e2\u20ac<sup>TM</sup>, <i>Annalen der Physik</i>, 17:4 (1905), pp. 1\u201326."
		},
		"http://www.zotero.org/styles/marine-policy": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "[1]  Einstein A. On the electrodynamics of moving bodies. Annalen Der Physik 1905; 17: 1\u201326."
		},
		"http://www.zotero.org/styles/mbio": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1.  <b>Einstein, A.</b> 1905. On the electrodynamics of moving bodies. Annalen der Physik. Dover Publications <b>17</b>:1\u201326."
		},
		"http://www.zotero.org/styles/mcgill-guide-v7": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, \u00e2\u20ac\u0153On the electrodynamics of moving bodies\u00e2\u20ac\ufffd (1905) 17:4 Annalen der Physik 1."
			],
			"formattedBibliography": "Einstein, Albert. \u00e2\u20ac\u0153On the electrodynamics of moving bodies\u00e2\u20ac\ufffd (1905) 17:4 Annalen der Physik 1."
		},
		"http://www.zotero.org/styles/mcgill-legal": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "Albert Einstein.\"On the electrodynamics of moving bodies\"(1905)17Annalen der Physik1\u201326"
		},
		"http://www.zotero.org/styles/mcrj7": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, \u00c2\u00ab\u00c2\u00a0On the electrodynamics of moving bodies\u00c2\u00a0\u00c2\u00bb (1905) 17\u00c2\u00a0: 4 Annalen der Physik 1-26."
			],
			"formattedBibliography": "Einstein, Albert, \u00c2\u00ab\u00c2\u00a0On the electrodynamics of moving bodies\u00c2\u00a0\u00c2\u00bb (1905) 17\u00c2\u00a0: 4 Annalen der Physik 1-26."
		},
		"http://www.zotero.org/styles/medecine-sciences": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 1905 ; 17 : 1\u201326."
		},
		"http://www.zotero.org/styles/media-culture-and-society": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905) 'On the electrodynamics of moving bodies', <i>Annalen der Physik</i>, 17: 1\u201326."
		},
		"http://www.zotero.org/styles/medicine-and-science-in-sports-and-exercise": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. Annalen der Physik 1905;17(4):1\u201326."
		},
		"http://www.zotero.org/styles/metabolic-engineering": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A., 1905. On the electrodynamics of moving bodies. Annalen der Physik 17, 1\u201326."
		},
		"http://www.zotero.org/styles/metallurgical-and-materials-transactions": {
			"statusMessage": "",
			"formattedCitations": [
				"\u00c2\u00a0[1]"
			],
			"formattedBibliography": "[1]  Albert Einstein: <i>Annalen Der Physik</i>, 1905, vol.\u00c2\u00a017, pp.\u00c2\u00a01\u201326."
		},
		"http://www.zotero.org/styles/meteoritics-and-planetary-science": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein A. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17: 1\u201326."
		},
		"http://www.zotero.org/styles/methods-information-medicine": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1. Einstein A. On the electrodynamics of moving bodies. Annalen der Physik 1905;17 (4):1\u201326."
		},
		"http://www.zotero.org/styles/mhra": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, \u00e2\u20ac\u02dcOn the Electrodynamics of Moving Bodies\u00e2\u20ac<sup>TM</sup>, <i>Annalen Der Physik</i>, 17 (1905), 1\u201326."
			],
			"formattedBibliography": "Einstein, Albert, \u00e2\u20ac\u02dcOn the Electrodynamics of Moving Bodies\u00e2\u20ac<sup>TM</sup>, <i>Annalen Der Physik</i>, 17 (1905), 1\u201326"
		},
		"http://www.zotero.org/styles/microbial-ecology": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1.  Einstein A (1905) On the electrodynamics of moving bodies. Annalen der Physik 17: 1\u201326"
		},
		"http://www.zotero.org/styles/microscopy-and-microanalysis": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905). On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>, 1\u201326."
		},
		"http://www.zotero.org/styles/mis-quarterly": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. 1905. \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd <i>Annalen der Physik</i> (17:4)Dover Publications, pp. 1\u201326."
		},
		"http://www.zotero.org/styles/mla-notes": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd <i>Annalen der Physik</i> 17.4 (1905): 1\u201326."
			],
			"formattedBibliography": "Einstein, Albert. \u00e2\u20ac\u0153On the electrodynamics of moving bodies.\u00e2\u20ac\ufffd <i>Annalen der Physik</i> 17.4 (1905): 1\u201326."
		},
		"http://www.zotero.org/styles/mla-underline": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein)"
			],
			"formattedBibliography": "Einstein, Albert. \u00e2\u20ac\u0153On the electrodynamics of moving bodies.\u00e2\u20ac\ufffd Annalen der Physik 17.4 (1905): 1\u201326."
		},
		"http://www.zotero.org/styles/mla-url": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein)"
			],
			"formattedBibliography": "Einstein, Albert. \u00e2\u20ac\u0153On the Electrodynamics of Moving Bodies.\u00e2\u20ac\ufffd <i>Annalen Der Physik</i> 17.4 (1905) : 1\u201326. Print."
		},
		"http://www.zotero.org/styles/mla": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein)"
			],
			"formattedBibliography": "Einstein, Albert. \u00e2\u20ac\u0153On the Electrodynamics of Moving Bodies.\u00e2\u20ac\ufffd <i>Annalen der Physik</i> 17.4 (1905): 1\u201326. Print."
		},
		"http://www.zotero.org/styles/molecular-biochemical-parasitology": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "[1] Einstein A. On the electrodynamics of moving bodies. Annalen der Physik 1905; 17: 1\u201326."
		},
		"http://www.zotero.org/styles/molecular-biology-and-evolution": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein A. 1905. On the electrodynamics of moving bodies. Annalen der Physik 17:1\u201326."
		},
		"http://www.zotero.org/styles/mol-eco": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein A (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, <b>17</b>, 1\u201326."
		},
		"http://www.zotero.org/styles/molecular-psychiatry-letters": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1.  Einstein A. <i>Annalen der Physik</i> 1905; <b>17</b>: 1\u201326. "
		},
		"http://www.zotero.org/styles/molecular-psychiatry": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 1905; <b>17</b>: 1\u201326. "
		},
		"http://www.zotero.org/styles/molecular-therapy": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1. Einstein, A (1905). On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>: 1\u201326."
		},
		"http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1. Einstein, A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>1905</b>, <i>17</i>, 1\u201326."
		},
		"http://www.zotero.org/styles/multiple-sclerosis-journal": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1. <b>Einstein A</b>. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>. 1905; <b>17</b>(4):1\u201326."
		},
		"http://www.zotero.org/styles/nano-biomedicine-and-engineering": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. Annalen der Physik. 1905; 17(4):1\u201326. "
		},
		"http://www.zotero.org/styles/nanotechnology": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "[1] Einstein A 1905 <i>Annalen der Physik</i> <b>17</b> 1\u201326 "
		},
		"http://www.zotero.org/styles/national-archives-of-australia": {
			"statusMessage": "",
			"formattedCitations": [
				"[CSL STYLE ERROR: reference with no printed form.]"
			],
			"formattedBibliography": "National Archives of Australia: \u00e2\u20ac\u02dcOn the electrodynamics of moving bodies\u00e2\u20ac<sup>TM</sup>, 1905."
		},
		"http://www.zotero.org/styles/national-library-of-medicine-grant": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. Annalen der Physik. Dover Publications; 1905;17(4):1\u201326. "
		},
		"http://www.zotero.org/styles/nature-neuroscience-brief-communication": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1. Einstein, A. <i>Annalen der Physik</i> <b>17</b>, 1\u201326 (1905)."
		},
		"http://www.zotero.org/styles/nature-no-superscript": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1. Einstein, A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>, 1\u201326 (1905)."
		},
		"http://www.zotero.org/styles/nature": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1. Einstein, A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>, 1\u201326 (1905)."
		},
		"http://www.zotero.org/styles/neuropsychologia": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905). On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, <i>17</i>(4), 1\u201326. Dover Publications."
		},
		"http://www.zotero.org/styles/neuropsychopharmacology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein A (1905). On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>: 1\u201326."
		},
		"http://www.zotero.org/styles/neuroreport": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 1905; <b>17</b> (<b>4</b>): 1\u201326."
		},
		"http://www.zotero.org/styles/neuroscience-letters": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "[1]  A. Einstein, On the electrodynamics of moving bodies, Annalen Der Physik. 17 (1905) 1\u201326."
		},
		"http://www.zotero.org/styles/neuroscience-research": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A., 1905. On the electrodynamics of moving bodies. Annalen der Physik 17, 1\u201326."
		},
		"http://www.zotero.org/styles/new-england-journal-of-medicine": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. Annalen der Physik 1905;17(4):1\u201326. "
		},
		"http://www.zotero.org/styles/new-phytologist": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "<b><b>Einstein A</b></b>. <b>1905</b>. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>: 1\u201326."
		},
		"http://www.zotero.org/styles/new-zealand-plant-protection": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein A 1905. On the electrodynamics of moving bodies. Dover Publications. Annalen der Physik 17: 1\u201326."
		},
		"http://www.zotero.org/styles/northeastern-naturalist": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. 1905. On the electrodynamics of moving bodies. Annalen der Physik 17:1\u201326. Dover Publications."
		},
		"http://www.zotero.org/styles/nucleic-acids-research": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1. Einstein,A. (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, <b>17</b>, 1\u201326."
		},
		"http://www.zotero.org/styles/oecologia": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein A (1905) On the electrodynamics of moving bodies. Annalen der Physik 17:1\u201326"
		},
		"http://www.zotero.org/styles/oikos": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. 1905. On the electrodynamics of moving bodies. - Annalen der Physik 17: 1\u201326."
		},
		"http://www.zotero.org/styles/oncogene": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein A. (1905). On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>: 1\u201326."
		},
		"http://www.zotero.org/styles/open-university-a251": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905, p.)"
			],
			"formattedBibliography": "Einstein, A. (1905) \u00e2\u20ac\u0153On the electrodynamics of moving bodies.\u00e2\u20ac\ufffd <i>Annalen der Physik</i>, 17/4, pp.1\u201326."
		},
		"http://www.zotero.org/styles/open-university-harvard": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, Albert (1905) \u00e2\u20ac\u02dcOn the electrodynamics of moving bodies\u00e2\u20ac<sup>TM</sup>, <i>Annalen der Physik</i>, Dover Publications, 17(4), pp. 1\u201326."
		},
		"http://www.zotero.org/styles/open-university-numeric": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1   Einstein, Albert (1905) \u00e2\u20ac\u0153On the electrodynamics of moving bodies.\u00e2\u20ac\ufffd <i>Annalen der Physik</i>, 17(4), pp. 1\u201326."
		},
		"http://www.zotero.org/styles/ophthalmology": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1. Einstein A. On the electrodynamics of moving bodies. Annalen der Physik 1905;17:1\u201326."
		},
		"http://www.zotero.org/styles/optical-society-of-america": {
			"statusMessage": "",
			"formattedCitations": [
				"\u00c2\u00a0[1]"
			],
			"formattedBibliography": "1.  A. Einstein, \"On the electrodynamics of moving bodies,\" Annalen der Physik <b>17</b>, 1\u201326 (1905)."
		},
		"http://www.zotero.org/styles/organic-geochemistry": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A., 1905. On the electrodynamics of moving bodies. Annalen der Physik 17, 1\u201326."
		},
		"http://www.zotero.org/styles/organization-science": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>(4) p.1\u201326."
		},
		"http://www.zotero.org/styles/oryx": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, 17, 1\u201326. Dover Publications."
		},
		"http://www.zotero.org/styles/oscola-no-ibid": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, \u00e2\u20ac\u02dcOn the electrodynamics of moving bodies\u00e2\u20ac<sup>TM</sup> (1905) 17 Annalen der Physik 1\u201326"
			],
			"formattedBibliography": "Einstein, Albert, \u00e2\u20ac\u02dcOn the electrodynamics of moving bodies\u00e2\u20ac<sup>TM</sup> (1905) 17 Annalen der Physik, 1."
		},
		"http://www.zotero.org/styles/oscola": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, \u00e2\u20ac\u02dcOn the electrodynamics of moving bodies\u00e2\u20ac<sup>TM</sup> (1905) 17 Annalen der Physik 1\u201326"
			],
			"formattedBibliography": "Einstein, Albert, \u00e2\u20ac\u02dcOn the electrodynamics of moving bodies\u00e2\u20ac<sup>TM</sup> (1905) 17 Annalen der Physik, 1."
		},
		"http://www.zotero.org/styles/osterreichische-zeitschrift-fur-politikwissenschaft": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "<i>Einstein</i>, Albert (1905). On the electrodynamics of moving bodies, in: <i>Annalen der Physik</i>, Vol. 17(4), 1\u201326"
		},
		"http://www.zotero.org/styles/oxford-art-journal": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, \u00e2\u20ac\u02dcOn the electrodynamics of moving bodies\u00e2\u20ac<sup>TM</sup>, Dover Publications, <i>Annalen der Physik</i>, Vol. 17, no. 4, 1905, pp. 1\u201326."
			],
			"formattedBibliography": "Albert Einstein, \u00e2\u20ac\u02dcOn the electrodynamics of moving bodies\u00e2\u20ac<sup>TM</sup>, Dover Publications, <i>Annalen der Physik</i>, Vol. 17, no. 4, 1905, pp. 1\u201326."
		},
		"http://www.zotero.org/styles/padagogische-hochschule-heidelberg": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein\u00c2\u00a01905)"
			],
			"formattedBibliography": "Einstein, Albert\u00c2\u00a0(1905).\u00c2\u00a0On the electrodynamics of moving bodies. In:\u00c2\u00a0Annalen der Physik,\u00c2\u00a0Dover Publications17\u00c2\u00a0(1905),\u00c2\u00a04,\u00c2\u00a0pp.\u00c2\u00a01\u201326."
		},
		"http://www.zotero.org/styles/palaeontologia-electronica": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17:1\u201326. Dover Publications."
		},
		"http://www.zotero.org/styles/palaeontology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "EINSTEIN, A. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, <b>17</b>, 1\u201326."
		},
		"http://www.zotero.org/styles/pbsjournals-asbp": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. Annalen der Physik. 1905;17(4):1\u201326. "
		},
		"http://www.zotero.org/styles/pharmacoeconomics": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>[1]</sup>"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. Annalen der Physik 1905; 17 (4): 1\u201326"
		},
		"http://www.zotero.org/styles/plant-cell": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "<b>Einstein, A.</b> (1905). On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>: 1\u201326."
		},
		"http://www.zotero.org/styles/plant-physiology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "<b>Einstein A</b> (1905) On the electrodynamics of moving bodies. Annalen der Physik <b>17</b>: 1\u201326"
		},
		"http://www.zotero.org/styles/plos": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1.  Einstein A (1905) On the electrodynamics of moving bodies. Annalen der Physik 17: 1\u201326."
		},
		"http://www.zotero.org/styles/pnas": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1.  Einstein A (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17:1\u201326."
		},
		"http://www.zotero.org/styles/political-studies": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905) \u00e2\u20ac\u02dcOn the electrodynamics of moving bodies\u00e2\u20ac\u2122, <i>Annalen der Physik</i>, <i>17</i>(4), 1\u201326Dover Publications."
		},
		"http://www.zotero.org/styles/politische-vierteljahresschrift": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "<i>Einstein, Albert</i>, 1905: On the electrodynamics of moving bodies, in: Annalen der Physik 17, 1\u201326."
		},
		"http://www.zotero.org/styles/pontifical-biblical-institute": {
			"statusMessage": "",
			"formattedCitations": [
				"A. Einstein, \u00e2\u20ac\u0153On the electrodynamics of moving bodies\u00e2\u20ac\ufffd, <i>Annalen der Physik</i> 17/4 (1905) 1\u201326."
			],
			"formattedBibliography": "A. Einstein, \u00e2\u20ac\u0153On the electrodynamics of moving bodies\u00e2\u20ac\ufffd, <i>Annalen der Physik</i> 17/4 (1905) 1\u201326."
		},
		"http://www.zotero.org/styles/proceedings-of-the-royal-society-b": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1  Einstein, A. 1905 On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>, 1\u201326. "
		},
		"http://www.zotero.org/styles/protein-science": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1. Einstein A (1905) On the electrodynamics of moving bodies. Annalen der Physik 17:1\u201326."
		},
		"http://www.zotero.org/styles/proteomics": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "[1]  Einstein, A., On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 1905, 17, 1\u201326."
		},
		"http://www.zotero.org/styles/psychiatry-and-clinical-neurosciences": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>. 1905; 17: 1\u201326. "
		},
		"http://www.zotero.org/styles/public-health-nutrition": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>(1)</sup>"
			],
			"formattedBibliography": "1.  Einstein A (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>, 1\u201326. Dover Publications."
		},
		"http://www.zotero.org/styles/radiopaedia": {
			"statusMessage": "",
			"formattedCitations": [
				"Einstein, \u00e2\u20ac\u0153On the electrodynamics of moving bodies.\u00e2\u20ac\ufffd"
			],
			"formattedBibliography": "Einstein Albert. \u00e2\u20ac\u0153On the electrodynamics of moving bodies.\u00e2\u20ac\ufffd <i>Annalen der Physik</i> 17, no. 4 (1905): 1\u201326."
		},
		"http://www.zotero.org/styles/research-policy": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A., 1905. On the electrodynamics of moving bodies. Annalen der Physik 17, 1\u201326."
		},
		"http://www.zotero.org/styles/resources-conservation-and-recycling": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein A. On the electrodynamics of moving bodies. Annalen der Physik 1905;17(4):1\u201326."
		},
		"http://www.zotero.org/styles/revista-brasileira-de-botanica": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "EINSTEIN, A. 1905. On the electrodynamics of moving bodies. Annalen der Physik 17(4):1-26. "
		},
		"http://www.zotero.org/styles/revue-dhistoire-moderne-et-contemporaine": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, \u00c2\u00ab\u00c2\u00a0On the electrodynamics of moving bodies\u00c2\u00a0\u00c2\u00bb, <i>Annalen der Physik</i>, 17-4, 1905, p.\u00c2\u00a01-26."
			],
			"formattedBibliography": "Einstein Albert, \u00c2\u00ab\u00c2\u00a0On the electrodynamics of moving bodies\u00c2\u00a0\u00c2\u00bb, <i>Annalen der Physik</i>, 17-4, 1905, p.\u00c2\u00a01-26."
		},
		"http://www.zotero.org/styles/rockefeller-university-press": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>. 17:1\u201326."
		},
		"http://www.zotero.org/styles/romanian-humanities": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, \u00e2\u20ac\u0153On the electrodynamics of moving bodies\u00e2\u20ac\ufffd, <i>Annalen der Physik</i>, vol. 17, nr. 4, 1905, Dover Publications."
			],
			"formattedBibliography": "Einstein, Albert, \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd <i>Annalen der Physik</i>, vol. 17, nr. 4, 1905, Dover Publications, pp. 1\u201326."
		},
		"http://www.zotero.org/styles/rose-school": {
			"statusMessage": "",
			"formattedCitations": [
				"[Einstein 1905]"
			],
			"formattedBibliography": "Einstein, A. [1905] \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd <i>Annalen der Physik</i>, Dover Publications, Vol. 17, No.4, pp. 1\u201326."
		},
		"http://www.zotero.org/styles/royal-society-of-chemistry": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1. A. Einstein, <i>Annalen der Physik</i>, 1905, <b>17</b>, 1\u201326."
		},
		"http://www.zotero.org/styles/rtf-scan": {
			"statusMessage": "",
			"formattedCitations": [
				"{Einstein, 1905}"
			],
			"formattedBibliography": "{Einstein, 1905}"
		},
		"http://www.zotero.org/styles/sage-harvard": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein A (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i>. Dover Publications 17(4): 1\u201326."
		},
		"http://www.zotero.org/styles/sage-vancouver": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. <i>Annalen der Physik. </i>1905;17(4):1\u201326. "
		},
		"http://www.zotero.org/styles/sbl-fullnote-bibliography": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd <i>Annalen der Physik</i> 17, no. 4 (1905): 1\u201326."
			],
			"formattedBibliography": "Einstein, Albert. \u00e2\u20ac\u0153On the electrodynamics of moving bodies.\u00e2\u20ac\ufffd <i>Annalen der Physik</i> 17, no. 4 (1905): 1\u201326."
		},
		"http://www.zotero.org/styles/scandinavian-political-studies": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. 1905. \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd <i>Annalen der Physik</i> 17, 1\u201326."
		},
		"http://www.zotero.org/styles/science-of-the-total-environment": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein A. On the electrodynamics of moving bodies. Annalen der Physik 1905;17:1\u201326."
		},
		"http://www.zotero.org/styles/science-translational-medicine": {
			"statusMessage": "",
			"formattedCitations": [
				"<i>(1)</i>"
			],
			"formattedBibliography": "1. A. Einstein, On the electrodynamics of moving bodies, <i>Annalen der Physik</i> <b>17</b>, 1\u201326 (1905)."
		},
		"http://www.zotero.org/styles/science": {
			"statusMessage": "",
			"formattedCitations": [
				"(<i>1</i>)"
			],
			"formattedBibliography": "1. A. Einstein, On the electrodynamics of moving bodies, <i>Annalen der Physik</i> <b>17</b>, 1\u201326 (1905)."
		},
		"http://www.zotero.org/styles/sexual-development": {
			"statusMessage": "",
			"formattedCitations": [
				"[Einstein, 1905]"
			],
			"formattedBibliography": "Einstein A: On the electrodynamics of moving bodies. Annalen der Physik 17:1\u201326 (1905). "
		},
		"http://www.zotero.org/styles/small-wiley": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "[1]  A. Einstein, <i>Annalen der Physik</i> <b>1905</b>, <i>17</i>, 1\u201326."
		},
		"http://www.zotero.org/styles/social-science-and-medicine": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905). On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, 17(4), 1\u201326. Dover Publications."
		},
		"http://www.zotero.org/styles/social-studies-of-science": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, Albert (1905) 'On the electrodynamics of moving bodies', <i>Annalen der Physik</i> 17(4): 1\u201326."
		},
		"http://www.zotero.org/styles/sociedade-brasileira-de-computacao": {
			"statusMessage": "",
			"formattedCitations": [
				"[Einstein 1905]"
			],
			"formattedBibliography": "Einstein, A. (1905). On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, v. 17, n. 4, p. 1\u201326. "
		},
		"http://www.zotero.org/styles/societe-nationale-des-groupements-techniques-veterinaires": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1-  EINSTEIN A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>. 1905, <b>17</b>(4):1\u201326."
		},
		"http://www.zotero.org/styles/society-for-american-archaeology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, Albert 1905 On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17, no. 4: 1\u201326."
		},
		"http://www.zotero.org/styles/society-for-general-microbiology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "<b>Einstein, A.</b> <b>(1905).</b> On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>, 1\u201326. Dover Publications."
		},
		"http://www.zotero.org/styles/society-for-historical-archaeology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "\n\n    <div class=\"csl-block\">Einstein, Albert</div>\n1905&#160; &#160;  On the Electrodynamics of Moving Bodies. <i>Annalen Der Physik</i> 17(4). Dover Publications:1\u201326. "
		},
		"http://www.zotero.org/styles/socio-economic-review": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905) \u00e2\u20ac\u02dcOn the Electrodynamics of Moving Bodies\u00e2\u20ac<sup>TM</sup>, <i>Annalen der Physik</i>, <b>17</b>, 1\u201326."
		},
		"http://www.zotero.org/styles/spanish-legal": {
			"statusMessage": "",
			"formattedCitations": [
				"A. Einstein, \u00e2\u20ac\u0153On the electrodynamics of moving bodies\u00e2\u20ac\ufffd, <i>Annalen der Physik</i>, vol. 17, 4, 1905, Dover Publications."
			],
			"formattedBibliography": "Einstein, A., \u00e2\u20ac\u0153On the electrodynamics of moving bodies\u00e2\u20ac\ufffd, <i>Annalen der Physik</i>, vol. 17, no. 4, 1905, Dover Publications, p\u00c3\u00a1gs 1\u201326."
		},
		"http://www.zotero.org/styles/spie-bios": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "[1]  Einstein, A., \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd Annalen der Physik 17(4), 1\u201326 (1905)."
		},
		"http://www.zotero.org/styles/spie-journals": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "[1]  A. Einstein, \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd <i>Annalen der Physik</i> <b>17</b>, 1\u201326, Dover Publications (1905)."
		},
		"http://www.zotero.org/styles/spip-cite": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, Albert 1905) "
			],
			"formattedBibliography": "&#60;cite|journal|title=On the electrodynamics of moving bodies&#160; &#160; &#160; &#160; &#160;  |authors=Einstein, Albert&#160; &#160; &#160; &#160; &#160; &#160; |journal=Annalen der Physik&#160; &#160; &#160; &#160; &#160; |year=1905&#160; &#160; &#160; &#160; &#160; |volume=17&#160; &#160; &#160; &#160;  |issues=4&#160; &#160; &#160; &#160; |page=1\u201326&#160; &#160; &#160; &#160; &#160; &#62;"
		},
		"http://www.zotero.org/styles/springer-author-date": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein A (1905) On the electrodynamics of moving bodies. Annalen der Physik 17:1\u201326."
		},
		"http://www.zotero.org/styles/springer-plasmonics": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1.  A. Einstein (1905) On the electrodynamics of moving bodies, Annalen der Physik. 17, 1\u201326."
		},
		"http://www.zotero.org/styles/springer-vancouver": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1.  Einstein A (1905) On the electrodynamics of moving bodies. Annalen der Physik 17(4):1\u201326"
		},
		"http://www.zotero.org/styles/standards-in-genomic-sciences": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1. Einstein A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 1905;<b>17</b>:1\u201326."
		},
		"http://www.zotero.org/styles/stroke": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>. 1905;17:1\u201326. "
		},
		"http://www.zotero.org/styles/surgical-neurology-international": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>[1]</sup>"
			],
			"formattedBibliography": "1. Einstein A. On the electrodynamics of moving bodies. Annalen der Physik 1905; 17:1\u201326."
		},
		"http://www.zotero.org/styles/tah-gkw": {
			"statusMessage": "",
			"formattedCitations": [
				"Einstein, Albert: \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd <i>Annalen der Physik</i> 17/4 (1905), pp.\u00c2\u00a01\u201326."
			],
			"formattedBibliography": "Einstein, Albert: \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd <i>Annalen der Physik</i> 17/4 (1905), pp.\u00c2\u00a01\u201326."
		},
		"http://www.zotero.org/styles/tah-soz": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, Albert (1905): \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd <i>Annalen der Physik</i> 17/4, pp.\u00c2\u00a01\u201326."
		},
		"http://www.zotero.org/styles/taylor-and-francis-harvard-x": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A., 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, 17 (4), 1\u201326."
		},
		"http://www.zotero.org/styles/tgm-wien-diplom": {
			"statusMessage": "",
			"formattedCitations": [
				"Einstein, Albert (1905)."
			],
			"formattedBibliography": "<b>Einstein, Albert (<b>1905</b>):</b> On the electrodynamics of moving bodies<i> In: </i><i>Annalen der Physik</i>, Band 17, Ausgabe 4, 1905, S. 1\u201326."
		},
		"http://www.zotero.org/styles/the-academy-of-management-review": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. 1905. On the electrodynamics of moving bodies. <b><i>Annalen der Physik</i></b>, 17(4): 1\u201326. Dover Publications."
		},
		"http://www.zotero.org/styles/the-accounting-review": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17 (4): 1\u201326."
		},
		"http://www.zotero.org/styles/the-american-journal-of-gastroenterology": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. Annalen der Physik 1905;17:1\u201326."
		},
		"http://www.zotero.org/styles/the-american-journal-of-geriatric-pharmacotherapy": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1. Einstein A. On the electrodynamics of moving bodies. Annalen der Physik. 1905;17(4):1\u201326."
		},
		"http://www.zotero.org/styles/the-american-journal-of-psychiatry": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1.  Einstein A: On the electrodynamics of moving bodies. Annalen der Physik 1905; 17:1\u201326"
		},
		"http://www.zotero.org/styles/the-british-journal-of-psychiatry": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1  Einstein A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 1905; <b>17</b>: 1\u201326."
		},
		"http://www.zotero.org/styles/the-british-journal-of-sociology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "<b>Einstein, A.</b> 1905 'On the electrodynamics of moving bodies', <i>Annalen der Physik</i> 17(4): p.1\u201326."
		},
		"http://www.zotero.org/styles/the-embo-journal": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein A (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b><b>:</b> 1\u201326"
		},
		"http://www.zotero.org/styles/the-historical-journal": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, \u00e2\u20ac\u02dcOn the electrodynamics of moving bodies\u00e2\u20ac<sup>TM</sup>, Dover Publications, <i>Annalen der Physik</i>, 17 (1905), pp. 1\u201326."
			],
			"formattedBibliography": "Albert Einstein, \u00e2\u20ac\u02dcOn the electrodynamics of moving bodies\u00e2\u20ac<sup>TM</sup>, Dover Publications, <i>Annalen der Physik</i>, 17 (1905), pp. 1\u201326."
		},
		"http://www.zotero.org/styles/the-holocene": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein A (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i>. Dover Publications 17(4): 1\u201326."
		},
		"http://www.zotero.org/styles/the-isme-journal": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein A. (1905). On the electrodynamics of moving bodies. Annalen der Physik 17:1\u201326."
		},
		"http://www.zotero.org/styles/the-journal-of-comparative-neurology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein A. 1905. On the electrodynamics of moving bodies. Annalen der Physik 17:1\u201326."
		},
		"http://www.zotero.org/styles/the-journal-of-eukaryotic-microbiology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein A. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, <b>17</b>:1\u201326."
		},
		"http://www.zotero.org/styles/the-journal-of-experimental-biology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "<b>Einstein, A.</b> (1905). On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17</b>, 1\u201326."
		},
		"http://www.zotero.org/styles/the-journal-of-immunology": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1. Einstein, A. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17: 1\u201326."
		},
		"http://www.zotero.org/styles/the-journal-of-neuropsychiatry-and-clinical-neurosciences": {
			"statusMessage": "",
			"formattedCitations": [
				"{1}"
			],
			"formattedBibliography": "1.  Einstein A: On the electrodynamics of moving bodies. Annalen der Physik 1905; 17:1\u201326"
		},
		"http://www.zotero.org/styles/the-journal-of-neuroscience": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein A (1905) On the electrodynamics of moving bodies. Annalen der Physik 17:1\u201326."
		},
		"http://www.zotero.org/styles/the-journal-of-physiology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein A (1905). On the electrodynamics of moving bodies. <i>Annalen der Physik</i> <b>17,</b> 1\u201326."
		},
		"http://www.zotero.org/styles/the-journal-of-the-acoustical-society-of-america": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (<b>1905</b>). \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd Annalen der Physik <b>17</b>, 1\u201326."
		},
		"http://www.zotero.org/styles/the-journal-of-urology": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1.  Einstein A: On the electrodynamics of moving bodies. Annalen der Physik 1905; <b>17</b>: 1\u201326."
		},
		"http://www.zotero.org/styles/the-neuroscientist": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein A. 1905. On the electrodynamics of moving bodies. Annalen der Physik 17:1\u201326."
		},
		"http://www.zotero.org/styles/the-oncologist": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1 Einstein A. On the electrodynamics of moving bodies. Annalen der Physik 1905;17:1\u201326."
		},
		"http://www.zotero.org/styles/the-pharmacogenomics-journal": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1  Einstein A. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 1905; <b>17</b>: 1\u201326."
		},
		"http://www.zotero.org/styles/the-plant-journal": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "<b>Einstein, A.</b>, (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, 17(4), 1\u201326."
		},
		"http://www.zotero.org/styles/theory-culture-and-society": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905) \u00e2\u20ac\u02dcOn the Electrodynamics of Moving Bodies\u00e2\u20ac\u2122, <i>Annalen Der Physik</i> <i>17</i>(4): 1\u201326. Dover Publications."
		},
		"http://www.zotero.org/styles/toxicon": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A., 1905. On the electrodynamics of moving bodies. Annalen der Physik 17, 1\u201326."
		},
		"http://www.zotero.org/styles/traces": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein Albert, 1905, \u00c2\u00ab\u00c2\u00a0On the electrodynamics of moving bodies\u00c2\u00a0\u00c2\u00bb,. <i>Annalen der Physik</i>, vol. 17, n\u00c2\u00b0\u00c2\u00a04, p. 1-26."
		},
		"http://www.zotero.org/styles/traffic": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. Annalen der Physik 1905;17:1\u201326. "
		},
		"http://www.zotero.org/styles/trends-journal": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1  Einstein, A. (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i>. 17, 1\u201326"
		},
		"http://www.zotero.org/styles/tu-wien-dissertation": {
			"statusMessage": "",
			"formattedCitations": [
				"Einstein, Albert (1905)."
			],
			"formattedBibliography": "<b>Einstein, Albert (<b>1905</b>):</b> On the electrodynamics of moving bodies<i> In: </i><i>Annalen der Physik</i>, Band 17, Ausgabe 4, 1905, S. 1\u201326."
		},
		"http://www.zotero.org/styles/turabian-fullnote-bibliography": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd <i>Annalen der Physik</i> 17, no. 4 (1905): 1\u201326."
			],
			"formattedBibliography": "Einstein, Albert. \u00e2\u20ac\u0153On the electrodynamics of moving bodies.\u00e2\u20ac\ufffd <i>Annalen der Physik</i> 17, no. 4 (1905): 1\u201326."
		},
		"http://www.zotero.org/styles/un-eclac-cepal-english": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, Albert (1905), \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd <i>Annalen der Physik</i>, vol. 17, No. 4, Dover Publications."
		},
		"http://www.zotero.org/styles/un-eclac-cepal-spanish": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, Albert (1905), \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd <i>Annalen der Physik</i>, vol. 17, No. 4, Dover Publications."
		},
		"http://www.zotero.org/styles/unctad-english": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein A (1905). On the electrodynamics of moving bodies. <i>Annalen der Physik</i>. 17(4): 1\u201326, Dover Publications."
		},
		"http://www.zotero.org/styles/unified-style-linguistics": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, Albert. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17(4). Dover Publications. 1\u201326."
		},
		"http://www.zotero.org/styles/unisa-harvard": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A 1905, \u00e2\u20ac\u02dcOn the electrodynamics of moving bodies\u00e2\u20ac\u2122, Dover Publications, <i>Annalen der Physik</i>, vol. 17, no. 4, pp. 1\u201326."
		},
		"http://www.zotero.org/styles/unisa-harvard3": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A 1905, \u00e2\u20ac\u02dcOn the electrodynamics of moving bodies\u00e2\u20ac<sup>TM</sup>, Dover Publications, <i>Annalen der Physik</i>, vol. 17, no. 4, pp. 1\u201326."
		},
		"http://www.zotero.org/styles/universidad-evangelica-del-paraguay": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "EINSTEIN, A. (1905) \"On the electrodynamics of moving bodies\". In <i>Annalen der Physik</i>. A\u00c3\u00b1o 17, N\u00c2\u00b0 4, P\u00c3\u00a1gs. 1\u201326. Dover Publications."
		},
		"http://www.zotero.org/styles/universita-di-bologna-lettere": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd <i>Annalen der Physik</i>, vol. 17, fasc. 4, 1905, pp. 1\u201326."
			],
			"formattedBibliography": "Einstein, Albert, \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd <i>Annalen der Physik</i>, vol. 17, fasc. 4, 1905, pp. 1\u201326."
		},
		"http://www.zotero.org/styles/universite-de-liege-histoire": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, \u00c2\u00ab\u00c2\u00a0On the electrodynamics of moving bodies\u00c2\u00a0\u00c2\u00bb, in <i>Annalen der Physik</i>, vol.\u00c2\u00a017 (1905), no.\u00c2\u00a04, p. 1-26."
			],
			"formattedBibliography": "Einstein Albert, \u00c2\u00ab\u00c2\u00a0On the electrodynamics of moving bodies\u00c2\u00a0\u00c2\u00bb, in <i>Annalen der Physik</i>, vol.\u00c2\u00a017 (1905), no.\u00c2\u00a04, p. 1-26."
		},
		"http://www.zotero.org/styles/universite-laval-com": {
			"statusMessage": "",
			"formattedCitations": [
				" (Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, Albert. 1905. \u00c2\u00ab\u00c2\u00a0On the electrodynamics of moving bodies\u00c2\u00a0\u00c2\u00bb. <i>Annalen der Physik</i>.  Vol. 17, n\u00c2\u00b04, p.\u00c2\u00a01-26. "
		},
		"http://www.zotero.org/styles/university-of-melbourne": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A 1905, \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd <i>Annalen der Physik</i>, vol. 17, no. 4, pp. 1\u201326."
		},
		"http://www.zotero.org/styles/urban-forestry-and-urban-greening": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A., 1905. On the electrodynamics of moving bodies. Annalen der Physik 17, 1\u201326."
		},
		"http://www.zotero.org/styles/urban-habitats": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, A. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i> 17(4): 1\u201326."
		},
		"http://www.zotero.org/styles/urban-studies": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905). On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, <i>17</i>(4), pp. 1\u201326."
		},
		"http://www.zotero.org/styles/us-geological-survey": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A., 1905, On the electrodynamics of moving bodies: Annalen der Physik, v. 17, no. 4, p. 1\u201326."
		},
		"http://www.zotero.org/styles/user-modeling-and-useradapted-interaction": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein, Albert. 1905. 'On the electrodynamics of moving bodies.' <i>Annalen der Physik</i> 17(4), pp. 1\u201326."
		},
		"http://www.zotero.org/styles/vancouver-brackets": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. Annalen der Physik. Dover Publications; 1905;17(4):1\u201326. "
		},
		"http://www.zotero.org/styles/vancouver-superscript-bracket-only-year": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>[1]</sup>"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. Annalen der Physik 1905;17(4):1\u201326. "
		},
		"http://www.zotero.org/styles/vancouver-superscript": {
			"statusMessage": "",
			"formattedCitations": [
				"<sup>1</sup>"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. Annalen der Physik. Dover Publications; 1905;17(4):1\u201326. "
		},
		"http://www.zotero.org/styles/vancouver": {
			"statusMessage": "",
			"formattedCitations": [
				"(1)"
			],
			"formattedBibliography": "1.  Einstein A. On the electrodynamics of moving bodies. Annalen der Physik. Dover Publications; 1905;17(4):1\u201326. "
		},
		"http://www.zotero.org/styles/veterinary-medicine-austria": {
			"statusMessage": "",
			"formattedCitations": [
				"(EINSTEIN, 1905)"
			],
			"formattedBibliography": "EINSTEIN, A., (1905): On the electrodynamics of moving bodies. Annalen der Physik, <b>17</b>, 1\u201326."
		},
		"http://www.zotero.org/styles/vienna-legal": {
			"statusMessage": "",
			"formattedCitations": [
				"Einstein, On the electrodynamics of moving bodies, <i>Annalen der Physik</i> vol. 17 4 1905 Dover Publications."
			],
			"formattedBibliography": "Einstein, On the electrodynamics of moving bodies, <i>Annalen der Physik</i> vol. 17 4 1905 Dover Publications."
		},
		"http://www.zotero.org/styles/water-research": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905) On the electrodynamics of moving bodies. Annalen der Physik, 17(4), 1\u201326."
		},
		"http://www.zotero.org/styles/water-science-and-technology": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein, 1905)"
			],
			"formattedBibliography": "Einstein, A. (1905) On the electrodynamics of moving bodies. Annalen der Physik, <b>17</b>(4), 1\u201326."
		},
		"http://www.zotero.org/styles/wceam2010": {
			"statusMessage": "",
			"formattedCitations": [
				"[1]"
			],
			"formattedBibliography": "1  Einstein A. (1905) On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, 17(4), 1\u201326. Dover Publications."
		},
		"http://www.zotero.org/styles/wetlands": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein A (1905) On the electrodynamics of moving bodies. Annalen der Physik 17: 1\u201326."
		},
		"http://www.zotero.org/styles/wheaton-college-phd-in-biblical-and-theological-studies": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, \u00e2\u20ac\u0153On the electrodynamics of moving bodies,\u00e2\u20ac\ufffd <i>Annalen der Physik</i> 17:4 (1905): 1\u201326"
			],
			"formattedBibliography": "Einstein, Albert. \u00e2\u20ac\u0153On the electrodynamics of moving bodies.\u00e2\u20ac\ufffd <i>Annalen der Physik</i> 17:4 (1905): 1\u201326."
		},
		"http://www.zotero.org/styles/world-journal-of-biological-psychiatry": {
			"statusMessage": "",
			"formattedCitations": [
				"(Einstein 1905)"
			],
			"formattedBibliography": "Einstein A. 1905. On the electrodynamics of moving bodies. Annalen der Physik 17:1\u201326."
		},
		"http://www.zotero.org/styles/yeast": {
			"statusMessage": "",
			"formattedCitations": [
				"[Einstein 1905]"
			],
			"formattedBibliography": "Einstein A. 1905. On the electrodynamics of moving bodies. <i>Annalen der Physik</i>, <b>17</b>: 1\u201326."
		},
		"http://www.zotero.org/styles/zeitschrift-fur-medienwissenschaft": {
			"statusMessage": "",
			"formattedCitations": [
				"Albert Einstein, On the electrodynamics of moving bodies, in: <i>Annalen der Physik</i>, 17/4, 1905, 1\u201326."
			],
			"formattedBibliography": "Albert Einstein, On the electrodynamics of moving bodies, in: <i>Annalen der Physik</i>, 17/4, 1905, 1\u201326."
		}
	},
	"styleTitleFromId": {
		"http://www.zotero.org/styles/acm-sig-proceedings-long-author-list": "ACM SIG Proceedings With Long Author List",
		"http://www.zotero.org/styles/acm-sig-proceedings": "ACM SIG Proceedings",
		"http://www.zotero.org/styles/acm-sigchi-proceedings": "ACM SIGCHI Conference Proceedings",
		"http://www.zotero.org/styles/acm-siggraph": "ACM SIGGRAPH",
		"http://www.zotero.org/styles/acs-chemical-biology": "ACS Chemical Biology",
		"http://www.zotero.org/styles/acs-nano": "ACS Nano",
		"http://www.zotero.org/styles/acta-materialia": "Acta Materialia",
		"http://www.zotero.org/styles/acta-universitatis-agriculturae-sueciae": "Acta Universitatis Agriculturae Sueciae",
		"http://www.zotero.org/styles/administrative-science-quaterly": "Administrative Science Quaterly (ASQ)",
		"http://www.zotero.org/styles/advanced-engineering-materials": "Advanced Engineering Materials",
		"http://www.zotero.org/styles/advanced-materials": "Advanced Materials",
		"http://www.zotero.org/styles/advances-in-complex-systems": "Advances in Complex Systems",
		"http://www.zotero.org/styles/aging-cell": "Aging Cell",
		"http://www.zotero.org/styles/aids": "AIDS",
		"http://www.zotero.org/styles/all": "ALL - display all fields in a debug view",
		"http://www.zotero.org/styles/alternatives-to-animal-experimentation": "Alternatives to Animal Experimentation (ALTEX)",
		"http://www.zotero.org/styles/american-anthropological-association": "American Anthropological Association",
		"http://www.zotero.org/styles/american-antiquity": "American Antiquity",
		"http://www.zotero.org/styles/american-association-for-cancer-research": "American Association for Cancer Research (AACR)",
		"http://www.zotero.org/styles/american-association-of-petroleum-geologists": "American Association of Petroleum Geologists",
		"http://www.zotero.org/styles/american-chemical-society-with-titles-brackets": "American Chemical Society (ACS) - with titles, brackets",
		"http://www.zotero.org/styles/american-chemical-society-with-titles": "American Chemical Society (ACS) - with titles",
		"http://www.zotero.org/styles/american-chemical-society": "American Chemical Society (ACS)",
		"http://www.zotero.org/styles/american-geophysical-union": "American Geophysical Union (AGU)",
		"http://www.zotero.org/styles/american-heart-association": "American Heart Association",
		"http://www.zotero.org/styles/american-institute-of-physics": "American Institute of Physics (AIP)",
		"http://www.zotero.org/styles/american-journal-of-archaeology": "American Journal of Archaeology",
		"http://www.zotero.org/styles/american-journal-of-botany": "American Journal of Botany",
		"http://www.zotero.org/styles/american-journal-of-epidemiology": "American Journal of Epidemiology",
		"http://www.zotero.org/styles/american-journal-of-medical-genetics": "American Journal of Medical Genetics",
		"http://www.zotero.org/styles/american-journal-of-physical-anthropology": "American Journal of Physical Anthropology",
		"http://www.zotero.org/styles/american-journal-of-political-science": "American Journal of Political Science (AJPS)",
		"http://www.zotero.org/styles/american-medical-association-alphabetical": "American Medical Association (AMA) - alphabetical",
		"http://www.zotero.org/styles/american-medical-association-no-et-al": "American Medical Association (AMA) - no et al",
		"http://www.zotero.org/styles/american-medical-association-no-url": "American Medical Association (AMA) - no URL",
		"http://www.zotero.org/styles/american-medical-association": "American Medical Association (AMA)",
		"http://www.zotero.org/styles/american-meteorological-society": "American Meteorological Society",
		"http://www.zotero.org/styles/american-physics-society": "American Physics Society (APS)",
		"http://www.zotero.org/styles/american-physiological-society": "American Physiological Society",
		"http://www.zotero.org/styles/american-phytopathological-society-numeric": "American Phytopathological Society (numeric)",
		"http://www.zotero.org/styles/american-phytopathological-society": "American Phytopathological Society",
		"http://www.zotero.org/styles/american-society-for-microbiology": "American Society for Microbiology (ASM)",
		"http://www.zotero.org/styles/american-society-of-civil-engineers": "American Society of Civil Engineers (ASCE)",
		"http://www.zotero.org/styles/american-society-of-mechanical-engineers": "American Society of Mechanical Engineers (ASME)",
		"http://www.zotero.org/styles/amiens": "Th\u00c3\u00a8se de Medecine \u00c3\u00a0 Amiens",
		"http://www.zotero.org/styles/analytica-chimica-acta": "Analytica Chimica Acta",
		"http://www.zotero.org/styles/anesthesia-and-analgesia": "Anesthesia and Analgesia",
		"http://www.zotero.org/styles/angewandte-chemie": "Angewandte Chemie International Edition",
		"http://www.zotero.org/styles/animal-behaviour": "Animal Behaviour",
		"http://www.zotero.org/styles/annalen-des-naturhistorischen-museums-wien": "Annalen des Naturhistorischen Museums in Wien",
		"http://www.zotero.org/styles/annals-of-biomedical-engineering": "Annals of Biomedical Engineering",
		"http://www.zotero.org/styles/annals-of-botany": "Annals of Botany",
		"http://www.zotero.org/styles/annals-of-neurology": "Annals of Neurology",
		"http://www.zotero.org/styles/annals-of-the-association-of-american-geographers": "Annals of the Association of American Geographers",
		"http://www.zotero.org/styles/annual-reviews-alphabetically": "Annual Reviews (sorted alphabetically)",
		"http://www.zotero.org/styles/annual-reviews-by-appearance": "Annual Reviews (sorted by order of appearance)",
		"http://www.zotero.org/styles/antarctic-science": "Antarctic Science",
		"http://www.zotero.org/styles/antonie-van-leeuwenhoek": "Antonie van Leeuwenhoek",
		"http://www.zotero.org/styles/apa": "American Psychological Association 6th Edition",
		"http://www.zotero.org/styles/apa5th": "American Psychological Association 5th Edition",
		"http://www.zotero.org/styles/applied-spectroscopy": "Applied Spectroscopy",
		"http://www.zotero.org/styles/apsa": "American Political Science Association",
		"http://www.zotero.org/styles/archives-of-physical-medicine-and-rehabilitation": "Archives of Physical Medicine and Rehabilitation",
		"http://www.zotero.org/styles/art-history": "Art History",
		"http://www.zotero.org/styles/arzneimitteltherapie": "Arzneimitteltherapie",
		"http://www.zotero.org/styles/asa-cssa-sssa": "American Society of Agronomy",
		"http://www.zotero.org/styles/asa": "American Sociological Association",
		"http://www.zotero.org/styles/associacao-brasileira-de-normas-tecnicas-ufpr": "Associa\u00c3\u00a7\u00c3\u00a3o Brasileira de Normas T\u00c3\u00a9cnicas (ABNT) - Universidade Federal do Paran\u00c3\u00a1 (UFPR)",
		"http://www.zotero.org/styles/associacao-brasileira-de-normas-tecnicas": "Associa\u00c3\u00a7\u00c3\u00a3o Brasileira de Normas T\u00c3\u00a9cnicas (ABNT)",
		"http://www.zotero.org/styles/australian-historical-studies": "Australian Historical Studies",
		"http://www.zotero.org/styles/australian-journal-of-grape-and-wine-research": "Australian Journal of Grape and Wine Research",
		"http://www.zotero.org/styles/australian-legal": "Australian Legal Citation",
		"http://www.zotero.org/styles/avian-pathology": "Avian Pathology",
		"http://www.zotero.org/styles/aviation-space-and-environmental-medicine": "Aviation, Space, and Environmental Medicine",
		"http://www.zotero.org/styles/basic-and-applied-ecology": "Basic and Applied Ecology",
		"http://www.zotero.org/styles/bba-biochimica-et-biophysica-acta": "BBA - Biochimica et Biophysica Acta",
		"http://www.zotero.org/styles/bibtex": "BibTex generic citation style",
		"http://www.zotero.org/styles/biochemistry": "Biochemistry",
		"http://www.zotero.org/styles/bioconjugate-chemistry": "Bioconjugate Chemistry",
		"http://www.zotero.org/styles/bioelectromagnetics": "Bioelectromagnetics",
		"http://www.zotero.org/styles/bioessays": "BioEssays",
		"http://www.zotero.org/styles/bioinformatics": "Bioinformatics",
		"http://www.zotero.org/styles/biological-psychiatry": "Biological Psychiatry",
		"http://www.zotero.org/styles/bioorganic-and-medicinal-chemistry-letters": "Bioorganic & Medicinal Chemistry Letters",
		"http://www.zotero.org/styles/biophysical-journal": "Biophysical Journal",
		"http://www.zotero.org/styles/biotechnology-and-bioengineering": "Biotechnology and Bioengineering",
		"http://www.zotero.org/styles/biotropica": "Biotropica",
		"http://www.zotero.org/styles/blank": "Hide citations and bibliography",
		"http://www.zotero.org/styles/blood": "Blood",
		"http://www.zotero.org/styles/bluebook-inline": "Bluebook Inline",
		"http://www.zotero.org/styles/bluebook-law-review": "Bluebook Law Review",
		"http://www.zotero.org/styles/bluebook2": "Bluebook Law Review (2)",
		"http://www.zotero.org/styles/bmc-bioinformatics": "BMC Bioinformatics",
		"http://www.zotero.org/styles/bmj": "BMJ",
		"http://www.zotero.org/styles/bone-marrow-transplantation": "Bone Marrow Transplantation",
		"http://www.zotero.org/styles/bone": "Bone",
		"http://www.zotero.org/styles/brain": "Brain",
		"http://www.zotero.org/styles/brazilian-journal-of-nature-conservation": "Natureza & Conserva\u00c3\u00a7\u00c3\u00a3o (Brazilian Journal of Nature Conservation) (Portuguese - Brazil)",
		"http://www.zotero.org/styles/briefings-in-bioinformatics": "Briefings in Bioinformatics",
		"http://www.zotero.org/styles/british-ecological-society": "British Ecological Society",
		"http://www.zotero.org/styles/british-journal-of-haematology": "British Journal of Haematology",
		"http://www.zotero.org/styles/british-journal-of-political-science": "British Journal of Political Science",
		"http://www.zotero.org/styles/british-psychological-society": "British Psychological Society",
		"http://www.zotero.org/styles/building-structure": "Building Structure",
		"http://www.zotero.org/styles/bulletin-de-la-societe-prehistorique-francaise": "Bulletin de la Soci\u00c3\u00a9t\u00c3\u00a9 pr\u00c3\u00a9historique fran\u00c3\u00a7aise (BSPF) (French)",
		"http://www.zotero.org/styles/catholic-biblical-association": "Catholic Biblical Association (Full Note)",
		"http://www.zotero.org/styles/cell-calcium": "Cell Calcium",
		"http://www.zotero.org/styles/cell-numeric": "Cell Journals (numeric)",
		"http://www.zotero.org/styles/cell-transplantation": "Cell Transplantation",
		"http://www.zotero.org/styles/cell": "Cell",
		"http://www.zotero.org/styles/centaurus": "Centaurus",
		"http://www.zotero.org/styles/cerebral-cortex": "Cerebral Cortex",
		"http://www.zotero.org/styles/chemical-research-in-toxicology": "Chemical Research in Toxicology",
		"http://www.zotero.org/styles/chest": "Chest",
		"http://www.zotero.org/styles/chicago-annotated-bibliography": "Chicago Manual of Style (note, annotated bibliography)",
		"http://www.zotero.org/styles/chicago-author-date-basque": "Chicago Manual of Style (author-date, Basque)",
		"http://www.zotero.org/styles/chicago-author-date-de": "Chicago Manual of Style (author-date, German)",
		"http://www.zotero.org/styles/chicago-author-date": "Chicago Manual of Style (author-date)",
		"http://www.zotero.org/styles/chicago-dated-note-biblio-no-ibid": "Chicago Manual of Style (dated note, no Ibid.)",
		"http://www.zotero.org/styles/chicago-fullnote-bibliography-delimiter-fixes": "Chicago Manual of Style (full note) [delimiter fixes]",
		"http://www.zotero.org/styles/chicago-fullnote-bibliography-no-ibid-delimiter-fixes": "Chicago Manual of Style (full note, no Ibid.) [delimiter fixes]",
		"http://www.zotero.org/styles/chicago-fullnote-bibliography-no-ibid": "Chicago Manual of Style (full note, no Ibid.)",
		"http://www.zotero.org/styles/chicago-fullnote-bibliography": "Chicago Manual of Style (full note)",
		"http://www.zotero.org/styles/chicago-library-list": "Chicago Manual of Style (library list)",
		"http://www.zotero.org/styles/chicago-note-biblio-no-ibid": "Chicago Manual of Style (note, no Ibid.)",
		"http://www.zotero.org/styles/chicago-note-bibliography": "Chicago Manual of Style (note)",
		"http://www.zotero.org/styles/chicago-quick-copy": "Chicago Manual of Style (quick copy)",
		"http://www.zotero.org/styles/chinese-gb7714-1987-numeric": "Chinese Std GB/T 7714-1987 (numeric)",
		"http://www.zotero.org/styles/chinese-gb7714-2005-numeric": "Chinese Std GB/T 7714-2005 (numeric)",
		"http://www.zotero.org/styles/circulation": "Circulation",
		"http://www.zotero.org/styles/climatic-change": "Climatic Change",
		"http://www.zotero.org/styles/clinical-cancer-research": "Clinical Cancer Research",
		"http://www.zotero.org/styles/clinical-infectious-diseases": "Clinical Infectious Diseases",
		"http://www.zotero.org/styles/clinical-neurophysiology": "Clinical Neurophysiology",
		"http://www.zotero.org/styles/clinical-orthopaedics-and-related-research": "Clinical Orthopaedics and Related Research",
		"http://www.zotero.org/styles/cns-and-neurological-disorders-drug-targets": "CNS & Neurological Disorders - Drug Targets",
		"http://www.zotero.org/styles/cold-spring-harbor-laboratory-press": "Cold Spring Harbor Laboratory Press",
		"http://www.zotero.org/styles/conservation-biology": "Conservation Biology",
		"http://www.zotero.org/styles/copernicus-publications": "Copernicus Publications",
		"http://www.zotero.org/styles/council-of-science-editors-author-date": "Council of Science Editors (CSE) (author-date)",
		"http://www.zotero.org/styles/council-of-science-editors": "Council of Science Editors (CSE)",
		"http://www.zotero.org/styles/critical-care-medicine": "Critical Care Medicine",
		"http://www.zotero.org/styles/culture-medicine-and-psychiatry": "Culture, Medicine, and Psychiatry",
		"http://www.zotero.org/styles/current-opinion": "Current Opinion in ...",
		"http://www.zotero.org/styles/current-protocols": "Current Protocols in ...",
		"http://www.zotero.org/styles/currents-in-biblical-research": "Currents in Biblical Research",
		"http://www.zotero.org/styles/cytometry": "Cytometry",
		"http://www.zotero.org/styles/dendrochronologia": "Dendrochronologia",
		"http://www.zotero.org/styles/din-1505-2": "DIN 1505-2 (author-date, German)",
		"http://www.zotero.org/styles/diplo": "Diplo",
		"http://www.zotero.org/styles/drug-and-alcohol-dependence": "Drug and Alcohol Dependence",
		"http://www.zotero.org/styles/earth-surface-processes-and-landforms": "Earth Surface Processes and Landforms",
		"http://www.zotero.org/styles/ecological-modelling": "Ecological Modelling",
		"http://www.zotero.org/styles/ecology-letters": "Ecology Letters",
		"http://www.zotero.org/styles/ecology": "Ecology",
		"http://www.zotero.org/styles/ecoscience": "Ecoscience",
		"http://www.zotero.org/styles/elsevier-harvard-without-titles": "Elsevier's Harvard Style (without titles)",
		"http://www.zotero.org/styles/elsevier-harvard": "Elsevier's Harvard Style (with titles)",
		"http://www.zotero.org/styles/elsevier-radiological": "European Radiology, Neuroradiology",
		"http://www.zotero.org/styles/elsevier-vancouver": "Elsevier Vancouver",
		"http://www.zotero.org/styles/elsevier-with-titles": "Elsevier (with titles)",
		"http://www.zotero.org/styles/elsevier-without-titles": "Elsevier (without titles)",
		"http://www.zotero.org/styles/emerald-harvard": "Emerald Journals (Harvard)",
		"http://www.zotero.org/styles/entomologia-experimentalis-et-applicata": "Entomologia Experimentalis et Applicata",
		"http://www.zotero.org/styles/environmental-and-engineering-geoscience": "Environmental & Engineering Geoscience",
		"http://www.zotero.org/styles/environmental-and-experimental-botany": "Environmental and Experimental Botany",
		"http://www.zotero.org/styles/environmental-conservation": "Environmental Conservation",
		"http://www.zotero.org/styles/environmental-health-perspectives": "Environmental Health Perspectives",
		"http://www.zotero.org/styles/environmental-microbiology": "Environmental Microbiology",
		"http://www.zotero.org/styles/epidemiologie-et-sante-animale": "Epidemiologie et Sante Animale",
		"http://www.zotero.org/styles/ergoscience": "ergoscience",
		"http://www.zotero.org/styles/ethics-book-reviews": "Ethics (for book reviews)",
		"http://www.zotero.org/styles/european-cells-and-materials": "European Cells & Materials (eCM)",
		"http://www.zotero.org/styles/european-heart-journal": "European Heart Journal",
		"http://www.zotero.org/styles/european-journal-of-neuroscience": "European Journal of Neuroscience",
		"http://www.zotero.org/styles/european-journal-of-ophthalmology": "European Journal of Ophthalmology",
		"http://www.zotero.org/styles/european-journal-of-soil-science": "European Journal of Soil Science",
		"http://www.zotero.org/styles/european-retail-research": "European Retail Research",
		"http://www.zotero.org/styles/eye": "Eye",
		"http://www.zotero.org/styles/fachhochschule-vorarlberg": "Fachhochschule Vorarlberg (FHV) (German)",
		"http://www.zotero.org/styles/febs-journal": "FEBS Journal",
		"http://www.zotero.org/styles/fems": "Federation of European Microbiological Societies (FEMS)",
		"http://www.zotero.org/styles/fish-and-fisheries": "Fish and Fisheries",
		"http://www.zotero.org/styles/french1": "France (tous les auteurs, num\u00c3\u00a9rotation)",
		"http://www.zotero.org/styles/french2": "France (auteurs et al., num\u00c3\u00a9rotation)",
		"http://www.zotero.org/styles/french3": "France (tous les auteurs, auteur-date)",
		"http://www.zotero.org/styles/french4": "France (auteurs et al., auteur-date)",
		"http://www.zotero.org/styles/freshwater-biology": "Freshwater Biology",
		"http://www.zotero.org/styles/frontiers": "Frontiers Journals",
		"http://www.zotero.org/styles/fungal-ecology": "Fungal Ecology",
		"http://www.zotero.org/styles/future-medicine-journals": "Future Medicine Journals",
		"http://www.zotero.org/styles/gastroenterology": "Gastroenterology",
		"http://www.zotero.org/styles/genetics": "Genetics",
		"http://www.zotero.org/styles/genome-biology-and-evolution": "Genome Biology and Evolution",
		"http://www.zotero.org/styles/genome-biology": "Genome Biology",
		"http://www.zotero.org/styles/geoderma": "Geoderma",
		"http://www.zotero.org/styles/geological-magazine": "Geological Magazine",
		"http://www.zotero.org/styles/geological-society-of-america": "Geological Society of America",
		"http://www.zotero.org/styles/geomorphology": "Geomorphology",
		"http://www.zotero.org/styles/geopolitics": "Geopolitics",
		"http://www.zotero.org/styles/global-ecology-and-biogeography": "Global Ecology and Biogeography",
		"http://www.zotero.org/styles/gost-r-7-0-5-2008-csl-1-0": "Russian GOST R 7.0.5-2008 CSL 1.0",
		"http://www.zotero.org/styles/gost-r-7-0-5-2008-numeric": "Russian GOST R 7.0.5-2008 (numeric)",
		"http://www.zotero.org/styles/gost-r-7-0-5-2008": "Russian GOST R 7.0.5-2008",
		"http://www.zotero.org/styles/graefes-archive-clinical-and-experimental-ophthalmology": "Graefe's Archive for Clinical and Experimental Ophthalmology",
		"http://www.zotero.org/styles/harvard-anglia-ruskin": "Harvard - Anglia Ruskin University 2011",
		"http://www.zotero.org/styles/harvard-cardiff-university": "Harvard - Cardiff University",
		"http://www.zotero.org/styles/harvard-european-archaeology": "Harvard - European Archaeology",
		"http://www.zotero.org/styles/harvard-imperial-college-london": "Harvard - Imperial College London",
		"http://www.zotero.org/styles/harvard-institut-fur-praxisforschung-de": "Harvard - Institut f\u00c3\u00bcr Praxisforschung (Bahr & Frackmann) (German)",
		"http://www.zotero.org/styles/harvard-kings-college-london": "Harvard - King's College London",
		"http://www.zotero.org/styles/harvard-leeds-metropolitan-university": "Harvard - Leeds Metropolitan University",
		"http://www.zotero.org/styles/harvard-limerick": "Harvard - University of Limerick (Cite it Right)",
		"http://www.zotero.org/styles/harvard-manchester-business-school": "Harvard - Manchester Business School",
		"http://www.zotero.org/styles/harvard-sheffield": "Harvard - University of Sheffield - Town and Regional Planning Department",
		"http://www.zotero.org/styles/harvard-sheffield1": "Harvard - University of Sheffield - East Asian Studies",
		"http://www.zotero.org/styles/harvard-staffordshire-university": "Harvard - Staffordshire University",
		"http://www.zotero.org/styles/harvard-university-of-leeds": "Harvard - University of Leeds",
		"http://www.zotero.org/styles/harvard-university-of-sunderland": "Harvard - University of Sunderland",
		"http://www.zotero.org/styles/harvard-university-of-the-west-of-england": "Harvard - University of the West of England (UWE Bristol)",
		"http://www.zotero.org/styles/harvard-university-of-wolverhampton": "University of Wolverhampton (Harvard)",
		"http://www.zotero.org/styles/harvard1-unisa-gbfe": "Harvard Reference format (Unisa / GBFE) (author-date, German)",
		"http://www.zotero.org/styles/harvard1": "Harvard Reference format 1 (author-date)",
		"http://www.zotero.org/styles/harvard1de": "Harvard Reference format 1 (author-date, German)",
		"http://www.zotero.org/styles/harvard3": "Harvard Reference format 3",
		"http://www.zotero.org/styles/harvard7de": "Harvard Reference format 7 (author-date, German)",
		"http://www.zotero.org/styles/hawaii-international-conference-on-system-sciences-proceedings": "Hawaii International Conference on System Sciences (HICSS) Proceedings",
		"http://www.zotero.org/styles/health-services-research": "Health Services Research",
		"http://www.zotero.org/styles/hepatology": "Hepatology",
		"http://www.zotero.org/styles/heredity": "Heredity",
		"http://www.zotero.org/styles/history-and-theory": "History and Theory",
		"http://www.zotero.org/styles/history-of-the-human-sciences": "History of the Human Sciences",
		"http://www.zotero.org/styles/hong-kong-journal-of-radiology": "Hong Kong Journal of Radiology",
		"http://www.zotero.org/styles/hormone-and-metabolic-research": "Hormone and Metabolic Research",
		"http://www.zotero.org/styles/human-resource-management-journal": "Human Resource Management Journal",
		"http://www.zotero.org/styles/hwr-berlin": "Hochschule f\u00c3\u00bcr Wirtschaft und Recht Berlin (HWR Berlin) (German)",
		"http://www.zotero.org/styles/hydrogeology-journal": "Hydrogeology Journal",
		"http://www.zotero.org/styles/hydrological-sciences-journal": "Hydrological Sciences Journal",
		"http://www.zotero.org/styles/hypotheses-in-the-life-sciences": "Hypotheses in the Life Sciences (HyLS)",
		"http://www.zotero.org/styles/ieee-w-url": "IEEE with URL",
		"http://www.zotero.org/styles/ieee": "IEEE",
		"http://www.zotero.org/styles/inflammatory-bowel-diseases": "Inflammatory Bowel Diseases",
		"http://www.zotero.org/styles/information-communication-and-society": "Information, Communication & Society",
		"http://www.zotero.org/styles/institute-of-physics-harvard": "Institute of Physics (IOP) (Harvard)",
		"http://www.zotero.org/styles/institute-of-physics-numeric": "Institute of Physics (IOP) (numeric)",
		"http://www.zotero.org/styles/inter-research-science-center": "Inter-Research Science Center",
		"http://www.zotero.org/styles/inter-ro": "Romanian Institute for Inter-Orthodox, Inter-Confessional and Inter-Religious Studies (INTER)",
		"http://www.zotero.org/styles/international-journal-of-audiology": "International Journal of Audiology",
		"http://www.zotero.org/styles/international-journal-of-cancer": "International Journal of Cancer",
		"http://www.zotero.org/styles/international-journal-of-exercise-science": "International Journal of Exercise Science",
		"http://www.zotero.org/styles/international-journal-of-hydrogen-energy": "International Journal of Hydrogen Energy",
		"http://www.zotero.org/styles/international-journal-of-production-economics": "International Journal of Production Economics",
		"http://www.zotero.org/styles/international-journal-of-radiation-oncology-biology-physics": "International Journal of Radiation Oncology Biology Physics",
		"http://www.zotero.org/styles/international-journal-of-solids-and-structures": "International Journal of Solids and Structures",
		"http://www.zotero.org/styles/international-organization": "International Organization",
		"http://www.zotero.org/styles/international-pig-veterinary-society-congress-proceedings": "International Pig Veterinary Society (IPVS) Congress Proceedings",
		"http://www.zotero.org/styles/international-studies-association": "International Studies Association",
		"http://www.zotero.org/styles/investigative-radiology": "Investigative Radiology",
		"http://www.zotero.org/styles/invisu": "InVisu (French)",
		"http://www.zotero.org/styles/irish-historical-studies": "Irish Historical Studies",
		"http://www.zotero.org/styles/iso690-author-date-en": "ISO-690 (author-date, English)",
		"http://www.zotero.org/styles/iso690-author-date-fr": "ISO-690 (author-date, French)",
		"http://www.zotero.org/styles/iso690-author-date": "ISO-690 (author-date) - UNFINISHED",
		"http://www.zotero.org/styles/iso690-numeric-en": "ISO-690 (numeric, English)",
		"http://www.zotero.org/styles/iso690-numeric-fr": "ISO-690 (numeric, French)",
		"http://www.zotero.org/styles/iso690-numeric-sk": "ISO-690 (numeric, Slovak)",
		"http://www.zotero.org/styles/javnost-the-public": "Javnost - The Public",
		"http://www.zotero.org/styles/journal-of-agricultural-and-food-chemistry": "Journal of Agricultural and Food Chemistry",
		"http://www.zotero.org/styles/journal-of-alzheimers-disease": "Journal of Alzheimer's Disease",
		"http://www.zotero.org/styles/journal-of-applied-animal-science": "Journal of Applied Animal Science",
		"http://www.zotero.org/styles/journal-of-applied-ecology": "Journal of Applied Ecology",
		"http://www.zotero.org/styles/journal-of-biological-chemistry": "The Journal of Biological Chemistry (JBC)",
		"http://www.zotero.org/styles/journal-of-biomolecular-structure-and-dynamics": "Journal of Biomolecular Structure and Dynamics",
		"http://www.zotero.org/styles/journal-of-chemical-ecology": "Journal of Chemical Ecology",
		"http://www.zotero.org/styles/journal-of-clinical-investigation": "Journal of Clinical Investigation",
		"http://www.zotero.org/styles/journal-of-clinical-oncology": "Journal of Clinical Oncology",
		"http://www.zotero.org/styles/journal-of-community-health": "Journal of Community Health",
		"http://www.zotero.org/styles/journal-of-dental-research": "Journal of Dental Research",
		"http://www.zotero.org/styles/journal-of-elections-public-opinion-and-parties": "Journal of Elections, Public Opinion & Parties",
		"http://www.zotero.org/styles/journal-of-evolutionary-biology": "Journal of Evolutionary Biology",
		"http://www.zotero.org/styles/journal-of-field-ornithology": "Journal of Field Ornithology",
		"http://www.zotero.org/styles/journal-of-fish-diseases": "Journal of Fish Diseases",
		"http://www.zotero.org/styles/journal-of-food-protection": "Journal of Food Protection",
		"http://www.zotero.org/styles/journal-of-forensic-sciences": "Journal of Forensic Sciences",
		"http://www.zotero.org/styles/journal-of-geography-in-higher-education": "Journal of Geography in Higher Education",
		"http://www.zotero.org/styles/journal-of-health-economics": "Journal of Health Economics",
		"http://www.zotero.org/styles/journal-of-hellenic-studies": "Journal of Hellenic Studies",
		"http://www.zotero.org/styles/journal-of-hepatology": "Journal of Hepatology",
		"http://www.zotero.org/styles/journal-of-management-information-systems": "Journal of Management Information Systems",
		"http://www.zotero.org/styles/journal-of-marketing": "Journal of Marketing",
		"http://www.zotero.org/styles/journal-of-molecular-biology": "Journal of Molecular Biology",
		"http://www.zotero.org/styles/journal-of-molecular-endocrinology": "Journal of Molecular Endocrinology",
		"http://www.zotero.org/styles/journal-of-neurophysiology": "Journal of Neurophysiology",
		"http://www.zotero.org/styles/journal-of-neurosurgery": "Journal of Neurosurgery",
		"http://www.zotero.org/styles/journal-of-orthopaedic-trauma": "Journal of Orthopaedic Trauma",
		"http://www.zotero.org/styles/journal-of-pollination-ecology": "Journal of Pollination Ecology",
		"http://www.zotero.org/styles/journal-of-pragmatics": "Journal of Pragmatics",
		"http://www.zotero.org/styles/journal-of-psychiatry-and-neuroscience": "Journal of Psychiatry & Neuroscience",
		"http://www.zotero.org/styles/journal-of-shoulder-and-elbow-surgery": "Journal of Shoulder and Elbow Surgery",
		"http://www.zotero.org/styles/journal-of-social-archaeology": "Journal of Social Archaeology",
		"http://www.zotero.org/styles/journal-of-studies-on-alcohol-and-drugs": "Journal of Studies on Alcohol and Drugs",
		"http://www.zotero.org/styles/journal-of-the-academy-of-nutrition-and-dietetics": "Journal of the Academy of Nutrition and Dietetics",
		"http://www.zotero.org/styles/journal-of-the-air-and-waste-management-association": "Journal of the Air & Waste Managmenet Association (JAWMA)",
		"http://www.zotero.org/styles/journal-of-the-american-college-of-cardiology": "Journal of the American College of Cardiology (JACC)",
		"http://www.zotero.org/styles/journal-of-the-american-society-of-nephrology": "Journal of the American Society of Nephrology",
		"http://www.zotero.org/styles/journal-of-the-american-water-resources-association": "Journal of the American Water Resources Association (JAWRA)",
		"http://www.zotero.org/styles/journal-of-the-royal-anthropological-institute": "Journal of the Royal Anthropological Institute",
		"http://www.zotero.org/styles/journal-of-the-torrey-botanical-society": "Journal of the Torrey Botanical Society",
		"http://www.zotero.org/styles/journal-of-tropical-ecology": "Journal of Tropical Ecology",
		"http://www.zotero.org/styles/journal-of-vertebrate-paleontology": "Journal of Vertebrate Paleontology",
		"http://www.zotero.org/styles/journal-of-wildlife-diseases": "Journal of Wildlife Diseases",
		"http://www.zotero.org/styles/journal-of-wildlife-management": "The Journal of Wildlife Management",
		"http://www.zotero.org/styles/journalistica": "Journalistica",
		"http://www.zotero.org/styles/juristische-zitierweise-deutsch": "Juristische Zitierweise (St\u00c3\u00bcber) (German)",
		"http://www.zotero.org/styles/karger-journals-author-date": "Karger Journals (author-date)",
		"http://www.zotero.org/styles/karger-journals": "Karger Journals",
		"http://www.zotero.org/styles/knee-surgery-sports-traumatology-arthroscopy": "Knee Surgery, Sports Traumatology, Arthroscopy (KSSTA)",
		"http://www.zotero.org/styles/kolner-zeitschrift-fur-soziologie-und-sozialpsychologie": "K\u00c3\u00b6lner Zeitschrift f\u00c3\u00bcr Soziologie und Sozialpsychologie (KZfSS) (German)",
		"http://www.zotero.org/styles/kritische-ausgabe": "Kritische Ausgabe (German)",
		"http://www.zotero.org/styles/lancet": "The Lancet",
		"http://www.zotero.org/styles/language-in-society": "Language in Society",
		"http://www.zotero.org/styles/language": "Language",
		"http://www.zotero.org/styles/law1-de": "Law generic style (note with bibliography, German)",
		"http://www.zotero.org/styles/les-journees-de-la-recherche-porcine": "Les Journ\u00c3\u00a9es de la Recherche Porcine (French)",
		"http://www.zotero.org/styles/lettres-et-sciences-humaines-fr": "Lettres et Sciences Humaines Fran\u00c3\u00a7aises (biblio et notes, French)",
		"http://www.zotero.org/styles/leviathan": "Leviathan",
		"http://www.zotero.org/styles/lichenologist": "The Lichenologist",
		"http://www.zotero.org/styles/limnology-and-oceanography": "Limnology and Oceanography",
		"http://www.zotero.org/styles/lncs": "Springer LNCS",
		"http://www.zotero.org/styles/lncs2": "Springer LNCS Sorted",
		"http://www.zotero.org/styles/mammal-review": "Mammal Review",
		"http://www.zotero.org/styles/manchester-university-press": "Manchester University Press Monographs",
		"http://www.zotero.org/styles/marine-policy": "Marine Policy",
		"http://www.zotero.org/styles/mbio": "mBio",
		"http://www.zotero.org/styles/mcgill-guide-v7": "Canadian Guide to Uniform Legal Citation, 7th ed. (McGill Guide)",
		"http://www.zotero.org/styles/mcgill-legal": "Canadian Legal - McGill",
		"http://www.zotero.org/styles/mcrj7": "Manuel canadien de la r\u00c3\u00a9f\u00c3\u00a9rence juridique 7e \u00c3\u00a9d. (note et bibliographie, French)",
		"http://www.zotero.org/styles/medecine-sciences": "M\u00c3\u00a9decine/Sciences",
		"http://www.zotero.org/styles/media-culture-and-society": "Media, Culture and Society",
		"http://www.zotero.org/styles/medicine-and-science-in-sports-and-exercise": "Medicine & Science in Sports & Exercise",
		"http://www.zotero.org/styles/metabolic-engineering": "Metabolic Engineering",
		"http://www.zotero.org/styles/metallurgical-and-materials-transactions": "Metallurgical and Materials Transactions",
		"http://www.zotero.org/styles/meteoritics-and-planetary-science": "Meteoritics & Planetary Science",
		"http://www.zotero.org/styles/methods-information-medicine": "Methods of Information in Medicine",
		"http://www.zotero.org/styles/mhra": "Modern Humanities Research Association (note with bibliography)",
		"http://www.zotero.org/styles/microbial-ecology": "Microbial Ecology",
		"http://www.zotero.org/styles/microscopy-and-microanalysis": "Microscopy and Microanalysis",
		"http://www.zotero.org/styles/mis-quarterly": "MIS Quarterly",
		"http://www.zotero.org/styles/mla-notes": "MLA (Notes - 6th edition)",
		"http://www.zotero.org/styles/mla-underline": "Modern Language Association (underline)",
		"http://www.zotero.org/styles/mla-url": "Modern Language Association with URL",
		"http://www.zotero.org/styles/mla": "Modern Language Association",
		"http://www.zotero.org/styles/molecular-biochemical-parasitology": "Molecular and Biochemical Parasitology",
		"http://www.zotero.org/styles/molecular-biology-and-evolution": "Molecular Biology and Evolution",
		"http://www.zotero.org/styles/mol-eco": "Molecular Ecology",
		"http://www.zotero.org/styles/molecular-psychiatry-letters": "Molecular Psychiatry (letters to the editor)",
		"http://www.zotero.org/styles/molecular-psychiatry": "Molecular Psychiatry",
		"http://www.zotero.org/styles/molecular-therapy": "Molecular Therapy",
		"http://www.zotero.org/styles/multidisciplinary-digital-publishing-institute": "Multidisciplinary Digital Publishing Institute (MDPI)",
		"http://www.zotero.org/styles/multiple-sclerosis-journal": "Multiple Sclerosis Journal",
		"http://www.zotero.org/styles/nano-biomedicine-and-engineering": "Nano Biomedicine and Engineering",
		"http://www.zotero.org/styles/nanotechnology": "Nanotechnology",
		"http://www.zotero.org/styles/national-archives-of-australia": "National Archives of Australia",
		"http://www.zotero.org/styles/national-library-of-medicine-grant": "National Library of Medicine - Grant with PMID",
		"http://www.zotero.org/styles/nature-neuroscience-brief-communication": "Nature Neuroscience Brief Communication",
		"http://www.zotero.org/styles/nature-no-superscript": "Nature Journal (no superscript)",
		"http://www.zotero.org/styles/nature": "Nature",
		"http://www.zotero.org/styles/neuropsychologia": "Neuropsychologia",
		"http://www.zotero.org/styles/neuropsychopharmacology": "Neuropsychopharmacology",
		"http://www.zotero.org/styles/neuroreport": "Neuroreport",
		"http://www.zotero.org/styles/neuroscience-letters": "Neuroscience Letters",
		"http://www.zotero.org/styles/neuroscience-research": "Neuroscience Research",
		"http://www.zotero.org/styles/new-england-journal-of-medicine": "New England Journal of Medicine",
		"http://www.zotero.org/styles/new-phytologist": "New Phytologist",
		"http://www.zotero.org/styles/new-zealand-plant-protection": "New Zealand Plant Protection",
		"http://www.zotero.org/styles/northeastern-naturalist": "Northeastern Naturalist",
		"http://www.zotero.org/styles/nucleic-acids-research": "Nucleic Acids Research",
		"http://www.zotero.org/styles/oecologia": "Oecologia",
		"http://www.zotero.org/styles/oikos": "Oikos",
		"http://www.zotero.org/styles/oncogene": "Oncogene",
		"http://www.zotero.org/styles/open-university-a251": "Open University Arts Course A251",
		"http://www.zotero.org/styles/open-university-harvard": "Open University (Harvard)",
		"http://www.zotero.org/styles/open-university-numeric": "Open University (numeric)",
		"http://www.zotero.org/styles/ophthalmology": "Ophthalmology",
		"http://www.zotero.org/styles/optical-society-of-america": "Optical Society of America (OSA)",
		"http://www.zotero.org/styles/organic-geochemistry": "Organic Geochemistry",
		"http://www.zotero.org/styles/organization-science": "Organization Science",
		"http://www.zotero.org/styles/oryx": "Oryx",
		"http://www.zotero.org/styles/oscola-no-ibid": "OSCOLA - Oxford Standard for Citation of Legal Authorities (no Ibid. and \"(n__)\")",
		"http://www.zotero.org/styles/oscola": "Oxford Standard for Citation of Legal Authorities (OSCOLA)",
		"http://www.zotero.org/styles/osterreichische-zeitschrift-fur-politikwissenschaft": "\u00c3\u2013sterreichische Zeitschrift f\u00c3\u00bcr Politikwissenschaft (OEZP) (German - Austria)",
		"http://www.zotero.org/styles/oxford-art-journal": "Oxford Art Journal",
		"http://www.zotero.org/styles/padagogische-hochschule-heidelberg": "P\u00c3\u00a4dagogische Hochschule Heidelberg (PH Heidelberg) (German)",
		"http://www.zotero.org/styles/palaeontologia-electronica": "Palaeontologia Electronica",
		"http://www.zotero.org/styles/palaeontology": "Palaeontology",
		"http://www.zotero.org/styles/pbsjournals-asbp": "Polish Botanical Society Journals - Acta Societatis Botanicorum Poloniae",
		"http://www.zotero.org/styles/pharmacoeconomics": "PharmacoEconomics",
		"http://www.zotero.org/styles/plant-cell": "Plant Cell",
		"http://www.zotero.org/styles/plant-physiology": "Plant Physiology",
		"http://www.zotero.org/styles/plos": "Public Library of Science (PLoS)",
		"http://www.zotero.org/styles/pnas": "Proceedings of the National Academy of Sciences of the United States of America (PNAS)",
		"http://www.zotero.org/styles/political-studies": "Political Studies",
		"http://www.zotero.org/styles/politische-vierteljahresschrift": "Politische Vierteljahresschrift (German)",
		"http://www.zotero.org/styles/pontifical-biblical-institute": "Pontifical Biblical Institute",
		"http://www.zotero.org/styles/proceedings-of-the-royal-society-b": "Proceedings of the Royal Society B",
		"http://www.zotero.org/styles/protein-science": "Protein Science",
		"http://www.zotero.org/styles/proteomics": "PROTEOMICS",
		"http://www.zotero.org/styles/psychiatry-and-clinical-neurosciences": "Psychiatry and Clinical Neurosciences",
		"http://www.zotero.org/styles/public-health-nutrition": "Public Health Nutrition",
		"http://www.zotero.org/styles/radiopaedia": "Radiopaedia",
		"http://www.zotero.org/styles/research-policy": "Research Policy",
		"http://www.zotero.org/styles/resources-conservation-and-recycling": "Resources, Conservation and Recycling",
		"http://www.zotero.org/styles/revista-brasileira-de-botanica": "Revista Brasileira de Bot\u00c3\u00a2nica (Brazilian Journal of Botany)",
		"http://www.zotero.org/styles/revue-dhistoire-moderne-et-contemporaine": "Revue d'histoire moderne et contemporaine (French)",
		"http://www.zotero.org/styles/rockefeller-university-press": "Rockefeller University Press",
		"http://www.zotero.org/styles/romanian-humanities": "Romanian Humanities",
		"http://www.zotero.org/styles/rose-school": "ROSE School",
		"http://www.zotero.org/styles/royal-society-of-chemistry": "Royal Society of Chemistry",
		"http://www.zotero.org/styles/rtf-scan": "RTF Scan",
		"http://www.zotero.org/styles/sage-harvard": "Sage Harvard",
		"http://www.zotero.org/styles/sage-vancouver": "Sage Vancouver",
		"http://www.zotero.org/styles/sbl-fullnote-bibliography": "Society of Biblical Literature (Full Note)",
		"http://www.zotero.org/styles/scandinavian-political-studies": "Scandinavian Political Studies",
		"http://www.zotero.org/styles/science-of-the-total-environment": "Science of the Total Environment",
		"http://www.zotero.org/styles/science-translational-medicine": "Science Translational Medicine",
		"http://www.zotero.org/styles/science": "Science",
		"http://www.zotero.org/styles/sexual-development": "Sexual Development",
		"http://www.zotero.org/styles/small-wiley": "Small",
		"http://www.zotero.org/styles/social-science-and-medicine": "Social Science and Medicine",
		"http://www.zotero.org/styles/social-studies-of-science": "Social Studies of Science",
		"http://www.zotero.org/styles/sociedade-brasileira-de-computacao": "Sociedade Brasileira de Computa\u00c3\u00a7\u00c3\u00a3o",
		"http://www.zotero.org/styles/societe-nationale-des-groupements-techniques-veterinaires": "Societe Nationale des Groupements Techniques Veterinaires",
		"http://www.zotero.org/styles/society-for-american-archaeology": "Society for American Archaeology (author-date)",
		"http://www.zotero.org/styles/society-for-general-microbiology": "Society for General Microbiology",
		"http://www.zotero.org/styles/society-for-historical-archaeology": "Society for Historical Archaeology",
		"http://www.zotero.org/styles/socio-economic-review": "Socio Economic Review",
		"http://www.zotero.org/styles/spanish-legal": "Spanish Legal",
		"http://www.zotero.org/styles/spie-bios": "SPIE BiOS",
		"http://www.zotero.org/styles/spie-journals": "SPIE Journals",
		"http://www.zotero.org/styles/spip-cite": "SPIP-Cite",
		"http://www.zotero.org/styles/springer-author-date": "Springer Author Date",
		"http://www.zotero.org/styles/springer-plasmonics": "Springer Plasmonics",
		"http://www.zotero.org/styles/springer-vancouver": "Springer Vancouver",
		"http://www.zotero.org/styles/standards-in-genomic-sciences": "Standards in Genomic Sciences",
		"http://www.zotero.org/styles/stroke": "Stroke",
		"http://www.zotero.org/styles/surgical-neurology-international": "Surgical Neurology International",
		"http://www.zotero.org/styles/tah-gkw": "tah Geistes- und Kulturwissenschaften (German)",
		"http://www.zotero.org/styles/tah-soz": "tah Sozialwissenschaften (German)",
		"http://www.zotero.org/styles/taylor-and-francis-harvard-x": "Taylor & Francis - Harvard X",
		"http://www.zotero.org/styles/tgm-wien-diplom": "TGM Wien Diplomarbeit (German)",
		"http://www.zotero.org/styles/the-academy-of-management-review": "The Academy of Management Review (AMR)",
		"http://www.zotero.org/styles/the-accounting-review": "The Accounting Review",
		"http://www.zotero.org/styles/the-american-journal-of-gastroenterology": "The American Journal of Gastroenterology (AJG)",
		"http://www.zotero.org/styles/the-american-journal-of-geriatric-pharmacotherapy": "The American Journal of Geriatric Pharmacotherapy",
		"http://www.zotero.org/styles/the-american-journal-of-psychiatry": "The American Journal of Psychiatry",
		"http://www.zotero.org/styles/the-british-journal-of-psychiatry": "The British Journal of Psychiatry",
		"http://www.zotero.org/styles/the-british-journal-of-sociology": "The British Journal of Sociology",
		"http://www.zotero.org/styles/the-embo-journal": "The EMBO Journal",
		"http://www.zotero.org/styles/the-historical-journal": "The Historical Journal",
		"http://www.zotero.org/styles/the-holocene": "The Holocene",
		"http://www.zotero.org/styles/the-isme-journal": "The ISME Journal",
		"http://www.zotero.org/styles/the-journal-of-comparative-neurology": "The Journal of Comparative Neurology",
		"http://www.zotero.org/styles/the-journal-of-eukaryotic-microbiology": "The Journal of Eukaryotic Microbiology",
		"http://www.zotero.org/styles/the-journal-of-experimental-biology": "The Journal of Experimental Biology",
		"http://www.zotero.org/styles/the-journal-of-immunology": "The Journal of Immunology",
		"http://www.zotero.org/styles/the-journal-of-neuropsychiatry-and-clinical-neurosciences": "The Journal of Neuropsychiatry and Clinical Neurosciences",
		"http://www.zotero.org/styles/the-journal-of-neuroscience": "The Journal of Neuroscience",
		"http://www.zotero.org/styles/the-journal-of-physiology": "The Journal of Physiology",
		"http://www.zotero.org/styles/the-journal-of-the-acoustical-society-of-america": "The Journal of the Acoustical Society of America",
		"http://www.zotero.org/styles/the-journal-of-urology": "Journal of Urology",
		"http://www.zotero.org/styles/the-neuroscientist": "The Neuroscientist",
		"http://www.zotero.org/styles/the-oncologist": "The Oncologist",
		"http://www.zotero.org/styles/the-pharmacogenomics-journal": "The Pharmacogenomics Journal",
		"http://www.zotero.org/styles/the-plant-journal": "Plant Journal",
		"http://www.zotero.org/styles/theory-culture-and-society": "Theory, Culture & Society",
		"http://www.zotero.org/styles/toxicon": "Toxicon",
		"http://www.zotero.org/styles/traces": "Traces",
		"http://www.zotero.org/styles/traffic": "Traffic",
		"http://www.zotero.org/styles/trends-journal": "Trends Journals",
		"http://www.zotero.org/styles/tu-wien-dissertation": "TU-Wien Dissertation (German)",
		"http://www.zotero.org/styles/turabian-fullnote-bibliography": "Turabian Style (Full Note with Bibliography)",
		"http://www.zotero.org/styles/un-eclac-cepal-english": "Economic Commission for Latin America and the Caribbean (ECLAC)",
		"http://www.zotero.org/styles/un-eclac-cepal-spanish": "Comision Economica para America Latina y el Caribe (CEPAL)",
		"http://www.zotero.org/styles/unctad-english": "United Nations Conference on Trade and Development (UNCTAD)",
		"http://www.zotero.org/styles/unified-style-linguistics": "Unified Style Sheet for Linguistics Journals",
		"http://www.zotero.org/styles/unisa-harvard": "University of South Australia 2011 (Harvard)",
		"http://www.zotero.org/styles/unisa-harvard3": "University of South Australia 2007 (Harvard)",
		"http://www.zotero.org/styles/universidad-evangelica-del-paraguay": "Universidad Evang\u00c3\u00a9lica del Paraguay (Spanish)",
		"http://www.zotero.org/styles/universita-di-bologna-lettere": "University of Bologna - Liberal Arts College (Universit\u00c3\u00a0 di Bologna - Facolt\u00c3\u00a0 di Lettere e Filosofia) (Italian)",
		"http://www.zotero.org/styles/universite-de-liege-histoire": "Universit\u00c3\u00a9 de Li\u00c3\u00a8ge (ULg) - Histoire (French)",
		"http://www.zotero.org/styles/universite-laval-com": "Universit\u00c3\u00a9 Laval Communications (French)",
		"http://www.zotero.org/styles/university-of-melbourne": "University of Melbourne (Harvard)",
		"http://www.zotero.org/styles/urban-forestry-and-urban-greening": "Urban Forestry and Urban Greening",
		"http://www.zotero.org/styles/urban-habitats": "Urban Habitats",
		"http://www.zotero.org/styles/urban-studies": "Urban Studies",
		"http://www.zotero.org/styles/us-geological-survey": "U.S. Geological Survey",
		"http://www.zotero.org/styles/user-modeling-and-useradapted-interaction": "User Modeling and User-Adapted Interaction (UMUAI)",
		"http://www.zotero.org/styles/vancouver-brackets": "Vancouver with Brackets",
		"http://www.zotero.org/styles/vancouver-superscript-bracket-only-year": "Vancouver with Superscript, Brackets and only year in date",
		"http://www.zotero.org/styles/vancouver-superscript": "Vancouver with Superscript",
		"http://www.zotero.org/styles/vancouver": "Vancouver",
		"http://www.zotero.org/styles/veterinary-medicine-austria": "Veterinary Medicine Austria",
		"http://www.zotero.org/styles/vienna-legal": "Vienna Legal",
		"http://www.zotero.org/styles/water-research": "Water Research",
		"http://www.zotero.org/styles/water-science-and-technology": "Water Science and Technology",
		"http://www.zotero.org/styles/wceam2010": "World Congress for Engineering Asset Management (WCEAM) 2010",
		"http://www.zotero.org/styles/wetlands": "Wetlands",
		"http://www.zotero.org/styles/wheaton-college-phd-in-biblical-and-theological-studies": "Wheaton College Ph.D. in Biblical and Theological Studies",
		"http://www.zotero.org/styles/world-journal-of-biological-psychiatry": "World Journal of Biological Psychiatry",
		"http://www.zotero.org/styles/yeast": "Yeast",
		"http://www.zotero.org/styles/zeitschrift-fur-medienwissenschaft": "Zeitschrift f\u00c3\u00bcr Medienwissenschaft (German)",
		"http://www.zotero.org/styles/academic-medicine": "Academic Medicine",
		"http://www.zotero.org/styles/academy-of-management-journal": "Academy of Management Journal",
		"http://www.zotero.org/styles/accounts-of-chemical-research": "Accounts of Chemical Research",
		"http://www.zotero.org/styles/acs-applied-materials-and-interfaces": "ACS Applied Materials & Interfaces",
		"http://www.zotero.org/styles/acta-anatomica": "Acta Anatomica",
		"http://www.zotero.org/styles/acta-chirurgica-hellenica": "Acta Chirurgica Hellenica",
		"http://www.zotero.org/styles/acta-cytologica": "Acta Cytologica",
		"http://www.zotero.org/styles/acta-gastroenterologica-boliviana": "Acta Gastroenterologica Boliviana",
		"http://www.zotero.org/styles/acta-haematologica": "Acta Haematologica",
		"http://www.zotero.org/styles/acta-medica-colombiana": "Acta Medica Colombiana",
		"http://www.zotero.org/styles/acta-medica-hellenica": "Acta Medica Hellenica",
		"http://www.zotero.org/styles/acta-medica-scandinavica": "Acta Medica Scandinavica",
		"http://www.zotero.org/styles/acta-medica": "Acta Medica",
		"http://www.zotero.org/styles/acta-orthopaedica": "Acta Orthopaedica",
		"http://www.zotero.org/styles/acta-otorrinolaringologica-espanola": "Acta Otorrinolaringol\u00c3\u00b3gica Espa\u00c3\u00b1ola",
		"http://www.zotero.org/styles/acta-paediatrica-japonica": "Acta Paediatrica Japonica",
		"http://www.zotero.org/styles/acta-paediatrica-scandinavica": "Acta Paediatrica Scandinavica",
		"http://www.zotero.org/styles/acta-pharmacologica-sinica": "Acta Pharmacologica Sinica",
		"http://www.zotero.org/styles/acta-tropica": "Acta Tropica",
		"http://www.zotero.org/styles/activox": "Activox",
		"http://www.zotero.org/styles/acupuncture-in-medicine": "Acupuncture in Medicine",
		"http://www.zotero.org/styles/acute-care": "Acute Care",
		"http://www.zotero.org/styles/administrative-sciences": "Administrative Sciences",
		"http://www.zotero.org/styles/adolescent-and-pediatric-gynecology": "Adolescent and Pediatric Gynecology",
		"http://www.zotero.org/styles/advances-physiology-education": "Advances in Physiology Education",
		"http://www.zotero.org/styles/aging-health": "Aging Health",
		"http://www.zotero.org/styles/agricultural-and-forest-meteorology": "Agricultural and Forest Meteorology",
		"http://www.zotero.org/styles/agriculture-ecosystems-environment": "Agriculture, Ecosystems & Environment",
		"http://www.zotero.org/styles/agriculture": "Agriculture",
		"http://www.zotero.org/styles/agronomy-journal": "Agronomy Journal",
		"http://www.zotero.org/styles/agronomy": "Agronomy",
		"http://www.zotero.org/styles/ajp-cell-physiology": "American Journal of Physiology - Cell Physiology",
		"http://www.zotero.org/styles/ajp-endocrinology-and-metabolism": "American Journal of Physiology - Endocrinology and Metabolism",
		"http://www.zotero.org/styles/ajp-gastrointestinal-and-liver-physiology": "American Journal of Physiology - Gastrointestinal and Liver Physiology",
		"http://www.zotero.org/styles/ajp-heart-circulatory-physiology": "American Journal of Physiology - Heart and Circulatory Physiology",
		"http://www.zotero.org/styles/ajp-lung-cellular-and-molecular-physiology": "American Journal of Physiology - Lung Cellular and Molecular Physiology",
		"http://www.zotero.org/styles/ajp-regulatory-integrative-comparative-physiology": "American Journal of Physiology - Regulatory, Integrative, and Comparative Physiology",
		"http://www.zotero.org/styles/ajp-renal-physiology": "American Journal of Physiology - Renal Physiology",
		"http://www.zotero.org/styles/algorithms": "Algorithms",
		"http://www.zotero.org/styles/american-educational-research-journal": "American Educational Research Journal",
		"http://www.zotero.org/styles/american-family-physician": "American Family Physician",
		"http://www.zotero.org/styles/american-heart-journal": "American Heart Journal",
		"http://www.zotero.org/styles/american-journal-of-alzheimers-disease-and-other-dementias": "American Journal of Alzheimer's Disease and Other Dementias",
		"http://www.zotero.org/styles/american-journal-of-bioethics": "American Journal of Bioethics",
		"http://www.zotero.org/styles/american-journal-of-cardiology": "American Journal of Cardiology",
		"http://www.zotero.org/styles/american-journal-of-cardiovascular-drugs": "American Journal of Cardiovascular Drugs",
		"http://www.zotero.org/styles/american-journal-of-chiropractic-medicine": "American Journal of Chiropractic Medicine",
		"http://www.zotero.org/styles/american-journal-of-clinical-dermatology": "American Journal of Clinical Dermatology",
		"http://www.zotero.org/styles/american-journal-of-clinical-nutrition": "American Journal of Clinical Nutrition",
		"http://www.zotero.org/styles/american-journal-of-clinical-research": "American Journal of Clinical Research",
		"http://www.zotero.org/styles/american-journal-of-diseases-of-children": "American Journal of Diseases of Children",
		"http://www.zotero.org/styles/american-journal-of-emergency-medicine": "American Journal of Emergency Medicine",
		"http://www.zotero.org/styles/american-journal-of-hospital-pharmacy": "American Journal of Hospital Pharmacy",
		"http://www.zotero.org/styles/american-journal-of-human-genetics": "American Journal of Human Genetics",
		"http://www.zotero.org/styles/american-journal-of-hypertension": "American Journal of Hypertension",
		"http://www.zotero.org/styles/american-journal-of-infection-control": "American Journal of Infection Control",
		"http://www.zotero.org/styles/american-journal-of-medicine": "American Journal of Medicine",
		"http://www.zotero.org/styles/american-journal-of-nephrology": "American Journal of Nephrology",
		"http://www.zotero.org/styles/american-journal-of-noninvasive-cardiology": "American Journal of Noninvasive Cardiology",
		"http://www.zotero.org/styles/american-journal-of-obstetrics-and-gynecology": "American Journal of Obstetrics & Gynecology",
		"http://www.zotero.org/styles/american-journal-of-optometry-and-physiological-optics": "American Journal of Optometry and Physiological Optics",
		"http://www.zotero.org/styles/american-journal-of-orthodontics-and-dentofacial-orthopedics": "American Journal of Orthodontics and Dentofacial Orthopedics",
		"http://www.zotero.org/styles/american-journal-of-orthopsychiatry": "American Journal of Orthopsychiatry",
		"http://www.zotero.org/styles/american-journal-of-pathology": "American Journal of Pathology",
		"http://www.zotero.org/styles/american-journal-of-public-health": "American Journal of Public Health",
		"http://www.zotero.org/styles/american-journal-of-reproductive-immunology": "American Journal of Reproductive Immunology",
		"http://www.zotero.org/styles/american-journal-of-roentgenology": "American Journal of Roentgenology (AJR)",
		"http://www.zotero.org/styles/american-journal-of-sports-medicine": "American Journal of Sports Medicine",
		"http://www.zotero.org/styles/american-journal-of-surgery": "American Journal of Surgery",
		"http://www.zotero.org/styles/american-medical-writers-association": "American Medical Writers Association",
		"http://www.zotero.org/styles/american-political-science-review": "American Political Science Review",
		"http://www.zotero.org/styles/american-psychologist": "American Psychologist",
		"http://www.zotero.org/styles/american-review-of-respiratory-disease": "American Review of Respiratory Disease",
		"http://www.zotero.org/styles/american-sociological-review": "American Sociological Review",
		"http://www.zotero.org/styles/american-surgeon": "American Surgeon",
		"http://www.zotero.org/styles/amino-acids": "Amino Acids",
		"http://www.zotero.org/styles/anaesthesia-and-intensive-care": "Anaesthesia and Intensive Care",
		"http://www.zotero.org/styles/anaesthesia": "Anaesthesia",
		"http://www.zotero.org/styles/anales-de-pediatria": "Anales de Pediatr\u00c3\u00ada",
		"http://www.zotero.org/styles/analytical-chemistry": "Analytical Chemistry",
		"http://www.zotero.org/styles/analytische-psychologie": "Analytische Psychologie",
		"http://www.zotero.org/styles/animals": "Animals",
		"http://www.zotero.org/styles/annales-de-dermatologie-et-de-venereologie": "Annales de Dermatologie et de V\u00c3\u00a9n\u00c3\u00a9r\u00c3\u00a9ologie",
		"http://www.zotero.org/styles/annales-nestle-english-ed": "Annales Nestl\u00c3\u00a9 (English ed.)",
		"http://www.zotero.org/styles/annals-academy-of-medicine-singapore": "Annals, Academy of Medicine, Singapore",
		"http://www.zotero.org/styles/annals-of-allergy": "Annals of Allergy",
		"http://www.zotero.org/styles/annals-of-clinical-and-laboratory-science": "Annals of Clinical and Laboratory Science",
		"http://www.zotero.org/styles/annals-of-clinical-biochemistry": "Annals of Clinical Biochemistry",
		"http://www.zotero.org/styles/annals-of-emergency-medicine": "Annals of Emergency Medicine",
		"http://www.zotero.org/styles/annals-of-epidemiology": "Annals of Epidemiology",
		"http://www.zotero.org/styles/annals-of-internal-medicine": "Annals of Internal Medicine",
		"http://www.zotero.org/styles/annals-of-nutrition-and-metabolism": "Annals of Nutrition and Metabolism",
		"http://www.zotero.org/styles/annals-of-otology-rhinology-and-laryngology": "Annals of Otology, Rhinology and Laryngology",
		"http://www.zotero.org/styles/annals-of-saudi-medicine": "Annals of Saudi Medicine",
		"http://www.zotero.org/styles/annals-of-surgery": "Annals of Surgery",
		"http://www.zotero.org/styles/annals-of-the-rheumatic-diseases": "Annals of the Rheumatic Diseases",
		"http://www.zotero.org/styles/annals-of-the-royal-college-of-physicians-and-surgeons-of-canada": "Annals of the Royal College of Physicians and Surgeons of Canada",
		"http://www.zotero.org/styles/annals-of-the-royal-college-of-surgeons-of-england": "Annals of the Royal College of Surgeons of England",
		"http://www.zotero.org/styles/annals-of-thoracic-surgery": "Annals of Thoracic Surgery",
		"http://www.zotero.org/styles/annals-of-tropical-paediatrics": "Annals of Tropical Paediatrics",
		"http://www.zotero.org/styles/annual-review-of-analytical-chemistry": "Annual Review of Analytical Chemistry",
		"http://www.zotero.org/styles/annual-review-of-biomedical-engineering": "Annual Review of Biomedical Engineering",
		"http://www.zotero.org/styles/annual-review-of-biophysics": "Annual Review of Biophysics",
		"http://www.zotero.org/styles/annual-review-of-entomology": "Annual Review of Entomology",
		"http://www.zotero.org/styles/annual-review-of-environment-and-resources": "Annual Review of Environment and Resources",
		"http://www.zotero.org/styles/annual-review-of-genetics": "Annual Review of Genetics",
		"http://www.zotero.org/styles/annual-review-of-genomics-and-human-genetics": "Annual Review of Genomics and Human Genetics",
		"http://www.zotero.org/styles/annual-review-of-immunology": "Annual Review of Immunology",
		"http://www.zotero.org/styles/annual-review-of-materials-research": "Annual Review of Materials Research",
		"http://www.zotero.org/styles/annual-review-of-medicine": "Annual Review of Medicine",
		"http://www.zotero.org/styles/annual-review-of-microbiology": "Annual Review of Microbiology",
		"http://www.zotero.org/styles/annual-review-of-nutrition": "Annual Review of Nutrition",
		"http://www.zotero.org/styles/annual-review-of-pathology-mechanisms-of-disease": "Annual Review of Pathology: Mechanisms of Disease",
		"http://www.zotero.org/styles/annual-review-of-pharmacology-and-toxicology": "Annual Review of Pharmacology and Toxicology",
		"http://www.zotero.org/styles/annual-review-of-physical-chemistry": "Annual Review of Physical Chemistry",
		"http://www.zotero.org/styles/annual-review-of-physiology": "Annual Review of Physiology",
		"http://www.zotero.org/styles/annual-review-of-phytopathology": "Annual Review of Phytopathology",
		"http://www.zotero.org/styles/annual-review-of-plant-biology": "Annual Review of Plant Biology",
		"http://www.zotero.org/styles/annual-review-of-public-health": "Annual Review of Public Health",
		"http://www.zotero.org/styles/anthropod-structure-development": "Arthropod Structure & Development",
		"http://www.zotero.org/styles/antibiotics": "Antibiotics",
		"http://www.zotero.org/styles/antibodies": "Antibodies",
		"http://www.zotero.org/styles/antimicrobial-agents-and-chemotherapy": "Antimicrobial Agents and Chemotherapy",
		"http://www.zotero.org/styles/applied-and-environmental-microbiology": "Applied and Environmental Microbiology",
		"http://www.zotero.org/styles/applied-clay-science": "Applied Clay Science",
		"http://www.zotero.org/styles/applied-mechanics-reviews": "Applied Mechanics Reviews",
		"http://www.zotero.org/styles/applied-neurophysiology": "Applied Neurophysiology",
		"http://www.zotero.org/styles/applied-pathology": "Applied Pathology",
		"http://www.zotero.org/styles/applied-physics-letters": "Applied Physics Letters",
		"http://www.zotero.org/styles/applied-sciences": "Applied Sciences",
		"http://www.zotero.org/styles/aquaculture-environment-interactions": "Aquaculture Environment Interactions",
		"http://www.zotero.org/styles/aquatic-biology": "Aquatic Biology",
		"http://www.zotero.org/styles/aquatic-microbial-ecology": "Aquatic Microbial Ecology",
		"http://www.zotero.org/styles/archives-of-dermatology": "Archives of Dermatology",
		"http://www.zotero.org/styles/archives-of-disease-in-childhood": "Archives of Disease in Childhood",
		"http://www.zotero.org/styles/archives-of-facial-plastic-surgery": "Archives of Facial Plastic Surgery",
		"http://www.zotero.org/styles/archives-of-general-psychiatry": "Archives of General Psychiatry",
		"http://www.zotero.org/styles/archives-of-internal-medicine": "Archives of Internal Medicine",
		"http://www.zotero.org/styles/archives-of-neurology": "Archives of Neurology",
		"http://www.zotero.org/styles/archives-of-ophthalmology": "Archives of Ophthalmology",
		"http://www.zotero.org/styles/archives-of-otolaryngology-head-and-neck-surgery": "Archives of Otolaryngology-Head & Neck Surgery",
		"http://www.zotero.org/styles/archives-of-pathology-and-laboratory-medicine": "Archives of Pathology and Laboratory Medicine",
		"http://www.zotero.org/styles/archives-of-pediatrics-and-adolescent-medicine": "Archives of Pediatrics & Adolescent Medicine",
		"http://www.zotero.org/styles/archives-of-surgery": "Archives of Surgery",
		"http://www.zotero.org/styles/archivos-de-bronconeumologia": "Archivos de Bronconeumologia",
		"http://www.zotero.org/styles/archivos-de-investigacion-medica": "Archivos de Investigacion Medica",
		"http://www.zotero.org/styles/archivos-de-medicina-interna": "Archivos de Medicina Interna",
		"http://www.zotero.org/styles/archivos-de-neurolbiologia": "Archivos de Neurolbiologia",
		"http://www.zotero.org/styles/archivos-del-instituto-de-cardiologia-de-mexico": "Archivos del Instituto de Cardiologia de Mexico",
		"http://www.zotero.org/styles/arizona-medicine": "Arizona Medicine",
		"http://www.zotero.org/styles/arquivos-brasileiros-de-cardiologia": "Arquivos Brasileiros de Cardiologia",
		"http://www.zotero.org/styles/arquivos-brasileiros-de-endocrinologia-e-metabologia": "Arquivos Brasileiros de Endocrinologia E Metabologia",
		"http://www.zotero.org/styles/arteriosclerosis-thrombosis-and-vascular-biology": "Arteriosclerosis, Thrombosis, and Vascular Biology",
		"http://www.zotero.org/styles/asaio-transactions": "American Society for Artificial Internal Organs (ASAIO) Transactions",
		"http://www.zotero.org/styles/asia-pacific-journal-of-pharmacology": "Asia Pacific Journal of Pharmacology",
		"http://www.zotero.org/styles/asian-journal-of-andrology": "Asian Journal of Andrology",
		"http://www.zotero.org/styles/asian-journal-of-ophthalmology": "Asian Journal of Ophthalmology",
		"http://www.zotero.org/styles/asian-journal-of-oral-and-maxillofacial-surgery": "Asian Journal of Oral and Maxillofacial Surgery",
		"http://www.zotero.org/styles/atmosphere": "Atmosphere",
		"http://www.zotero.org/styles/audiology-and-neurotology-extra": "Audiology and Neurotology Extra",
		"http://www.zotero.org/styles/audiology-and-neurotology": "Audiology and Neurotology",
		"http://www.zotero.org/styles/audiology": "Audiology",
		"http://www.zotero.org/styles/australasian-journal-of-dermatology": "Australasian Journal of Dermatology",
		"http://www.zotero.org/styles/australasian-radiology": "Australasian Radiology",
		"http://www.zotero.org/styles/australian-and-new-zealand-journal-of-medicine": "Australian and New Zealand Journal of Medicine",
		"http://www.zotero.org/styles/australian-and-new-zealand-journal-of-ophthalmology": "Australian and New Zealand Journal of Ophthalmology",
		"http://www.zotero.org/styles/australian-and-new-zealand-journal-of-surgery": "Australian and New Zealand Journal of Surgery",
		"http://www.zotero.org/styles/australian-clinical-review": "Australian Clinical Review",
		"http://www.zotero.org/styles/australian-family-physician": "Australian Family Physician",
		"http://www.zotero.org/styles/australian-journal-of-hospital-pharmacy": "Australian Journal of Hospital Pharmacy",
		"http://www.zotero.org/styles/australian-journal-of-medical-herbalism": "Australian Journal of Medical Herbalism",
		"http://www.zotero.org/styles/australian-journal-of-ophthalmology": "Australian Journal of Ophthalmology",
		"http://www.zotero.org/styles/australian-journal-of-optometry": "Australian Journal of Optometry",
		"http://www.zotero.org/styles/australian-journal-of-rural-health": "Australian Journal of Rural Health",
		"http://www.zotero.org/styles/australian-orthoptic-journal": "Australian Orthoptic Journal",
		"http://www.zotero.org/styles/australian-paediatric-journal": "Australian Paediatric Journal",
		"http://www.zotero.org/styles/austrian-studies": "Austrian Studies",
		"http://www.zotero.org/styles/axioms": "Axioms",
		"http://www.zotero.org/styles/bangladesh-paediatrics": "Bangladesh Paediatrics",
		"http://www.zotero.org/styles/bba-bioenergetics": "BBA - Bioenergetics",
		"http://www.zotero.org/styles/bba-biomembranes": "BBA - Biomembranes",
		"http://www.zotero.org/styles/bba-gene-regulatory-mechanisms": "BBA - Gene Regulatory Mechanisms",
		"http://www.zotero.org/styles/bba-general-subjects": "BBA - General Subjects",
		"http://www.zotero.org/styles/bba-molecular-and-cell-biology-of-lipids": "BBA - Molecular and Cell Biology of Lipids",
		"http://www.zotero.org/styles/bba-molecular-basis-of-disease": "BBA - Molecular Basis of Disease",
		"http://www.zotero.org/styles/bba-molecular-cell-research": "BBA - Molecular Cell Research",
		"http://www.zotero.org/styles/bba-proteins-and-proteomics": "BBA - Proteins and Proteomics",
		"http://www.zotero.org/styles/bba-reviews-on-cancer": "BBA - Reviews on Cancer",
		"http://www.zotero.org/styles/behavioral-ecology": "Behavioral Ecology",
		"http://www.zotero.org/styles/behavioral-neuroscience": "Behavioral Neuroscience",
		"http://www.zotero.org/styles/behavioral-sciences": "Behavioral Sciences",
		"http://www.zotero.org/styles/bibliotek-for-laeger": "Bibliotek for Laeger",
		"http://www.zotero.org/styles/bio-medical-reviews": "Bio Medical Reviews",
		"http://www.zotero.org/styles/bioanalysis": "Bioanalysis",
		"http://www.zotero.org/styles/biochemical-and-biophysical-research-communications": "Biochemical and Biophysical Research Communications",
		"http://www.zotero.org/styles/biodrugs": "Biodrugs",
		"http://www.zotero.org/styles/biofuels": "Biofuels",
		"http://www.zotero.org/styles/biogeochemistry": "Biogeochemistry",
		"http://www.zotero.org/styles/biological-conservation": "Biological Conservation",
		"http://www.zotero.org/styles/biology-letters": "Biology Letters",
		"http://www.zotero.org/styles/biology-of-the-neonate": "Biology of the Neonate",
		"http://www.zotero.org/styles/biology": "Biology",
		"http://www.zotero.org/styles/biomacromolecules": "Biomacromolecules",
		"http://www.zotero.org/styles/biomarkers-in-medicine": "Biomarkers in Medicine",
		"http://www.zotero.org/styles/biomass-and-bioenergy": "Biomass & Bioenergy",
		"http://www.zotero.org/styles/biomedical-bulletin": "Biomedical Bulletin",
		"http://www.zotero.org/styles/biomedical-imaging-and-intervention-journal": "Biomedical Imaging and Intervention Journal",
		"http://www.zotero.org/styles/biomedical-research": "Biomedical Research",
		"http://www.zotero.org/styles/biomicrofluidics": "Biomicrofluidics",
		"http://www.zotero.org/styles/biomolecules": "Biomolecules",
		"http://www.zotero.org/styles/bioresource-technology": "Bioresource Technology",
		"http://www.zotero.org/styles/biosensors-and-bioelectronics": "Biosensors and Bioelectronics Materialia",
		"http://www.zotero.org/styles/biosensors": "Biosensors",
		"http://www.zotero.org/styles/biotechnology-progress": "Biotechnology Progress",
		"http://www.zotero.org/styles/blood-purification": "Blood Purification",
		"http://www.zotero.org/styles/blood-vessels": "Blood Vessels",
		"http://www.zotero.org/styles/bmj-case-reports": "BMJ Case Reports",
		"http://www.zotero.org/styles/bmj-open": "BMJ Open",
		"http://www.zotero.org/styles/bmj-supportive-palliative-care": "BMJ Supportive & Palliative Care",
		"http://www.zotero.org/styles/boletin-de-la-asociacion-medica-de-puerto-rico": "Boletin de La Asociacion Medica de Puerto Rico",
		"http://www.zotero.org/styles/boletin-medico-del-hospital-infantil-de-mexico": "Boletin Medico del Hospital Infantil de Mexico",
		"http://www.zotero.org/styles/bordeaux-medical": "Bordeaux Medical",
		"http://www.zotero.org/styles/brain-and-development-english-language": "Brain & Development, English Language",
		"http://www.zotero.org/styles/brain-behavior-and-evolution": "Brain, Behavior and Evolution",
		"http://www.zotero.org/styles/brain-dysfunction": "Brain Dysfunction",
		"http://www.zotero.org/styles/brain-sciences": "Brain Sciences",
		"http://www.zotero.org/styles/breast-care": "Breast Care",
		"http://www.zotero.org/styles/british-dental-journal": "British Dental Journal",
		"http://www.zotero.org/styles/british-heart-journal": "British Heart Journal",
		"http://www.zotero.org/styles/british-homoeopathic-journal": "British Homoeopathic Journal",
		"http://www.zotero.org/styles/british-journal-of-anaesthesia": "British Journal of Anaesthesia",
		"http://www.zotero.org/styles/british-journal-of-biomedical-science": "British Journal of Biomedical Science",
		"http://www.zotero.org/styles/british-journal-of-cancer": "British Journal of Cancer",
		"http://www.zotero.org/styles/british-journal-of-clinical-psychology": "British Journal of Clinical Psychology",
		"http://www.zotero.org/styles/british-journal-of-clinical-research": "British Journal of Clinical Research",
		"http://www.zotero.org/styles/british-journal-of-developmental-psychology": "British Journal of Developmental Psychology",
		"http://www.zotero.org/styles/british-journal-of-educational-psychology": "British Journal of Educational Psychology",
		"http://www.zotero.org/styles/british-journal-of-health-psychology": "British Journal of Health Psychology",
		"http://www.zotero.org/styles/british-journal-of-industrial-medicine": "British Journal of Industrial Medicine",
		"http://www.zotero.org/styles/british-journal-of-mathematical-and-statistical-psychology": "British Journal of Mathematical and Statistical Psychology",
		"http://www.zotero.org/styles/british-journal-of-medical-economics": "British Journal of Medical Economics",
		"http://www.zotero.org/styles/british-journal-of-obstetrics-and-gynaecology": "British Journal of Obstetrics and Gynaecology",
		"http://www.zotero.org/styles/british-journal-of-occupational-therapy": "British Journal of Occupational Therapy",
		"http://www.zotero.org/styles/british-journal-of-ophthalmology": "British Journal of Ophthalmology",
		"http://www.zotero.org/styles/british-journal-of-pain": "British Journal of Pain",
		"http://www.zotero.org/styles/british-journal-of-pharmacology": "British Journal of Pharmacology",
		"http://www.zotero.org/styles/british-journal-of-plastic-surgery": "British Journal of Plastic Surgery",
		"http://www.zotero.org/styles/british-journal-of-psychology": "British Journal of Psychology",
		"http://www.zotero.org/styles/british-journal-of-social-psychology": "British Journal of Social Psychology",
		"http://www.zotero.org/styles/british-journal-of-sports-medicine": "British Journal of Sports Medicine",
		"http://www.zotero.org/styles/british-journal-of-surgery": "British Journal of Surgery",
		"http://www.zotero.org/styles/british-medical-bulletin": "British Medical Bulletin",
		"http://www.zotero.org/styles/british-medical-journal": "British Medical Journal",
		"http://www.zotero.org/styles/british-osteopathic-journal": "British Osteopathic Journal",
		"http://www.zotero.org/styles/british-volume-of-the-journal-of-bone-and-joint-surgery": "British Volume of the Journal of Bone and Joint Surgery",
		"http://www.zotero.org/styles/buildings": "Buildings",
		"http://www.zotero.org/styles/bulletin-of-the-american-meteorological-society": "Bulletin of the American Meteorological Society (BAMS)",
		"http://www.zotero.org/styles/bulletin-of-the-medical-library-association": "Bulletin of the Medical Library Association",
		"http://www.zotero.org/styles/bulletin-who": "Bulletin WHO",
		"http://www.zotero.org/styles/canada-journal-of-public-health": "Canada Journal of Public Health",
		"http://www.zotero.org/styles/canadian-family-physician": "Canadian Family Physician",
		"http://www.zotero.org/styles/canadian-journal-of-anaesthesia": "Canadian Journal of Anaesthesia",
		"http://www.zotero.org/styles/canadian-journal-of-behavioral-science": "Canadian Journal of Behavioral Science",
		"http://www.zotero.org/styles/canadian-journal-of-comparative-medicine": "Canadian Journal of Comparative Medicine",
		"http://www.zotero.org/styles/canadian-journal-of-experimental-psychology": "Canadian Journal of Experimental Psychology",
		"http://www.zotero.org/styles/canadian-journal-of-hospital-pharmacy": "Canadian Journal of Hospital Pharmacy",
		"http://www.zotero.org/styles/canadian-journal-of-occupational-therapy": "Canadian Journal of Occupational Therapy",
		"http://www.zotero.org/styles/canadian-journal-of-ophthalmology": "Canadian Journal of Ophthalmology",
		"http://www.zotero.org/styles/canadian-journal-of-surgery": "Canadian Journal of Surgery",
		"http://www.zotero.org/styles/canadian-medical-association-journal": "Canadian Medical Association Journal",
		"http://www.zotero.org/styles/canadian-pharmacists-journal": "Canadian Pharmacists Journal",
		"http://www.zotero.org/styles/canadian-psychology": "Canadian Psychology",
		"http://www.zotero.org/styles/canadian-society-of-clinical-chemists": "Canadian Society of Clinical Chemists",
		"http://www.zotero.org/styles/canadian-veterinary-journal": "Canadian Veterinary Journal",
		"http://www.zotero.org/styles/cancer-cell": "Cancer Cell",
		"http://www.zotero.org/styles/cancer-detection-and-prevention": "Cancer Detection & Prevention",
		"http://www.zotero.org/styles/cancer-epidemiology-biomarkers-prevention": "Cancer Epidemiology, Biomarkers and Prevention",
		"http://www.zotero.org/styles/cancer-gene-therapy": "Cancer Gene Therapy",
		"http://www.zotero.org/styles/cancer-prevention-research": "Cancer Prevention Research",
		"http://www.zotero.org/styles/cancer-research": "Cancer Research",
		"http://www.zotero.org/styles/cancers": "Cancers",
		"http://www.zotero.org/styles/carbon-management": "Carbon Management",
		"http://www.zotero.org/styles/cardiology-cardiovascular-medicine": "Cardiology & Cardiovascular Medicine",
		"http://www.zotero.org/styles/cardiology": "Cardiology",
		"http://www.zotero.org/styles/cardiorenal-medicine": "Cardiorenal Medicine",
		"http://www.zotero.org/styles/cardiovascular-pharmacology-and-therapeutics": "Cardiovascular Pharmacology & Therapeutics",
		"http://www.zotero.org/styles/cardiovascular-research": "Cardiovascular Research",
		"http://www.zotero.org/styles/caries-research": "Caries Research",
		"http://www.zotero.org/styles/case-reports-in-dermatology": "Case Reports in Dermatology",
		"http://www.zotero.org/styles/case-reports-in-gastroenterology": "Case Reports in Gastroenterology",
		"http://www.zotero.org/styles/case-reports-in-nephrology-and-urology": "Case Reports in Nephrology and Urology",
		"http://www.zotero.org/styles/case-reports-in-neurology": "Case Reports in Neurology",
		"http://www.zotero.org/styles/case-reports-in-oncology": "Case Reports in Oncology",
		"http://www.zotero.org/styles/case-reports-in-ophthalmology": "Case Reports in Ophthalmology",
		"http://www.zotero.org/styles/catalysts": "Catalysts",
		"http://www.zotero.org/styles/catholic-biblical-quarterly": "Catholic Biblical Quarterly",
		"http://www.zotero.org/styles/cell-death-and-differentiation": "Cell Death and Differentiation",
		"http://www.zotero.org/styles/cell-host-and-microbe": "Cell Host & Microbe",
		"http://www.zotero.org/styles/cell-metabolism": "Cell Metabolism",
		"http://www.zotero.org/styles/cell-research": "Cell Research",
		"http://www.zotero.org/styles/cell-stem-cell": "Cell Stem Cell",
		"http://www.zotero.org/styles/cells-tissues-organs": "Cells Tissues Organs",
		"http://www.zotero.org/styles/cells": "Cells",
		"http://www.zotero.org/styles/cellular-physiology-and-biochemistry": "Cellular Physiology and Biochemistry",
		"http://www.zotero.org/styles/central-african-journal-of-medicine": "Central African Journal of Medicine",
		"http://www.zotero.org/styles/central-asian-survey": "Central Asian Survey",
		"http://www.zotero.org/styles/cephalalgia": "Cephalalgia",
		"http://www.zotero.org/styles/cerebrovascular-diseases-extra": "Cerebrovascular Diseases Extra",
		"http://www.zotero.org/styles/cerebrovascular-diseases": "Cerebrovascular Diseases",
		"http://www.zotero.org/styles/cervix-and-the-lower-female-genital-tract": "Cervix and the Lower Female Genital Tract",
		"http://www.zotero.org/styles/ceylon-journal-of-medical-science": "Ceylon Journal of Medical Science",
		"http://www.zotero.org/styles/ceylon-medical-journal": "Ceylon Medical Journal",
		"http://www.zotero.org/styles/challenges": "Challenges",
		"http://www.zotero.org/styles/chaos": "Chaos",
		"http://www.zotero.org/styles/chemical-reviews": "Chemical Reviews",
		"http://www.zotero.org/styles/chemistry-and-biology": "Chemistry & Biology",
		"http://www.zotero.org/styles/chemistry-of-materials": "Chemistry of Materials",
		"http://www.zotero.org/styles/chemotherapy": "Chemotherapy",
		"http://www.zotero.org/styles/chicago-note-no-ibid": "Chicago Manual of Style (note without bibliography, no Ibid.) (legacy)",
		"http://www.zotero.org/styles/chicago-note": "Chicago Manual of Style (note without bibliography) (legacy)",
		"http://www.zotero.org/styles/chinese-journal-of-anesthesiology": "Chinese Journal of Anesthesiology",
		"http://www.zotero.org/styles/chinese-journal-of-cardiovascular-disease": "Chinese Journal of Cardiovascular Disease",
		"http://www.zotero.org/styles/chinese-journal-of-clinical-oncology": "Chinese Journal of Clinical Oncology",
		"http://www.zotero.org/styles/chinese-journal-of-dermatology": "Chinese Journal of Dermatology",
		"http://www.zotero.org/styles/chinese-journal-of-digestion": "Chinese Journal of Digestion",
		"http://www.zotero.org/styles/chinese-journal-of-endocrinology-and-metabolism": "Chinese Journal of Endocrinology and Metabolism",
		"http://www.zotero.org/styles/chinese-journal-of-epidemiology": "Chinese Journal of Epidemiology",
		"http://www.zotero.org/styles/chinese-journal-of-experimental-surgery": "Chinese Journal of Experimental Surgery",
		"http://www.zotero.org/styles/chinese-journal-of-geriatology": "Chinese Journal of Geriatology",
		"http://www.zotero.org/styles/chinese-journal-of-hematology": "Chinese Journal of Hematology",
		"http://www.zotero.org/styles/chinese-journal-of-hospital-administration": "Chinese Journal of Hospital Administration",
		"http://www.zotero.org/styles/chinese-journal-of-industrial-hygiene-and-occupational-disease": "Chinese Journal of Industrial Hygiene and Occupational Disease",
		"http://www.zotero.org/styles/chinese-journal-of-infectious-diseases": "Chinese Journal of Infectious Diseases",
		"http://www.zotero.org/styles/chinese-journal-of-internal-medicine": "Chinese Journal of Internal Medicine",
		"http://www.zotero.org/styles/chinese-journal-of-lung-cancer": "Chinese Journal of Lung Cancer",
		"http://www.zotero.org/styles/chinese-journal-of-medical-history": "Chinese Journal of Medical History",
		"http://www.zotero.org/styles/chinese-journal-of-medical-laboratory-technology": "Chinese Journal of Medical Laboratory Technology",
		"http://www.zotero.org/styles/chinese-journal-of-microbiology-and-immunology": "Chinese Journal of Microbiology and Immunology",
		"http://www.zotero.org/styles/chinese-journal-of-nephrology": "Chinese Journal of Nephrology",
		"http://www.zotero.org/styles/chinese-journal-of-neurology-and-psychiatry": "Chinese Journal of Neurology and Psychiatry",
		"http://www.zotero.org/styles/chinese-journal-of-neurosurgery": "Chinese Journal of Neurosurgery",
		"http://www.zotero.org/styles/chinese-journal-of-nuclear-medicine": "Chinese Journal of Nuclear Medicine",
		"http://www.zotero.org/styles/chinese-journal-of-obstetrics-and-gynecology": "Chinese Journal of Obstetrics and Gynecology",
		"http://www.zotero.org/styles/chinese-journal-of-oncology": "Chinese Journal of Oncology",
		"http://www.zotero.org/styles/chinese-journal-of-ophthalmology": "Chinese Journal of Ophthalmology",
		"http://www.zotero.org/styles/chinese-journal-of-organ-transplantation": "Chinese Journal of Organ Transplantation",
		"http://www.zotero.org/styles/chinese-journal-of-orthopedics": "Chinese Journal of Orthopedics",
		"http://www.zotero.org/styles/chinese-journal-of-otorhinolaryngology": "Chinese Journal of Otorhinolaryngology",
		"http://www.zotero.org/styles/chinese-journal-of-pain": "Chinese Journal of Pain",
		"http://www.zotero.org/styles/chinese-journal-of-pathology": "Chinese Journal of Pathology",
		"http://www.zotero.org/styles/chinese-journal-of-pediatric-surgery": "Chinese Journal of Pediatric Surgery",
		"http://www.zotero.org/styles/chinese-journal-of-pediatrics": "Chinese Journal of Pediatrics",
		"http://www.zotero.org/styles/chinese-journal-of-physical-medicine": "Chinese Journal of Physical Medicine",
		"http://www.zotero.org/styles/chinese-journal-of-physical-therapy": "Chinese Journal of Physical Therapy",
		"http://www.zotero.org/styles/chinese-journal-of-plastic-surgery-and-burns": "Chinese Journal of Plastic Surgery and Burns",
		"http://www.zotero.org/styles/chinese-journal-of-preventive-medicine": "Chinese Journal of Preventive Medicine",
		"http://www.zotero.org/styles/chinese-journal-of-radiological-medicine-and-protection": "Chinese Journal of Radiological Medicine and Protection",
		"http://www.zotero.org/styles/chinese-journal-of-radiology": "Chinese Journal of Radiology",
		"http://www.zotero.org/styles/chinese-journal-of-stomatology": "Chinese Journal of Stomatology",
		"http://www.zotero.org/styles/chinese-journal-of-surgery": "Chinese Journal of Surgery",
		"http://www.zotero.org/styles/chinese-journal-of-tuberculosis-and-respiratory-diseases": "Chinese Journal of Tuberculosis and Respiratory Diseases",
		"http://www.zotero.org/styles/chinese-journal-of-urology": "Chinese Journal of Urology",
		"http://www.zotero.org/styles/chinese-language-edition-of-jama": "Chinese Language Edition of JAMA",
		"http://www.zotero.org/styles/chinese-medical-journal": "Chinese Medical Journal",
		"http://www.zotero.org/styles/chiropractic-journal-of-australia": "Chiropractic Journal of Australia",
		"http://www.zotero.org/styles/chronic-diseases-in-canada": "Chronic Diseases in Canada",
		"http://www.zotero.org/styles/cirugia-y-cirujanos": "Cirugia y Cirujanos",
		"http://www.zotero.org/styles/cirujano-general": "Cirujano General",
		"http://www.zotero.org/styles/climacteric": "Climacteric - the Journal of the International Menopause Society",
		"http://www.zotero.org/styles/climate-research": "Climate Research",
		"http://www.zotero.org/styles/clinica-chimica-acta": "Clinica Chimica Acta",
		"http://www.zotero.org/styles/clinical-and-experimental-optometry": "Clinical and Experimental Optometry",
		"http://www.zotero.org/styles/clinical-and-experimental-pharmacology-and-physiology": "Clinical and Experimental Pharmacology and Physiology",
		"http://www.zotero.org/styles/clinical-and-investigative-medicine": "Clinical and Investigative Medicine",
		"http://www.zotero.org/styles/clinical-and-vaccine-immunology": "Clinical and Vaccine Immunology",
		"http://www.zotero.org/styles/clinical-biochemistry": "Clinical Biochemistry",
		"http://www.zotero.org/styles/clinical-biomechanics": "Clinical Biomechanics",
		"http://www.zotero.org/styles/clinical-chemistry": "Clinical Chemistry",
		"http://www.zotero.org/styles/clinical-diabetes": "Clinical Diabetes",
		"http://www.zotero.org/styles/clinical-drug-investigation": "Clinical Drug Investigation",
		"http://www.zotero.org/styles/clinical-investigation": "Clinical Investigation",
		"http://www.zotero.org/styles/clinical-lipidology": "Clinical Lipidology",
		"http://www.zotero.org/styles/clinical-microbiology-reviews": "Clinical Microbiology Reviews",
		"http://www.zotero.org/styles/clinical-nutrition": "Clinical Nutrition",
		"http://www.zotero.org/styles/clinical-pediatrics": "Clinical Pediatrics",
		"http://www.zotero.org/styles/clinical-pharmacokinetics": "Clinical Pharmacokinetics",
		"http://www.zotero.org/styles/clinical-pharmacology-and-therapeutics": "Clinical Pharmacology & Therapeutics",
		"http://www.zotero.org/styles/clinical-pharmacy": "Clinical Pharmacy",
		"http://www.zotero.org/styles/clinical-physiology-and-biochemistry": "Clinical Physiology and Biochemistry",
		"http://www.zotero.org/styles/clinical-practice": "Clinical Practice",
		"http://www.zotero.org/styles/clinical-preventive-dentistry": "Clinical Preventive Dentistry",
		"http://www.zotero.org/styles/clinical-science": "Clinical Science",
		"http://www.zotero.org/styles/clinicians-research-digest": "Clinician\u00e2\u20ac\u2122s Research Digest",
		"http://www.zotero.org/styles/cns-drugs": "Cns Drugs",
		"http://www.zotero.org/styles/coatings": "Coatings",
		"http://www.zotero.org/styles/college-of-physicians-and-surgeons-pakistan": "College of Physicians & Surgeons Pakistan",
		"http://www.zotero.org/styles/colo-proctology": "Colo-Proctology",
		"http://www.zotero.org/styles/colombia-medica": "Colombia Medica",
		"http://www.zotero.org/styles/community-dentistry-and-oral-epidemiology": "Community Dentistry and Oral Epidemiology",
		"http://www.zotero.org/styles/community-medicine": "Community Medicine",
		"http://www.zotero.org/styles/complement": "Complement",
		"http://www.zotero.org/styles/comprehensive-psychiatry": "Comprehensive Psychiatry",
		"http://www.zotero.org/styles/computational-materials-science": "Computational Materials Science",
		"http://www.zotero.org/styles/computers": "Computers",
		"http://www.zotero.org/styles/consulting-psychology-journal-practice-and-research": "Consulting Psychology Journal: Practice and Research",
		"http://www.zotero.org/styles/contemporary-sociology-a-journal-of-reviews": "Contemporary Sociology: A Journal of Reviews",
		"http://www.zotero.org/styles/contexts": "Contexts",
		"http://www.zotero.org/styles/cor-et-vasa": "Cor Et Vasa",
		"http://www.zotero.org/styles/cornell-veternarian": "Cornell Veternarian",
		"http://www.zotero.org/styles/coronary-artery-disease": "Coronary Artery Disease",
		"http://www.zotero.org/styles/corrosion-science": "Corrosion Science",
		"http://www.zotero.org/styles/crop-science": "Crop Science",
		"http://www.zotero.org/styles/crystal-growth-and-design": "Crystal Growth & Design",
		"http://www.zotero.org/styles/crystals": "Crystals",
		"http://www.zotero.org/styles/cuadernos-del-hospital-de-clinicas": "Cuadernos del Hospital de Clinicas",
		"http://www.zotero.org/styles/cultural-diversity-and-ethnic-minority-psychology": "Cultural Diversity & Ethnic Minority Psychology",
		"http://www.zotero.org/styles/current-biology": "Current Biology",
		"http://www.zotero.org/styles/current-opinion-biotechnology": "Current Opinion in Biotechnology",
		"http://www.zotero.org/styles/current-opinion-cell-biology": "Current Opinion in Cell Biology",
		"http://www.zotero.org/styles/current-opinion-chemical-biology": "Current Opinion in Chemical Biology",
		"http://www.zotero.org/styles/current-opinion-environmental-sustainability": "Current Opinion in Environmental Sustainability",
		"http://www.zotero.org/styles/current-opinion-genetics-development": "Current Opinion in Genetics & Development",
		"http://www.zotero.org/styles/current-opinion-immunology": "Current Opinion in Immunology",
		"http://www.zotero.org/styles/current-opinion-microbiology": "Current Opinion in Microbiology",
		"http://www.zotero.org/styles/current-opinion-neurobiology": "Current Opinion in Neurobiology",
		"http://www.zotero.org/styles/current-opinion-pharmacology": "Current Opinion in Pharmacology",
		"http://www.zotero.org/styles/current-opinion-plant-biology": "Current Opinion in Plant Biology",
		"http://www.zotero.org/styles/current-opinion-structural-biology": "Current Opinion in Structural Biology",
		"http://www.zotero.org/styles/current-urology": "Current Urology",
		"http://www.zotero.org/styles/cytogenetic-and-genome-research": "Cytogenetic and Genome Research",
		"http://www.zotero.org/styles/danish-dental-journal": "Danish Dental Journal",
		"http://www.zotero.org/styles/danish-medical-bulletin": "Danish Medical Bulletin",
		"http://www.zotero.org/styles/das-arztliche-laboratorium": "Das Arztliche Laboratorium",
		"http://www.zotero.org/styles/daseinsanalyse": "Daseinsanalyse",
		"http://www.zotero.org/styles/dementia-and-geriatric-cognitive-disorders-extra": "Dementia and Geriatric Cognitive Disorders Extra",
		"http://www.zotero.org/styles/dementia-and-geriatric-cognitive-disorders": "Dementia and Geriatric Cognitive Disorders",
		"http://www.zotero.org/styles/dental-abstracts": "Dental Abstracts",
		"http://www.zotero.org/styles/dental-teamwork": "Dental Teamwork",
		"http://www.zotero.org/styles/dentomaxillopfacial-radiology": "Dentomaxillopfacial Radiology",
		"http://www.zotero.org/styles/der-chirurg": "Der Chirurg",
		"http://www.zotero.org/styles/dermatologica": "Dermatologica",
		"http://www.zotero.org/styles/dermatology": "Dermatology",
		"http://www.zotero.org/styles/deutsches-arzteblatt": "Deutsches \u00c3\u201erzteblatt",
		"http://www.zotero.org/styles/development": "Development",
		"http://www.zotero.org/styles/developmental-biology": "Developmental Biology",
		"http://www.zotero.org/styles/developmental-cell": "Developmental Cell",
		"http://www.zotero.org/styles/developmental-neuroscience": "Developmental Neuroscience",
		"http://www.zotero.org/styles/developmental-pharmacology-and-therapeutics": "Developmental Pharmacology and Therapeutics",
		"http://www.zotero.org/styles/developmental-psychology": "Developmental Psychology",
		"http://www.zotero.org/styles/diabetes-care": "Diabetes Care",
		"http://www.zotero.org/styles/diabetes-management": "Diabetes Management",
		"http://www.zotero.org/styles/diabetes-vascular-disease-research": "Diabetes & Vascular Disease Research",
		"http://www.zotero.org/styles/diabetes": "Diabetes",
		"http://www.zotero.org/styles/diabetologia": "Diabetologia",
		"http://www.zotero.org/styles/diagnostic-cytopathology": "Diagnostic Cytopathology",
		"http://www.zotero.org/styles/diagnostics": "Diagnostics",
		"http://www.zotero.org/styles/digestion": "Digestion",
		"http://www.zotero.org/styles/digestive-diseases": "Digestive Diseases",
		"http://www.zotero.org/styles/digestive-surgery": "Digestive Surgery",
		"http://www.zotero.org/styles/disaster-management-and-response": "Disaster Management & Response (DMR)",
		"http://www.zotero.org/styles/disease-management-and-health-outcomes": "Disease Management & Health Outcomes",
		"http://www.zotero.org/styles/disease-models-mechanisms": "Disease Models and Mechanisms",
		"http://www.zotero.org/styles/diseases-aquatic-organisms": "Diseases of Aquatic Organisms",
		"http://www.zotero.org/styles/diseases-of-the-colon-and-rectum": "Diseases of the Colon and Rectum",
		"http://www.zotero.org/styles/diversity": "Diversity",
		"http://www.zotero.org/styles/dreaming": "Dreaming",
		"http://www.zotero.org/styles/drug-intelligence-and-clinical-pharmacy": "Drug Intelligence & Clinical Pharmacy",
		"http://www.zotero.org/styles/drug-safety": "Drug Safety",
		"http://www.zotero.org/styles/drugs-and-aging": "Drugs & Aging",
		"http://www.zotero.org/styles/drugs-in-r-and-d": "Drugs in R&D",
		"http://www.zotero.org/styles/drugs": "Drugs",
		"http://www.zotero.org/styles/earth-and-planetary-science-letters": "Earth and Planetary Science Letters",
		"http://www.zotero.org/styles/earth-interactions": "Earth Interactions",
		"http://www.zotero.org/styles/edizioni-minerva-medica": "Edizioni Minerva Medica",
		"http://www.zotero.org/styles/educacion-medica-superior": "Educacion Medica Superior",
		"http://www.zotero.org/styles/education": "Education",
		"http://www.zotero.org/styles/educational-evaluation-and-policy-analysis": "Educational Evaluation and Policy Analysis",
		"http://www.zotero.org/styles/educational-researcher": "Educational Researcher",
		"http://www.zotero.org/styles/eighteenth-century-life": "Eighteenth-Century Life",
		"http://www.zotero.org/styles/electronics": "Electronics",
		"http://www.zotero.org/styles/embo-reports": "EMBO reports",
		"http://www.zotero.org/styles/emergency-medicine-journal": "Emergency Medicine Journal",
		"http://www.zotero.org/styles/emotion": "Emotion",
		"http://www.zotero.org/styles/endangered-species-research": "Endangered Species Research",
		"http://www.zotero.org/styles/endocrine-related-cancer": "Endocrine-Related Cancer",
		"http://www.zotero.org/styles/energies": "Energies",
		"http://www.zotero.org/styles/energy-and-fuels": "Energy & Fuels",
		"http://www.zotero.org/styles/enfermedades-infecciosas-y-microbiologia-clinica": "Enfermedades Infecciosas y Microbiologia Clinica",
		"http://www.zotero.org/styles/entropy": "Entropy",
		"http://www.zotero.org/styles/environmental-medicine": "Environmental Medicine",
		"http://www.zotero.org/styles/environmental-science-and-policy": "Environmental Science and Policy",
		"http://www.zotero.org/styles/environmental-science-and-technology": "Environmental Science & Technology",
		"http://www.zotero.org/styles/enzyme": "Enzyme",
		"http://www.zotero.org/styles/epigenomics": "Epigenomics",
		"http://www.zotero.org/styles/ethics-science-environmental-politics": "Ethics in Science and Environmental Politics",
		"http://www.zotero.org/styles/eukaryotic-cell": "Eukaryotic Cell",
		"http://www.zotero.org/styles/european-addiction-research": "European Addiction Research",
		"http://www.zotero.org/styles/european-journal-of-cancer-and-clinical-oncology": "European Journal of Cancer & Clinical Oncology",
		"http://www.zotero.org/styles/european-journal-of-clinical-investigation": "European Journal of Clinical Investigation",
		"http://www.zotero.org/styles/european-journal-of-clinical-nutrition": "European Journal of Clinical Nutrition",
		"http://www.zotero.org/styles/european-journal-of-clinical-research": "European Journal of Clinical Research",
		"http://www.zotero.org/styles/european-journal-of-gastroenterology-and-hepatology": "European Journal of Gastroenterology & Hepatology",
		"http://www.zotero.org/styles/european-journal-of-gerontology": "European Journal of Gerontology",
		"http://www.zotero.org/styles/european-journal-of-human-genetics": "European Journal of Human Genetics",
		"http://www.zotero.org/styles/european-journal-of-physical-medicine-and-rehabilitation": "European Journal of Physical Medicine and Rehabilitation",
		"http://www.zotero.org/styles/european-journal-of-rheumatology-and-inflammation": "European Journal of Rheumatology and Inflammation",
		"http://www.zotero.org/styles/european-neurology": "European Neurology",
		"http://www.zotero.org/styles/european-respiratory-journal": "European Respiratory Journal",
		"http://www.zotero.org/styles/european-surgical-research": "European Surgical Research",
		"http://www.zotero.org/styles/european-thyroid-journal": "European Thyroid Journal",
		"http://www.zotero.org/styles/european-urology": "European Urology",
		"http://www.zotero.org/styles/evidence-based-dentistry": "Evidence-Based Dentistry",
		"http://www.zotero.org/styles/evidence-based-medicine": "Evidence-Based Medicine",
		"http://www.zotero.org/styles/evidence-based-mental-health": "Evidence-Based Mental Health",
		"http://www.zotero.org/styles/evidence-based-nursing": "Evidence-Based Nursing",
		"http://www.zotero.org/styles/excel": "Excel",
		"http://www.zotero.org/styles/experimental-and-clinical-immunogenetics": "Experimental and Clinical Immunogenetics",
		"http://www.zotero.org/styles/experimental-and-clinical-psychopharmacology": "Experimental and Clinical Psychopharmacology",
		"http://www.zotero.org/styles/experimental-cell-biology": "Experimental Cell Biology",
		"http://www.zotero.org/styles/experimental-physiology": "Experimental Physiology",
		"http://www.zotero.org/styles/expert-review-of-anti-infective-therapy": "Expert Review of Anti-infective Therapy",
		"http://www.zotero.org/styles/expert-review-of-anticancer-therapy": "Expert Review of Anticancer Therapy",
		"http://www.zotero.org/styles/expert-review-of-cardiovascular-therapy": "Expert Review of Cardiovascular Therapy",
		"http://www.zotero.org/styles/expert-review-of-clinical-immunology": "Expert Review of Clinical Immunology",
		"http://www.zotero.org/styles/expert-review-of-clinical-pharmacology": "Expert Review of Clinical Pharmacology",
		"http://www.zotero.org/styles/expert-review-of-dermatology": "Expert Review of Dermatology",
		"http://www.zotero.org/styles/expert-review-of-endocrinology-and-metabolism": "Expert Review of Endocrinology and Metabolism",
		"http://www.zotero.org/styles/expert-review-of-gastroenterology-and-hepatology": "Expert Review of Gastroenterology and Hepatology",
		"http://www.zotero.org/styles/expert-review-of-hematology": "Expert Review of Hematology",
		"http://www.zotero.org/styles/expert-review-of-medical-devices": "Expert Review of Medical Devices",
		"http://www.zotero.org/styles/expert-review-of-molecular-diagnostics": "Expert Review of Molecular Diagnostics",
		"http://www.zotero.org/styles/expert-review-of-neurotherapeutics": "Expert Review of Neurotherapeutics",
		"http://www.zotero.org/styles/expert-review-of-obstetrics-and-gynecology": "Expert Review of Obstetrics & Gynecology",
		"http://www.zotero.org/styles/expert-review-of-ophthalmology": "Expert Review of Ophthalmology",
		"http://www.zotero.org/styles/expert-review-of-pharmacoeconomics-and-outcomes-research": "Expert Review of Pharmacoeconomics & Outcomes Research",
		"http://www.zotero.org/styles/expert-review-of-proteomics": "Expert Review of Proteomics",
		"http://www.zotero.org/styles/expert-review-of-respiratory-medicine": "Expert Review of Respiratory Medicine",
		"http://www.zotero.org/styles/expert-review-of-vaccines": "Expert Review of Vaccines",
		"http://www.zotero.org/styles/families-systems-and-health": "Families, Systems, & Health",
		"http://www.zotero.org/styles/family-medicine": "Family Medicine",
		"http://www.zotero.org/styles/family-practice-research-journal": "Family Practice Research Journal",
		"http://www.zotero.org/styles/farmacia-hospitalaria": "Farmacia Hospitalaria",
		"http://www.zotero.org/styles/fems-immunology-and-medical-microbiology": "FEMS Immunology & Medical Microbiology",
		"http://www.zotero.org/styles/fems-microbiology-ecology": "FEMS Microbiology Ecology",
		"http://www.zotero.org/styles/fems-microbiology-letters": "FEMS Microbiology Letters",
		"http://www.zotero.org/styles/fems-microbiology-reviews": "FEMS Microbiology Reviews",
		"http://www.zotero.org/styles/fems-yeast-research": "FEMS Yeast Research",
		"http://www.zotero.org/styles/fetal-diagnosis-and-therapy": "Fetal Diagnosis and Therapy",
		"http://www.zotero.org/styles/fetal-therapy": "Fetal Therapy",
		"http://www.zotero.org/styles/finnish-medical-journal": "Finnish Medical Journal",
		"http://www.zotero.org/styles/fitness-and-performance-journal": "Fitness & Performance Journal",
		"http://www.zotero.org/styles/focus-on-critical-care": "Focus on Critical Care",
		"http://www.zotero.org/styles/folia-phoniatrica-et-logopaedica": "Folia Phoniatrica et Logopaedica",
		"http://www.zotero.org/styles/folia-phoniatrica": "Folia Phoniatrica",
		"http://www.zotero.org/styles/folia-primatologica": "Folia Primatologica",
		"http://www.zotero.org/styles/folio-primatologica": "Folio Primatologica",
		"http://www.zotero.org/styles/food-science-and-technology-research": "Food Science and Technology Research",
		"http://www.zotero.org/styles/foreign-policy-analysis": "Foreign Policy Analysis",
		"http://www.zotero.org/styles/forest-ecology-and-management": "Forest Ecology and Management",
		"http://www.zotero.org/styles/forests": "Forests",
		"http://www.zotero.org/styles/french-historical-studies": "French Historical Studies",
		"http://www.zotero.org/styles/frontiers-in-endocrinology": "Frontiers in Endocrinology",
		"http://www.zotero.org/styles/frontiers-in-genetics": "Frontiers in Genetics",
		"http://www.zotero.org/styles/frontiers-in-immunology": "Frontiers in Immunology",
		"http://www.zotero.org/styles/frontiers-in-microbiology": "Frontiers in Microbiology",
		"http://www.zotero.org/styles/frontiers-in-neurology": "Frontiers in Neurology",
		"http://www.zotero.org/styles/frontiers-in-neuroscience": "Frontiers in Neuroscience",
		"http://www.zotero.org/styles/frontiers-in-oncology": "Frontiers in Oncology",
		"http://www.zotero.org/styles/frontiers-in-pharmacology": "Frontiers in Pharmacology",
		"http://www.zotero.org/styles/frontiers-in-physiology": "Frontiers in Physiology",
		"http://www.zotero.org/styles/frontiers-in-plant-science": "Frontiers in Plant Science",
		"http://www.zotero.org/styles/frontiers-in-psychiatry": "Frontiers in Psychiatry",
		"http://www.zotero.org/styles/frontiers-in-psychology": "Frontiers in Psychology",
		"http://www.zotero.org/styles/frontline-gastroenterology": "Frontline Gastroenterology",
		"http://www.zotero.org/styles/functional-ecology": "Functional Ecology",
		"http://www.zotero.org/styles/fungal-biology": "Fungal Biology",
		"http://www.zotero.org/styles/future-cardiology": "Future Cardiology",
		"http://www.zotero.org/styles/future-internet": "Future Internet",
		"http://www.zotero.org/styles/future-medicinal-chemistry": "Future Medicinal Chemistry",
		"http://www.zotero.org/styles/future-microbiology": "Future Microbiology",
		"http://www.zotero.org/styles/future-neurology": "Future Neurology",
		"http://www.zotero.org/styles/future-oncology": "Future Oncology",
		"http://www.zotero.org/styles/future-science": "Future Science",
		"http://www.zotero.org/styles/future-virology": "Future Virology",
		"http://www.zotero.org/styles/gaceta-sanitaria": "Gaceta Sanitaria",
		"http://www.zotero.org/styles/games": "Games",
		"http://www.zotero.org/styles/gastroenterologia-y-hepatologia": "Gastroenterologia y Hepatologia",
		"http://www.zotero.org/styles/gastrointestinal-endoscopy": "Gastrointestinal Endoscopy",
		"http://www.zotero.org/styles/gene-therapy": "Gene Therapy",
		"http://www.zotero.org/styles/genes-and-development": "Genes and Development",
		"http://www.zotero.org/styles/genes-and-immunity": "Genes and Immunity",
		"http://www.zotero.org/styles/genes": "Genes",
		"http://www.zotero.org/styles/genome-research": "Genome Research",
		"http://www.zotero.org/styles/geological-society-america-bulletin": "Geological Society of America Bulletin",
		"http://www.zotero.org/styles/geology": "Geology",
		"http://www.zotero.org/styles/geosciences": "Geosciences",
		"http://www.zotero.org/styles/geosphere": "Geosphere",
		"http://www.zotero.org/styles/geriatric-cardiovascular-medicine": "Geriatric Cardiovascular Medicine",
		"http://www.zotero.org/styles/geriatrics": "Geriatrics",
		"http://www.zotero.org/styles/gerontology": "Gerontology",
		"http://www.zotero.org/styles/group-dynamics-theory-research-and-practice": "Group Dynamics: Theory, Research, and Practice",
		"http://www.zotero.org/styles/gsa-today": "GSA Today",
		"http://www.zotero.org/styles/gullet": "Gullet",
		"http://www.zotero.org/styles/gut": "Gut",
		"http://www.zotero.org/styles/gynakologische-rundschau": "Gynakologische Rundschau",
		"http://www.zotero.org/styles/gynecologic-and-obstetric-investigation": "Gynecologic and Obstetric Investigation",
		"http://www.zotero.org/styles/haematologica": "Haematologica",
		"http://www.zotero.org/styles/haemostasis": "Haemostasis",
		"http://www.zotero.org/styles/harvard-educational-review": "Harvard Educational Review",
		"http://www.zotero.org/styles/hawaii-medical-journal": "Hawaii Medical Journal",
		"http://www.zotero.org/styles/headache": "Headache",
		"http://www.zotero.org/styles/health-economics-policy-and-law": "Health Economics, Policy and Law",
		"http://www.zotero.org/styles/health-psychology": "Health Psychology",
		"http://www.zotero.org/styles/health-trends": "Health Trends",
		"http://www.zotero.org/styles/heart-and-lung-the-journal-of-critical-care": "Heart and Lung: the Journal of Critical Care",
		"http://www.zotero.org/styles/heart-asia": "Heart Asia",
		"http://www.zotero.org/styles/heart": "Heart",
		"http://www.zotero.org/styles/hellenic-journal-of-cardiology": "Hellenic Journal of Cardiology",
		"http://www.zotero.org/styles/helleniki-cheirougirke": "Helleniki Cheirougirke",
		"http://www.zotero.org/styles/helliniki-iatriki": "Helliniki Iatriki",
		"http://www.zotero.org/styles/hispanic-american-historical-review": "Hispanic American Historical Review",
		"http://www.zotero.org/styles/history-of-political-economy": "History of Political Economy",
		"http://www.zotero.org/styles/history-of-psychology": "History of Psychology",
		"http://www.zotero.org/styles/history-of-the-journal-nature": "History of the journal Nature",
		"http://www.zotero.org/styles/hiv-therapy": "HIV Therapy",
		"http://www.zotero.org/styles/hong-kong-journal-of-ophthalmology": "Hong Kong Journal of Ophthalmology",
		"http://www.zotero.org/styles/hong-kong-journal-of-orthopaedic-surgery": "Hong Kong Journal of Orthopaedic Surgery",
		"http://www.zotero.org/styles/hong-kong-journal-of-psychiatry": "Hong Kong Journal of Psychiatry",
		"http://www.zotero.org/styles/hong-kong-medical-technology-association-journal": "Hong Kong Medical Technology Association Journal",
		"http://www.zotero.org/styles/hormone-research-in-paediatrics": "Hormone Research in Paediatrics",
		"http://www.zotero.org/styles/hormone-research": "Hormone Research",
		"http://www.zotero.org/styles/hospital-chronicles": "Hospital Chronicles (Nosokomiaka Chronica)",
		"http://www.zotero.org/styles/hospital-pharmacy": "Hospital Pharmacy",
		"http://www.zotero.org/styles/huisarts-en-wetenschap": "Huisarts En Wetenschap (General Practitioner and Science)",
		"http://www.zotero.org/styles/human-development": "Human Development",
		"http://www.zotero.org/styles/human-heredity": "Human Heredity",
		"http://www.zotero.org/styles/human-molecular-genetics": "Human Molecular Genetics",
		"http://www.zotero.org/styles/human-resources-for-health": "Human Resources for Health",
		"http://www.zotero.org/styles/humanities": "Humanities",
		"http://www.zotero.org/styles/hungarian-journal-of-obstetrics-and-gynecology": "Hungarian Journal of Obstetrics and Gynecology",
		"http://www.zotero.org/styles/hypertension-research": "Hypertension Research",
		"http://www.zotero.org/styles/iatriki": "Iatriki",
		"http://www.zotero.org/styles/ieee-advanced-packaging": "Advanced Packaging, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-aerospace-and-electronic-systems": "Aerospace and Electronic Systems, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-antennas-and-propagation": "Antennas and Propagation, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-antennas-and-wireless-propagation-letters": "Antennas and Wireless Propagation Letters",
		"http://www.zotero.org/styles/ieee-applied-superconductivity": "Applied Superconductivity, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-audio-speech-and-language-processing": "Audio, Speech and Language Processing, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-automatic-control": "Automatic Control, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-automation-science-and-engineering": "Automation Science and Engineering, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-biomedical-circuits-and-systems": "Biomedical Circuits and Systems, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-biomedical-engineering": "Biomedical Engineering, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-broadcasting": "Broadcasting, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-circuits-and-systems-for-video-technology": "Circuits and Systems for Video Technology, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-circuits-and-systems-i-regular-papers": "Circuits and Systems I: Regular Papers, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-circuits-and-systems-ii-express-briefs": "Circuits and Systems II: Express Briefs, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-communications-letters": "Communications Letters, IEEE",
		"http://www.zotero.org/styles/ieee-communications-magazine": "Communications Magazine, IEEE",
		"http://www.zotero.org/styles/ieee-communications": "Communications, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-components-and-packaging-technologies": "Components and Packaging Technologies, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-computational-biology-and-bioinformatics": "Computational Biology and Bioinformatics, IEEE/ACM Transactions on",
		"http://www.zotero.org/styles/ieee-computer-aided-design-of-integrated-circuits-and-systems": "Computer-Aided Design of Integrated Circuits and Systems, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-computer-architecture-letters": "Computer Architecture Letters, IEEE",
		"http://www.zotero.org/styles/ieee-computers": "Computers, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-computing-in-science-and-engineering": "Computing in Science & Engineering",
		"http://www.zotero.org/styles/ieee-consumer-electronics": "Consumer Electronics, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-control-systems-technology": "Control Systems Technology, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-dependable-and-secure-computing": "Dependable and Secure Computing, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-device-and-materials-reliability": "Device and Materials Reliability, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-dielectrics-and-electrical-insulation": "Dielectrics and Electrical Insulation, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-display-technology": "Display Technology, Journal of",
		"http://www.zotero.org/styles/ieee-education": "Education, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-electrical-and-computer-engineering-canadian": "Electrical and Computer Engineering, Canadian Journal of",
		"http://www.zotero.org/styles/ieee-electromagnetic-compatibility": "Electromagnetic Compatibility, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-electron-device-letters": "Electron Device Letters, IEEE",
		"http://www.zotero.org/styles/ieee-electron-devices": "Electron Devices, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-electronic-materials-tms": "Electronic Materials, IEEE/TMS Journal of",
		"http://www.zotero.org/styles/ieee-electronics-packaging-manufacturing": "Electronics Packaging Manufacturing, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-energy-conversion": "Energy Conversion, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-engineering-management": "Engineering Management, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-evolutionary-computation": "Evolutionary Computation, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-fuzzy-systems": "Fuzzy Systems, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-geoscience-and-remote-sensing-letters": "Geoscience and Remote Sensing Letters, IEEE",
		"http://www.zotero.org/styles/ieee-geoscience-and-remote-sensing": "Geoscience and Remote Sensing, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-image-processing": "Image Processing, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-industrial-electronics": "Industrial Electronics, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-industrial-informatics": "Industrial Informatics, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-industry-applications": "Industry Applications, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-information-forensics-and-security": "Information Forensics and Security, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-information-technology-in-biomedicine": "Information Technology in Biomedicine, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-information-theory": "Information Theory, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-instrumentation-and-measurement": "Instrumentation and Measurement, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-intelligent-transportation-systems": "Intelligent Transportation Systems, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-knowledge-and-data-engineering": "Knowledge and Data Engineering, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-latin-america-transactions": "Latin America Transactions, IEEE",
		"http://www.zotero.org/styles/ieee-lightwave-technology": "Lightwave Technology, Journal of",
		"http://www.zotero.org/styles/ieee-magnetics": "Magnetics, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-manufacturing-technology": "Manufacturing Technology, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-mechatronics-asme-transactions-on": "Mechatronics, IEEE/american-society-of-mechanical-engineers Transactions on",
		"http://www.zotero.org/styles/ieee-medical-imaging": "Medical Imaging, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-microelectromechanical-systems": "Microelectromechanical Systems, Journal of",
		"http://www.zotero.org/styles/ieee-microwave-and-wireless-components-letters": "Microwave and Wireless Components Letters, IEEE",
		"http://www.zotero.org/styles/ieee-microwave-theory-and-techniques": "Microwave Theory and Techniques, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-mobile-computing": "Mobile Computing, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-multimedia": "Multimedia, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-nanobioscience": "Nanobioscience, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-nanotechnology": "Nanotechnology, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-network-and-service-management": "Network and Service Management, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-networking": "Networking, IEEE/ACM Transactions on",
		"http://www.zotero.org/styles/ieee-neural-networks": "Neural Networks, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-neural-systems-and-rehabilitation-engineering": "Neural Systems and Rehabilitation Engineering, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-nuclear-science": "Nuclear Science, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-oceanic-engineering": "Oceanic Engineering, IEEE Journal of",
		"http://www.zotero.org/styles/ieee-parallel-and-distributed-systems": "Parallel and Distributed Systems, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-pattern-analysis-and-machine-intelligence": "Pattern Analysis and Machine Intelligence, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-photonics-technology-letters": "Photonics Technology Letters, IEEE",
		"http://www.zotero.org/styles/ieee-plasma-science": "Plasma Science, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-power-delivery": "Power Delivery, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-power-electronics-letters": "Power Electronics Letters, IEEE",
		"http://www.zotero.org/styles/ieee-power-electronics": "Power Electronics, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-power-systems": "Power Systems, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-professional-communication": "Professional Communication, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-project-safety-engineering": "Project Safety Engineering, IEEE Journal on",
		"http://www.zotero.org/styles/ieee-quantum-electronics": "Quantum Electronics, IEEE Journal of",
		"http://www.zotero.org/styles/ieee-reliability": "Reliability, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-robotics": "Robotics, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-selected-areas-in-communications": "Selected Areas in Communications, IEEE Journal on",
		"http://www.zotero.org/styles/ieee-selected-topics-in-quantum-electronics": "Selected Topics in Quantum Electronics, IEEE Journal of",
		"http://www.zotero.org/styles/ieee-selected-topics-in-signal-processing": "Selected Topics in Signal Processing, IEEE Journal on",
		"http://www.zotero.org/styles/ieee-semiconductor-manufacturing": "Semiconductor Manufacturing, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-sensors-journal": "Sensors Journal, IEEE",
		"http://www.zotero.org/styles/ieee-signal-processing-letters": "Signal Processing Letters, IEEE",
		"http://www.zotero.org/styles/ieee-signal-processing": "Signal Processing, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-software-engineering": "Software Engineering, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-solid-state-circuits": "Solid-State Circuits, IEEE Journal of",
		"http://www.zotero.org/styles/ieee-systems-journal": "Systems Journal, IEEE",
		"http://www.zotero.org/styles/ieee-systems-man-and-cybernetics-part-a": "Systems, Man and Cybernetics, Part A, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-systems-man-and-cybernetics-part-b": "Systems, Man and Cybernetics, Part B, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-systems-man-and-cybernetics-part-c": "Systems, Man and Cybernetics, Part C, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-ultrasonics-ferroelectrics-and-frequency-control": "Ultrasonics, Ferroelectrics and Frequency Control, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-vehicular-technology": "Vehicular Technology, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-very-large-scale-integration-systems": "Very Large Scale Integration (VLSI) Systems, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-visualization-and-computer-graphics": "Visualization and Computer Graphics, IEEE Transactions on",
		"http://www.zotero.org/styles/ieee-wireless-communications": "Wireless Communications, IEEE Transactions on",
		"http://www.zotero.org/styles/imaging-in-medicine": "Imaging in Medicine",
		"http://www.zotero.org/styles/immunity": "Immunity",
		"http://www.zotero.org/styles/immunologica-research": "Immunologica Research",
		"http://www.zotero.org/styles/immunology-and-cell-biology": "Immunology & Cell Biology",
		"http://www.zotero.org/styles/immunotherapy": "Immunotherapy",
		"http://www.zotero.org/styles/in-practice": "In Practice",
		"http://www.zotero.org/styles/indian-journal-for-practising-doctor": "Indian Journal for Practising Doctor",
		"http://www.zotero.org/styles/indian-journal-of-anaesthesia": "Indian Journal of Anaesthesia",
		"http://www.zotero.org/styles/indian-journal-of-cancer": "Indian Journal of Cancer",
		"http://www.zotero.org/styles/indian-journal-of-critical-care-medicine": "Indian Journal of Critical Care Medicine",
		"http://www.zotero.org/styles/indian-journal-of-dermatology-venereology-and-leprology": "Indian Journal of Dermatology, Venereology and Leprology",
		"http://www.zotero.org/styles/indian-journal-of-dermatology": "Indian Journal of Dermatology",
		"http://www.zotero.org/styles/indian-journal-of-gastroenterology": "Indian Journal of Gastroenterology",
		"http://www.zotero.org/styles/indian-journal-of-human-genetics": "Indian Journal of Human Genetics",
		"http://www.zotero.org/styles/indian-journal-of-medical-informatics": "Indian Journal of Medical Informatics",
		"http://www.zotero.org/styles/indian-journal-of-medical-microbiology": "Indian Journal of Medical Microbiology",
		"http://www.zotero.org/styles/indian-journal-of-medical-sciences": "Indian Journal of Medical Sciences",
		"http://www.zotero.org/styles/indian-journal-of-occupational-and-environmental-medicine": "Indian Journal of Occupational & Environmental Medicine",
		"http://www.zotero.org/styles/indian-journal-of-ophthalmology": "Indian Journal of Ophthalmology",
		"http://www.zotero.org/styles/indian-journal-of-otolaryngology-and-head-and-neck-surgery": "Indian Journal of Otolaryngology & Head & Neck Surgery",
		"http://www.zotero.org/styles/indian-journal-of-palliative-care": "Indian Journal of Palliative Care",
		"http://www.zotero.org/styles/indian-journal-of-pharmacology": "Indian Journal of Pharmacology",
		"http://www.zotero.org/styles/indian-journal-of-plastic-surgery": "Indian Journal of Plastic Surgery",
		"http://www.zotero.org/styles/indian-journal-of-surgery": "Indian Journal of Surgery",
		"http://www.zotero.org/styles/indian-journal-of-urology": "Indian Journal of Urology",
		"http://www.zotero.org/styles/indian-pacing-and-electrophysiology-journal": "Indian Pacing and Electrophysiology Journal",
		"http://www.zotero.org/styles/industrial-and-engineering-chemistry-research": "Industrial & Engineering Chemistry Research",
		"http://www.zotero.org/styles/industrial-crops-and-products": "Industrial Crops and Products",
		"http://www.zotero.org/styles/infection-and-immunity": "Infection and Immunity",
		"http://www.zotero.org/styles/inflammopharmocology": "Inflammopharmocology",
		"http://www.zotero.org/styles/information": "Information",
		"http://www.zotero.org/styles/injury-prevention": "Injury Prevention",
		"http://www.zotero.org/styles/innovate": "Innovate",
		"http://www.zotero.org/styles/inorganic-chemistry": "Inorganic Chemistry",
		"http://www.zotero.org/styles/insects": "Insects",
		"http://www.zotero.org/styles/instituto-nacional-de-cardiologia-ignacio-chavez": "Instituto Nacional de Cardiologia Ignacio Chavez",
		"http://www.zotero.org/styles/international-archives-of-allergy-and-applied-immunology": "International Archives of Allergy and Applied Immunology",
		"http://www.zotero.org/styles/international-archives-of-allergy-and-immunology": "International Archives of Allergy and Immunology",
		"http://www.zotero.org/styles/international-disability-studies": "International Disability Studies",
		"http://www.zotero.org/styles/international-journal-cross-cultural-management": "International Journal of Cross Cultural Management",
		"http://www.zotero.org/styles/international-journal-of-biological-sciences": "International Journal of Biological Sciences",
		"http://www.zotero.org/styles/international-journal-of-biosocial-and-medical-research": "International Journal of Biosocial and Medical Research",
		"http://www.zotero.org/styles/international-journal-of-clinical-rheumatology": "International Journal of Clinical Rheumatology",
		"http://www.zotero.org/styles/international-journal-of-environmental-research-and-public-health": "International Journal of Environmental Research and Public Health",
		"http://www.zotero.org/styles/international-journal-of-epidemiology": "International Journal of Epidemiology",
		"http://www.zotero.org/styles/international-journal-of-impotence-research": "International Journal of Impotence Research",
		"http://www.zotero.org/styles/international-journal-of-integrative-biology": "International Journal of Integrative Biology",
		"http://www.zotero.org/styles/international-journal-of-legal-medicine": "International Journal of Legal Medicine",
		"http://www.zotero.org/styles/international-journal-of-medical-sciences": "International Journal of Medical Sciences",
		"http://www.zotero.org/styles/international-journal-of-molecular-sciences": "International Journal of Molecular Sciences",
		"http://www.zotero.org/styles/international-journal-of-nursing-practice": "International Journal of Nursing Practice",
		"http://www.zotero.org/styles/international-journal-of-obesity": "International Journal of Obesity",
		"http://www.zotero.org/styles/international-journal-of-pediatric-nephrology": "International Journal of Pediatric Nephrology",
		"http://www.zotero.org/styles/international-journal-of-pharmacy-practice": "International Journal of Pharmacy Practice",
		"http://www.zotero.org/styles/international-journal-of-play-therapy": "International Journal of Play Therapy",
		"http://www.zotero.org/styles/international-journal-of-psychiatry-in-medicine": "International Journal of Psychiatry in Medicine",
		"http://www.zotero.org/styles/international-journal-of-std-and-aids": "International Journal of STD and AIDS",
		"http://www.zotero.org/styles/international-journal-of-stress-management": "International Journal of Stress Management",
		"http://www.zotero.org/styles/international-journal-of-systematic-and-evolutionary-microbiology": "International Journal of Systematic and Evolutionary Microbiology",
		"http://www.zotero.org/styles/international-political-sociology": "International Political Sociology",
		"http://www.zotero.org/styles/international-studies-perspectives": "International Studies Perspectives",
		"http://www.zotero.org/styles/international-studies-quarterly": "International Studies Quarterly",
		"http://www.zotero.org/styles/international-studies-review": "International Studies Review",
		"http://www.zotero.org/styles/international-surgery": "International Surgery",
		"http://www.zotero.org/styles/interventional-cardiology": "Interventional Cardiology",
		"http://www.zotero.org/styles/interviology": "Interviology",
		"http://www.zotero.org/styles/intervirology": "Intervirology",
		"http://www.zotero.org/styles/invasion-and-metastasis": "Invasion and Metastasis",
		"http://www.zotero.org/styles/iranian-journal-of-allergy-asthma-and-immunology": "Iranian Journal of Allergy, Asthma and Immunology",
		"http://www.zotero.org/styles/iraqi-journal-of-veterinary-sciences": "Iraqi Journal of Veterinary Sciences",
		"http://www.zotero.org/styles/irish-journal-of-psychological-medicine": "Irish Journal of Psychological Medicine",
		"http://www.zotero.org/styles/isprs-international-journal-of-geo-information": "ISPRS International Journal of Geo-Information",
		"http://www.zotero.org/styles/israel-journal-of-psychiatry-and-related-sciences": "Israel Journal of Psychiatry and Related Sciences",
		"http://www.zotero.org/styles/italian-journal-of-gastroenterology": "Italian Journal of Gastroenterology",
		"http://www.zotero.org/styles/jid-symposium-proceedings": "JID Symposium Proceedings",
		"http://www.zotero.org/styles/jnci-journal-of-the-national-cancer-institute": "JNCI - Journal of the National Cancer Institute",
		"http://www.zotero.org/styles/jornal-de-pediatria": "Jornal de Pediatria",
		"http://www.zotero.org/styles/journal-klinische-monatsblatter-fur-augenheilkunde": "Journal Klinische Monatsbl\u00c3\u00a4tter F\u00c3\u00bcr Augenheilkunde",
		"http://www.zotero.org/styles/journal-of-abnormal-psychology": "Journal of Abnormal Psychology",
		"http://www.zotero.org/styles/journal-of-allergy-and-clinical-immunology": "Journal of Allergy and Clinical Immunology",
		"http://www.zotero.org/styles/journal-of-alloys-and-compounds": "Journal of Alloys and Compounds",
		"http://www.zotero.org/styles/journal-of-animal-ecology": "Journal of Animal Ecology",
		"http://www.zotero.org/styles/journal-of-applied-mechanics": "Journal of Applied Mechanics",
		"http://www.zotero.org/styles/journal-of-applied-meteorology-and-climatology": "Journal of Applied Meteorology and Climatology",
		"http://www.zotero.org/styles/journal-of-applied-nutrition": "Journal of Applied Nutrition",
		"http://www.zotero.org/styles/journal-of-applied-physics": "Journal of Applied Physics",
		"http://www.zotero.org/styles/journal-of-applied-physiology": "Journal of Applied Physiology",
		"http://www.zotero.org/styles/journal-of-applied-psychology": "Journal of Applied Psychology",
		"http://www.zotero.org/styles/journal-of-applied-remote-sensing": "Journal of Applied Remote Sensing",
		"http://www.zotero.org/styles/journal-of-archaeological-science": "Journal of Archaeological Science",
		"http://www.zotero.org/styles/journal-of-assisted-reproduction-and-genetics": "Journal of Assisted Reproduction & Genetics",
		"http://www.zotero.org/styles/journal-of-atmospheric-and-oceanic-technology": "Journal of Atmospheric and Oceanic Technology",
		"http://www.zotero.org/styles/journal-of-bacteriology": "Journal of Bacteriology",
		"http://www.zotero.org/styles/journal-of-biological-standardization": "Journal of Biological Standardization",
		"http://www.zotero.org/styles/journal-of-biomechanical-engineering": "Journal of Biomechanical Engineering",
		"http://www.zotero.org/styles/journal-of-biomedical-optics": "Journal of Biomedical Optics",
		"http://www.zotero.org/styles/journal-of-biotechnology": "Journal of Biotechnology",
		"http://www.zotero.org/styles/journal-of-cancer-research-and-therapeutics": "Journal of Cancer Research & Therapeutics",
		"http://www.zotero.org/styles/journal-of-cardiovascular-surgery": "Journal of Cardiovascular Surgery",
		"http://www.zotero.org/styles/journal-of-cell-biology": "Journal of Cell Biology",
		"http://www.zotero.org/styles/journal-of-cell-science": "Journal of Cell Science",
		"http://www.zotero.org/styles/journal-of-cerebral-blood-flow-and-metabolism": "Journal of Cerebral Blood Flow and Metabolism",
		"http://www.zotero.org/styles/journal-of-chemical-and-engineering-data": "Journal of Chemical & Engineering Data",
		"http://www.zotero.org/styles/journal-of-chemical-information-and-modeling": "Journal of Chemical Information and Modeling",
		"http://www.zotero.org/styles/journal-of-chemical-physics": "The Journal of Chemical Physics",
		"http://www.zotero.org/styles/journal-of-chemical-theory-and-computation": "Journal of Chemical Theory and Computation",
		"http://www.zotero.org/styles/journal-of-chemotherapy": "Journal of Chemotherapy",
		"http://www.zotero.org/styles/journal-of-chronic-diseases": "Journal of Chronic Diseases",
		"http://www.zotero.org/styles/journal-of-climate": "Journal of Climate",
		"http://www.zotero.org/styles/journal-of-clinical-endocrinology-and-metabolism": "Journal of Clinical Endocrinology and Metabolism",
		"http://www.zotero.org/styles/journal-of-clinical-gastroenterology": "Journal of Clinical Gastroenterology",
		"http://www.zotero.org/styles/journal-of-clinical-microbiology": "Journal of Clinical Microbiology",
		"http://www.zotero.org/styles/journal-of-clinical-pathology": "Journal of Clinical Pathology",
		"http://www.zotero.org/styles/journal-of-clinical-psychiatry": "Journal of Clinical Psychiatry",
		"http://www.zotero.org/styles/journal-of-combinatorial-chemistry": "Journal of Combinatorial Chemistry",
		"http://www.zotero.org/styles/journal-of-comparative-psychology": "Journal of Comparative Psychology",
		"http://www.zotero.org/styles/journal-of-computational-and-nonlinear-dynamics": "Journal of Computational and Nonlinear Dynamics",
		"http://www.zotero.org/styles/journal-of-consulting-and-clinical-psychology": "Journal of Consulting and Clinical Psychology",
		"http://www.zotero.org/styles/journal-of-counseling-psychology": "Journal of Counseling Psychology",
		"http://www.zotero.org/styles/journal-of-dental-education": "Journal of Dental Education",
		"http://www.zotero.org/styles/journal-of-dentistry": "Journal of Dentistry",
		"http://www.zotero.org/styles/journal-of-diabetic-complications": "Journal of Diabetic Complications",
		"http://www.zotero.org/styles/journal-of-diarrhoeal-disease-research": "Journal of Diarrhoeal Disease Research",
		"http://www.zotero.org/styles/journal-of-diversity-in-higher-education": "Journal of Diversity in Higher Education",
		"http://www.zotero.org/styles/journal-of-dynamic-systems-measurement-and-control": "Journal of Dynamic Systems, Measurement and Control",
		"http://www.zotero.org/styles/journal-of-ecology": "Journal of Ecology",
		"http://www.zotero.org/styles/journal-of-educational-and-behavioral-statistics": "Journal of Educational and Behavioral Statistics",
		"http://www.zotero.org/styles/journal-of-educational-evaluation-for-health-professions": "Journal of Educational Evaluation for Health Professions",
		"http://www.zotero.org/styles/journal-of-educational-psychology": "Journal of Educational Psychology",
		"http://www.zotero.org/styles/journal-of-electronic-imaging": "Journal of Electronic Imaging",
		"http://www.zotero.org/styles/journal-of-electronic-packaging": "Journal of Electronic Packaging",
		"http://www.zotero.org/styles/journal-of-emergency-nursing": "Journal of Emergency Nursing",
		"http://www.zotero.org/styles/journal-of-endocrinology": "Journal of Endocrinology",
		"http://www.zotero.org/styles/journal-of-energy-resources-technology": "Journal of Energy Resources Technology",
		"http://www.zotero.org/styles/journal-of-engineering-for-gas-turbines-and-power": "Journal of Engineering for Gas Turbines and Power",
		"http://www.zotero.org/styles/journal-of-engineering-materials-and-technology": "Journal of Engineering Materials and Technology",
		"http://www.zotero.org/styles/journal-of-enterostomal-therapy": "Journal of Enterostomal Therapy",
		"http://www.zotero.org/styles/journal-of-epidemiology-and-community-health": "Journal of Epidemiology and Community Health",
		"http://www.zotero.org/styles/journal-of-epidemiology-community-health": "Journal of Epidemiology & Community Health",
		"http://www.zotero.org/styles/journal-of-experimental-and-clinical-assisted-reproduction": "Journal of Experimental & Clinical Assisted Reproduction",
		"http://www.zotero.org/styles/journal-of-experimental-and-clinical-cancer-research": "Journal of Experimental & Clinical Cancer Research",
		"http://www.zotero.org/styles/journal-of-experimental-medicine": "Journal of Experimental Medicine",
		"http://www.zotero.org/styles/journal-of-experimental-psychology-animal-behavior-processes": "Journal of Experimental Psychology: Animal Behavior Processes",
		"http://www.zotero.org/styles/journal-of-experimental-psychology-applied": "Journal of Experimental Psychology: Applied",
		"http://www.zotero.org/styles/journal-of-experimental-psychology-general": "Journal of Experimental Psychology: General",
		"http://www.zotero.org/styles/journal-of-experimental-psychology-human-perception-and-performance": "Journal of Experimental Psychology: Human Perception and Performance",
		"http://www.zotero.org/styles/journal-of-experimental-psychology-learning-memory-and-cognition": "Journal of Experimental Psychology: Learning, Memory, and Cognition",
		"http://www.zotero.org/styles/journal-of-exposure-science-and-environmental-epidemiology": "Journal of Exposure Science and Environmental Epidemiology",
		"http://www.zotero.org/styles/journal-of-family-psychology": "Journal of Family Psychology",
		"http://www.zotero.org/styles/journal-of-fluids-engineering": "Journal of Fluids Engineering",
		"http://www.zotero.org/styles/journal-of-fuel-cell-science-and-technology": "Journal of Fuel Cell Science and Technology",
		"http://www.zotero.org/styles/journal-of-functional-biomaterials": "Journal of Functional Biomaterials",
		"http://www.zotero.org/styles/journal-of-gastroenterology-and-hepatology": "Journal of Gastroenterology and Hepatology",
		"http://www.zotero.org/styles/journal-of-gastrointestinal-and-liver-diseases": "Journal of Gastrointestinal and Liver Diseases",
		"http://www.zotero.org/styles/journal-of-general-internal-medicine": "Journal of General Internal Medicine",
		"http://www.zotero.org/styles/journal-of-general-physiology": "Journal of General Physiology",
		"http://www.zotero.org/styles/journal-of-general-virology": "Journal of General Virology",
		"http://www.zotero.org/styles/journal-of-hand-surgery": "Journal of Hand Surgery",
		"http://www.zotero.org/styles/journal-of-hazardous-materials": "Journal of Hazardous Materials",
		"http://www.zotero.org/styles/journal-of-health-and-social-behavior": "Journal of Health and Social Behavior",
		"http://www.zotero.org/styles/journal-of-heart-and-lung-transplantation": "Journal of Heart and Lung Transplantation",
		"http://www.zotero.org/styles/journal-of-heart-transplantation": "Journal of Heart Transplantation",
		"http://www.zotero.org/styles/journal-of-hong-kong-medical-association": "Journal of Hong Kong Medical Association",
		"http://www.zotero.org/styles/journal-of-hong-kong-medical-technology-association": "Journal of Hong Kong Medical Technology Association",
		"http://www.zotero.org/styles/journal-of-human-hypertension": "Journal of Human Hypertension",
		"http://www.zotero.org/styles/journal-of-hydrometeorology": "Journal of Hydrometeorology",
		"http://www.zotero.org/styles/journal-of-hypertension": "Journal of Hypertension",
		"http://www.zotero.org/styles/journal-of-indian-association-for-child-and-adolescent-mental-health": "Journal of Indian Association for Child and Adolescent Mental Health",
		"http://www.zotero.org/styles/journal-of-indian-association-of-pediatric-surgeons": "Journal of Indian Association of Pediatric Surgeons",
		"http://www.zotero.org/styles/journal-of-indian-prosthodontic-society": "Journal of Indian Prosthodontic Society",
		"http://www.zotero.org/styles/journal-of-innate-immunity": "Journal of Innate Immunity",
		"http://www.zotero.org/styles/journal-of-internal-medicine": "Journal of Internal Medicine",
		"http://www.zotero.org/styles/journal-of-investigative-dermatology": "The Journal of Investigative Dermatology",
		"http://www.zotero.org/styles/journal-of-laboratory-and-clinical-medicine": "Journal of Laboratory and Clinical Medicine",
		"http://www.zotero.org/styles/journal-of-low-power-electronics-and-applications": "Journal of Low Power Electronics and Applications",
		"http://www.zotero.org/styles/journal-of-magnetism-and-magnetic-materials": "Journal of Magnetism and Magnetic Materials",
		"http://www.zotero.org/styles/journal-of-manipulative-and-physiological-therapeutics": "Journal of Manipulative and Physiological Therapeutics",
		"http://www.zotero.org/styles/journal-of-maternal-and-child-health": "Journal of Maternal and Child Health",
		"http://www.zotero.org/styles/journal-of-mathematical-physics": "Journal of Mathematical Physics",
		"http://www.zotero.org/styles/journal-of-medical-ethics": "Journal of Medical Ethics",
		"http://www.zotero.org/styles/journal-of-medical-genetics": "Journal of Medical Genetics",
		"http://www.zotero.org/styles/journal-of-medical-microbiology": "Journal of Medical Microbiology",
		"http://www.zotero.org/styles/journal-of-medical-physics": "Journal of Medical Physics",
		"http://www.zotero.org/styles/journal-of-medicinal-chemistry": "Journal of Medicinal Chemistry",
		"http://www.zotero.org/styles/journal-of-medieval-and-early-modern-studies": "Journal of Medieval and Early Modern Studies",
		"http://www.zotero.org/styles/journal-of-micro-nanolithography-mems-and-moems": "Journal of Micro/Nanolithography, MEMS, and MOEMS",
		"http://www.zotero.org/styles/journal-of-microbiology-immunology-and-infection": "Journal of Microbiology, Immunology and Infection",
		"http://www.zotero.org/styles/journal-of-midwifery-and-womens-health": "Journal of Midwifery & Women\u00e2\u20ac\u2122s Health",
		"http://www.zotero.org/styles/journal-of-minimal-access-surgery": "Journal of Minimal Access Surgery",
		"http://www.zotero.org/styles/journal-of-modern-history": "Journal of Modern History",
		"http://www.zotero.org/styles/journal-of-molecular-microbiology-and-biotechnology": "Journal of Molecular Microbiology and Biotechnology",
		"http://www.zotero.org/styles/journal-of-nanophotonics": "Journal of Nanophotonics",
		"http://www.zotero.org/styles/journal-of-natural-products": "Journal of Natural Products",
		"http://www.zotero.org/styles/journal-of-neuro-interventional-surgery": "Journal of Neuro Interventional Surgery",
		"http://www.zotero.org/styles/journal-of-neurology-neurosurgery-and-psychiatry": "Journal of Neurology, Neurosurgery and Psychiatry",
		"http://www.zotero.org/styles/journal-of-neurooncology": "Journal of Neurooncology",
		"http://www.zotero.org/styles/journal-of-neuropathology-and-experimental-neurology": "Journal of Neuropathology and Experimental Neurology",
		"http://www.zotero.org/styles/journal-of-neuropsychology": "Journal of Neuropsychology",
		"http://www.zotero.org/styles/journal-of-neurosurgery-pediatrics": "Journal of Neurosurgery: Pediatrics",
		"http://www.zotero.org/styles/journal-of-neurosurgery-spine": "Journal of Neurosurgery: Spine",
		"http://www.zotero.org/styles/journal-of-neurovirology": "Journal of NeuroVirology",
		"http://www.zotero.org/styles/journal-of-nuclear-materials": "Journal of Nuclear Materials",
		"http://www.zotero.org/styles/journal-of-nuclear-medicine-technology": "Journal of Nuclear Medicine Technology",
		"http://www.zotero.org/styles/journal-of-nuclear-medicine": "Journal of Nuclear Medicine",
		"http://www.zotero.org/styles/journal-of-nurse-midwifery": "Journal of Nurse-Midwifery",
		"http://www.zotero.org/styles/journal-of-nutrigenetics-and-nutrigenomics": "Journal of Nutrigenetics and Nutrigenomics",
		"http://www.zotero.org/styles/journal-of-occupational-and-organizational-psychology": "Journal of Occupational and Organizational Psychology",
		"http://www.zotero.org/styles/journal-of-occupational-health-psychology": "Journal of Occupational Health Psychology",
		"http://www.zotero.org/styles/journal-of-organic-chemistry": "The Journal of Organic Chemistry",
		"http://www.zotero.org/styles/journal-of-paediatrics-and-child-health": "Journal of Paediatrics and Child Health",
		"http://www.zotero.org/styles/journal-of-palliative-care": "Journal of Palliative Care",
		"http://www.zotero.org/styles/journal-of-pathology": "Journal of Pathology",
		"http://www.zotero.org/styles/journal-of-pediatric-nephrology": "Journal of Pediatric Nephrology",
		"http://www.zotero.org/styles/journal-of-pediatric-neurosciences": "Journal of Pediatric Neurosciences",
		"http://www.zotero.org/styles/journal-of-pediatrics": "Journal of Pediatrics",
		"http://www.zotero.org/styles/journal-of-perinatology": "Journal of Perinatology",
		"http://www.zotero.org/styles/journal-of-periodontology": "Journal of Periodontology",
		"http://www.zotero.org/styles/journal-of-personality-and-social-psychology": "Journal of Personality and Social Psychology",
		"http://www.zotero.org/styles/journal-of-personalized-medicine": "Journal of Personalized Medicine",
		"http://www.zotero.org/styles/journal-of-pharmacology-and-pharmacotherapeutics": "Journal of Pharmacology and Pharmacotherapeutics",
		"http://www.zotero.org/styles/journal-of-pharmacy-technology": "Journal of Pharmacy Technology",
		"http://www.zotero.org/styles/journal-of-physical-and-chemical-reference-data": "Journal of Physical and Chemical Reference Data",
		"http://www.zotero.org/styles/journal-of-physical-chemistry": "The Journal of Physical Chemistry",
		"http://www.zotero.org/styles/journal-of-physical-oceanography": "Journal of Physical Oceanography",
		"http://www.zotero.org/styles/journal-of-postgraduate-medicine": "Journal of Postgraduate Medicine",
		"http://www.zotero.org/styles/journal-of-power-sources": "Journal of Power Sources",
		"http://www.zotero.org/styles/journal-of-prosthetic-dentistry": "Journal of Prosthetic Dentistry",
		"http://www.zotero.org/styles/journal-of-proteome-research": "Journal of Proteome Research",
		"http://www.zotero.org/styles/journal-of-proteomics": "Journal of Proteomics",
		"http://www.zotero.org/styles/journal-of-psychosomatic-research": "Journal of Psychosomatic Research",
		"http://www.zotero.org/styles/journal-of-psychotherapy-integration": "Journal of Psychotherapy Integration",
		"http://www.zotero.org/styles/journal-of-quality-in-clinical-practice": "Journal of Quality in Clinical Practice",
		"http://www.zotero.org/styles/journal-of-rehabilitation-research-and-development": "Journal of Rehabilitation Research and Development (JRRD)",
		"http://www.zotero.org/styles/journal-of-rehabilitation": "Journal of Rehabilitation",
		"http://www.zotero.org/styles/journal-of-renewable-and-sustainable-energy": "Journal of Renewable and Sustainable Energy",
		"http://www.zotero.org/styles/journal-of-research-in-science-teaching": "Journal of Research in Science Teaching",
		"http://www.zotero.org/styles/journal-of-sensor-and-actuator-networks": "Journal of Sensor and Actuator Networks",
		"http://www.zotero.org/styles/journal-of-spirochetal-and-tick-borne-diseases": "Journal of Spirochetal and Tick-Borne Diseases",
		"http://www.zotero.org/styles/journal-of-the-american-academy-of-dermatology": "Journal of the American Academy of Dermatology",
		"http://www.zotero.org/styles/journal-of-the-american-academy-of-physician-assistants": "Journal of the American Academy of Physician Assistants",
		"http://www.zotero.org/styles/journal-of-the-american-board-of-family-medicine": "Journal of the American Board of Family Medicine",
		"http://www.zotero.org/styles/journal-of-the-american-chemical-society": "Journal of the American Chemical Society",
		"http://www.zotero.org/styles/journal-of-the-american-dental-association": "Journal of the American Dental Association (JADA)",
		"http://www.zotero.org/styles/journal-of-the-american-medical-association": "Journal of the American Medical Association (JAMA)",
		"http://www.zotero.org/styles/journal-of-the-american-medical-informatics-association": "Journal of the American Medical Informatics Association",
		"http://www.zotero.org/styles/journal-of-the-american-osteopathic-association": "Journal of the American Osteopathic Association",
		"http://www.zotero.org/styles/journal-of-the-american-society-of-echocardiography": "Journal of the American Society of Echocardiography",
		"http://www.zotero.org/styles/journal-of-the-atmospheric-sciences": "Journal of the Atmospheric Sciences",
		"http://www.zotero.org/styles/journal-of-the-british-association-for-immediate-care": "Journal of the British Association for Immediate Care",
		"http://www.zotero.org/styles/journal-of-the-canadian-association-of-radiologists": "Journal of the Canadian Association of Radiologists",
		"http://www.zotero.org/styles/journal-of-the-canadian-chiropractic-association": "Journal of the Canadian Chiropractic Association",
		"http://www.zotero.org/styles/journal-of-the-danish-medical-association": "Journal of the Danish Medical Association",
		"http://www.zotero.org/styles/journal-of-the-egyptian-public-health-association": "Journal of the Egyptian Public Health Association",
		"http://www.zotero.org/styles/journal-of-the-faculty-of-medicine-baghdad": "Journal of the Faculty of Medicine Baghdad",
		"http://www.zotero.org/styles/journal-of-the-faculty-of-medicine-selcuk-university": "Journal of the Faculty of Medicine, Selcuk University",
		"http://www.zotero.org/styles/journal-of-the-formosan-medical-association": "Journal of the Formosan Medical Association",
		"http://www.zotero.org/styles/journal-of-the-indian-society-of-pedodontics-and-preventative-dentistry": "Journal of the Indian Society of Pedodontics & Preventative Dentistry",
		"http://www.zotero.org/styles/journal-of-the-institute-of-medicine": "Journal of the Institute of Medicine",
		"http://www.zotero.org/styles/journal-of-the-international-aids-society": "Journal of the International AIDS Society",
		"http://www.zotero.org/styles/journal-of-the-irish-colleges-of-physicians-and-surgeons": "Journal of the Irish Colleges of Physicians and Surgeons",
		"http://www.zotero.org/styles/journal-of-the-kuwait-medical-association": "Journal of the Kuwait Medical Association",
		"http://www.zotero.org/styles/journal-of-the-national-medical-association": "Journal of the National Medical Association",
		"http://www.zotero.org/styles/journal-of-the-norwegian-medical-association": "Journal of the Norwegian Medical Association",
		"http://www.zotero.org/styles/journal-of-the-royal-army-medical-corps": "Journal of the Royal Army Medical Corps",
		"http://www.zotero.org/styles/journal-of-the-royal-college-of-physicians-of-london": "Journal of the Royal College of Physicians of London",
		"http://www.zotero.org/styles/journal-of-the-royal-college-of-surgeons-of-edinburgh": "Journal of the Royal College of Surgeons of Edinburgh",
		"http://www.zotero.org/styles/journal-of-the-royal-naval-medical-service": "Journal of the Royal Naval Medical Service",
		"http://www.zotero.org/styles/journal-of-the-royal-society-of-medicine": "Journal of the Royal Society of Medicine",
		"http://www.zotero.org/styles/journal-of-the-vivekananda-institute-of-medical-sciences": "Journal of the Vivekananda Institute of Medical Sciences",
		"http://www.zotero.org/styles/journal-of-theoretical-and-philosophical-psychology": "Journal of Theoretical and Philosophical Psychology",
		"http://www.zotero.org/styles/journal-of-thoracic-and-cardiovascular-surgery": "Journal of Thoracic and Cardiovascular Surgery",
		"http://www.zotero.org/styles/journal-of-vascular-research": "Journal of Vascular Research",
		"http://www.zotero.org/styles/journal-of-vascular-surgery": "Journal of Vascular Surgery",
		"http://www.zotero.org/styles/journal-of-virology": "Journal of Virology",
		"http://www.zotero.org/styles/kenya-veterinarian": "Kenya Veterinarian",
		"http://www.zotero.org/styles/kidney-and-blood-pressure-research": "Kidney and Blood Pressure Research",
		"http://www.zotero.org/styles/kidney-international": "Kidney International",
		"http://www.zotero.org/styles/klinische-labor-clinical-laboratory": "Klinische Labor/Clinical Laboratory",
		"http://www.zotero.org/styles/klinische-monatsblatter-fur-augenheilkunde": "Klinische Monatsblatter Fur Augenheilkunde",
		"http://www.zotero.org/styles/korean-journal-of-gynecologic-oncology": "Korean Journal of Gynecologic Oncology",
		"http://www.zotero.org/styles/la-prensa-medica-argentina": "La Prensa Medica Argentina",
		"http://www.zotero.org/styles/laboratory-investigation": "Laboratory Investigation",
		"http://www.zotero.org/styles/lakartidningen": "Lakartidningen",
		"http://www.zotero.org/styles/lancet-infectious-diseases": "The Lancet Infectious Diseases",
		"http://www.zotero.org/styles/lancet-neurology": "The Lancet Neurology",
		"http://www.zotero.org/styles/lancet-oncology": "The Lancet Oncology",
		"http://www.zotero.org/styles/langmuir": "Langmuir",
		"http://www.zotero.org/styles/laws": "Laws",
		"http://www.zotero.org/styles/learning-and-memory": "Learning and Memory",
		"http://www.zotero.org/styles/legal-and-criminological-psychology": "Legal and Criminological Psychology",
		"http://www.zotero.org/styles/leprosy-review": "Leprosy Review",
		"http://www.zotero.org/styles/leukemia": "Leukemia",
		"http://www.zotero.org/styles/life": "Life",
		"http://www.zotero.org/styles/lijecnicki-vjesnik": "Lijecnicki Vjesnik",
		"http://www.zotero.org/styles/lithosphere": "Lithosphere",
		"http://www.zotero.org/styles/low-temperature-physics": "Low Temperature Physics",
		"http://www.zotero.org/styles/lung-india": "Lung India",
		"http://www.zotero.org/styles/macedonian-journal-of-medical-sciences": "Macedonian Journal of Medical Sciences",
		"http://www.zotero.org/styles/macedonian-stomatologial-review": "Macedonian Stomatologial Review",
		"http://www.zotero.org/styles/macromolecules": "Macromolecules",
		"http://www.zotero.org/styles/magnesium": "Magnesium",
		"http://www.zotero.org/styles/magyar-noorvosok-lapja": "Magyar Noorvosok Lapja",
		"http://www.zotero.org/styles/maladies-chroniques-au-canada": "Maladies chroniques au Canada",
		"http://www.zotero.org/styles/malaysian-journal-of-pathology": "Malaysian Journal of Pathology",
		"http://www.zotero.org/styles/manedsskrift-for-praktk-laegegerning": "Manedsskrift for Praktk Laegegerning",
		"http://www.zotero.org/styles/marine-drugs": "Marine Drugs",
		"http://www.zotero.org/styles/marine-ecology-progress-series": "Marine Ecology Progress Series",
		"http://www.zotero.org/styles/materials-science-and-engineering-a": "Materials Science and Engineering A",
		"http://www.zotero.org/styles/materials-science-and-engineering-b": "Materials Science and Engineering B",
		"http://www.zotero.org/styles/materials-science-and-engineering-c": "Materials Science and Engineering C",
		"http://www.zotero.org/styles/materials-science-and-engineering-r": "Materials Science and Engineering R",
		"http://www.zotero.org/styles/materials": "Materials",
		"http://www.zotero.org/styles/medical-acupuncture": "Medical Acupuncture",
		"http://www.zotero.org/styles/medical-and-pediatric-oncology": "Medical and Pediatric Oncology",
		"http://www.zotero.org/styles/medical-care": "Medical Care",
		"http://www.zotero.org/styles/medical-education": "Medical Education",
		"http://www.zotero.org/styles/medical-humanities": "Medical Humanities",
		"http://www.zotero.org/styles/medical-journal-of-australia": "Medical Journal of Australia",
		"http://www.zotero.org/styles/medical-laboratory-sciences": "Medical Laboratory Sciences",
		"http://www.zotero.org/styles/medical-principles-and-practice": "Medical Principles and Practice",
		"http://www.zotero.org/styles/medicina-clinica": "Medicina Clinica",
		"http://www.zotero.org/styles/medicina-croatian-med-assoc": "Medicina, the Official Journal of the Croatian Medical Association - Rijeka",
		"http://www.zotero.org/styles/medicina-intensiva": "Medicina Intensiva",
		"http://www.zotero.org/styles/medicina-militar": "Medicina Militar",
		"http://www.zotero.org/styles/medicine": "Medicine",
		"http://www.zotero.org/styles/medula-espinal": "M\u00c3\u00a9dula Espinal",
		"http://www.zotero.org/styles/membranes": "Membranes",
		"http://www.zotero.org/styles/metabolites": "Metabolites",
		"http://www.zotero.org/styles/metals": "Metals",
		"http://www.zotero.org/styles/meteorological-monographs": "Meteorological Monographs",
		"http://www.zotero.org/styles/mhra_note_without_bibliography": "Modern Humanities Research Association (note without bibliography) (legacy)",
		"http://www.zotero.org/styles/microarrays": "Microarrays",
		"http://www.zotero.org/styles/microbiology-and-molecular-biology-reviews": "Microbiology and Molecular Biology Reviews",
		"http://www.zotero.org/styles/microbiology": "Microbiology",
		"http://www.zotero.org/styles/micromachines": "Micromachines",
		"http://www.zotero.org/styles/micron": "Micron",
		"http://www.zotero.org/styles/military-medicine": "Military Medicine",
		"http://www.zotero.org/styles/mineral-and-electrolyte-metabolism": "Mineral and Electrolyte Metabolism",
		"http://www.zotero.org/styles/minerals": "Minerals",
		"http://www.zotero.org/styles/modern-language-review": "Modern Language Review",
		"http://www.zotero.org/styles/modern-pathology": "Modern Pathology",
		"http://www.zotero.org/styles/molbank": "Molbank",
		"http://www.zotero.org/styles/molecular-and-cellular-biology": "Molecular and Cellular Biology",
		"http://www.zotero.org/styles/molecular-cancer-research": "Molecular Cancer Research",
		"http://www.zotero.org/styles/molecular-cancer-therapeutics": "Molecular Cancer Therapeutics",
		"http://www.zotero.org/styles/molecular-cell": "Molecular Cell",
		"http://www.zotero.org/styles/molecular-diagnosis-and-therapy": "Molecular Diagnosis & Therapy",
		"http://www.zotero.org/styles/molecular-pharmaceutics": "Molecular Pharmaceutics",
		"http://www.zotero.org/styles/molecular-syndromology": "Molecular Syndromology",
		"http://www.zotero.org/styles/molecular-systems-biology": "Molecular Systems Biology",
		"http://www.zotero.org/styles/molecules": "Molecules",
		"http://www.zotero.org/styles/monthly-weather-review": "Monthly Weather Review",
		"http://www.zotero.org/styles/mount-sinai-journal-of-medicine": "Mount Sinai Journal of Medicine",
		"http://www.zotero.org/styles/mucosal-immunology": "Mucosal Immunology",
		"http://www.zotero.org/styles/nano-letters": "Nano Letters",
		"http://www.zotero.org/styles/nanomaterials": "Nanomaterials",
		"http://www.zotero.org/styles/nanomedicine": "Nanomedicine",
		"http://www.zotero.org/styles/national-library-of-medicine": "National Library of Medicine",
		"http://www.zotero.org/styles/national-medical-journal-of-china": "National Medical Journal of China",
		"http://www.zotero.org/styles/natural-immunity-and-cell-growth-regulation": "Natural Immunity and Cell Growth Regulation",
		"http://www.zotero.org/styles/nature-biotechnology": "Nature Biotechnology",
		"http://www.zotero.org/styles/nature-cell-biology": "Nature Cell Biology",
		"http://www.zotero.org/styles/nature-chemical-biology": "Nature Chemical Biology",
		"http://www.zotero.org/styles/nature-chemistry": "Nature Chemistry",
		"http://www.zotero.org/styles/nature-clinical-practice-cardiovascular-medicine": "Nature Clinical Practice Cardiovascular Medicine",
		"http://www.zotero.org/styles/nature-clinical-practice-endocrinology-and-metabolism": "Nature Clinical Practice Endocrinology & Metabolism",
		"http://www.zotero.org/styles/nature-clinical-practice-gastroenterology-and-hepatology": "Nature Clinical Practice Gastroenterology and Hepatology",
		"http://www.zotero.org/styles/nature-clinical-practice-journals": "Nature Clinical Practice Journals",
		"http://www.zotero.org/styles/nature-clinical-practice-nephrology": "Nature Clinical Practice Nephrology",
		"http://www.zotero.org/styles/nature-clinical-practice-neurology": "Nature Clinical Practice Neurology",
		"http://www.zotero.org/styles/nature-clinical-practice-oncology": "Nature Clinical Practice Oncology",
		"http://www.zotero.org/styles/nature-clinical-practice-rheumatology": "Nature Clinical Practice Rheumatology",
		"http://www.zotero.org/styles/nature-clinical-practice-urology": "Nature Clinical Practice Urology",
		"http://www.zotero.org/styles/nature-digest": "Nature Digest",
		"http://www.zotero.org/styles/nature-genetics": "Nature Genetics",
		"http://www.zotero.org/styles/nature-geoscience": "Nature Geoscience",
		"http://www.zotero.org/styles/nature-immunology": "Nature Immunology",
		"http://www.zotero.org/styles/nature-materials": "Nature Materials",
		"http://www.zotero.org/styles/nature-medicine": "Nature Medicine",
		"http://www.zotero.org/styles/nature-methods": "Nature Methods",
		"http://www.zotero.org/styles/nature-nanotechnology": "Nature Nanotechnology",
		"http://www.zotero.org/styles/nature-neuroscience": "Nature Neuroscience",
		"http://www.zotero.org/styles/nature-photonics": "Nature Photonics",
		"http://www.zotero.org/styles/nature-physics": "Nature Physics",
		"http://www.zotero.org/styles/nature-protocols": "Nature Protocols",
		"http://www.zotero.org/styles/nature-research-journals": "Nature research journals",
		"http://www.zotero.org/styles/nature-reviews-cancer": "Nature Reviews Cancer",
		"http://www.zotero.org/styles/nature-reviews-drug-discovery": "Nature Reviews Drug Discovery",
		"http://www.zotero.org/styles/nature-reviews-genetics": "Nature Reviews Genetics",
		"http://www.zotero.org/styles/nature-reviews-immunology": "Nature Reviews Immunology",
		"http://www.zotero.org/styles/nature-reviews-journals": "Nature Reviews journals",
		"http://www.zotero.org/styles/nature-reviews-microbiology": "Nature Reviews Microbiology",
		"http://www.zotero.org/styles/nature-reviews-molecular-cell-biology": "Nature Reviews Molecular Cell Biology",
		"http://www.zotero.org/styles/nature-reviews-neuroscience": "Nature Reviews Neuroscience",
		"http://www.zotero.org/styles/nature-structural-and-molecular-biology": "Nature Structural and Molecular Biology",
		"http://www.zotero.org/styles/nederlands-tijdschrift-voor-geneeskunde": "Nederlands Tijdschrift Voor Geneeskunde",
		"http://www.zotero.org/styles/neonatology": "Neonatology",
		"http://www.zotero.org/styles/nephrology": "Nephrology",
		"http://www.zotero.org/styles/nephron-clinical-practice": "Nephron Clinical Practice",
		"http://www.zotero.org/styles/nephron-experimental-nephrology": "Nephron Experimental Nephrology",
		"http://www.zotero.org/styles/nephron-extra": "Nephron Extra",
		"http://www.zotero.org/styles/nephron-physiology": "Nephron Physiology",
		"http://www.zotero.org/styles/nephron": "Nephron",
		"http://www.zotero.org/styles/netherlands-journal-of-medicine": "Netherlands Journal of Medicine",
		"http://www.zotero.org/styles/neumologica-y-cirugia-de-torax-neurofibromatosis": "Neumologica y Cirugia de Torax Neurofibromatosis",
		"http://www.zotero.org/styles/neurochemistry-international": "Neurochemistry International",
		"http://www.zotero.org/styles/neurodegenerative-disease-management": "Neurodegenerative Disease Management",
		"http://www.zotero.org/styles/neurodegenerative-diseases": "Neurodegenerative Diseases",
		"http://www.zotero.org/styles/neuroendocrinology": "Neuroendocrinology",
		"http://www.zotero.org/styles/neuroepidemiology": "Neuroepidemiology",
		"http://www.zotero.org/styles/neuroimmunomodulation": "Neuroimmunomodulation",
		"http://www.zotero.org/styles/neurology-india": "Neurology India",
		"http://www.zotero.org/styles/neurology": "Neurology",
		"http://www.zotero.org/styles/neuron": "Neuron",
		"http://www.zotero.org/styles/neuropsychiatry": "Neuropsychiatry",
		"http://www.zotero.org/styles/neuropsychobiology": "Neuropsychobiology",
		"http://www.zotero.org/styles/neuropsychology": "Neuropsychology",
		"http://www.zotero.org/styles/neuroscience-and-biobehavioral-reviews": "Neuroscience & Biobehavioral Reviews",
		"http://www.zotero.org/styles/neurosignals": "Neurosignals",
		"http://www.zotero.org/styles/neurosurgical-focus": "Neurosurgical Focus",
		"http://www.zotero.org/styles/neurourology-and-urodynamics": "Neurourology and Urodynamics",
		"http://www.zotero.org/styles/new-biotechnology": "New Biotechnology",
		"http://www.zotero.org/styles/new-doctor": "New Doctor",
		"http://www.zotero.org/styles/new-iraqi-journal-of-medicine": "New Iraqi Journal of Medicine",
		"http://www.zotero.org/styles/new-zealand-dental-journal": "New Zealand Dental Journal",
		"http://www.zotero.org/styles/new-zealand-family-physician": "New Zealand Family Physician",
		"http://www.zotero.org/styles/new-zealand-journal-of-medical-laboratory-technology": "New Zealand Journal of Medical Laboratory Technology",
		"http://www.zotero.org/styles/new-zealand-journal-of-ophthalmology": "New Zealand Journal of Ophthalmology",
		"http://www.zotero.org/styles/new-zealand-medical-journal": "New Zealand Medical Journal",
		"http://www.zotero.org/styles/nigerian-medical-journal": "Nigerian Medical Journal",
		"http://www.zotero.org/styles/no-to-hattatsu": "No To Hattatsu",
		"http://www.zotero.org/styles/nordisk-medicin": "Nordisk Medicin",
		"http://www.zotero.org/styles/north-carolina-medical-journal": "North Carolina Medical Journal",
		"http://www.zotero.org/styles/nosokomiaka-chronica": "Nosokomiaka Chronica",
		"http://www.zotero.org/styles/nursing-inquiry": "Nursing Inquiry",
		"http://www.zotero.org/styles/nursing": "Nursing",
		"http://www.zotero.org/styles/nutrients": "Nutrients",
		"http://www.zotero.org/styles/obesity-facts": "Obesity Facts",
		"http://www.zotero.org/styles/obesity": "Obesity",
		"http://www.zotero.org/styles/occupational-and-environmental-medicine": "Occupational and Environmental Medicine",
		"http://www.zotero.org/styles/oncology": "Oncology",
		"http://www.zotero.org/styles/onkologie": "Onkologie",
		"http://www.zotero.org/styles/ophthalmic-research": "Ophthalmic Research",
		"http://www.zotero.org/styles/ophthalmologica": "Ophthalmologica",
		"http://www.zotero.org/styles/optical-engineering": "Optical Engineering",
		"http://www.zotero.org/styles/optical-fiber-technology": "Optical Fiber Technology",
		"http://www.zotero.org/styles/optics-communications": "Optics Communications",
		"http://www.zotero.org/styles/oral-oncology": "Oral Oncology",
		"http://www.zotero.org/styles/organic-electronics": "Organic Electronics",
		"http://www.zotero.org/styles/organic-letters": "Organic Letters",
		"http://www.zotero.org/styles/organic-process-research-and-development": "Organic Process Research & Development",
		"http://www.zotero.org/styles/organometallics": "Organometallics",
		"http://www.zotero.org/styles/orl": "Journal for Oto-Rhino-Laryngology, Head and Neck Surgery (ORL)",
		"http://www.zotero.org/styles/osteoarthritis-and-cartilage": "Osteoarthritis and Cartilage",
		"http://www.zotero.org/styles/otolaryngology-and-head-and-neck-surgery": "Otolaryngology and Head and Neck Surgery",
		"http://www.zotero.org/styles/oxford-german-studies": "Oxford German Studies",
		"http://www.zotero.org/styles/pain-management": "Pain Management",
		"http://www.zotero.org/styles/pakistan-journal-of-medical-research": "Pakistan Journal of Medical Research",
		"http://www.zotero.org/styles/pakistan-journal-of-otolaryngology": "Pakistan Journal of Otolaryngology",
		"http://www.zotero.org/styles/pancreatology": "Pancreatology",
		"http://www.zotero.org/styles/papua-new-guinea-medical-journal": "Papua New Guinea Medical Journal",
		"http://www.zotero.org/styles/pathobiology": "Pathobiology",
		"http://www.zotero.org/styles/pathogens": "Pathogens",
		"http://www.zotero.org/styles/pathology-international": "Pathology International",
		"http://www.zotero.org/styles/pathology": "Pathology",
		"http://www.zotero.org/styles/pathophysiology-of-haemostasis-and-thrombosis": "Pathophysiology of Haemostasis and Thrombosis",
		"http://www.zotero.org/styles/patient-patient-centered-outcomes-research": "Patient: Patient-Centered Outcomes Research",
		"http://www.zotero.org/styles/pediatric-critical-care-medicine": "Pediatric Critical Care Medicine",
		"http://www.zotero.org/styles/pediatric-drugs": "Pediatric Drugs",
		"http://www.zotero.org/styles/pediatric-health": "Pediatric Health",
		"http://www.zotero.org/styles/pediatric-nephrology": "Pediatric Nephrology",
		"http://www.zotero.org/styles/pediatric-neurosurgery": "Pediatric Neurosurgery",
		"http://www.zotero.org/styles/pediatrics": "Pediatrics",
		"http://www.zotero.org/styles/peptide-and-proteine-research": "Peptide and Protein Research",
		"http://www.zotero.org/styles/personalized-medicine": "Personalized Medicine",
		"http://www.zotero.org/styles/perspectives-on-politics": "Perspectives on Politics",
		"http://www.zotero.org/styles/pharmaceutical-medicine": "Pharmaceutical Medicine",
		"http://www.zotero.org/styles/pharmaceuticals": "Pharmaceuticals",
		"http://www.zotero.org/styles/pharmaceutics": "Pharmaceutics",
		"http://www.zotero.org/styles/pharmaceutisch-weekblad-scientific-edition": "Pharmaceutisch Weekblad Scientific Edition",
		"http://www.zotero.org/styles/pharmaceutisch-weekblad": "Pharmaceutisch Weekblad",
		"http://www.zotero.org/styles/pharmacogenomics": "Pharmacogenomics",
		"http://www.zotero.org/styles/pharmacognosy-magazine": "Pharmacognosy Magazine",
		"http://www.zotero.org/styles/pharmacognosy-reviews": "Pharmacognosy Reviews",
		"http://www.zotero.org/styles/pharmacological-research-communications": "Pharmacological Research Communications",
		"http://www.zotero.org/styles/pharmacology": "Pharmacology",
		"http://www.zotero.org/styles/pharmacotherapy": "Pharmacotherapy",
		"http://www.zotero.org/styles/pharmacy-management": "Pharmacy Management",
		"http://www.zotero.org/styles/philosophical-transactions-roy-soc-b": "Philosophical Transactions of the Royal Society B",
		"http://www.zotero.org/styles/phonetica": "Phonetica",
		"http://www.zotero.org/styles/photonics-and-nanostructures": "Photonics and Nanostructures---Fundamentals and Applications",
		"http://www.zotero.org/styles/physical-review-a": "Physical Review A",
		"http://www.zotero.org/styles/physical-review-b": "Physical Review B",
		"http://www.zotero.org/styles/physical-review-c": "Physical Review C",
		"http://www.zotero.org/styles/physical-review-d": "Physical Review D",
		"http://www.zotero.org/styles/physical-review-e": "Physical Review E",
		"http://www.zotero.org/styles/physical-review-letters": "Physical Review Letters",
		"http://www.zotero.org/styles/physician-and-sports-medicine": "Physician and Sports Medicine",
		"http://www.zotero.org/styles/physics-of-fluids": "Physics of Fluids",
		"http://www.zotero.org/styles/physics-of-plasmas": "Physics of Plasmas",
		"http://www.zotero.org/styles/physiological-genomics": "Physiological Genomics",
		"http://www.zotero.org/styles/phytochemistry": "Phytochemistry",
		"http://www.zotero.org/styles/phytopathology": "Phytopathology",
		"http://www.zotero.org/styles/plant-disease": "Plant Disease",
		"http://www.zotero.org/styles/plos-bio": "PLoS Biology",
		"http://www.zotero.org/styles/plos-comp-bio": "PLoS Computational Biology",
		"http://www.zotero.org/styles/plos-genetics": "PLoS Genetics",
		"http://www.zotero.org/styles/plos-medicine": "PLoS Medicine",
		"http://www.zotero.org/styles/plos-neglected-tropical-diseases": "PLoS Neglected Tropical Diseases",
		"http://www.zotero.org/styles/plos-one": "PLoS One",
		"http://www.zotero.org/styles/plos-pathogens": "PLoS Pathogens",
		"http://www.zotero.org/styles/polymers": "Polymers",
		"http://www.zotero.org/styles/portuguese-journal-of-cardiology": "Portuguese Journal of Cardiology",
		"http://www.zotero.org/styles/portuguese-studies": "Portuguese Studies",
		"http://www.zotero.org/styles/postgraduate-doctor-africa": "Postgraduate Doctor-Africa",
		"http://www.zotero.org/styles/postgraduate-doctor-asia": "Postgraduate Doctor-Asia",
		"http://www.zotero.org/styles/postgraduate-doctor-middle-east": "Postgraduate Doctor-Middle/East",
		"http://www.zotero.org/styles/postgraduate-medical-journal": "Postgraduate Medical Journal",
		"http://www.zotero.org/styles/postgraduate-medicine": "Postgraduate Medicine",
		"http://www.zotero.org/styles/powder-technology": "Powder Technology",
		"http://www.zotero.org/styles/practical-neurology": "Practical Neurology",
		"http://www.zotero.org/styles/primary-care-companion-to-the-journal-of-clinical-psychiatry": "Primary Care Companion to the Journal of Clinical Psychiatry",
		"http://www.zotero.org/styles/professional-psychology-research-and-practice": "Professional Psychology: Research and Practice",
		"http://www.zotero.org/styles/progress-in-materials-science": "Progress in Materials Science",
		"http://www.zotero.org/styles/progress-in-natural-science": "Progress in Natural Science",
		"http://www.zotero.org/styles/prostate-cancer-and-prostatic-diseases": "Prostate Cancer and Prostatic Diseases",
		"http://www.zotero.org/styles/ps-political-science-and-politics": "PS: Political Science & Politics",
		"http://www.zotero.org/styles/psychiatria-fennica": "Psychiatria Fennica",
		"http://www.zotero.org/styles/psychiatria-hungarica": "Psychiatria Hungarica",
		"http://www.zotero.org/styles/psychoanalytic-psychology": "Psychoanalytic Psychology",
		"http://www.zotero.org/styles/psychological-assessment": "Psychological Assessment",
		"http://www.zotero.org/styles/psychological-bulletin": "Psychological Bulletin",
		"http://www.zotero.org/styles/psychological-methods": "Psychological Methods",
		"http://www.zotero.org/styles/psychological-review": "Psychological Review",
		"http://www.zotero.org/styles/psychological-services": "Psychological Services",
		"http://www.zotero.org/styles/psychological-trauma-theory-research-practice-and-policy": "Psychological Trauma: Theory, Research, Practice, and Policy",
		"http://www.zotero.org/styles/psychology-and-aging": "Psychology and Aging",
		"http://www.zotero.org/styles/psychology-and-psychotherapy-theory-research-and-practice": "Psychology and Psychotherapy: Theory, Research and Practice",
		"http://www.zotero.org/styles/psychology-of-addictive-behaviors": "Psychology of Addictive Behaviors",
		"http://www.zotero.org/styles/psychology-of-aesthetics-creativity-and-the-arts": "Psychology of Aesthetics, Creativity and the Arts",
		"http://www.zotero.org/styles/psychology-of-men-and-masculinity": "Psychology of Men and Masculinity",
		"http://www.zotero.org/styles/psychology-of-religion-and-spirituality": "Psychology of Religion and Spirituality",
		"http://www.zotero.org/styles/psychology-public-policy-and-law": "Psychology, Public Policy, and Law",
		"http://www.zotero.org/styles/psychopathology": "Psychopathology",
		"http://www.zotero.org/styles/psychotherapy-and-psychosomatics": "Psychotherapy and Psychosomatics",
		"http://www.zotero.org/styles/psychotherapy-theory-research-practice-training": "Psychotherapy: Theory, Research, Practice, Training",
		"http://www.zotero.org/styles/public-health-genomics": "Public Health Genomics",
		"http://www.zotero.org/styles/public-health": "Public Health",
		"http://www.zotero.org/styles/puerto-rico-health-sciences-journal": "Puerto Rico Health Sciences Journal",
		"http://www.zotero.org/styles/quality-safety-in-health-care": "Quality & Safety in Health Care",
		"http://www.zotero.org/styles/quarterly-journal-of-medicine": "Quarterly Journal of Medicine",
		"http://www.zotero.org/styles/quimica-clinica": "Quimica Clinica",
		"http://www.zotero.org/styles/radiology": "Radiology",
		"http://www.zotero.org/styles/regenerative-medicine": "Regenerative Medicine",
		"http://www.zotero.org/styles/rehabilitation-psychology": "Rehabilitation Psychology",
		"http://www.zotero.org/styles/religions": "Religions",
		"http://www.zotero.org/styles/remote-sensing": "Remote Sensing",
		"http://www.zotero.org/styles/renal-physiology": "Renal Physiology",
		"http://www.zotero.org/styles/respiration": "Respiration",
		"http://www.zotero.org/styles/resumed": "Resumed",
		"http://www.zotero.org/styles/review-of-educational-research": "Review of Educational Research",
		"http://www.zotero.org/styles/review-of-general-psychology": "Review of General Psychology",
		"http://www.zotero.org/styles/review-of-research-in-education": "Review of Research in Education",
		"http://www.zotero.org/styles/review-of-scientific-instruments": "Review of Scientific Instruments",
		"http://www.zotero.org/styles/revista-argentina-de-cirugia": "Revista Argentina de Cirugia",
		"http://www.zotero.org/styles/revista-brasileira-de-reumatologia": "Revista Brasileira de Reumatologia (Brazilian Journal of Rheumatology)",
		"http://www.zotero.org/styles/revista-chilena-de-pediatria": "Revista Chilena de Pediatria",
		"http://www.zotero.org/styles/revista-clinica-espanola": "Revista Clinica Espanola",
		"http://www.zotero.org/styles/revista-colombiana-de-ciencias-pecuarias": "Revista Colombiana de Ciencias Pecuarias",
		"http://www.zotero.org/styles/revista-cubana-de-alimentacion-y-nutiricion": "Revista Cubana de Alimentacion y Nutiricion",
		"http://www.zotero.org/styles/revista-cubana-de-cardiologia-y-cirugia-cardiovascular": "Revista Cubana de Cardiologia y Cirugia Cardiovascular",
		"http://www.zotero.org/styles/revista-cubana-de-cirugia": "Revista Cubana de Cirugia",
		"http://www.zotero.org/styles/revista-cubana-de-endocrinologia": "Revista Cubana de Endocrinologia",
		"http://www.zotero.org/styles/revista-cubana-de-enfermeria": "Revista Cubana de Enfermeria",
		"http://www.zotero.org/styles/revista-cubana-de-estomatologia": "Revista Cubana de Estomatologia",
		"http://www.zotero.org/styles/revista-cubana-de-farmacia": "Revista Cubana de Farmacia",
		"http://www.zotero.org/styles/revista-cubana-de-hematologia-immunologia-y-hemoterapia": "Revista Cubana de Hematologia, Immunologia y Hemoterapia",
		"http://www.zotero.org/styles/revista-cubana-de-higiene-y-epidemiologia": "Revista Cubana de Higiene y Epidemiologia",
		"http://www.zotero.org/styles/revista-cubana-de-investigaciones-biomedicas": "Revista Cubana de Investigaciones Biomedicas",
		"http://www.zotero.org/styles/revista-cubana-de-medicina-general-integral": "Revista Cubana de Medicina General Integral",
		"http://www.zotero.org/styles/revista-cubana-de-medicina-militar": "Revista Cubana de Medicina Militar",
		"http://www.zotero.org/styles/revista-cubana-de-medicina-tropical": "Revista Cubana de Medicina Tropical",
		"http://www.zotero.org/styles/revista-cubana-de-medicina": "Revista Cubana de Medicina",
		"http://www.zotero.org/styles/revista-cubana-de-obstetricia-y-ginecologia": "Revista Cubana de Obstetricia y Ginecologia",
		"http://www.zotero.org/styles/revista-cubana-de-oftalmologia": "Revista Cubana de Oftalmologia",
		"http://www.zotero.org/styles/revista-cubana-de-oncologia": "Revista Cubana de Oncologia",
		"http://www.zotero.org/styles/revista-cubana-de-ortodonica": "Revista Cubana de Ortodonica",
		"http://www.zotero.org/styles/revista-cubana-de-ortopedia-y-traumatologia": "Revista Cubana de Ortopedia y Traumatologia",
		"http://www.zotero.org/styles/revista-cubana-de-pediatria": "Revista Cubana de Pediatria",
		"http://www.zotero.org/styles/revista-cubana-di-salud-publica": "Revista Cubana Di Salud Publica",
		"http://www.zotero.org/styles/revista-de-diagnostico-biologico": "Revista de Diagnostico Biologico",
		"http://www.zotero.org/styles/revista-de-gastoenterologia-de-mexico": "Revista de Gastoenterologia de Mexico",
		"http://www.zotero.org/styles/revista-de-investigacion-clinica": "Revista de Investigacion Clinica",
		"http://www.zotero.org/styles/revista-de-la-sociedad-espanola-de-quimica-clinica": "Revista de La Sociedad Espanola de Quimica Clinica",
		"http://www.zotero.org/styles/revista-de-sanidad-e-higiene-publica": "Revista de Sanidad E Higiene Publica",
		"http://www.zotero.org/styles/revista-del-instituto-nacional-de-enfermedades-respiratorias": "Revista del Instituto Nacional de Enfermedades Respiratorias",
		"http://www.zotero.org/styles/revista-espanola-de-anestesiologia-y-reanimacion": "Revista Espanola de Anestesiologia y Reanimacion",
		"http://www.zotero.org/styles/revista-espanola-de-reumatologia": "Revista Espanola de Reumatologia",
		"http://www.zotero.org/styles/revista-ginecologia-y-obstetricia": "Revista Ginecolog\u00c3\u00ada y Obstetricia (Universidad Cat\u00c3\u00b3lica de Santiago de Guayaquil)",
		"http://www.zotero.org/styles/revista-iberoamericana-de-trombosis-y-hemostasia": "Revista Iberoamericana de Trombosis y Hemostasia",
		"http://www.zotero.org/styles/revista-medica-de-cardiologia": "Revista Medica de Cardiologia",
		"http://www.zotero.org/styles/revista-medica-de-chile": "Revista Medica de Chile",
		"http://www.zotero.org/styles/revista-medica-del-instituto-mexicano-del-seguro-social": "Revista Medica del Instituto Mexicano del Seguro Social",
		"http://www.zotero.org/styles/revista-mexicana-de-anestesiologia": "Revista Mexicana de Anestesiologia",
		"http://www.zotero.org/styles/revista-mexicana-de-radiologia": "Revista Mexicana de Radiologia",
		"http://www.zotero.org/styles/revista-portuguesa-de-cardiologia": "Revista Portuguesa de Cardiologia",
		"http://www.zotero.org/styles/revue-des-maladies-respiratoires": "Revue des maladies respiratoires",
		"http://www.zotero.org/styles/rheumatology": "Rheumatology",
		"http://www.zotero.org/styles/rna": "RNA",
		"http://www.zotero.org/styles/salud-colectiva": "Salud Colectiva",
		"http://www.zotero.org/styles/salud-publica-de-mexico": "Salud Publica de Mexico",
		"http://www.zotero.org/styles/saudi-medical-journal": "Saudi Medical Journal",
		"http://www.zotero.org/styles/scandinavian-journal-of-clinical-research": "Scandinavian Journal of Clinical Research",
		"http://www.zotero.org/styles/scandinavian-journal-of-dental-research": "Scandinavian Journal of Dental Research",
		"http://www.zotero.org/styles/scandinavian-journal-of-haematology": "Scandinavian Journal of Haematology",
		"http://www.zotero.org/styles/scandinavian-journal-of-respiratory-diseases": "Scandinavian Journal of Respiratory Diseases",
		"http://www.zotero.org/styles/scandinavian-journal-of-social-medicine": "Scandinavian Journal of Social Medicine",
		"http://www.zotero.org/styles/school-psychology-quarterly": "School Psychology Quarterly",
		"http://www.zotero.org/styles/schumpert-medical-quarterly": "Schumpert Medical Quarterly",
		"http://www.zotero.org/styles/schweizerische-zeitschrift-fur-ganzheitsmedizin": "Schweizerische Zeitschrift f\u00c3\u00bcr Ganzheitsmedizin / Swiss Journal of Integrative Medicine",
		"http://www.zotero.org/styles/scibx-science-business-exchange": "SciBX: Science-Business eXchange",
		"http://www.zotero.org/styles/scripta-materialia": "Scripta Materialia",
		"http://www.zotero.org/styles/sensors-and-actuators-b": "Sensors & Actuators B",
		"http://www.zotero.org/styles/sensors": "Sensors",
		"http://www.zotero.org/styles/sexually-transmitted-diseases": "Sexually Transmitted Diseases",
		"http://www.zotero.org/styles/sexually-transmitted-infections": "Sexually Transmitted Infections",
		"http://www.zotero.org/styles/shinkei-byorigaku-neuropathology": "Shinkei Byorigaku Neuropathology",
		"http://www.zotero.org/styles/skin-pharmacology-and-physiology": "Skin Pharmacology and Physiology",
		"http://www.zotero.org/styles/skin-pharmacology": "Skin Pharmacology",
		"http://www.zotero.org/styles/slavonic-and-east-european-review": "Slavonic and East European Review",
		"http://www.zotero.org/styles/social-psychiatry-and-psychiatric-epidemiology": "Social Psychiatry and Psychiatric Epidemiology",
		"http://www.zotero.org/styles/social-psychology-quarterly": "Social Psychology Quarterly",
		"http://www.zotero.org/styles/social-sciences": "Social Sciences",
		"http://www.zotero.org/styles/societies": "Societies",
		"http://www.zotero.org/styles/sociological-methodology": "Sociological Methodology",
		"http://www.zotero.org/styles/sociological-theory": "Sociological Theory",
		"http://www.zotero.org/styles/sociology-of-education": "Sociology of Education",
		"http://www.zotero.org/styles/soil-biology-biochemistry": "Soil Biology & Biochemistry",
		"http://www.zotero.org/styles/solid-state-electronics": "Solid-State Electronics",
		"http://www.zotero.org/styles/south-african-medical-journal": "South African Medical Journal",
		"http://www.zotero.org/styles/southern-medical-journal": "Southern Medical Journal",
		"http://www.zotero.org/styles/special-care-dentistry": "Special Care Dentistry",
		"http://www.zotero.org/styles/special-care-in-dentistry": "Special Care in Dentistry",
		"http://www.zotero.org/styles/speech-communication": "Speech Communication",
		"http://www.zotero.org/styles/spinal-cord": "Spinal Cord",
		"http://www.zotero.org/styles/sports-medicine": "Sports Medicine",
		"http://www.zotero.org/styles/springfield-clinic": "Springfield Clinic",
		"http://www.zotero.org/styles/sri-lankan-family-physician": "Sri Lankan Family Physician",
		"http://www.zotero.org/styles/stereotactic-and-functional-neurosurgery": "Stereotactic and Functional Neurosurgery",
		"http://www.zotero.org/styles/structure": "Structure",
		"http://www.zotero.org/styles/superlattices-and-microstructures": "Superlattices and Microstructures",
		"http://www.zotero.org/styles/surgery": "Surgery",
		"http://www.zotero.org/styles/sustainability": "Sustainability",
		"http://www.zotero.org/styles/swedish-medical-journal": "Swedish Medical Journal",
		"http://www.zotero.org/styles/swiss-medical-weekly": "Swiss Medical Weekly",
		"http://www.zotero.org/styles/symmetry": "Symmetry",
		"http://www.zotero.org/styles/synthetic-metals": "Synthetic Metals",
		"http://www.zotero.org/styles/taylor-and-francis-harvard-v": "Taylor & Francis - Harvard V",
		"http://www.zotero.org/styles/teaching-sociology": "Teaching Sociology",
		"http://www.zotero.org/styles/technovation": "Technovation",
		"http://www.zotero.org/styles/tectonophysics": "Tectonophysics",
		"http://www.zotero.org/styles/theoretical-medicine": "Theoretical Medicine",
		"http://www.zotero.org/styles/therapeutic-delivery": "Therapeutic Delivery",
		"http://www.zotero.org/styles/thin-solid-films": "Thin Solid Films",
		"http://www.zotero.org/styles/thorax": "Thorax",
		"http://www.zotero.org/styles/thrombosis-and-haemostasis": "Thrombosis and Haemostasis",
		"http://www.zotero.org/styles/tidsskrift-for-den-norske-laegeforening": "Tidsskrift For Den Norske Laegeforening",
		"http://www.zotero.org/styles/tijdschrift-voor-nucleaire-geneeskunde": "Tijdschrift voor Nucleaire Geneeskunde",
		"http://www.zotero.org/styles/tobacco-control": "Tobacco Control",
		"http://www.zotero.org/styles/toxins": "Toxins",
		"http://www.zotero.org/styles/training-and-education-in-professional-psychology": "Training and Education in Professional Psychology",
		"http://www.zotero.org/styles/transfusion-medicine-and-hemotherapy": "Transfusion Medicine and Hemotherapy",
		"http://www.zotero.org/styles/transfusion": "Transfusion",
		"http://www.zotero.org/styles/trends-biochemical-sciences": "Trends in Biochemical Sciences",
		"http://www.zotero.org/styles/trends-biotechnology": "Trends in Biotechnology",
		"http://www.zotero.org/styles/trends-cell-biology": "Trends in Cell Biology",
		"http://www.zotero.org/styles/trends-cognitive-sciences": "Trends in Cognitive Sciences",
		"http://www.zotero.org/styles/trends-ecology-and-evolution": "Trends in Ecology and Evolution",
		"http://www.zotero.org/styles/trends-endocrinology-and-metabolism": "Trends in Endocrinology and Metabolism",
		"http://www.zotero.org/styles/trends-genetics": "Trends in Genetics",
		"http://www.zotero.org/styles/trends-immunology": "Trends in Immunology",
		"http://www.zotero.org/styles/trends-microbiology": "Trends in Microbiology",
		"http://www.zotero.org/styles/trends-molecular-medicine": "Trends in Molecular Medicine",
		"http://www.zotero.org/styles/trends-neurosciences": "Trends in Neurosciences",
		"http://www.zotero.org/styles/trends-parasitology": "Trends in Parasitology",
		"http://www.zotero.org/styles/trends-pharmacological-sciences": "Trends in Pharmacological Sciences",
		"http://www.zotero.org/styles/trends-plant-science": "Trends in Plant Science",
		"http://www.zotero.org/styles/tropical-doctor": "Tropical Doctor",
		"http://www.zotero.org/styles/tropical-gastroenterology": "Tropical Gastroenterology",
		"http://www.zotero.org/styles/tumor-biology": "Tumor Biology",
		"http://www.zotero.org/styles/turabian-author-date": "Turabian Style (author-date)",
		"http://www.zotero.org/styles/turkish-journal-of-trauma-and-emergency-surgery": "Turkish Journal of Trauma & Emergency Surgery",
		"http://www.zotero.org/styles/ugeskrift-for-laeger": "Ugeskrift For L\u00c3\u00a6ger",
		"http://www.zotero.org/styles/ukrainian-medical-journal": "Ukrainian Medical Journal",
		"http://www.zotero.org/styles/ulster-medical-journal": "Ulster Medical Journal",
		"http://www.zotero.org/styles/undersea-biomedical-research": "Undersea Biomedical Research",
		"http://www.zotero.org/styles/urologia-internationalis": "Urologia Internationalis",
		"http://www.zotero.org/styles/vascular-medicine": "Vascular Medicine",
		"http://www.zotero.org/styles/verhaltenstherapie": "Verhaltenstherapie",
		"http://www.zotero.org/styles/veterinary-radiology": "Veterinary Radiology",
		"http://www.zotero.org/styles/veterinary-record": "Veterinary Record",
		"http://www.zotero.org/styles/virus-research": "Virus Research",
		"http://www.zotero.org/styles/viruses": "Viruses",
		"http://www.zotero.org/styles/viszeralmedizin": "Viszeralmedizin",
		"http://www.zotero.org/styles/vital": "Vital",
		"http://www.zotero.org/styles/vox-sanguinis": "Vox Sanguinis",
		"http://www.zotero.org/styles/water": "Water",
		"http://www.zotero.org/styles/weather-and-forecasting": "Weather and Forecasting",
		"http://www.zotero.org/styles/weather-climate-and-society": "Weather, Climate, and Society",
		"http://www.zotero.org/styles/west-virginia-medical-journal": "West Virginia Medical Journal",
		"http://www.zotero.org/styles/western-journal-of-medicine": "Western Journal of Medicine",
		"http://www.zotero.org/styles/who-chronicle": "WHO Chronicle",
		"http://www.zotero.org/styles/who-monog-service": "WHO Monog Service",
		"http://www.zotero.org/styles/who-tech-rep-service": "WHO Tech Rep Service",
		"http://www.zotero.org/styles/womens-health": "Women's Health",
		"http://www.zotero.org/styles/world-health-organization-journals": "World Health Organization Journals",
		"http://www.zotero.org/styles/world-health-statistics-quarterly": "World Health Statistics Quarterly",
		"http://www.zotero.org/styles/world-medical-journal": "World Medical Journal",
		"http://www.zotero.org/styles/yakuzai-ekigaku": "Yakuzai Ekigaku",
		"http://www.zotero.org/styles/yale-journal-of-biology-and-medicine": "Yale Journal of Biology and Medicine",
		"http://www.zotero.org/styles/yearbook-of-english-studies": "Yearbook of English Studies",
		"http://www.zotero.org/styles/zagazig-university-medical-journal": "Zagazig University Medical Journal",
		"http://www.zotero.org/styles/zdravniski-vestnik": "Zdravni\u00c5\u00a1ki Vestnik (Zdrav Vestn) Journal of Slovene Medical Association"
	}
};
var assertEqual = function (actual, expected, place) {
	if (actual !== expected) {
		throw Error("assert fail: " + place + "\n" +
			actual + " !== " + expected);
	}
};

var assert = function (assertion, place) {
	if (!assertion) {
		throw Error("assert fail: " + place);
	}
};

"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.diff = {
	dmp : new diff_match_patch(),

	/**
	 * Modified version of the diff-match-patch function which
	 * doesn't escape the original HTML tags
	 * (There's a risk now of mangling the tags, but it's a risk I'm willing to take)
	 *  
	 * Convert a diff array into a pretty HTML report.
	 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
	 * @return {string} HTML representation.
	 */
	prettyHtml : function(diffs) {
	  var html = [];
	  var pattern_amp = /&/g;
	  var pattern_lt = /</g;
	  var pattern_gt = />/g;
	  var pattern_para = /\n/g;
	  var x = 0;

	  for (x = 0; x < diffs.length; x++) {
		var op = diffs[x][0];    // Operation (insert, delete, equal)
		var data = diffs[x][1];  // Text of change.
		var text = data;//.replace(pattern_amp, '&amp;').replace(pattern_lt, '&lt;').replace(pattern_gt, '&gt;').replace(pattern_para, '&para;<br>');
		switch (op) {
		  case DIFF_INSERT:
			html[x] = '<ins style="background:#e6ffe6;">' + text + '</ins>';
			break;
		  case DIFF_DELETE:
			html[x] = '<del style="background:#ffe6e6;">' + text + '</del>';
			break;
		  case DIFF_EQUAL:
			html[x] = '<span>' + text + '</span>';
			break;
		}
	  }
	  return html.join('');
	},

	prettyHtmlDiff : function (oldString, newString) {
		var diffs = this.dmp.diff_main(oldString, newString);
		this.dmp.diff_cleanupSemantic(diffs);
		return this.prettyHtml(diffs);
	},

	customEditDistance : function (oldString, newString) {
		var diffs = this.dmp.diff_main(oldString, newString);
		return this.weightedLevenshtein(diffs);
	},

	/**
	 * Like levenshtein but gives much more weight to deletions.
	 * 
	 * Generally when searching you want everything you've typed to appear
	 * in the results.
	 */
	weightedLevenshtein : function (diffs) {
	  var levenshtein = 0;
	  var insertions = 0;
	  var deletions = 0;

	  var deletionWeight = 20;

	  for (var x = 0; x < diffs.length; x++) {
		var op = diffs[x][0];
		var data = diffs[x][1];
		switch (op) {
		  case DIFF_INSERT:
			insertions += data.length;
			break;
		  case DIFF_DELETE:
			deletions += data.length;
			break;
		  case DIFF_EQUAL:
			// A deletion and an insertion is one substitution.
			levenshtein += Math.max(insertions, deletions*deletionWeight);
			insertions = 0;
			deletions = 0;
			break;
		}
	  }
	  levenshtein += Math.max(insertions, deletions*deletionWeight);
	  return levenshtein;
	}
};
"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.cslParser = (function() {
	// Private functions:
	var jsonNodeFromXml = function (node, nodeIndex) {
		var children = [],
			index,
			jsonData,
			childNode,
			textValue,
			TEXT_NODE,
			thisNodeIndex = nodeIndex.index;

		TEXT_NODE = 3;
		
		for (index = 0; index < node.childNodes.length; index++) {
			childNode = node.childNodes[index];

			if (childNode.localName !== null) {
				nodeIndex.index++;
				children.push(jsonNodeFromXml(node.childNodes[index], nodeIndex));
			} else {
				if (childNode.nodeType === TEXT_NODE && typeof childNode.data !== "undefined" && 
						childNode.data.trim() != "") {
					textValue = childNode.data;
				}
			}
		}

		assert(typeof textValue === "undefined" || children.length === 0, "textValue = " + textValue + " children.length = " + children.length);

		var attributesString = "";
		var attributesStringList = [];
		var attributesList = [];
		var thisNodeData;
		
		if (node.attributes !== null && node.attributes.length > 0) {
			for (index = 0; index < node.attributes.length; index++) {
				attributesList.push(
					{
						key : node.attributes.item(index).localName,
						value : node.attributes.item(index).nodeValue,
						enabled : true
					});
				attributesStringList.push(
					node.attributes.item(index).localName + '="' +
					node.attributes.item(index).nodeValue + '"');
			}
			attributesString = ": " + attributesStringList.join(", ");
		}

		thisNodeData = {
				name : node.localName,
				attributes : attributesList,
				cslId : thisNodeIndex,
				children : children
			};

		if (typeof textValue !== "undefined") {
			// trim whitespace from start and end
			thisNodeData.textValue = textValue.replace(/^\s+|\s+$/g,"");
		}

		return thisNodeData;
	};

	var htmlEscape = function (text) {
		var escaped = text;

		escaped = escaped.replace("<", "&lt;");
		escaped = escaped.replace(">", "&gt;");
		escaped = escaped.replace("&", "&amp;");
		escaped = escaped.replace('"', "&quot;");

		return escaped;
	};

	var generateIndent = function (indentAmount) {
		var index,
			result = "";
		for (index = 0; index < indentAmount; index++) {
			result += "\t";
		}
		return result;
	};

	var xmlNodeFromJson = function (jsonData, indent) {
		var attributesString = "",
			xmlString,
			index;

		if (jsonData.attributes.length > 0) {
		  	for (index = 0; index < jsonData.attributes.length; index++) {
				if (jsonData.attributes[index].enabled && jsonData.attributes[index].value !== "") {
					// TODO: the key probably shouldn't have characters needing escaping anyway,
					//       should not allow to input them in the first place
					attributesString += " " + 
						htmlEscape(jsonData.attributes[index].key) + '="' + 
						htmlEscape(jsonData.attributes[index].value) + '"';
				}
			}
		}
		xmlString = generateIndent(indent) + "<" + jsonData.name + attributesString + ">\n";

		if (typeof jsonData.children !== "undefined" && jsonData.children.length > 0) {
			for (index = 0; index < jsonData.children.length; index++) {
				xmlString += xmlNodeFromJson(jsonData.children[index], indent + 1);
			}
		} else if (typeof jsonData.textValue !== "undefined") {
			xmlString += generateIndent(indent+1) + htmlEscape(jsonData.textValue) + "\n";
		}

		xmlString += generateIndent(indent) + "</" + htmlEscape(jsonData.name) + ">\n";

		return xmlString;
	};
	
	var updateCslIds = function (jsonData, cslId) {
		var childIndex;

		jsonData.metadata["cslId"] = cslId.index;
		cslId.index++;
		if (jsonData.children) {
			for (childIndex = 0; childIndex < jsonData.children.length; childIndex++)
			{
				updateCslIds(jsonData.children[childIndex], cslId);
			}
		}
	};

	// public:
	return {
		isCslValid : function(xmlData) {
			var parser = new DOMParser();
			var xmlDoc = parser.parseFromString(xmlData, "application/xml");

			var styleNode = xmlDoc.childNodes[0];
			return styleNode.localName === "style";
		},

		// nodeIndex.index is the depth-first traversal position of CSL node
		// it must start at 0, and it will be returned with nodeIndex.index = number of nodes - 1
		cslDataFromCslCode : function (xmlData) {
			var parser = new DOMParser(),
				xmlDoc = parser.parseFromString(xmlData, "application/xml"),
				errors;
			errors = xmlDoc.getElementsByTagName( 'parsererror' );
			assertEqual(errors.length, 0, "xml parser error");

			var styleNode = xmlDoc.childNodes[0];
			assertEqual(styleNode.localName, "style", "Invalid style - no style node");

			var jsonData = jsonNodeFromXml(styleNode, { index: 0 } );
		
			return jsonData;
		},

		cslCodeFromCslData : function (jsonData) {
			var cslXml = '<?xml version="1.0" encoding="utf-8"?>\n';
			cslXml += xmlNodeFromJson(jsonData, 0);
			return cslXml;
		},

		updateCslIds : updateCslIds
	};
}());
var CSLEDIT = CSLEDIT || {};

/* Uses localStorage to store current csl data object
 *
 * Supports the following actions:
 * - New style
 * - Load from CSL XML
 * - Add node
 * - Delete node
 * - Amend node
 */

CSLEDIT.Data = function (CSL_DATA) {
	var viewControllers = [],
		callbacksEnabled = true;

	var get = function () {
		return JSON.parse(localStorage.getItem(CSL_DATA));
	};
	var set = function (cslData) {
		localStorage.setItem(CSL_DATA, JSON.stringify(cslData));
		return cslData;
	};
	var setCslCode = function (cslCode) {
		return set(CSLEDIT.cslParser.cslDataFromCslCode(cslCode));
		if (callbacksEnabled) {
			emit("createTree", []);
		}
	};
	var getCslCode = function () {
		return CSLEDIT.cslParser.cslCodeFromCslData(get());
	};

	var spliceNode = function (id, position, nodesToDelete, newNode) {
		var iter,
			cslData,
			index,
			node,
			nodesBefore;

		cslData = get();

		nodesBefore = numNodes(cslData);

		// Find the id of the node to add
		iter = new CSLEDIT.Iterator(cslData);

		index = 0;
		while (iter.hasNext()) {
			node = iter.next();
			
			if (index === id) {
				assertEqual(node.cslId, index);
				assert(position + nodesToDelete <= node.children.length);

				if (typeof newNode === "undefined") {
					node.children.splice(position, nodesToDelete);
				} else {
					node.children.splice(position, nodesToDelete, newNode);
				}
			}
			index++;
		}

		// correct the cslId numbering
		iter = new CSLEDIT.Iterator(cslData);
		index = 0;
		while (iter.hasNext()) {
			node = iter.next();
			node.cslId = index;
			index++;
		}

		set(cslData);

		return index - nodesBefore; // difference in number of nodes
	};

	var getNodeAndParent = function (id) {
		var iter = new CSLEDIT.Iterator(get()),
			node;

		while (iter.hasNext()) {
			node = iter.next();

			if (node.cslId === id) {
				return {
					node : node,
					parent : iter.parent()
				}
			}
		}

		// not found
		return { node : null, parent : null };
	};

	var getNodeStack = function (id) {
		var iter = new CSLEDIT.Iterator(get()),
			nodeStack;

		while (iter.hasNext()) {
			node = iter.next();

			if (node.cslId === id) {
				return iter.stack();
			}
		}
	};

	var getNode = function (id, cslData /* optional */) {
		if (typeof cslData !== "undefined") {
			return getNodeAndParent(id, cslData).node;
		} else {
			return getNodeAndParent(id).node;
		}
	};

	// Returns all matching nodes or
	// null if it couldn't find a match
	var getNodesFromPath = function (path, cslData /* optional */) {
		var splitPath = path.split("/"),
			rootNode,
			result = [];

		if (typeof cslData === "undefined") {
			cslData = get();
		}

		rootNode = splitPath.splice(0,1);

		if (rootNode[0] === "") {
			return result;
		}

		getNodesFromPath_inner(splitPath, cslData, result);
		return result;
	};

	var getNodesFromPath_inner = function (path, nodeData, result) {
		var index,
			rootNode,
			regExp;

		if (path.length === 0) {
			result.push(nodeData);
			return;
		}

		rootNode = path.splice(0, 1);
		assertEqual(rootNode.length, 1);

		// convert '*' wildcard to regexp equivalent
		regExp = new RegExp("^" + rootNode[0].replace("*", ".*") + "$");

		for (index = 0; index < nodeData.children.length; index++) {
			if (regExp.test(nodeData.children[index].name)) {
				getNodesFromPath_inner(path, nodeData.children[index], result);
			}
		}
	};

	var getFirstCslId = function (cslData, nodeName) {
		var index,
			result;

		if (cslData.name === nodeName) {
			return cslData.cslId;
		} else {
			for (index = 0; index < cslData.children.length; index++) {
				result = getFirstCslId(cslData.children[index], nodeName);
				if (result > -1) {
					return result;
				}
			}
		}
		// couldn't find it
		return -1;
	};
	
	// Load new style without reloading page
	var loadStyleFromURL = function (newURL, callback) {
		styleURL = newURL;
		$.get(styleURL, {}, function(cslCode) {
			cslCode = cslCode.replace(/<!--.*?-->/g, "");
			setCslCode(cslCode);
			if (typeof callback !== "undefined") {
				callback();
			}
		});
	};

	// from https://gist.github.com/1771618
	var getUrlVar = function (key) {
		var result = new RegExp(key + "=([^&]*)", "i").exec(window.location.search); 
		return result && unescape(result[1]) || "";
	};

	var numNodes = function (tree) {
		var iter = new CSLEDIT.Iterator(tree),
			index = 0;

		while (iter.hasNext()) {
			iter.next();
			index++;
		}

		return index;
	};

	var emit = function (event, args) {
		$.each(viewControllers, function(index, controller) {
			controller.exec(event, args);
		});
	};
	
	var indexOfChild = function (childNode, parentNode) {
		var index;
		for (index = 0; index < parentNode.children.length; index++) {
			if (childNode.cslId === parentNode.children[index].cslId) {
				return index;
			}
		}
		return -1;
	};
	
	var getAttrByName = function (attributes, name) {
		var index;
		for (index = 0; index < attributes.length; index++) {
			if (attributes[index].key === name) {
				return attributes[index];
			}
		}
		return null;
	};

	// if 'id' is a macro instance, returns the corresponding macro definition
	// if not, returns 'id' 
	var macroDefinitionIdFromInstanceId = function (id) {
		var node = new CSLEDIT.CslNode(getNode(id)),
			macroName,
			macroNodes,
			macroNode;

		macroName = node.getAttr("macro");
		if (node.name === "text" && macroName !== "") {
			macroNodes = getNodesFromPath("style/macro");

			$.each(macroNodes, function (i, macroNode) {
				var thisMacroNode = new CSLEDIT.CslNode(macroNode);
				if (thisMacroNode.getAttr("name") === macroName) {
					id = thisMacroNode.cslId;
					return false;
				}
			});
		}
		return id;
	}

	var addNode = function (id, position, newNode) {
		var nodeInfo,
			positionIndex,
			nodesAdded;
		
		newNode.cslId = -1;
		newNode.children = newNode.children || [];
		newNode.attributes = newNode.attributes || [];

		if (typeof position === "number") {
			// change parent id from macro instances to macro definitions
			id = macroDefinitionIdFromInstanceId(id);

			nodesAdded = spliceNode(id, position, 0, newNode);
			emit("addNode", [id, position, newNode, nodesAdded]);
		} else {
			switch (position) {
				case "first":
					// change parent id from macro instances to macro definitions
					id = macroDefinitionIdFromInstanceId(id);

					return addNode(id, 0, newNode);
					break;
				case "inside":
				case "last":
					// change parent id from macro instances to macro definitions
					id = macroDefinitionIdFromInstanceId(id);
					
					return addNode(id, getNode(id).children.length, newNode);
					break;
				case "before":
				case "after":
					assert(id !== 0);
					nodeInfo = getNodeAndParent(id);
					positionIndex = indexOfChild(nodeInfo.node, nodeInfo.parent);
					if (position === "after") {
						positionIndex++;
					}
					return addNode(nodeInfo.parent.cslId, positionIndex, newNode);
					break;
				case "default":
					assert(false, "position: " + position + " not recognised");
			}
		}
	};

	var deleteNode = function (id) {
		var iter = new CSLEDIT.Iterator(get()),
			index,
			node,
			parentNode,
			nodesDeleted;

		assert(id !== 0); // can't delete the style node

		index = 0;
		while (iter.hasNext()) {
			node = iter.next();

			if (index === id) {
				parentNode = iter.parent();
				break;
			}
			index++;
		}

		assert(typeof parentNode !== "undefined");
		nodesDeleted = -spliceNode(parentNode.cslId, indexOfChild(node, parentNode), 1);
		assertEqual(node.cslId, id);
		
		emit("deleteNode", [id, nodesDeleted]);
		
		return node;
	};

	return {
		setCslCode : setCslCode,
		getCslCode : getCslCode,
		get : get,
		addNode : function (id, position, newNode) {
			addNode(id, position, newNode);
			emit("formatCitations");
		},
		deleteNode : function (id) {
			deleteNode(id);
			emit("formatCitations");
		},

		amendNode : function (id, amendedNode) {
			// replace everything of the original node except the children and the cslId
			var cslData = get(),
				iter,
				node,
				index;
		   
			iter = new CSLEDIT.Iterator(cslData);
			index = 0;

			while (iter.hasNext()) {
				node = iter.next();
				if (index === id) {
					assertEqual(node.cslId, id);

					node.name = amendedNode.name;
					node.attributes = amendedNode.attributes;
					node.textValue = amendedNode.textValue;

					break;
				}
				index++;
			}
			assert(typeof node !== "undefined");
			set(cslData);
			emit("amendNode", [id, node]);
			emit("formatCitations");
		},
		moveNode : function (fromId, toId, position) {
			var deletedNode, fromNode;
			callbacksEnabled = false;

			deletedNode = deleteNode(fromId);

			console.log("deletedNode = " + deletedNode.cslId);
			if (toId > fromId) {
				toId -= numNodes(deletedNode);
			}

			addNode(toId, position, deletedNode);
			callbacksEnabled = true;

			emit("formatCitations");
		},
		getNode : getNode,
		getNodeAndParent : getNodeAndParent,
		getNodeStack : getNodeStack,
		getFirstCslId : getFirstCslId,

		loadStyleFromURL : loadStyleFromURL,

		initPageStyle : function (callback) {
			var cslData;
			cslData = get(); 
			/*
			if (cslData !== null && cslData !== "" && !CSLEDIT.parser.isCslValid(cslCode)) {
				alert("Warning: couldn't recover CSL from previous session");
				cslCode = "";
				CSLEDIT.code.set(cslCode);
			}*/
			styleURL = getUrlVar("styleURL");
			console.log("url from url: " + styleURL);

			if (styleURL != "" && typeof styleURL !== 'undefined') {
				styleURL = "../getFromOtherWebsite.php?url=" + encodeURIComponent(styleURL);
				loadStyleFromURL(styleURL, function () {
					// reload page without the styleURL query string, to avoid the user
					// refreshing the page triggering a re-load of the style
					window.location.href = window.location.href.replace(/\?.*$/, "");
				});
			} else if (cslData !== null && cslData !== "") {
				callback();
			} else {
				styleURL = "../external/csl-styles/apa.csl";
				loadStyleFromURL(styleURL, callback);
			}
		},
		numNodes : numNodes,
		numCslNodes : function () { return numNodes(get()); },
		clearViewControllers : function () {
			viewControllers = [];
		},
		setViewController : function (_viewController) {
			viewControllers.push(_viewController);
		},
		getNodesFromPath : getNodesFromPath,
		getAttrByName : getAttrByName,
		indexOfChild : indexOfChild,
		macroDefinitionIdFromInstanceId : macroDefinitionIdFromInstanceId
	};
};

// global instance, this is overwritten for unit tests
CSLEDIT.data = CSLEDIT.Data("CSLEDIT.cslData");
var CSLEDIT = CSLEDIT || {};

CSLEDIT.searchResults = {
	displaySearchResults : function (styles, outputNode) {
		var index,
			outputList = [],
			masterStyleSuffix = "",
			style,
			citation,
			bibliography;

		for (index = 0; index < Math.min(styles.length, 20); index++)
		{
			style = styles[index];
			if (style.masterId != style.styleId)
			{
				masterStyleSuffix = ' (same as <a href="' + style.masterId + '">' +
							exampleCitations.styleTitleFromId[style.masterId] + '<\/a>)';
			} else {
				masterStyleSuffix = '';
			}

			citation = exampleCitations.exampleCitationsFromMasterId[style.masterId].formattedCitations[0];
			bibliography = exampleCitations.exampleCitationsFromMasterId[style.masterId].formattedBibliography;
			
			/* Disable pretty diffs due to bug handling formatting tags (e.g. bold, italic)
			if (typeof style.userCitation !== "undefined" &&
				style.userCitation !== "" &&
				citation !== "") {
				citation = CSLEDIT.diff.prettyHtmlDiff(style.userCitation, citation);
			}

			if (typeof style.userBibliography !== "undefined" &&
				style.userBibliography !== "" &&
				bibliography !== "") {
				bibliography = CSLEDIT.diff.prettyHtmlDiff(style.userBibliography, bibliography);
			}
			*/

			outputList.push('<a href="' + style.styleId + '">' +
				exampleCitations.styleTitleFromId[style.styleId] + "<\/a>"
				+ masterStyleSuffix + "<br \/>" +
				'<table>' +
				'<tr><td nowrap="nowrap"><span class="faint">Inline citaiton<\/span>' +
				'<\/td><td>' +
				citation + '<\/td><\/tr>' +
				'<tr><td nowrap="nowrap"><span class="faint">Bibliography<\/span><\/td><td>' +
				bibliography + "<\/td><\/tr>" +
				'<tr><td><\/td><td><a href="#" class="editStyleButton" styleURL="' +
				style.styleId + '">Edit style<\/a><\/td><\/tr>' +
				'<\/table>');
		}
		
		outputNode.html(
			'<p>Displaying ' + outputList.length + ' results:<\/p>' +
				outputList.join("<p><p>")
		);

		$("a").click( function (event) {
			var styleURL = $(event.target).attr("styleURL");

			styleURL = "../getFromOtherWebsite.php?url=" + encodeURIComponent(styleURL);

			CSLEDIT.data.loadStyleFromURL(styleURL, function () {
				window.location.href =
					window.location.protocol + "//" + 
					window.location.host + "/csl/visualEditor";
			});
		});
	}
}
"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.finderPage = (function () {
	var nameSearchTimeout;
	var styleFormatSearchTimeout;

	// used to display HTML tags for debugging
	var escapeHTML = function (string) {
		return $('<pre>').text(string).html();
	};

	var displaySearchResults = function (styles, outputNode) {
		var index,
			outputList = [],
			masterStyleSuffix = "",
			style,
			citation,
			bibliography;

		for (index = 0; index < Math.min(styles.length, 20); index++)
		{
			style = styles[index];
			if (style.masterId != style.styleId)
			{
				masterStyleSuffix = ' (same as <a href="' + style.masterId + '">' +
							exampleCitations.styleTitleFromId[style.masterId] + '<\/a>)';
			} else {
				masterStyleSuffix = '';
			}

			citation = exampleCitations.exampleCitationsFromMasterId[style.masterId].formattedCitations[0];
			bibliography = exampleCitations.exampleCitationsFromMasterId[style.masterId].formattedBibliography;

			if (typeof style.userCitation !== "undefined" &&
				style.userCitation !== "" &&
				citation !== "") {
				citation = CSLEDIT.diff.prettyHtmlDiff(style.userCitation, citation);
			}

			if (typeof style.userBibliography !== "undefined" &&
				style.userBibliography !== "" &&
				bibliography !== "") {
				bibliography = CSLEDIT.diff.prettyHtmlDiff(style.userBibliography, bibliography);
			}

			outputList.push('<a href="' + style.styleId + '">' +
				exampleCitations.styleTitleFromId[style.styleId] + "<\/a>"
				+ masterStyleSuffix + "<br \/>" +
				'<table>' +
				'<tr><td><span class="faint">Inline citaiton<\/span>' +
				'<\/td><td>' +
				citation + '<\/td><\/tr>' +
				'<tr><td><span class="faint">Bibliography<\/span><\/td><td>' +
				bibliography + "<\/td><\/tr>" +
				'<tr><td><\/td><td><a href="../cslEditor/?styleURL=' + style.styleId + '">Edit style<\/a><\/td><\/tr>' +
				'<\/table>');

		}
		
		outputNode.html(
			'<p>Displaying ' + outputList.length + ' results:<\/p>' +
				outputList.join("<p><p>")
		);
	};

	// --- Functions for formatted style search ---

	function authorString(authors) {
		var result = [],
			index = 0;
		for (index = 0; index < authors.length; index++) {
			result.push(authors[index].given + " " + authors[index].family);
		}
		return result.join(", ");
	}

	var clEditorIsEmpty = function (node) {
		var text = $(node).cleditor()[0].doc.body.innerText;

		return text === "" || text === "\n";
	};

	var cleanInput = function (input) {
		var supportedTags = [ 'b', 'i', 'u', 'sup', 'sub' ],
			invisibleTags = [ 'p', 'span', 'div', 'second-field-align' ]; // we want the contents of these but not the actual tags

		input = CSLEDIT.xmlUtility.stripComments(input);
		input = CSLEDIT.xmlUtility.stripUnsupportedTagsAndContents(input, supportedTags.concat(invisibleTags));
		input = CSLEDIT.xmlUtility.stripUnsupportedTags(input, supportedTags);
		input = CSLEDIT.xmlUtility.stripAttributesFromTags(input, supportedTags);
		input = input.replace(/&nbsp;/g, " ");
		input = input.replace("\n", "");

		return input;
	};

	var searchForStyle = function () {
		var tolerance = 500,
			bestEditDistance = 999,
			bestMatchIndex = -1,
			userCitation = $("#userCitation").cleditor()[0].doc.body.innerHTML,
			userCitationText = $("#userCitation").cleditor()[0].doc.body.innerText,
			userBibliography = $("#userBibliography").cleditor()[0].doc.body.innerHTML,
			userBibliographyText = $("#userBibliography").cleditor()[0].doc.body.innerText,
			result = [],
			editDistances = [],
			index = 0,
			styleId,
			exampleCitation,
			formattedCitation,
			thisEditDistance,
			row = function (title, value) {
				return "<tr><td><span class=faint>" + title + "<\/span><\/td><td>" + value + "<\/td><\/tr>";
			};

		console.time("searchForStyle");

		if (clEditorIsEmpty("#userCitation")) {
			userCitation = "";
		}
		if (clEditorIsEmpty("#userBibliography")) {
			userBibliography = "";
		}

		for (styleId in exampleCitations.exampleCitationsFromMasterId) {
			if (exampleCitations.exampleCitationsFromMasterId.hasOwnProperty(styleId)) {
				exampleCitation = exampleCitations.exampleCitationsFromMasterId[styleId];

				if (exampleCitation !== null && exampleCitation.statusMessage === "") {
					formattedCitation = exampleCitation.formattedCitations[0];
					thisEditDistance = 0;

					if (userCitation !== "") {
						thisEditDistance += CSLEDIT.diff.customEditDistance(userCitation, formattedCitation);
					}
					if (userBibliography !== "") {
						thisEditDistance += CSLEDIT.diff.customEditDistance(userBibliography, exampleCitation.formattedBibliography);
					}

					if (thisEditDistance < tolerance)
					{
						editDistances[index++] = {
							editDistance : thisEditDistance,
							styleId : styleId
						};
					}

					if (thisEditDistance < bestEditDistance) {
						bestEditDistance = thisEditDistance;
					}
				}
			}
		}
		editDistances.sort(function (a, b) {return a.editDistance - b.editDistance});

		// TODO: only put editDistances < tolerance

		// top results
		for (index=0; index < Math.min(5, editDistances.length); index++) {
				
			result.push({
					styleId : editDistances[index].styleId,
					masterId : editDistances[index].styleId,
					userCitation : userCitation,
					userBibliography : userBibliography
			}
			);
		}
		
		CSLEDIT.searchResults.displaySearchResults(result, $("#styleFormatResult"));

		console.timeEnd("searchForStyle");
	};

	function formatFindByStyleExampleDocument() {
		var jsonDocuments = cslServerConfig.jsonDocuments;
		document.getElementById("explanation").innerHTML = "<i>Please edit this example citation to match the style you are searching for.<br />";
		document.getElementById("exampleDocument").innerHTML =
			"<p align=center><strong>Example Article<\/stong><\/p>" +
			"<table>" +
			"<tr><td>Title:<\/td><td>" + jsonDocuments["ITEM-1"].title + "<\/td><\/tr>" +
			"<tr><td>Authors:<\/td><td>" + authorString(jsonDocuments["ITEM-1"].author) + "<\/td><\/tr>" + 
			"<tr><td>Year:<\/td><td>" + jsonDocuments["ITEM-1"].issued["date-parts"][0][0] + "<\/td><\/tr>" +
			"<tr><td>Publication:<\/td><td>" + jsonDocuments["ITEM-1"]["container-title"] + "<\/td><\/tr>" +
			"<tr><td>Volume:<\/td><td>" + jsonDocuments["ITEM-1"]["volume"] + "<\/td><\/tr>" +
			"<tr><td>Issue:<\/td><td>" + jsonDocuments["ITEM-1"]["issue"] + "<\/td><\/tr>" +
			"<tr><td>Chapter:<\/td><td>" + jsonDocuments["ITEM-1"]["chapter-number"] + "<\/td><\/tr>" +
			"<tr><td>Pages:<\/td><td>" + jsonDocuments["ITEM-1"]["page"] + "<\/td><\/tr>" +
			"<tr><td>Publisher:<\/td><td>" + jsonDocuments["ITEM-1"]["publisher"] + "<\/td><\/tr>" +
			"<tr><td>Document type:<\/td><td>" + jsonDocuments["ITEM-1"]["type"] + "<\/td><\/tr>" +
			"<\/table>";
	}

	function clearResults() {
		$("#styleFormatResult").html("<i>Click search to find similar styles<\/i>");
	}

	function formChanged() {
		var userCitation,
			userBibliography;

		clearTimeout(styleFormatSearchTimeout);

		// clean the input in the editors
		userCitation = $("#userCitation").cleditor()[0].doc.body.innerHTML;
		userBibliography = $("#userBibliography").cleditor()[0].doc.body.innerHTML;

		$("#userCitation").cleditor()[0].doc.body.innerHTML = cleanInput(userCitation);
		$("#userBibliography").cleditor()[0].doc.body.innerHTML = cleanInput(userBibliography);

		styleFormatSearchTimeout = setTimeout(searchForStyle, 1000);
	}

	return {
		init : function () {		
			formatFindByStyleExampleDocument();
			$("#inputTabs").tabs({
				show: function (event, ui) {
					if (ui.panel.id === "styleNameInput") {
						$("#styleNameResult").show();
						$("#styleFormatResult").hide();
					} else {
						$("#styleNameResult").hide();
						$("#styleFormatResult").show();
					}
				}
			});
			$.cleditor.defaultOptions.width = 390;
			$.cleditor.defaultOptions.height = 100;
			$.cleditor.defaultOptions.controls =
				"bold italic underline strikethrough subscript superscript ";
			//		+ "| undo redo | cut copy paste";

			var userCitationInput = $("#userCitation").cleditor({height: 55})[0];
			$("#userBibliography").cleditor({height: 85});

			var realTimeSearch = false;
			if (realTimeSearch) {
				$("#userCitation").cleditor()[0].change(formChanged);
				$("#userBibliography").cleditor()[0].change(formChanged);
				$('#searchButton').hide();
			} else {
				$("#userCitation").cleditor()[0].change(clearResults);
				$("#userBibliography").cleditor()[0].change(clearResults);
				$('#searchButton').on("click", function () {
					$("#styleFormatResult").html("<i>Searching...<\/i>");
					formChanged();
				});
			}
		
			// prepopulate search by style format with APA example
			$("#userCitation").cleditor()[0].doc.body.innerHTML =
				exampleCitations.exampleCitationsFromMasterId["http://www.zotero.org/styles/apa"].formattedCitations[0];
			$("#userBibliography").cleditor()[0].doc.body.innerHTML =
				exampleCitations.exampleCitationsFromMasterId["http://www.zotero.org/styles/apa"].formattedBibliography;

			formChanged();
		}
	};
}());

$(document).ready(function () {
	CSLEDIT.finderPage.init();		
});

// google analytics code snippet
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-4601387-1']);
_gaq.push(['_trackPageview']);

(function() {
var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
