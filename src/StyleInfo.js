"use strict";

// Displays information about a style in the CSL repository, including:
//
// - metadata in style/info
// - example citations
// - buttons to install/edit

define(
		[	'src/cslStyles',
			'src/citationEngine',
			'src/exampleCitations',
			'src/exampleData',
			'src/Data',
			'src/mustache',
			'src/CslNode',
			'src/styleActionButtons',
			'src/options'
		],
		function (
			CSLEDIT_cslStyles,
			CSLEDIT_citationEngine,
			CSLEDIT_exampleCitations,
			CSLEDIT_exampleData,
			CSLEDIT_Data,
			CSLEDIT_mustache,
			CSLEDIT_CslNode,
			CSLEDIT_styleActionButtons,
			CSLEDIT_options
		) {
	// Display information about the given style in the given styleId
	var CSLEDIT_StyleInfo = function (styleInfoElement, styleId, configurationOptions) {
		var that = this,
			mustacheData = {};

		CSLEDIT_options.setOptions(configurationOptions);

		mustacheData.styleId = styleId;

		this.data = new CSLEDIT_Data("CSLEDIT_styleInfoData");

		CSLEDIT_cslStyles.fetchCslCode(styleId, function (style) {
			mustacheData.style = {};

			var result = that.data.setCslCode(style, true);

			if ("error" in result) {
				mustacheData.error = result.error;
			} else {
				mustacheData.style.code = style;
				mustacheData.style.title = that.data.getNodesFromPath('style/info/title')[0].textValue;
				mustacheData.style.id = that.data.getNodesFromPath('style/info/id')[0].textValue;

				that._addTextValueStyleInfoProperty(mustacheData.style, 'title-short');
				that._addTextValueStyleInfoProperty(mustacheData.style, 'summary');
				that._addTextValueStyleInfoProperty(mustacheData.style, 'rights');
				that._addTextValueStyleInfoProperty(mustacheData.style, 'published');
				that._addTextValueStyleInfoProperty(mustacheData.style, 'updated');
				that._addTextValueStyleInfoProperty(mustacheData.style, 'issn');
				that._addTextValueStyleInfoProperty(mustacheData.style, 'eissn');

				that._addAttributesStyleInfoProperty(mustacheData.style, 'link');
				that._addAttributesStyleInfoProperty(mustacheData.style, 'category');

				that._addPersonStyleInfoProperty(mustacheData.style, 'author');
				that._addPersonStyleInfoProperty(mustacheData.style, 'contributor');

				var statusMessage = $('<div/>');
				var formattedCitations = $('<div/>');
				var formattedBibliography = $('<div/>');

				var citeprocStyle = that.data;

				$.each(mustacheData.style.link, function (i, link) {
					if ("rel" in link && "href" in link) {
						if (link.rel === "independent-parent") {
							mustacheData.style.parentId = link.href;
						}
					}
				});
				
				if ("parentId" in mustacheData.style) {
					mustacheData.style.parentStyleInfoURL = "?styleId=" + encodeURIComponent(mustacheData.style.parentId);
					CSLEDIT_cslStyles.fetchCslCode(mustacheData.style.parentId,
						function (parentStyle) {
							that.data.setCslCode(parentStyle);
							mustacheData.style.parentTitle =
								that.data.getNodesFromPath('style/info/title')[0].textValue;
						},
						function () {
							mustacheData.style.error = "Failed to fetch parent style: " +
								mustacheData.style.parentId;
						}, false);
				} else {
					// find all dependent styles
					mustacheData.style.dependents = [];
					var cslStyles = CSLEDIT_cslStyles.styles();
					$.each(cslStyles.masterIdFromId, function (dependentId, masterId) {
						if (dependentId !== masterId && masterId === mustacheData.style.id) {
							mustacheData.style.dependents.push({
								id: dependentId,
								styleInfoURL: "?styleId=" + encodeURIComponent(dependentId),
								title: cslStyles.styleTitleFromId[dependentId]
							});
							mustacheData.style.hasDependents = true;
							mustacheData.style.dependents[0].first = true;
						}
					});
				}

				// Create a citation cluster with all the example citations
				var citationClusters = [
					CSLEDIT_exampleCitations.createCitationCluster([0]),
					CSLEDIT_exampleCitations.createCitationCluster([0,1,2,3]),
					CSLEDIT_exampleCitations.createCitationCluster(function () {
						var list = [0, 2];
						for (var index = 4; index < CSLEDIT_exampleData.jsonDocumentList.length; index++) {
							list.push(index);
						}
						return list;
					}())
				];

				CSLEDIT_citationEngine.runCiteprocAndDisplayOutput(
					that.data,
					statusMessage, formattedCitations, formattedBibliography,
					function () {},
					CSLEDIT_exampleCitations.getCiteprocReferences(CSLEDIT_exampleData.jsonDocumentList),
					citationClusters);

				mustacheData.style.exampleOutput = {
					statusMessage : statusMessage.html(),
					citations : formattedCitations.html(),
					bibliography : formattedBibliography.html()
				};
			}

			styleInfoElement.html(CSLEDIT_mustache.toHtml('styleInfo', mustacheData));
			CSLEDIT_styleActionButtons.setup(styleInfoElement);

		}, function () {
			mustacheData.styleFetchFailed = "true";
			if (mustacheData.styleId === "") {
				delete mustacheData.styleId;
			}
			styleInfoElement.html(CSLEDIT_mustache.toHtml('styleInfo', mustacheData));
		});
	};

	// add style/info/* children to the mustache template which only contain a textValue
	CSLEDIT_StyleInfo.prototype._addTextValueStyleInfoProperty = function (styleInfo, key) {
		$.each(this.data.getNodesFromPath('style/info/' + key), function (i, node) {
			styleInfo[key] = node.textValue;
		});
	};
	
	// add style/info/* children to the mustache template which only contain a list of attributes
	CSLEDIT_StyleInfo.prototype._addAttributesStyleInfoProperty = function (styleInfo, key) {
		styleInfo[key] = [];
		$.each(this.data.getNodesFromPath('style/info/' + key), function (i, node) {
			var link = {};
			$.each(node.attributes, function (i, attribute) {
				link[attribute.key] = attribute.value;
			});
			styleInfo[key].push(link);
		});
	};

	// add style/info/* children to the mustache template which contain a list of
	// child nodes containing textValues and represent people
	CSLEDIT_StyleInfo.prototype._addPersonStyleInfoProperty = function (styleInfo, key) {
		styleInfo[key] = [];			

		$.each(this.data.getNodesFromPath('style/info/' + key), function (i, node) {
			var person = {};
			$.each(node.children, function (i, childNode) {
				person[childNode.name] = childNode.textValue;
			});
			styleInfo[key].push(person);
		});
	};
	
	return CSLEDIT_StyleInfo;
});
