<html>
<head>	
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/> 

	<title>CSL Search by Name</title>

	<script src="http://code.jquery.com/jquery-1.7.2.min.js" type="text/javascript"></script>

	<script type="text/javascript" src="../../src/debug.js"></script>
	<script type="text/javascript" src="../../src/exampleData.js"></script>
	<script type="text/javascript" src="../../src/options.js"></script>
	<script type="text/javascript" src="../../src/storage.js"></script>
	<script type="text/javascript" src="../../generated/cslStyles.js"></script>
	<script type="text/javascript" src="../../generated/preGeneratedExampleCitations.js"></script>
	<script type="text/javascript" src="../../src/cslParser.js"></script>
	<script type="text/javascript" src="../../src/cslNode.js"></script>
	<script type="text/javascript" src="../../src/Iterator.js"></script>
	<script type="text/javascript" src="../../src/cslData.js"></script>
	<script type="text/javascript" src="../../src/searchResults.js"></script>

	<script type="text/javascript" src="../../src/searchByName.js"></script>
	<script type="text/javascript" src="../src/analytics.js"></script>

	<link rel="stylesheet" href="../../css/base.css" />
	<link rel="stylesheet" href="../../css/searchResults.css" />
	<link rel="stylesheet" href="../../css/searchByName.css" />

	<script type="text/javascript">
		$(document).ready(function () {
			CSLEDIT.searchByName = new CSLEDIT.SearchByName($('#mainContainer'), {
				rootURL : "../..",
				editStyle_func : function (styleURL) {
					styleURL = "../getFromOtherWebsite.php?url=" + encodeURIComponent(styleURL);
					CSLEDIT.data.loadStyleFromURL(styleURL, function () {
						window.location.href = "../visualEditor";
					});
				}
			});
		});
	</script>
</head>
<body id="searchByName">
<?php include '../html/navigation.html'; ?>

<div id="mainContainer">
</div>
</body>
</html>
