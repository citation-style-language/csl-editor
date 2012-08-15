define({
	isCompatible : function () {
		return $.browser.webkit || $.browser.mozilla || $.browser.chrome;
	}
});
