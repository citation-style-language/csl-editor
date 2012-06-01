"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.diff = {
	dmp : new diff_match_patch(),

	/**
	 * Modified version of the diff-match-patch function which
	 * doesn't escape the original HTML tags
	 * (There's a risk now of mangling the tags, but it's a risk I'm willing to take)
	 *  
	 * Convert a diff array into a pretty HTML report.
	 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
	 * @return {string} HTML representation.
	 */
	prettyHtml : function(diffs) {
	  var html = [];
	  var pattern_amp = /&/g;
	  var pattern_lt = /</g;
	  var pattern_gt = />/g;
	  var pattern_para = /\n/g;
	  var x = 0;

	  for (x = 0; x < diffs.length; x++) {
		var op = diffs[x][0];    // Operation (insert, delete, equal)
		var data = diffs[x][1];  // Text of change.
		var text = data;//.replace(pattern_amp, '&amp;').replace(pattern_lt, '&lt;').replace(pattern_gt, '&gt;').replace(pattern_para, '&para;<br>');
		switch (op) {
		  case DIFF_INSERT:
			html[x] = '<ins style="background:#e6ffe6;">' + text + '</ins>';
			break;
		  case DIFF_DELETE:
			html[x] = '<del style="background:#ffe6e6;">' + text + '</del>';
			break;
		  case DIFF_EQUAL:
			html[x] = '<span>' + text + '</span>';
			break;
		}
	  }
	  return html.join('');
	},

	prettyHtmlDiff : function (oldString, newString) {
		var diffs = this.dmp.diff_main(oldString, newString);
		this.dmp.diff_cleanupSemantic(diffs);
		return this.prettyHtml(diffs);
	},

	customEditDistance : function (oldString, newString) {
		var diffs = this.dmp.diff_main(oldString, newString);
		return this.weightedLevenshtein(diffs);
	},

	// human friendly value from 0 to 100 to use as a match percentage
	matchQuality : function (oldString, newString) {
		var editDistance = CSLEDIT.diff.customEditDistance(oldString, newString),
			matchQuality = Math.max(0, Math.floor(100 * (1.0 - editDistance /
				(2 * (oldString + newString).length))));

		return matchQuality;
	},

	/**
	 * Like levenshtein but gives much more weight to deletions.
	 * 
	 * Generally when searching you want everything you've typed to appear
	 * in the results.
	 */
	weightedLevenshtein : function (diffs) {
	  var levenshtein = 0;
	  var insertions = 0;
	  var deletions = 0;

	  var deletionWeight = 5;

	  for (var x = 0; x < diffs.length; x++) {
		var op = diffs[x][0];
		var data = diffs[x][1];
		switch (op) {
		  case DIFF_INSERT:
			insertions += data.length;
			break;
		  case DIFF_DELETE:
			deletions += data.length;
			break;
		  case DIFF_EQUAL:
			// A deletion and an insertion is one substitution.
			levenshtein += Math.max(insertions, deletions*deletionWeight);
			insertions = 0;
			deletions = 0;
			break;
		}
	  }
	  levenshtein += Math.max(insertions, deletions*deletionWeight);
	  return levenshtein;
	}
};
