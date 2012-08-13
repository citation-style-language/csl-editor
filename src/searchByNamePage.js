"use strict";

define(['src/SearchByName', 'src/cslData'], function (CSLEDIT_SearchByName, CSLEDIT_data) {
	$(document).ready(function () {
		var searchByName = new CSLEDIT_SearchByName($('#mainContainer'), {
			editStyle_func : function (styleURL) {
				styleURL = "../getFromOtherWebsite.php?url=" + encodeURIComponent(styleURL);
				CSLEDIT_data.loadStyleFromURL(styleURL, function () {
					window.location.href = "../visualEditor";
				});
			}
		});
	});
});
