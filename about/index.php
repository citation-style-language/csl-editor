<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/> 

	<title>About</title>

	<link rel="stylesheet" href="../css/base.css" />
	<script src="http://code.jquery.com/jquery-latest.min.js" type="text/javascript"></script>
<style>
#mainContent {
	padding-left: 20px;
	padding-right: 20px;
}
</style>
<!-- google analytics -->
<script type="text/javascript" src="../src/analytics.js"></script>
</head>
<body id="about">
<?php include '../html/navigation.html'; ?>

<div id="mainContent">

<h1>Citation Style Editor</h1>

<p>This site allows you to search and edit citation styles. It's still a prototype.</p>

<p>Blog: <a href="http://csleditor.wordpress.com/">http://csleditor.wordpress.com/</a></p>

<p>Source code: <a href="https://github.com/citation-style-editor">https://github.com/citation-style-editor</a></p>

<div id="gitCommit">
<strong>Current site version: </strong> <a href="https://github.com/citation-style-editor/csl-editor/commit/<?php include '../generated/commit.txt'; ?>"><?php include '../generated/commit.txt'; ?></a>
</div>

<h2>Attributions</h2>

<ul>
<li><a href="http://citationstyles.org/">Citation Style Language</a></li>
<li><a href="https://github.com/citation-style-language/styles">CSL style repository</a></li>
<li><a href="http://gsl-nagoya-u.net/http/pub/citeproc-doc.html">citeproc-js</a> (Citation formatting engine)</li>
<li><a href="http://codemirror.net/">CodeMirror</a> (text editor on codeEditor page)</li>
<li><a href="http://code.google.com/p/google-diff-match-patch/">diff_match_patch</a> (for showing highlighted differences in formatted output)</li>
<li><a href="http://www.mozilla.org/rhino/">Rhino</a> js interpreter (for pre-calculating example citations on server)</li>
<li><a href="http://www.thaiopensource.com/relaxng/trang.html">Trang</a> (for converting schema files from .rnc to .rng)</li>
<li><a href="http://www.famfamfam.com/lab/icons/silk/">FamFamFam Silk icons</a></li>
<li><a href="http://p.yusukekamiyamane.com/">Fugue icons</a></li>
<li><a href="http://jquery.com/">jQuery</a></li>
<li><a href="http://www.jstree.com/">jQuery jsTree Plugin</a> (tree view on visualEditor page)</li>
<li><a href="http://premiumsoftware.net/cleditor/">jQuery CLEditor Plugin</a> (rich text input on searchByExample page)</li>
<li><a href="http://layout.jquery-dev.net">jQuery UI Layout Plugin</a></li>
<li><a href="http://cherne.net/brian/resources/jquery.hoverIntent.html">jQuery hoverIntent Plugin</a></li>
<li><a href="http://demos.flesler.com/jquery/scrollTo/">jQuery scrollTo Plugin</a></li>

</ul>

</div>
</body>
</html>
