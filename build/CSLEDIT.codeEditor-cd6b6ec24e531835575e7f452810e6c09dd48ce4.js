// CSLEDIT.codeEditor built from commit $gitCommit

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
var cslEditorExampleData = {};

cslEditorExampleData.citationsItems = [
	{
		"citationId": "CITATION-1",
		"citationItems": [{id:"ITEM-1"}],
		"properties": {
			"noteIndex": 0
		},
		"schema": "https://github.com/citation-style-language/schema/raw/master/csl-citation.json"
	},
	{
		"citationId": "CITATION-2",
		"citationItems": [{id:"ITEM-12"}],
		"properties": {
			"noteIndex": 0
		},
		"schema": "https://github.com/citation-style-language/schema/raw/master/csl-citation.json"
	}
];

cslEditorExampleData.jsonDocuments = {
	"ITEM-1": {
		"ISBN": "0813931029",
		"abstract": "Traditional narratives imply that art in early America was severely limited in scope. By contrast, these essays collectively argue that visual arts played a critical role in shaping an early American understanding of the body politic. American artists in the late colonial and early national periods enlisted the arts to explore and exploit their visions of the relationship of the American colonies to the mother country and, later, to give material shape to the ideals of modern republican nationhood. Taking a uniquely broad view of both politics and art, Shaping the Body Politic ranges in topic from national politics to the politics of national identity, and from presidential portraits to the architectures of the ordinary. The book covers subject matter from the 1760s to the 1820s, ranging from Patience Wright's embodiment of late colonial political tension to Thomas Jefferson's designs for the entry hall at Monticello as a museum. Paul Staiti, Maurie McInnis, and Roger Stein offer new readings of canonical presidential images and spaces: Jean-Antoine Houdon's George Washington, Gilbert Stuart's the Lansdowne portrait of Washington, and Thomas Jefferson's Monticello. In essays that engage print and painting, portraiture and landscape, Wendy Bellion, David Steinberg, and John Crowley explore the formation of national identity. The volume's concluding essays, by Susan Rather and Bernard Herman, examine the politics of the everyday. The accompanying eighty-five illustrations and color plates demonstrate the broad range of politically resonant visual material in early America. ContributorsWendy Bellion, University of Delaware * John E. Crowley, Dalhousie University * Bernard L. Herman, University of North Carolina, Chapel Hill * Maurie D. McInnis, University of Virginia * Louis P. Nelson, University of Virginia * Susan Rather, University of Texas, Austin * Paul Staiti, Mount Holyoke College * Roger B. Stein, emeritus, University of Virginia * David Steinberg, Independent Scholar Thomas Jefferson Foundation Distinguished Lecture Series",
		"author": [{
			"family": "McInnis",
			"given": "Maurie D."
		}, {
			"family": "Nelson",
			"given": "Louis P."
		}],
		"id": "ITEM-1",
		"issued": {
			"date-parts": [
				["2011"]
			]
		},
		"page": "313",
		"publisher": "University of Virginia Press",
		"title": "Shaping the Body Politic: Art and Political Formation in Early America",
		"type": "book"
	},
	"ITEM-2": {
		"ISBN": "0881929115",
		"abstract": "The latest techniques for planting roofs and walls to enhance our buildings and benefit the environment. The green roof industry is booming and the technology changing fast as professionals respond to the unique challenges of each new planting. In this comprehensively updated, fully revised edition of their authoritative reference, Nigel Dunnett and Nol Kingsbury reveal the very latest techniques, materials, and plants, and showcase some spectacular new case studies for the non-professional. Green roofs and walls reduce pollution and runoff, help insulate and reduce the maintenance needs of buildings, contribute to biodiversity, and provide habitats for wildlife. In addition to all this, they are attractive to look at and enhance the quality of life of residents. In Planting Green Roofs and Living Walls, Revised and Updated Edition, the authors describe and illustrate the practical techniques required to design, implement, and maintain a green roof or wall to the highest standards. This informative, up-to-the-minute reference will encourage gardeners everywhere to consider the enormous benefits to be gained from planting on their roofs and walls.",
		"author": [{
			"family": "Dunnett",
			"given": "Nigel"
		}, {
			"family": "Kingsbury",
			"given": "No\u00ebl"
		}],
		"id": "ITEM-2",
		"issued": {
			"date-parts": [
				["2008"]
			]
		},
		"page": "328",
		"publisher": "Timber Press",
		"title": "Planting green roofs and living walls",
		"type": "book"
	},
	"ITEM-3": {
		"author": [{
			"family": "FODERARO",
			"given": "LISA W."
		}],
		"container-title": "New York Times",
		"id": "ITEM-3",
		"issued": {
			"date-parts": [
				["2012", "4", "6"]
			]
		},
		"note": "<m:note>the developer bright farms says that, at up to 100,000 square feet, the greenhouse in sunset park will be the nation\u00e2\u0080\u0099s largest.</m:note>",
		"page": "A20",
		"publisher-place": "New York",
		"title": "Rooftop Greenhouse Will Boost City Farming - NYTimes.com",
		"type": "article-newspaper"
	},
	"ITEM-4": {
		"DOI": "10.1103/PhysRev.107.13",
		"author": [{
			"family": "Cohen",
			"given": "Michael"
,
			"family": "Feynman",
			"given": "Richard"
		}],
		"container-title": "Physical Review",
		"id": "ITEM-4",
		"issue": "1",
		"issued": {
			"date-parts": [
				["1957", "7"]
			]
		},
		"page": "13-24",
		"title": "Theory of Inelastic Scattering of Cold Neutrons from Liquid Helium",
		"type": "article-journal",
		"volume": "107"
	},
	"ITEM-5": {
		"DOI": "10.1088/1748-0221/7/03/P03012",
		"abstract": "This paper presents a complete description of Virgo, the French-Italian gravitational wave detector.\n The detector, built at Cascina, near Pisa (Italy), is a very large Michelson interferometer, with 3\n km-long arms. In this paper, following a presentation of the physics requirements, leading to the\n specifications for the construction of the detector, a detailed description of all its different\n elements is given. These include civil engineering infrastructures, a huge ultra-high vacuum (UHV)\n chamber (about 6000 cubic metres), all of the optical components, including high quality mirrors and\n their seismic isolating suspensions, all of the electronics required to control the interferometer\n and for signal detection. The expected performances of these different elements are given, leading\n to an overall sensitivity curve as a function of the incoming gravitational wave frequency. This\n description represents the detector as built and used in the first data-taking runs. Improvements in\n different parts have been and continue to be performed, leading to better sensitivities. These will\n be detailed in a forthcoming paper.",
		"author": [{
			"family": "Accadia",
			"given": "T"
		}, {
			"family": "Acernese",
			"given": "F"
		}, {
			"family": "Alshourbagy",
			"given": "M"
		}, {
			"family": "Amico",
			"given": "P"
		}, {
			"family": "Antonucci",
			"given": "F"
		}, {
			"family": "Aoudia",
			"given": "S"
		}, {
			"family": "Arnaud",
			"given": "N"
		}, {
			"family": "Arnault",
			"given": "C"
		}, {
			"family": "Arun",
			"given": "K G"
		}, {
			"family": "Astone",
			"given": "P"
		}, {
			"family": "Avino",
			"given": "S"
		}, {
			"family": "Babusci",
			"given": "D"
		}, {
			"family": "Ballardin",
			"given": "G"
		}, {
			"family": "Barone",
			"given": "F"
		}, {
			"family": "Barrand",
			"given": "G"
		}, {
			"family": "Barsotti",
			"given": "L"
		}, {
			"family": "Barsuglia",
			"given": "M"
		}, {
			"family": "Basti",
			"given": "A"
		}, {
			"family": "Bauer",
			"given": "Th S"
		}, {
			"family": "Beauville",
			"given": "F"
		}, {
			"family": "Bebronne",
			"given": "M"
		}, {
			"family": "Bejger",
			"given": "M"
		}, {
			"family": "Beker",
			"given": "M G"
		}, {
			"family": "Bellachia",
			"given": "F"
		}, {
			"family": "Belletoile",
			"given": "A"
		}, {
			"family": "Beney",
			"given": "J L"
		}, {
			"family": "Bernardini",
			"given": "M"
		}, {
			"family": "Bigotta",
			"given": "S"
		}, {
			"family": "Bilhaut",
			"given": "R"
		}, {
			"family": "Birindelli",
			"given": "S"
		}, {
			"family": "Bitossi",
			"given": "M"
		}, {
			"family": "Bizouard",
			"given": "M A"
		}, {
			"family": "Blom",
			"given": "M"
		}, {
			"family": "Boccara",
			"given": "C"
		}, {
			"family": "Boget",
			"given": "D"
		}, {
			"family": "Bondu",
			"given": "F"
		}, {
			"family": "Bonelli",
			"given": "L"
		}, {
			"family": "Bonnand",
			"given": "R"
		}, {
			"family": "Boschi",
			"given": "V"
		}, {
			"family": "Bosi",
			"given": "L"
		}, {
			"family": "Bouedo",
			"given": "T"
		}, {
			"family": "Bouhou",
			"given": "B"
		}, {
			"family": "Bozzi",
			"given": "A"
		}, {
			"family": "Bracci",
			"given": "L"
		}, {
			"family": "Braccini",
			"given": "S"
		}, {
			"family": "Bradaschia",
			"given": "C"
		}, {
			"family": "Branchesi",
			"given": "M"
		}, {
			"family": "Briant",
			"given": "T"
		}, {
			"family": "Brillet",
			"given": "A"
		}, {
			"family": "Brisson",
			"given": "V"
		}, {
			"family": "Brocco",
			"given": "L"
		}, {
			"family": "Bulik",
			"given": "T"
		}, {
			"family": "Bulten",
			"given": "H J"
		}, {
			"family": "Buskulic",
			"given": "D"
		}, {
			"family": "Buy",
			"given": "C"
		}, {
			"family": "Cagnoli",
			"given": "G"
		}, {
			"family": "Calamai",
			"given": "G"
		}, {
			"family": "Calloni",
			"given": "E"
		}, {
			"family": "Campagna",
			"given": "E"
		}, {
			"family": "Canuel",
			"given": "B"
		}, {
			"family": "Carbognani",
			"given": "F"
		}, {
			"family": "Carbone",
			"given": "L"
		}, {
			"family": "Cavalier",
			"given": "F"
		}, {
			"family": "Cavalieri",
			"given": "R"
		}, {
			"family": "Cecchi",
			"given": "R"
		}, {
			"family": "Cella",
			"given": "G"
		}, {
			"family": "Cesarini",
			"given": "E"
		}, {
			"family": "Chassande-Mottin",
			"given": "E"
		}, {
			"family": "Chatterji",
			"given": "S"
		}, {
			"family": "Chiche",
			"given": "R"
		}, {
			"family": "Chincarini",
			"given": "A"
		}, {
			"family": "Chiummo",
			"given": "A"
		}, {
			"family": "Christensen",
			"given": "N"
		}, {
			"family": "Clapson",
			"given": "A C"
		}, {
			"family": "Cleva",
			"given": "F"
		}, {
			"family": "Coccia",
			"given": "E"
		}, {
			"family": "Cohadon",
			"given": "P -F"
		}, {
			"family": "Colacino",
			"given": "C N"
		}, {
			"family": "Colas",
			"given": "J"
		}, {
			"family": "Colla",
			"given": "A"
		}, {
			"family": "Colombini",
			"given": "M"
		}, {
			"family": "Conforto",
			"given": "G"
		}, {
			"family": "Corsi",
			"given": "A"
		}, {
			"family": "Cortese",
			"given": "S"
		}, {
			"family": "Cottone",
			"given": "F"
		}, {
			"family": "Coulon",
			"given": "J -P"
		}, {
			"family": "Cuoco",
			"given": "E"
		}, {
			"family": "D'Antonio",
			"given": "S"
		}, {
			"family": "Daguin",
			"given": "G"
		}, {
			"family": "Dari",
			"given": "A"
		}, {
			"family": "Dattilo",
			"given": "V"
		}, {
			"family": "David",
			"given": "P Y"
		}, {
			"family": "Davier",
			"given": "M"
		}, {
			"family": "Day",
			"given": "R"
		}, {
			"family": "Debreczeni",
			"given": "G"
		}, {
			"family": "Carolis",
			"given": "G De"
		}, {
			"family": "Dehamme",
			"given": "M"
		}, {
			"family": "Fabbro",
			"given": "R Del"
		}, {
			"family": "Pozzo",
			"given": "W Del"
		}, {
			"family": "Prete",
			"given": "M del"
		}, {
			"family": "Derome",
			"given": "L"
		}, {
			"family": "Rosa",
			"given": "R De"
		}, {
			"family": "DeSalvo",
			"given": "R"
		}, {
			"family": "Dialinas",
			"given": "M"
		}, {
			"family": "Fiore",
			"given": "L Di"
		}, {
			"family": "Lieto",
			"given": "A Di"
		}, {
			"family": "Emilio",
			"given": "M Di Paolo"
		}, {
			"family": "Virgilio",
			"given": "A Di"
		}, {
			"family": "Dietz",
			"given": "A"
		}, {
			"family": "Doets",
			"given": "M"
		}, {
			"family": "Dominici",
			"given": "P"
		}, {
			"family": "Dominjon",
			"given": "A"
		}, {
			"family": "Drago",
			"given": "M"
		}, {
			"family": "Drezen",
			"given": "C"
		}, {
			"family": "Dujardin",
			"given": "B"
		}, {
			"family": "Dulach",
			"given": "B"
		}, {
			"family": "Eder",
			"given": "C"
		}, {
			"family": "Eleuteri",
			"given": "A"
		}, {
			"family": "Enard",
			"given": "D"
		}, {
			"family": "Evans",
			"given": "M"
		}, {
			"family": "Fabbroni",
			"given": "L"
		}, {
			"family": "Fafone",
			"given": "V"
		}, {
			"family": "Fang",
			"given": "H"
		}, {
			"family": "Ferrante",
			"given": "I"
		}, {
			"family": "Fidecaro",
			"given": "F"
		}, {
			"family": "Fiori",
			"given": "I"
		}, {
			"family": "Flaminio",
			"given": "R"
		}, {
			"family": "Forest",
			"given": "D"
		}, {
			"family": "Forte",
			"given": "L A"
		}, {
			"family": "Fournier",
			"given": "J -D"
		}, {
			"family": "Fournier",
			"given": "L"
		}, {
			"family": "Franc",
			"given": "J"
		}, {
			"family": "Francois",
			"given": "O"
		}, {
			"family": "Frasca",
			"given": "S"
		}, {
			"family": "Frasconi",
			"given": "F"
		}, {
			"family": "Freise",
			"given": "A"
		}, {
			"family": "Gaddi",
			"given": "A"
		}, {
			"family": "Galimberti",
			"given": "M"
		}, {
			"family": "Gammaitoni",
			"given": "L"
		}, {
			"family": "Ganau",
			"given": "P"
		}, {
			"family": "Garnier",
			"given": "C"
		}, {
			"family": "Garufi",
			"given": "F"
		}, {
			"family": "G\u00e1sp\u00e1r",
			"given": "M E"
		}, {
			"family": "Gemme",
			"given": "G"
		}, {
			"family": "Genin",
			"given": "E"
		}, {
			"family": "Gennai",
			"given": "A"
		}, {
			"family": "Gennaro",
			"given": "G"
		}, {
			"family": "Giacobone",
			"given": "L"
		}, {
			"family": "Giazotto",
			"given": "A"
		}, {
			"family": "Giordano",
			"given": "G"
		}, {
			"family": "Giordano",
			"given": "L"
		}, {
			"family": "Girard",
			"given": "C"
		}, {
			"family": "Gouaty",
			"given": "R"
		}, {
			"family": "Grado",
			"given": "A"
		}, {
			"family": "Granata",
			"given": "M"
		}, {
			"family": "Granata",
			"given": "V"
		}, {
			"family": "Grave",
			"given": "X"
		}, {
			"family": "Greverie",
			"given": "C"
		}, {
			"family": "Groenstege",
			"given": "H"
		}, {
			"family": "Guidi",
			"given": "G M"
		}, {
			"family": "Hamdani",
			"given": "S"
		}, {
			"family": "Hayau",
			"given": "J -F"
		}, {
			"family": "Hebri",
			"given": "S"
		}, {
			"family": "Heidmann",
			"given": "A"
		}, {
			"family": "Heitmann",
			"given": "H"
		}, {
			"family": "Hello",
			"given": "P"
		}, {
			"family": "Hemming",
			"given": "G"
		}, {
			"family": "Hennes",
			"given": "E"
		}, {
			"family": "Hermel",
			"given": "R"
		}, {
			"family": "Heusse",
			"given": "P"
		}, {
			"family": "Holloway",
			"given": "L"
		}, {
			"family": "Huet",
			"given": "D"
		}, {
			"family": "Iannarelli",
			"given": "M"
		}, {
			"family": "Jaranowski",
			"given": "P"
		}, {
			"family": "Jehanno",
			"given": "D"
		}, {
			"family": "Journet",
			"given": "L"
		}, {
			"family": "Karkar",
			"given": "S"
		}, {
			"family": "Ketel",
			"given": "T"
		}, {
			"family": "Voet",
			"given": "H"
		}, {
			"family": "Kovalik",
			"given": "J"
		}, {
			"family": "Kowalska",
			"given": "I"
		}, {
			"family": "Kreckelbergh",
			"given": "S"
		}, {
			"family": "Krolak",
			"given": "A"
		}, {
			"family": "Lacotte",
			"given": "J C"
		}, {
			"family": "Lagrange",
			"given": "B"
		}, {
			"family": "Penna",
			"given": "P La"
		}, {
			"family": "Laval",
			"given": "M"
		}, {
			"family": "Marec",
			"given": "J C Le"
		}, {
			"family": "Leroy",
			"given": "N"
		}, {
			"family": "Letendre",
			"given": "N"
		}, {
			"family": "Li",
			"given": "T G F"
		}, {
			"family": "Lieunard",
			"given": "B"
		}, {
			"family": "Liguori",
			"given": "N"
		}, {
			"family": "Lodygensky",
			"given": "O"
		}, {
			"family": "Lopez",
			"given": "B"
		}, {
			"family": "Lorenzini",
			"given": "M"
		}, {
			"family": "Loriette",
			"given": "V"
		}, {
			"family": "Losurdo",
			"given": "G"
		}, {
			"family": "Loupias",
			"given": "M"
		}, {
			"family": "Mackowski",
			"given": "J M"
		}, {
			"family": "Maiani",
			"given": "T"
		}, {
			"family": "Majorana",
			"given": "E"
		}, {
			"family": "Magazz\u00f9",
			"given": "C"
		}, {
			"family": "Maksimovic",
			"given": "I"
		}, {
			"family": "Malvezzi",
			"given": "V"
		}, {
			"family": "Man",
			"given": "N"
		}, {
			"family": "Mancini",
			"given": "S"
		}, {
			"family": "Mansoux",
			"given": "B"
		}, {
			"family": "Mantovani",
			"given": "M"
		}, {
			"family": "Marchesoni",
			"given": "F"
		}, {
			"family": "Marion",
			"given": "F"
		}, {
			"family": "Marin",
			"given": "P"
		}, {
			"family": "Marque",
			"given": "J"
		}, {
			"family": "Martelli",
			"given": "F"
		}, {
			"family": "Masserot",
			"given": "A"
		}, {
			"family": "Massonnet",
			"given": "L"
		}, {
			"family": "Matone",
			"given": "G"
		}, {
			"family": "Matone",
			"given": "L"
		}, {
			"family": "Mazzoni",
			"given": "M"
		}, {
			"family": "Menzinger",
			"given": "F"
		}, {
			"family": "Michel",
			"given": "C"
		}, {
			"family": "Milano",
			"given": "L"
		}, {
			"family": "Minenkov",
			"given": "Y"
		}, {
			"family": "Mitra",
			"given": "S"
		}, {
			"family": "Mohan",
			"given": "M"
		}, {
			"family": "Montorio",
			"given": "J -L"
		}, {
			"family": "Morand",
			"given": "R"
		}, {
			"family": "Moreau",
			"given": "F"
		}, {
			"family": "Moreau",
			"given": "J"
		}, {
			"family": "Morgado",
			"given": "N"
		}, {
			"family": "Morgia",
			"given": "A"
		}, {
			"family": "Mosca",
			"given": "S"
		}, {
			"family": "Moscatelli",
			"given": "V"
		}, {
			"family": "Mours",
			"given": "B"
		}, {
			"family": "Mugnier",
			"given": "P"
		}, {
			"family": "Mul",
			"given": "F -A"
		}, {
			"family": "Naticchioni",
			"given": "L"
		}, {
			"family": "Neri",
			"given": "I"
		}, {
			"family": "Nocera",
			"given": "F"
		}, {
			"family": "Pacaud",
			"given": "E"
		}, {
			"family": "Pagliaroli",
			"given": "G"
		}, {
			"family": "Pai",
			"given": "A"
		}, {
			"family": "Palladino",
			"given": "L"
		}, {
			"family": "Palomba",
			"given": "C"
		}, {
			"family": "Paoletti",
			"given": "F"
		}, {
			"family": "Paoletti",
			"given": "R"
		}, {
			"family": "Paoli",
			"given": "A"
		}, {
			"family": "Pardi",
			"given": "S"
		}, {
			"family": "Parguez",
			"given": "G"
		}, {
			"family": "Parisi",
			"given": "M"
		}, {
			"family": "Pasqualetti",
			"given": "A"
		}, {
			"family": "Passaquieti",
			"given": "R"
		}, {
			"family": "Passuello",
			"given": "D"
		}, {
			"family": "Perciballi",
			"given": "M"
		}, {
			"family": "Perniola",
			"given": "B"
		}, {
			"family": "Persichetti",
			"given": "G"
		}, {
			"family": "Petit",
			"given": "S"
		}, {
			"family": "Pichot",
			"given": "M"
		}, {
			"family": "Piergiovanni",
			"given": "F"
		}, {
			"family": "Pietka",
			"given": "M"
		}, {
			"family": "Pignard",
			"given": "R"
		}, {
			"family": "Pinard",
			"given": "L"
		}, {
			"family": "Poggiani",
			"given": "R"
		}, {
			"family": "Popolizio",
			"given": "P"
		}, {
			"family": "Pradier",
			"given": "T"
		}, {
			"family": "Prato",
			"given": "M"
		}, {
			"family": "Prodi",
			"given": "G A"
		}, {
			"family": "Punturo",
			"given": "M"
		}, {
			"family": "Puppo",
			"given": "P"
		}, {
			"family": "Qipiani",
			"given": "K"
		}, {
			"family": "Rabaste",
			"given": "O"
		}, {
			"family": "Rabeling",
			"given": "D S"
		}, {
			"family": "R\u00e1cz",
			"given": "I"
		}, {
			"family": "Raffaelli",
			"given": "F"
		}, {
			"family": "Rapagnani",
			"given": "P"
		}, {
			"family": "Rapisarda",
			"given": "S"
		}, {
			"family": "Re",
			"given": "V"
		}, {
			"family": "Reboux",
			"given": "A"
		}, {
			"family": "Regimbau",
			"given": "T"
		}, {
			"family": "Reita",
			"given": "V"
		}, {
			"family": "Remilleux",
			"given": "A"
		}, {
			"family": "Ricci",
			"given": "F"
		}, {
			"family": "Ricciardi",
			"given": "I"
		}, {
			"family": "Richard",
			"given": "F"
		}, {
			"family": "Ripepe",
			"given": "M"
		}, {
			"family": "Robinet",
			"given": "F"
		}, {
			"family": "Rocchi",
			"given": "A"
		}, {
			"family": "Rolland",
			"given": "L"
		}, {
			"family": "Romano",
			"given": "R"
		}, {
			"family": "Rosi\u0144ska",
			"given": "D"
		}, {
			"family": "Roudier",
			"given": "P"
		}, {
			"family": "Ruggi",
			"given": "P"
		}, {
			"family": "Russo",
			"given": "G"
		}, {
			"family": "Salconi",
			"given": "L"
		}, {
			"family": "Sannibale",
			"given": "V"
		}, {
			"family": "Sassolas",
			"given": "B"
		}, {
			"family": "Sentenac",
			"given": "D"
		}, {
			"family": "Solimeno",
			"given": "S"
		}, {
			"family": "Sottile",
			"given": "R"
		}, {
			"family": "Sperandio",
			"given": "L"
		}, {
			"family": "Stanga",
			"given": "R"
		}, {
			"family": "Sturani",
			"given": "R"
		}, {
			"family": "Swinkels",
			"given": "B"
		}, {
			"family": "Tacca",
			"given": "M"
		}, {
			"family": "Taddei",
			"given": "R"
		}, {
			"family": "Taffarello",
			"given": "L"
		}, {
			"family": "Tarallo",
			"given": "M"
		}, {
			"family": "Tissot",
			"given": "S"
		}, {
			"family": "Toncelli",
			"given": "A"
		}, {
			"family": "Tonelli",
			"given": "M"
		}, {
			"family": "Torre",
			"given": "O"
		}, {
			"family": "Tournefier",
			"given": "E"
		}, {
			"family": "Travasso",
			"given": "F"
		}, {
			"family": "Tremola",
			"given": "C"
		}, {
			"family": "Turri",
			"given": "E"
		}, {
			"family": "Vajente",
			"given": "G"
		}, {
			"family": "Brand",
			"given": "J F J van den"
		}, {
			"family": "Broeck",
			"given": "C Van Den"
		}, {
			"family": "Putten",
			"given": "S van der"
		}, {
			"family": "Vasuth",
			"given": "M"
		}, {
			"family": "Vavoulidis",
			"given": "M"
		}, {
			"family": "Vedovato",
			"given": "G"
		}, {
			"family": "Verkindt",
			"given": "D"
		}, {
			"family": "Vetrano",
			"given": "F"
		}, {
			"family": "V\u00e9ziant",
			"given": "O"
		}, {
			"family": "Vicer\u00e9",
			"given": "A"
		}, {
			"family": "Vinet",
			"given": "J -Y"
		}, {
			"family": "Vilalte",
			"given": "S"
		}, {
			"family": "Vitale",
			"given": "S"
		}, {
			"family": "Vocca",
			"given": "H"
		}, {
			"family": "Ward",
			"given": "R L"
		}, {
			"family": "Was",
			"given": "M"
		}, {
			"family": "Yamamoto",
			"given": "K"
		}, {
			"family": "Yvert",
			"given": "M"
		}, {
			"family": "Zendri",
			"given": "J -P"
		}, {
			"family": "Zhang",
			"given": "Z"
		}],
		"container-title": "Journal of Instrumentation",
		"id": "ITEM-5",
		"issue": "03",
		"issued": {
			"date-parts": [
				["2012", "3", "29"]
			]
		},
		"page": "P03012-P03012",
		"title": "Virgo: a laser interferometer to detect gravitational waves",
		"type": "article-journal",
		"volume": "7"
	},
	"ITEM-6": {
		"author": [{
			"family": "Borges",
			"given": "Jorge Luis"
		}],
		"editor": [{
			"family": "Weinberger",
			"given": "Eliot"
		}],
		"id": "ITEM-6",
		"issued": {
			"date-parts": [
				["1999"]
			]
		},
		"page": "559",
		"publisher": "Viking",
		"publisher-place": "New York",
		"title": "Selected non-fictions",
		"translator": [{
			"family": "Allen",
			"given": "Esther"
		}, {
			"family": "Levine",
			"given": "Suzanne Jill"
		}, {
			"family": "Weinberger",
			"given": "Eliot"
		}],
		"type": "book"
	},
	"ITEM-7": {
		"ISBN": "9781451648539",
		"author": [{
			"family": "Isaacson",
			"given": "Walter"
		}],
		"id": "ITEM-7",
		"issued": {
			"date-parts": [
				["2011", "10", "24"]
			]
		},
		"page": "656",
		"publisher": "Simon & Schuster",
		"title": "Steve Jobs",
		"type": "book"
	},
	"ITEM-8": {
		"author": [{
			"family": "Van Dan Elzen",
			"given": "Hans"
		}],
		"id": "ITEM-8",
		"issued": {
			"date-parts": [
				["2011"]
			]
		},
		"number": "WO2011US30214",
		"title": "YO-YO HAVING A MODIFIABLE STRING GAP",
		"type": "patent"
	},
	"ITEM-9": {
		"id": "ITEM-9",
		"issued": {
			"date-parts": [
				["2010"]
			]
		},
		"title": "Fullilove v. Klutznick",
		"type": "article"
	},
	"ITEM-10": {
		"DOI": "10.1038/119558a0",
		"URL": "http://www.nature.com/doifinder/10.1038/119558a0",
		"accessed": {
			"date-parts": [
				["2011", "6", "7"]
			]
		},
		"author": [{
			"family": "Davisson",
			"given": "C."
		}, {
			"family": "Germer",
			"given": "L. H."
		}],
		"container-title": "Nature",
		"editor": [],
		"id": "ITEM-10",
		"issue": "2998",
		"issued": {
			"date-parts": [
				["1927", "4", "16"]
			]
		},
		"page": "558-560",
		"title": "The Scattering of Electrons by a Single Crystal of Nickel",
		"translator": [],
		"type": "article-journal",
		"volume": "119"
	},
	"ITEM-11": {
		"DOI": "10.1088/0143-0807/27/4/007",
		"URL": "http://bavard.fourmilab.ch/etexts/einstein/specrel/specrel.pdf",
		"abstract": "General description of special relativity",
		"author": [{
			"family": "Einstein",
			"given": "Albert"
		}],
		"chapter-number": "3",
		"container-title": "Annalen der Physik",
		"editor": [],
		"id": "ITEM-11",
		"issue": "4",
		"issued": {
			"date-parts": [
				["1905"]
			]
		},
		"page": "1-26",
		"publisher": "Dover Publications",
		"title": "On the electrodynamics of moving bodies",
		"translator": [],
		"type": "article-journal",
		"volume": "17"
	},
	"ITEM-12": {
		"DOI": "10.1038/171737a0",
		"URL": "http://www.ncbi.nlm.nih.gov/pubmed/13054692",
		"abstract": "We wish to suggest a structure for the salt of deoxyribose nucleic acid (D.N.A.). This structure has novel features which are of considerable biological interest.",
		"author": [{
			"family": "Watson",
			"given": "J D"
		}, {
			"family": "Crick",
			"given": "F H"
		}],
		"container-title": "Nature",
		"editor": [],
		"id": "ITEM-12",
		"issue": "4356",
		"issued": {
			"date-parts": [
				["1953"]
			]
		},
		"page": "737-738",
		"publisher": "Am Med Assoc",
		"title": "Molecular structure of nucleic acids; a structure for deoxyribose nucleic acid.",
		"translator": [],
		"type": "article-journal",
		"volume": "171"
	},
}

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
"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.editorPage = (function () {
	var codeTimeout,
		editor,
		diffTimeout,
		diffMatchPatch = new diff_match_patch(),
		oldFormattedCitation = "",
		newFormattedCitation = "",
		oldFormattedBibliography = "",
		newFormattedBibliography = "",
		styleURL;

	// from https://gist.github.com/1771618
	var getUrlVar = function (key) {
		var result = new RegExp(key + "=([^&]*)", "i").exec(window.location.search); 
		return result && unescape(result[1]) || "";
	};

	return {
		init : function () {
			CodeMirror.defaults.onChange = function()
			{
				clearTimeout(codeTimeout);
				codeTimeout = setTimeout( function () {
					CSLEDIT.data.setCslCode(editor.getValue());
					CSLEDIT.citationEngine.runCiteprocAndDisplayOutput(
						$("#statusMessage"), $("#exampleOutput"),
						$("#formattedCitations"), $("#formattedBibliography"));
				}, 500);
			};

			editor = CodeMirror.fromTextArea(document.getElementById("code"), {
					mode: { name: "xml", htmlMode: true},
					lineNumbers: true
			});

			CSLEDIT.data.initPageStyle( function () {
				editor.setValue(CSLEDIT.data.getCslCode());
			});
		}
	};
}());

$("document").ready( function() {
	CSLEDIT.editorPage.init();
});
