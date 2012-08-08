"use strict";



var CSLEDIT_searchResults = (function () {

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
							CSLEDIT_cslStyles.styleTitleFromId[style.masterId] + '</a>)';
			} else {
				masterStyleSuffix = '';
			}

			citation = CSLEDIT_preGeneratedExampleCitations.exampleCitationsFromMasterId[style.masterId][exampleIndex].formattedCitations[0];
			bibliography = CSLEDIT_preGeneratedExampleCitations.exampleCitationsFromMasterId[style.masterId][exampleIndex].formattedBibliography;
			
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
					CSLEDIT_diff.prettyHtmlDiff(style.userBibliography, bibliography);
				bibliographyCloseness = closenessString(
						bibliographyDistance, style.userBibliography, bibliography);
			}

			featuredStyleClass = '';
			featuredStyleText = '';
			if (CSLEDIT_exampleData.topStyles.indexOf(style.styleId) !== -1) {
				featuredStyleClass = ' class="featuredStyle" ';
				featuredStyleText = '<span class=featuredStyle>Popular Style<span>';
			}

			outputList.push(
				'<table' + featuredStyleClass + '>' +
				'<tr><td colspan=3><a href="' + style.styleId + '">' +
				CSLEDIT_cslStyles.styleTitleFromId[style.styleId] + "</a>" +
				masterStyleSuffix + featuredStyleText + '</td></tr>' +
				'<tr><td nowrap="nowrap"><span class="faint">Inline citation</span></td>' +
				'<td class=match>' +
				citation + '</td>' + citationCloseness + '</tr>' +
				'<tr><td nowrap="nowrap"><span class="faint">Bibliography</span></td>' +
				'<td class=match>' +
				bibliography + '</td>' + bibliographyCloseness + "</tr>" +
				'<tr><td></td><td><button class="editStyle" styleURL="' +
				style.styleId + '">Edit style</a></td></tr>' +
				'</table>');
		}
		
		if (outputList.length === 0) {
			outputNode.html('<p>No results found</p>');
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
}());
