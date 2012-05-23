<!doctype html>
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/> 

	<title>Visual Editor</title>

	<script src="http://code.jquery.com/jquery-latest.min.js" type="text/javascript"></script>
	<script src="http://code.jquery.com/ui/1.8.18/jquery-ui.min.js"></script>
	<link rel="stylesheet" type="text/css" href="http://code.jquery.com/ui/1.8.18/themes/ui-lightness/jquery-ui.css">

	<script type="text/javascript" src="../external/citeproc/loadabbrevs.js"></script>
	<script type="text/javascript" src="../external/citeproc/xmldom.js"></script>
	<script type="text/javascript" src="../external/citeproc/citeproc-1.0.336.js"></script>
	<script type="text/javascript" src="../external/citeproc/loadlocale.js"></script>
	<script type="text/javascript" src="../external/citeproc/loadsys.js"></script>
	<script type="text/javascript" src="../external/citeproc/runcites.js"></script>
	<script type="text/javascript" src="../external/diff-match-patch/diff_match_patch.js"></script>

	<script type="text/javascript" src="../external/jstree/_lib/jquery.hotkeys.js"></script>
	<script type="text/javascript" src="../external/jstree/jquery.jstree-patch1.js"></script>
	<link type="text/css" rel="stylesheet" href="../external/jstree/themes/default/style.css" />

	<script type="text/javascript" src="../external/jquery.layout-latest-min.js"></script>
	<script type="text/javascript" src="../external/jquery.hoverIntent.minified.js"></script>
	<script type="text/javascript" src="../external/jquery.scrollTo-1.4.2-min.js"></script>

	<script type="text/javascript" src="../src/citationEngine.js"></script>
	<script type="text/javascript" src="../src/exampleData.js"></script>
	<script type="text/javascript" src="../src/diff.js"></script>
	<script type="text/javascript" src="../src/debug.js"></script>
	<script type="text/javascript" src="../src/cslParser.js"></script>
	<script type="text/javascript" src="../src/Iterator.js"></script>
	<script type="text/javascript" src="../src/cslNode.js"></script>
	<script type="text/javascript" src="../src/cslData.js"></script>
	<script type="text/javascript" src="../src/schema.js"></script>

	<script type="text/javascript" src="../src/editReferences.js"></script>
	<script type="text/javascript" src="../src/NodePathView.js"></script>
	<script type="text/javascript" src="../src/MultiComboBox.js"></script>
	<script type="text/javascript" src="../src/propertyPanel.js"></script>
	<script type="text/javascript" src="../src/sortPropertyPanel.js"></script>
	<script type="text/javascript" src="../src/infoPropertyPanel.js"></script>
	<script type="text/javascript" src="../src/editNodeButton.js"></script>
	<script type="text/javascript" src="../src/smartTree.js"></script>
	<script type="text/javascript" src="../src/Titlebar.js"></script>
	<script type="text/javascript" src="../src/ViewController.js"></script>
	<script type="text/javascript" src="../src/controller.js"></script>
	<script type="text/javascript" src="../src/visualEditor.js"></script>

	<link type="text/css" rel="stylesheet" href="../css/dropdown.css" />

	<link rel="stylesheet" href="../css/base.css" />
	<link rel="stylesheet" href="../css/visualEditor.css" />

	<script type="text/javascript" src="../src/analytics.js"></script>
</head>
<body id="visualEditor">
<?php include '../html/navigation.html'; ?>
<div id="mainContainer">
	<div id="leftContainer" class="ui-layout-west">
		<ul class="dropdown">
			<li>
				<a href="#">Style</a>
				<ul class="sub_menu">
					<li><a href="#">New style</a></li>
					<li><a href="#">Load from URL</a></li>
					<!--li><a href="#">Revert (undo all changes)</a></li-->
					<li><a href="#">Export CSL</a></li>
					<li><a href="#">Style Info</a>
					<li><a href="#">Global Formatting Options</a></li>
				</ul>
			</li>
			<li>
				<a href="#">Add Node</a>
					<ul class="sub_menu" id="possibleChildNodes">
					</ul>
			</li>
			<li>
				<a href="#">Delete Node</a>
			</li>
		</ul>
		<div id="treeEditor" class="panel">
		</div>
	</div>

	<div id="rightContainer" class="ui-layout-center">
		<ul class="dropdown">
			<li>
				<a href="#">Citation 1</a>
				<ul class="sub_menu" id="exampleCitation1">
				</ul>
			</li>
			<li>
				<a href="#">Citation 2</a>
				<ul class="sub_menu" id="exampleCitation2">
				</ul>
			</li>
		</ul>
		<div id="titlebarContainer">
			<div id="titlebar">
				<h3>Style Title:</h3>
			</div>
		</div>
		<div id="topRightContainer" class="ui-layout-north">
			<div id="exampleOutput" class="panel">
				<div id="statusMessage"></div>

				<h3>Formatted Inline Citations</h3>	
				<div id="formattedCitations"></div>

				<h3>Formatted Bibliography</h3>
				<div id="formattedBibliography"></div>
			</div>
		</div>
		<div id="bottomRightContainer" class="ui-layout-center">
			<div id="elementPropertyPanel" class="panel">
				<div id="nodePathView"></div>
				<div id="elementProperties"></div>
			</div>
		</div>
	</div>
</div>
</body>
</html>
