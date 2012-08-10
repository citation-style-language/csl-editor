<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/> 

	<title>CSL Search by Example</title>

	<script type="text/javascript" src="external/require.js"></script>
	<script>
		require.config({
			baseUrl: ".",
			urlArgs : "bust=$GIT_COMMIT"
		});
		requirejs(['src/config'], function (config) {
			requirejs(['jquery'], function () {
				// load jquery first due to plugin errors ('hoverIntent' was undefined)
				require(['demoSite/src/searchByExamplePage'], function () {});
			});
		});
	</script>
	<script type="text/javascript" src="demoSite/src/analytics.js"></script>
	
	<link rel="stylesheet" type="text/css" href="http://code.jquery.com/ui/1.8.18/themes/ui-lightness/jquery-ui.css">
	<link rel="stylesheet" type="text/css" href="external/cleditor/jquery.cleditor.css">

	<link rel="stylesheet" href="css/base.css?bust=$GIT_COMMIT" />
	<link rel="stylesheet" href="css/searchByExample.css?bust=$GIT_COMMIT" />
	<link rel="stylesheet" href="css/searchResults.css?bust=$GIT_COMMIT" />

</head>
<body id="searchByExample">
<?php include '../html/navigation.html'; ?>
<div id="mainContainer">
</div>
</body>
</html>
