"use strict";

// Displays a list of CSL styles, optionally including the quality of the match
//
// Used in the Search by Name and Search by Example pages

define(
		[	'src/options',
			'src/diff',
			'src/cslStyles',
			'src/xmlUtility',
			'src/debug'
		],
		function (
			CSLEDIT_options,
			CSLEDIT_diff,
			CSLEDIT_cslStyles,
			CSLEDIT_xmlUtility,
			debug
		) {	
	var outputNode;

	var closenessString = function (stringA, stringB) {
		var matchQuality = CSLEDIT_diff.matchQuality(stringA, stringB),
			closeness;

		if (matchQuality === 100) {
			closeness = "Perfect match!";
		} else {
			closeness = matchQuality + "% match";
		}

		return '<td class="closeness match">' + closeness + '</td>';
	};

	var displaySearchResults = function (styles, _outputNode, exampleIndex /* optional */) {
		var index,
			outputList = [],
			masterStyleSuffix = "",
			style,
			citation,
			bibliography,
			citationCloseness = "",
			bibliographyCloseness = "",
			citationDiff,
			bibliographyDiff,
			featuredStyleClass,
			featuredStyleText,
			resultsLimit = 30;

		outputNode = outputNode || _outputNode;
		
		outputNode.html("");

		exampleIndex = exampleIndex || 0;

		for (index = 0; index < Math.min(styles.length, resultsLimit); index++)
		{
			style = styles[index];
			if (style.masterId !== style.styleId)
			{
				masterStyleSuffix = ' (same as <a href="' + style.masterId + '">' +
					CSLEDIT_cslStyles.styles().styleTitleFromId[style.masterId] + '</a>)';
			} else {
				masterStyleSuffix = '';
			}

			citation = CSLEDIT_cslStyles
				.exampleCitations()
				.exampleCitationsFromMasterId[style.masterId][exampleIndex]
				.formattedCitations[0];
			bibliography = CSLEDIT_cslStyles
				.exampleCitations()
				.exampleCitationsFromMasterId[style.masterId][exampleIndex]
				.formattedBibliography;
			
			if (typeof style.userCitation !== "undefined" &&
					style.userCitation !== "" &&
					citation !== "") {
				citationDiff = CSLEDIT_diff.prettyHtmlDiff(style.userCitation, citation);
				citationCloseness = closenessString(style.userCitation, citation);
			}

			if (typeof style.userBibliography !== "undefined" &&
					style.userBibliography !== "" &&
					bibliography !== "") {
				bibliographyDiff =
					CSLEDIT_diff.prettyHtmlDiff(style.userBibliography, CSLEDIT_xmlUtility.cleanInput(bibliography));
				bibliographyCloseness = closenessString(
						style.userBibliography, CSLEDIT_xmlUtility.cleanInput(bibliography));
			}

			featuredStyleClass = '';
			featuredStyleText = '';
			if (CSLEDIT_cslStyles.topStyles.indexOf(style.styleId) !== -1) {
				featuredStyleClass = ' class="featuredStyle" ';
				featuredStyleText = '<span class="featuredStyle">Popular</span>';
			}

			outputList.push(
				'<table' + featuredStyleClass + '>' +
				'<tr><td colspan=3>' + featuredStyleText + '<a class="style-title" href="' + 
					CSLEDIT_cslStyles.localURLFromZoteroId(style.styleId) + '">' +
				CSLEDIT_cslStyles.styles().styleTitleFromId[style.styleId] + "</a>" +
				masterStyleSuffix + '</td></tr>' +
				'<tr><td nowrap="nowrap"><span class="faint">Inline citation</span></td>' +
				'<td class=match>' +
				citation + '</td>' + citationCloseness + '</tr>' +
				'<tr><td nowrap="nowrap"><span class="faint">Bibliography</span></td>' +
				'<td class=match>' +
				bibliography + '</td>' + bibliographyCloseness + "</tr>" +
				'<tr><td><button class="installStyle" data-styleId="' + style.styleId + '">Install</button></td><td>' +
				'<button class="editStyle" data-styleId="' + style.styleId + '">Edit</button>' +
				'<button class="viewCode" data-styleId="' + style.styleId + '">View code</button></td></tr>' +
				'</table>');
		}
		
		if (outputList.length === 0) {
			outputNode.append('<p>No results found</p>');
		} else {
			if (outputList.length === 0 && searchQuery.length === 0) {
				outputNode.append('<p>Popular styles:</p>');
			} else {
				outputNode.append('<p>Displaying ' + outputList.length + ' results:</p>');
			}
			
			$.each(outputList, function (i, entry) {
				outputNode.append(entry + "<p/>");
			});
		} 

		var setupButtonHandler = function (button, func) {
			if (typeof(func) === "undefined") {
				button.css("display", "none");
			} else {
				button.click(function (event) {
					func($(event.target).attr("data-styleId"));
				});
			}
		};

		setupButtonHandler($('button.installStyle'), CSLEDIT_options.get('installStyle_func'));
		setupButtonHandler($('button.editStyle'), CSLEDIT_options.get('editStyle_func'));
		setupButtonHandler($('button.viewCode'), CSLEDIT_options.get('viewCode_func'));
	};

	return {
		displaySearchResults : displaySearchResults
	};
});
