define(['src/CodeEditor'], function (CSLEDIT_CodeEditor) {
	$(document).ready(function () {
		var codeEditor = new CSLEDIT_CodeEditor('#codeEditorContainer', {
			rootURL : "../.."
		});
	});
});
