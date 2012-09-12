"use strict";

define(
		[	'src/cslStyles',
			'src/citationEngine',
			'src/exampleCitations',
			'src/Data'
		],
		function (
			CSLEDIT_cslStyles,
			CSLEDIT_citationEngine,
			CSLEDIT_exampleCitations,
			CSLEDIT_Data
		) {
	var CSLEDIT_StyleInfo = function (styleInfoElement, styleURL) {
		styleInfoElement.html("");

		if (styleURL === "") {
			styleInfoElement.html("No style given, use query string with ?styleURL=");
			return;
		}
		
		// TODO: use sessionStorage for this.

		var data = new CSLEDIT_Data("CSLEDIT_styleInfoData");

		CSLEDIT_cslStyles.fetchCslCode(styleURL, function (style) {
			styleInfoElement.append("Style code: ");
			data.setCslCode(style);

			var sections = [];
			sections.push("Title = " + 
				data.getNodesFromPath('style/info/title')[0].textValue);
			sections.push("ID = " + 
				data.getNodesFromPath('style/info/id')[0].textValue);

			$.each(sections, function (i, section) {
				styleInfoElement.append("<p>" + section + "</p>");
			});

			var statusMessage = $('<div/>');
			var exampleOut = $('<div/>');
			var formattedCitations = $('<div/>');
			var formattedBibliography = $('<div/>');

			styleInfoElement.append(statusMessage);
			styleInfoElement.append(exampleOut);
			exampleOut.append(formattedCitations);
			exampleOut.append(formattedBibliography);

			CSLEDIT_citationEngine.runCiteprocAndDisplayOutput(
				data,
				statusMessage, exampleOut, formattedCitations, formattedBibliography,
				function () {});
		}, function () {
			styleInfoElement.html("Couldn't fetch style: " + styleURL);
		});

	};
	
	return CSLEDIT_StyleInfo;
});
