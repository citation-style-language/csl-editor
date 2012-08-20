"use strict";

define(
		[	'src/options',
			'src/exampleData',
			'src/diff',
			'src/cslStyles',
			'src/xmlUtility',
			'src/debug'
		],
		function (
			CSLEDIT_options,
			CSLEDIT_exampleData,
			CSLEDIT_diff,
			CSLEDIT_cslStyles,
			CSLEDIT_xmlUtility,
			debug
		) {
	var closenessString = function (distance, stringA, stringB) {
		var matchQuality = CSLEDIT_diff.matchQuality(stringA, stringB),
			closeness;

		if (matchQuality === 100) {
			closeness = "Perfect match!";
		} else {
			closeness = matchQuality + "% match";
		}

		return '<td class="closeness match">' + closeness + '</td>';
	};

	var displaySearchResults = function (styles, outputNode, exampleIndex /* optional */) {
		var index,
			outputList = [],
			masterStyleSuffix = "",
			style,
			citation,
			bibliography,
			citationCloseness = "",
			bibliographyCloseness = "",
			citationDiff,
			citationDistance,
			bibliographyDiff,
			bibliographyDistance,
			featuredStyleClass,
			featuredStyleText;

		exampleIndex = exampleIndex || 0;

		for (index = 0; index < Math.min(styles.length, 20); index++)
		{
			style = styles[index];
			if (style.masterId !== style.styleId)
			{
				masterStyleSuffix = ' (same as <a href="' + style.masterId + '">' +
					CSLEDIT_cslStyles.styles().styleTitleFromId[style.masterId] + '</a>)';
			} else {
				masterStyleSuffix = '';
			}

			citation = CSLEDIT_cslStyles.exampleCitations().exampleCitationsFromMasterId[style.masterId][exampleIndex].formattedCitations[0];
			bibliography = CSLEDIT_cslStyles.exampleCitations().exampleCitationsFromMasterId[style.masterId][exampleIndex].formattedBibliography;
			
			if (typeof style.userCitation !== "undefined" &&
					style.userCitation !== "" &&
					citation !== "") {
				citationDiff = CSLEDIT_diff.prettyHtmlDiff(style.userCitation, citation);
				citationCloseness = closenessString(citationDistance, style.userCitation, citation);
			}

			if (typeof style.userBibliography !== "undefined" &&
					style.userBibliography !== "" &&
					bibliography !== "") {
				bibliographyDiff =
					CSLEDIT_diff.prettyHtmlDiff(style.userBibliography, CSLEDIT_xmlUtility.cleanInput(bibliography));
				bibliographyCloseness = closenessString(
						bibliographyDistance, style.userBibliography, CSLEDIT_xmlUtility.cleanInput(bibliography));
			}

			featuredStyleClass = '';
			featuredStyleText = '';
			if (CSLEDIT_exampleData.topStyles.indexOf(style.styleId) !== -1) {
				featuredStyleClass = ' class="featuredStyle" ';
				featuredStyleText = '<span class="featuredStyle">Popular Style</span>';
			}

			outputList.push(
				'<table' + featuredStyleClass + '>' +
				'<tr><td colspan=3>' + featuredStyleText + '<a class="style-title" href="' + style.styleId + '">' +
				CSLEDIT_cslStyles.styles().styleTitleFromId[style.styleId] + "</a>" +
				masterStyleSuffix + '</td></tr>' +
				'<tr><td nowrap="nowrap"><span class="faint">Inline citation</span></td>' +
				'<td class=match>' +
				citation + '</td>' + citationCloseness + '</tr>' +
				'<tr><td nowrap="nowrap"><span class="faint">Bibliography</span></td>' +
				'<td class=match>' +
				bibliography + '</td>' + bibliographyCloseness + "</tr>" +
				'<tr><td></td><td><button class="editStyle" styleURL="' + style.styleId + '">Edit style</button><button class="editStyle" styleURL="' + style.styleId + '">View CSL</button><button class="editStyle" styleURL="' + style.styleId + '">Use this style</button></td></tr>' +
				'</table>');
		}
		
		if (outputList.length === 0) {
			outputNode.html('<p>No results found</p>');
		} else if (outputList.length === 0 && searchQuery.length === 0) {
			outputNode.html(
				'<p>Popular styles:</p>' +
					outputList.join("<p><p>")
			);
		} else {
			outputNode.html(
				'<p>Displaying ' + outputList.length + ' results:</p>' +
					outputList.join("<p><p>")
			);
		}

		$("button.editStyle").click(function (event) {
			var styleURL = $(event.target).attr("styleURL");
			CSLEDIT_options.get("editStyle_func")(styleURL);
		});
	};

	return {
		displaySearchResults : displaySearchResults
	};
});
