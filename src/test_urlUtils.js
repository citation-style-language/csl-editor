define(['src/urlUtils', 'jquery.qunit'], function (CSLEDIT_urlUtils) {
	module('CSLEDIT_urlUtils');

	test('removeQueryParam', function () {
		equal(CSLEDIT_urlUtils.removeQueryParam(
				"http://steveridout.com/test/", "steve"),
				"http://steveridout.com/test/");
		equal(CSLEDIT_urlUtils.removeQueryParam(
				"http://steveridout.com/test/?steve=me", "steve"),
				"http://steveridout.com/test/");
		equal(CSLEDIT_urlUtils.removeQueryParam(
				"http://steveridout.com/test/?test=2&steve=me", "steve"),
				"http://steveridout.com/test/?test=2");
		equal(CSLEDIT_urlUtils.removeQueryParam(
				"http://steveridout.com/test/?test=2&steve=me&test2=3", "steve"),
				"http://steveridout.com/test/?test=2&test2=3");
		equal(CSLEDIT_urlUtils.removeQueryParam(
				"http://steveridout.com/test/?steve=me&test=2", "steve"),
				"http://steveridout.com/test/?test=2");
	});
});
