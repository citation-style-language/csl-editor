"use strict";

define(function () {
	// from https://gist.github.com/1771618
	var getUrlVar = function (key) {
		var result = new RegExp(key + "=([^&]*)", "i").exec(window.location.search); 
		return result && unescape(result[1]) || "";
	};

	var removeQueryParam = function (url, queryParamKey) {
		return url.replace(/\?/, "&").
				replace(new RegExp("(\\&" + queryParamKey + "=[^&]*)", "i"), "").
				replace(/&/, "?"); // replace first & with ?
	};

	var getResourceUrl = function (resourcePath, data) {
		var url;
		require(['src/getUrl!' + resourcePath], function (newUrl) {
			url = newUrl;
		});
		// TODO: fix in case of no initial query string (would need '?' instead of '&')
		if (typeof(data) != "undefined") {
			$.each(data, function (key, value) {
				url += "&" + key + "=" + value;
			});
		}
		return url;
	};

	return {
		getUrlVar : getUrlVar,
		removeQueryParam : removeQueryParam,
		getResourceUrl : getResourceUrl
	};
});
