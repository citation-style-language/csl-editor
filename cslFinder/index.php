<html>
<head>	
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/> 

	<script src="http://code.jquery.com/jquery-latest.min.js" type="text/javascript"></script>
	<script src="http://code.jquery.com/ui/1.8.18/jquery-ui.min.js"></script>
	<link rel="stylesheet" type="text/css" href="http://code.jquery.com/ui/1.8.18/themes/ui-lightness/jquery-ui.css">

	<script type="text/javascript" src="../external/citeproc/loadabbrevs.js"></script>
	<script type="text/javascript" src="../external/citeproc/xmldom.js"></script>
	<script type="text/javascript" src="../external/citeproc/citeproc.js"></script>
	<script type="text/javascript" src="../external/citeproc/loadlocale.js"></script>
	<script type="text/javascript" src="../external/citeproc/loadsys.js"></script>
	<script type="text/javascript" src="../external/citeproc/runcites.js"></script>
	<script type="text/javascript" src="../src/citationEngine.js"></script>
	<script type="text/javascript" src="../server/config.js"></script>
	<script type="text/javascript" src="../../csl-editor-data/exampleCitationsEnc.js" charset="UTF-8"></script>

<style>
input, textarea
{
	width: 400;
}
h1
{
	font-family: sans-serif;
}
#exampleDocument
{
	float: left;
	margin-left: 0px;
	width: 49%;
	background-color: #F5F5DC;
	border-style: solid;
	border-width: 2px;
}
.faint
{
	color: grey;
}
#styleFormatInputControls
{
	float: left;
	width: 49%;
	margin-left: 0px;
}
.clearDiv
{
	clear: both;
}
</style>
</head>
<body>
<h1>CSL Finder</h1>

<div id="inputTabs">
	<ul>
		<li><a href="#styleNameInput">Search by style name</a></li>
		<li><a href="#styleFormatInput">Search by style format</a></li>
	</ul>
	<div id="styleNameInput">
<!--		Search by style name... <br />
		(very slow algorithm at present, but fine for the current style repo) <br />-->
		<input type="text" id="styleNameQuery" oninput="nameSearch()" placeholder="Type journal title here" />
	</div>
	<div id="styleFormatInput">
		<div id="styleFormatInputControls">
			<p id=explanation></p>
			<output id="status"><i>caluculating example citations...</i></output><p>
			<input type="text" id="userCitation" oninput="formChanged()" placeholder="Type inline citation here" />
			<br />
			<textarea type="text" id="userBibliography" oninput="formChanged()" placeholder="Type bibliography entry here" ></textarea>
		</div>
		<div id=exampleDocument></div>
		<div class=clearDiv>
		</div>
	</div>
</div>

<output id="styleNameResult"></output><p>
<output id="styleFormatResult"></output><p>
<script>

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

// JQuery UI stuff
$(function() {
	$( "#inputTabs" ).tabs({
		show: function(event, ui) {
			if (ui.panel.id === "styleNameInput")
			{
				$("#styleNameResult").show();
				$("#styleFormatResult").hide();
			}
			else
			{
				$("#styleNameResult").hide();
				$("#styleFormatResult").show();
			}
		}
	});
});

// --- Functions for style name search ---

var nameSearchTimeout;
function nameSearch()
{
	clearTimeout(nameSearchTimeout);
	nameSearchTimeout = setTimeout("searchForStyleName()", 1000);
}

searchForStyleName();

function searchForStyleName()
{
	var searchQuery = $("#styleNameQuery").val();
	var searchQueryLower = searchQuery.toLowerCase();

	if (searchQuery.length === 0)
	{
		$("#styleNameResult").html("");
		return;
	}
	else if (searchQuery.length < 3)
	{
		$("#styleNameResult").html("<p>Query too short</p>");
		return;
	}

	var result = [];

	// dumb search, just iterates through all the names
	for (var styleId in exampleCitations.styleTitleFromId)
	{
		var styleName = exampleCitations.styleTitleFromId[styleId];

		//alert("styleName: " + styleName);

		if (styleName.toLowerCase().indexOf(searchQueryLower) > -1)
		{
			result.push(
				'<a href="' + styleId + '">' + styleName + "</a><br />" +
				'<table>' +
				'<tr><td><span class="faint">Inline citaiton</span></td><td>' + 
				exampleCitations.exampleCitationsFromMasterId[styleId].formattedCitations[0] + '</td></tr>' +
				'<tr><td><span class="faint">Bibliography</span></td><td>' + exampleCitations.exampleCitationsFromMasterId[styleId].formattedBibliography + "</td></tr>" +
				'</table>'
			);
		}
	}
	
	$("#styleNameResult").html(
		'<p>' + result.length + ' results for query "' + searchQuery + '":</p>' +
		result.join("<p><p>")
	);

	// TODO: order results by shortest
}

// --- Functions for formatted style search ---

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

	var index = 0;

	for (var styleId in exampleCitations.exampleCitationsFromMasterId)
	{
		var exampleCitation = exampleCitations.exampleCitationsFromMasterId[styleId];

		if (exampleCitation != null && exampleCitation.statusMessage == "")
		{
			formattedCitation = exampleCitation.formattedCitations[0];
			var thisEditDistance = 0;
			
			if (userCitation != "")
			{
				thisEditDistance += levenshtein(userCitation, formattedCitation);
			}
			if (userBibliography != "")
			{
				thisEditDistance += levenshtein(userBibliography, exampleCitation.formattedBibliography);
			}

			editDistances[index++] = {editDistance:thisEditDistance, styleId:styleId};

			if (thisEditDistance < bestEditDistance)
			{
				bestEditDistance = thisEditDistance;
				bestMatchId = styleId;
			}
		}
	}
	editDistances.sort(function(a,b){return a.editDistance - b.editDistance});

	document.getElementById("status").innerHTML = "";

	var result = new Array();

	result.push("<p>Top 5 results:</p>");

	// top results
	for (var index=0; index < Math.min(5, editDistances.length); index++)
	{
		result.push(
			"<table>" +
			"<tr><td>style name:</td><td>" + exampleCitations.styleTitleFromId[editDistances[index].styleId] + "</td></tr>" +
			'<tr><td>style id:</td><td><a href="' + styleId + '">' + styleId + "</a></td></tr>" +
			"<tr><td>edit distance:</td><td>" + editDistances[index].editDistance + "</td></tr>" +
			"<tr><td>in-line citation:</td><td>" + 
			exampleCitations.exampleCitationsFromMasterId[editDistances[index].styleId].formattedCitations.join("<br/>") + "</td></tr>" +
			"<tr><td>bibliography:</td><td>" + 
				exampleCitations.exampleCitationsFromMasterId[editDistances[index].styleId].formattedBibliography + "</td></tr>" +
			"</table>"
		);
		//result.push("");
	}

	document.getElementById("styleFormatResult").innerHTML = result.join("<br />");
}

var formattedCitations = new Array();
var formattedCitationsFilenames = new Array();

var currentStyleIndex = 0;
initFindByStyle();

function initFindByStyle()
{
	var jsonDocuments = cslServerConfig.jsonDocuments;

	document.getElementById("status").innerHTML = "";
	document.getElementById("explanation").innerHTML = "<i>Please cite this article in the exact format you require<br />" +
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
	//document.getElementById("userCitation").disabled = "";
	//document.getElementById("userBibliography").disabled = "";
}

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
