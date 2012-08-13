<!doctype html>
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/> 

	<title>CSL-data-exporter style generator</title>

	<script type="text/javascript" src="../csledit/external/require.js"></script>
	<script>
		require.config({
			baseUrl: "../csledit",
			urlArgs : "bust=$GIT_COMMIT"
		});
		requirejs(['src/config'], function (config) {
			require(['jquery'], function () {
				require(['../cslDataExporter/generateCsl'], function () {});
			});
		});
	</script>
</head>
<body>
</body>
</html>
