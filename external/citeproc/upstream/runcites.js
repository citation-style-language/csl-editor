/*
 * Copyright (c) 2009 and 2010 Frank G. Bennett, Jr. All Rights
 * Reserved.
 *
 * The contents of this file are subject to the Common Public
 * Attribution License Version 1.0 (the “License”); you may not use
 * this file except in compliance with the License. You may obtain a
 * copy of the License at:
 *
 * http://bitbucket.org/fbennett/citeproc-js/src/tip/LICENSE.
 *
 * The License is based on the Mozilla Public License Version 1.1 but
 * Sections 14 and 15 have been added to cover use of software over a
 * computer network and provide for limited attribution for the
 * Original Developer. In addition, Exhibit A has been modified to be
 * consistent with Exhibit B.
 *
 * Software distributed under the License is distributed on an “AS IS”
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See
 * the License for the specific language governing rights and limitations
 * under the License.
 *
 * The Original Code is the citation formatting software known as
 * "citeproc-js" (an implementation of the Citation Style Language
 * [CSL]), including the original test fixtures and software located
 * under the ./std subdirectory of the distribution archive.
 *
 * The Original Developer is not the Initial Developer and is
 * __________. If left blank, the Original Developer is the Initial
 * Developer.
 *
 * The Initial Developer of the Original Code is Frank G. Bennett,
 * Jr. All portions of the code written by Frank G. Bennett, Jr. are
 * Copyright (c) 2009 and 2010 Frank G. Bennett, Jr. All Rights Reserved.
 *
 * Alternatively, the contents of this file may be used under the
 * terms of the GNU Affero General Public License (the [AGPLv3]
 * License), in which case the provisions of [AGPLv3] License are
 * applicable instead of those above. If you wish to allow use of your
 * version of this file only under the terms of the [AGPLv3] License
 * and not to allow others to use your version of this file under the
 * CPAL, indicate your decision by deleting the provisions above and
 * replace them with the notice and other provisions required by the
 * [AGPLv3] License. If you do not delete the provisions above, a
 * recipient may use your version of this file under either the CPAL
 * or the [AGPLv3] License.”
 */

function pointedStickInnerHtml(elementid,content){
	if (document.getElementById && !document.all){
		var rng = document.createRange();
		var el = document.getElementById(elementid);
		rng.setStartBefore(el);
		var htmlFrag = rng.createContextualFragment(content);
		while (el.hasChildNodes())
			el.removeChild(el.lastChild);
		el.appendChild(htmlFrag);
	} else {
		if (document.getElementById) {
			var el = document.getElementById(elementid);
			el.innerHTML = content;
		}
	}
}

var CiteInserter = function (name, stub) {
	this.stub = stub;
	this.nodes = [];
	this.idx = 0;
	var spannodes = document.getElementsByTagName("span");
	for (var pos = 0, len = spannodes.length; pos < len; pos += 1) {
		var node = spannodes.item(pos);
		if (node.getAttribute("name") !== name) {
			continue;
		}
		this.nodes.push(node);
	}
};

CiteInserter.prototype.insertCite = function (cites) {
	// Refreshes any previously rendered items requiring updates
	// due to disambiguation.
	for (var i = 0, ilen = cites.length; i < ilen; i += 1) {
		var id = this.stub + (cites[i][0] + 1);
		pointedStickInnerHtml(id,cites[i][1]);
	}
	this.idx += 1;
}

var citationCAD1 = {
	"citationItems": [
        {
			id: "ITEM-1"
		}
	],
	"properties": {
		"noteIndex": 1
	}
};

var citationCAD2 = {
	"citationItems": [
        {
			id: "ITEM-2"
		}
	],
	"properties": {
		"noteIndex": 2
	}
};

var citationCAD3 = {
	"citationItems": [
        {
			id: "ITEM-3"
		}
	],
	"properties": {
		"noteIndex": 3
	}
};

var citationCAD4 = {
	"citationItems": [
        {
			id: "ITEM-4"
		}
	],
	"properties": {
		"noteIndex": 4
	}
};

var citationCAD5 = {
	"citationItems": [
        {
			id: "ITEM-5"
		}
	],
	"properties": {
		"noteIndex": 5
	}
};

var citationCAD6 = {
	"citationItems": [
        {
			id: "ITEM-6"
		}
	],
	"properties": {
		"noteIndex": 6
	}
};

var citationCAD7 = {
	"citationItems": [
        {
			id: "ITEM-21"
		}
	],
	"properties": {
		"noteIndex": 7
	}
};

var citationBB1 = {
	"citationItems": [
        {
			id: "ITEM-6",
			label: "page",
			locator: "223"
		}
	],
	"properties": {
		"noteIndex": 1
	}
};

var citationBB2 = {
	"citationItems": [
        {
			id: "ITEM-6"
		},
        {
			id: "ITEM-10",
			label: "page",
			locator: "685"
		},
        {
			id: "ITEM-11",
			label: "page",
			locator: "388"
		},
        {
			id: "ITEM-12",
			label: "page",
			locator: "359"
		},
        {
			id: "ITEM-10",
			label: "page",
			locator: "690"
		},
        {
			id: "ITEM-11",
			label: "page",
			locator: "393"
		},
        {
			id: "ITEM-12",
			label: "page",
			locator: "364"
		},
        {
			id: "ITEM-6",
			locator: "15",
			prefix:"<i>but see</i>"
		}
	],
	"properties": {
		"noteIndex": 2
	}
};

var citationBB3 = {
	"citationItems": [
        {
			id: "ITEM-13",
			locator:"90",
			label:"section"
		},
        {
			id: "ITEM-14",
			locator:"7",
			label:"section"
		},
        {
			id: "ITEM-15",
			locator:"731-32",
			label:"page"
		},
        {
			id: "ITEM-16"
		}
	],
	"properties": {
		"noteIndex": 3
	}
};

var citationBB4 = {
	"citationItems": [
        {
			id: "ITEM-2"
		}
	],
	"properties": {
		"noteIndex": 4
	}
};

var citationBB5 = {
	"citationItems": [
        {
			id: "ITEM-2",
			label:"page",
			locator:"482"
		},
        {
			id: "ITEM-13",
			locator:"395",
			label:"section"
		},
        {
			id: "ITEM-1",
			label:"page",
			locator:"25"
		},
        {
			id: "ITEM-1"
		},
        {
			id: "ITEM-1",
			label:"page",
			locator:"112"
		}
	],
	"properties": {
		"noteIndex": 5
	}
};

var citationBB6 = {
	"citationItems": [
        {
			id: "ITEM-16"
		}
	],
	"properties": {
		"noteIndex": 6
	}
};

var citationBB7 = {
	"citationItems": [
        {
			id: "ITEM-17",
			label:"paragraph",
			locator:"6"
		},
        {
			id: "ITEM-18",
			label:"page",
			locator:"983"
		}
	],
	"properties": {
		"noteIndex": 7
	}
};

var citationBB8 = {
	"citationItems": [
        {
			id: "ITEM-19",
			"suffix":"(appeal taken from Scot.)"
		}
	],
	"properties": {
		"noteIndex": 8
	}
};

var citationBB9 = {
	"citationItems": [
        {
			id: "ITEM-20",
			suffix:"(appeal taken from B.C.)"
		}
	],
	"properties": {
		"noteIndex": 9
	}
};

var citationBB10 = {
	"citationItems": [
        {
			id: "ITEM-3",
			prefix:"<b>En sinn Scholl beschéngt ass, da Mamm frësch blénken hun?</b> <i>See, e.g.</i>"
		},
        {
			prefix:"<b>Der mä gutt Dach, eng onser bléit geplot mä.</b>  <i>See generally</i>",
			id: "ITEM-3",
			suffix:"<b>(Iwer Engel Milliounen nei fu, blëtzen néierens d'Gaassen rou do.)</b>"
		}
	],
	"properties": {
		"noteIndex": 10
	}
};

var citationBB11 = {
	"citationItems": [
        {
			id: "ITEM-13",
			label:"section",
			locator:"1"
		}
	],
	"properties": {
		"noteIndex": 11
	}
};

var insert = function(){
	var citeproc, output;
	var sys = new Sys(abbreviations);

	// Chicago Author-Date
	citeproc = new CSL.Engine(sys, chicago_author_date);
	var citeInserter = new CiteInserter("citation_cad","cad");
	
	var cad1 = citeproc.appendCitationCluster(citationCAD1);
	citeInserter.insertCite(cad1);
	var cad2 = citeproc.appendCitationCluster(citationCAD2);
	citeInserter.insertCite(cad2);
	var cad3 = citeproc.appendCitationCluster(citationCAD3);
	citeInserter.insertCite(cad3);
	var cad4 = citeproc.appendCitationCluster(citationCAD4);
	citeInserter.insertCite(cad4);
	var cad5 = citeproc.appendCitationCluster(citationCAD5);
	citeInserter.insertCite(cad5);
	var cad6 = citeproc.appendCitationCluster(citationCAD6);
	citeInserter.insertCite(cad6);
	var cad7 = citeproc.appendCitationCluster(citationCAD7);
	//alert("Targeted update of cites\naffected by name addition:\n"+cad7);
	citeInserter.insertCite(cad7);
	output = citeproc.makeBibliography();
	if (output && output.length && output[1].length){
		output = output[0].bibstart + output[1].join("") + output[0].bibend;
		pointedStickInnerHtml("chicago_author_date",output);
	}

	// Bluebook and subsectioned bib
	citeproc = new CSL.Engine(sys,bluebook_demo);
	citeInserter = new CiteInserter("citation", "citation");
	citeproc.setAbbreviations("default");

	var citation1 = citeproc.appendCitationCluster(citationBB1);
	citeInserter.insertCite(citation1);
	var citation2 = citeproc.appendCitationCluster(citationBB2);
	citeInserter.insertCite(citation2);
	var citation3 = citeproc.appendCitationCluster(citationBB3);
	citeInserter.insertCite(citation3);
	var citation4 = citeproc.appendCitationCluster(citationBB4);
	citeInserter.insertCite(citation4);
	var citation5 = citeproc.appendCitationCluster(citationBB5);
	citeInserter.insertCite(citation5);
	var citation6 = citeproc.appendCitationCluster(citationBB6);
	citeInserter.insertCite(citation6);
	var citation7 = citeproc.appendCitationCluster(citationBB7);
	citeInserter.insertCite(citation7);
	var citation8 = citeproc.appendCitationCluster(citationBB8);
	citeInserter.insertCite(citation8);
	var citation9 = citeproc.appendCitationCluster(citationBB9);
	citeInserter.insertCite(citation9);
	var citation10 = citeproc.appendCitationCluster(citationBB10);
	citeInserter.insertCite(citation10);
	var citation11 = citeproc.appendCitationCluster(citationBB11);
	citeInserter.insertCite(citation11);

	var cases = {
		"include" : [
			{
				"field" : "type",
				"value" : "legal_case"
			},
			{
				"field" : "type",
				"value" : "legislation"
			}
		]
	};
	output = citeproc.makeBibliography(cases);
	if (output && output.length && output[1].length){
		output = output[0].bibstart + output[1].join("") + output[0].bibend;
		pointedStickInnerHtml("bluebook_demo_legal_stuff",output);
	}
	var books = {
		"select" : [
			{
				"field" : "type",
				"value" : "book"
			}
		]
	};
	output = citeproc.makeBibliography(books);
	if (output && output.length && output[1].length){
		output = output[0].bibstart + output[1].join("") + output[0].bibend;
		pointedStickInnerHtml("bluebook_demo_books",output);
	}
	var articles = {
		"exclude" : [
			{
				"field" : "type",
				"value" : "book"
			},
			{
				"field" : "type",
				"value" : "legal_case"
			},
			{
				"field" : "type",
				"value" : "legislation"
			}
		]
	};
	output = citeproc.makeBibliography(articles);
	if (output && output.length && output[1].length){
		output = output[0].bibstart + output[1].join("") + output[0].bibend;
		pointedStickInnerHtml("bluebook_demo_articles",output);
	}

	// Listing
	citeproc = new CSL.Engine(sys,chicago_author_date_listing);
	citeproc.updateItems(["ITEM-1", "ITEM-3", "ITEM-4", "ITEM-5", "ITEM-6", "ITEM-7", "ITEM-8","ITEM-9"]);
	citeproc.setAbbreviations("default");
	output = citeproc.makeBibliography();
	if (output && output.length && output[1].length){
		output = output[0].bibstart + output[1].join("") + output[0].bibend;
		pointedStickInnerHtml("chicago_author_date_listing",output);
	}

	// IEEE
	citeproc = new CSL.Engine(sys,ieee);
	citeproc.updateItems(["ITEM-1", "ITEM-2", "ITEM-3", "ITEM-4", "ITEM-5", "ITEM-6"]);
	citeproc.setAbbreviations("slightly_weird");
	output = citeproc.makeBibliography();
	if (output && output.length && output[1].length){
		output = output[0].bibstart + output[1].join("") + output[0].bibend;
		pointedStickInnerHtml("ieee",output);
	}

	// Annotated
	citeproc = new CSL.Engine(sys,chicago_fullnote_bibliography2);
	citeproc.updateItems(["ITEM-1", "ITEM-2", "ITEM-3", "ITEM-4", "ITEM-5", "ITEM-6"]);
	citeproc.setAbbreviations("default");
	output = citeproc.makeBibliography();
	if (output && output.length && output[1].length){
		output = output[0].bibstart + output[1].join("") + output[0].bibend;
		pointedStickInnerHtml("chicago_fullnote_bibliography2",output);
	}
	
	// WebKit Test
	citeproc = new CSL.Engine(sys,apa_x2);
	citeproc.updateItems(["ITEM-22"]);
	citeproc.setAbbreviations("default");
	output = citeproc.makeBibliography();
	if (output && output.length && output[1].length){
		output = output[0].bibstart + output[1].join("") + output[0].bibend;
		pointedStickInnerHtml("apa_x2",output);
	}

};
