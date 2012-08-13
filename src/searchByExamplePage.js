define(['src/SearchByExample', 'src/cslData'], function (CSLEDIT_SearchByExample, CSLEDIT_data) {
	$(document).ready(function () {
		var searchByExample = new CSLEDIT_SearchByExample($('#mainContainer'), {
			editStyle_func : function (styleURL) {
				styleURL = "../getFromOtherWebsite.php?url=" + encodeURIComponent(styleURL);
				CSLEDIT_data.loadStyleFromURL(styleURL, function () {
					window.location.href = "../visualEditor";
				});
			}
		});
	});
});
