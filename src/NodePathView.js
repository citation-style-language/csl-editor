"use strict";

define(
		[	'src/dataInstance',
			'src/uiConfig'
		],
		function (
			CSLEDIT_data,
			CSLEDIT_uiConfig
		) {
	var CSLEDIT_NodePathView = function (element, callbacks, syntaxHighlighter) {
		this.element = 	element;
		this.callbacks = callbacks;
		this.syntaxHighlighter = syntaxHighlighter;
	};

	CSLEDIT_NodePathView.prototype.nodeMissing = function (missingNodePath) {
		this.element.html(missingNodePath.replace(/\//g, " > "));
	};

	CSLEDIT_NodePathView.prototype.selectNode = function (nodePath) {
		var that = this,
			nodesHtml = [],
			cslData = CSLEDIT_data.get();

		$.each(nodePath, function (i, cslId) {
			var node = CSLEDIT_data.getNode(cslId, cslData);
			nodesHtml.push('<span cslid="' + node.cslId + '">' +
				CSLEDIT_uiConfig.displayNameFromNode(node) + '</span>');
		});

		this.element.html(nodesHtml.join(" > "));

		this.element.find('span[cslid]').css({"cursor" : "pointer"});
		this.element.find('span[cslid]').off('click');
		this.element.find('span[cslid]').on('click', function(event) {
			var thisNodePath = [],
				thisCslId = parseInt($(event.target).attr("cslid"));

			$.each(nodePath, function (i, cslId) {
				thisNodePath.push(cslId);
				if (cslId === thisCslId) {
					return false;
				}
			});
			
			that.callbacks.selectNodeFromPath(thisNodePath);
		});
		this.element.find('span[cslid]').hover(this.syntaxHighlighter.hover, this.syntaxHighlighter.unhover);
	};
	return CSLEDIT_NodePathView;
});
