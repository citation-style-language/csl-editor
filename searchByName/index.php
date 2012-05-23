<html>
<head>	
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/> 

	<title>CSL Search by Name</title>

	<script src="http://code.jquery.com/jquery-latest.min.js" type="text/javascript"></script>

	<script type="text/javascript" src="../src/debug.js"></script>
	<script type="text/javascript" src="../generated/exampleCitationsEnc.js"></script>
	<script type="text/javascript" src="../src/cslParser.js"></script>
	<script type="text/javascript" src="../src/cslData.js"></script>
	<script type="text/javascript" src="../src/searchResults.js"></script>
	<link rel="stylesheet" href="../css/base.css" />

	<script type="text/javascript" src="../src/searchByName.js"></script>
	<script type="text/javascript" src="../src/analytics.js"></script>
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
</head>
<body id="searchByName">
<?php include '../html/navigation.html'; ?>

<div id="mainContainer">
	<div id="styleNameInput">
		<label for="styleNameQuery">Enter style name:</label>
		<input type="text" id="styleNameQuery" autocomplete="off" placeholder="Enter style name here" />
		<button id="searchButton"><img src="../external/famfamfam-icons/magnifier.png"></img>Search</button>
	</div>
	<div id="styleNameResult"></div>
</div>
</body>
</html>
