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
	<script type="text/javascript" src="../external/citeproc/citeproc.js"></script>
	<script type="text/javascript" src="../external/citeproc/loadlocale.js"></script>
	<script type="text/javascript" src="../external/citeproc/loadsys.js"></script>
	<script type="text/javascript" src="../external/citeproc/runcites.js"></script>
	<script type="text/javascript" src="../external/diff-match-patch/diff_match_patch.js"></script>

	<script type="text/javascript" src="../external/jstree/_lib/jquery.hotkeys.js"></script>
	<script type="text/javascript" src="../external/jstree/jquery.jstree.js"></script>
	<link type="text/css" rel="stylesheet" href="../external/jstree/themes/default/style.css" />

	<script type="text/javascript" src="../src/citationEngine.js"></script>
	<script type="text/javascript" src="../src/exampleData.js"></script>
	<script type="text/javascript" src="../src/diff.js"></script>
	<script type="text/javascript" src="../src/debug.js"></script>
	<script type="text/javascript" src="../src/cslJSON.js"></script>
	<script type="text/javascript" src="../src/cslCode.js"></script>
	<script type="text/javascript" src="../src/schema.js"></script>
	<script type="text/javascript" src="../src/propertyPanel.js"></script>
	<script type="text/javascript" src="../src/visualEditor.js"></script>

	<link type="text/css" rel="stylesheet" href="../css/dropdown.css" />

	<link rel="stylesheet" href="../css/base.css" />
	<link rel="stylesheet" href="../css/visualEditor.css" />

	<script type="text/javascript" src="../src/analytics.js"></script>
</head>
<body id="visualEditor">
<?php include '../html/navigation.html'; ?>
<div id="dialog-confirm-delete" title="Delete?">
	<p>
	<span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 20px 0;"></span>
	Are you sure you want to delete this attribute?
	</p>
</div>
<ul class="dropdown">
	<li>
		<a href="#">Style</a>
		<ul class="sub_menu">
			<li><a href="#">New style</a></li>
			<li><a href="#">Load from URL</a></li>
			<!--li><a href="#">Revert (undo all changes)</a></li-->
			<li><a href="#">Export CSL</a></li>
		</ul>
	</li>
	<li>
		<a href="#">Edit</a>
		<ul class="sub_menu">
			<li><a href="#">Add node</a>
				<ul class="sub_menu" id="possibleChildNodes">
					 <li><a href="#">info</a></li>
					 <li><a href="#">macro</a></li>
					 <li><a href="#">locale</a></li>
					 <li><a href="#">citation</a></li>
					 <li><a href="#">bibliography</a></li>
					 <li><a href="#">text</a></li>
					 <li><a href="#">sort</a></li>
					 <li><a href="#">layout</a></li>
					 <li><a href="#">group</a></li>
					 <li><a href="#">choose</a></li>
					 <li><a href="#">if</a></li>
					 <li><a href="#">else</a></li>
					 <li><a href="#">names</a></li>
					 <li><a href="#">name</a></li>
					 <li><a href="#">substitute</a></li>
					 <li><a href="#">label</a></li>
				</ul>
			</li>
			<li>
				<a href="#">Delete node</a>
			</li>
		</ul>
	</li>
</ul>
<div id="mainContainer">
	<div id="leftPane">
		<div id="treeEditor">
		</div>
	</div>

	<div id="rightPane">
		<div id="elementProperties">
		</div>
		<div id="exampleOutput">
			<div id="statusMessage"></div>

			<h3>Formatted Citations</h3>	
			<div id="formattedCitations"></div>

			<h3>Formatted Bibliography</h3>
			<div id="formattedBibliography"></div>
		</div>
	</div>
</div>
</body>
</html>