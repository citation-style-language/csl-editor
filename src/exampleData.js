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
		"abstract": "The varieties of capitalism literature maintains that advanced capitalist countries whose institutions best fit either the liberal or coordinated market economy types will perform better than countries whose institutions are mixed. This is because hybrids are less likely to yield functionally beneficial institutional complementarities. The authors challenge this assertion. Denmark has performed as well as many purer cases during the 1990s. And Denmark has recently developed a more hybrid form than is generally recognized by (a) increasing the exposure of actors to market forces and (b) decentralizing collective learning and decision making. The institutional complementarities associated with such hybridization have contributed to its success; however, these complementarities are based on institutional heterogeneity rather than homogeneity. This is demonstrated by analyses of three cases: Danish labor markets, vocational training, and industrial policy. The implication of the authors argument is that the varieties of capitalism theory is logically flawed.",
		"container-title": "Comparative Political Studies",
		"DOI": "10.1177/0010414006286542",
		"ISSN": "1552-3829",
		"issue": "3",
		"journalAbbreviation": "Comp. Polit. Stud.",
		"language": "en-US",
		"page": "307-332",
		"source": "Highwire 2.0",
		"title": "The varieties of capitalism and hybrid success",
		"URL": "http://cps.sagepub.com/content/40/3/307.abstract",
		"volume": "40",
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
		"accessed": {
			"date-parts": [
				[
					"2010",
					7,
					26
				]
			]
		},
		"issued": {
			"date-parts": [
				[
					"2007",
					3,
					1
				]
			]
		}
	},
	{
		"type": "chapter",
		"container-title": "Varieties of capitalism. The institutional foundations of comparative advantage",
		"DOI": "10.1093/0199247757.003.0005",
		"ISBN": "978-0-19-924775-2",
		"page": "184-213",
		"publisher": "Oxford University Press",
		"publisher-place": "New York",
		"title": "Firms and the welfare state: When, why, and how does social policy matter to employers?",
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
		"type": "book",
		"abstract": "Since the early 1990s, Europe's economies have been facing several new challenges: the 1992 single market programme, the collapse of the Berlin wall and eastward enlargement, and monetary unification. Building on the influential Varieties of Capitalism (VoC) perspective, first elaborated in detail in the book Varieties of Capitalism (OUP, 2001), this book critically analyzes these developments in the European political economy and their effects on the continental Europeaneconomies. Leading political economists from Europe and the US debate how VoC can help understand the political-economic cha",
		"DOI": "10.1093/acprof:oso/9780199206483.001.0001",
		"ISBN": "978-0-19-954701-2",
		"language": "en",
		"number-of-pages": "455",
		"publisher": "Oxford University Press",
		"publisher-place": "Oxford and New York",
		"source": "search.syr.edu",
		"title": "Beyond varieties of capitalism: conflict, contradiction, and complementarities in the european economy",
		"title-short": "Beyond varieties of capitalism",
		"editor": [
			{
				"family": "Hancke",
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
		"type": "book",
		"edition": "3",
		"ISBN": "0-670-84947-2",
		"language": "en-US",
		"number-of-pages": "559",
		"number-of-volumes": "3",
		"publisher": "Viking",
		"publisher-place": "New York",
		"title": "Selected non-fictions",
		"volume": "1",
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
		"type": "thesis",
		"abstract": "Some implications and consequences of the expansion of the universe are examined. In Chapter 1 it is shown that this expansion creates grave difficulties for the Hoyle-Narlikar theory of gravitation. Chapter 2 deals with perturbations of an expanding homogeneous and isotropic universe. The conclusion is reached that galaxies cannot be formed as a result of the growth of perturbations that were initially small. The propagation and absorption of gravitational radiation is also investigated in this approximation. In Chapter 3 gravitational radiation in an expanding universe is examined by a method of asymptotic expansions. The 'peeling off' behaviour and the asymptotic group are derived. Chapter 4 deals with the occurrence of singularities in cosmological models. It is shown that a singularity is inevitable provided that certain very general conditions are satisfied.",
		"DOI": "10.17863/CAM.11283",
		"genre": "Doctoral thesis",
		"language": "en",
		"license": "© Stephen Hawking, All Rights Reserved",
		"publisher": "University of Cambridge",
		"publisher-place": "Cambridge, UK",
		"source": "www.repository.cam.ac.uk",
		"title": "Properties of expanding universes",
		"URL": "https://www.repository.cam.ac.uk/handle/1810/251038",
		"author": [
			{
				"family": "Hawking",
				"given": "Stephen"
			}
		],
		"accessed": {
			"date-parts": [
				[
					"2019",
					4,
					27
				]
			]
		},
		"issued": {
			"date-parts": [
				[
					"1966",
					3,
					15
				]
			]
		}
	},
	{
		"type": "article",
		"genre": "MPIfG Discussion Paper",
		"language": "en",
		"number": "09-5",
		"publisher": "Max-Planck Institute for the Study of Societies",
		"publisher-place": "Cologne",
		"source": "Google Scholar",
		"title": "Country clustering in comparative political economy",
		"URL": "https://hdl.handle.net/10419/36527",
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
		"accessed": {
			"date-parts": [
				[
					"2026",
					1,
					15
				]
			]
		},
		"issued": {
			"date-parts": [
				[
					"2009"
				]
			]
		}
	},
	{
		"type": "patent",
		"authority": "United States",
		"call-number": "US15/150,534",
		"number": "US20160265005A1",
		"title": "Method for acetate consumption during ethanolic fermentation of cellulosic feedstocks",
		"URL": "https://patents.google.com/patent/US20160265005A1/en?inventor=rintze+zelle&oq=rintze+zelle",
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
		"accessed": {
			"date-parts": [
				[
					"2019",
					4,
					27
				]
			]
		},
		"issued": {
			"date-parts": [
				[
					"2016",
					9,
					15
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
		"abstract": "This article presents a practical roadmap for scholarly data repositories to implement data citation in accordance with the Joint Declaration of Data Citation Principles, a synopsis and harmonization of the recommendations of major science policy bodies. The roadmap was developed by the Repositories Expert Group, as part of the Data Citation Implementation Pilot (DCIP) project, an initiative of FORCE11.org and the NIH-funded BioCADDIE (\n                  https://biocaddie.org\n                  \n                ) project. The roadmap makes 11 specific recommendations, grouped into three phases of implementation: a) required steps needed to support the Joint Declaration of Data Citation Principles, b) recommended steps that facilitate article/data publication workflows, and c) optional steps that further improve data citation support provided by data repositories. We describe the early adoption of these recommendations 18 months after they have first been published, looking specifically at implementations of machine-readable metadata on dataset landing pages.",
		"container-title": "Scientific Data",
		"DOI": "10.1038/s41597-019-0031-8",
		"ISSN": "2052-4463",
		"issue": "1",
		"language": "En",
		"license": "2019 The Author(s)",
		"page": "28",
		"PMID": "30971690",
		"PMCID": "PMC6472386",
		"source": "Nature",
		"title": "A data citation roadmap for scholarly data repositories",
		"URL": "http://www.nature.com/articles/s41597-019-0031-8",
		"volume": "6",
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
		"accessed": {
			"date-parts": [
				[
					"2019",
					4,
					27
				]
			]
		},
		"issued": {
			"date-parts": [
				[
					"2019",
					4,
					10
				]
			]
		}
	},
	{
		"type": "webpage",
		"container-title": "Citation Style Editor",
		"publisher": "Citation Style Language",
		"title": "CSL search by example",
		"URL": "http://editor.citationstyles.org/searchByExample/",
		"accessed": {
			"date-parts": [
				[
					"2012",
					12,
					15
				]
			]
		},
		"issued": {
			"date-parts": [
				[
					"2012"
				]
			]
		}
	},
	{
		"type": "book",
		"ISBN": "978-1-4516-4853-9",
		"language": "en-US",
		"number-of-pages": "630",
		"publisher": "Simon & Schuster",
		"publisher-place": "New York, NY",
		"title": "Steve Jobs",
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
		"type": "article-newspaper",
		"container-title": "New York Times",
		"ISSN": "0362-4331",
		"language": "en-US",
		"page": "A20",
		"publisher-place": "New York",
		"title": "Rooftop greenhouse will boost city farming",
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
		"collection-title": "Penguin Classics",
		"ISBN": "978-0-14-043208-4",
		"language": "en",
		"number-of-pages": "570",
		"publisher": "Penguin",
		"publisher-place": "London",
		"source": "K10plus ISBN",
		"title": "The wealth of nations: books I-III",
		"title-short": "The wealth of nations",
		"author": [
			{
				"family": "Smith",
				"given": "Adam"
			}
		],
		"editor": [
			{
				"family": "Skinner",
				"given": "Andrew"
			}
		],
		"issued": {
			"date-parts": [
				[
					"1999"
				]
			]
		},
		"original-date": {
			"date-parts": [
				[
					"1776"
				]
			]
		}
	}
]
	return CSLEDIT_exampleData;
});
