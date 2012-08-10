({
	baseUrl: ".",
	mainConfigFile: "src/config.js",
	optimize: "none",

	appDir: ".",
/*	
 *	TODO: try to get this working, we shouldn't include a different jquery on
 *	      every page
 */
	paths: {
		'jquery': 'empty:',
		'jquery.ui': 'empty:'
	},

	modules: [
		{
			name: 'src/VisualEditor'
		},
		{
			name: 'src/SearchByExample'
		},
		{
			name: 'src/SearchByName'
		},
		{
			name: 'src/CodeEditor'
		}
	]
})
