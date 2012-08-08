"use strict";

require.config({
	baseUrl: "../.."
});

requirejs(
		[
			'src/VisualEditor',
			'demoSite/external/downloadify/swfobject',
			'demoSite/external/downloadify/downloadify.min'
		],
		function (CSLEDIT_VisualEditor) {

	var cslEditor;

	// Use FileAPI to read files from local file system
	var loadCSL = function () {
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
	};

	// Use Flash based downloadify plugin to save files to local file system
	var saveCSL = function (cslCode) {
		var dialog = $('<div title="Save CSL Style">' + 
				'<div id="downloadify" style="padding-left: 300px"></div>' +
				'<div id="installFlash" style="padding-left:50px"></div>' +
				'<div id="refManagerInstructions"><\/div>' +
				'<\/div>'),
			saveButton = dialog.find('#downloadify'),
			filename,
			styleId = cslEditor.getStyleId();
		
		dialog.find('#refManagerInstructions').load("../html/fileDialog.html", function () {

			if (!cslEditor.conformStyleToRepoConventions()) {
				return;
			}

			filename = cslEditor.getStyleId().replace(/.*\//g, "").replace(/[\\\/:"*?<>| ]+/g, "-") + '.csl';

			// add comment to start
			cslCode = CSLEDIT_data.getCslCode("This style was edited with the Visual CSL Editor (" +
				window.location.href + ")");

			dialog.dialog({
				minWidth : 750,
				minHeight : 450,
				modal : true,
				open :  function () {
					dialog.find('#accordion').accordion({});
					saveButton.find('a').css({
						color : "blue",
						"text-decoration" : "underline"
					});

					saveButton.children().remove();

					saveButton.downloadify({
						swf : '../external/downloadify/downloadify.swf',
						downloadImage : '../external/downloadify/download.png',
						width : 100,
						height : 30,
						filename : filename,
						data : cslCode,
						transparent : true,
						onComplete: function () {
							alert('Your CSL Style Has Been Saved!');
							dialog.dialog('destroy');
						},
						onCancel: function () { },
						onError: function () { alert('Error saving file.'); }
					});

					// if it failed, show instructions to install flash player
					if (saveButton.find('object').length === 0) {
						dialog.find('#refManagerInstructions').css({display: "none"});
						dialog.find('#installFlash').html(
							'<h2>Flash Player not found</h2><br/>' + 
							'<h3>To save to disk, you need to:' +
							'<ul>' +
							'<li><a href="http://get.adobe.com/flashplayer/">Install Adobe Flash Player</a></li>' +
							'<li>Reload this page and try again</li>' + 
							'</ul></h3>');
					} else {
						dialog.find('#refManagerInstructions').css({display: "block"});
						dialog.find('#installFlash').html('');
					}
				}
			});
		});
	};

	var initVisualEditorDemo = function (rootURL) {
		$("document").ready(function () {
			window.onerror = function (err, url, line) {
				var dialog = $('<div title="An Error Occurred"></div>').css({overflow: "auto"}),
					errLines = err.split("\n"),
					refreshPage = $('<button>Refresh Page</button>'),
					resetButton = $('<button>Reset Everything</button>');

				$.ajax({
					url : "../logError.php",
					type : "POST",
					data : {
						message : err + "\nBrowser: " + JSON.stringify($.browser) +
							"\nUrl: " + url + "\nLine: " + line
					},
					success : function (data) {
						console.log("Logged error: " + data);
					},
					error : function () {
						console.log("Failed to log error");
					}
				});

				dialog.append($('<p/>').append(refreshPage).append(" try this first"));
				refreshPage.on("click", function () {
					window.location.reload();
				});

				dialog.append($('<p/>').append(resetButton).append(" unsaved work will be lost"));
				resetButton.on("click", function () {
					CSLEDIT_storage.clear();
					window.location.reload();
				});

				dialog.append("<h3>" + errLines[0] + "</h3>");

				errLines.splice(0, 1);
				if (errLines.length > 0) {
					//dialog.append("<ul><li>" + errLines.join("</li><li>") + "</li></ul>");
					dialog.append("<pre>" + errLines.join("\n") + "</pre>");
				} else {
					dialog.append("<p>url: " + url + "</p>");
					dialog.append("<p>line: " + line + "</p>");
				}

				dialog.dialog({
					width: 650,
					height: 400
				});
			};

			cslEditor = new CSLEDIT_VisualEditor('#visualEditorContainer',	
				{
					loadCSLName : "Load Style",
					loadCSLFunc : loadCSL,

					saveCSLName : 'Save Style',
					saveCSLFunc : saveCSL,
					rootURL : rootURL
				});
		});
	};

	initVisualEditorDemo("../..");

//	return {
//		init : initVisualEditorDemo,
//		cslEditor : cslEditor
//	};
});
