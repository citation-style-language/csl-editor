"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.SearchByExample = function (mainContainer, userOptions) {
	var nameSearchTimeout,
		styleFormatSearchTimeout,
		exampleIndex = 0,
		defaultStyle = "http://www.zotero.org/styles/apa",
		realTimeSearch = false;

	CSLEDIT.options.setUserOptions(userOptions);
	mainContainer = $(mainContainer);
	$.ajax({
		url: CSLEDIT.options.get("rootURL") + "/html/searchByExample.html",
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

	// --- Functions for formatted style search ---
	var clEditorIsEmpty = function (node) {
		var text = $(node).cleditor()[0].doc.body.innerText;

		return text === "" || text === "\n";
	};

	var cleanInput = function (input) {
		var supportedTags = [ 'b', 'i', 'u', 'sup', 'sub' ],
			invisibleTags = [ 'p', 'span', 'div', 'second-field-align' ]; // we want the contents of these but not the actual tags

		input = CSLEDIT.xmlUtility.stripComments(input);
		input = CSLEDIT.xmlUtility.stripUnsupportedTagsAndContents(
			input, supportedTags.concat(invisibleTags));
		input = CSLEDIT.xmlUtility.stripUnsupportedTags(input, supportedTags);
		input = CSLEDIT.xmlUtility.stripAttributesFromTags(input, supportedTags);
		input = input.replace(/&nbsp;/g, " ");
		input = input.replace("\n", "");
		input = input.replace(/&amp;/g, "&#38;");
		input = input.replace(/&lt;/g, "&#60;");
		input = input.replace(/&gt;/g, "&#62;");
		input = input.replace(/&quot;/g, "&#34;");

		return input;
	};

	var searchForStyle = function () {
		var tolerance = 50,
			bestMatchQuality = 999,
			bestMatchIndex = -1,
			userCitation = cleanInput($("#userCitation").cleditor()[0].doc.body.innerHTML),
			userCitationText = $("#userCitation").cleditor()[0].doc.body.innerText,
			userBibliography = cleanInput($("#userBibliography").cleditor()[0].doc.body.innerHTML),
			userBibliographyText = $("#userBibliography").cleditor()[0].doc.body.innerText,
			result = [],
			matchQualities = [],
			index = 0,
			styleId,
			exampleCitation,
			formattedCitation,
			thisMatchQuality,
			row = function (title, value) {
				return "<tr><td><span class=faint>" + title + "</span></td><td>" + value + "</td></tr>";
			};

		console.time("searchForStyle");

		if (clEditorIsEmpty("#userCitation")) {
			userCitation = "";
		}
		if (clEditorIsEmpty("#userBibliography")) {
			userBibliography = "";
		}

		for (styleId in exampleCitations.exampleCitationsFromMasterId) {
			if (exampleCitations.exampleCitationsFromMasterId.hasOwnProperty(styleId)) {
				exampleCitation = exampleCitations.exampleCitationsFromMasterId[styleId][exampleIndex];

				if (exampleCitation !== null && exampleCitation.statusMessage === "") {
					formattedCitation = exampleCitation.formattedCitations[0];
					thisMatchQuality = 0;

					if (userCitation !== "") {
						thisMatchQuality += CSLEDIT.diff.matchQuality(
								userCitation, formattedCitation);
					}
					if (userBibliography !== "") {
						thisMatchQuality += CSLEDIT.diff.matchQuality(
								userBibliography, exampleCitation.formattedBibliography);
					}

					// give tiny boost to top popular styles
					if (CSLEDIT.exampleData.topStyles.indexOf(styleId) !== -1) {
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
		matchQualities.sort(function (a, b) {return b.matchQuality - a.matchQuality});

		// top results
		for (index=0; index < Math.min(5, matchQualities.length); index++) {
			result.push({
					styleId : matchQualities[index].styleId,
					masterId : matchQualities[index].styleId,
					userCitation : userCitation,
					userBibliography : userBibliography,
					matchQuality : Math.min(1, matchQualities[index].matchQuality)
			});
		}
		
		CSLEDIT.searchResults.displaySearchResults(result, $("#searchResults"), exampleIndex);
		console.timeEnd("searchForStyle");
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
		var jsonDocument = CSLEDIT.exampleData.jsonDocumentList[exampleIndex],
			table,
			rows = [];

		table = $("<table/>");

		$.each(jsonDocument, function (key, value) {
			var order = CSLEDIT.uiConfig.fieldOrder.indexOf(key),
				valueString;

			if (order === -1) {
				order = CSLEDIT.uiConfig.fieldOrder.length;
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
				html : "<tr><td>" + CSLEDIT.uiConfig.capitaliseFirstLetter(key) + "</td><td>" + valueString + "</td></td>",
				order : order
			});
		});

		rows.sort(function (a,b) {return a.order - b.order;});

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

		$("#userCitation").cleditor()[0].doc.body.innerHTML = cleanInput(userCitation);
		$("#userBibliography").cleditor()[0].doc.body.innerHTML = cleanInput(userBibliography);

		$("#searchResults").html("<p><emp>Searching for styles...</emp></p>");

		styleFormatSearchTimeout = setTimeout(searchForStyle, timeout);
	};

	var updateExample = function () {
		var length = exampleCitations.exampleCitationsFromMasterId[defaultStyle].length;
		exampleIndex = (exampleIndex+length)%length;

		formatExampleDocument();
		clearResults();
	};

	var init = function () {
		formatExampleDocument();
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
				"url(" + CSLEDIT.options.get('rootURL') + '/external/famfamfam-icons/magnifier.png)'
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
	
		// prepopulate search by style format with APA example
		$("#userCitation").cleditor()[0].doc.body.innerHTML =
			exampleCitations.exampleCitationsFromMasterId[defaultStyle][exampleIndex].
			formattedCitations[0];
		$("#userBibliography").cleditor()[0].doc.body.innerHTML =
			exampleCitations.exampleCitationsFromMasterId[defaultStyle][exampleIndex].
			formattedBibliography;

		$('#nextExample').click(function () {
			exampleIndex--;
			updateExample();	
		});
		$('#prevExample').click(function () {
			exampleIndex++;
			updateExample();
		});

		formChanged();
	}
};
