
var cslServerConfig = (function(){
	// private members
	
	return {
		// paths relative to repo root
		"cslStylesPath" : "external/csl-styles",
		"dataPath" : "../csl-editor-data",

		// example document data
		jsonDocuments : { "ITEM-1" : { /*"DOI" : "10.1088/0143-0807/27/4/007", "URL" : "http://bavard.fourmilab.ch/etexts/einstein/specrel/specrel.pdf",*/ "abstract" : "General description of special relativity", "author" : [ { "family" : "Einstein", "given" : "Albert" } ], "chapter-number" : "3", "container-title" : "Annalen der Physik", "editor" : [  ], "id" : "ITEM-1", "issue" : "4", "issued" : { "date-parts" : [ [ "1905" ] ] }, "page" : "1-26", "publisher" : "Dover Publications", "title" : "On the electrodynamics of moving bodies", "translator" : [  ], "type" : "article-journal", "volume" : "17" }, "ITEM-2" : { /*"DOI" : "10.1038/171737a0", "URL" : "http://www.ncbi.nlm.nih.gov/pubmed/13054692",*/ "abstract" : "We wish to suggest a structure for the salt of deoxyribose nucleic acid (D.N.A.). This structure has novel features which are of considerable biological interest.", "author" : [ { "family" : "Watson", "given" : "J D" }, { "family" : "Crick", "given" : "F H" } ], "container-title" : "Nature", "editor" : [  ], "id" : "ITEM-2", "issue" : "4356", "issued" : { "date-parts" : [ [ "1953" ] ] }, "page" : "737-738", "publisher" : "Am Med Assoc", "title" : "Molecular structure of nucleic acids; a structure for deoxyribose nucleic acid.", "translator" : [  ], "type" : "article-journal", "volume" : "171" } },
		citationsItems : [
			{ "citationId" : "CITATION-0", "citationItems" : [ { "id" : "ITEM-1", "uris" : [] } ], "properties" : { "noteIndex" : 0 }, "schema" : "https://github.com/citation-style-language/schema/raw/master/csl-citation.json" }//,
	//		{ "citationId" : "CITATION-1", "citationItems" : [ { "id" : "ITEM-1", "uris" : [] },  { "id" : "ITEM-2", "uris" : [] } ], "properties" : { "noteIndex" : 0 }, "schema" : "https://github.com/citation-style-language/schema/raw/master/csl-citation.json" }
	]
	};
}());

