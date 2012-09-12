"use strict";

// Dynamic JS source code documentation generator
//
// Very basic at the moment:
// - walks the dependency graph of a list of given resources
// - for each resource, extracts the module description, which is the comment 
//   before the define() statement
//

define(['src/urlUtils'], function (CSLEDIT_urlUtils) {

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
					var match = /^\/\/(.*)/.exec(line);

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

				result.description = description.join("\n").split("\n\n");

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

	var generate = function (resources, element) {
		element = $(element);

		element.html("");

		var sourceFiles = [];
		populatePageData(resources, sourceFiles);

		// draw page
		$.each(sourceFiles, function (i, sourceFile) {
			element.append('<h3><a name="' + sourceFile.name + '" href="#' + sourceFile.name + '">' + sourceFile.name + '</a></h3>');
			var moduleInfo = $('<div/>').addClass("moduleInfo");

			if (sourceFile.description.length === 0 ||
					sourceFile.description.length === 1 && sourceFile.description[0] === "") {
				moduleInfo.append('<p><strong>No documentation!</strong></p>');
			} else {
				moduleInfo.append('<p>' + sourceFile.description.join("</p><p>") + '</p>');
			}
			moduleInfo.append('<strong>dependencies: </strong>');
			var depList = [];
			$.each(sourceFile.dependencies, function (i, dep) {
				depList.push('<a href="#' + dep + '">' + dep + '</a>');
			});
			moduleInfo.append(depList.join(", "));
			moduleInfo.append('<p><a href="' + sourceFile.url + '">View Code</a></p>');
			element.append(moduleInfo);
		});
	};

	return {
		generate : generate
	};
});
