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
		"source": "Highwire 2.0",
		"abstract": "The varieties of capitalism literature maintains that advanced capitalist countries whose institutions best fit either the liberal or coordinated market economy types will perform better than countries whose institutions are mixed. This is because hybrids are less likely to yield functionally beneficial institutional complementarities. The authors challenge this assertion. Denmark has performed as well as many purer cases during the 1990s. And Denmark has recently developed a more hybrid form than is generally recognized by (a) increasing the exposure of actors to market forces and (b) decentralizing collective learning and decision making. The institutional complementarities associated with such hybridization have contributed to its success; however, these complementarities are based on institutional heterogeneity rather than homogeneity. This is demonstrated by analyses of three cases: Danish labor markets, vocational training, and industrial policy. The implication of the authors argument is that the varieties of capitalism theory is logically flawed.",
		"URL": "https://journals.sagepub.com/doi/abs/10.1177/0010414006286542",
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
					"2010",
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
		"author": [
			{
				"family": "Mares",
				"given": "Isabela"
			}
		],
		"editor": [
			{
				"family": "Hall",
				"given": "Peter A."
			},
			{
				"family": "Soskice",
				"given": "David"
			}
		],
		"issued": {
			"date-parts": [
				[
					"2001"
				]
			]
		}
	},
	{
		"type": "report",
		"title": "Country clustering in comparative political economy",
		"publisher": "Max-Planck Institute for the Study of Societies",
		"publisher-place": "Cologne",
		"genre": "MPIfG Discussion Paper",
		"source": "Google Scholar",
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
					"2009"
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
		"ISBN": "978-1-4516-4853-9",
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
		"type": "webpage",
		"title": "CSL search by example",
		"container-title": "Citation Style Editor",
		"URL": "http://editor.citationstyles.org/searchByExample/",
		"issued": {
			"date-parts": [
				[
					"2012"
				]
			]
		},
		"accessed": {
			"date-parts": [
				[
					"2012",
					12,
					15
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
		"title": "Selected non-fictions",
		"publisher": "Viking",
		"publisher-place": "New York, NY",
		"volume": "1",
		"number-of-volumes": "3",
		"number-of-pages": "559",
		"edition": "3",
		"ISBN": "0-670-84947-2",
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
					"1999"
				]
			]
		}
	},
	{
		"type": "book",
		"title": "Beyond varieties of capitalism: Conflict, contradiction, and complementarities in the European economy",
		"publisher": "Oxford University Press",
		"publisher-place": "Oxford and New York, NY",
		"source": "Open WorldCat",
		"ISBN": "978-0-19-920648-3",
		"title-short": "Beyond varieties of capitalism",
		"language": "en",
		"editor": [
			{
				"family": "Hancké",
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
					"2007"
				]
			]
		}
	},
	{
		"type": "patent",
		"title": "Method for acetate consumption during ethanolic fermentation of cellulosic feedstocks",
		"authority": "United States",
		"URL": "https://patents.google.com/patent/US20160265005A1/en?inventor=rintze+zelle&oq=rintze+zelle",
		"call-number": "US15/150,534",
		"number": "US20160265005A1",
		"author": [
			{
				"family": "Zelle",
				"given": "Rintze M."
			},
			{
				"family": "Shaw",
				"given": "Arthur J.",
				"suffix": "IV"
			},
			{
				"family": "Dijken",
				"given": "Johannes Pieter",
				"dropping-particle": "van"
			}
		],
		"issued": {
			"date-parts": [
				[
					"2016",
					9,
					15
				]
			]
		},
		"accessed": {
			"date-parts": [
				[
					"2019",
					4,
					27
				]
			]
		},
		"submitted": {
			"date-parts": [
				[
					"2016",
					5,
					10
				]
			]
		}
	},
	{
		"type": "article-journal",
		"title": "A data citation roadmap for scholarly data repositories",
		"container-title": "Scientific Data",
		"journalAbbreviation": "Sci. Data",
		"page": "28",
		"volume": "6",
		"issue": "1",
		"source": "Nature",
		"abstract": "This article presents a practical roadmap for scholarly data repositories to implement data citation in accordance with the Joint Declaration of Data Citation Principles, a synopsis and harmonization of the recommendations of major science policy bodies. The roadmap was developed by the Repositories Expert Group, as part of the Data Citation Implementation Pilot (DCIP) project, an initiative of FORCE11.org and the NIH-funded BioCADDIE project. The roadmap makes 11 specific recommendations, grouped into three phases of implementation: a) required steps needed to support the Joint Declaration of Data Citation Principles, b) recommended steps that facilitate article/data publication workflows, and c) optional steps that further improve data citation support provided by data repositories. We describe the early adoption of these recommendations 18 months after they have first been published, looking specifically at implementations of machine-readable metadata on dataset landing pages.",
		"URL": "http://www.nature.com/articles/s41597-019-0031-8",
		"DOI": "10.1038/s41597-019-0031-8",
		"ISSN": "2052-4463",
		"language": "En",
		"author": [
			{
				"family": "Fenner",
				"given": "Martin"
			},
			{
				"family": "Crosas",
				"given": "Mercè"
			},
			{
				"family": "Grethe",
				"given": "Jeffrey S."
			},
			{
				"family": "Kennedy",
				"given": "David"
			},
			{
				"family": "Hermjakob",
				"given": "Henning"
			},
			{
				"family": "Rocca-Serra",
				"given": "Phillippe"
			},
			{
				"family": "Durand",
				"given": "Gustavo"
			},
			{
				"family": "Berjon",
				"given": "Robin"
			},
			{
				"family": "Karcher",
				"given": "Sebastian"
			},
			{
				"family": "Martone",
				"given": "Maryann"
			},
			{
				"family": "Clark",
				"given": "Tim"
			}
		],
		"issued": {
			"date-parts": [
				[
					"2019",
					4,
					10
				]
			]
		},
		"accessed": {
			"date-parts": [
				[
					"2019",
					4,
					27
				]
			]
		}
	},
	{
		"type": "thesis",
		"title": "Properties of expanding universes",
		"publisher": "University of Cambridge",
		"publisher-place": "Cambridge, UK",
		"genre": "Doctoral thesis",
		"source": "www.repository.cam.ac.uk",
		"abstract": "Some implications and consequences of the expansion of the universe are examined. In Chapter 1 it is shown that this expansion creates grave difficulties for the Hoyle-Narlikar theory of gravitation. Chapter 2 deals with perturbations of an expanding homogeneous and isotropic universe. The conclusion is reached that galaxies cannot be formed as a result of the growth of perturbations that were initially small. The propagation and absorption of gravitational radiation is also investigated in this approximation. In Chapter 3 gravitational radiation in an expanding universe is examined by a method of asymptotic expansions. The 'peeling off' behaviour and the asymptotic group are derived. Chapter 4 deals with the occurrence of singularities in cosmological models. It is shown that a singularity is inevitable provided that certain very general conditions are satisfied.",
		"URL": "https://www.repository.cam.ac.uk/handle/1810/251038",
		"note": "DOI: 10.17863/CAM.11283",
		"language": "en",
		"author": [
			{
				"family": "Hawking",
				"given": "Stephen"
			}
		],
		"issued": {
			"date-parts": [
				[
					"1966",
					3,
					15
				]
			]
		},
		"accessed": {
			"date-parts": [
				[
					"2019",
					4,
					27
				]
			]
		}
	}
]
	return CSLEDIT_exampleData;
});
