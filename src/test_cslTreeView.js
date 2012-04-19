"use strict";

CSLEDIT = CSLEDIT || {};

module("CSLEDIT.cslTreeView");

asyncTest("create tree view", function () {
	var cslData,
		treeView;

	cslData = CSLEDIT.data.setCslCode(
		"<style><info><author><\/author><\/info><citation><layout><\/layout><\/citation><\/style>");

	treeView = CSLEDIT.CslTreeView($("<div><\/div>"));
	treeView.createFromCslData(cslData, {
		loaded : function () {
			equal(treeView.jQueryElement.find('li[cslid=0]').attr("rel"), "style");
			equal(treeView.jQueryElement.find('li[cslid=1]').attr("rel"), "info");
			equal(treeView.jQueryElement.find('li[cslid=2]').attr("rel"), "author");
			equal(treeView.jQueryElement.find('li[cslid=3]').attr("rel"), "citation");
			start();
		}
	});
});

asyncTest("add/delete/ammend nodes", function () {
	var cslData,
		treeView;

	cslData = CSLEDIT.data.setCslCode(
		"<style><\/style>");

	treeView = CSLEDIT.CslTreeView($("<div><\/div>"));
	
	treeView.createFromCslData(cslData, {
		loaded : function () {
			treeView.addNode(0, 0, {name : "info"} );
			treeView.addNode(0, 1, {name : "citation"} );
			treeView.addNode(1, 0, {name : "author"} );

			equal(treeView.jQueryElement.find('li[cslid=0]').attr("rel"), "style");
			equal(treeView.jQueryElement.find('li[cslid=1]').attr("rel"), "info");
			equal(treeView.jQueryElement.find('li[cslid=2]').attr("rel"), "author");
			equal(treeView.jQueryElement.find('li[cslid=3]').attr("rel"), "citation");

			treeView.deleteNode(1);
			equal(treeView.jQueryElement.find('li[cslid=0]').attr("rel"), "style");
			equal(treeView.jQueryElement.find('li[cslid=1]').attr("rel"), "citation");

			// Can't delete the root node
			raises(function () {treeView.deleteNode(0);} );
			equal(treeView.jQueryElement.find('li[cslid=1]').attr("rel"), "citation");

			// test ammending
			equal(
				treeView.jQueryElement.jstree('get_text',treeView.jQueryElement.find('li[cslid=1]')),
				"Inline Citations");
			treeView.ammendNode(1, { name : "bibliography" } );
			equal(
				treeView.jQueryElement.jstree('get_text',treeView.jQueryElement.find('li[cslid=1]')),
				"Bibliography");

			start();
		}
	});
});
