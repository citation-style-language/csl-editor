<html>
<head>	
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/> 

	<title>CSL Search by Name</title>

	<script type="text/javascript" src="../csledit/external/require.js"></script>
	<script>
		require.config({
			baseUrl: "../csledit",
			urlArgs : "bust=$GIT_COMMIT"
		});
		requirejs(['src/config'], function (config) {
			requirejs(['jquery'], function () {
				// load jquery first due to plugin errors ('hoverIntent' was undefined)
				require(['../src/searchByNamePage'], function () {});
			});
		});
	</script>
	<script type="text/javascript" src="../src/analytics.js"></script>

	<link rel="stylesheet" href="../csledit/css/base.css?bust=$GIT_COMMIT" />
	<link rel="stylesheet" href="../csledit/css/searchResults.css?bust=$GIT_COMMIT" />
	<link rel="stylesheet" href="../csledit/css/searchByName.css?bust=$GIT_COMMIT" />

</head>
<body id="searchByName">
<?php include '../html/navigation.html'; ?>

<div id="mainContainer">
</div>
</body>
</html>
