"use strict";

// Creates a Visual CSL Editor

define(
		[	'src/controller',
			'src/ViewController',
			'src/notificationBar',
			'src/SyntaxHighlighter',
			'src/citationEditor',
			'src/Schema',
			'src/schemaOptions',
			'src/CslNode',
			'src/citationEngine',
			'src/options',
			'src/storage',
			'src/dataInstance',
			'src/cslStyles',
			'src/urlUtils',
			'src/addNodeDialog',
			'src/debug',
			'jquery.hoverIntent',
			'jquery.layout'
		],
		function (
			CSLEDIT_controller,
			CSLEDIT_ViewController,
			CSLEDIT_notificationBar,
			CSLEDIT_SyntaxHighlighter,
			CSLEDIT_citationEditor,
			CSLEDIT_Schema,
			CSLEDIT_schemaOptions,
			CSLEDIT_CslNode,
			CSLEDIT_citationEngine,
			CSLEDIT_options,
			CSLEDIT_storage,
			CSLEDIT_data,
			CSLEDIT_cslStyles,
			CSLEDIT_urlUtils,
			CSLEDIT_addNodeDialog,
			debug,
			jquery_hoverIntent,
			jquery_layout
		) {
	// Sets up a Visual Editor within editorElement
	var CSLEDIT_VisualEditor = function (
			editorElement,       // the selector or jQuery element to create the editor within
			configurationOptions // see https://github.com/citation-style-editor/csl-editor/wiki/Visual-Editor
								 // for a full list of options
			) {
		var editTimeout,
			styleURL,
			syntaxHighlighter,
			nodePathView;

		$(document).ready(function () {
			CSLEDIT_options.setOptions(configurationOptions);
			editorElement = $(editorElement);

			$.ajax({
				url: CSLEDIT_urlUtils.getResourceUrl("html/visualEditor.html"),
				success : function (data) {
					editorElement.html(data);
					window.CSLEDIT_schema = new CSLEDIT_Schema(CSLEDIT_schemaOptions);
					CSLEDIT_schema.callWhenReady(init);
				},
				error : function (jaXHR, textStatus, errorThrown) {
					alert("Couldn't fetch page: " + textStatus);
				},
				cache : false
			});
		});

		var createTreeView = function () {
			var nodeIndex = { index : 0 };
			var cslData = CSLEDIT_data.get(); 

			CSLEDIT_viewController.init(cslData,
			{
				formatCitations : formatExampleCitations,
				deleteNode : function () {
					CSLEDIT_controller.exec("deleteNode", [CSLEDIT_viewController.selectedNode()]);
				},
				moveNode : function (move) {
					var temp,
						fromId,
						toId,
						toParentNode,
						index;

					fromId = parseInt(move.o.attr("cslid"), 10);
					toId = parseInt(move.r.attr("cslid"), 10);
					toParentNode = CSLEDIT_data.getNodeAndParent(toId).parent;

					if (move.last_pos !== false) {
						CSLEDIT_controller.exec("moveNode", [fromId, toId, move.last_pos]);
					}
				},
				checkMove : function (fromId, toId, position) {
					var fromNode = CSLEDIT_data.getNode(fromId),
						toNodeInfo = CSLEDIT_data.getNodeAndParent(toId),
						parentNodeName,
						result,
						toCslId;

					if (position === "before" || position === "after") {
						if (toNodeInfo.parent === null) {
							return false;
						}
						// go up a level
						toNodeInfo = CSLEDIT_data.getNodeAndParent(toNodeInfo.parent.cslId);
					}

					// for moving to a macro instance, note that if the move goes ahead,
					// this translation is done in CSLEDIT_data.addNode, so it's fine to
					// give the macro instance id to the addNode controller command
					toCslId = CSLEDIT_data.macroDefinitionIdFromInstanceId(toNodeInfo.node.cslId);
					if (toCslId !== toNodeInfo.node.cslId) {
						toNodeInfo = CSLEDIT_data.getNodeAndParent(toCslId);
					}

					if (toNodeInfo.parent === null) {
						parentNodeName = "root";
					} else {
						parentNodeName = toNodeInfo.parent.name;
					}
					result = (fromNode.name in 
						CSLEDIT_schema.childElements(parentNodeName + "/" + toNodeInfo.node.name));
					return result;
				},
				viewInitialised : function () {
					var loaded = CSLEDIT_options.get("onLoaded");
					if (typeof(loaded) !== "undefined") {
						loaded();
					}
				}
			});
		};

		var formatExampleCitations = function () {
			CSLEDIT_citationEngine.runCiteprocAndDisplayOutput(
				CSLEDIT_data,
				editorElement.find("#statusMessage"),
				editorElement.find("#formattedCitations"), editorElement.find("#formattedBibliography"),
				syntaxHighlighter.setupSyntaxHighlighting);
		};

		var reloadPageWithNewStyle = function (newURL) {
			var reloadURL = window.location.href;
			reloadURL = reloadURL.replace(/#/, "");
			reloadURL = reloadURL.replace(/\?.*$/, "");
			window.location.href = reloadURL + "?styleURL=" + newURL;
		};

		var addMissingNode = function (missingNodePath) {
			var rootPath,
				nodeName,
				rootNode,
				newNode;

			if (typeof(missingNodePath) === "undefined" || missingNodePath === null) {
				return;
			}
			
			rootPath = missingNodePath.replace(/\/[^\/]+$/, "");
			nodeName = missingNodePath.replace(rootPath + "/", "");

			rootNode = CSLEDIT_data.getNodesFromPath(rootPath);
			debug.assert(rootNode.length > 0);
			rootNode = rootNode[0];

			CSLEDIT_controller.exec('addNode', [rootNode.cslId, "last", { name: nodeName } ]);
		};

		var setupTreeEditorToolbar = function () {
			var toolbar = editorElement.find('#treeEditorToolbar'),
				addNodeButton = toolbar.find('a.add'),
				deleteNodeButton = toolbar.find('a.delete');

			debug.assertEqual(addNodeButton.length, 1);
			debug.assertEqual(deleteNodeButton.length, 1);

			addNodeButton.on('click', function (e) {
				if (CSLEDIT_viewController.selectedNode() === -1) {
					addMissingNode(CSLEDIT_viewController.selectedMissingNodePath());
				} else {
					CSLEDIT_addNodeDialog.show();
				}
				e.preventDefault();
			});

			deleteNodeButton.on('click', function (e) {
				if (CSLEDIT_viewController.selectedNode() === -1) {
					alert("No node selected to delete");
				} else {
					CSLEDIT_controller.exec("deleteNode", [CSLEDIT_viewController.selectedNode()]);
				}
				e.preventDefault();
			});
		};

		var setCustomMenuItem = function (element, name, onClick) {
			if (typeof(name) === "undefined" || name === "") {
				element.parent('li').remove();
			} else {
				element.text(name);
				element.click(onClick);
			}
		};

		var setupDropdownMenuHandler = function (selector) {
			var dropdown = $(selector),
				loadCsl;

			// Adds the options from the settings into the Style menu
			var styleMenu = CSLEDIT_options.get('styleMenu');
			var styleMenuUl = editorElement.find('#styleMenuUl');
			console.log(styleMenu);
			$.each(styleMenu, function(index, styleOption) {
				var menuOption = $('<li/>').append($('<a/>')
						.text(styleOption.label));

				if (typeof styleOption.name != 'undefined') {
					menuOption.attr('id',styleOption.name);
				}
				menuOption.click(styleOption.func);
				styleMenuUl.append(menuOption);
			});

			// If menuNewStyle id exists: will create a new style
			editorElement.find('#menuNewStyle').click(function () {
				// fetch the URL
				$.ajax({
					url : CSLEDIT_urlUtils.getResourceUrl("content/newStyle.csl"),
					dataType : "text",
					success : function (cslCode) {
						debug.log("csl code received: " + cslCode);
						CSLEDIT_controller.exec('setCslCode', [cslCode]);
					},
					error : function () {
						throw new Error("Couldn't fetch new style");
					},
					async : false
				});
			});

			editorElement.find('#menuUndo').click(function () {
				if (CSLEDIT_controller.commandHistory.length === 0) {
					alert("No commands to undo");
				} else {
					CSLEDIT_controller.undo();
				}
			});
			
			editorElement.find('#menuRedo').click(function () {
				if (CSLEDIT_controller.undoCommandHistory.length === 0) {
					alert("No commands to redo");
				} else {
					CSLEDIT_controller.redo();
				}
			});
			
			// Creates the Help menu if this menu exists. Populates
			// with links
			var helpLinks = CSLEDIT_options.get('helpLinks');
			if (typeof helpLinks !== 'undefined' && helpLinks.length != 0) {
				var visualEditorMenu = editorElement.find('#visualEditorMenu');

				visualEditorMenu.append($('<li/>').attr('id','helpMenuMain'));
				
				var helpMenuMain = editorElement.find('#helpMenuMain');
				var helpMenuLink = $('<a/>')
					.attr('id','helpMenu')
					.text('Help').
					append($('<span>').
						attr('class','disclosure').
						html('&#9662;'));

				helpMenuMain.append(helpMenuLink);

				helpMenuMain.append($('<ul/>')
						.attr('id','helpMenuUl')
						.attr('class','sub_menu'));

				var helpMenu = editorElement.find('#helpMenuUl');
				$.each(helpLinks, function(index, link) {
					helpMenu.append(($('<li/>').append($('<a/>')
							.attr('href', link.link)
							.attr('target','_blank')
							.text(link.label))));
				});
			}

			editorElement.find('#menuEditCitation1').click(function () {
				CSLEDIT_citationEditor.editCitation(0);
			});
			
			editorElement.find('#menuEditCitation2').click(function () {
				CSLEDIT_citationEditor.editCitation(1);
			});

			editorElement.find('#menuEditCitation3').click(function () {
				CSLEDIT_citationEditor.editCitation(2);
			});
		};

		var init = function () {
			var showingDataChangePrompt = false;

			CSLEDIT_notificationBar.init(editorElement.find('#notificationBar'));

			// set function which gets called if inconsistencies
			// are found between the localStorage data (shared between tabs) and this session
			// data
			CSLEDIT_storage.onDataInconsistency(function () {
				showingDataChangePrompt = true;
				if (confirm("Your style has changed in a different tab.\n" +
						"Do you want to load the new version into this tab?")) {
					// reload page
					window.location.reload();
				} else {
					// use existing data
					CSLEDIT_storage.recreateLocalStorage();
					showingDataChangePrompt = false;
				}
			});

			// check consistency of data on window focus
			// to detect changes in different tabs
			debug.log("window length = " + $(window).length);
			$(window).focus(function () {
				if (!showingDataChangePrompt) {
					CSLEDIT_data.get();
				}
			});

			$(function () {
				editorElement.find("ul.dropdown li").hoverIntent(function () {
					$(this).addClass("hover");
					$('ul:first', this).css('visibility', 'visible');
				}, function () {
					$(this).removeClass("hover");
					$('ul:first', this).css('visibility', 'hidden');
				});
				
				editorElement.find("ul.dropdown li ul li:has(ul)").find("a:first").append(" &raquo; ");
			});

			CSLEDIT_data.initPageStyle(function () {
				var userOnChangeCallback = CSLEDIT_options.get("onChange"),
					citationEditor1,
					citationEditor2;
				
				syntaxHighlighter = new CSLEDIT_SyntaxHighlighter(
					editorElement.find('#titlebar, #nodePathView, #exampleOutput'),
					editorElement.find('#treeEditor')
				);

				// TODO: refactor - remove this global
				window.CSLEDIT_viewController = new CSLEDIT_ViewController(
					editorElement.find("#treeEditor"),
					editorElement.find("#titlebar"),
					editorElement.find("#elementProperties"),
					editorElement.find("#nodePathView"),
					syntaxHighlighter);

				CSLEDIT_data.addViewController(CSLEDIT_viewController);

				if (typeof userOnChangeCallback === "function") {
					CSLEDIT_data.addViewController({
						styleChanged : function (command) {
							if (command === "updateFinished") {
								userOnChangeCallback();
							}
						}
					});
				}

				createTreeView();
			});

			setupTreeEditorToolbar();
			setupDropdownMenuHandler(".dropdown a");

			editorElement.find('#mainContainer').layout({
				closable : false,
				resizable : true,
				livePaneResizing : true,
				west__size : CSLEDIT_storage.getItem("CSLEDIT_geometry.leftPaneWidth") || 240,
				west__minSize : 200,
				onresize : function (paneName, paneElement, paneState) {
					if (paneState.edge === "west") {
						CSLEDIT_storage.setItem("CSLEDIT_geometry.leftPaneWidth", paneState.size);
					}
				}
			});

			// workaround for apparent bug where jquery.layout sets overflow to auto
			// TODO: investigate why
			editorElement.find('#mainContainer').css("overflow", "hidden");

			editorElement.find("#rightSplitterLayout").layout({
				closable : false,
				resizable : true,
				livePaneResizing : true,
				north__size : CSLEDIT_storage.getItem("CSLEDIT_geometry.topPaneWidth") || 300,
				onresize : function (paneName, paneElement, paneState) {
					if (paneState.edge === "north") {
						CSLEDIT_storage.setItem("CSLEDIT_geometry.topPaneWidth", paneState.size);
					}
				}
			});
			// undo layout setting a fixed width
			editorElement.find('#bottomRightContainer').css('width', '');
		};

		// Called when saving a style. It Checks that the style conforms to repository
		// conventions and prompts the user to change it if it doesn't
		//
		// Returns true to continue saving, false to cancel
		var conformStyleToRepoConventions = function () {
			var generatedStyleId,
				links,
				selfLinkNode,
				selfLink,
				styleName = getStyleName(),
				cancel = false;

			// check that the styleId and rel self link matches the schema conventions
			generatedStyleId = CSLEDIT_cslStyles.generateStyleId(getStyleName());
			links = CSLEDIT_data.getNodesFromPath("style/info/link");
			$.each(links, function (i, link) {
				link = new CSLEDIT_CslNode(link);

				if (link.getAttr("rel") === "self") {
					selfLinkNode = link;
					selfLink = link.getAttr("href");
				}
			});

			debug.log("generatedStyleId = " + generatedStyleId);
			$.each(CSLEDIT_cslStyles.styles().styleTitleFromId, function (id, name) {
				if (id === generatedStyleId || name === styleName) {
					if (!confirm('The style title matches one that already exists.\n\n' +
							'You should change it to avoid problems using this style ' +
							'in your reference manager.\n\n' +
							'Do you want to save anyway?')) {
						cancel = true;
						return false;
					}
				}
			});

			if (cancel) {
				return false;
			}

			if (selfLink !== generatedStyleId || getStyleId() !== generatedStyleId) {
				if (confirm('Change style ID and "self" link to the following?\n\n' +
						generatedStyleId + "\n\n(the CSL styles repository convention)")) {
					setStyleId(generatedStyleId);
					if (typeof(selfLinkNode) !== "undefined") {
						selfLinkNode.setAttr("href", generatedStyleId);
						CSLEDIT_controller.exec("amendNode", [selfLinkNode.cslId, selfLinkNode]);
					} else {
						CSLEDIT_controller.exec("addNode", [CSLEDIT_data.getNodesFromPath("style/info")[0].cslId, "last",
							new CSLEDIT_CslNode("link", [
								{key: "rel", value: "self", enabled: true},
								{key: "href", value: generatedStyleId, enabled: true}
							])]);
					}
				}
			}
			return true;
		};

		// Sets a new CSL style from the given cslCode string
		var setCslCode = function (cslCode) {
			return CSLEDIT_controller.exec('setCslCode', [cslCode]);
		};
	
		// Returns the current CSL style code as a string
		var getCslCode = function () {
			return CSLEDIT_data.getCslCode();
		};

		// Returns the current style name
		var getStyleName = function () {
			var styleNameNode = CSLEDIT_data.getNodesFromPath('style/info/title')[0];
			return styleNameNode.textValue;
		};

		// Returns the current style ID
		var getStyleId = function () {
			var styleIdNode = CSLEDIT_data.getNodesFromPath('style/info/id')[0];
			return styleIdNode.textValue;
		};
		
		// Sets the ID for the current style
		var setStyleId = function (styleId) {
			var styleIdNode = CSLEDIT_data.getNodesFromPath('style/info/id')[0];
			styleIdNode.textValue = styleId;
			CSLEDIT_controller.exec('amendNode', [styleIdNode.cslId, styleIdNode]);
		};

		// Public API
		//
		// Note: these are currently more of a set of convenience functions than a complete API
		//
		// There is nothing stopping you using the 'proper' internal API and this is the recommended
		// method at the moment.
		//
		// See https://github.com/citation-style-editor/csl-editor/wiki/Visual-Editor for some
		// examples
		return {
			setCslCode : setCslCode,
			getCslCode : getCslCode,
			getStyleName : getStyleName,
			getStyleId : getStyleId,
			setStyleId : setStyleId,
			conformStyleToRepoConventions : conformStyleToRepoConventions
		};
	};

	return CSLEDIT_VisualEditor;
});

