<html>
<head>	
	<script type="text/javascript" src="../external/citeproc/loadabbrevs.js"></script>
	<script type="text/javascript" src="../external/citeproc/xmldom.js"></script>
	<script type="text/javascript" src="../external/citeproc/citeproc.js"></script>
	<script type="text/javascript" src="../external/citeproc/loadlocale.js"></script>
	<script type="text/javascript" src="../external/citeproc/loadsys.js"></script>
	<script type="text/javascript" src="../external/citeproc/runcites.js"></script>

	<script type="text/javascript" src="../src/citationEngine.js"></script>
</head>
<body>
<h1>CSL finder</h1>
<output id="status"></output><p>
formatted citations:<p>
<output id="formattedCitations"></output><p>
formatted bibliography:<p>
<output id="formattedBibliography"></output><p>
citeproc status message:<p>
<output id="citeprocStatusMessage"></output><p>

<script>
// example document data
var jsonDocuments =  { "ITEM-1" : { "DOI" : "10.1088/0143-0807/27/4/007", "URL" : "http://bavard.fourmilab.ch/etexts/einstein/specrel/specrel.pdf", "abstract" : "General description of special relativity", "author" : [ { "family" : "Einstein", "given" : "Albert" } ], "chapter-number" : "3", "container-title" : "Annalen der Physik", "editor" : [  ], "id" : "ITEM-1", "issue" : "4", "issued" : { "date-parts" : [ [ "1905" ] ] }, "page" : "1-26", "publisher" : "Dover Publications", "title" : "On the electrodynamics of moving bodies", "translator" : [  ], "type" : "article-journal", "volume" : "17" }, "ITEM-2" : { "DOI" : "10.1038/171737a0", "URL" : "http://www.ncbi.nlm.nih.gov/pubmed/13054692", "abstract" : "We wish to suggest a structure for the salt of deoxyribose nucleic acid (D.N.A.). This structure has novel features which are of considerable biological interest.", "author" : [ { "family" : "Watson", "given" : "J D" }, { "family" : "Crick", "given" : "F H" } ], "container-title" : "Nature", "editor" : [  ], "id" : "ITEM-2", "issue" : "4356", "issued" : { "date-parts" : [ [ "1953" ] ] }, "page" : "737-738", "publisher" : "Am Med Assoc", "title" : "Molecular structure of nucleic acids; a structure for deoxyribose nucleic acid.", "translator" : [  ], "type" : "article-journal", "volume" : "171" } }  ;
	
var citationsItems = new Array();
citationsItems[0] =  { "citationId" : "CITATION-0", "citationItems" : [ { "id" : "ITEM-1", "uris" : [] } ], "properties" : { "noteIndex" : 0 }, "schema" : "https://github.com/citation-style-language/schema/raw/master/csl-citation.json" } ;
citationsItems[1] =  { "citationId" : "CITATION-1", "citationItems" : [ { "id" : "ITEM-1", "uris" : [] },  { "id" : "ITEM-2", "uris" : [] } ], "properties" : { "noteIndex" : 0 }, "schema" : "https://github.com/citation-style-language/schema/raw/master/csl-citation.json" } ;

// generate citations and bibliographies for all styles
var style = <?php echo json_encode(file_get_contents("../external/csl-styles/arp.csl")); ?>;
var formattedCitationsAndBibliography = citationEngine.formatCitations(style, jsonDocuments, citationsItems);

document.getElementById("citeprocStatusMessage").innerHTML = formattedCitationsAndBibliography.statusMessage;
document.getElementById("formattedCitations").innerHTML = formattedCitationsAndBibliography.formattedCitations;
document.getElementById("formattedBibliography").innerHTML = formattedCitationsAndBibliography.formattedBibliography;

</script>
</body>
</html>
