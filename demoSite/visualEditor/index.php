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
	<script type="text/javascript" src="../../external/citeproc/loadsys.js"></script>
	<script type="text/javascript" src="../../external/citeproc/runcites.js"></script>
	<script type="text/javascript" src="../../external/diff-match-patch/diff_match_patch.js"></script>

	<script type="text/javascript" src="../../external/jstree/_lib/jquery.hotkeys.js"></script>
	<script type="text/javascript" src="../../external/jstree/jquery.jstree-patch1.js"></script>
	<link type="text/css" rel="stylesheet" href="../../external/jstree/themes/default/style.css" />

	<script type="text/javascript" src="../../external/jquery.layout-latest-min.js"></script>
	<script type="text/javascript" src="../../external/jquery.hoverIntent.minified.js"></script>
	<script type="text/javascript" src="../../external/jquery.scrollTo-1.4.2-min.js"></script>

	<script type="text/javascript" src="../../src/options.js"></script>
	<script type="text/javascript" src="../../src/storage.js"></script>
	<script type="text/javascript" src="../../src/citationEngine.js"></script>
	<script type="text/javascript" src="../../src/exampleData.js"></script>
	<script type="text/javascript" src="../../src/diff.js"></script>
	<script type="text/javascript" src="../../src/debug.js"></script>
	<script type="text/javascript" src="../../src/cslParser.js"></script>
	<script type="text/javascript" src="../../src/Iterator.js"></script>
	<script type="text/javascript" src="../../src/cslNode.js"></script>
	<script type="text/javascript" src="../../src/cslData.js"></script>
	<script type="text/javascript" src="../../src/schema.js"></script>

	<script type="text/javascript" src="../../src/MultiPanel.js"></script>
	<script type="text/javascript" src="../../src/uiConfig.js"></script>
	<script type="text/javascript" src="../../src/notificationBar.js"></script>
	<script type="text/javascript" src="../../src/editReferences.js"></script>
	<script type="text/javascript" src="../../src/NodePathView.js"></script>
	<script type="text/javascript" src="../../src/MultiComboBox.js"></script>
	<script type="text/javascript" src="../../src/propertyPanel.js"></script>
	<script type="text/javascript" src="../../src/sortPropertyPanel.js"></script>
	<script type="text/javascript" src="../../src/infoPropertyPanel.js"></script>
	<script type="text/javascript" src="../../src/editNodeButton.js"></script>
	<script type="text/javascript" src="../../src/smartTree.js"></script>
	<script type="text/javascript" src="../../src/Titlebar.js"></script>
	<script type="text/javascript" src="../../src/ViewController.js"></script>
	<script type="text/javascript" src="../../src/controller.js"></script>
	<script type="text/javascript" src="../../src/visualEditor.js"></script>

	<script type="text/javascript" src="../external/downloadify/swfobject.js"></script>
	<script type="text/javascript" src="../external/downloadify/downloadify.min.js"></script>

	<link type="text/css" rel="stylesheet" href="../../css/dropdown.css" />

	<link rel="stylesheet" href="../../css/base.css" />
	<link rel="stylesheet" href="../../css/visualEditor.css" />

	<script type="text/javascript" src="../src/analytics.js"></script>

	<style>
		#visualEditorContainer {
			position: absolute;
			top: 27px;
			bottom: 0px;
			left: 0px;
			right: 0px;
		}
	</style>
	<script type="text/javascript">
		var cslEditor;
		$("document").ready( function () {
			cslEditor = new CSLEDIT.VisualEditor('#visualEditorContainer',	
				{
					// Use FileAPI to read files from local file system
					loadCSLName : "Load Style",
					loadCSLFunc : function () {
						var dialog = $('<div title="Load CSL Style">' + 
								'<p>Choose a CSL file to load<\/p>' +
								'<input type="file" \/>' +
								'<\/div>');
						dialog.find('input[type=file]').change(function (event) {
							var file = event.target.files[0],
								reader = new FileReader();
							reader.onload = function (event) {
								cslEditor.setCslCode(event.target.result);
								dialog.dialog("destroy");
							};
							reader.readAsText(file);
						});

						dialog.dialog({modal : true});
					},

					// Use Flash based downloadify plugin to save files to local file system
					saveCSLName : 'Save Style',
					saveCSLFunc : function (cslCode) {
						var dialog = $('<div title="Save CSL Style">' + 
								'<p>Save CSL style for use in your Reference Manager<\/p>' +
								'<p id="downloadify">downloadify<\/p>' +
								'<\/div>'),
							saveButton = dialog.find('#downloadify');

						assertEqual(saveButton.length, 1);
						
						dialog.dialog({
							modal : true,
							open :  function () {
								saveButton.downloadify({
									swf : '../external/downloadify/downloadify.swf',
									downloadImage : '../external/downloadify/download.png',
									width : 100,
									height : 30,
									filename : 'testSaveCsl.csl',
									data : cslCode,
									transparent : true,
									onComplete: function(){ alert('Your CSL Style Has Been Saved!'); },
									onCancel: function(){ /* no-op */ },
									onError: function(){ alert('Error saving file.'); }
								});
							}
						
						});
					},
					rootURL : "../.."
				});
		});
	</script>
</head>
<body id="visualEditor">
<?php include '../html/navigation.html'; ?>
<div id="visualEditorContainer">
</div>
</body>
</html>
