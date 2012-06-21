<!doctype html>
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/> 

	<title>CSL Code Editor</title>

	<script src="http://code.jquery.com/jquery-latest.min.js" type="text/javascript"></script>
	<script src="http://code.jquery.com/ui/1.8.18/jquery-ui.min.js"></script>
	<link rel="stylesheet" type="text/css" href="http://code.jquery.com/ui/1.8.18/themes/ui-lightness/jquery-ui.css">

	<link rel="stylesheet" href="../../css/codemirror.css" />
	<script src="../../external/codemirror2/lib/codemirror.js"></script>
	<script src="../../external/codemirror2/mode/xml/xml.js"></script>
	<link rel="stylesheet" href="../../css/docs.css" />

	<script type="text/javascript" src="../../external/citeproc/loadabbrevs.js"></script>
	<script type="text/javascript" src="../../external/citeproc/xmldom.js"></script>
	<script type="text/javascript" src="../../external/citeproc/citeproc-1.0.336.js"></script>
	<script type="text/javascript" src="../../external/citeproc/loadlocale.js"></script>
	<script type="text/javascript" src="../../external/citeproc/loadsys.js"></script>
	<script type="text/javascript" src="../../external/citeproc/runcites.js"></script>
	<script type="text/javascript" src="../../external/diff-match-patch/diff_match_patch.js"></script>

	<script type="text/javascript" src="../../src/debug.js"></script>
	<script type="text/javascript" src="../../src/storage.js"></script>
	<script type="text/javascript" src="../../src/exampleData.js"></script>
	<script type="text/javascript" src="../../src/options.js"></script>
	<script type="text/javascript" src="../../src/exampleCitations.js"></script>
	<script type="text/javascript" src="../../src/citationEngine.js"></script>
	<script type="text/javascript" src="../../src/uiConfig.js"></script>
	<script type="text/javascript" src="../../src/diff.js"></script>
	<script type="text/javascript" src="../../src/cslParser.js"></script>
	<script type="text/javascript" src="../../src/cslNode.js"></script>
	<script type="text/javascript" src="../../src/Iterator.js"></script>
	<script type="text/javascript" src="../../src/cslData.js"></script>

	<link rel="stylesheet" href="../../css/base.css" />
	<script type="text/javascript" src="../../src/codeEditor.js"></script>

	<script type="text/javascript" src="../src/analytics.js"></script>

<style type="text/css">
#code {
	border: 1px solid #eee;
	overflow: auto;
}
.searched {
	background: yellow;
}
#exampleOutput {
	margin-left: 20px;
	margin-right: 20px;
	height: 60%;
	overflow: auto;
	cursor: default;
	font-family:Verdana,Geneva,'DejaVu Sans',sans-serif;
	line-height: 1.3;
}
#exampleOutput p {
	margin-top: 0;
	margin-bottom: 0.2em;
}
#exampleOutput h3 {
	margin-top: 0.5em;
	margin-bottom: 0.1em;
}
</style>
</head>
<body id="codeEditor">

<?php include '../html/navigation.html'; ?>

<form name="codeForm">
	<textarea id="code" name="code">
	</textarea>
</form>

<div id="exampleOutput">
	<div id="statusMessage"></div>

	<h3>Formatted Inline Citations</h3>	
	<div id="formattedCitations"></div>

	<h3>Formatted Bibliography</h3>
	<div id="formattedBibliography"></div>
</div>
</body>
</html>
