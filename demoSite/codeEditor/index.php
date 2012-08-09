<!doctype html>
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/> 

	<title>CSL Code Editor</title>

	<script>
		var CSLEDIT_pageModule = 'codeEditorPage';
	</script>
	<script type="text/javascript" data-main="../src/main.js" src="../../external/require.js"></script>

	<link rel="stylesheet" type="text/css" href="http://code.jquery.com/ui/1.8.18/themes/ui-lightness/jquery-ui.css">
	<link rel="stylesheet" href="../../css/codemirror.css" />

	<link rel="stylesheet" href="../../css/base.css" />
	<script type="text/javascript" src="../src/analytics.js"></script>

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
