"use strict";

// Dynamic JS source code documentation generator
//
// Very basic at the moment:
// - walks the dependency graph of a list of given resources
// - for each resource it extracts the module description, which is the comment 
//   before the define() statement, and displays it using markdown

define(
		[	'src/urlUtils',
			'src/mustache',
			'src/debug',
			'external/markdown'
		],
		function (
			CSLEDIT_urlUtils,
			CSLEDIT_mustache,
			debug,
			Markdown
		) {

	var markdown = new Markdown.Converter();
	
	// returns a JSON object with documentation of the code at @param resource
	var getSourceFileData = function (resource) {
		var resourceUrl = CSLEDIT_urlUtils.getResourceUrl(resource),
			result = {
				name: resource
			};

		$.ajax({
			url: resourceUrl,
			dataType: "text",
			success: function (code) {
				result.code = code;

				// get module description and dependent files
				var lines = code.split("\n");

				result.lineCount = lines.length;

				var description = [];

				result.dependencies = [];

				var withinDependencySection = false; // used to know when to stop parsing

				// assume any comments starting at char 0 are the description
				$.each(lines, function (i, line) {
					var match = /^\/\/\s?(.*)/.exec(line);

					if (match !== null) {
						// markdown headings
						var thisDescriptionLine = match[1];

						if (thisDescriptionLine.length > 0 && thisDescriptionLine[0] === "#") {
							thisDescriptionLine = '##' + thisDescriptionLine;
						}

						description.push(thisDescriptionLine);
					}

					var dependents = line.match(/'src\/[a-zA-Z0-9]*'/g);

					if (dependents === null) {
						if (withinDependencySection) {
							// after leaving the dependency section, stop parsing
							return false;
						}
					} else {
						withinDependencySection = true;
						$.each(dependents, function (i, dependency) {
							var name = dependency.replace(/'/g, "");
							result.dependencies.push(name);
							result.hasDependencies = true;
						});
					}
				});

				description = description.join("\n");
				if (description.length === 0) {
					result.error = "No documentation!";
				} else {
					result.descriptionHtml = markdown.makeHtml(description);
				}
				result.url = resourceUrl;
			},
			error: function () {
				result.error = "Couldn't fetch resource: " + resourceUrl;
			},
			async: false
		});

		return result;
	};

	var populatePageData = function (resourceQueue, sourceFiles, processedResources) {
		var thisResource = resourceQueue.pop();
		processedResources = processedResources || [];

		if (typeof(thisResource) === "undefined") {
			// finished
			return;
		}

		var thisData = getSourceFileData(thisResource);
		processedResources.push(thisResource);
		sourceFiles.push(thisData);

		$.each(thisData.dependencies, function (i, dependency) {
			if (resourceQueue.indexOf(dependency) === -1 &&
					processedResources.indexOf(dependency) === -1) {
				resourceQueue.push(dependency);
			}
		});

		populatePageData(resourceQueue, sourceFiles, processedResources);
	};

	var generate = function (resources, element) {
		element = $(element);

		var jsModules = [];
		populatePageData(resources, jsModules);

		jsModules.sort(function (a, b) {
			if (a.name < b.name) {
				return -1;
			} else if (a.name > b.name) {
				return 1;
			} else {
				return 0;
			}
		});

		$.each(jsModules, function (i, module) {
			// calculate dependents
			module.dependents = [];
			$.each(jsModules, function (i, innerModule) {
				if (innerModule.dependencies.indexOf(module.name) !== -1) {
					module.dependents.push({ name: innerModule.name });
					module.hasDependents = true;
				}
			});
		});

		var totalLineCount = 0;

		// convert dependencies for use by mustache
		$.each(jsModules, function (i, module) {
			$.each(module.dependencies, function (i, dep) {
				module.dependencies[i] = { name: dep };
			});

			totalLineCount += module.lineCount;
		});

		element.html(CSLEDIT_mustache.toHtml('jsModules',
			{
				modules : jsModules,
				totalLineCount : totalLineCount,
				cleanName : function () {
					return function (text) {
						return text.replace('src&#x2F;', '');
					};
				}
			}
		));
	};

	return {
		generate : generate
	};
});
