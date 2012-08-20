"use strict";

define(
		[	'src/options',
			'src/exampleData',
			'src/searchResults',
			'src/cslStyles',
			'src/urlUtils'
		],
		function (
			CSLEDIT_options,
			CSLEDIT_exampleData,
			CSLEDIT_searchResults,
			CSLEDIT_cslStyles,
			CSLEDIT_urlUtils
		) {
	var CSLEDIT_SearchByName = function (mainContainer, userOptions) {
		var nameSearchTimeout,
			previousQuery;

		CSLEDIT_options.setUserOptions(userOptions);
		mainContainer = $(mainContainer);
		$.ajax({
			url: CSLEDIT_urlUtils.getResourceUrl("html/searchByName.html"),
			success : function (data) {
				mainContainer.html(data);
				init();
			},
			error : function (jaXHR, textStatus, errorThrown) {
				alert("Couldn't fetch page: " + textStatus);
			},
			cache : false
		});

		// --- Functions for style name search ---
		var searchForStyleName = function () {
			var searchQuery = $("#styleNameQuery").val(),
				searchQueryLower = searchQuery.toLowerCase(),
				result = [],
				styleId,
				styleName,
				masterId,
				masterStyleName,
				index;

			$("#message").html("");

			if (searchQuery.length === 0) {
				$("#message").html("<h2>Popular Styles</h2>");
				$.each(CSLEDIT_exampleData.topStyles, function (i, styleId) {
					result.push({
						styleId : styleId,
						masterId : CSLEDIT_cslStyles.styles().masterIdFromId[styleId]
					});
				});
				CSLEDIT_searchResults.displaySearchResults(result, $("#searchResults"));
				previousQuery = "";
				return;
			}

			if (searchQuery.length < 3) {
				$("#message").html("<p>Query too short</p>");
				$("#searchResults").html("");
				previousQuery = "";
				return;
			}

			if (searchQuery === previousQuery) {
				return;
			}
			previousQuery = searchQuery;
			
			// dumb search, just iterates through all the names
			for (styleId in CSLEDIT_cslStyles.styles().styleTitleFromId) {
				if (CSLEDIT_cslStyles.styles().styleTitleFromId.hasOwnProperty(styleId)) {
					styleName = CSLEDIT_cslStyles.styles().styleTitleFromId[styleId];

					if (styleName.toLowerCase().indexOf(searchQueryLower) > -1 ||
						styleId.toLowerCase().indexOf(searchQueryLower) > -1) {
						masterId = CSLEDIT_cslStyles.styles().masterIdFromId[styleId];
						if (masterId !== styleId) {
							masterStyleName = ' (same as <a href="' + masterId + '">' +
								CSLEDIT_cslStyles.styles().styleTitleFromId[masterId] + '</a>)';
						} else {
							masterStyleName = "";
						}
						result.push({
								styleId : styleId,
								masterId : masterId,
								popular : CSLEDIT_exampleData.topStyles.indexOf(styleId)
							});
					}
				}
			}

			// sort by popularity first, then by master style
			result.sort(function (a, b) {
				var aIsMaster,
					bIsMaster,
					aIsPopular = (a.popular !== -1),
					bIsPopular = (b.popular !== -1),
					popularityCompare = a.popular - b.popular;
				
				if (aIsPopular && !bIsPopular) {
					return -1;
				}
				if (bIsPopular && !aIsPopular) {
					return 1;
				}
				if (popularityCompare !== 0) {
					return popularityCompare;
				}
				
				aIsMaster = (a.styleId === a.masterId);
				bIsMaster = (b.styleId === b.masterId);

				if (aIsMaster && !bIsMaster) {
					return -1;
				}
				if (bIsMaster && !aIsMaster) {
					return -1;
				}

				return 0;
			});

			CSLEDIT_searchResults.displaySearchResults(result, $("#searchResults"));
		};

		var init = function () {
			// add icon
			$('button#searchButton').css({
				'background-image' :
					"url(" + CSLEDIT_urlUtils.getResourceUrl('external/famfamfam-icons/magnifier.png') + ')'
			});

			// delayed search after typing
			$("#styleNameQuery").on("input", function () {
				clearTimeout(nameSearchTimeout);
				nameSearchTimeout = setTimeout(searchForStyleName, 500);
			});
				
			// instant search after typing enter
			$("#styleNameQuery").on("change", function () {
				searchForStyleName();
			});

			// instant search after clicking button
			$("#searchButton").on("click", function () {
				searchForStyleName();
			});

			$("#styleNameQuery").focus();
		
			searchForStyleName();
		};
	};

	return CSLEDIT_SearchByName;
});
