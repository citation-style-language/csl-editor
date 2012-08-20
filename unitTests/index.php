<html>
<head>
	<link rel="stylesheet" href="../external/qunit/qunit-1.9.0.css" type="text/css" media="screen" />
	<link type="text/css" rel="stylesheet" href="../external/jstree/themes/default/style.css" />

	<script type="text/javascript" src="../external/require-jquery.js"></script>
	<script>
		require.config({
			baseUrl: "..",
			urlArgs : "bust=$GIT_COMMIT"
		});
		requirejs(['src/config'], function (config) {
			require(['src/unitTestsPage'], function () {});
		});
	</script>
</head>
<body>
	<h1 id="qunit-header">CSL Editor Unit Tests</h1>
	<h2 id="qunit-banner"></h2>
	<div id="qunit-testrunner-toolbar"></div>
	<h2 id="qunit-userAgent"></h2>
	<ol id="qunit-tests"></ol>
	<div id="qunit-fixture">test markup, will be hidden</div>
</body>
</html>
