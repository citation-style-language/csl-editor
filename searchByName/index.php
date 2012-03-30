<html>
<head>	
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/> 

<title>Search by Name</title>

<script src="http://code.jquery.com/jquery-latest.min.js" type="text/javascript"></script>
<script type="text/javascript" src="../../csl-editor-data/exampleCitationsEnc.js" charset="UTF-8"></script>
<script type="text/javascript" src="../src/cslCode.js" charset="UTF-8"></script>
<script type="text/javascript" src="../src/searchResults.js" charset="UTF-8"></script>
<link rel="stylesheet" href="../css/base.css" />
<style>
div#styleNameInput {
	padding: 20px 50px 10px;
}
div#styleNameInput input {
	font-size: 18px;	
	width: 400px;
}
div#styleNameInput label {
	font-size: 18px;
	font-family: Arial, Helvetica;
}
div#mainContainer{
	width: 800px;
}
div#styleNameResult {
	padding: 0 30px 0 30px;
	width: 600px;
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
<!-- google analytics -->
<script type="text/javascript">
  var _gaq = _gaq || [];
  _gaq.push(['_setAccount', 'UA-4601387-1']);
  _gaq.push(['_trackPageview']);

  (function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();
</script>
</head>
<body id="searchByName">
<?php include '../html/navigation.html'; ?>

<div id="mainContainer">
<div id="styleNameInput">
	<!--		Search by style name... <br />
	(very slow algorithm at present, but fine for the current style repo) <br />-->
	<label for="styleNameQuery">Enter style name:</label>
	<input type="text" id="styleNameQuery" autocomplete="off" placeholder="Enter style name here" />
</div>
<div id="styleNameResult"></div>
</div>
<script>

"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.findByNamePage = (function () {
	var nameSearchTimeout;

	// --- Functions for style name search ---
		
	var searchForStyleName = function () {
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
					result.push({
							styleId : styleId,
							masterId : masterId
						});
				}
			}
		}

		CSLEDIT.searchResults.displaySearchResults(result, $("#styleNameResult"));
	};

	var nameSearch = function () {
		clearTimeout(nameSearchTimeout);
		nameSearchTimeout = setTimeout(searchForStyleName, 1000);
	};

	return {
		init : function () {		
			$("#styleNameQuery").on("input", function(){
				nameSearch();
			});

			$("#styleNameQuery").focus();
		
			searchForStyleName();
		}
	};
}());

$(document).ready(function () {
	CSLEDIT.findByNamePage.init();		
});

</script>
</body>
</html>
