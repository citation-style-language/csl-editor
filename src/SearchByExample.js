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
			tolerance = 50,
			userCitations,
			userBibliographies,
			inputControlsElement,
			citationClEditFrame,
			bibliographyClEditFrame,
			oldCitation = "",
			oldBibliography = "";

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

		var setSelectedControl = function (selected) {
			if (selected === "citation") {
				inputControlsElement.addClass("citationSelected");
				inputControlsElement.removeClass("bibliographySelected");
			} else {
				debug.assertEqual(selected, "bibliography");
				inputControlsElement.removeClass("citationSelected");
				inputControlsElement.addClass("bibliographySelected");
			}
			formChanged();
		};
		var getSelectedControl = function () {
			if (inputControlsElement.hasClass("citationSelected")) {
				return "citation";
			} 
			debug.assert(inputControlsElement.hasClass("bibliographySelected"));
			return "bibliography";
		};

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

		var tagMatches = function (string, matches) {
			var from = null,
				to = null,
				result = "";

			var getTagged = function () {
				return "<span class=match>" + string.substring(from, to + 1) + "</span>";
			};

			$.each(string, function (i, char) {
				if (from === null) {
					if (matches[i]) {
						from = i;
						to = i;
					} else {
						// TODO: could be optimised if needed
						result += char;
					}
				} else {
					if (matches[i]) {
						to = i;
					} else if (char === " " && matches[i + 1]) {
						to = i + 1;
					} else {
						result += getTagged();
						result += char;
						from = null;
					}
				}
			});

			if (from !== null) {
				result += getTagged();
			}

			return result;
		};

		var formatExampleDocument = function (userInput) {
			var jsonDocument = CSLEDIT_exampleData.jsonDocumentList[exampleIndex],
				table,
				rows = [],
				fieldsNotToPartialMatch = ["abstract"],
				userWords;
			
			if (typeof(userInput) !== "undefined") {
				userWords = userInput.toLowerCase().split(/\W/g);
				userWords.sort(function (a, b) { return b.length - a.length; });
			}

			table = $("<table/>");

			$.each(jsonDocument, function (key, value) {
				var order = CSLEDIT_uiConfig.fieldOrder.indexOf(key),
					valueString,
					valueStringLower,
					newValueString,
					matchingChars = [];

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
				} else if (typeof(userWords) !== "undefined")  {
					// check for a complete match
					if (new RegExp(valueString, "i").test(userInput)) {
						// All chars match
						$.each(valueString, function (i, char) {
							matchingChars[i] = true;
						});
					} else if (fieldsNotToPartialMatch.indexOf(key) === -1) {
						valueStringLower = valueString.toLowerCase();
						// highlight matches
						$.each(userWords, function (i, word) {
							var index,
								index2;

							if (word.length > 2) {
								index = valueStringLower.indexOf(word);
								while (index !== -1) {
									for (index2 = index; index2 < index + word.length; index2++) {
										matchingChars[index2] = true;
									}
									index = valueStringLower.indexOf(word, index + 1);
								}
							}
						});
					}
				}
			
				valueString = tagMatches(valueString, matchingChars);

				rows.push({
					html : "<tr><td><span class=fieldTitle>" + CSLEDIT_uiConfig.capitaliseFirstLetter(key) +
						"</span></td><td><span class=fieldValue>" + valueString + "</span></td></td>",
					order : order
				});
			});

			rows.sort(function (a, b) {return a.order - b.order; });

			$.each(rows, function (i, row) {
				table.append(row.html);
			});

			$("#exampleDocument").children().remove();
			$("#exampleDocument").append(table);
		};

		var hasChanged = function () {
			var newCitation = CSLEDIT_xmlUtility.cleanInput(
					$("#userCitation").cleditor()[0].doc.body.innerHTML),
				newBibliography = CSLEDIT_xmlUtility.cleanInput(
					$("#userBibliography").cleditor()[0].doc.body.innerHTML);

			if (newCitation !== oldCitation || newBibliography !== oldBibliography) {
				return true;
			} else {
				return false;
			}
		};

		var formChanged = function () {
			var userInput,
				words;

			if (hasChanged()) {
				$("#searchResults").html("<i>Click search to find similar styles</i>");
			}

			if (getSelectedControl() === "citation") {
				userInput = $("#userCitation").cleditor()[0].doc.body.innerHTML;
			} else {
				userInput = $("#userBibliography").cleditor()[0].doc.body.innerHTML;
			}
			userInput = CSLEDIT_xmlUtility.cleanInput(userInput);
			
			formatExampleDocument(userInput);
		};

		var search = function () {
			var userCitation,
				userBibliography,
				timeout = 10;

			$("#styleFormatResult").html("<i>Searching...</i>");

			// clean the input in the editors
			userCitation = $("#userCitation").cleditor()[0].doc.body.innerHTML;
			userBibliography = $("#userBibliography").cleditor()[0].doc.body.innerHTML;

			userCitation = CSLEDIT_xmlUtility.cleanInput(userCitation);
			userBibliography = CSLEDIT_xmlUtility.cleanInput(userBibliography);

			$("#userCitation").cleditor()[0].doc.body.innerHTML = userCitation;
			$("#userBibliography").cleditor()[0].doc.body.innerHTML = userBibliography;

			oldCitation = userCitation;
			oldBibliography = userBibliography;

			$("#searchResults").html("<p><emp>Searching for styles...</emp></p>");

			styleFormatSearchTimeout = setTimeout(searchForStyle, timeout);
		};

		var updateExample = function (newExampleIndex, initialising) {
			var length = CSLEDIT_cslStyles.exampleCitations().exampleCitationsFromMasterId[defaultStyle].length;

			if (exampleIndex !== -1) {
				userCitations[exampleIndex] = $("#userCitation").cleditor()[0].doc.body.innerHTML;
				userBibliographies[exampleIndex] = $("#userBibliography").cleditor()[0].doc.body.innerHTML;
			}

			exampleIndex = (newExampleIndex + length) % length;

			formatExampleDocument();

			$("#userCitation").cleditor()[0].doc.body.innerHTML = userCitations[exampleIndex];
			$("#userBibliography").cleditor()[0].doc.body.innerHTML = userBibliographies[exampleIndex];
			
			if (initialising !== true) {
				formChanged();
			}
		};

		var getClEditFrame = function (element, frameId) {
			var clEditFrame,
				cledit = $("#inputcledit").cleditor()[0];

			$(element.$frame[0]).attr("id", frameId);
			if(!document.frames)
			{
				clEditFrame = $('#' + frameId)[0].contentWindow.document;
			}
			else
			{
				clEditFrame = document.frames[frameId].document;
			}
			return clEditFrame;
		};

		var init = function () {
			var citationInput,
				bibliographyInput;

			inputControlsElement = $('#styleFormatInputControls');

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
			$.cleditor.defaultOptions.width = 440;
			$.cleditor.defaultOptions.height = 100;
			$.cleditor.defaultOptions.controls =
				"bold italic underline subscript superscript ";
/*
			$('button#searchButton').css({
				'background-image' :
					"url(" + CSLEDIT_urlUtils.getResourceUrl('external/famfamfam-icons/magnifier.png') + ')'
			});
*/
			citationInput = $("#userCitation").cleditor({height: 55})[0];
			bibliographyInput = $("#userBibliography").cleditor({height: 85})[0];

			$(getClEditFrame(citationInput, "citationInputFrame")).keyup(function () {
				setSelectedControl("citation");
			}).click(function () {
				setSelectedControl("citation");
			});

			$(getClEditFrame(bibliographyInput, "bibliographyInputFrame")).keyup(function () {
				setSelectedControl("bibliography");
			}).click(function () {
				setSelectedControl("bibliography");
			});

			$('#searchButton').on("click", search);

			// prepopulate with example	citations
			userCitations = [];
			userBibliographies = [];
			$.each(CSLEDIT_cslStyles.exampleCitations().exampleCitationsFromMasterId[defaultStyle],
					function (i, exampleCitation) {
				userCitations.push(exampleCitation.formattedCitations[0]);
				userBibliographies.push(exampleCitation.formattedBibliography);
			});

			updateExample(0, true);

			$('#nextExample').click(function () {
				updateExample(exampleIndex - 1);	
			});
			$('#prevExample').click(function () {
				updateExample(exampleIndex + 1);
			});

			setSelectedControl("citation");

			search();
		};
	};

	return CSLEDIT_SearchByExample;
});
