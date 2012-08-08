<!doctype html>
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/> 

	<title>Visual CSL Editor</title>

	<script src="http://code.jquery.com/jquery-latest.min.js" type="text/javascript"></script>
	<script src="http://code.jquery.com/ui/1.8.18/jquery-ui.min.js"></script>
	<link rel="stylesheet" type="text/css" href="http://code.jquery.com/ui/1.8.18/themes/ui-lightness/jquery-ui.css">

	<script type="text/javascript" src="../../external/citeproc/loadabbrevs.js"></script>
	<script type="text/javascript" src="../../external/citeproc/xmldom.js"></script>
	<script type="text/javascript" src="../../external/citeproc/citeproc-1.0.336.js"></script>
	<script type="text/javascript" src="../../external/citeproc/loadlocale.js"></script>
	<script type="text/javascript" src="../../external/citeproc/runcites.js"></script>
	<script type="text/javascript" src="../../external/diff-match-patch/diff_match_patch.js"></script>

	<script type="text/javascript" src="../../external/jstree/_lib/jquery.hotkeys.js"></script>
	<script type="text/javascript" src="../../external/jstree/jquery.jstree-patch1.js"></script>
	<link type="text/css" rel="stylesheet" href="../../external/jstree/themes/default/style.css" />

	<script type="text/javascript" src="../../external/jquery.layout-latest-min.js"></script>
	<script type="text/javascript" src="../../external/jquery.hoverIntent.minified.js"></script>
	<script type="text/javascript" src="../../external/jquery.scrollTo-1.4.2-min.js"></script>


	<script type="text/javascript" src="../../src/debug.js"></script>

	<script type="text/javascript" src="../../generated/cslStyles.js"></script>

	<script type="text/javascript" data-main="../src/visualEditorDemo.js" src="../../external/require.js"></script>

	<script type="text/javascript" src="../../src/citeprocLoadSys.js"></script>

	<link type="text/css" rel="stylesheet" href="../../css/dropdown.css" />

	<link rel="stylesheet" href="../../css/base.css" />
	<link rel="stylesheet" href="../../css/visualEditor.css" />

	<script type="text/javascript" src="../src/analytics.js"></script>

	<style>
		#visualEditorContainer {
			position: absolute;
<?php
if (isset($_GET['embedded']) && $_GET['embedded'] == "true") {
			echo("top: 0px;");
} else {
			echo("top: 40px;");
}
?>
			bottom: 0px;
			left: 0px;
			right: 0px;
		}
	</style>
</head>
<body id="visualEditor">
<?php
if (!isset($_GET['embedded']) || $_GET['embedded'] != "true") {
	include '../html/navigation.html';
}
?>
<div id="visualEditorContainer">
</div>
</body>
</html>
