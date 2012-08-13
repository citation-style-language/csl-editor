<html>
<head>
	<link rel="stylesheet" href="../csledit/external/qunit/qunit-1.9.0.css" type="text/css" media="screen" />
	<link type="text/css" rel="stylesheet" href="../csledit/external/jstree/themes/default/style.css" />

	<script type="text/javascript" src="../csledit/external/require.js"></script>
	<script>
		require.config({
			baseUrl: "../csledit",
			urlArgs : "bust=$GIT_COMMIT"
		});
		requirejs(['src/config'], function (config) {
			require(['jquery'], function () {
				require(['../src/integrationTestsPage'], function () {});
			});
		});
	</script>
</head>
<body>
	<h1 id="qunit-header">CSL Editor Integration Tests</h1>
	<h2 id="qunit-banner"></h2>
	<div id="qunit-testrunner-toolbar"></div>
	<h2 id="qunit-userAgent"></h2>
	<ol id="qunit-tests"></ol>
	<div id="qunit-fixture">test markup, will be hidden</div>
</body>
</html>
