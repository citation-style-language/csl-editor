"use strict";

// Displays a list of CSL styles, optionally including the quality of the match
//
// Used in the Search by Name and Search by Example pages

define(
		[	'src/options',
			'src/diff',
			'src/cslStyles',
			'src/xmlUtility',
			'src/mustache',
			'src/debug'
		],
		function (
			CSLEDIT_options,
			CSLEDIT_diff,
			CSLEDIT_cslStyles,
			CSLEDIT_xmlUtility,
			CSLEDIT_mustache,
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

		return closeness;
	};

	var displaySearchResults = function (styles, _outputNode, exampleIndex /* optional */) {
		var index,
			style,
			resultsLimit = 30,
			outputData = {}; // for mustache

		outputNode = outputNode || _outputNode;
		
		outputNode.html("");

		exampleIndex = exampleIndex || 0;

		outputData.styles = [];
		for (index = 0; index < Math.min(styles.length, resultsLimit); index++)
		{
			var styleEntry = {};

			style = styles[index];
			if (style.masterId !== style.styleId)
			{
				styleEntry.parentStyleURL = CSLEDIT_cslStyles.localURLFromZoteroId(style.masterId);
				styleEntry.parentStyleTitle = CSLEDIT_cslStyles.styles().styleTitleFromId[style.masterId];
			}

			// TODO: may want to sanitise styleEntry.citation and styleEntry.bibliography
			//       to remove any <script> tags since this will get written straight to
			//       the DOM
			styleEntry.citation = CSLEDIT_cslStyles
				.exampleCitations()
				.exampleCitationsFromMasterId[style.masterId][exampleIndex]
				.formattedCitations[0];
			styleEntry.bibliography = CSLEDIT_cslStyles
				.exampleCitations()
				.exampleCitationsFromMasterId[style.masterId][exampleIndex]
				.formattedBibliography;
			
			if (typeof style.userCitation !== "undefined" &&
					style.userCitation !== "" &&
					styleEntry.citation !== "") {
				styleEntry.citationDiff = CSLEDIT_diff.prettyHtmlDiff(style.userCitation, styleEntry.citation);
				styleEntry.citationCloseness = closenessString(style.userCitation, styleEntry.citation);
			}

			if (typeof style.userBibliography !== "undefined" &&
					style.userBibliography !== "" &&
					styleEntry.bibliography !== "") {
				styleEntry.bibliographyDiff =
					CSLEDIT_diff.prettyHtmlDiff(
							style.userBibliography,
							CSLEDIT_xmlUtility.cleanInput(styleEntry.bibliography));
				styleEntry.bibliographyCloseness = closenessString(
						style.userBibliography,
						CSLEDIT_xmlUtility.cleanInput(styleEntry.bibliography));
			}

			if (CSLEDIT_cslStyles.topStyles.indexOf(style.styleId) !== -1) {
				styleEntry.featuredStyle = true;
			}

			styleEntry.styleTitle = CSLEDIT_cslStyles.styles().styleTitleFromId[style.styleId];
			styleEntry.localURL = CSLEDIT_cslStyles.localURLFromZoteroId(style.styleId);
			styleEntry.styleId = style.styleId;

			outputData.styles.push(styleEntry);
		}
		
		if (outputData.styles.length > 0) {
			outputData.numStyles = outputData.styles.length;
		} 

		outputNode.html(CSLEDIT_mustache.toHtml('searchResults', outputData));

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
