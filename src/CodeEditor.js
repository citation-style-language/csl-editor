"use strict";

// This creates a CSL code editor with real time preview
//
// It uses CodeMirror to provide the code editing view

define([	'src/citationEngine',
			'src/options',
			'src/dataInstance',
			'src/urlUtils',
			'src/dropdownMenu',
			'src/citationEditor',
			'external/codemirror',
			'external/codemirrorXmlMode',
			'jquery.layout'
		],
		function (
			CSLEDIT_citationEngine,
			CSLEDIT_options,
			CSLEDIT_data,
			CSLEDIT_urlUtils,
			CSLEDIT_dropdownMenu,
			CSLEDIT_citationEditor,
			CodeMirror,
			CodeMirrorXmlMode,
			jquery_layout
		) {
	// Creates a CSL Code Editor within containerElement
	var CSLEDIT_codeEditor = function (
			containerElement,     // the selector or jQuery element to create the editor within
			configurationOptions  // see https://github.com/citation-style-editor/csl-editor/wiki/Code-Editor
			                      // for available options
			) {
		var codeTimeout,
			editor,
			diffTimeout,
			diffMatchPatch = new diff_match_patch(),
			oldFormattedCitation = "",
			newFormattedCitation = "",
			oldFormattedBibliography = "",
			newFormattedBibliography = "",
			styleURL;

		containerElement = $(containerElement);

		CSLEDIT_options.setOptions(configurationOptions);

		$.ajax({
			url: CSLEDIT_urlUtils.getResourceUrl("html/codeEditor.html"),
			success : function (data) {
				containerElement.html(data);
				init();
			},
			error : function (jaXHR, textStatus, errorThrown) {
				alert("Couldn't fetch page: " + textStatus);
			},
			cache : false,
			dataType : "text"
		});

		var setupDropdownMenu = function () {
			CSLEDIT_dropdownMenu.init(containerElement);

			// Wire up Example Citations menu
			containerElement.find('#menuEditCitation1').click(function () {
				CSLEDIT_citationEditor.editCitation(0);
			});
			containerElement.find('#menuEditCitation2').click(function () {
				CSLEDIT_citationEditor.editCitation(1);
			});
			containerElement.find('#menuEditCitation3').click(function () {
				CSLEDIT_citationEditor.editCitation(2);
			});

		};

		var updateTitlebar = function () {
			var titleNodes = CSLEDIT_data.getNodesFromPath('style/info/title');
			var title = "No title";
			if (titleNodes.length > 0 && titleNodes[0].textValue) {
				title = titleNodes[0].textValue;
			}
			containerElement.find('#titlebar h3').text(title);
		};

		var init = function () {
			var codeMirrorScroll,
				codeMirrorContainer,
				userCallback = CSLEDIT_options.get("onChange");

			CodeMirror.defaults.onChange = function()
			{
				clearTimeout(codeTimeout);
				codeTimeout = setTimeout( function () {
					var result = CSLEDIT_data.setCslCode(editor.getValue());

					if ("error" in result) {
						$("#statusMessage").text(result.error);
						$("#formattedCitations").html("");
						$("#formattedBibliography").html("");
					} else {
						CSLEDIT_citationEngine.runCiteprocAndDisplayOutput(
							CSLEDIT_data,
							$("#statusMessage"),
							$("#formattedCitations"), $("#formattedBibliography"));
						updateTitlebar();
					}

					if (typeof(userCallback) !== "undefined") {
						userCallback(editor.getValue());
					}
				}, 500);
			};

			editor = CodeMirror.fromTextArea($("#code")[0], {
					mode: { name: "xml" },
					lineNumbers: true
			});

			CSLEDIT_data.initPageStyle( function () {
				editor.setValue(CSLEDIT_data.getCslCode());
				updateTitlebar();
			});

			codeMirrorScroll = $('.CodeMirror-scroll');
			codeMirrorContainer = $('#codeMirrorContainer');
			
			var resizeCodeEditor = function () {
				
				codeMirrorScroll.css({
					height: codeMirrorContainer.height() + "px"
				});
			};

			var layoutContainer = containerElement.find('#codeEditorLayout');
			layoutContainer.css({
				position: 'absolute',
				top: '36px',
				bottom: '0',
				left: '0',
				right: '0'
			});
			layoutContainer.layout({
				north__size : 300,
				livePaneResizing : true,
				onresize : resizeCodeEditor
			});

			resizeCodeEditor();
			setupDropdownMenu();
		};

		// Sets a new CSL style from the given cslCode string
		var setCslCode = function (cslCode) {
			var result = CSLEDIT_data.setCslCode(cslCode);
			if (!("error" in result)) {
				editor.setValue(CSLEDIT_data.getCslCode());
				updateTitlebar();
			}
			return result;
		};

		// Returns the current CSL style code as a string
		var getCslCode = function () {
			return editor.getValue();
		};

		// Returns the current style ID
		var getStyleId = function () {
			var styleIdNode = CSLEDIT_data.getNodesFromPath('style/info/id');
			if (styleIdNode.length > 0) {
				return styleIdNode[0].textValue;
			}
			return "";
		};

		return {
			setCslCode : setCslCode,
			getCslCode : getCslCode,
			getStyleId : getStyleId
		};
	};

	return CSLEDIT_codeEditor;
});
