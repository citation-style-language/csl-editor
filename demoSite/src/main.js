require.config({
	baseUrl: "../.."
});
requirejs(
	[
		'demoSite/src/visualEditorDemo',
		'demoSite/external/downloadify/swfobject',
		'demoSite/external/downloadify/downloadify.min'
	], function (visualEditorDemo) {
	visualEditorDemo.init("../..");
});
