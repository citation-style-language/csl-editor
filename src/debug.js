"use strict";

var assertEqual = function (actual, expected, place) {
	if (actual !== expected) {
		throw Error("assert fail: " + place + "\n" +
			actual + " !== " + expected);
	}
};

var assert = function (assertion, place) {
	if (!assertion) {
		throw Error("assert fail: " + place);
	}
};

