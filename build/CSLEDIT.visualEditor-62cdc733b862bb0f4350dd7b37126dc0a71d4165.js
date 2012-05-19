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
		"citationItems": [],
		"properties": {
			"noteIndex": 0
		},
		"schema": "https://github.com/citation-style-language/schema/raw/master/csl-citation.json"
	},
	{
		"citationId": "CITATION-2",
		"citationItems": [],
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
"use strict";

CSLEDIT = CSLEDIT || {};

/* Iterates through a tree in depth first order
 *
 * Each node of the tree must contain a children array containing it's child nodes
 * 
 * Can retrieve the parent node of each child in the tree
 */
CSLEDIT.Iterator = function (rootNode) {
	assert(this instanceof CSLEDIT.Iterator);

	this.rootNode = rootNode;
	this.nodeStack = [];
	this.finished = false;
	this.nextNode = null;
};

CSLEDIT.Iterator.prototype.next = function () {
	var topNode,
		nextNode,
		currentNode;

	nextNode = this.nextNode;
	this.nextNode = null;

	// used to implement hasNext
	if (nextNode !== null) {
		return nextNode;
	}

	if (this.finished) {
		return null;
	}

	if (this.nodeStack.length === 0) {
		// start
		this.nodeStack.push({ node : this.rootNode, childIndex : -1 });
		return this.nodeStack[0].node;
	}

	topNode = this.nodeStack[this.nodeStack.length - 1];
	topNode.childIndex++;

	if (topNode.childIndex < topNode.node.children.length) {
		nextNode = topNode.node.children[topNode.childIndex];
		this.nodeStack.push({ node : nextNode, childIndex : -1 });
		return nextNode;
	} else {
		this.nodeStack.pop();
		if (this.nodeStack.length === 0) {
			this.finished = true;
		}
		return this.next();
	}
};

CSLEDIT.Iterator.prototype.hasNext = function () {
	if (this.nextNode !== null) {
		return true;
	} else {
		if (this.finished) {
			return false;
		} else {
			this.nextNode = this.next();
			return this.nextNode !== null;
		}
	}
};

CSLEDIT.Iterator.prototype.parent = function () {
	if (this.nodeStack.length > 1) {
		return this.nodeStack[this.nodeStack.length - 2].node;
	} else {
		return null;
	}
};

CSLEDIT.Iterator.prototype.stack = function () {
	var stack = [];

	$.each(this.nodeStack, function(i, node) {
		stack.push(node.node);
	});
	
	return stack;
};
"use strict";

CSLEDIT = CSLEDIT || {};

CSLEDIT.CslNode = function (nameOrNode, attributes, children, cslId) {
	assert(this instanceof CSLEDIT.CslNode);

	if (nameOrNode.hasOwnProperty("name")) {
		this.copy(nameOrNode);
		return;
	}

	this.name = nameOrNode;
	this.attributes = attributes || [];
	this.children = children || [];
	if (typeof cslId === "undefined") {
		this.cslId = -1;
	} else {
		this.cslId = cslId;
	}
};

// performs a shallow copy of source
CSLEDIT.CslNode.prototype.copy = function (source) {
	this.name = source.name;
	this.attributes = source.attributes;
	this.children = source.children;
	this.textValue = source.textValue;
	this.cslId = source.cslId;
};

CSLEDIT.CslNode.prototype.setAttr = function (attr, value) {
	var index;

	index = this._indexOfAttr(attr);

	if (index === -1) {
		this.attributes.push({key: attr, value: value, enabled: true});
	} else {
		this.attributes[index].value = value;
		this.attributes[index].enabled = true;
	}
};

CSLEDIT.CslNode.prototype.getAttr = function (attr) {
	var index;

	index = this._indexOfAttr(attr);

	if (index === -1) {
		return "";
	} else {
		return this.attributes[index].value;
	}
};

// private methods

// returns -1 if can't find
CSLEDIT.CslNode.prototype._indexOfAttr = function (attrName) {
	var index = -1;
	$.each(this.attributes, function (i, attr) {
		if (attr.key === attrName) {
			index = i;
			return false;
		}
	});
	return index;
};
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
// Responsible for parsing a .rng file
// The file must be in XML form, not the compact notation (.rnc)
//
// (only tested with the csl.rng and it's includes)
//
// It generates properties for each element type:
//
// - data type if applicable (e.g. text, anyURI)
// - list of attributes, and thier possible values
// - list of child elements
// 
// It assumes that an element can be uniquely identified by it's name + parent's name

"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.schema = (function (mainSchemaURL, includeSchemaURLs) {
	var mainSchemaData,
		schemas = [],
		nodesParsed = 0,
		nodeProperties = {}, // The possible child elements and attributes for each
		                     // node name
		defineProperties = {},
		currentNodeName = "",
		urlsGot = 0,
		callback = null,
		initialised = false,
		refParents = {};

	var arrayForEach = function (array, action) {
		if (typeof array === "undefined") {
			return;
		}
		var index;
		for (index = 0; index < array.length; index++) {
			action(array[index]);
		}
	};
	
	$.get(mainSchemaURL, {}, function(data) {
		mainSchemaData = data;
		urlsGot++;
		if (urlsGot === includeSchemaURLs.length + 1) {
			init();
		}
	});

	arrayForEach(includeSchemaURLs, function(url) {
		$.get(url, {}, function(data) {
			schemas.push(data);
			urlsGot++;
			if (urlsGot === includeSchemaURLs.length + 1) {
				init();
			}
		});
	});

	var NodeProperties = function () {
		return {
			elements : {},
			attributes : {},
			refs : [],
			attributeValues : [],
			textNode : false,
			list : false
		};
	};

	var init = function () {
		// parse the schema element by element
		var parser = new DOMParser(),
			xmlDoc;

		xmlDoc = parser.parseFromString(mainSchemaData, "application/xml");

		// This is the root node for the grammar
		nodeProperties["root"] = parseChildren(xmlDoc);

		arrayForEach(schemas, function (schemaData) {
			xmlDoc = parser.parseFromString(schemaData, "application/xml");
		
			// Parse schema
			parseChildren(xmlDoc);
		});

		// Simplify schema (replace all refs with the corresponding define
		simplify();

		initialised = true;
		if (callback !== null) {
			callback();
		}
	};

	var simplify = function () {
		var node, defRegExp, match, originalNodes = [], newNodeName;

		for (node in nodeProperties) {
			simplifyNode(node, nodeProperties[node]);
		}

		// replace all def: references in node names with the appropriate child nodes, expanding
		// out the as neccessary
		defRegExp = new RegExp("def:([\\w-]+)\/(.*)$");

		for (node in nodeProperties) {
			originalNodes.push(node);
		}

		arrayForEach(originalNodes, function (node) {
			match = defRegExp.exec(node);
			if (match !== null) {
				arrayForEach(refParents[match[1]], function (refParent) {
					newNodeName = refParent + "/" + match[2];
					if (newNodeName in nodeProperties) {
						joinProperties(nodeProperties[newNodeName], nodeProperties[node]);
					} else {
						nodeProperties[newNodeName] = nodeProperties[node];
					}
				});

				delete nodeProperties[node];
			}
		});
	};

	var elementName = function (elementStackString) {
		return elementStackString.replace(/^.*\//, "");
	};

	var simplifyNode = function (nodeName, node) {
		var define,
			ref,
			attributeName,
			nodeLocalName;

		ref = node.refs.pop();

		if (typeof ref === "undefined") {
			for (attributeName in node.attributes) {
				// already mostly simplified, just need to dereference the attr. values
				simplifyAttributeValues(node, attributeName);
			}

			// remove refs array
			delete node.refs;

			return;
		}
		
		if (ref in defineProperties) {
			define = defineProperties[ref];

			joinProperties(node, define);

			simplifyNode(nodeName, node);
		
			assert(elementName(nodeName).indexOf("def:") === -1, "define parent");

			if (ref in refParents) {
				if (refParents[ref].indexOf(elementName(nodeName)) === -1) {
					refParents[ref].push(elementName(nodeName));
				}
			} else {
				refParents[ref] = [ elementName(nodeName) ];
			}
		} else {
			assert(false, "Couldn't find define: " + ref);
		}
	};

	var simplifyAttributeValues = function (node, attributeName) {
		var ref,
			define;

		// note: refs may already be deleted because
		// this attribute may have referenced in a different element,
		// and it's already been simplified
		if (typeof node.attributes[attributeName].refs === "undefined") {
			return;
		}

		ref = node.attributes[attributeName].refs.pop();

		if (typeof ref === "undefined") {
			// simplified
			
			// note, that refs may already be deleted because
			// it may have been referenced somewhere else
			if (typeof node.attributes[attributeName].refs !== "undefined") {
				delete node.attributes[attributeName].refs;
			}
			return;
		}

		if (ref in defineProperties) {
			define = defineProperties[ref];
			
			arrayMerge(node.attributes[attributeName].values,
				define.attributeValues);
			arrayMerge(node.attributes[attributeName].refs,
				define.refs);

			simplifyAttributeValues(node, attributeName);
		} else {
			assert(false, "Couldn't find attr value define: " + ref);
		}
	};

	var arrayContains = function (array, element, equalityFunction) {
		if (typeof equalityFunction === "undefined") {
			equalityFunction = (function (a, b) {return a === b;});
		}

		var index;
		for (index = 0; index < array.length; index++) {
			if (equalityFunction(array[index], element)) {
				return true;
			}
		}
		return false;
	};
	
	// merge the two arrays putting result in arrayA
	var arrayMerge = function (arrayA, arrayB, equalityFunction) {
		arrayForEach(arrayB, function(eleB) {
			if (!arrayContains(arrayA, eleB, equalityFunction)) {
				arrayA.push(eleB);
			}
		});
	};

	var parseChildren = function (node) {
		var index,
			parser,
			childNode,
			nodeProperties = new NodeProperties(),
			childResult;

		if (node.nodeName !== null) {
			nodesParsed++;
		}

		// add child results to the result list
		arrayForEach(node.childNodes, function (childNode) {
			if (childNode.localName !== null) {
				if (childNode.nodeName in nodeParsers) {
					childResult = nodeParsers[childNode.nodeName](childNode);

					if (childResult !== null) {
						joinProperties(nodeProperties, childResult);
					}
				} else {
					// couldn't parse
				}
			}
		});

		return nodeProperties;
	};

	var joinProperties = function (propertiesA, propertiesB) {
		var element, attribute;

		var attributeValueEquality = function (a, b) {
			return (a.type === b.type && a.value === b.value);
		};

		for (element in propertiesB.elements) {
			if (!(element in propertiesA.attributes)) {
				propertiesA.elements[element] = propertiesB.elements[element];
			} else {
				propertiesA.elements[element] = ""; // values of elements not important
			}
		}
		for (attribute in propertiesB.attributes) {
			if (!(attribute in propertiesA.attributes)) {
				propertiesA.attributes[attribute] = propertiesB.attributes[attribute];
			} else {
				arrayMerge(propertiesA.attributes[attribute].values,
					propertiesB.attributes[attribute].values, attributeValueEquality);
				arrayMerge(propertiesA.attributes[attribute].refs,
					propertiesB.attributes[attribute].refs);
			}
		}

		arrayMerge(propertiesA.refs, propertiesB.refs);
		arrayMerge(propertiesA.attributeValues, propertiesB.attributeValues, attributeValueEquality);

		propertiesA.textNode = propertiesA.textNode | propertiesB.textNode;
		propertiesA.list = propertiesA.list | propertiesB.list;
	};

	var elementStack = [];
	var elementStackString = function () {
		var topTwoElements = [],
			index = elementStack.length - 1;

		while (index >= 0 && topTwoElements.length < 2) {	
			topTwoElements.splice(0, 0, elementStack[index]);
			index--;
		}

		return topTwoElements.join("/");
	};

	// a list of functions which attempt to parse a node
	// return true if parsed, false if not
	var nodeParsers = {
		element : function (node) {
			var thisNodeProperties = new NodeProperties(),
				thisElementName = node.attributes.item("name").nodeValue,
				newProperties;

			// only want elements starting with cs:
			if ((/^cs:/).test(thisElementName)) {
				thisElementName = thisElementName.replace(/^cs:/, "");

				elementStack.push(thisElementName);
				thisNodeProperties.elements[thisElementName] = "";

				newProperties = parseChildren(node);

				if (elementStackString() in nodeProperties) {
					joinProperties(nodeProperties[elementStackString()], newProperties);
				} else {
					nodeProperties[elementStackString()] = newProperties;
				}

				elementStack.pop();
				return thisNodeProperties;
			} else {
				// ignore non cs: elements/
				assert(false);
				return null;
			}
		},
		attribute : function (node) {
			var thisNodeProperties = new NodeProperties(),
				attributeName = node.attributes.item("name").nodeValue,
				values;

			values = parseChildren(node);

			if (values.textNode) {
				// Will accept any free-form text
				thisNodeProperties.attributes[attributeName] = {
					values : [],
					refs : [],
					list : values.list
				};
			} else {
				thisNodeProperties.attributes[attributeName] = {
					values : values.attributeValues,
					refs : values.refs,
					list : values.list
				};
			}
			return thisNodeProperties;
		},
		group : function (node) {
			return parseChildren(node);
		},
		interleave : function (node) {
			return parseChildren(node);
		},
		choice : function (node) {
			// for now, just union the possible child nodes
			return parseChildren(node);
		},
		optional : function (node) {
			return parseChildren(node);
		},
		zeroOrMore : function (node) {
			return parseChildren(node);
		},
		oneOrMore : function (node) {
			return parseChildren(node);
		},
		list : function (node) {
			var thisNodeProperties = parseChildren(node);
			thisNodeProperties.list = true;

			return thisNodeProperties;
		},
		mixed : function (node) {
			return parseChildren(node);
		},
		ref : function (node) {
			var thisNodeProperties = new NodeProperties(),
				nodeName = node.attributes.item("name").nodeValue;
			thisNodeProperties.refs.push(nodeName);
			return thisNodeProperties;
		},
		parentRef : function (node) {
			// not used in the CSL schema
			assert(false, "parentRef not supported");
			return null;
		},
		empty : function (node) {
			return null;
		},
		text : function (node) {
			var thisNodeProperties = new NodeProperties();
			thisNodeProperties.textNode = true;
			return thisNodeProperties;
		},
		value : function (node) {
			var thisNodeProperties = new NodeProperties();
			thisNodeProperties.attributeValues = [{
				type : "value",
				value : node.textContent
			}];
			return thisNodeProperties;
		},
		data : function (node) {
			var thisNodeProperties = new NodeProperties();
			thisNodeProperties.attributeValues = [{
				type : "data",
				value : node.attributes.item("type").nodeValue
			}];
			return thisNodeProperties;
		},
		notAllowed : function (node) {
			// not sure what this does
			return null;
		},
		grammar : function (node) {
			return parseChildren(node);;
		},
		param : function (node) {
			return null;
		},
		div : function (node) {
			// divs can be ignored for now, they are only used to group documentation nodes
			return parseChildren(node);
		},
		include : function (node) {
			// TODO!
			return null;
		},
		start : function (node) {
			return parseChildren(node);
		},
		define : function (node) {
			// create new define
			var defineName;
			defineName = node.attributes.item("name").nodeValue;
			
			elementStack.push("def:" + defineName);
			defineProperties[defineName] = parseChildren(node);
			elementStack.pop();
			return null;
		}
	};

	return {
		attributes : function (element) {
			return nodeProperties[element].attributes;
		},
		childElements : function (element) {
			return nodeProperties[element].elements;
		},
		elementDataType : function (element) {
			var node = nodeProperties[element];

			if (nodeProperties[element].textNode) {
				return "text";
			}

			assert(node.attributeValues.length < 2);
			if (node.attributeValues.length === 0 || node.attributeValues[0].type !== "data") {
				return null;
			} else {
				return node.attributeValues[0].value;
			}
		},
		allData : function () {
			return nodeProperties;
		},
		callWhenReady : function (newCallback) {
			if (initialised) {
				newCallback();
			} else {
				callback = newCallback;
			}
		}
	};
}(
	"http://" + window.location.host + "/csl/external/csl-schema/csl.rng",
	[
		"http://" + window.location.host + "/csl/external/csl-schema/csl-categories.rng",
		"http://" + window.location.host + "/csl/external/csl-schema/csl-terms.rng",
		"http://" + window.location.host + "/csl/external/csl-schema/csl-types.rng",
		"http://" + window.location.host + "/csl/external/csl-schema/csl-variables.rng"
	]
));
"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.feedback = {
	init : function (feedbackPanel) {

		feedbackPanel.find('input:submit').on('click', function () {
			var message, email;

			message = feedbackPanel.find('.message').val();
			email = feedbackPanel.find('.email').val();

			var url = "/csl/server/sendFeedback.php?subject=" + encodeURIComponent("CSL editor feedback") +
				"&message=" + encodeURIComponent(message) +
				"&email=" + encodeURIComponent(email);

			$.ajax({
			  url: url
			}).done(function ( data ) {
				$('<div title="Feedback Sent"><\/div>').append(data).dialog();
				if (/Thanks for your feedback!\s*$/.test(data)) {
					feedbackPanel.find('.message').val("");
				}
			}).fail(function () {
				alert("Error, feedback not sent.");
			});
			
		});
	}
};
"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.editReferences = (function () {
	var init = function (listElement, callback, citation, checked) {
		var index = 0;

		listElement.children().remove();
			
		// create menus
		$.each(cslEditorExampleData.jsonDocuments, function (itemName, item) {
			listElement.append('<li><input type="checkbox" value="' + index + '" \/> <strong>' + item.type + 
				'<\/strong>: ' + item.title + '<\/li>');
			index++;
		});

		// select the first 3
		listElement.find('input').val(checked).on('change', function () {
			updateCitations(listElement, callback, citation);
		});

		// update with no callback
		updateCitations(listElement, function () {}, citation);
	};

	var updateCitations = function (listElement, callback, citation) {
		var citationItems = [];

		listElement.find('input').each( function (index) {
			if ($(this).is(':checked')) {
				citationItems.push({id:"ITEM-" + (index + 1)});
			}
		});
		
		cslEditorExampleData.citationsItems[citation].citationItems = citationItems;
		/*
		cslEditorExampleData.citationsItems = [{
			citationId: "CITATION-1",
			citationItems: citationItems,
			properties: {
				"noteIndex": 0
			},
			schema: "https://github.com/citation-style-language/schema/raw/master/csl-citation.json"
		}];*/

		callback();
	};

	return {
		init : init
	};
}());
"use strict";

CSLEDIT = CSLEDIT || {};

CSLEDIT.NodePathView = function (element, callbacks) {
	this.element = 	element;
	this.callbacks = callbacks;
};

CSLEDIT.NodePathView.prototype.selectNode = function (nodePath) {
	var that = this,
		nodesHtml = [],
		cslData = CSLEDIT.data.get();

	// create path from 

	$.each(nodePath, function (i, cslId) {
		var node = CSLEDIT.data.getNode(cslId, cslData);
		nodesHtml.push('<span cslid="' + node.cslId + '">' + node.name + '<\/span>');
	});

	this.element.html('<h3>' + nodesHtml.join(" > ") + '<\/h3>');

	this.element.find('span[cslid]').css({"cursor" : "pointer"});
	this.element.find('span[cslid]').on('click', function(event) {
		var thisNodePath = [],
			thisCslId = parseInt($(event.target).attr("cslid"));

		$.each(nodePath, function (i, cslId) {
			thisNodePath.push(cslId);
			if (cslId === thisCslId) {
				return false;
			}
		});
		
		that.callbacks.selectNodeFromPath(thisNodePath);
	});

	//$.each(nodePath, function (i, cslId) {
	//	that.callbacks.setupSyntaxHighlightForNode(cslId);
	//});
};
"use strict";

var CSLEDIT = CSLEDIT || {};

/* provides a way to edit space-delimited list of stings,
 * each of which must be one of the supplied values
 */

CSLEDIT.MultiComboBox = function (element, possibleValues, onChange, unique) {
	this._element = element;
	this._values = [];
	this._onChange = onChange;
	this._unique = unique;

	assert(possibleValues.length > 0);
	this._selectHtml = '<select><option>' +	possibleValues.join('<\/option><option>') +
		'<\/option><\/select>';

	this._refresh(true);
};

CSLEDIT.MultiComboBox.prototype.getElement = function () {
	return this._element;
};

CSLEDIT.MultiComboBox.prototype.val = function (val, suppressOnChange) {
	if (typeof val === "undefined") {
		this._readValues();
		return this._values.join(" ");
	} else {
		if (val === "") {
			this._values = [];
		} else {
			this._values = val.split(" ");
		}
		if (typeof suppressOnChange === "undefined") {
			suppressOnChange = false;
		}
		this._refresh(suppressOnChange);
	}
};

CSLEDIT.MultiComboBox.prototype._readValues = function () {
	var that = this;
	// repopulate _values from current combo box values
	that._values = [];
	this._element.find('select').each(function () {
		that._values.push($(this).val());
	});
};

CSLEDIT.MultiComboBox.prototype._refresh = function (suppressOnChange) {
	var that = this,
		table = $('<table><\/table>');

	this._element.html('');
	
	$.each(this._values, function (i, value) {
		var row = $('<tr><\/tr>'),
			select = $(that._selectHtml).css({"margin-right": 0}),
			deleteButton = $('<button class="delete" data-index="' + i + '">X<\/button>').css({"margin-left": 0});

		select.val(value);

		row.append($('<td><\/td>').append(select));
		row.append($('<td><\/td>').append(deleteButton));
		table.append(row);
	});

	(function(){
		var addButton = $('<button class="add">+ Add</button>');//.css('width', '100%');
		table.append($('<tr><\/tr>').append($('<td><\/td>').append(addButton)));
	}());

	this._element.append(table);

	this._element.find('button.delete').on('click', function (event) {
		var index = $(event.target).attr("data-index");
		that._readValues();
		that._values.splice(index, 1);
		that._refresh();
	});

	this._element.find('button.add').on('click', function (event) {
		that._readValues();
		that._values.push('');
		that._refresh();
	});

	this._element.find('select').on('change', function (event) {
		that._changed();
	});

	if (!suppressOnChange) {
		that._changed();
	}
};

CSLEDIT.MultiComboBox.prototype._changed = function () {
	if (typeof this._onChange !== "undefined") {
		this._readValues();
		this._onChange(this._values.join(' '));
	}
};
"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.propertyPanel = (function () {
	var onChangeTimeout,
		multiInputs,
		nodeData,
		enabledControlsOnTop = false;

	var inputAttributeRow = function (index, schemaAttribute, enabled) {
		var row, textInput;

		row = $('<tr><\/tr>');
		row.append($('<td><\/td>').append(label(index,schemaAttribute)));

		textInput = $('<input class="propertyInput"><\/input>');
		textInput.attr('id', inputId(index));

		if (!enabled) {
			textInput.attr('disabled', true);
		}
		row.append(textInput);

		return row;
	};

	var label = function (index, attribute) {
		var element = $('<label class="propertyLabel"><\/label>');
	   	element.attr('for', inputId(index));
		element.attr('id', labelId(index));
		element.html(attribute);

		return element;
	};
	
	var nodeChanged = function () {
		// TODO: assert check that persistent data wasn't changed in another tab, making
		//       this form data possibly refer to a different node

		// read user data
		$('[id^="nodeAttributeLabel"]').each( function () {
			var key, value, index;
			index = $(this).attr("id").replace(/^nodeAttributeLabel/, "");
			key = $(this).html();
			if ($("#nodeAttribute" + index).length > 0) {
				value = $("#nodeAttribute" + index).val();
			} else {
				value = multiInputs[index].val();
			}
			nodeData.attributes[index] = {
				key : key,
				value : value,
				enabled : nodeData.attributes[index].enabled
			};
		});

		CSLEDIT.controller.exec("amendNode", [nodeData.cslId, nodeData]);
	};

	var labelId = function (index) {
		return 'nodeAttributeLabel' + index;
	};

	var inputId = function (index) {
		return 'nodeAttribute' + index;
	};

	var setupPanel = function (panel, _nodeData, dataType, schemaAttributes) {
		var index,
			newAttributes = [],
			dropdownValues,
			attributes = _nodeData.attributes,
			attribute,
			schemaValues,
			valueIndex,
			intValue,
			allControls,
			enabledControls,
			disabledControls,
			thisRow,
			values,
			multiInput,
			table;

		nodeData = _nodeData;

		// remove child nodes
		panel.children().remove();

		// create new ones
		//$('<h3>' + nodeData.name + ' properties</h3><br \/>').appendTo(panel);
		// value editor (if a text or data element)
		if (dataType !== null) {
			$('<tr><td><label for="textNodeInput" id="textNodeInputLabel" class="propertyLabel">' +
				dataType + ' value<\/label><\/td>' + 
				'<td class="input"><input id="textNodeInput" class="propertyInput"><\/input><\/td><\/tr>').
				appendTo(panel);
		
			$("#textNodeInput").val(nodeData.textValue);
		}

		// TODO: data validation
		switch (dataType) {
		case null:
			// ignore - no data type
			break;
		case "anyURI":
			// text input with uri validation
			break;
		default:
			// no validation
		}

		newAttributes = [];

		enabledControls = [];
		disabledControls = [];
		allControls = [];
		values = [];
		multiInputs = {};

		// attribute editors
		index = -1;
		$.each(schemaAttributes, function (attributeName, schemaAttribute) {
			index++;
			attribute = null;
			$.each(attributes, function (i, thisAttribute) {
				if (thisAttribute.key === attributeName) {
					attribute = thisAttribute;
					if (!("enabled" in attribute)) {
						attribute["enabled"] = true;
					}
				}
			});
			if (attribute === null) {
				// create attribute if it doesn't exist
				attribute = { key : attributeName, value : "", enabled : false };
				attributes.push(attribute);
			}

			newAttributes.push(attribute);

			schemaValues = schemaAttribute.values;
			dropdownValues = [];

			if (schemaValues.length > 0) {
				for (valueIndex = 0; valueIndex < schemaValues.length; valueIndex++) {
					switch (schemaValues[valueIndex].type) {
					case "value":
						dropdownValues.push(schemaValues[valueIndex].value);
						break;
					case "data":
						switch (schemaValues[valueIndex].value) {
						case "boolean":
							dropdownValues.push("true");
							dropdownValues.push("false");
							break;
						case "integer":
							for (intValue = 0; intValue < 20; intValue++) {							
								dropdownValues.push(intValue);
							}
							break;
						case "language":
							/*
							dropdownValues.push("English");
							dropdownValues.push("etc... ");
							dropdownValues.push("(TODO: find proper list");*/
							break;
						default:
							console.log("WARNING: data type not recognised: " + 
								schemaValues[valueIndex].type);
						}
						break;
					default:
						assert(false, "attribute value type not recognised");
					}
				}
			}

			if (dropdownValues.length > 0) {
				thisRow = $('<tr><\/tr>');
				thisRow.append('<tr><td><label for=' + inputId(index) + ' id="' + labelId(index) + 
					'" class="propertyLabel">' + attributeName + '<\/label><\/td>');
				if (schemaAttribute.list) {
					multiInput = new CSLEDIT.MultiComboBox(
							$('<td class="input"><\/td>'), dropdownValues, function() {nodeChanged();});
					multiInput.val(attribute.value, true);
					
					if (!attribute.enabled) {
						multiInput.getElement().attr("disabled", true);
					}
					thisRow.append(multiInput.getElement());
					multiInputs[index] = multiInput;
				} else {
					thisRow.append((function () {
						var select, cell;
						select = $('<select id="' + inputId(index) + '" class="propertySelect" attr="' + 
							index + '"><\/select>');

						$.each(dropdownValues, function (i, value) {
							select.append("<option>" + value + "<\/option>");
						});
						
						cell = $('<td class="input"><\/td>').append(select)
						if (!attribute.enabled) {
							cell.attr('disabled', true);
						}
						
						return cell;
					}()));
				}
			} else {
				thisRow = inputAttributeRow(index, attributeName, attribute.enabled);
			}

			var toggleButton;
			toggleButton = $('<button class="toggleAttrButton" attrIndex="' + index + '"></button>');
			if (attribute.enabled) {
				toggleButton.html('Disable');
			} else {
				toggleButton.html('Enable');
			}
			thisRow.append($('<td><\/td>').append(toggleButton));
			
			if (attribute.enabled) {
				enabledControls.push(thisRow);
			} else {
				disabledControls.push(thisRow);
			}
			allControls.push(thisRow);

			values[index] = attribute.value;
		});
		
		table = $('<table>');
		if (enabledControlsOnTop) {
			for (index = 0; index < enabledControls.length; index++) {
				$(enabledControls[index]).appendTo(panel);
			}

			table.append($("<tr><td><br /><\/td><td><\/td><td><\/td><\/tr>"));

			// disabled controls
			for (index = 0; index < disabledControls.length; index++) {
				table.append($(disabledControls[index]));
			}
		} else {
			$.each(allControls, function (i, control) {
				table.append(control);
			});
		}
		panel.append(table);

		// set values
		for (index = 0; index < attributes.length; index++) {
			$("#" + inputId(index)).val(values[index]);
		}

		nodeData.attributes = newAttributes;

		$('<\/table>').appendTo(panel);
	
		$(".propertyInput").on("input", function () {
			clearTimeout(onChangeTimeout);
			onChangeTimeout = setTimeout(function () { nodeChanged(); }, 500);
		});

		$(".propertySelect").on("change", function () { nodeChanged(); });

		$('.toggleAttrButton').click( function (buttonEvent) {
			index = $(buttonEvent.target).attr("attrIndex");

			if (nodeData.attributes[index].enabled) {
				nodeData.attributes[index].enabled = false;
				$("#nodeAttribute" + index).attr("disabled", "disabled");
			} else {
				nodeData.attributes[index].enabled = true;
				$("#nodeAttribute" + index).removeAttr("disabled");
			}
			setupPanel(panel, nodeData, dataType, schemaAttributes, function () { nodeChanged(); });
			clearTimeout(onChangeTimeout);
			onChangeTimeout = setTimeout(function () { nodeChanged(); }, 10);
		});
	};
	
	return {
		setupPanel : setupPanel
	};
}());
"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.sortPropertyPanel = (function () {
	var onChangeTimeout, setupPanel, list, nodeData, panel,
		namesAttributeNames = [
			"names-min",
			"names-use-first",
			"names-use-last"
		];;
	
	// TODO: put into a common place - copied from src/smartTree.js
	var getAttr = function (attribute, attributes) {
		var index;

		for (index = 0; index < attributes.length; index++) {
			if (attributes[index].enabled && attributes[index].key === attribute) {
				return attributes[index].value;
			}
		}
		return "";
	};

	var sortableListUpdated = function () {
		// iterate through nodeData and the UI element noting the changes
		
		var index = 0,
			dragDirection = "unknown", // the direction the user dragged
			fromId,
			toPosition;

		list.children().each(function () {
			var variable, macro, childNode, visibleKey;

			if (index >= nodeData.children.length) {
				assertEqual(dragDirection, "down");
				toPosition = nodeData.children.length - 1;
				return false;
			}

			visibleKey = $(this).find('select.sortKey').val();
			childNode = nodeData.children[index];
			assertEqual(childNode.name, "key");

			if (visibleFieldName(
					getAttr("macro", childNode.attributes),
					getAttr("variable", childNode.attributes)) !==
				visibleKey) {

				if (dragDirection === "up") {
					fromId = childNode.cslId;
					return false;
				} else if (dragDirection === "down") {
					toPosition = index - 1;
					return false;
				} else if (visibleFieldName(
					getAttr("macro", nodeData.children[index+1].attributes),
					getAttr("variable", nodeData.children[index+1].attributes)) ===
					visibleKey)
				{
					// The next data element matches, so this is an deletion,
					// and the user dragged down.
					dragDirection = "down";
					fromId = childNode.cslId;
					index++;
				} else {
					// The next data element doesn't match, so this is an addition,
					// and the user dragged up.
					dragDirection = "up";
					toPosition = index;
					index--;
				}
			}
		
			index++;
		});

		if (dragDirection === "up" && typeof fromId === "undefined") {
			fromId = nodeData.children[index].cslId;
		}

		CSLEDIT.controller.exec("moveNode", [fromId, nodeData.cslId, toPosition]);
		nodeData = CSLEDIT.data.getNode(nodeData.cslId);
	};

	var visibleFieldName = function (macro, variable) {
		if (macro !== "" && typeof macro !== "undefined") {
			return "Macro: " + macro;
		} else {
			return variable;
		}
	};

	var attributesFromVisibleFieldName = function (visibleName) {
		var attributes = [];

		if (visibleName.indexOf("Macro: ") === 0) {
			attributes.push({
				key : "macro",
				value : visibleName.slice("Macro: ".length),
				enabled : true
			});
		} else {
			attributes.push({
				key : "variable",
				value : visibleName,
				enabled : true
			});
		}

		return attributes;
	};

	var getNamesAttributes = function () {
		var attributes = [];

		$.each(namesAttributeNames, function (i, name) {
			var val = panel.find("select." + name).val();

			if (val !== "0") {
				attributes.push({
					key : name,
					value : val,
					enabled : true
				});
			}
		});

		return attributes;
	};

	var getKeyNodeData = function (index) {
		var keyNode = new CSLEDIT.CslNode("key");

		keyNode.attributes = attributesFromVisibleFieldName(
			list.find('select.sortKey').eq(index).val());

		keyNode.attributes = keyNode.attributes.concat(getNamesAttributes());
		return keyNode;
	};

	var onInput = function () {
		var listElements = list.find('li'),
			childIndex,
			keyNode;
	
		childIndex = listElements.index($(this).parent());
		keyNode = nodeData.children[childIndex];
		assertEqual(keyNode.name, "key");

		CSLEDIT.controller.exec("amendNode", [keyNode.cslId, 
			getKeyNodeData(childIndex)]);
	};

	var onDelete = function () {
		var listElements = list.find('li'),
				childIndex,
				cslId;
		
			childIndex = listElements.index($(this).parent());

			cslId = CSLEDIT.data.getNode(nodeData.cslId).children[childIndex].cslId;
			listElements.eq(childIndex).remove();
			CSLEDIT.controller.exec('deleteNode', [cslId]);
	};

	setupPanel = function (_panel, _nodeData) {
		var table, macros, variables, index, addKeyButton, sortKeyHtml;

		panel = _panel;
		nodeData = _nodeData;

		// clear panel 
		panel.children().remove();

		// sortable list
		list = $('<ul class="sortKeys"><\/ul>');
		list.appendTo(panel);
		list.sortable({
			update : sortableListUpdated
		});

		variables = [];
		$.each(CSLEDIT.schema.attributes("sort/key").variable.values, function(i, variable) {
			variables.push(variable.value);
		});

		macros = [];
		$.each(CSLEDIT.data.getNodesFromPath("style/macro"), function(i, node) {
			assertEqual(node.attributes[0].key, "name");
			macros.push(node.attributes[0].value);
		});

		sortKeyHtml = '<li class="ui-state-default">';
		sortKeyHtml += '<span class="ui-icon ui-icon-arrowthick-2-n-s"><\/span> ';
		sortKeyHtml += '<select class="sortKey">';
		$.each(macros, function (i, macro) {
			sortKeyHtml += '<option macro="' + macro + '">Macro: ' + macro + '<\/option>';
		});
		$.each(variables, function (i, variable) {
			sortKeyHtml += '<option variable="' + variable + '">' + variable + '<\/option>';
		});
		sortKeyHtml += '<\/select>';
		sortKeyHtml += ' <button class="deleteSortKey">Delete<\/button>';
		sortKeyHtml += '<\/li>';

		$.each(nodeData.children, function(i, child) {
			var row = $(sortKeyHtml),
				select,
				macro,
				variable;
			
			select = row.find("select.sortKey");
			assertEqual(select.length, 1);

			select.val(visibleFieldName(
				getAttr("macro", child.attributes),
				getAttr("variable", child.attributes)));

			list.append(row);
		});

		list.find('button.deleteSortKey').on('click', onDelete);

		list.find('select').on('change', onInput /*function () {
			var listElements = list.find('li'),
				childIndex,
				keyNode;
		
			childIndex = listElements.index($(this).parent());
			keyNode = nodeData.children[childIndex];
			assertEqual(keyNode.name, "key");

			CSLEDIT.controller.exec("amendNode", [keyNode.cslId, 
				getKeyNodeData(childIndex)]);
		}*/);

		addKeyButton = $('<button>Add key<\/button>');
		addKeyButton.on('click', function () {
			var selectNodes;

			CSLEDIT.controller.exec('addNode', [nodeData.cslId, "last",
				new CSLEDIT.CslNode('key', 
					[{
						key : "variable",
						value : "author",
						enabled : true
					}])]);

			list.append(sortKeyHtml);
			selectNodes = list.find('select');
			selectNodes.on('change', onInput);
			selectNodes.last().val("author");

			list.find('button.deleteSortKey').last().on('click', onDelete);
		});
		panel.append(addKeyButton);
		panel.append('<br \/><br \/>');

		(function () {
			var select;

			// TODO: only enable if sort keys contain a names element
			select = $('<select class="names-min"><\/select>');
			for(index = 0; index < 20; index++) {
				$('<option>' + index + '<\/option>').appendTo(select);
			}
			$('<label>Names-min: <\/label>').appendTo(panel);
			select.appendTo(panel);
			panel.append(' ');

			select = $('<select class="names-use-first"><\/select>');
			for(index = 0; index < 20; index++) {
				$('<option>' + index + '<\/option>').appendTo(select);
			}
			$('<label>Names-use-first: <\/label>').appendTo(panel);
			select.appendTo(panel);
			panel.append(' ');
			
			select = $('<select class="names-use-last"><\/select>');
			for(index = 0; index < 20; index++) {
				$('<option>' + index + '<\/option>').appendTo(select);
			}
			$('<label>Names-use-last: <\/label>').appendTo(panel);
			select.appendTo(panel);

			panel.find('select[class^="names"]').on('change', function () {
				// update all keys with names attrs
				// TODO: only add names attrs to keys containing names
				var namesAttributes = getNamesAttributes(),
					index;

				for (index = 0; index < nodeData.children.length; index++) {

				}

				$.each(nodeData.children, function (index, keyNode) {
					assertEqual(keyNode.name, "key");
					CSLEDIT.controller.exec("amendNode", [keyNode.cslId, getKeyNodeData(index)]);
				});
			});
		}());
	};

	return {
		setupPanel : setupPanel
	};
}());
"use strict";

CSLEDIT = CSLEDIT || {};

CSLEDIT.infoPropertyPanel = (function () {
	var panel, infoNode, inputTimeout;

	var layout = [
		{ name : "Title", node : "title" },
		{ name : "Title (short)", node : "title-short" },
		{ name : "Id", node : "id" },
		{ name : "Summary", node : "summary" },
		{ name : "Rights", node : "rights" },
		{ name : "Published", node : "published" },
		{ name : "ISSNL", node : "issnl" },
		{ name : "eISSN", node : "eissn" },
		{ name : "ISSN", node : "issn" },
		{ name : "Link", node : "link" },
		{ name : "Author", node : "author" },
		{ name : "Contributor", node : "contributor" },
		{ name : "Category", node : "category" }
	];

	var pluralise = function (noun) {
		if (noun[noun.length - 1] === "y") {
			return noun.replace(/y$/, "ies");
		} else {
			return noun + "s";
		}
	};

	// TODO: could probably get some of this info from the schema
	var multipleNodes = ["link","author","contributor","category"];
	var attributeNodes = ["link", "category"];
	var nameNodes = ["author", "contributor"];

	var attributeEditorRow = function (item, node, attributes) {
		var thisRow = $('<div><\/div>');
		$.each(attributes, function (name, value) {
			var input, attribute, value;
			thisRow.append(' <label>' + name + '<\/label> ');

			attribute = CSLEDIT.data.getAttrByName(node.attributes, name);

			value = "";
			if (attribute !== null) {
				value = attribute.value;
			}
			
			input = createInput(item.node, node, name, value);
			thisRow.append(input);
		});
		return thisRow;
	};

	var createInput = function (nodeName, node, type, value, parentCslId) {
		var input = $('<input><\/input>');
		if (typeof node === "undefined" || node === null) {
			if (typeof parentCslId === "undefined") {
				input.attr("parentcslid", infoNode.cslId);
			} else {
				input.attr("parentcslid", parentCslId);
			}
		} else {
			input.attr("cslid", node.cslId);
		}
		input.attr("type", type);
		input.attr("nodename", nodeName);
		input.val(value);
		input.on('input', onInput);

		return input;
	};

	var onInput = function () {
		var $this = $(this);

		clearTimeout(inputTimeout);
		inputTimeout = setTimeout(function () {
			var cslId,
				parentId,
				type,
				nodeName,
				thisNode,
				index,
				parentNode,
				numNodesInParent;

			cslId = parseInt($this.attr("cslid"));
			parentId = parseInt($this.attr("parentcslid"));
			type = $this.attr("type");
			nodeName = $this.attr("nodename");

			thisNode = new CSLEDIT.CslNode(nodeName);
			if (!isNaN(cslId)) {
				thisNode.copy(CSLEDIT.data.getNode(cslId));
			}

			if (type === "textValue") {
				thisNode.textValue = $this.val();
			} else {
				thisNode.setAttr(type, $this.val()); 
			}

			if (isNaN(cslId)) {
				CSLEDIT.controller.exec('addNode', [parentId, "last", thisNode]);
				parentNode = CSLEDIT.data.getNode(parentId);
				numNodesInParent = CSLEDIT.data.numNodes(parentNode);

				//setupPanel(panel);
				// update all cslids
				$.each(["cslid", "parentcslid"], function (i, attribute) {
					panel.find('input[' + attribute + ']').each(function() {
						var $this = $(this),
							cslId;
					
						cslId = parseInt($this.attr(attribute));

						if (cslId >= parentId + numNodesInParent) {
							$this.attr(attribute, cslId + 1);
						}
					});
				});

				// set added node cslid
				$this.removeAttr("parentcslid");
				$this.attr("cslid", parentId + numNodesInParent);
			} else {
				CSLEDIT.controller.exec('amendNode', [cslId, thisNode]);
			}
		}, 500);
	};

	var textValueEditorRow = function (item, node) {
		var thisRow, value = "";

		thisRow = $('<div><\/div>');
		thisRow.append(' <label>' + item.name + '<\/label> ');

		if (typeof node !== "undefined") {
			value = node.textValue;
		}
		thisRow.append(createInput(item.node, node, "textValue", value));
		return thisRow;
	};

	var nameEditorRow = function (item, cslNode) {
		var thisRow, children, input, cslChildren;
	   
		thisRow = $('<div><\/div>');
		children = CSLEDIT.schema.childElements("info/author");

		cslChildren = {};
		$.each(cslNode.children, function (i, actualChild) {
			cslChildren[actualChild.name] = actualChild;
		});

		$.each(children, function (child, unused) {
			var value = "";

			thisRow.append(' <label>' + child + '<\/label> ');
			//input = $('<input class="' + item.node + '-' + child + '"><\/input>');

			if (child in cslChildren) {
				value = cslChildren[child].textValue;
			}
			input = createInput(child, cslChildren[child], "textValue", value, cslNode.cslId);
			thisRow.append(input);
		});
		return thisRow;
	};

	var editorRow = function (item, node, attributes) {
		if (attributeNodes.indexOf(item.node) >= 0) {
			return attributeEditorRow(item, node, attributes);
		} else if (nameNodes.indexOf(item.node) >=0) {
			return nameEditorRow(item, node);
		} else {
			return textValueEditorRow(item, node);
		}
	};

	// It's assumed that infoNode will always refer to the correct node
	// while the panel is visible
	var setupPanel = function (_panel) {
		panel = _panel;
		infoNode = CSLEDIT.data.getNodesFromPath("style/info");
		assertEqual(infoNode.length, 1);
		infoNode = infoNode[0];

		panel.children().remove();
		//panel.append('<h3>Style Info<\/h3>');

		$.each(layout, function (i, item) {
			var nodes = CSLEDIT.data.getNodesFromPath("info/" + item.node, infoNode);;
			var attributes, deleteButton, addButton, value, thisRow,
				table,
				titleRow, inputRow;
			
			if (multipleNodes.indexOf(item.node) >= 0) {
				attributes = CSLEDIT.schema.attributes("info/" + item.node);
				panel.append('<h4>' + pluralise(item.name) + '<\/h4>');
				table = $("<table><\/table>");
				$.each(nodes, function (i, node) {
					thisRow = editorRow(item, node, attributes);

					// convert 1st thisRow into table title
					if (typeof titleRow === "undefined") {
						titleRow = $('<tr><\/tr>');
						thisRow.find('label').each(function () {
							titleRow.append($('<td><\/td>').append($(this)));
						});
						table.append(titleRow);
					}
					
					// convert thisRow into table row
					inputRow = $('<tr><\/tr>');
					thisRow.find('input').each(function () {
						inputRow.append($('<td><\/td>').append($(this)));
					});

					deleteButton = $('<button>Delete<\/button>');
					deleteButton.on('click', function () {
						CSLEDIT.controller.exec("deleteNode", [node.cslId]);
						setupPanel(panel);
					});

					inputRow.append($('<td><\/td>').append(deleteButton));
					table.append(inputRow);
				});

				panel.append(table);
				
				addButton = $('<button>Add ' + item.name + '<\/button>');
				panel.append(addButton);

				addButton.on('click', function () {
					CSLEDIT.controller.exec("addNode",
						[infoNode.cslId, "last", new CSLEDIT.CslNode(item.node)]);
					setupPanel(panel);
				});
				panel.append('<br \/><br \/>');
			} else {
				assert(nodes.length < 2);
				thisRow = editorRow(item, nodes[0], null);

				// TODO: do this in less hacky way
				panel.css("position", "relative");
				thisRow.children('input').eq(0).css("position", "absolute");
				thisRow.children('input').eq(0).css("left", "100px");
				thisRow.children('label').eq(0).css("line-height", "1.5");
				panel.append(thisRow);
			}
		});

	};

	return {
		setupPanel : setupPanel
	};
}());
"use strict";

CSLEDIT = CSLEDIT || {};

// A button which opens the property panel for a given CSL node,
// or if the node doesn't yet exist, creates it

CSLEDIT.EditNodeButton = function (element, nodePath, cslId, icon, selectNodeCallback) {
	var that = this;
	assert(this instanceof CSLEDIT.EditNodeButton);

	this._element = element;
	this.nodePath = nodePath;
	this.cslId = cslId; // if -1, means the node doesn't yet exist, in which case clicking the button
	                    // will trigger creation of the relevant nodePath
	this.icon = icon;
	this.selectNodeCallback = selectNodeCallback;

	element.click(function () {
		if (that.cslId === -1) {
			CSLEDIT.controller.exec("addPath", [nodePath]);
		} else {
			selectNodeCallback(that.cslId, that);
		}
	});
	this.updateButton();
};

CSLEDIT.EditNodeButton.prototype.getSelectedNodePath = function () {
	return [this.cslId];
};

CSLEDIT.EditNodeButton.prototype.updateButton = function (){
	this._element.html('<img class="cslPropertyButton" src="' + this.icon + '" \/>');
};

CSLEDIT.EditNodeButton.prototype.addNode = function (parentId, position, newNode, nodesAdded) {
	var pathNodes;

	// shift the id if neccessary
	if (this.cslId >= newNode.cslId) {
		this.cslId += nodesAdded;
	} else if (this.cslId === -1) {
		// check if this node has been added and if so link it
		pathNodes = CSLEDIT.data.getNodesFromPath(this.nodePath);
		if (pathNodes.length > 0) {
			assertEqual(pathNodes.length, 1);
			this.cslId = pathNodes[0].cslId;
			this.selectNodeCallback(this.cslId, this);
		}
	} else {
		return;
	}
	this.updateButton();
};

CSLEDIT.EditNodeButton.prototype.deleteNode = function (id, nodesDeleted) {
	if (this.cslId >= id + nodesDeleted) {
		// shift the id 
		this.cslId -= nodesDeleted;
	} else if (this.cslId >= id && this.cslId < id + nodesDeleted) {
		// this node falls within the deleted block
		//assert(false, "shouldn't be allowed to delete an EditNodeButton node");
		this.cslId = -1;
	} else {
		return;
	}
	this.updateButton();
};
"use strict";

CSLEDIT = CSLEDIT || {};

CSLEDIT.SmartTree = function (treeElement, nodePaths, enableMacroLinks /*optional*/) {
	var nodeTypes = {
			"valid_children" : [ "root" ],
			"types" : {
				"text" : {
					"icon" : {
						"image" : "../external/famfamfam-icons/style.png"
					}
				},
				"macro" : {
					"icon" : {
						"image" : "../external/famfamfam-icons/brick.png"
					}
				},
				"info" : {
					"icon" : {
						"image" : "../external/famfamfam-icons/information.png"
					}
				},
				"choose" : {
					"icon" : {
						"image" : "../external/fugue-icons/question-white.png"
					}
				},
				"date" : {
					"icon" : {
						"image" : "../external/famfamfam-icons/date.png"
					}
				},
				"style" : {
					"icon" : {
						"image" : "../external/famfamfam-icons/cog.png"
					}
				},
				"citation" : {
					"icon" : {
						"image" : "../external/famfamfam-icons/page_white_edit.png"
					}
				},
				"bibliography" : {
					"icon" : {
						"image" : "../external/famfamfam-icons/text_list_numbers.png"
					}
				},
				"sort" : {
					"icon" : {
						"image" : "../external/fugue-icons/sort-alphabet.png"
					}
				},
				"number" : {
					"icon" : {
						"image" : "../external/fugue-icons/edit-number.png"
					}
				},
				"layout" : {
					"icon" : {
						"image" : "../external/famfamfam-icons/page_white_stack.png"
					}
				},
				"group" : {
					"icon" : {
						"image" : "../external/famfamfam-icons/page_white_stack.png"
					}
				}
			}
		},
		ranges,
		macroLinks, // like symlinks for macros
		            // [{ instanceCslId: ?, macroRange: ?}]
		callbacks,
		verifyAllChanges = false; // does a complete check against CSLEDIT.data after
		                          // every change for debugging

	var setCallbacks = function (_callbacks) {
		callbacks = _callbacks;
	};
	
	var getAttr = function (attribute, attributes) {
		var index;

		for (index = 0; index < attributes.length; index++) {
			if (attributes[index].enabled && attributes[index].key === attribute) {
				return attributes[index].value;
			}
		}
		return "";
	};

	// Check the tree matches the data - for testing and debugging
	var verifyTree = function () {
		var cslData = CSLEDIT.data.get();

		if (verifyAllChanges) {
			console.time("verifyTree");
			// Check for inconsistencies with CSLEDIT.data
			treeElement.find('li[cslid]').each(function () {
				var $this = $(this),
					cslId;

				cslId = parseInt($this.attr('cslid'));
				assertEqual(CSLEDIT.data.getNode(cslId, cslData).name, $this.attr('rel'));
			});

			// Can't have non-macrolink nodes as children of a text node
			assertEqual(treeElement.find('li[cslid][rel=text] li[macrolink!=true]').length, 0);
			console.timeEnd("verifyTree");
		}
	};

	var displayNameFromMetadata = function (metadata) {
		var index,
			attributesString = "",
			attributesStringList = [],
			displayName,
			macro;

		switch (metadata.name) {
			case "macro":
				displayName = "Macro: " + getAttr("name", metadata.attributes);
				break;
			case "text":
				macro = getAttr("macro", metadata.attributes);
				if (macro !== "") {
					displayName = "Text (macro): " + macro;
				} else {
					displayName = "Text";
				}
				break;
			case "citation":
				displayName = "Inline Citations";
				break;
			case "bibliography":
				displayName = "Bibliography";
				break;
			default:
				displayName = metadata.name;
		}

		return displayName;
	};

	var createTree = function () {
		var jsTreeData;

		jsTreeData = jsTreeDataFromCslData(nodePaths);

		treeElement.on("loaded.jstree", function () {
			// set up range root nodes
			$.each(ranges, function (index, range) {
				range.rootNode = treeElement.children('ul').children(
					'li[cslid=' + range.first + ']');
				assertEqual(range.rootNode.length, 1);
			});
			callbacks.loaded();

			verifyTree();
		});
		treeElement.on("select_node.jstree", function (event, ui) {
			treeElement.jstree("set_focus");
			callbacks.selectNode(event, ui);
		});

		treeElement.jstree({
			"json_data" : { data : jsTreeData },
			"types" : nodeTypes,
			"plugins" : ["themes","json_data","ui", "crrm", "dnd", /*"contextmenu",*/
				"types", "hotkeys"],
			//"core" : { "initially_open" : [ "node1" ] },
			"ui" : { /*"initially_select" : [ "cslTreeNode0" ],*/ "select_limit" : 1 },
			"dnd" : {
				"open_timeout" : 800,
				"move_requested" : callbacks.moveNode
			},
			"crrm" : {
				"move" : {
					// only allow re-ordering, not moving to different nodes
					"check_move" : function (move) {
						return callbacks.checkMove(
							parseInt(move.o.attr("cslid")), parseInt(move.r.attr("cslid")), move.p);
					}
				}
			},
			"hotkeys" : {
				"del" : callbacks.deleteNode,
				"f2" : false
			}
			
		});
	};
	
	var jsTreeDataFromCslData = function (nodePaths) {
		var cslNodes = [],
			jsTreeData = [],
			cslData = CSLEDIT.data.get();

		ranges = [];
		macroLinks = [];

		$.each(nodePaths, function (i, path) {
			var nodes = CSLEDIT.data.getNodesFromPath(path, cslData);
			cslNodes = cslNodes.concat(nodes);
		});

		$.each(cslNodes, function (i, node) {
			var lastCslId = [ -1 ],
				firstCslId = node.cslId;
			jsTreeData.push(jsTreeDataFromCslData_inner(node, lastCslId));
			ranges.push({
				first : firstCslId,
				last : lastCslId[0]
			});
		});

		return jsTreeData;
	};

	var jsTreeDataFromCslData_inner = function (cslData, lastCslId, macroLink) {
		var index,
			children = [],
			cslNodes = [],
			thisCslData,
			macro;

		if (typeof cslData.cslId === "undefined") {
			cslData.cslId = -1;
		}
		cslData.children = cslData.children || [];

		if (cslData.cslId > lastCslId[0]) {
			lastCslId[0] = cslData.cslId;
		}

		for (index = 0; index < cslData.children.length; index++) {
			children.push(jsTreeDataFromCslData_inner(
				cslData.children[index], lastCslId, macroLink));
		}

		var jsTreeData = {
			data : displayNameFromMetadata(cslData),
			attr : {
				rel : cslData.name,
				cslid : cslData.cslId,
			},
			children : children
		};

		if (typeof macroLink !== "undefined") {
			jsTreeData.attr.macrolink = macroLink;
		}

		if (enableMacroLinks) {
			// Add 'symlink' to Macro
			macro = getAttr("macro", cslData.attributes);
			if (cslData.name === "text" && macro !== "") {
				addMacro(jsTreeData, cslData, macro);
			}
		}

		return jsTreeData;
	};

	var addMacro = function (jsTreeData, cslNode, macroName) {
		var macroNodes,
			macroNode,
			lastCslId,
			index;

		// delete any existing macroLinks
		for (index = 0; index < macroLinks.length; index++) {
			if (macroLinks[index].instanceCslId === cslNode.cslId) {
				macroLinks.splice(index, 1);
				index--;
			}
		};

		// find the macro node:
		macroNodes = CSLEDIT.data.getNodesFromPath("style/macro");

		$.each(macroNodes, function (i, node) {
			if (getAttr("name", node.attributes) === macroName) {
				macroNode = node;
				return false;
			}
		});

		if (typeof macroNode === "undefined") {
			console.log('WARNING: macro "' + macroName + '" doesn\'t exist');
			return;
		}
		
		lastCslId = [macroNode.cslId];
		
		// add the macro's children to this node
		$.each(macroNode.children, function (i, childNode) {
			jsTreeData.children.push(jsTreeDataFromCslData_inner(childNode, lastCslId, true));
		});

		macroLinks.push({
			instanceCslId : cslNode.cslId, 
			first: macroNode.cslId, last: lastCslId[0] });
	};

	var selectedNode = function () {
		var selected,
			cslid;

		selected = treeElement.jstree('get_selected'),
		cslid = parseInt(selected.attr("cslid"));
		return cslid;
	};

	var expandNode = function (id) {
		treeElement.jstree("open_node", 'li[cslid=' + id + ']');
	};

	var rangeIndex = function (id) {
		var result = -1,
			index = 0;	

		$.each(ranges, function (i, range) {
			if (id >= range.first && id <= range.last) {
				result = index;
				return false; // to jump out of the $.each() loop
			}
			index++;
		});

		return result;
	};

	var macroLinksShiftCslIds = function (id, nodesAdded) {
		treeElement.find('li[cslid][macrolink="true"]').each(function () {
			var $this = $(this),
				cslId;
			
			cslId = parseInt($this.attr('cslid'));
			if (cslId >= id) {
				$this.attr('cslid', cslId + nodesAdded);
			}
		});

		$.each(macroLinks, function (i, macroLink) {
			if (macroLink.first >= id) {
				macroLink.first += nodesAdded;
			}
			if (macroLink.last >= id) {
				macroLink.last += nodesAdded;
			}
		});
	};
		
	var macroLinksAddNode = function (parentId, position, newNode, nodesAdded) {
		var id = newNode.cslId,
			parentNodes;

		// Shift references to the macro definition
		macroLinksShiftCslIds(id, nodesAdded);

		// TODO: check if new node is a macro instance
		parentNodes = treeElement.find('li[cslid=' + parentId + '][macrolink="true"]');

		// shift references to the instance cslIds
		$.each(macroLinks, function (i, macroLink) {
			if (macroLink.instanceCslId >= id) {
				macroLink.instanceCslId += nodesAdded;
			}
		});

		// Add macro node children to all instances
		$.each(macroLinks, function(i, macroLink) {
			if (macroLink.first === parentId) {
				parentNodes = parentNodes.add(
					treeElement.find('li[cslid=' + macroLink.instanceCslId + ']'));
				assert(parentNodes.length > 0);
			}
		});

		
		parentNodes.each(function () {
			createSubTree($(this), position,
				jsTreeDataFromCslData_inner(newNode, [id], true));
		});
	};

	var macroLinksDeleteNode = function (nodeId, nodesDeleted) {
		var index,
			macroLink;
		
		treeElement.find('li[cslid=' + nodeId + '][macrolink="true"]').each( function () {
			treeElement.jstree('remove', $(this));
		});

		// Delete macro node children from all instances
		for (index = 0; index < macroLinks.length; index++) {
			macroLink = macroLinks[index];

			if (macroLink.instanceCslId === nodeId) {
				macroLinks.splice(index, 1);
				break;
			}
			if (macroLink.first === nodeId) {
				console.log("WARNING: macro deleted, leaving broken instance links");
				// remove all children
				treeElement.find('li[cslid=' + macroLink.instanceCslId + '][macrolink!=true]').
					each(function () {
						$.jstree._reference(treeElement)._get_children($(this)).each(function () {
							treeElement.jstree('remove', $(this));
						});
				});

				// clean up macroLinks array:
				macroLinks.splice(index, 1);
				index--;
			}
		}
		
		macroLinksShiftCslIds(nodeId + nodesDeleted, -nodesDeleted);
		// shift references to the instance cslIds
		$.each(macroLinks, function (i, macroLink) {
			if (macroLink.instanceCslId >= nodeId + nodesDeleted + 1) {
				macroLink.instanceCslId -= nodesDeleted;
			}
		});
	};

	var macroLinksUpdateNode = function (id, _amendedNode) {
		var amendedNode = new CSLEDIT.CslNode(""),
			macroName,
			jsTreeData = {children: [], attr: [], data: ""};
			
		amendedNode.copy(_amendedNode);

		macroName = amendedNode.getAttr("macro");
		if (amendedNode.name === "text" && macroName !== "") {
			addMacro(jsTreeData, amendedNode, macroName);

			treeElement.find('[cslid=' + amendedNode.cslId + ']').each( function () {
				var $this = $(this);
				// remove all children
				$.jstree._reference(treeElement)._get_children($this).each(function () {
					treeElement.jstree('remove', $(this));
				});
				// create new children
				$.each(jsTreeData.children, function (i, child) {
					createSubTree($this, i, child);
				});
			});
		}
	};

	var addNode = function (parentId, position, newNode, nodesAdded) {
		var id,	parentNode,	thisRangeIndex,	currentCslId, range,
			matchingCslNodes, newTreeNode;

		id = newNode.cslId;

		// note: no two ranges are expected to have the same parent id
		thisRangeIndex = rangeIndex(parentId);

		// shift ranges
		$.each(ranges, function (index, range) {
			shiftCslIds(range, id, nodesAdded);
			
			// if adding to the end of a range, expand the range
			if (thisRangeIndex === index && id > range.last) {
				range.last += nodesAdded;
			}
		});

		if (enableMacroLinks) {
			macroLinksAddNode(parentId, position, newNode, nodesAdded);
		}

		if (thisRangeIndex === -1) {
			matchingCslNodes = [];
			// check if the new node belongs to this smartTree
			$.each(nodePaths, function (i, path) {
				matchingCslNodes = matchingCslNodes.concat(CSLEDIT.data.getNodesFromPath(path));
			});

			$.each(matchingCslNodes, function (i, node) {
				var lastCslId = [-1];
				if (node.cslId === newNode.cslId) {
					var newJsTreeNode;
					newJsTreeNode = jsTreeDataFromCslData_inner(newNode, lastCslId);
					createSubTree(ranges[ranges.length-1].rootNode, "after", newJsTreeNode);

					var newTreeNode = treeElement.find('li[cslid="' + newNode.cslId + '"]');
					ranges.push({
						first : newNode.cslId,
						last : newNode.cslId + CSLEDIT.data.numNodes(newNode) - 1,
						rootNode : newTreeNode
					});
					
					return false;
				}
			});

			return;
		}
		range = ranges[thisRangeIndex];

		parentNode = treeElement.find('li[cslid="' + parentId + '"][macrolink!="true"]');
		assertEqual(parentNode.length, 1);
		
		createSubTree(parentNode, position, jsTreeDataFromCslData_inner(newNode, [id]));

		macroLinksUpdateNode(newNode.cslId, newNode);
		
		verifyTree();
	};

	var totalCreateNodeTime = 0;

	// needed because "create_node" doesn't allow adding nodes with children
	var createSubTree = function (parentNode, position, jsTreeData) {
		var newNode;

		newNode = treeElement.jstree('create_node', parentNode, position, 
			{
				data : jsTreeData.data
				// attr : jsTreeData.attr
				// Don't know why, but 'create_node' fails if including a
				// 'ref' attribute on a root node. It works to just add the
				// attribute later though
			});
		newNode.attr(jsTreeData.attr);

		$.each(jsTreeData.children, function (i, child) {
			createSubTree(newNode, i, child);
		});
	};

	var shiftCslIds = function (range, fromId, amount) {
		var cslId;

		if (range.first >= fromId) {
			range.rootNode.attr("cslid", parseInt(range.rootNode.attr("cslid")) + amount);
			range.rootNode.find('li[cslid][macroLink!="true"]').each( function () {
				cslId = parseInt($(this).attr("cslid"));
				assert(cslId <= range.last);
				if (cslId >= range.first) {
					$(this).attr("cslid", cslId + amount);
				}
			});
			
			range.first += amount;
			range.last += amount;
		} else if (range.last >= fromId) {
			range.rootNode.find('li[cslid][macroLink!="true"]').each( function () {
				cslId = parseInt($(this).attr("cslid"));
				assert(cslId <= range.last);
				if (cslId >= fromId) {
					$(this).attr("cslid", cslId + amount);
				}
			});
			range.last += amount;
		}
	};

	var deleteNode = function (id, nodesDeleted) {
		var node,
			thisRangeIndex = rangeIndex(id),
			allNodes,
			currentCslId,
			range;

		// shift ranges, except for ones containing the deleted node
		$.each(ranges, function (index, range) {
			if (thisRangeIndex !== index) {
				shiftCslIds(range, id + nodesDeleted, -nodesDeleted);
			}
		});

		if (enableMacroLinks) {
			macroLinksDeleteNode(id, nodesDeleted);
		}

		if (thisRangeIndex === -1) {
			return;
		}
		range = ranges[thisRangeIndex];

		if (id === range.first) {
			ranges.splice(thisRangeIndex, 1);

			treeElement.jstree("remove", range.rootNode);

		} else { // update range
			node = treeElement.find('li[cslid="' + id + '"][macrolink!="true"]');
			assert(node.length > 0);
			assert(id !== 0);

			treeElement.jstree("remove", node);

			// shift this range
			shiftCslIds(range, id + nodesDeleted, -nodesDeleted);
		}

		verifyTree();
	};

	var amendNode = function (id, amendedNode) {
		var thisRangeIndex = rangeIndex(id),
			node;

		if (thisRangeIndex === -1) {
			return;
		}

		var node = treeElement.find('li[cslid="' + id + '"]');
		treeElement.jstree('rename_node', node, displayNameFromMetadata(amendedNode));
		
		if (enableMacroLinks) {
			macroLinksUpdateNode(amendedNode.cslId, amendedNode);
		}
		
		verifyTree();
	};

	var getSelectedNodePath = function () {
		var selectedNodes = [],
			treeNode,
			cslId;

		treeNode = treeElement.jstree('get_selected'),
		cslId = treeNode.attr("cslid");

		while (typeof cslId !== "undefined") {
			selectedNodes.splice(0,0,parseInt(cslId));
			
			treeNode = treeNode.parent().parent();
			cslId = treeNode.attr("cslid");
		}

		return selectedNodes;
	};

	return {
		createTree : createTree,
		deselectAll : function () {
			treeElement.jstree("deselect_all");
		},
		selectedNode : selectedNode,
		expandNode : expandNode,
		addNode : addNode,
		deleteNode : deleteNode,
		amendNode : amendNode,

		shiftCslIds : shiftCslIds,

		setCallbacks : setCallbacks,

		setVerifyAllChanges : function (verify) {
			verifyAllChanges = verify;
		},

		getRanges : function () {
			return ranges;
		},
		getMacroLinks : function () {
			return macroLinks;
		},
		getSelectedNodePath : getSelectedNodePath
	};
};
"use strict";

CSLEDIT = CSLEDIT || {};

CSLEDIT.Titlebar = function (element) {
	this.element = element;

	this.titleNode = this.getTitleNode();
	if (this.titleNode === null) {
		this.cslId = -1;
	} else {
		this.cslId = this.titleNode.cslId;
	}
	this.displayTitle();
};

CSLEDIT.Titlebar.prototype.displayTitle = function () {
	var title;

	if (this.titleNode === null) {
		title = "No title";
	} else {
		title = this.titleNode.textValue;
	}
	this.element.html("<h3>Style Title: " + title + "<\/h3>");
};

CSLEDIT.Titlebar.prototype.getTitleNode = function () {
	var titleNode;

	titleNode = CSLEDIT.data.getNodesFromPath("style/info/title");

	if (titleNode.length > 0) {
		assert (titleNode.length < 2);
		return titleNode[0];
	}
	
	return null;
};

CSLEDIT.Titlebar.prototype.addNode = function (id, position, node, numAdded) {
	if (this.cslId > -1) {
		return;
	}

	this.titleNode = this.getTitleNode();
	this.cslId = this.titleNode.cslId;
	this.displayTitle();
};

CSLEDIT.Titlebar.prototype.deleteNode = function (id, numDeleted) {
	this.titleNode = this.getTitleNode();
	this.displayTitle();

	if (this.titleNode === null) {
		this.cslId = -1;
	}
};

CSLEDIT.Titlebar.prototype.amendNode = function (id, amendedNode) {
	if (id === this.cslId) {
		this.titleNode = amendedNode;
		this.displayTitle();
	}
};
"use strict";

CSLEDIT = CSLEDIT || {};

CSLEDIT.ViewController = function (treeView, titlebarElement) {
	var	// smartTrees display a subset of the proper CSL tree
		// and allow transformations of the data
		//
		// name : visible name
		// nodeData : displayed in property panel
		// children : displayed in tree view as children
		smartTreeSchema = [
			{
				id : "citations",
				name : "Inline Citations",
				nodePaths : ["style/citation/layout"],
				macroLinks : true,
				buttons : [
				{
					type : "cslNode",
					icon : "../external/famfamfam-icons/cog.png",
					node : "style/citation"
				},
				{
					type : "cslNode",
					icon : "../external/fugue-icons/sort-alphabet.png",
					node : "style/citation/sort"
				}
				]
			},
			{
				id : "bibliography",
				name : "Bibliography",
				nodePaths : ["style/bibliography/layout"],
				macroLinks : true,
				buttons : [
				{
					type : "cslNode",
					icon : "../external/famfamfam-icons/cog.png",
					node : "style/bibliography"
				},
				{
					type : "cslNode",
					icon : "../external/fugue-icons/sort-alphabet.png",
					node : "style/bibliography/sort"
				}
				]
			},/*
			{
				id : "macro",
				name : "Macros",
				nodePaths : ["style/macro"],
				buttons : [
				{
					type : "custom",
					text : "Add macro",
					onClick : function () {
						// add after the last macro
						var macroNodes = CSLEDIT.data.getNodesFromPath("style/macro"),
							position;

						position = CSLEDIT.data.indexOfChild(macroNodes[macroNodes.length - 1],
							CSLEDIT.data.getNodesFromPath("style")[0]);
						
						CSLEDIT.controller.exec("addNode",
							[
								0, position + 1, 
								new CSLEDIT.CslNode("macro", [{
									key: "name",
									value: "New Macro",
									enabled: true
								}])
							]);
					}
				}
				]
			},*/
			{
				id : "locale",
				name : "Advanced",
				macroLinks : false,
				nodePaths : ["style"]
			}
		],
		views = [],
		treesLoaded = 0,
		treesToLoad = 0,
		callbacks,
		selectedTree = null,
		formatCitationsCallback,
		selectedNodeId = 0,
		nodeButtons;

	var treeLoaded = function () {
		treesLoaded++;

		if (treesLoaded === treesToLoad) {
			callbacks.loaded();
		};
	};

	var init = function (cslData, _callbacks) {
		var eventName,
			jsTreeData,
			citationNodeId,
			citationNodeData,
			citationTree,
			cslId,
			nodes,
			table,
			row;

		views = [];

		views.push(new CSLEDIT.Titlebar(titlebarElement));

		callbacks = _callbacks;

		nodeButtons = [];
		
		treeView.html('');
		$.each(smartTreeSchema, function (index, value) {
			table = $('');//<table><\/table>');
			row = $('');//<tr><\/tr>');
			if (typeof value.buttons !== "undefined") {
				//$('<td>&nbsp;&nbsp;&nbsp;<\/td>').appendTo(row);

				$.each(value.buttons, function (i, button) {
					var buttonElement;
					switch (button.type) {
						case "cslNode":
							nodes = CSLEDIT.data.getNodesFromPath(button.node, cslData);
							if (nodes.length > 0) {
								cslId = nodes[0].cslId;
							} else {
								cslId = -1;
							}
				
							buttonElement = $('<div class="cslNodeButton"><\/div>');
							views.push(new CSLEDIT.EditNodeButton(buttonElement, button.node, cslId,
								button.icon, function (cslId, selectedView) {
									selectedTree = selectedView;
									selectedNodeId = cslId;

									// deselect nodes in trees
									$.each(views, function (i, view) {
										if ("deselectAll" in view) {
											view.deselectAll();
										}
									});

									callbacks.selectNode();
								}));
							break;
						case "custom":
							buttonElement = $('<button class="customButton">' + 
									button.text + '<\/button>');
							buttonElement.on('click', button.onClick);
							break;
						default:
							assert(false);
					}
					buttonElement.appendTo(treeView);
				});
			}
			$('<h3>%1<\/h3>'.replace('%1', value.name)).appendTo(treeView);
			//row.appendTo(table);
			//table.appendTo(treeView);
			row = $('<div id="%1"><\/div>'.replace('%1', value.id));
			row.appendTo(treeView);
		});

		$.each(smartTreeSchema, function (index, value) {
			var tree;
			treesToLoad++;
			tree = CSLEDIT.SmartTree(treeView.children("#" + value.id), value.nodePaths, 
				value.macroLinks);

			// Use this for debugging if you're not sure the view accurately reflects the data
			//tree.setVerifyAllChanges(true);
			tree.setCallbacks({
				loaded : treeLoaded,
				selectNode : selectNodeInTree(tree),
				moveNode : callbacks.moveNode,
				deleteNode : callbacks.deleteNode,
				checkMove : callbacks.checkMove
			});
			tree.createTree();
			views.push(tree);
		});
	};

	var selectNodeInTree = function (tree) {
		return function (event, ui) {
			// deselect nodes in other trees
			$.each(views, function (i, view) {
				if (view !== tree) {
					if ("deselectAll" in view) {
						view.deselectAll();
					}
				}
			});

			selectedTree = tree;
			selectedNodeId = tree.selectedNode();
	
			return callbacks.selectNode(/*event, ui*/);
		};
	};

	var getSelectedNodePath = function () {
		if (selectedTree === null) {
			return "no selected tree";
		}

		return selectedTree.getSelectedNodePath();
	};

	var addNode = function (id, position, newNode, nodesAdded) {
		$.each(views, function (i, view) {
			if ("addNode" in view) {
				view.addNode(id, position, newNode, nodesAdded);
			}
		});
	};

	var deleteNode = function (id, nodesDeleted) {
		$.each(views, function (i, view) {
			if ("deleteNode" in view) {
				view.deleteNode(id, nodesDeleted);
			}
		});
	};

	var amendNode = function (id, amendedNode) {
		$.each(views, function (i, view) {
			if ("amendNode" in view) {
				view.amendNode(id, amendedNode);
			}
		});
	};

	var selectNode = function (id, highlightedNodes) {
		var treeNode;
	   
		if (typeof highlightedNodes === "undefined") {
			treeNode = treeView.find('li[cslid=' + id + '] > a');
		} else {
			treeNode = highlightedNodes.filter('li[cslid=' + id + ']').children('a');
		}

		if (treeNode.length > 0) {
			clickNode(treeNode.first());
		} else {
			selectedNodeId = id;
			callbacks.selectNode();
		}
	};

	var selectNodeFromPath = function (nodePath) {
		var treeNode = treeView,
			cslId;

		$.each(nodePath, function (i, cslId) {
			treeNode = treeNode.find('li[cslId="' + cslId + '"]');
		});

		treeNode = treeNode.children('a');

		if (treeNode.length > 0) {
			clickNode(treeNode.first());
		} else {
			selectedNodeId = id;
			callbacks.selectNode();
		}		
	};

	var clickNode = function (node) {
		node.click();
		treeView.scrollTo(node, 200, {
			offset:{left: -treeView.width() + 80, top: -treeView.height() * 0.4}
		});
	};

	var selectedNode = function () {
		return selectedNodeId;
	};

	var expandNode = function (id) {
		$.each(views, function (i, tree) {
			tree.expandNode(id);
		});
	};
	
	var exec = function (command, args) {
		args = args || [];
		console.log("executing view update: " + command + "(" + args.join(", ") + ")");
		this[command].apply(null, args);
	};

	// public:
	return {
		init : init,

		addNode : addNode,
		deleteNode : deleteNode,
		amendNode : amendNode,

		selectNode : selectNode,
		selectedNode : selectedNode,

		expandNode : expandNode,

		formatCitations : function () {
			formatCitationsCallback();
		},
			
		// This callback is used to avoid re-calculating the example citations
		// until all subscribers have been informed of the recent change
		exec : exec,

		setFormatCitationsCallback : function (callback) {
			formatCitationsCallback = callback;
		},

		getSelectedNodePath : getSelectedNodePath,

		selectNodeFromPath : selectNodeFromPath
	}
};

CSLEDIT = CSLEDIT || {};

// Allows clients to:
// - broadcast events
// - subscribe to events
//
// ** Any action which affects the data should go through the controller **
// 
CSLEDIT.controller = (function () {
	var commandSubscribers = {
			"addNode" : [],
			"deleteNode" : [],
			"moveNode" : [],
			"amendNode" : [],
			"setCslCode" : []
		},
		commandHistory = [];

	var addSubscriber = function (command, callback) {
		assert(command in commandSubscribers, "command doesn't exist");
		
		// note: we don't check whether the callback has already been added
		commandSubscribers[command].push(callback);
	};

	var subscribeToAllCommands = function (object) {
		$.each(commandSubscribers, function (k, v) {
			assert(typeof object[k] === "function", "function " + k + " doesn't exist in subscriber");
		});

		$.each(commandSubscribers, function (k, v) {
			v.push(object[k]);
		});
	};

	// These can be called like regular commands, but can't be subscribed to.
	// They use the regular commands to perform more complicated tasks.
	var macros = {
		addPath : function ( path ) {
			var splitPath = path.split("/"),
				index,
				currentPath = "",
				nodes,
				parentCslId;

			for (index = 0; index < splitPath.length; index++) {
				if (index > 0) {
					currentPath += "/";
				}
				currentPath += splitPath[index];
				nodes = CSLEDIT.data.getNodesFromPath(currentPath)
				if (nodes.length === 0) {
					if (index === 0) {
						// add root node
						_exec("addNode", [0, "before", {name: splitPath[index]}]);
						parentCslId = 0;
					} else {
						_exec("addNode",
							[parentCslId, "first", {name: splitPath[index]}]);
						parentCslId++;
					}
				} else {
					parentCslId = nodes[0].cslId;
				}
			}
		}
	};

	var exec = function (command, args) {
		var index;

		assert(command in commandSubscribers || command in macros, "command doesn't exist");
		console.log("executing command " + command + "(" + JSON.stringify(args) + ")");
		commandHistory.push(command, args);

		if (command in macros) {
			macros[command].apply(null, args);
		} else {
			_exec(command, args);
		}
	};

	var _exec = function(command, args) {
		for (index = 0; index < commandSubscribers[command].length; index++) {
			commandSubscribers[command][index].apply(null, args);
		}
	};

	return {
		addSubscriber : addSubscriber,
		subscribeToAllCommands : subscribeToAllCommands,
		exec : exec,
		commandHistory : commandHistory
	};
}());

"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.editorPage = (function () {
	var editTimeout,
		styleURL,
		oldSelectedNode,
		hoveredNodeStack = [],
		highlightedCss,
		selectedCss,
		unHighlightedCss,
		highlightedTreeNodes = $(),
		selectedCslId = -1,
		viewController,
		nodePathView,
		highlightTimeout;

	var addToHoveredNodeStack = function (target) {
		// build stack 'backwards' from the inner node outwards
		var parentNode;
		
		if (typeof target.attr("cslid") !== "undefined") {
			hoveredNodeStack.unshift(target.attr("cslid"));
		}

		parentNode = target.parent();
		if (parentNode.length > 0) {
			addToHoveredNodeStack(parentNode);
		}
	}

	var removeFromHoveredNodeStack = function (removeAll) {
		// pop one node, or all nodes, from hoveredNodeStack
		var poppedNode;

		if (hoveredNodeStack.length > 0) {
			poppedNode = hoveredNodeStack.pop();
			unHighlightNode(poppedNode);

			if (removeAll) {
				removeFromHoveredNodeStack (removeAll);
			}
		}
	}

	var highlightNode = function (nodeStack) {
		var cslId = nodeStack[nodeStack.length - 1];

		highlightOutput(cslId);

		// undo previous highlighting
		clearTimeout(highlightTimeout);
		highlightTimeout = setTimeout(function () {
			unHighlightTree();
			highlightTree(nodeStack, null, 0);
		}, 100);
	};

	var highlightOutput = function (cslId)
	{
		var node = $('span[cslid="' + cslId + '"]');

		if (node.hasClass("selected"))
		{
			// leave alone - selection takes precedence
		} else {
			node.addClass("highlighted");
		}
	};

	var reverseSelectNode = function () {
		var index,
			cslId = parseInt(hoveredNodeStack[hoveredNodeStack.length - 1]),
			selectedNode;

		assert(hoveredNodeStack.length > 0);

		// skip the macro definition nodes, jump to the referencing 'text' node instead
		selectedNode = CSLEDIT.data.getNode(cslId);
		if (selectedNode.name === "macro") {
			assert(hoveredNodeStack.length > 1);
			cslId = hoveredNodeStack[hoveredNodeStack.length - 2];
		}

		if (selectedCslId !== cslId) {
			selectedCslId = cslId;
			viewController.selectNode(cslId, highlightedTreeNodes);
		}
	};

	var unHighlightTree = function () {
		var node;

		clearTimeout(highlightTimeout);
		highlightedTreeNodes.children('a').removeClass("highlighted");
	};

	var unHighlightIfNotDescendentOf = function (instanceNode) {
		var index, nodes;

		$.each(highlightedTreeNodes, function () {
			var $this = $(this);
			if (instanceNode.find($this).length === 0) {
				$this.children('a').removeClass("highlighted");
				highlightedTreeNodes = highlightedTreeNodes.not($this);
			}
		});
	};

	// highlight node and all parents, stopping at the "style" node
	var highlightTree = function (nodeStack, node, depth) {
		var nodeIndex, node, parentNode, parentIndex, highlightedNode;

		if (node === null) {
			nodeIndex = nodeStack.pop();
			if (typeof nodeIndex === "undefined") {
				return;
			}
			node = $('li[cslid="' + nodeIndex + '"]');
		}

		depth++;
		assert(depth < 50, "stack overflow!");

		if (node.is('li')) {
			highlightedNode = node.children('a');
			highlightedTreeNodes = highlightedTreeNodes.add(node);
			highlightedNode.addClass("highlighted");
		}

		parentNode = node.parent().closest("li[cslid]");
		assert(parentNode != false, "no parent node");

		if (parentNode.length !== 0) {
        		parentIndex = parentNode.attr("cslid");
			if (nodeStack[nodeStack.length - 1] === parentIndex) {
				nodeStack.pop();
			}
			highlightTree(nodeStack, parentNode, depth);
		} else {
			if (nodeStack.length > 0) {
				// Look for a possible macro instance "text" node in the nodeStack,
				// if found, clear the highlighting for all macros not within this
				// instance or the definition
				var instanceNode;
				instanceNode = new CSLEDIT.CslNode(
					CSLEDIT.data.getNode(parseInt(nodeStack[nodeStack.length - 2])));
				if (instanceNode.name === "text" && instanceNode.getAttr("macro") !== "") {
					unHighlightIfNotDescendentOf($('li[cslid=' + instanceNode.cslId + ']'));
				}
			}
			// highlight any remaining nodes in the call stack
			// (e.g. if a macro was called)
			highlightTree(nodeStack, null, depth);
		}
	};

	var unHighlightNode = function (nodeIndex) {
		var	node = $('span[cslid="' + nodeIndex + '"]');

		if (node.hasClass("selected"))
		{
			// leave alone - selection takes precedence
		} else {
			node.removeClass("highlighted");
		}
	};

	var setupSyntaxHighlightForNode = function () {
		$('span[cslid]').hover(
			function (event) {
				var target = $(event.target).closest("span[cslid]");
				
				// remove all
				removeFromHoveredNodeStack(true);

				// populate hovered node stack
				addToHoveredNodeStack(target);

				var lastNode = hoveredNodeStack[hoveredNodeStack.length - 1];
				assertEqual(lastNode, target.attr("cslid"), "applySyntax");

				if (hoveredNodeStack.length > 0) {
					highlightNode(hoveredNodeStack.slice());
				}
			},
			function () {
				removeFromHoveredNodeStack();
				
				if (hoveredNodeStack.length > 0) {
					highlightNode(hoveredNodeStack.slice());
				} else {
					unHighlightTree();
				}
			}
		);

		// set up click handling
		$('span[cslid]').click( function () {
			var target = $(event.target).closest("span[cslid]"),
				cslId = parseInt(target.attr('cslId'));
			reverseSelectNode(cslId);
		});

		// set up hovering over tree nodes
		$('li[cslid] > a').unbind('mouseenter mouseleave');
		$('li[cslid] > a').hover(
			function (event) {
				var target = $(event.target).closest("li[cslid]"),
					cslId = parseInt(target.attr('cslId'));
				highlightOutput(cslId);
			},
			function (event) {
				var target = $(event.target).closest("li[cslid]"),
					cslId = parseInt(target.attr('cslId'));
				unHighlightNode(cslId);
			}
		);
	};

	var doSyntaxHighlighting = function () {
		var numCslNodes = CSLEDIT.data.numCslNodes();
			
		// clear the hovered node stack
		hoveredNodeStack.length = 0;
		selectedCslId = -1;

		setupSyntaxHighlightForNode();
	};

	var createTreeView = function () {
		var nodeIndex = { index : 0 };
		var cslData = CSLEDIT.data.get(); 

		viewController.init(cslData,
		{
			loaded : formatExampleCitations,
			selectNode : nodeSelected,
			deleteNode : function () {
				CSLEDIT.controller.exec("deleteNode", [viewController.selectedNode()]);
			},
			moveNode : function (move) {
				var temp,
					fromId,
					toId,
					toParentNode,
					index;

				fromId = parseInt(move.o.attr("cslid"));
				toId = parseInt(move.r.attr("cslid"));
				toParentNode = CSLEDIT.data.getNodeAndParent(toId).parent;

				if (move.last_pos !== false) {
					CSLEDIT.controller.exec("moveNode", [fromId, toId, move.last_pos]);
				}
			},
			checkMove : function (fromId, toId, position) {
				var fromNode = CSLEDIT.data.getNode(fromId),
					toNodeInfo = CSLEDIT.data.getNodeAndParent(toId),
					parentNodeName,
					result,
					toCslId;

				if (position === "before" || position === "after") {
					if (toNodeInfo.parent === null) {
						return false;
					}
					// go up a level
					toNodeInfo = CSLEDIT.data.getNodeAndParent(toNodeInfo.parent.cslId);
				}

				// for moving to a macro instance, note that if the move goes ahead,
				// this translation is done in CSLEDIT.data.addNode, so it's fine to
				// give the macro instance id to the addNode controller command
				toCslId = CSLEDIT.data.macroDefinitionIdFromInstanceId(toNodeInfo.node.cslId);
				if (toCslId !== toNodeInfo.node.cslId) {
					toNodeInfo = CSLEDIT.data.getNodeAndParent(toCslId);
				}

				if (toNodeInfo.parent === null) {
					parentNodeName = "root";
				} else {
					parentNodeName = toNodeInfo.parent.name;
				}
				result = (fromNode.name in CSLEDIT.schema.childElements(parentNodeName + "/" + toNodeInfo.node.name));
				return result;
			}
		});
	};

	var formatExampleCitations = function () {
		var cslData = CSLEDIT.data.get();

		CSLEDIT.citationEngine.runCiteprocAndDisplayOutput(
			$("#statusMessage"), $("#exampleOutput"),
			$("#formattedCitations"), $("#formattedBibliography"),
			doSyntaxHighlighting,
			CSLEDIT.data.getNodesFromPath("style/citation/layout", cslData)[0].cslId,
			CSLEDIT.data.getNodesFromPath("style/bibliography/layout", cslData)[0].cslId);
	};

	var nodeSelected = function(event, ui) {
		var nodeAndParent,
			node,
			parentNode,
			parentNodeName,
			propertyPanel = $("#elementProperties"),
			possibleElements,
			element,
			possibleChildNodesDropdown,
			schemaAttributes,
			dataType,
			translatedCslId,
			translatedNodeInfo,
			translatedParentName;

		nodeAndParent = CSLEDIT.data.getNodeAndParent(viewController.selectedNode());
		node = nodeAndParent.node;
		parentNode = nodeAndParent.parent;

		// hack to stop parent of style being style
		if (node.name === "style") {
			parentNodeName = "root";
		} else if (parentNode !== false) {
			parentNodeName = parentNode.name;
		} else {
			parentNodeName = "root";
		}

		// update possible child elements based on schema
		if (typeof CSLEDIT.schema !== "undefined") {
			// in case the user is selecting a macro instance:
			translatedCslId = CSLEDIT.data.macroDefinitionIdFromInstanceId(node.cslId);
			translatedNodeInfo = CSLEDIT.data.getNodeAndParent(translatedCslId);
		
			if (translatedNodeInfo.parent === null) {
				translatedParentName = "root";
			} else {
				translatedParentName = translatedNodeInfo.parent.name;
			}

			possibleElements = CSLEDIT.schema.childElements(
				translatedParentName + "/" + translatedNodeInfo.node.name);

			possibleChildNodesDropdown = $("#possibleChildNodes").html("");

			for (element in possibleElements) {
				$('<li><a href="#">' + element + '</a></li>').appendTo(possibleChildNodesDropdown);
			}
		}

		nodePathView.selectNode(viewController.getSelectedNodePath());

		// reregister dropdown handler after changes
		setupDropdownMenuHandler("#possibleChildNodes a");

		dataType = CSLEDIT.schema.elementDataType(parentNodeName + "/" + node.name);
		schemaAttributes = CSLEDIT.schema.attributes(parentNodeName + "/" + node.name);

		switch (node.name) {
			case "sort":
				CSLEDIT.sortPropertyPanel.setupPanel($("#elementProperties"), node);
				break;
			case "info":
				CSLEDIT.infoPropertyPanel.setupPanel($("#elementProperties"), node);
				break;
			default:
			CSLEDIT.propertyPanel.setupPanel(
				$("#elementProperties"), node, dataType, schemaAttributes);
		}

		$('span[cslid="' + oldSelectedNode + '"]').removeClass("highlighted");
		$('span[cslid="' + oldSelectedNode + '"]').removeClass("selected");
		oldSelectedNode = node.cslId;

		$('span[cslid="' + node.cslId + '"]').removeClass("highlighted");
		$('span[cslid="' + node.cslId + '"]').addClass("selected");
	};

	var reloadPageWithNewStyle = function (newURL) {
		var reloadURL = window.location.href;
		reloadURL = reloadURL.replace(/#/, "");
		reloadURL = reloadURL.replace(/\?.*$/, "");
		window.location.href = reloadURL + "?styleURL=" + newURL;
	};

	var updateCslData = function (cslCode) {
		// strip comments from style
		data = data.replace(/<!--.*?-->/g, "");

		CSLEDIT.data.setCslCode(cslCode);
		createTreeView();
	};

	var setupDropdownMenuHandler = function (selector) {
		$(selector).click(function (event) {
			var clickedName = $(event.target).text(),
				selectedNodeId = $('#treeEditor').jstree('get_selected'),
				parentNode = $(event.target).parent().parent(),
				parentNodeName,
				position;	

			if (parentNode.attr("class") === "sub_menu")
			{
				parentNodeName = parentNode.siblings('a').text();

				if (/^Edit/.test(parentNodeName)) {
					if (clickedName === "Delete node") {
						CSLEDIT.controller.exec("deleteNode", [viewController.selectedNode()]);
					}
				} else if ((/^Add node/).test(parentNodeName)) {
					$(event.target).parent().parent().css('visibility', 'hidden');

					CSLEDIT.controller.exec("addNode", [
						viewController.selectedNode(), 0, { name : clickedName, attributes : []}
					]);
				} else if ((/^Style/).test(parentNodeName)) {
					if (clickedName === "Revert (undo all changes)") {
						reloadPageWithNewStyle(styleURL);
					} else if (clickedName === "Export CSL") {
						window.location.href =
							"data:application/xml;charset=utf-8," +
							encodeURIComponent(CSLEDIT.data.getCslCode());
					} else if (clickedName === "Load from URL") {
						reloadPageWithNewStyle(
							prompt("Please enter the URL of the style you wish to load")
						);
					} else if (clickedName === "New style") {
						reloadPageWithNewStyle(
							window.location.protocol + "//" + window.location.hostname + "/csl/content/newStyle.csl");
					} else if (clickedName === "Style Info") {
						viewController.selectNode(CSLEDIT.data.getNodesFromPath("style/info")[0].cslId);
					} else if (clickedName === "Global Formatting Options") {
						viewController.selectNode(CSLEDIT.data.getNodesFromPath("style")[0].cslId);
					}
				}
			}
		});
	};

	return {
		init : function () {
			if (!$.browser.webkit && !$.browser.mozilla) {
				$('body').html("<h2>Please use the latest version of " +
					"Chrome or Firefox to view this page.<\/h2>").css({margin:50});
				return;
			}

			$("#dialog-confirm-delete").dialog({autoOpen : false});

			$(function(){
				$("ul.dropdown li").hoverIntent(function(){
				
					$(this).addClass("hover");
					$('ul:first',this).css('visibility', 'visible');
				
				}, function(){
				
					$(this).removeClass("hover");
					$('ul:first',this).css('visibility', 'hidden');
				
				});
				
				$("ul.dropdown li ul li:has(ul)").find("a:first").append(" &raquo; ");
			});

			CSLEDIT.data.initPageStyle( function () {
				viewController = CSLEDIT.ViewController($("#treeEditor"), $("#titlebar"), $("#nodePath"));

				CSLEDIT.controller.addSubscriber("addNode", CSLEDIT.data.addNode);
				CSLEDIT.controller.addSubscriber("deleteNode", CSLEDIT.data.deleteNode);
				CSLEDIT.controller.addSubscriber("moveNode", CSLEDIT.data.moveNode);
				CSLEDIT.controller.addSubscriber("amendNode", CSLEDIT.data.amendNode);
				CSLEDIT.controller.addSubscriber("setCslCode", CSLEDIT.data.setCslCode);	

				viewController.setFormatCitationsCallback(formatExampleCitations);
				CSLEDIT.data.setViewController(viewController);

				createTreeView();

				nodePathView = new CSLEDIT.NodePathView($("#nodePathView"), {
					selectNodeFromPath : viewController.selectNodeFromPath
				});
			});

			setupDropdownMenuHandler(".dropdown a");

			CSLEDIT.editReferences.init($('ul.#exampleCitation1'), formatExampleCitations, 0, [0]);
			CSLEDIT.editReferences.init($('ul.#exampleCitation2'), formatExampleCitations, 1, [11]);

			$("#mainContainer").layout({
				closable : false,
				resizble : true,
				livePaneResizing : true,
				west__size : 240
			});
			$("#rightContainer").layout({
				closable : false,
				resizable : true,
				livePaneResizing : true,
				north__size : 250
			});
			
			CSLEDIT.feedback.init($("#feedbackPanel"));
		}
	};
}());

$("document").ready( function () {
	CSLEDIT.schema.callWhenReady( CSLEDIT.editorPage.init );
});

