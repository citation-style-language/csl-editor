<html>
<head>	
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/> 

	<script type="text/javascript" src="../external/citeproc/loadabbrevs.js"></script>
	<script type="text/javascript" src="../external/citeproc/xmldom.js"></script>
	<script type="text/javascript" src="../external/citeproc/citeproc.js"></script>
	<script type="text/javascript" src="../external/citeproc/loadlocale.js"></script>
	<script type="text/javascript" src="../external/citeproc/loadsys.js"></script>
	<script type="text/javascript" src="../external/citeproc/runcites.js"></script>

<script type="text/javascript" src="../src/citationEngine.js"></script>

<style>
input, textarea
{
	width: 400;
}
p#exampleDocument
{
	margin-left: 50px;
/*	font-family: monospace;
 */
}
</style>
</head>
<body>
<h1>CSL Finder</h1>

<p id=exampleDocument></p>
<p id=explanation></p>

<output id="status"><i>Caluculating example citations...</i></output><p>

In-line citation: <input type="text" id="userCitation" disabled="disabled" oninput="formChanged()" /><br />
Bibliography entry: <textarea type="text" id="userBibliography" disabled="disabled" oninput="formChanged()"></textarea>

<h2>Results</h2>
<output id="result"></output><p>
<script>
// example document data
var jsonDocuments =  { "ITEM-1" : { /*"DOI" : "10.1088/0143-0807/27/4/007", "URL" : "http://bavard.fourmilab.ch/etexts/einstein/specrel/specrel.pdf",*/ "abstract" : "General description of special relativity", "author" : [ { "family" : "Einstein", "given" : "Albert" } ], "chapter-number" : "3", "container-title" : "Annalen der Physik", "editor" : [  ], "id" : "ITEM-1", "issue" : "4", "issued" : { "date-parts" : [ [ "1905" ] ] }, "page" : "1-26", "publisher" : "Dover Publications", "title" : "On the electrodynamics of moving bodies", "translator" : [  ], "type" : "article-journal", "volume" : "17" }, "ITEM-2" : { /*"DOI" : "10.1038/171737a0", "URL" : "http://www.ncbi.nlm.nih.gov/pubmed/13054692",*/ "abstract" : "We wish to suggest a structure for the salt of deoxyribose nucleic acid (D.N.A.). This structure has novel features which are of considerable biological interest.", "author" : [ { "family" : "Watson", "given" : "J D" }, { "family" : "Crick", "given" : "F H" } ], "container-title" : "Nature", "editor" : [  ], "id" : "ITEM-2", "issue" : "4356", "issued" : { "date-parts" : [ [ "1953" ] ] }, "page" : "737-738", "publisher" : "Am Med Assoc", "title" : "Molecular structure of nucleic acids; a structure for deoxyribose nucleic acid.", "translator" : [  ], "type" : "article-journal", "volume" : "171" } }  ;

var citationsItems = new Array();
citationsItems[0] =  { "citationId" : "CITATION-0", "citationItems" : [ { "id" : "ITEM-1", "uris" : [] } ], "properties" : { "noteIndex" : 0 }, "schema" : "https://github.com/citation-style-language/schema/raw/master/csl-citation.json" } ;

//citationsItems[1] =  { "citationId" : "CITATION-1", "citationItems" : [ { "id" : "ITEM-1", "uris" : [] },  { "id" : "ITEM-2", "uris" : [] } ], "properties" : { "noteIndex" : 0 }, "schema" : "https://github.com/citation-style-language/schema/raw/master/csl-citation.json" } ;

var cslStyles = new Array();
var cslStylesFilenames = new Array();
<?php
// get list of all csl files
$cslFiles = scandir("../external/csl-styles");

$index = 0;
foreach($cslFiles as $key => $value)
{
	if($value != "." && $value != "..")
	{
		$fileContents = json_encode(file_get_contents("../external/csl-styles/$value"));
		echo "cslStyles[$index] = $fileContents;\n";
		echo "cslStylesFilenames[$index] = \"$value\";\n";
		$index += 1;
	}
}
?>

function authorString(authors)
{
	var result = new Array();
	for (var index=0; index<authors.length; index++)
	{
		//alert(author);
		result.push(authors[index].given + " " + authors[index].family);
	}
	return result.join(", ");
}

var timeout;
function formChanged()
{
	clearTimeout(timeout);
	timeout = setTimeout("searchForStyle()", 1000);
}

function searchForStyle()
{
	var bestEditDistance = 999;
	var bestMatchIndex = -1;
	var userCitation = document.getElementById("userCitation").value;
	var userBibliography = document.getElementById("userBibliography").value;

	var editDistances = new Array();

	for (var index in formattedCitations)
	{
		if (formattedCitations[index] != null && formattedCitations[index].statusMessage == "")
		{
			formattedCitation = formattedCitations[index].formattedCitations[0];
			var thisEditDistance = 0;
			
			if (userCitation != "")
			{
				thisEditDistance += levenshtein(userCitation, formattedCitation);
			}
			if (userBibliography != "")
			{
				thisEditDistance += levenshtein(userBibliography, formattedCitations[index].formattedBibliography);
			}

			editDistances[index] = {editDistance:thisEditDistance, index:index};

			if (thisEditDistance < bestEditDistance)
			{
				bestEditDistance = thisEditDistance;
				bestMatchIndex = index;
			}
		}
	}
	editDistances.sort(function(a,b){return a.editDistance - b.editDistance});

	document.getElementById("status").innerHTML = "";

	var result = new Array();

	// top results
	for (var index=0; index < Math.min(5, editDistances.length); index++)
	{
		result.push(
			"<table>" +
			"<tr><td>csl filename:</td><td>" + formattedCitationsFilenames[editDistances[index].index] + "</td></tr>" +
			"<tr><td>edit distance:</td><td>" + editDistances[index].editDistance + "</td></tr>" +
			"<tr><td>in-line citation:</td><td>" + 
				formattedCitations[editDistances[index].index].formattedCitations.join("<br/>") + "</td></tr>" +
			"<tr><td>bibliography:</td><td>" + 
				formattedCitations[editDistances[index].index].formattedBibliography + "</td></tr>" +
			"</table>"
		);
		result.push("");
	}

	document.getElementById("result").innerHTML = result.join("<br />");
}

var formattedCitations = new Array();
var formattedCitationsFilenames = new Array();

var currentStyleIndex = 0;
formatExampleCitations();

function formatExampleCitations()
{
	if (currentStyleIndex < cslStyles.length)
	{
		document.getElementById("status").innerHTML = "<i>Please wait, citating example document in style " + 
			currentStyleIndex + "/" + cslStyles.length + "</i><br />" +
			"<i>(This could easily be pre-computed, unless we allow the user to make a custom example document)</i>";
		formattedCitations.push(
			citationEngine.formatCitations(cslStyles[currentStyleIndex], jsonDocuments, citationsItems));
		formattedCitationsFilenames.push(cslStylesFilenames[currentStyleIndex]);
		currentStyleIndex++;

		setTimeout("formatExampleCitations()", 10);
	}
	else
	{
		document.getElementById("status").innerHTML = "";
		document.getElementById("explanation").innerHTML = "<i>Please cite the above document in the exact format you require<br />" +
			"(You can use tags for italic, bold, superscript, etc)</i>";
		document.getElementById("exampleDocument").innerHTML =
			"<table>" +
			"<tr><td>Title:</td><td>" + jsonDocuments["ITEM-1"].title + "</td></tr>" +
			"<tr><td>Authors:</td><td>" + authorString(jsonDocuments["ITEM-1"].author) + "</td></tr>" + 
			"<tr><td>Year:</td><td>" + jsonDocuments["ITEM-1"].issued["date-parts"][0][0] + "</td></tr>" +
			"<tr><td>Publication:</td><td>" + jsonDocuments["ITEM-1"]["container-title"] + "</td></tr>" +
			"<tr><td>Volume:</td><td>" + jsonDocuments["ITEM-1"]["volume"] + "</td></tr>" +
			"<tr><td>Issue:</td><td>" + jsonDocuments["ITEM-1"]["issue"] + "</td></tr>" +
			"<tr><td>Chapter:</td><td>" + jsonDocuments["ITEM-1"]["chapter-number"] + "</td></tr>" +
			"<tr><td>Pages:</td><td>" + jsonDocuments["ITEM-1"]["page"] + "</td></tr>" +
			"<tr><td>Publisher:</td><td>" + jsonDocuments["ITEM-1"]["publisher"] + "</td></tr>" +
			"<tr><td>Document type:</td><td>" + jsonDocuments["ITEM-1"]["type"] + "</td></tr>" +
			"</table>";
		document.getElementById("userCitation").disabled = "";
		document.getElementById("userBibliography").disabled = "";
	}
}

// generate citations and bibliographies for all styles
//var style = <?php echo json_encode(file_get_contents("../external/csl-styles/arp.csl")); ?>;
//var formattedCitationsAndBibliography = citationEngine.formatCitations(style, jsonDocuments, citationsItems);
/*
document.getElementById("citeprocStatusMessage").innerHTML = formattedCitations[0].statusMessage;
document.getElementById("formattedCitations").innerHTML = formattedCitations[0].formattedCitations[0];
document.getElementById("formattedBibliography").innerHTML = formattedCitations[0].formattedBibliography;
 */

// from http://en.wikibooks.org/wiki/Algorithm_Implementation/Strings/Levenshtein_distance#JavaScript
function levenshtein(str1, str2) {
    var l1 = str1.length, l2 = str2.length;
    if (Math.min(l1, l2) === 0) {
        return Math.max(l1, l2);
    }
    var i = 0, j = 0, d = [];
    for (i = 0 ; i <= l1 ; i++) {
        d[i] = [];
        d[i][0] = i;
    }
    for (j = 0 ; j <= l2 ; j++) {
        d[0][j] = j;
    }
    for (i = 1 ; i <= l1 ; i++) {
        for (j = 1 ; j <= l2 ; j++) {
            d[i][j] = Math.min(
                d[i - 1][j] + 1,
                d[i][j - 1] + 1, 
                d[i - 1][j - 1] + (str1.charAt(i - 1) === str2.charAt(j - 1) ? 0 : 1)
            );
        }
    }
    return d[l1][l2];
}

</script>
</body>
</html>
