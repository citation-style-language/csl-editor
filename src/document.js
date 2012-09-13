"use strict";

// Dynamic JS source code documentation generator
//
// Very basic at the moment:
// - walks the dependency graph of a list of given resources
// - for each resource it extracts the module description, which is the comment 
//   before the define() statement, and displays it using markdown

define(
		[	'src/urlUtils',
			'external/markdown'
		],
		function (
			CSLEDIT_urlUtils,
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

				var description = [];

				result.dependencies = [];

				var withinDependencySection = false; // used to know when to stop parsing

				// assume any comments starting at char 0 are the description
				$.each(lines, function (i, line) {
					var match = /^\/\/\s?(.*)/.exec(line);

					if (match !== null) {
						description.push(match[1]);
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
							result.dependencies.push(dependency.replace(/'/g, ""));
						});
					}
				});

				result.description = description.join("\n");

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

		console.log("resource stack = " + JSON.stringify(resourceQueue));

		if (typeof(thisResource) === "undefined") {
			// finished
			return;
		}

		var thisData = getSourceFileData(thisResource);

		processedResources.push(thisResource);

		sourceFiles.push(thisData);

		console.log("deps  = " + JSON.stringify(thisData.dependencies));

		$.each(thisData.dependencies, function (i, dependency) {
			if (resourceQueue.indexOf(dependency) === -1 &&
					processedResources.indexOf(dependency) === -1) {
				console.log("adding to queue: " + dependency);
				resourceQueue.push(dependency);
			}
		});

		populatePageData(resourceQueue, sourceFiles, processedResources);
	};

	var cleanName = function (name) {
		return name.replace('src/', '');
	};

	var generate = function (resources, element) {
		element = $(element);

		element.html("");

		var sourceFiles = [];
		populatePageData(resources, sourceFiles);

		sourceFiles.sort(function (a, b) {
			if (a.name < b.name) {
				return -1;
			} else if (a.name > b.name) {
				return 1;
			} else {
				return 0;
			}
		});

		// draw page
		$.each(sourceFiles, function (i, sourceFile) {
			element.append('<h3><a name="' + sourceFile.name + '" href="#' + sourceFile.name + '">' + cleanName(sourceFile.name) + '</a></h3>');
			var moduleInfo = $('<div/>').addClass("moduleInfo");

			if (sourceFile.description.length === 0) {
				moduleInfo.append('<p><strong>No documentation!</strong></p>');
			} else {
				moduleInfo.append(markdown.makeHtml(sourceFile.description));
			}

			var depList = [];
			$.each(sourceFile.dependencies, function (i, dep) {
				depList.push('<a href="#' + dep + '">' + cleanName(dep) + '</a>');
			});
			if (depList.length > 0) {
				moduleInfo.append('<p><strong>dependencies: </strong>' + depList.join(", ") + '</p>');
			}

			var usedBy = [];
			$.each(sourceFiles, function (i, sourceFile2) {
				if (sourceFile2.dependencies.indexOf(sourceFile.name) !== -1) {
					usedBy.push('<a href="#' + sourceFile2.name + '">' + cleanName(sourceFile2.name) + '</a>');
				}
			});
			if (usedBy.length > 0) {
				moduleInfo.append('<p><strong>used by: </strong>' + usedBy.join(", ") + '</p>');
			}

			moduleInfo.append('<p><a href="' + sourceFile.url + '">View Code</a></p>');

			element.append(moduleInfo);
		});
	};

	return {
		generate : generate
	};
});
