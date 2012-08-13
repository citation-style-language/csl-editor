"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.SearchByName = function (mainContainer, userOptions) {
	var nameSearchTimeout,
		previousQuery;

	CSLEDIT.options.setUserOptions(userOptions);
	mainContainer = $(mainContainer);
	$.ajax({
		url: CSLEDIT.options.get("rootURL") + "/html/searchByName.html",
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
			for (index = 0; index < 20; index++) {
				styleId = CSLEDIT.exampleData.topStyles[index];
				result.push({
					styleId : styleId,
					masterId : CSLEDIT.cslStyles.masterIdFromId[styleId]
				});
			}
			CSLEDIT.searchResults.displaySearchResults(result, $("#searchResults"));
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
		for (styleId in CSLEDIT.cslStyles.styleTitleFromId) {
			if (CSLEDIT.cslStyles.styleTitleFromId.hasOwnProperty(styleId)) {
				styleName = CSLEDIT.cslStyles.styleTitleFromId[styleId];

				if (styleName.toLowerCase().indexOf(searchQueryLower) > -1 ||
					styleId.toLowerCase().indexOf(searchQueryLower) > -1) {
					masterId = CSLEDIT.cslStyles.masterIdFromId[styleId];
					if (masterId !== styleId) {
						masterStyleName = ' (same as <a href="' + masterId + '">' +
							CSLEDIT.cslStyles.styleTitleFromId[masterId] + '</a>)';
					} else {
						masterStyleName = "";
					}
					result.push({
							styleId : styleId,
							masterId : masterId,
							popular : CSLEDIT.exampleData.topStyles.indexOf(styleId)
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

		CSLEDIT.searchResults.displaySearchResults(result, $("#searchResults"));
	};

	var init = function () {
		// add icon
		$('button#searchButton').css({
			'background-image' :
				"url(" + CSLEDIT.options.get('rootURL') + '/external/famfamfam-icons/magnifier.png)'
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
