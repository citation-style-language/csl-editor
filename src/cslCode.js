var CSLEDIT = CSLEDIT || {};

/* Reads and writes style code to semi-permenant storage using CSLEDIT.data */
CSLEDIT.code = (function () {
	var storage_cslCode = "CSLEDIT.cslCode";

	// from https://gist.github.com/1771618
	var getUrlVar = function (key) {
		var result = new RegExp(key + "=([^&]*)", "i").exec(window.location.search); 
		return result && unescape(result[1]) || "";
	};

	// Load new style without reloading page
	var loadStyleFromURL = function (newURL, callback) {
		styleURL = newURL;
		$.get(styleURL, {}, function(data) {
			data = data.replace(/<!--.*?-->/g, "");
			console.log("loaded style from " + styleURL);
			set(data);
			if (typeof callback !== "undefined") {
				callback();
			}
		});
	};

	var set = function (code) {
		localStorage.setItem(storage_cslCode, code);
	};

	return {
		set : set,
		get : function () {
			return localStorage.getItem(storage_cslCode);
		},
		loadStyleFromURL : loadStyleFromURL,

		initPageStyle : function (callback) {
			var cslCode;
			cslCode = CSLEDIT.code.get(); 
			if (cslCode !== null && cslCode !== "" && !CSLEDIT.parser.isCslValid(cslCode)) {
				alert("Warning: couldn't recover CSL from previous session");
				cslCode = "";
				CSLEDIT.code.set(cslCode);
			}
			styleURL = getUrlVar("styleURL");
			console.log("url from url: " + styleURL);

			if (styleURL != "" && typeof styleURL !== 'undefined') {
				console.log("loading given URL");
				styleURL = "../getFromOtherWebsite.php?url=" + encodeURIComponent(styleURL);
				loadStyleFromURL(styleURL, callback);
			} else if (cslCode !== null && cslCode !== "") {
				console.log("loading previous style");
				callback();
			} else {
				console.log("loading default style - apa.csl");
				styleURL = "../external/csl-styles/apa.csl";
				loadStyleFromURL(styleURL, callback);
			}
		}
	};	
}());
