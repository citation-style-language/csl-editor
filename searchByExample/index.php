<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/> 

	<title>CSL Search by Example</title>

	<script src="http://code.jquery.com/jquery-latest.min.js" type="text/javascript"></script>
	<script src="http://code.jquery.com/ui/1.8.18/jquery-ui.min.js"></script>
	<link rel="stylesheet" type="text/css" href="http://code.jquery.com/ui/1.8.18/themes/ui-lightness/jquery-ui.css">

	<script type="text/javascript" src="../external/diff-match-patch/diff_match_patch.js"></script>

	<script type="text/javascript" src="../external/citeproc/loadabbrevs.js"></script>
	<script type="text/javascript" src="../external/citeproc/xmldom.js"></script>
	<script type="text/javascript" src="../external/citeproc/citeproc-1.0.336.js"></script>
	<script type="text/javascript" src="../external/citeproc/loadlocale.js"></script>
	<script type="text/javascript" src="../external/citeproc/loadsys.js"></script>
	<script type="text/javascript" src="../external/citeproc/runcites.js"></script>

	<script type="text/javascript" src="../src/xmlUtility.js"></script>
	<script type="text/javascript" src="../src/citationEngine.js"></script>
	<script type="text/javascript" src="../server/config.js"></script>
	<script type="text/javascript" src="../generated/exampleCitationsEnc.js"></script>

	<script type="text/javascript" src="../external/cleditor/jquery.cleditor.js"></script>
	<link rel="stylesheet" type="text/css" href="../external/cleditor/jquery.cleditor.css">

	<script type="text/javascript" src="../src/debug.js"></script>
	<script type="text/javascript" src="../src/diff.js"></script>
	<script type="text/javascript" src="../src/cslParser.js"></script>
	<script type="text/javascript" src="../src/cslData.js"></script>
	<script type="text/javascript" src="../src/exampleData.js"></script>
	<script type="text/javascript" src="../src/searchResults.js"></script>
	<script type="text/javascript" src="../src/searchByExample.js"></script>
	<script type="text/javascript" src="../src/analytics.js"></script>
	
	<link rel="stylesheet" href="../css/base.css" />
	<link rel="stylesheet" href="../css/searchResults.css" />
<style>
#mainContent {
	padding: 8px;
	width: 800px;
}
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
	float: right;
	margin-left: 5px;
	width: 48%;
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
	width: 50%;
	margin-left: 0px;
}
.clearDiv
{
	clear: both;
}
div#styleFormatResult {
	padding: 0 22px 0;
	width: 600px;
}
button#searchButton {
	background-position: left center;
	background-repeat: no-repeat;
	padding-left: 18px;
	background-image: url("../external/famfamfam-icons/magnifier.png");
}
</style>
</head>
<body id="searchByExample">
<?php include '../html/navigation.html'; ?>
<div id="mainContent">
<div id="styleFormatInput">
	<div id="styleFormatInputControls">
		<p id=explanation></p>
		Edit in-line citation:
		<textarea type="text" id="userCitation" placeholder="Type inline citation here" ></textarea>
		<br />
		Edit bibliography entry:
		<textarea type="text" id="userBibliography" placeholder="Type bibliography entry here" ></textarea>
		<button id="searchButton">Search</button>
	</div>
	<div id=exampleDocument></div>
	<div class=clearDiv>
	</div>
</div>
<div id="searchResults"></div>
</div>
</body>
</html>
