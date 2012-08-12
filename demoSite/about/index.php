<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/> 

	<title>About</title>

	<script type="text/javascript" src="../external/require.js"></script>
	<script>
		require.config({
			baseUrl: ".."
		});
		// load the appropriate page
		requirejs(['src/config'], function () {});
	</script>
	<script type="text/javascript" src="../demoSite/src/analytics.js"></script>

	<link rel="stylesheet" type="text/css" href="http://code.jquery.com/ui/1.8.18/themes/ui-lightness/jquery-ui.css">
	<link rel="stylesheet" href="../css/base.css?bust=$GIT_COMMIT" />
<style>
#mainContent {
	padding-left: 20px;
	padding-right: 20px;
}
</style>
</head>
<body id="about">
<?php include '../html/navigation.html'; ?>

<div id="mainContent">

<h1>About Citation Style Editor</h1>

<p class="lead">An open source website for searching and editing styles in the <a href="http://citationstyles.org/">Citation Style Language</a>, used by reference managers <a href="http://www.zotero.org">Zotero</a>, <a href="http://www.mendeley.com">Mendeley</a> and <a href="http://www.mekentosj.com/papers/">Papers</a>.</p>
<p>It's still in the early stages of development. If you find bugs, please help us and report them using the feedback tab at the top right.</p>

<p>Blog: <a href="http://csleditor.wordpress.com/">http://csleditor.wordpress.com/</a></p>

<p>Source code: <a href="https://github.com/citation-style-editor">https://github.com/citation-style-editor</a></p>

<div id="gitCommit">
<strong>Current CSL Editor version: </strong> <a href="https://github.com/citation-style-editor/csl-editor/commit/$GIT_COMMIT">$GIT_COMMIT</a>
</div>

<h2>Getting Started</h2>
<h3>Know the name of the style you want?</h3>
<p>
Search for a style with <a href="../searchByName/">Search by Name</a>.
</p>

<h3>Know what the style should look like?</h3>
<p>
Search for a style by its output with <a href="../searchByExample/">Search by Example</a>. If you don't find an <strong>exact</strong> match you will have the option to edit a similar style.
</p>

<h3>Want to create a new style from scratch?</h3>
<p>This is <strong>not recommended</strong>. It's much easier to <a href="../searchByExample/">Search by Example</a> to find a similar style first, which you can then edit.
</p>
<p>
If you really want to start a new style, you can create a new one by clicking <strong>Style->New Style</strong> in the <a href="../visualEditor/" >Visual Editor</a>.

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
