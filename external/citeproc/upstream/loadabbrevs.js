/*
 * Copyright (c) 2009 and 2010 Frank G. Bennett, Jr. All Rights
 * Reserved.
 *
 * The contents of this file are subject to the Common Public
 * Attribution License Version 1.0 (the “License”); you may not use
 * this file except in compliance with the License. You may obtain a
 * copy of the License at:
 *
 * http://bitbucket.org/fbennett/citeproc-js/src/tip/LICENSE.
 *
 * The License is based on the Mozilla Public License Version 1.1 but
 * Sections 14 and 15 have been added to cover use of software over a
 * computer network and provide for limited attribution for the
 * Original Developer. In addition, Exhibit A has been modified to be
 * consistent with Exhibit B.
 *
 * Software distributed under the License is distributed on an “AS IS”
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See
 * the License for the specific language governing rights and limitations
 * under the License.
 *
 * The Original Code is the citation formatting software known as
 * "citeproc-js" (an implementation of the Citation Style Language
 * [CSL]), including the original test fixtures and software located
 * under the ./std subdirectory of the distribution archive.
 *
 * The Original Developer is not the Initial Developer and is
 * __________. If left blank, the Original Developer is the Initial
 * Developer.
 *
 * The Initial Developer of the Original Code is Frank G. Bennett,
 * Jr. All portions of the code written by Frank G. Bennett, Jr. are
 * Copyright (c) 2009 and 2010 Frank G. Bennett, Jr. All Rights Reserved.
 *
 * Alternatively, the contents of this file may be used under the
 * terms of the GNU Affero General Public License (the [AGPLv3]
 * License), in which case the provisions of [AGPLv3] License are
 * applicable instead of those above. If you wish to allow use of your
 * version of this file only under the terms of the [AGPLv3] License
 * and not to allow others to use your version of this file under the
 * CPAL, indicate your decision by deleting the provisions above and
 * replace them with the notice and other provisions required by the
 * [AGPLv3] License. If you do not delete the provisions above, a
 * recipient may use your version of this file under either the CPAL
 * or the [AGPLv3] License.”
 */

var abbreviations = {
	"default": {
		"container-title":{
			"Pacific Rim Law & Policy Journal":"Pac. Rim L. & Pol\u2019y J.",
			"\u65e5\u672c\u6559\u80b2\u5de5\u5b66\u4f1a\u8ad6\u6587\u8a8c":"\u65e5\u6559\u8ad6\u8a8c",
			"Applied and Environmental Microbiology":"Applied and Environmental Microbiology"
		},
		"collection-title":{
			"International Rescue Wildlife Series":"I.R. Wildlife Series"
		},
		"authority":{
			"United Nations": "U.N."
		},
		"institution":{
			"U.S. Bureau of the Census":"U.S. Bureau of the Census"
		}
	},
	"slightly_weird": {
		"container-title":{
			"Pacific Rim Law & Policy Journal":"PRL & PJ",
			"\u65e5\u672c\u6559\u80b2\u5de5\u5b66\u4f1a\u8ad6\u6587\u8a8c":"\u65e5\u6559\u8ad6",
			"Applied and Environmental Microbiology":"Appl'd. & Env'tal Microbio."
		},
		"collection-title":{
			"International Rescue Wildlife Series":"I.R. Wildlife Series"
		},
		"authority":{
			"United Nations": "U.N."
		},
		"institution":{
			"U.S. Bureau of the Census":"U.S. Census Bureau"
		}
	}
};





