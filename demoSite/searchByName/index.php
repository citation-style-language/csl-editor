<html>
<head>	
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/> 

	<title>CSL Search by Name</title>

	<script src="http://code.jquery.com/jquery-latest.min.js" type="text/javascript"></script>

	<script type="text/javascript" src="../../src/debug.js"></script>

	<script type="text/javascript" src="../../generated/cslStyles.js"></script>
	<script type="text/javascript" src="../../generated/preGeneratedExampleCitations.js"></script>

	<script type="text/javascript" src="../../external/diff-match-patch/diff_match_patch.js"></script>

	<script type="text/javascript" src="../../external/require.js"></script>
<script type="text/javascript">
	require.config({
		baseUrl: "../.."
	});
	requirejs(['src/SearchByName', 'src/cslData'], function (CSLEDIT_SearchByName, CSLEDIT_data) {
		$(document).ready(function () {
			var searchByName = new CSLEDIT_SearchByName($('#mainContainer'), {
				rootURL : "../..",
				editStyle_func : function (styleURL) {
					styleURL = "../getFromOtherWebsite.php?url=" + encodeURIComponent(styleURL);
					CSLEDIT_data.loadStyleFromURL(styleURL, function () {
						window.location.href = "../visualEditor";
					});
				}
			});
		});
	});
</script>

	<script type="text/javascript" src="../src/analytics.js"></script>

	<link rel="stylesheet" href="../../css/base.css" />
	<link rel="stylesheet" href="../../css/searchResults.css" />
	<link rel="stylesheet" href="../../css/searchByName.css" />

</head>
<body id="searchByName">
<?php include '../html/navigation.html'; ?>

<div id="mainContainer">
</div>
</body>
</html>
