"use strict";

define(['src/xmlUtility', 'jquery.qunit'], function (CSLEDIT_xmlUtility) {
	module("CSLEDIT_xmlUtility");

	test("strip unsupported XML tags", function () {
		var xml = '<p i="2">hello</p><b supported=true><great></great><i></i></b>',
			supportedTags = [ "b", "i" ];

		xml = CSLEDIT_xmlUtility.stripUnsupportedTags(xml, supportedTags);

		equal(xml, 'hello<b supported=true><i></i></b>');
	});

	test("strip all XML attributes", function () {
		var xml = '<p i="2">hello</p><b supported=true><great></great><i></i></b>',
			tags = [ "b", "i" ];

		xml = CSLEDIT_xmlUtility.stripAttributesFromTags(xml, tags);

		equal(xml, '<p i="2">hello</p><b><great></great><i></i></b>');
	});

	test("strip unsupported tags and their contents", function () {
		var xml = '<p i="2">hello <i>in italics</i></p><span supported="true"><i></i><b><span>div</span> </b><no>time</no>one!</span><!-- comment-->',
			tags = [ "p", "span", "i" ];

		xml = CSLEDIT_xmlUtility.stripUnsupportedTagsAndContents(xml, tags);
		equal(xml, '<p i="2">hello <i>in italics</i></p><span supported="true"><i></i>one!</span><!-- comment-->');
	});

	test("strip comments", function () {
		var xml = '<!-- comment 1 \n\n --> hello <!-- comment 2 -->';

		xml = CSLEDIT_xmlUtility.stripComments(xml);

		equal(xml, ' hello ');
	});

	test("clean", function () {
		var bibliography = '<div class="csl-entry">' +
			'    <div class="csl-left-margin">[1]</div>' +
			'<div class="csl-right-inline"> M. D. McInnis and L. P. Nelson, <i>Shaping the Body Politic: Art and Political Formation in Early America</i>. University of Virginia Press, 2011.</div>' +
			'</div>';

		equal(CSLEDIT_xmlUtility.cleanInput(bibliography),
			'[1] M. D. McInnis and L. P. Nelson, <i>Shaping the Body Politic: Art and Political Formation in Early America</i>. University of Virginia Press, 2011.');
	});
});
