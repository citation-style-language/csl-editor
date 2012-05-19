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
	<link type="text/css" rel="stylesheet" href="../external/jstree/themes/default/style.css" />

	<script type="text/javascript" src="../external/jquery.layout-latest-min.js"></script>
	<script type="text/javascript" src="../external/jquery.hoverIntent.minified.js"></script>
	<script type="text/javascript" src="../external/jquery.scrollTo-1.4.2-min.js"></script>
	<script type="text/javascript" src="../external/jstree/jquery.jstree-patch1.js"></script>

	<script type="text/javascript" src="../build/CSLEDIT.visualEditor-62cdc733b862bb0f4350dd7b37126dc0a71d4165.js"></script>

	<link type="text/css" rel="stylesheet" href="../css/dropdown.css" />

	<link rel="stylesheet" href="../css/base.css" />
	<link rel="stylesheet" href="../css/visualEditor.css" />

	<script type="text/javascript" src="../src/analytics.js"></script>
</head>
<body id="visualEditor">
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
		<a href="#">Edit</a>
		<ul class="sub_menu">
			<li><a href="#">Add node</a>
				<ul class="sub_menu" id="possibleChildNodes">
				</ul>
			</li>
			<li>
				<a href="#">Delete node</a>
			</li>
		</ul>
	</li>
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
	<li>
		<a href="#">Links</a>
		<ul class="sub_menu">
			<li><a href="/csl/home">Home page</a>
			</li>
			<li><a href="/csl/about">About</a>
			</li>
			<li><a href="/csl/codeEditor">Code Editor</a>
			</li>
			<li><a href="/csl/searchByName">Search for Style by Name</a>
			</li>
			<li><a href="/csl/searchByExample">Search for Style by Example</a>
			</li>
		</ul>
	</li>
	<li>
		<a href="#">Feedback</a>
		<ul class="sub_menu">
			<li>
				<div id="feedbackPanel">
					<h3>What do you think?</h3>
					<textarea class="message" placeholder="Enter your bug report or any other feedback here" ></textarea><br />
					Your email: (if you'd like a reply)<br />
					<input class="email" type="text" placeholder="Email address"/><br />
					<input type="submit" value="Submit" />
				</div>
			</li>
		</ul>
	</li>
</ul>
<div id="titlebar">
<h3>Style Title:</h3>
</div>
<div id="mainContainer">
	<div id="leftContainer" class="ui-layout-west">
		<div id="treeEditor" class="panel">
		</div>
	</div>

	<div id="rightContainer" class="ui-layout-center">
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
	<button id="exampleDocuments">Edit References</button>
</div>
</body>
</html>
