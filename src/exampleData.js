"use strict";

// Hard-coded data for the example citations

define(function () {
	var CSLEDIT_exampleData = {};

	// Possible options to apply to each reference in each inline citation
	CSLEDIT_exampleData.additionalOptions = [
		{
			"description" : "Normal citation",
			"options" : {}
		},
		{
			"description" : "Locator: Pages 244-255",
			"options" : {
				"locator" : "244-252",
				"label" : "page"
			}
		},
		{
			"description" : "Locator: Chapter 5",
			"options" : {
				"locator" : "5",
				"label" : "chapter"
			}
		},
		{
			"description" : "Author only",
			"options" : {
				"author-only" : true
			}
		},
		{
			"description" : "Suppress author",
			"options" : {
				"suppress-author" : true
			}
		}
	];

	// Hard coded default list of csl-data.json references used
	// in the editor and search pages
	CSLEDIT_exampleData.jsonDocumentList = [
	{
		"type": "article-journal",
		"title": "The varieties of capitalism and hybrid success",
		"container-title": "Comparative Political Studies",
		"page": "307-332",
		"volume": "40",
		"issue": "3",
		"abstract": "The varieties of capitalism literature maintains that advanced capitalist countries whose institutions best fit either the liberal or coordinated market economy types will perform better than countries whose institutions are mixed. This is because hybrids are less likely to yield functionally beneficial institutional complementarities. The authors challenge this assertion. Denmark has performed as well as many purer cases during the 1990s. And Denmark has recently developed a more hybrid form than is generally recognized by (a) increasing the exposure of actors to market forces and (b) decentralizing collective learning and decision making. The institutional complementarities associated with such hybridization have contributed to its success; however, these complementarities are based on institutional heterogeneity rather than homogeneity. This is demonstrated by analyses of three cases: Danish labor markets, vocational training, and industrial policy. The implication of the authors' argument is that the varieties of capitalism theory is logically flawed.",
		"URL": "http://journals.sagepub.com/doi/abs/10.1177/0010414006286542",
		"DOI": "10.1177/0010414006286542",
		"ISSN": "1552-3829",
		"journalAbbreviation": "Comp. Polit. Stud.",
		"language": "en-US",
		"author": [
			{
				"family": "Campbell",
				"given": "John L."
			},
			{
				"family": "Pedersen",
				"given": "Ove K."
			}
		],
		"issued": {
			"date-parts": [
				[
					"2007",
					3,
					1
				]
			]
		},
		"accessed": {
			"date-parts": [
				[
					2010,
					7,
					26
				]
			]
		}
	},
	{
		"type": "chapter",
		"title": "Firms and the welfare state: When, why, and how does social policy matter to employers?",
		"container-title": "Varieties of capitalism. The institutional foundations of comparative advantage",
		"publisher": "Oxford University Press",
		"publisher-place": "New York",
		"page": "184-213",
		"event-place": "New York",
		"ISBN": "9780199247752",
		"language": "en-US",
		"author": [
			{
				"family": "Mares",
				"given": "Isabela"
			}
		],
		"editor": [
			{
				"family": "Hall",
				"given": "Peter A"
			},
			{
				"family": "Soskice",
				"given": "David"
			}
		],
		"issued": {
			"date-parts": [
				[
					2001
				]
			]
		}
	},
	{
		"type": "report",
		"title": "Country clustering in comparative political economy",
		"publisher": "Max-Planck Institute for the Study of Societies",
		"publisher-place": "Cologne",
		"page": "32",
		"genre": "MPIfG Discussion Paper",
		"event-place": "Cologne",
		"URL": "www.mpifg.de/pu/mpifg_dp/dp09-5.pdf",
		"number": "09-5",
		"author": [
			{
				"family": "Ahlquist",
				"given": "John S."
			},
			{
				"family": "Breunig",
				"given": "Christian"
			}
		],
		"issued": {
			"date-parts": [
				[
					2009
				]
			]
		},
		"accessed": {
			"date-parts": [
				[
					2012,
					12,
					15
				]
			]
		}
	},
	{
		"type": "book",
		"title": "Selected non-fictions",
		"publisher": "Viking",
		"publisher-place": "New York",
		"number-of-pages": "559",
		"event-place": "New York",
		"ISBN": "0670849472",
		"language": "en-US",
		"author": [
			{
				"family": "Borges",
				"given": "Jorge Luis"
			}
		],
		"editor": [
			{
				"family": "Weinberger",
				"given": "Eliot"
			}
		],
		"translator": [
			{
				"family": "Allen",
				"given": "Esther"
			},
			{
				"family": "Levine",
				"given": "Suzanne Jill"
			},
			{
				"family": "Weinberger",
				"given": "Eliot"
			}
		],
		"issued": {
			"date-parts": [
				[
					1999
				]
			]
		}
	},
	{
		"type": "book",
		"title": "Planting green roofs and living walls",
		"publisher": "Timber Press",
		"publisher-place": "Portland, OR",
		"number-of-pages": "328",
		"edition": "2",
		"event-place": "Portland, OR",
		"abstract": "The latest techniques for planting roofs and walls to enhance our buildings and benefit the environment. The green roof industry is booming and the technology changing fast as professionals respond to the unique challenges of each new planting. In this comprehensively updated, fully revised edition of their authoritative reference, Nigel Dunnett and Nol Kingsbury reveal the very latest techniques, materials, and plants, and showcase some spectacular new case studies for the non-professional. Green roofs and walls reduce pollution and runoff, help insulate and reduce the maintenance needs of buildings, contribute to biodiversity, and provide habitats for wildlife. In addition to all this, they are attractive to look at and enhance the quality of life of residents. In Planting Green Roofs and Living Walls, Revised and Updated Edition, the authors describe and illustrate the practical techniques required to design, implement, and maintain a green roof or wall to the highest standards. This informative, up-to-the-minute reference will encourage gardeners everywhere to consider the enormous benefits to be gained from planting on their roofs and walls.",
		"ISBN": "0881929115",
		"language": "en-US",
		"author": [
			{
				"family": "Dunnett",
				"given": "Nigel"
			},
			{
				"family": "Kingsbury",
				"given": "No\u00ebl"
			}
		],
		"issued": {
			"date-parts": [
				[
					2008
				]
			]
		}
	},
	{
		"type": "article-journal",
		"title": "On the electrodynamics of moving bodies",
		"container-title": "Annalen der Physik",
		"page": "1-26",
		"volume": "17",
		"issue": "4",
		"abstract": "General description of special relativity",
		"URL": "http://bavard.fourmilab.ch/etexts/einstein/specrel/specrel.pdf",
		"DOI": "10.1088/0143-0807/27/4/007",
		"journalAbbreviation": "Ann. Phys.",
		"language": "en-US",
		"author": [
			{
				"family": "Einstein",
				"given": "Albert"
			}
		],
		"issued": {
			"date-parts": [
				[
					1905
				]
			]
		}
	},
	{
		"type": "article-newspaper",
		"title": "Rooftop greenhouse will boost city farming",
		"container-title": "New York Times",
		"publisher-place": "New York",
		"page": "A20",
		"event-place": "New York",
		"ISSN": "0362-4331",
		"language": "en-US",
		"author": [
			{
				"family": "Foderaro",
				"given": "Lisa W."
			}
		],
		"issued": {
			"date-parts": [
				[
					"2012",
					4,
					6
				]
			]
		}
	},
	{
		"type": "book",
		"title": "Beyond varieties of capitalism: conflict, contradiction, and complementarities in the European economy",
		"publisher": "Oxford University Press",
		"publisher-place": "Oxford and New York",
		"number-of-pages": "438",
		"event-place": "Oxford and New York",
		"ISBN": "9780199206483",
		"shortTitle": "Beyond varieties of capitalism",
		"language": "en-GB",
		"editor": [
			{
				"family": "Hanck\u00e9",
				"given": "Bob"
			},
			{
				"family": "Rhodes",
				"given": "Martin"
			},
			{
				"family": "Thatcher",
				"given": "Mark"
			}
		],
		"issued": {
			"date-parts": [
				[
					2007
				]
			]
		}
	},
	{
		"type": "book",
		"title": "Steve Jobs",
		"publisher": "Simon & Schuster",
		"publisher-place": "New York, NY",
		"number-of-pages": "630",
		"event-place": "New York, NY",
		"ISBN": "9781451648539",
		"language": "en-US",
		"author": [
			{
				"family": "Isaacson",
				"given": "Walter"
			}
		],
		"issued": {
			"date-parts": [
				[
					"2011",
					10,
					24
				]
			]
		}
	},
	{
		"type": "book",
		"title": "Shaping the body politic: Art and political formation in early america",
		"publisher": "University of Virginia Press",
		"publisher-place": "Charlottesville, VA",
		"number-of-pages": "313",
		"event-place": "Charlottesville, VA",
		"abstract": "Traditional narratives imply that art in early America was severely limited in scope. By contrast, these essays collectively argue that visual arts played a critical role in shaping an early American understanding of the body politic. American artists in the late colonial and early national periods enlisted the arts to explore and exploit their visions of the relationship of the American colonies to the mother country and, later, to give material shape to the ideals of modern republican nationhood. Taking a uniquely broad view of both politics and art, Shaping the Body Politic ranges in topic from national politics to the politics of national identity, and from presidential portraits to the architectures of the ordinary. The book covers subject matter from the 1760s to the 1820s, ranging from Patience Wright's embodiment of late colonial political tension to Thomas Jefferson's designs for the entry hall at Monticello as a museum. Paul Staiti, Maurie McInnis, and Roger Stein offer new readings of canonical presidential images and spaces: Jean-Antoine Houdon's George Washington, Gilbert Stuart's the Lansdowne portrait of Washington, and Thomas Jefferson's Monticello. In essays that engage print and painting, portraiture and landscape, Wendy Bellion, David Steinberg, and John Crowley explore the formation of national identity. The volume's concluding essays, by Susan Rather and Bernard Herman, examine the politics of the everyday. The accompanying eighty-five illustrations and color plates demonstrate the broad range of politically resonant visual material in early America. ContributorsWendy Bellion, University of Delaware * John E. Crowley, Dalhousie University * Bernard L. Herman, University of North Carolina, Chapel Hill * Maurie D. McInnis, University of Virginia * Louis P. Nelson, University of Virginia * Susan Rather, University of Texas, Austin * Paul Staiti, Mount Holyoke College * Roger B. Stein, emeritus, University of Virginia * David Steinberg, Independent Scholar Thomas Jefferson Foundation Distinguished Lecture Series",
		"ISBN": "0813931029",
		"language": "en-US",
		"author": [
			{
				"family": "McInnis",
				"given": "Maurie Dee"
			},
			{
				"family": "Nelson",
				"given": "Louis P."
			}
		],
		"issued": {
			"date-parts": [
				[
					2011
				]
			]
		}
	},
	{
		"type": "patent",
		"title": "Yo-yo having a modifiable string gap",
		"abstract": "The invention is a yo-yo that includes unique features that enable a user to adjust the yo-yo's string gap. In the preferred embodiment, at least one of the yo-yo's side assemblies includes a screw engaged to a nut that has two thru-bores located in a side-by-side relation. The screw is located to one side of the yo-yo's axis of rotation and can be rotated by a user to adjust the position of the associated side assembly on the yo-yo's axle structure. By appropriate positioning of the side assembly, a user can adjust the yo-yo's performance characteristics.",
		"number": "WO2011US30214",
		"issued": {
			"date-parts": [
				[
					2011
				]
			]
		}
	},
	{
		"type": "article-journal",
		"title": "Molecular structure of nucleic acids; a structure for deoxyribose nucleic acid",
		"container-title": "Nature",
		"page": "737-738",
		"volume": "171",
		"issue": "4356",
		"abstract": "We wish to suggest a structure for the salt of deoxyribose nucleic acid (D.N.A.). This structure has novel features which are of considerable biological interest.",
		"URL": "http://www.ncbi.nlm.nih.gov/pubmed/13054692",
		"DOI": "10.1038/171737a0",
		"ISSN": "0028-0836",
		"shortTitle": "Molecular structure of nucleic acids",
		"journalAbbreviation": "Nature",
		"language": "en-US",
		"author": [
			{
				"family": "Watson",
				"given": "James Dewey"
			},
			{
				"family": "Crick",
				"given": "Francis Harry Compton"
			}
		],
		"issued": {
			"date-parts": [
				[
					1953
				]
			]
		}
	},
	{
		"type": "webpage",
		"title": "CSL search by example",
		"container-title": "Citation Style Editor",
		"URL": "http://editor.citationstyles.org/searchByExample/",
		"accessed": {
			"date-parts": [
				[
					2012,
					12,
					15
				]
			]
		}
	}
]
	return CSLEDIT_exampleData;
});
