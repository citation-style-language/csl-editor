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

	<script type="text/javascript" src="../external/cleditor/jquery.cleditor.js"></script>
	<link rel="stylesheet" type="text/css" href="../external/cleditor/jquery.cleditor.css">

<style>
input, textarea
{
	width: 100%;
}
h1
{
	text-align: center;
	font-family: sans-serif;
}
#exampleDocument
{
	float: left;
	margin-left: 5px;
	width: 53%;
	background-color: #F5F5DC;
	border-style: solid;
	border-width: 2px;
}
.faint
{
	color: #888888;
}
#styleFormatInputControls
{
	float: left;
	width: 45%;
	margin-left: 0px;
}
.clearDiv
{
	clear: both;
}
#userCitation, #userBibliography
{
}
</style>
</head>
<body>
<!--h1 id="pageTitle">CSL Finder <sup><span class="faint">(prototype)</span></sup></h1-->

<div id="inputTabs">
	<ul>
		<li><a href="#styleNameInput">Search by style name</a></li>
		<li><a href="#styleFormatInput">Search by style format</a></li>
	</ul>
	<div id="styleNameInput">
<!--		Search by style name... <br />
		(very slow algorithm at present, but fine for the current style repo) <br />-->
		<input type="text" id="styleNameQuery" placeholder="Type journal title here" />
	</div>
	<div id="styleFormatInput">
		<div id="styleFormatInputControls">
			<p id=explanation></p>
			Enter in-line citation:
			<textarea type="text" id="userCitation" placeholder="Type inline citation here" ></textarea>
			<br />
			Enter bibliography entry:
			<textarea type="text" id="userBibliography" placeholder="Type bibliography entry here" ></textarea>
		</div>
		<div id=exampleDocument></div>
		<div class=clearDiv>
		</div>
	</div>
</div>

<output id="styleNameResult"></output><p />
<output id="styleFormatResult"></output><p />
<script>

"use strict";

var escapeHTML = function (string) {
	return $('<pre>').text(string).html();
};

String.prototype.endsWith = function (suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

// --- Functions for style name search ---

function searchForStyleName() {
	var searchQuery = $("#styleNameQuery").val(),
		searchQueryLower = searchQuery.toLowerCase(),
		result = [],
		styleId,
		styleName,
		masterId,
		masterStyleName;

	if (searchQuery.length === 0) {
		$("#styleNameResult").html("");
		return;
	}

	if (searchQuery.length < 3) {
		$("#styleNameResult").html("<p>Query too short<\/p>");
		return;
	}

	// dumb search, just iterates through all the names
	for (styleId in exampleCitations.styleTitleFromId) {
		if (exampleCitations.styleTitleFromId.hasOwnProperty(styleId)) {
			styleName = exampleCitations.styleTitleFromId[styleId];

			if (styleName.toLowerCase().indexOf(searchQueryLower) > -1 ||
				styleId.toLowerCase().indexOf(searchQueryLower) > -1) {
				masterId = exampleCitations.masterIdFromId[styleId];
				if (masterId !== styleId) {
					masterStyleName = ' (same as <a href="' + masterId + '">' +
						exampleCitations.styleTitleFromId[masterId] + '<\/a>)';
				} else {
					masterStyleName = "";
				}
				result.push('<a href="' + styleId + '">' + styleName + "<\/a>" + masterStyleName + "<br \/>" +
						'<table>' +
						'<tr><td><span class="faint">Inline citaiton<\/span>' +
						'<\/td><td>' +
						exampleCitations.exampleCitationsFromMasterId[masterId].formattedCitations[0] + '<\/td><\/tr>' +
						'<tr><td><span class="faint">Bibliography<\/span><\/td><td>' + exampleCitations.exampleCitationsFromMasterId[masterId].formattedBibliography + "<\/td><\/tr>" +
						'<tr><td><\/td><td><a href="../cslEditor/?styleURL=' + styleId + '">Edit style<\/a>' + masterStyleName + "<\/td><\/tr>" +
						'<\/table>'
					);
			}
		}
	}

	$("#styleNameResult").html(
		'<p>' + result.length + ' results for query "' + searchQuery + '": <\/p>' +
			result.join("<p><p>")
	);

	// TODO: order results by shortest
}

var nameSearchTimeout;
function nameSearch() {
	clearTimeout(nameSearchTimeout);
	nameSearchTimeout = setTimeout(searchForStyleName, 1000);
}

searchForStyleName();

// --- Functions for formatted style search ---

// from http://en.wikibooks.org/wiki/Algorithm_Implementation/Strings/Levenshtein_distance#JavaScript
function levenshtein(str1, str2) {
	var l1 = str1.length, l2 = str2.length,
		i = 0, j = 0, d = [];
    if (Math.min(l1, l2) === 0) {
        return Math.max(l1, l2);
    }
    for (i = 0; i <= l1; i++) {
        d[i] = [];
        d[i][0] = i;
    }
    for (j = 0; j <= l2; j++) {
        d[0][j] = j;
    }
    for (i = 1; i <= l1; i++) {
        for (j = 1; j <= l2; j++) {
            d[i][j] = Math.min(
                d[i - 1][j] + 1,
                d[i][j - 1] + 1,
                d[i - 1][j - 1] + (str1.charAt(i - 1) === str2.charAt(j - 1) ? 0 : 1)
            );
        }
    }
    return d[l1][l2];
}

function authorString(authors) {
	var result = [],
		index = 0;
	for (index = 0; index < authors.length; index++) {
		//alert(author);
		result.push(authors[index].given + " " + authors[index].family);
	}
	return result.join(", ");
}

function searchForStyle() {
	var bestEditDistance = 999,
		bestMatchIndex = -1,
		userCitation = $("#userCitation").cleditor()[0].doc.body.innerHTML,
		userBibliography = $("#userBibliography").cleditor()[0].doc.body.innerHTML,
		cleanHTML = function (html) {
			html = html.replace(/<span[^<>]*>/g, "");
			html = html.replace(/<\/span>/g, "");
			html = html.replace(/&nbsp;/g, " ");

			// remove any attributes the tags may have
			html = html.replace(/<(b|i|u|sup|sub)[^<>]*>/g, "<$1>");
			return html;
		},
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

	userCitation = cleanHTML(userCitation);
	userBibliography = cleanHTML(userBibliography);

	//result.push("<p>searching for " + escapeHTML(userCitation) + "<\/p>");
	//result.push("<p>searching for " + escapeHTML(userBibliography) + "<\/p>");

	for (styleId in exampleCitations.exampleCitationsFromMasterId) {
		if (exampleCitations.exampleCitationsFromMasterId.hasOwnProperty(styleId)) {
			exampleCitation = exampleCitations.exampleCitationsFromMasterId[styleId];

			if (exampleCitation !== null && exampleCitation.statusMessage === "") {
				formattedCitation = exampleCitation.formattedCitations[0];
				thisEditDistance = 0;

				if (userCitation !== "") {
					thisEditDistance += levenshtein(userCitation, formattedCitation);
				}
				if (userBibliography !== "") {
					thisEditDistance += levenshtein(userBibliography, exampleCitation.formattedBibliography);
				}

				editDistances[index++] = {editDistance : thisEditDistance, styleId : styleId};

				if (thisEditDistance < bestEditDistance) {
					bestEditDistance = thisEditDistance;
				}
			}
		}
	}
	editDistances.sort(function (a, b) {return a.editDistance - b.editDistance});

	result.push("<p>Top 5 results:<\/p>");

	// top results
	for (index=0; index < Math.min(5, editDistances.length); index++) {		
		result.push(
			"<table>" +
			row("style name", exampleCitations.styleTitleFromId[editDistances[index].styleId]) +
			row("style id", styleId) +
			row("edit distance", editDistances[index].editDistance) +
			row("in-line citation",
				exampleCitations.exampleCitationsFromMasterId[editDistances[index].styleId].formattedCitations.join("<br/>")) +
			row("bibliography",
				exampleCitations.exampleCitationsFromMasterId[editDistances[index].styleId].formattedBibliography) +
			"<\/table>"
		);
	}

	document.getElementById("styleFormatResult").innerHTML = result.join("<br />");
}

var formattedCitations = new Array();
var formattedCitationsFilenames = new Array();

var currentStyleIndex = 0;
initFindByStyle();

function initFindByStyle() {
	var jsonDocuments = cslServerConfig.jsonDocuments;

	document.getElementById("explanation").innerHTML = "<i>Please cite this example article in the style you wish your citations to appear.<br />";
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
	//document.getElementById("userCitation").disabled = "";
	//document.getElementById("userBibliography").disabled = "";
}

var timeout;
function formChanged() {
	clearTimeout(timeout);
	timeout = setTimeout(searchForStyle, 1000);
}

// JQuery UI stuff
$(function () {
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
});

$(document).ready(function () {
	$.cleditor.defaultOptions.width = 300;
	$.cleditor.defaultOptions.height = 100;
	$.cleditor.defaultOptions.controls =
		"bold italic underline strikethrough subscript superscript ";
//		+ "| undo redo | cut copy paste";

	var userCitationInput = $("#userCitation").cleditor({height: 70})[0];
	$("#userBibliography").cleditor({height: 100});

	$("#userCitation").cleditor()[0].change(formChanged);
	$("#userBibliography").cleditor()[0].change(formChanged);

	$("#styleNameQuery").on("input", function(){nameSearch();});
	
});

</script>
</body>
</html>
