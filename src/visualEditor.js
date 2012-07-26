"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.VisualEditor = function (editorElement, userOptions) {
	var editTimeout,
		styleURL,
		syntaxHighlighter,
		nodePathView;

	CSLEDIT.options.setUserOptions(userOptions);

	editorElement = $(editorElement);

	$.ajax({
		url: CSLEDIT.options.get("rootURL") + "/html/visualEditor.html",
		success : function (data) {
			editorElement.html(data);
			CSLEDIT.schema = CSLEDIT.Schema(CSLEDIT.schemaOptions);
			CSLEDIT.schema.callWhenReady(init);
		},
		error : function (jaXHR, textStatus, errorThrown) {
			alert("Couldn't fetch page: " + textStatus);
		},
		cache : false
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

				fromId = parseInt(move.o.attr("cslid"), 10);
				toId = parseInt(move.r.attr("cslid"), 10);
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
				result = (fromNode.name in 
					CSLEDIT.schema.childElements(parentNodeName + "/" + toNodeInfo.node.name));
				return result;
			},
			viewInitialised : function () {
				var loaded = CSLEDIT.options.get("onLoaded");
				if (typeof(loaded) !== "undefined") {
					loaded();
				}
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

	var showAddNodeDialog = function () {
		var dialogDiv = $('<div id="addNodeDialog"></div>'),
			node = CSLEDIT.data.getNode(CSLEDIT.viewController.selectedNode()),
			translatedCslId,
			translatedNodeInfo,
			translatedParentName,
			possibleElements,
			element,
			table = $('<table></table>'),
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

		possibleElements = CSLEDIT.viewController.selectedViewProperty("possibleChildren");
		if (possibleElements === null) {
			possibleElements = {};

			$.each(CSLEDIT.schema.childElements(translatedParentName + "/" + translatedNodeInfo.node.name),
				function (element, quantifier) {
					possibleElements[element] = quantifier;
				}
			);
		}

		// hard-coded constraint for 'choose' node
		// TODO: generalise this to more nodes, using the schema if not too difficult
		if (translatedNodeInfo.node.name === "choose") {
			// better order than schema:
			possibleElements = {
				"if" : "one",
				"else-if" : "zeroOrMore",
				"else" : "optional"
			};

			// only allowed one 'if' and one 'else' node
			$.each(translatedNodeInfo.node.children, function (i, childNode) {
				if (childNode.name === "if" && "if" in possibleElements) {
					delete possibleElements["if"];
				} else if (childNode.name === "else" && "else" in possibleElements) {
					delete possibleElements["else"];
				}
			});
		}

		$.each(possibleElements, function (element) {
			var img = '<td></td>',
				nodeIcon = CSLEDIT.uiConfig.nodeIcons[element],
				documentation = CSLEDIT.schema.documentation(
					translatedNodeInfo.node.name + "/" + element),
				row;

			if (typeof nodeIcon !== "undefined") {
				img = '<td><img src="' + CSLEDIT.options.get('rootURL') + nodeIcon + '"></img></td>';
			}
			var displayName;

			displayName = 
				CSLEDIT.uiConfig.displayNameFromNode(new CSLEDIT.CslNode(element));

			console.log("display name = " + displayName);

			row = $('<tr>' + img + '<td><button class="addNodeType" data-nodeName="' +
				element + '">' + 
				displayName + 
				'</button></td></tr>');

			if (typeof(documentation) !== "undefined") {
				row.append('<td>' + documentation + '</td>');
			}

			table.append(row);

			possibleElementsExist = true;
		});

		if (!possibleElementsExist) {
			alert("You can't create nodes within " + CSLEDIT.uiConfig.displayNameFromNode(node) + ".");
			return;
		}

		dialogDiv.append(table);

		dialogDiv.find('button.addNodeType').on('click', function (event) {
			var target = $(event.target),
				nodeName = target.attr('data-nodeName'),
				position,
				children = CSLEDIT.data.getNode(CSLEDIT.viewController.selectedNode()).children;

			dialogDiv.dialog('destroy');

			position = "last";
			// override position for certain nodes
			// TODO: generalise
			if (nodeName === 'if') {
				position = "first";
			} else if (nodeName === 'else-if' && children[children.length - 1].name === "else") {
				position = children.length - 1;
			} else if (nodeName === 'macro') {
				position = "last";
				// put it before the citation node:
				$.each(children, function (i, child) {
					if (child.name === "citation") {
						position = i;
						return false;
					}
				});
			}

			CSLEDIT.controller.exec("addNode", [
				CSLEDIT.viewController.selectedNode(), position, { name : nodeName, attributes : []}
			]);
		});
		dialogDiv.dialog({
			modal : true,
			width : "650px"
		});
	};

	var setupTreeEditorToolbar = function () {
		var toolbar = editorElement.find('#treeEditorToolbar'),
			addNodeButton = toolbar.find('a.add'),
			deleteNodeButton = toolbar.find('a.delete');

		assertEqual(addNodeButton.length, 1);
		assertEqual(deleteNodeButton.length, 1);

		addNodeButton.on('click', function (e) {
			showAddNodeDialog();
			e.preventDefault();
		});

		deleteNodeButton.on('click', function (e) {
			CSLEDIT.controller.exec("deleteNode", [CSLEDIT.viewController.selectedNode()]);
			e.preventDefault();
		});
	};

	var setupDropdownMenuHandler = function (selector) {
		var dropdown = $(selector),
			loadCsl;

		dropdown.filter('a.menuLoadcsl').html(CSLEDIT.options.get('loadCSLName'));
		dropdown.filter('a.menuSavecsl').html(CSLEDIT.options.get('saveCSLName'));

		editorElement.find('#menuNewStyle').click(function () {
			// fetch the URL
			$.ajax({
				url : CSLEDIT.options.get("rootURL") + "/content/newStyle.csl",
				dataType : "text",
				success : function (cslCode) {
					console.log("csl code received: " + cslCode);
					CSLEDIT.controller.exec('setCslCode', [cslCode]);
				},
				error : function () {
					throw new Error("Couldn't fetch new style");
				},
				async : false
			});
//			CSLEDIT.controller.exec('setCslCode', [newStyle]);
		});

		editorElement.find('#menuLoadCsl').click(function () {
			var csl = CSLEDIT.options.get('loadCSLFunc')();
			if (csl !== null && typeof csl !== "undefined") {
				CSLEDIT.controller.exec('setCslCode', [csl]);
			}
		});
		
		editorElement.find('#menuLoadStyleFromUrl').click(function () {
			var styleURL = prompt("Please enter the URL of the style you want to load");

			if (typeof(styleURL) === "string" && styleURL !== "") {
				// fetch the URL
				$.ajax({
					url : '../getFromOtherWebsite.php?url=' + encodeURIComponent(styleURL),
					dataType : "text",
					success : function (newStyle) {
						CSLEDIT.controller.exec("setCslCode", [newStyle]);
					},
					error : function () {
						console.log("ajax error: style not loaded");
					},
					async : false
				});
			}
		});
		
		editorElement.find('#menuSaveCsl').click(function () {
			CSLEDIT.options.get('saveCSLFunc')(CSLEDIT.data.getCslCode());
		});
		
		editorElement.find('#menuUndo').click(function () {
			if (CSLEDIT.controller.commandHistory.length === 0) {
				alert("No commands to undo");
			} else {
				CSLEDIT.controller.undo();
			}
		});
		
		editorElement.find('#menuRedo').click(function () {
			if (CSLEDIT.controller.undoCommandHistory.length === 0) {
				alert("No commands to redo");
			} else {
				CSLEDIT.controller.redo();
			}
		});
		
		editorElement.find('#menuEditCitation1').click(function () {
			CSLEDIT.citationEditor.editCitation(0);
		});
		
		editorElement.find('#menuEditCitation2').click(function () {
			CSLEDIT.citationEditor.editCitation(1);
		});
	};

	var init = function () {
		var reloadingPage = false;

		if (!$.browser.webkit && !$.browser.mozilla) {
			$('body').html("<h2>Please use the latest version of " +
				"Chrome or Firefox to view this page.</h2>").css({margin: 50});
			return;
		}

		// create storage with callback funciton which gets called if inconsistencies
		// are found between the localStorage data (shared between tabs) and this session
		// data
		CSLEDIT.storage = new CSLEDIT.Storage(true, function () {
			if (confirm("Your style has changed in a different tab.\n" +
					"Do you want to load the new version into this tab?")) {
				// reload page
				reloadingPage = true;
				window.location.reload();
			} else {
				// use existing data
				CSLEDIT.storage.recreateLocalStorage();
			}
		});

		// check consistency of data on window focus
		// to detect changes in different tabs
		console.log("window length = " + $(window).length);
		$(window).focus(function () {
			if (!reloadingPage) {
				CSLEDIT.data.get();
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

		CSLEDIT.data.initPageStyle(function () {
			var userOnChangeCallback = CSLEDIT.options.get("onChange"),
				citationEditor1,
				citationEditor2;
			
			syntaxHighlighter = CSLEDIT.SyntaxHighlighter(editorElement);

			CSLEDIT.viewController = CSLEDIT.ViewController(
				editorElement.find("#treeEditor"),
				editorElement.find("#titlebar"),
				editorElement.find("#elementProperties"),
				editorElement.find("#nodePathView"),
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
		});

		setupTreeEditorToolbar();
		setupDropdownMenuHandler(".dropdown a");

		editorElement.find('#mainContainer').layout({
			closable : false,
			resizable : true,
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

	// used to generate the ids in the Zotero style repository
	var getNormalisedStyleName = function () {
		return getStyleName().replace(/[\(\)]/g, "").replace(/[\\\/:"*?<>| ]+/g, "-").toLowerCase();
	};

	// returns true to continue, false to cancel
	var conformStyleToRepoConventions = function () {
		// checks that the style conforms to repository conventions and
		// prompts the user to change it if it doesn't
		
		var generatedStyleId,
			links,
			selfLinkNode,
			selfLink,
			styleName = getStyleName(),
			cancel = false;

		// check that the styleId and rel self link matches the schema conventions
		generatedStyleId = "http://www.zotero.org/styles/" + getNormalisedStyleName();
		links = CSLEDIT.data.getNodesFromPath("style/info/link");
		$.each(links, function (i, link) {
			link = new CSLEDIT.CslNode(link);

			if (link.getAttr("rel") === "self") {
				selfLinkNode = link;
				selfLink = link.getAttr("href");
			}
		});

		console.log("generatedStyleId = " + generatedStyleId);
		$.each(CSLEDIT.cslStyles.styleTitleFromId, function (id, name) {
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
					CSLEDIT.controller.exec("amendNode", [selfLinkNode.cslId, selfLinkNode]);
				} else {
					CSLEDIT.controller.exec("addNode", [CSLEDIT.data.getNodesFromPath("style/info")[0].cslId, "last",
						new CSLEDIT.CslNode("link", [
							{key: "rel", value: "self", enabled: true},
							{key: "href", value: generatedStyleId, enabled: true}
						])]);
				}
			}
		}
		return true;
	};

	var getStyleName = function () {
		var styleNameNode = CSLEDIT.data.getNodesFromPath('style/info/title')[0];
		return styleNameNode.textValue;
	};

	var getStyleId = function () {
		var styleIdNode = CSLEDIT.data.getNodesFromPath('style/info/id')[0];
		return styleIdNode.textValue;
	};
		
	var setStyleId = function (styleId) {
		var styleIdNode = CSLEDIT.data.getNodesFromPath('style/info/id')[0];
		styleIdNode.textValue = styleId;
		CSLEDIT.controller.exec('amendNode', [styleIdNode.cslId, styleIdNode]);
	};

	// public API
	return {
		setCslCode : function (cslCode) {
			CSLEDIT.controller.exec('setCslCode', [cslCode]);
		},
		getCslCode : function () {
			return CSLEDIT.data.getCslCode();
		},
		getStyleName : getStyleName,
		getStyleId : getStyleId,
		setStyleId : setStyleId,
		conformStyleToRepoConventions : conformStyleToRepoConventions,
		getNormalisedStyleName : getNormalisedStyleName
	};
};
