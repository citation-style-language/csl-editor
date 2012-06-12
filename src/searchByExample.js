"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.FinderPage = function (mainContainer, userOptions) {
	var nameSearchTimeout,
		styleFormatSearchTimeout;

	CSLEDIT.options.setUserOptions(userOptions);
	mainContainer = $(mainContainer);
	mainContainer.load(CSLEDIT.options.get("rootURL") + "/html/searchByExample.html", function () {
		init();
	});

	// used to display HTML tags for debugging
	var escapeHTML = function (string) {
		return $('<pre>').text(string).html();
	};

	// --- Functions for formatted style search ---

	function authorString(authors) {
		var result = [],
			index = 0;
		for (index = 0; index < authors.length; index++) {
			result.push(authors[index].given + " " + authors[index].family);
		}
		return result.join(", ");
	}

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

		return input;
	};

	var searchForStyle = function () {
		var tolerance = 50,
			bestMatchQuality = 999,
			bestMatchIndex = -1,
			userCitation = $("#userCitation").cleditor()[0].doc.body.innerHTML,
			userCitationText = $("#userCitation").cleditor()[0].doc.body.innerText,
			userBibliography = $("#userBibliography").cleditor()[0].doc.body.innerHTML,
			userBibliographyText = $("#userBibliography").cleditor()[0].doc.body.innerText,
			result = [],
			matchQualities = [],
			index = 0,
			styleId,
			exampleCitation,
			formattedCitation,
			thisMatchQuality,
			row = function (title, value) {
				return "<tr><td><span class=faint>" + title + "<\/span><\/td><td>" + value + "<\/td><\/tr>";
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
				exampleCitation = exampleCitations.exampleCitationsFromMasterId[styleId];

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
		
		CSLEDIT.searchResults.displaySearchResults(result, $("#searchResults"));
		console.timeEnd("searchForStyle");
	};

	var formatFindByStyleExampleDocument = function () {
		var jsonDocuments = cslServerConfig.jsonDocuments;
		document.getElementById("explanation").innerHTML = "<i>Please edit this example citation to match the style you are searching for.<br />";
		document.getElementById("exampleDocument").innerHTML =
			"<p align=center><strong>Example Article<\/stong><\/p>" +
			"<table>" +
			"<tr><td>Title:<\/td><td>" + jsonDocuments["ITEM-1"].title + "<\/td><\/tr>" +
			"<tr><td>Authors:<\/td><td>" + authorString(jsonDocuments["ITEM-1"].author) + "<\/td><\/tr>" + 
			"<tr><td>Year:<\/td><td>" + jsonDocuments["ITEM-1"].issued["date-parts"][0][0] + "<\/td><\/tr>" +
			"<tr><td>Publication:<\/td><td>" + jsonDocuments["ITEM-1"]["container-title"] + "<\/td><\/tr>" +
			"<tr><td>Volume:<\/td><td>" + jsonDocuments["ITEM-1"]["volume"] + "<\/td><\/tr>" +
			"<tr><td>Issue:<\/td><td>" + jsonDocuments["ITEM-1"]["issue"] + "<\/td><\/tr>" +
			"<tr><td>Chapter:<\/td><td>" + jsonDocuments["ITEM-1"]["chapter-number"] + "<\/td><\/tr>" +
			"<tr><td>Pages:<\/td><td>" + jsonDocuments["ITEM-1"]["page"] + "<\/td><\/tr>" +
			"<tr><td>Publisher:<\/td><td>" + jsonDocuments["ITEM-1"]["publisher"] + "<\/td><\/tr>" +
			"<tr><td>Document type:<\/td><td>" + jsonDocuments["ITEM-1"]["type"] + "<\/td><\/tr>" +
			"<\/table>";
	};

	var clearResults = function () {
		$("#searchResults").html("<i>Click search to find similar styles<\/i>");
	};

	var formChanged = function () {
		var userCitation,
			userBibliography;

		clearTimeout(styleFormatSearchTimeout);

		// clean the input in the editors
		userCitation = $("#userCitation").cleditor()[0].doc.body.innerHTML;
		userBibliography = $("#userBibliography").cleditor()[0].doc.body.innerHTML;

		$("#userCitation").cleditor()[0].doc.body.innerHTML = cleanInput(userCitation);
		$("#userBibliography").cleditor()[0].doc.body.innerHTML = cleanInput(userBibliography);

		styleFormatSearchTimeout = setTimeout(searchForStyle, 1000);
	};

	var init = function () {
		formatFindByStyleExampleDocument();
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
		//		+ "| undo redo | cut copy paste";

		$('button#searchButton').css({
			'background-image' :
				"url(" + CSLEDIT.options.get('rootURL') + '/external/famfamfam-icons/magnifier.png)'
		});

		var userCitationInput = $("#userCitation").cleditor({height: 55})[0];
		$("#userBibliography").cleditor({height: 85});

		var realTimeSearch = false;
		if (realTimeSearch) {
			$("#userCitation").cleditor()[0].change(formChanged);
			$("#userBibliography").cleditor()[0].change(formChanged);
			$('#searchButton').hide();
		} else {
			$("#userCitation").cleditor()[0].change(clearResults);
			$("#userBibliography").cleditor()[0].change(clearResults);
			$('#searchButton').on("click", function () {
				$("#styleFormatResult").html("<i>Searching...<\/i>");
				formChanged();
			});
		}
	
		// prepopulate search by style format with APA example
		$("#userCitation").cleditor()[0].doc.body.innerHTML =
			exampleCitations.exampleCitationsFromMasterId["http://www.zotero.org/styles/apa"].
			formattedCitations[0];
		$("#userBibliography").cleditor()[0].doc.body.innerHTML =
			exampleCitations.exampleCitationsFromMasterId["http://www.zotero.org/styles/apa"].
			formattedBibliography;

		formChanged();
	}

};

