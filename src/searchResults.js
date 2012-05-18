var CSLEDIT = CSLEDIT || {};

CSLEDIT.searchResults = {
	displaySearchResults : function (styles, outputNode) {
		var index,
			outputList = [],
			masterStyleSuffix = "",
			style,
			citation,
			bibliography;

		for (index = 0; index < Math.min(styles.length, 20); index++)
		{
			style = styles[index];
			if (style.masterId != style.styleId)
			{
				masterStyleSuffix = ' (same as <a href="' + style.masterId + '">' +
							exampleCitations.styleTitleFromId[style.masterId] + '<\/a>)';
			} else {
				masterStyleSuffix = '';
			}

			citation = exampleCitations.exampleCitationsFromMasterId[style.masterId].formattedCitations[0];
			bibliography = exampleCitations.exampleCitationsFromMasterId[style.masterId].formattedBibliography;

			if (typeof style.userCitation !== "undefined" &&
				style.userCitation !== "" &&
				citation !== "") {
				citation = CSLEDIT.diff.prettyHtmlDiff(style.userCitation, citation);
			}

			if (typeof style.userBibliography !== "undefined" &&
				style.userBibliography !== "" &&
				bibliography !== "") {
				bibliography = CSLEDIT.diff.prettyHtmlDiff(style.userBibliography, bibliography);
			}

			outputList.push('<a href="' + style.styleId + '">' +
				exampleCitations.styleTitleFromId[style.styleId] + "<\/a>"
				+ masterStyleSuffix + "<br \/>" +
				'<table>' +
				'<tr><td nowrap="nowrap"><span class="faint">Inline citaiton<\/span>' +
				'<\/td><td>' +
				citation + '<\/td><\/tr>' +
				'<tr><td nowrap="nowrap"><span class="faint">Bibliography<\/span><\/td><td>' +
				bibliography + "<\/td><\/tr>" +
				'<tr><td><\/td><td><a href="#" class="editStyleButton" styleURL="' +
				style.styleId + '">Edit style<\/a><\/td><\/tr>' +
				'<\/table>');
		}
		
		outputNode.html(
			'<p>Displaying ' + outputList.length + ' results:<\/p>' +
				outputList.join("<p><p>")
		);

		$("a").click( function (event) {
			var styleURL = $(event.target).attr("styleURL");

			styleURL = "../getFromOtherWebsite.php?url=" + encodeURIComponent(styleURL);

			CSLEDIT.data.loadStyleFromURL(styleURL, function () {
				window.location.href =
					window.location.protocol + "//" + 
					window.location.host + "/csl/visualEditor";
			});
		});
	}
}
