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
		"loaded.jstree" : function () {
			console.log("treeview loaded: " + treeView.jQueryElement.html());
			equal(treeView.jQueryElement.find('li[cslid="0"]').attr("rel"), "style");
			equal(treeView.jQueryElement.find('li[cslid="1"]').attr("rel"), "info");
			equal(treeView.jQueryElement.find('li[cslid="2"]').attr("rel"), "author");
			equal(treeView.jQueryElement.find('li[cslid="3"]').attr("rel"), "citation");
			start();
		}
	});
});
/*
asyncTest("add/delete/ammend nodes", function () {
	var cslData,
		treeView;

	cslData = CSLEDIT.data.setCslCode(
		"<style><\/style>");

	treeView = CSLEDIT.CslTreeView($("<div><\/div>"));
	
	treeView.addNode(0, 0, {name : "info"} );
	treeView.addNode(1, 0, {name : "author"} );
	treeView.addNode(0, 1, {name : "citation"} );

	treeView.createFromCslData(cslData, {
		"loaded.jstree" : function () {
			console.log("treeview loaded: " + treeView.jQueryElement.html());
			equal(treeView.jQueryElement.find('li[cslid="0"]').attr("rel"), "style");
			equal(treeView.jQueryElement.find('li[cslid="1"]').attr("rel"), "info");
			equal(treeView.jQueryElement.find('li[cslid="2"]').attr("rel"), "author");
			equal(treeView.jQueryElement.find('li[cslid="3"]').attr("rel"), "citation");
			start();
		}
	});
});*/
