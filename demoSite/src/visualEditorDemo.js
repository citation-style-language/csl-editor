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
			'<p style="padding-left: 300px">' +
			'<span id="downloadify">downloadify<\/span><\/p>' +
			'<div id="refManagerInstructions"><\/div>' +
			'<\/div>'),
		saveButton = dialog.find('#downloadify'),
		filename,
		styleId = cslEditor.getStyleId();
	
	dialog.find('#refManagerInstructions').
			load("../html/fileDialog.html", function () {
		filename = cslEditor.getStyleName().replace(/[\\/:"*?<>| ]+/g, "_") + '.csl';

		// prefix styleId with cslEditor/ so it doesn't clash with existing styles
		if (!/^cslEditor\//.test(styleId)) {
			styleId = 'cslEditor/' + styleId;
			cslEditor.setStyleId(styleId);
			assertEqual(cslEditor.getStyleId(), styleId);
			cslCode = CSLEDIT.data.getCslCode();
		}

		dialog.dialog({
			minWidth : 750,
			minHeight : 450,
			modal : true,
			open :  function () {
				dialog.find('#accordion').accordion({});
				saveButton.downloadify({
					swf : '../external/downloadify/downloadify.swf',
					downloadImage : '../external/downloadify/download.png',
					width : 100,
					height : 30,
					filename : filename,
					data : cslCode,
					transparent : true,
					onComplete: function(){
						alert('Your CSL Style Has Been Saved!');
						dialog.dialog('destroy');
					},
					onCancel: function(){ /* no-op */ },
					onError: function(){ alert('Error saving file.'); }
				});
			}
		});
	});
};

var initVisualEditorDemo = function (rootURL) {
	$("document").ready( function () {
		cslEditor = new CSLEDIT.VisualEditor('#visualEditorContainer',	
			{
				loadCSLName : "Load Style",
				loadCSLFunc : loadCSL,

				saveCSLName : 'Save Style',
				saveCSLFunc : saveCSL,
				rootURL : rootURL
			});
	});
};
