<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/> 

	<title>CSL Search by Example</title>

	<script src="http://code.jquery.com/jquery-latest.min.js" type="text/javascript"></script>
	<script src="http://code.jquery.com/ui/1.8.18/jquery-ui.min.js"></script>
	<link rel="stylesheet" type="text/css" href="http://code.jquery.com/ui/1.8.18/themes/ui-lightness/jquery-ui.css">

	<script type="text/javascript" src="../../external/diff-match-patch/diff_match_patch.js"></script>

	<script type="text/javascript" src="../../external/citeproc/loadabbrevs.js"></script>
	<script type="text/javascript" src="../../external/citeproc/xmldom.js"></script>
	<script type="text/javascript" src="../../external/citeproc/citeproc-1.0.336.js"></script>
	<script type="text/javascript" src="../../external/citeproc/loadlocale.js"></script>
	<script type="text/javascript" src="../../external/citeproc/loadsys.js"></script>
	<script type="text/javascript" src="../../external/citeproc/runcites.js"></script>

	<script type="text/javascript" src="../../src/storage.js"></script>
	<script type="text/javascript" src="../../src/xmlUtility.js"></script>
	<script type="text/javascript" src="../../src/citationEngine.js"></script>
	<script type="text/javascript" src="../../server/config.js"></script>
	<script type="text/javascript" src="../../generated/exampleCitationsEnc.js"></script>

	<script type="text/javascript" src="../../external/cleditor/jquery.cleditor.js"></script>
	<link rel="stylesheet" type="text/css" href="../../external/cleditor/jquery.cleditor.css">

	<script type="text/javascript" src="../../src/debug.js"></script>
	<script type="text/javascript" src="../../src/options.js"></script>
	<script type="text/javascript" src="../../src/diff.js"></script>
	<script type="text/javascript" src="../../src/cslParser.js"></script>
	<script type="text/javascript" src="../../src/cslNode.js"></script>
	<script type="text/javascript" src="../../src/cslData.js"></script>
	<script type="text/javascript" src="../../src/exampleData.js"></script>
	<script type="text/javascript" src="../../src/searchResults.js"></script>
	<script type="text/javascript" src="../../src/searchByExample.js"></script>
	<script type="text/javascript" src="../src/analytics.js"></script>
	
	<link rel="stylesheet" href="../../css/base.css" />
	<link rel="stylesheet" href="../../css/searchByExample.css" />
	<link rel="stylesheet" href="../../css/searchResults.css" />

	<script type="text/javascript">
		$(document).ready(function () {
			CSLEDIT.searchByExample = new CSLEDIT.SearchByExample($('#mainContainer'), {
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
<body id="searchByExample">
<?php include '../html/navigation.html'; ?>
<div id="mainContainer">
</div>
</body>
</html>
