<!doctype html>
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/> 

	<title>CSL Code Editor</title>

	<script type="text/javascript" src="../csledit/external/require.js"></script>
	<script>
		require.config({
			baseUrl: "../csledit",
			urlArgs : "bust=$GIT_COMMIT"
		});
		requirejs(['src/config'], function (config) {
			requirejs(['jquery'], function () {
				// load jquery first due to plugin errors ('hoverIntent' was undefined)
				require(['../src/codeEditorPage'], function () {});
			});
		});
	</script>
	<script type="text/javascript" src="../src/analytics.js"></script>

	<link rel="stylesheet" type="text/css" href="http://code.jquery.com/ui/1.8.18/themes/ui-lightness/jquery-ui.css">
	<link rel="stylesheet" href="../csledit/css/codemirror.css" />
	<link rel="stylesheet" href="../csledit/css/base.css?bust=$GIT_COMMIT" />

<style type="text/css">
#codeEditorContainer {
	position: absolute;

	top: 40px;
	bottom: 0px;
	left: 0px;
	right: 0px;

	background: #eeeeee;
}
#code {
	/*border: 1px solid #eee;*/
	position: absolute;

	top: 0px;
	bottom: 0px;
	left: 0px;
	right: 0px;
}
.searched {
	background: yellow;
}
</style>
</head>
<body id="codeEditor">

<?php include '../html/navigation.html'; ?>

<div id="codeEditorContainer">
</div>

</body>
</html>
