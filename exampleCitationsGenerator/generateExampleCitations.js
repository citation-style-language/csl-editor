// NOTE: can't "use strict" whole file because of shimDefine()

// decrease this for testing
var STYLES_LIMIT = 50000;

var fs = require('fs');
var requirejs = require('requirejs');

var getFile = function (filePath) {
	var source = fs.readFileSync(filePath).toString().replace('"use strict";', '');
	return source;
};

var requireConfig = {
	nodeRequire: require,
	baseUrl: "..",
	shim: {
		'external/diff-match-patch/diff_match_patch': {
			exports: 'diff_match_patch'
		}
	}
};

requirejs.config(requireConfig);

// because requirejs shim needs exported globals to be added to 'this'
// when running in node.js
//
// could use standard shim if the following was added to the bottom of all source files:
//
// this.MODULE_NAME = MODULE_NAME;
// e.g. in xmldom.js: this.CSL_CHROME = CSL_CHROME;
//
var shimDefine = function (path, dependencies, exports) {
	requirejs.define(path, dependencies, function () {
		var actualPath = path;

		if ("path" in requireConfig && path in requireConfig.paths) {
			console.log(path + " in paths");
			actualPath = requireConfig.paths[path];
		}

		eval(getFile(requireConfig.baseUrl + actualPath + ".js"));
		return eval(exports);
	});
};
shimDefine('external/citeproc/xmldom', [], 'CSL_CHROME');
shimDefine('external/citeproc/citeproc', ['external/citeproc/xmldom'], 'CSL');

requirejs(['src/citeprocLoadSys'], function (sys) {
	// alter to read locales from disk
	sys.__proto__.retrieveLocale = function (lang) {
		var thisLocale = this.locale[lang];

		if (typeof(thisLocale) === "undefined") {
			// try to fetch from disk
			try {
				thisLocale = fs.readFileSync("../external/locales/locales-" + lang + ".xml").toString();
			} catch (err) {
				console.log("couldn't fetch locale: " + lang);
			}
		}

		return thisLocale;
	};
});

requirejs(
		[	'jquery',
			'exampleCitationsGenerator/config',
			'src/xmlUtility',
			'src/citationEngine',
			'src/exampleCitations',
			'src/debug'
		],
		function (
			$,
			cslServerConfig,
			CSLEDIT_xmlUtility,
			CSLEDIT_citationEngine,
			CSLEDIT_exampleCitations,
			debug
		) {

	"use strict";

	var CSL_NODEJS = require("./csl_nodejs_jsdom").CSL_NODEJS_JSDOM;

	// loop through the parent (unique) csl-styles generating example citations for
	// each one
	var masterStyleFromId = {};

	var exampleCitations = {
		exampleCitationsFromMasterId: {},
	};

	var cslStyles = {
		masterIdFromId: {},
		styleTitleFromId: {}
	};

	var entries = 0;

	var addCslFileToIndex = function (file) {
		var fileData, xmlParser, xmlDoc, styleId, styleTitle, linkNodes, masterId,
			citeprocResult;

		entries++;

		fileData = CSLEDIT_xmlUtility.stripComments(fs.readFileSync(file, "utf-8"));
		console.log('calculating examples for ' + file);
		xmlParser = new CSL_NODEJS();

		xmlDoc = "notSet";
		try {
			xmlDoc = xmlParser.makeXml(fileData);
		} catch (err) {
			console.log('FAILED to parse ' + file);
			console.log(err);
		}

		if (xmlDoc !== "notSet") {
			styleId = xmlParser.getStyleId(xmlDoc);
			styleTitle = xmlDoc.getElementsByTagName("title").item(0).textContent;
			cslStyles.styleTitleFromId[styleId] = styleTitle;

			// check if this is a dependent style and find it's parent ID if so
			linkNodes = $(xmlDoc).find('info link[rel="independent-parent"]');
			masterId = styleId;

			linkNodes.each(function () {
				masterId = $(this).attr("href");
			});
			
			// TODO: why is this preventing the JSON.stringify() working in jslibs?
			cslStyles.masterIdFromId[styleId] = masterId;
			
			if (styleId === masterId) {
				masterStyleFromId[masterId] = fileData;

				// just need one example citation
				CSLEDIT_exampleCitations.setCitations([{
					citationId: "CITATION-1",
					citationItems: [],
					properties: {noteIndex: 0},
					schema: "https://github.com/citation-style-language/schema/raw/master/csl-citation.json"
				}]);

				exampleCitations.exampleCitationsFromMasterId[styleId] = [];

				$.each(CSLEDIT_exampleCitations.getReferences(), function (i, exampleReference) {
					CSLEDIT_exampleCitations.setReferenceIndexesForCitation(0, [i]);
					
					citeprocResult = CSLEDIT_citationEngine.formatCitations(
						fileData,
						CSLEDIT_exampleCitations.getCiteprocReferences(),
						CSLEDIT_exampleCitations.getCitations());

					// merge bibliography to one string
					citeprocResult.formattedBibliography =
						citeprocResult.formattedBibliography.join("<br \/>"); 

					// clean up citeproc result for display
					citeprocResult.formattedBibliography =
						citeprocResult.formattedBibliography
						.replace(/<second-field-align>/g, "")
						.trim();

					var bibliographyElement = $('<div/>').html(citeprocResult.formattedBibliography);
					var cslEntry = bibliographyElement.find(".csl-entry");

					if (cslEntry.length === 0) {
						citeprocResult.formattedBibliography = citeprocResult.formattedBibliography;
					} else {
						citeprocResult.formattedBibliography = cslEntry.html();
					}
					citeprocResult.formattedBibliography = citeprocResult.formattedBibliography
						.replace(/<\/div class="csl>/g, " ")
						.replace(/^[\n ]*/g, "")
						.replace(/[\n ]*$/g, "");

					exampleCitations.exampleCitationsFromMasterId[styleId].push(citeprocResult);

					if (citeprocResult.statusMessage !== "") {
						console.log("CITEPROC ERROR: " + citeprocResult.statusMessage);
					}
				});
			}
		}
	};

	var processDir = function (dirPath) {
		var dirContents = fs.readdirSync(dirPath),
			index,
			file;

		console.log("processing dir " + dirPath);
		console.log("files = " + dirContents.length);

		for (index = 0; index < dirContents.length && index < STYLES_LIMIT; index++) {
			file = dirContents[index];
			if (!fs.statSync(dirPath + '/' + file).isDirectory() && /.csl$/.test(file)) {
				addCslFileToIndex(dirPath + '/' + file);
			}
		}
	};

	var startTime;
	startTime = (new Date()).getTime();

	processDir('../' + cslServerConfig.cslStylesPath);
	processDir('../' + cslServerConfig.cslStylesPath + '/dependent');

	console.log("took " + (((new Date()).getTime() - startTime) / 1000) + "s");
	console.log("num entries = " + entries);

	// output results to .json file:
	var outputDir;
	outputDir = "../" + cslServerConfig.dataPath;
	fs.mkdir(outputDir);

	var outputToJSFile = function (jsonData, name) {
		var outputString = JSON.stringify(jsonData, null, "\t");

		fs.writeFileSync(outputDir + '/' + name + '.json', outputString);
	};

	outputToJSFile(exampleCitations, "preGeneratedExampleCitations");
	outputToJSFile(cslStyles, "cslStyles");
});
