"use strict";

define(
		[	'src/cslParser',
			'external/csl-validator'
		],
		function (
			CSLEDIT_cslParser,
			cslValidator
		) {
	return {
		validate : function (cslStyle) {
			var validatorOutput = cslValidator(cslStyle);

			if (validatorOutput === "") {
				return {
					success : true
				};
			} else {
				// TODO: add /g global specifier and get line numbers from each occurance
				var match = validatorOutput.match(/stdin:(\d+):/);
				var cslId;

				console.log("matches = " + JSON.stringify(match));

				if (match !== null && match.length > 1) {
					cslId = CSLEDIT_cslParser.cslIdFromLineNumber(cslStyle, parseInt(match[1], 10));
				}
				return {
					success : false,
					error : validatorOutput,
					cslId : cslId
				};
			}
		}
	};	
});
