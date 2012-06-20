"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.VisualEditor = function (editorElement, userOptions) {
	var editTimeout,
		styleURL,
		syntaxHighlighter,
		nodePathView,
		propertyPanel;

	CSLEDIT.options.setUserOptions(userOptions);

	editorElement = $(editorElement);
	editorElement.load(CSLEDIT.options.get("rootURL") + "/html/visualEditor.html", function () {
		CSLEDIT.schema = CSLEDIT.Schema();
		CSLEDIT.schema.callWhenReady(init);
	});

	var createTreeView = function () {
		var nodeIndex = { index : 0 };
		var cslData = CSLEDIT.data.get(); 

		CSLEDIT.viewController.init(cslData,
		{
			formatCitations : formatExampleCitations,
			deleteNode : function () {
				CSLEDIT.controller.exec("deleteNode", [CSLEDIT.viewController.selectedNode()]);
			},
			moveNode : function (move) {
				var temp,
					fromId,
					toId,
					toParentNode,
					index;

				fromId = parseInt(move.o.attr("cslid"));
				toId = parseInt(move.r.attr("cslid"));
				toParentNode = CSLEDIT.data.getNodeAndParent(toId).parent;

				if (move.last_pos !== false) {
					CSLEDIT.controller.exec("moveNode", [fromId, toId, move.last_pos]);
				}
			},
			checkMove : function (fromId, toId, position) {
				var fromNode = CSLEDIT.data.getNode(fromId),
					toNodeInfo = CSLEDIT.data.getNodeAndParent(toId),
					parentNodeName,
					result,
					toCslId;

				if (position === "before" || position === "after") {
					if (toNodeInfo.parent === null) {
						return false;
					}
					// go up a level
					toNodeInfo = CSLEDIT.data.getNodeAndParent(toNodeInfo.parent.cslId);
				}

				// for moving to a macro instance, note that if the move goes ahead,
				// this translation is done in CSLEDIT.data.addNode, so it's fine to
				// give the macro instance id to the addNode controller command
				toCslId = CSLEDIT.data.macroDefinitionIdFromInstanceId(toNodeInfo.node.cslId);
				if (toCslId !== toNodeInfo.node.cslId) {
					toNodeInfo = CSLEDIT.data.getNodeAndParent(toCslId);
				}

				if (toNodeInfo.parent === null) {
					parentNodeName = "root";
				} else {
					parentNodeName = toNodeInfo.parent.name;
				}
				result = (fromNode.name in CSLEDIT.schema.childElements(parentNodeName + "/" + toNodeInfo.node.name));
				return result;
			}
		});
	};

	var formatExampleCitations = function () {
		CSLEDIT.citationEngine.runCiteprocAndDisplayOutput(
			editorElement.find("#statusMessage"), editorElement.find("#exampleOutput"),
			editorElement.find("#formattedCitations"), editorElement.find("#formattedBibliography"),
			syntaxHighlighter.setupSyntaxHighlighting);
	};


	var reloadPageWithNewStyle = function (newURL) {
		var reloadURL = window.location.href;
		reloadURL = reloadURL.replace(/#/, "");
		reloadURL = reloadURL.replace(/\?.*$/, "");
		window.location.href = reloadURL + "?styleURL=" + newURL;
	};

	var updateCslData = function (cslCode) {
		// strip comments from style
		data = data.replace(/<!--.*?-->/g, "");

		CSLEDIT.data.setCslCode(cslCode);
		createTreeView();
	};

	var showAddNodeDialog = function () {
		var dialogDiv = $('<div><\/div>'),
			node = CSLEDIT.data.getNode(CSLEDIT.viewController.selectedNode()),
			translatedCslId,
			translatedNodeInfo,
			translatedParentName,
			possibleElements,
			element,
			table = $('<table><\/table>'),
			possibleElementsExist = false;

		if (node === null) {
			alert("Please select a node in to create within first");
			return;
		}

		dialogDiv.attr('title', 'Add node within ' + CSLEDIT.uiConfig.displayNameFromNode(node));

		// populate with possible child elements based on schema
		
		// in case the user is selecting a macro instance:
		translatedCslId = CSLEDIT.data.macroDefinitionIdFromInstanceId(node.cslId);
		translatedNodeInfo = CSLEDIT.data.getNodeAndParent(translatedCslId);
	
		if (translatedNodeInfo.parent === null) {
			translatedParentName = "root";
		} else {
			translatedParentName = translatedNodeInfo.parent.name;
		}

		possibleElements = CSLEDIT.schema.childElements(
			translatedParentName + "/" + translatedNodeInfo.node.name);


		$.each(possibleElements, function (element) {
			var img = '<td><\/td>',
				nodeIcon = CSLEDIT.uiConfig.nodeIcons[element];

			if (typeof nodeIcon !== "undefined") {
				img = '<td><img src="' + CSLEDIT.options.get('rootURL') + nodeIcon + '"><\/img><\/td>';
			}
			var displayName;

			displayName = 
				CSLEDIT.uiConfig.displayNameFromNode(new CSLEDIT.CslNode(element));

			console.log("display name = " + displayName );

			table.append($('<tr>' + img + '<td><button class="addNodeType" data-nodeName="' +
				element + '">' + 
				displayName + 
				'<\/button><\/td><\/tr>'));

			possibleElementsExist = true;
		});

		if (!possibleElementsExist) {
			alert("You can't create nodes within " + CSLEDIT.uiConfig.displayNameFromNode(node) + ".");
			return;
		}

		dialogDiv.append(table);

		dialogDiv.find('button.addNodeType').on('click', function (event) {
			var target = $(event.target),
				nodeName = target.attr('data-nodeName');

			CSLEDIT.controller.exec("addNode", [
				CSLEDIT.viewController.selectedNode(), 0, { name : nodeName, attributes : []}
			]);

			dialogDiv.dialog('destroy');
		});

		dialogDiv.dialog({modal : true});
	};

	var setupTreeEditorToolbar = function () {
		var toolbar = editorElement.find('#treeEditorToolbar'),
			addNodeButton = toolbar.find('button.add'),
			deleteNodeButton = toolbar.find('button.delete');

		assertEqual(addNodeButton.length, 1);
		assertEqual(deleteNodeButton.length, 1);

		addNodeButton.on('click', function () {
			showAddNodeDialog();

		});

		deleteNodeButton.on('click', function () {
			CSLEDIT.controller.exec("deleteNode", [CSLEDIT.viewController.selectedNode()]);
		});
	};

	var setupDropdownMenuHandler = function (selector) {
		var dropdown = $(selector),
			loadCsl;

		dropdown.filter('a.loadcsl').html(CSLEDIT.options.get('loadCSLName'));
		dropdown.filter('a.savecsl').html(CSLEDIT.options.get('saveCSLName'));

		editorElement.find(selector).click(function (event) {
			var clickedName = $(event.target).text(),
				selectedNodeId = editorElement.find('#treeEditor').jstree('get_selected'),
				parentNode = $(event.target).parent().parent(),
				parentNodeName,
				position,
				newStyle,
				styleURL;

			if (parentNode.attr("class") === "sub_menu")
			{
				parentNodeName = parentNode.siblings('a').text();

				if (/^Style/.test(parentNodeName)) {
					if (clickedName === "Revert (undo all changes)") {
						reloadPageWithNewStyle(styleURL);
					} else if ($(event.target).is('.savecsl')) {
						CSLEDIT.options.get('saveCSLFunc')(CSLEDIT.data.getCslCode());
					} else if ($(event.target).is('.loadcsl')) {
						var csl = CSLEDIT.options.get('loadCSLFunc')();
						if (csl !== null && typeof csl !== "undefined") {
							CSLEDIT.controller.exec('setCslCode', [csl]);
						}
					} else if (clickedName === "New style") {
						// fetch the URL
						$.ajax({
							url : CSLEDIT.options.get("rootURL") + "/content/newStyle.csl",
							success : function (result) {
								newStyle = result;
							},
							async: false
						});
						CSLEDIT.controller.exec('setCslCode', [newStyle]);
					} else if (clickedName === "Load Style from URL") {
						styleURL = prompt("Please enter the URL of the style you want to load"),

						// fetch the URL
						$.ajax({
							url : '../getFromOtherWebsite.php?url=' + encodeURIComponent(styleURL),
							success : function (result) {
								newStyle = result;
							},
							async: false
						});

						CSLEDIT.controller.exec("setCslCode", [newStyle]);
					} else if (clickedName === "Style Info") {
						CSLEDIT.viewController.selectNode(CSLEDIT.data.getNodesFromPath("style/info")[0].cslId);
					} else if (clickedName === "Global Formatting Options") {
						CSLEDIT.viewController.selectNode(CSLEDIT.data.getNodesFromPath("style")[0].cslId);
					}
				} else if (parentNodeName === "Edit") {
					if (clickedName === "Undo") {
						if (CSLEDIT.controller.commandHistory.length === 0) {
							alert("No commands to undo");
						} else {
							CSLEDIT.controller.undo();
						}
					}
				}
			}
		});
	};

	var init = function () {
		if (!$.browser.webkit && !$.browser.mozilla) {
			$('body').html("<h2>Please use the latest version of " +
				"Chrome or Firefox to view this page.<\/h2>").css({margin:50});
			return;
		}

		$(function(){
			editorElement.find("ul.dropdown li").hoverIntent(function(){
				$(this).addClass("hover");
				$('ul:first',this).css('visibility', 'visible');
			}, function(){
				$(this).removeClass("hover");
				$('ul:first',this).css('visibility', 'hidden');
			});
			
			editorElement.find("ul.dropdown li ul li:has(ul)").find("a:first").append(" &raquo; ");
		});

		CSLEDIT.data.initPageStyle( function () {
			var userOnChangeCallback = CSLEDIT.options.get("onChange"),
				citationEditor1,
				citationEditor2;
			
			syntaxHighlighter = CSLEDIT.SyntaxHighlighter(editorElement);

			CSLEDIT.viewController = CSLEDIT.ViewController(
				editorElement.find("#treeEditor"),
				editorElement.find("#titlebar"),
				editorElement.find("#elementProperties"),
				editorElement.find("#nodePathView"),
				setupDropdownMenuHandler,
				syntaxHighlighter);

			CSLEDIT.controller.setCslData(CSLEDIT.data);
			CSLEDIT.data.addViewController(CSLEDIT.viewController);

			if (typeof userOnChangeCallback === "function") {
				CSLEDIT.data.addViewController({
					styleChanged : function (command) {
						if (command === "formatCitations") {
							userOnChangeCallback();
						}
					}
				});
			}

			createTreeView();

			citationEditor1 = CSLEDIT.EditReferences(
				editorElement.find('ul.#exampleCitation1'), formatExampleCitations, 0, [0]);
			citationEditor2 = CSLEDIT.EditReferences(
				editorElement.find('ul.#exampleCitation2'), formatExampleCitations, 1, [11]);

			CSLEDIT.AddReferencesDropTarget($('#exampleOutput'), function () {
				citationEditor1.init();
				citationEditor2.init();
			});

		});

		setupTreeEditorToolbar();
		setupDropdownMenuHandler(".dropdown a");

		editorElement.find('#mainContainer').layout({
			closable : false,
			resizble : true,
			livePaneResizing : true,
			west__size : CSLEDIT.storage.getItem("CSLEDIT.geometry.leftPaneWidth") || 240,
			west__minSize : 200,
			onresize : function (paneName, paneElement, paneState) {
				if (paneState.edge === "west") {
					CSLEDIT.storage.setItem("CSLEDIT.geometry.leftPaneWidth", paneState.size);
				}
			}
		});

		editorElement.find("#rightContainer").layout({
			closable : false,
			resizable : true,
			livePaneResizing : true,
			north__size : CSLEDIT.storage.getItem("CSLEDIT.geometry.topPaneWidth") || 300,
			onresize : function (paneName, paneElement, paneState) {
				if (paneState.edge === "north") {
					CSLEDIT.storage.setItem("CSLEDIT.geometry.topPaneWidth", paneState.size);
				}
			}
		});

		CSLEDIT.notificationBar.init(editorElement.find('#notificationBar'));
	};

	// public API
	return {
		setCslCode : function (cslCode) {
			CSLEDIT.controller.exec('setCslCode', [cslCode]);
		},
		getCslCode : function () {
			return CSLEDIT.data.getCslCode();
		},
		getStyleName : function () {
			var styleNameNode = CSLEDIT.data.getNodesFromPath('style/info/title')[0];
			return styleNameNode.textValue;
		},
		getStyleId : function () {
			var styleIdNode = CSLEDIT.data.getNodesFromPath('style/info/id')[0];
			return styleIdNode.textValue;
		},
		setStyleId : function (styleId) {
			var styleIdNode = CSLEDIT.data.getNodesFromPath('style/info/id')[0];
			styleIdNode.textValue = styleId;
			CSLEDIT.controller.exec('amendNode', [styleIdNode.cslId, styleIdNode]);
		}
	};
};
