define(
		[	'src/VisualEditor',
			'src/cslStyles',
			'src/debug'
		],
		function (
			CSLEDIT_VisualEditor,
			CSLEDIT_cslStyles,
			debug
		) {
	module('CSLEDIT_cslStyles');

	test('styles', function () {
		var defaultMasterId = CSLEDIT_cslStyles.styles().masterIdFromId[CSLEDIT_cslStyles.defaultStyleId],
			numStyles = Object.keys(CSLEDIT_cslStyles.styles().masterIdFromId).length;
		
		equal(defaultMasterId, CSLEDIT_cslStyles.defaultStyleId, "default style is master");

		ok(numStyles > 2000, "enough styles");
		equal(numStyles, Object.keys(CSLEDIT_cslStyles.styles().styleTitleFromId).length, "enough titles");
		
		debug.log("Total number of styles: " + numStyles);
	});

	test('examples', function () {
		ok(Object.keys(CSLEDIT_cslStyles.exampleCitations().exampleCitationsFromMasterId).length > 500);

		debug.log("Number of example citations: " +
			CSLEDIT_cslStyles.exampleCitations().exampleCitationsFromMasterId.length);
	});

	test('style id generation', function () {
		var numSuccesses = 0,
			failures = [],
			successRate,
			tolerance = 0.86;

		// check that we generate titles the same as the existing repo ones
		$.each(CSLEDIT_cslStyles.styles().styleTitleFromId, function (id, title) {
			var generatedId = CSLEDIT_cslStyles.generateStyleId(title);
			
			if (generatedId === id) {
				numSuccesses++;
			} else {
				failures.push({
					title : title,
					id : id,
					generatedId : generatedId
				});
			}
		});

		successRate = numSuccesses / (numSuccesses + failures.length);
		debug.log("success rate = " + successRate);
		ok(successRate > tolerance, "success rate = " + Math.round(successRate * 100) +
				"% (minimum tolerance = " + Math.round(100 * tolerance) + "%)");

		if (successRate <= tolerance) {
			// show failures
			$.each(failures, function (i, fail) {
				equal(fail.generatedId, fail.id, fail.title);
			});
		}
	});
});
