"use strict";

define(
		[	'src/options',
			'src/exampleData',
			'src/uiConfig',
			'src/xmlUtility',
			'src/diff',
			'src/searchResults',
			'src/cslStyles',
			'src/urlUtils',
			'src/debug',
			'jquery.ui',
			'jquery.cleditor'
		],
		function (
			CSLEDIT_options,
			CSLEDIT_exampleData,
			CSLEDIT_uiConfig,
			CSLEDIT_xmlUtility,
			CSLEDIT_diff,
			CSLEDIT_searchResults,
			CSLEDIT_cslStyles,
			CSLEDIT_urlUtils,
			debug,
			jquery_ui,
			jquery_cleditor
		) {
	var CSLEDIT_SearchByExample = function (mainContainer, userOptions) {
		var nameSearchTimeout,
			styleFormatSearchTimeout,
			exampleIndex = -1,
			defaultStyle = CSLEDIT_cslStyles.defaultStyleId,
			realTimeSearch = false,
			tolerance = 50,
			userCitations,
			userBibliographies;

		CSLEDIT_options.setUserOptions(userOptions);
		mainContainer = $(mainContainer);
		$.ajax({
			url: CSLEDIT_urlUtils.getResourceUrl("html/searchByExample.html"),
			success : function (data) {
				mainContainer.html(data);
				init();
			},
			error : function (jaXHR, textStatus, errorThrown) {
				alert("Couldn't fetch page: " + textStatus);
			},
			cache : false
		});

		// used to display HTML tags for debugging
		var escapeHTML = function (string) {
			return $('<pre>').text(string).html();
		};

		var clEditorIsEmpty = function (node) {
			var text = $(node).cleditor()[0].doc.body.innerText;

			return text === "" || text === "\n";
		};

		var searchForStyle = function () {
			var bestMatchQuality = 999,
				bestMatchIndex = -1,
				userCitation = CSLEDIT_xmlUtility.cleanInput($("#userCitation").cleditor()[0].doc.body.innerHTML),
				userCitationText = $("#userCitation").cleditor()[0].doc.body.innerText,
				userBibliography = CSLEDIT_xmlUtility.cleanInput($("#userBibliography").cleditor()[0].doc.body.innerHTML),
				userBibliographyText = $("#userBibliography").cleditor()[0].doc.body.innerText,
				result = [],
				matchQualities = [],
				citationMatchQuality,
				bibliographyMatchQuality,
				index = 0,
				styleId,
				exampleCitation,
				formattedCitation,
				thisMatchQuality,
				row = function (title, value) {
					return "<tr><td><span class=faint>" + title + "</span></td><td>" + value + "</td></tr>";
				};

			debug.time("searchForStyle");

			if (clEditorIsEmpty("#userCitation")) {
				userCitation = "";
			}
			if (clEditorIsEmpty("#userBibliography")) {
				userBibliography = "";
			}

			for (styleId in CSLEDIT_cslStyles.exampleCitations().exampleCitationsFromMasterId) {
				if (CSLEDIT_cslStyles.exampleCitations().exampleCitationsFromMasterId.hasOwnProperty(styleId)) {
					exampleCitation = CSLEDIT_cslStyles.exampleCitations().exampleCitationsFromMasterId[styleId][exampleIndex];

					if (exampleCitation !== null && exampleCitation.statusMessage === "") {
						formattedCitation = exampleCitation.formattedCitations[0];

						if (userCitation !== "") {
							citationMatchQuality = CSLEDIT_diff.matchQuality(
								userCitation, formattedCitation);
						} else {
							citationMatchQuality = 0;
						}
						if (userBibliography !== "") {
							bibliographyMatchQuality = CSLEDIT_diff.matchQuality(
								userBibliography, CSLEDIT_xmlUtility.cleanInput(exampleCitation.formattedBibliography));
						} else {
							bibliographyMatchQuality = 0;
						}

						thisMatchQuality = 0;
						if (citationMatchQuality > tolerance) {
							thisMatchQuality += citationMatchQuality;
						}
						if (bibliographyMatchQuality > tolerance) {
							thisMatchQuality += bibliographyMatchQuality;
						}

						// give tiny boost to top popular styles
						if (CSLEDIT_exampleData.topStyles.indexOf(styleId) !== -1) {
							thisMatchQuality += 0.1;
						}

						if (thisMatchQuality > tolerance)
						{
							matchQualities[index++] = {
								matchQuality : thisMatchQuality,
								styleId : styleId
							};
						}

						if (thisMatchQuality > bestMatchQuality) {
							bestMatchQuality = thisMatchQuality;
						}
					}
				}
			}
			matchQualities.sort(function (a, b) {return b.matchQuality - a.matchQuality; });

			// top results
			for (index = 0; index < Math.min(5, matchQualities.length); index++) {
				result.push({
					styleId : matchQualities[index].styleId,
					masterId : matchQualities[index].styleId,
					userCitation : userCitation,
					userBibliography : userBibliography,
					matchQuality : Math.min(1, matchQualities[index].matchQuality)
				});
			}
			
			CSLEDIT_searchResults.displaySearchResults(result, $("#searchResults"), exampleIndex);
			debug.timeEnd("searchForStyle");
		};

		function personString(authors) {
			var result = [],
				index = 0;

			if (typeof(authors) === "undefined") {
				return "No authors";
			}

			for (index = 0; index < authors.length; index++) {
				result.push(authors[index].given + " " + authors[index].family);
			}
			return result.join(", ");
		}

		var formatExampleDocument = function () {
			var jsonDocument = CSLEDIT_exampleData.jsonDocumentList[exampleIndex],
				table,
				rows = [];
			
			table = $("<table/>");

			$.each(jsonDocument, function (key, value) {
				var order = CSLEDIT_uiConfig.fieldOrder.indexOf(key),
					valueString;

				if (order === -1) {
					order = CSLEDIT_uiConfig.fieldOrder.length;
				}

				if (key === "author" || key === "editor" || key === "translator") {
					valueString = personString(value);
				} else if (key === "issued" || key === "accessed") {
					valueString = value["date-parts"][0].join("/");
				} else if (typeof(value) === "object") {
					valueString = JSON.stringify(value);
				} else {
					valueString = value;
				}

				if (valueString === "") {
					// skip empty field
					return true;
				}

				rows.push({
					html : "<tr><td>" + CSLEDIT_uiConfig.capitaliseFirstLetter(key) + "</td><td>" + valueString + "</td></td>",
					order : order
				});
			});

			rows.sort(function (a, b) {return a.order - b.order; });

			$.each(rows, function (i, row) {
				table.append(row.html);
			});

			document.getElementById("explanation").innerHTML = "<i>Please edit this example citation to match the style you are searching for.<br />";

			$("#exampleDocument").children().remove();
			$("#exampleDocument").append(table);
		};

		var clearResults = function () {
			$("#searchResults").html("<i>Click search to find similar styles</i>");
		};

		var formChanged = function () {
			var userCitation,
				userBibliography,
				timeout = 10;

			if (realTimeSearch) {
				timeout = 400;
			}		

			clearTimeout(styleFormatSearchTimeout);

			// clean the input in the editors
			userCitation = $("#userCitation").cleditor()[0].doc.body.innerHTML;
			userBibliography = $("#userBibliography").cleditor()[0].doc.body.innerHTML;

			$("#userCitation").cleditor()[0].doc.body.innerHTML = CSLEDIT_xmlUtility.cleanInput(userCitation);
			$("#userBibliography").cleditor()[0].doc.body.innerHTML = CSLEDIT_xmlUtility.cleanInput(userBibliography);

			$("#searchResults").html("<p><emp>Searching for styles...</emp></p>");

			styleFormatSearchTimeout = setTimeout(searchForStyle, timeout);
		};

		var updateExample = function (newExampleIndex) {
			var length = CSLEDIT_cslStyles.exampleCitations().exampleCitationsFromMasterId[defaultStyle].length;

			if (exampleIndex !== -1) {
				userCitations[exampleIndex] = $("#userCitation").cleditor()[0].doc.body.innerHTML;
				userBibliographies[exampleIndex] = $("#userBibliography").cleditor()[0].doc.body.innerHTML;
			}

			exampleIndex = (newExampleIndex + length) % length;

			formatExampleDocument();
			clearResults();

			$("#userCitation").cleditor()[0].doc.body.innerHTML = userCitations[exampleIndex];
			$("#userBibliography").cleditor()[0].doc.body.innerHTML = userBibliographies[exampleIndex];
		};

		var init = function () {
			if (CSLEDIT_cslStyles.exampleCitations().exampleCitationsFromMasterId[defaultStyle].length !==
					CSLEDIT_exampleData.jsonDocumentList.length) {
				alert("Example citations need re-calculating on server");
			}

			$("#inputTabs").tabs({
				show: function (event, ui) {
					if (ui.panel.id === "styleNameInput") {
						$("#styleNameResult").show();
						$("#styleFormatResult").hide();
					} else {
						$("#styleNameResult").hide();
						$("#styleFormatResult").show();
					}
				}
			});
			$.cleditor.defaultOptions.width = 390;
			$.cleditor.defaultOptions.height = 100;
			$.cleditor.defaultOptions.controls =
				"bold italic underline subscript superscript ";

			$('button#searchButton').css({
				'background-image' :
					"url(" + CSLEDIT_urlUtils.getResourceUrl('external/famfamfam-icons/magnifier.png') + ')'
			});

			var userCitationInput = $("#userCitation").cleditor({height: 55})[0];
			$("#userBibliography").cleditor({height: 85});

			if (realTimeSearch) {
				$("#userCitation").cleditor()[0].change(formChanged);
				$("#userBibliography").cleditor()[0].change(formChanged);
				$('#searchButton').hide();
			} else {
				$("#userCitation").cleditor()[0].change(clearResults);
				$("#userBibliography").cleditor()[0].change(clearResults);
				$('#searchButton').on("click", function () {
					$("#styleFormatResult").html("<i>Searching...</i>");
					formChanged();
				});
			}

			// prepopulate with APA example	citations
			userCitations = [];
			userBibliographies = [];
			$.each(CSLEDIT_cslStyles.exampleCitations().exampleCitationsFromMasterId[defaultStyle],
					function (i, exampleCitation) {
				userCitations.push(exampleCitation.formattedCitations[0]);
				userBibliographies.push(exampleCitation.formattedBibliography);
			});

			updateExample(0);

			$('#nextExample').click(function () {
				updateExample(exampleIndex - 1);	
			});
			$('#prevExample').click(function () {
				updateExample(exampleIndex + 1);
			});

			formChanged();
		};
	};

	return CSLEDIT_SearchByExample;
});
