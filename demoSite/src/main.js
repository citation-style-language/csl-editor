if (typeof(CSLEDIT_pageModule) !== "undefined") {
	require.config({
		baseUrl: "../.."
	});
	// load the appropriate page
	requirejs(['src/config'], function (config) {
		require(['demoSite/src/' + CSLEDIT_pageModule], function () {});
	});
}
