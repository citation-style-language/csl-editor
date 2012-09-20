"use strict";

// The breadcrumb UI used in the Visual Editor

define(
		[	'src/dataInstance',
			'src/uiConfig',
			'src/xmlUtility',
			'external/mustache'
		],
		function (
			CSLEDIT_data,
			CSLEDIT_uiConfig,
			CSLEDIT_xmlUtility,
			Mustache
		) {
	// Create a NodePathView in the given jQuery element
	var CSLEDIT_NodePathView = function (element, callbacks) {
		this.element = element;
		this.callbacks = callbacks;
	};

	// Display the given missingNodePath which doesn't actually exist in the current CSL style
	CSLEDIT_NodePathView.prototype.nodeMissing = function (missingNodePath) {
		this.element.html(missingNodePath.replace(/\//g, " > "));
	};

	// Display the given nodePath
	CSLEDIT_NodePathView.prototype.selectNode = function (nodePath) {
		var that = this,
			cslData = CSLEDIT_data.get(),
			mustacheData = { nodes: [] };

		$.each(nodePath, function (i, cslId) {
			var node = CSLEDIT_data.getNode(cslId, cslData);

			mustacheData.nodes.push({
				cslId : node.cslId,
				displayName : CSLEDIT_uiConfig.displayNameFromNode(node)
			});
		});

		if (mustacheData.nodes.length > 0) {
			mustacheData.nodes[0].first = true;
		}

		this.element.html(Mustache.to_html(
			'{{#nodes}}{{^first}} > {{/first}}<span cslid="{{cslId}}">{{displayName}}</span>{{/nodes}}',
			mustacheData));

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
	};
	return CSLEDIT_NodePathView;
});
