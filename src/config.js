requirejs.config({
	// we don't know where the page is so we must rely on it for a base url
	paths: {
		'jquery.ui' : 'external/jquery-ui-1.8.22.custom.min',
		'jquery.hotkeys' : 'external/jstree/_lib/jquery.hotkeys',
		'jquery.jstree-patched' : 'external/jstree/jquery.jstree-patch1',
		'jquery.layout' : 'external/jquery.layout-1.3.0.rc30.7.min',
		'jquery.hoverIntent' : 'external/jquery.hoverIntent.minified',
		'jquery.scrollTo' : 'external/jquery.scrollTo-1.4.2-min',
		'jquery.cleditor' : 'external/cleditor/jquery.cleditor',
		'jquery.qunit' : 'external/qunit/qunit-1.9.0',

		'external/codemirror' : 'external/codemirror2/lib/codemirror',
		'external/codemirrorXmlMode' : 'external/codemirror2/mode/xml/xml',
		
		'external/citeproc/citeproc' : 'external/citeproc/citeproc-1.0.336',

		'external/xregexp' : 'external/xregexp/xregexp-with-unicode-base-min',
	},
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
		}
	}
});

