// Sets configuration options for RequireJS
//
// Note: the 'baseURL' option must be specified in the calling page,
//       since that is what it's relative to

requirejs.config({
	// Aliases for some of the external paths
	paths: {
		'jquery.ui' : 'external/jquery-ui-1.9.1.custom.min',
		'jquery.hotkeys' : 'external/jquery.hotkeys',
		'jquery.jstree-patched' : 'external/jstree/jquery.jstree-patch1',
		'jquery.layout' : 'external/jquery.layout-1.3.0.rc30.7.min',
		'jquery.hoverIntent' : 'external/jquery.hoverIntent.minified',
		'jquery.scrollTo' : 'external/jquery.scrollTo-1.4.2-min',
		'jquery.cleditor' : 'external/cleditor/jquery.cleditor',
		'jquery.qunit' : 'external/qunit/qunit-1.9.0',

		'external/codemirror' : 'external/codemirror2/lib/codemirror',
		'external/codemirrorXmlMode' : 'external/codemirror2/mode/xml/xml',
		
		'external/xregexp' : 'external/xregexp/xregexp-with-unicode-base-min',

		'external/markdown' : 'external/pagedown/Markdown.Converter'
	},

	// For dependencies which don't use RequireJS, this says what they depend on,
	// and which (if any) global variable they export
	shim: {
		'jquery.ui': {
			deps : ['jquery']
		},
		'jquery.hotkeys': {
			deps : ['jquery']
		},
		'jquery.jstree-patched': {
			deps : ['jquery']
		},
		'jquery.layout': {
			deps : ['jquery.ui']
		},
		'jquery.hoverIntent': {
			deps : ['jquery']
		},
		'jquery.scrollTo': {
			deps : ['jquery']
		},
		'jquery.cleditor': {
			deps : ['jquery']
		},
		'jquery.qunit': {
			deps : ['jquery']
		},
		'external/codemirrorXmlMode': {
			deps : ['external/codemirror'],
			exports: 'CodeMirror'
		},
		'external/diff-match-patch/diff_match_patch': {
			exports: 'diff_match_patch'
		},
		'external/citeproc/xmldom' : {
			exports: 'CSL_CHROME'
		},
		'external/citeproc/citeproc' : {
			deps: [
				'external/citeproc/xmldom',
				'src/citeprocLoadSys'
			],
			exports: 'CSL'
		},
		'external/xregexp' : {
			exports : 'XRegExp'
		},
		'external/codemirror': {
			exports: 'CodeMirror'
		},
		'external/markdown': {
			exports: 'Markdown'
		}
	}
});

