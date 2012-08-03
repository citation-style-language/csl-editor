"use strict";

/*
if (typeof(console) === "undefined") {
	var console = {
		log : function (message) {
			if (typeof(print) === "function") {
		  		print(message);
			}		
		}
	};
}*/

var assertEqual = function (actual, expected, place) {
	if (actual !== expected) {
		try {
			throw new Error("Assert fail: " + actual + " !== " + expected);
		} catch (err) {
			// put stack trace message in JSON - hack to access from window.onerror
			err.message = err.stack;
			throw err;
		}
	}
};

var assert = function (assertion, place) {
	var err;
	if (!assertion) {
		try {
			throw new Error("Assert fail");
		} catch (err) {
			// put stack trace message in JSON - hack to access from window.onerror
			err.message = err.stack;
			throw err;
		}
	}
};

