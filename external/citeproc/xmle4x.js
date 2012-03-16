/*
 * Copyright (c) 2009, 2010 and 2011 Frank G. Bennett, Jr. All Rights
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
 * Copyright (c) 2009, 2010 and 2011 Frank G. Bennett, Jr. All Rights Reserved.
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

/**
 * Functions for parsing an XML object using E4X.
 */
var CSL_E4X = function () {};

/**
 * E4X can't handle XML declarations, so we lose them here.
 */
CSL_E4X.prototype.clean = function (xml) {
    xml = xml.replace(/<\?[^?]+\?>/g, "");
    xml = xml.replace(/<![^>]+>/g, "");
    xml = xml.replace(/^\s+/g, "");
    xml = xml.replace(/\s+$/g, "");
    return xml;
};


/**
 * Methods to call on a node.
 */
CSL_E4X.prototype.getStyleId = function (myxml) {
    var text = "";
    default xml namespace = "http://purl.org/net/xbiblio/csl"; with({});
    var node = myxml..id;
    if (node && node.length()) {
        text = node[0].toString();
    }
    return text;
};

CSL_E4X.prototype.children = function (myxml) {
    return myxml.children();
};

CSL_E4X.prototype.nodename = function (myxml) {
    var ret = myxml.localName();
    return ret;
};

CSL_E4X.prototype.attributes = function (myxml) {
    var ret, attrs, attr, key, xml;
    default xml namespace = "http://purl.org/net/xbiblio/csl"; with({});
    ret = new Object();
    attrs = myxml.attributes();
    for each (attr in attrs) {
        key = "@" + attr.localName();
        //
        // Needed in rhino
        //
        if (key.slice(0,5) == "@e4x_") {
            continue;
        }
        //var value = attr;
        ret[key] = attr.toString();
    }
    return ret;
};


CSL_E4X.prototype.content = function (myxml) {
    return myxml.toString();
};


CSL_E4X.prototype.namespace = {
    "xml":"http://www.w3.org/XML/1998/namespace"
}

CSL_E4X.prototype.numberofnodes = function (myxml) {
    return myxml.length();
};

CSL_E4X.prototype.getAttributeName = function (attr) {
    var ret = attr.localName();
    return ret;
}

CSL_E4X.prototype.getAttributeValue = function (myxml,name,namespace) {
    var xml;
    default xml namespace = "http://purl.org/net/xbiblio/csl"; with({});
    //
    // Oh, okay, I get it.  The syntax does not lend itself to parameterization,
    // but one of the elements is a variable, so it can be set before
    // the call.  Jeez but this feels ugly.  Does work, though.
    //
    if (namespace) {
        var ns = new Namespace(this.namespace[namespace]);
        var ret = myxml.@ns::[name].toString();
    } else {
        if (name) {
            var ret = myxml.attribute(name).toString();
        } else {
            var ret = myxml.toString();
        }
    }
    return ret;
}

CSL_E4X.prototype.getNodeValue = function (myxml,name) {
    var xml;
    default xml namespace = "http://purl.org/net/xbiblio/csl"; with({});
    if (name){
        return myxml[name].toString();
    } else {
        return myxml.toString();
    }
}

CSL_E4X.prototype.setAttributeOnNodeIdentifiedByNameAttribute = function (myxml,nodename,attrname,attr,val) {
    var xml;
    default xml namespace = "http://purl.org/net/xbiblio/csl"; with({});
    if (attr[0] != '@'){
        attr = '@'+attr;
    }
    myxml[nodename].(@name == attrname)[0][attr] = val;
}

CSL_E4X.prototype.deleteNodeByNameAttribute = function (myxml,val) {
    delete myxml.*.(@name==val)[0];
}

CSL_E4X.prototype.deleteAttribute = function (myxml,attr) {
    delete myxml["@"+attr];
}

CSL_E4X.prototype.setAttribute = function (myxml,attr,val) {
    myxml['@'+attr] = val;
}

CSL_E4X.prototype.nodeCopy = function (myxml) {
    return myxml.copy();
}

CSL_E4X.prototype.getNodesByName = function (myxml,name,nameattrval) {
    var xml, ret;
    default xml namespace = "http://purl.org/net/xbiblio/csl"; with({});
    ret = myxml.descendants(name);
    if (nameattrval){
        ret = ret.(@name == nameattrval);
    }
    return ret;
}

CSL_E4X.prototype.nodeNameIs = function (myxml,name) {
    var xml;
    default xml namespace = "http://purl.org/net/xbiblio/csl"; with({});
    if (myxml.localName() && myxml.localName().toString() == name){
        return true;
    }
    return false;
}

CSL_E4X.prototype.makeXml = function (myxml) {
    var xml;
    // Reset to XML defaults before plunging into E4X.
    // Per https://www.zotero.org/trac/ticket/1780
    XML.ignoreComments = true;
    XML.ignoreProcessingInstructions = true;
     XML.ignoreWhitespace = true;
    XML.prettyPrinting = true;
    XML.prettyIndent = 2;
    
    if ("xml" == typeof myxml){
        // print("forcing serialization of xml to fix up namespacing");
        myxml = myxml.toXMLString();
    };
    default xml namespace = "http://purl.org/net/xbiblio/csl"; with({});
    xml = new Namespace("http://www.w3.org/XML/1998/namespace");
    if (myxml){
        // print("deserializing xml");
        myxml = myxml.replace(/\s*<\?[^>]*\?>\s*\n*/g, "");
        myxml = new XML(myxml);
    } else {
        // print("no xml");
        myxml = new XML();
    }
    return myxml;
};

CSL_E4X.prototype.insertChildNodeAfter = function (parent,node,pos,datexml) {
    var myxml, xml;
    default xml namespace = "http://purl.org/net/xbiblio/csl"; with({});
    myxml = XML(datexml.toXMLString());
    parent.insertChildAfter(node,myxml);
    delete parent.*[pos];
    return parent;
};

CSL_E4X.prototype.insertPublisherAndPlace = function(myxml) {
    default xml namespace = "http://purl.org/net/xbiblio/csl"; with({});
    for each (var node in myxml..group) {
            if (node.children().length() === 2) {
                var twovars = [];
                for each (var child in node.children()) {
                        if (child.children().length() === 0
) {
                            twovars.push(child.@variable.toString());
                            if (child.@suffix.toString()
                                || child.@prefix.toString()) {
                                
                                twovars = [];
                                break;
                            }

                        }
                    }
                if (twovars.indexOf("publisher") > -1 && twovars.indexOf("publisher-place") > -1) {
                    node["@has-publisher-and-publisher-place"] = "true";
                }
            }
        }
};

CSL_E4X.prototype.addMissingNameNodes = function(myxml) {
    default xml namespace = "http://purl.org/net/xbiblio/csl"; with({});
    for each (node in myxml..names) {
        if ("xml" == typeof node && node.parent().localName() !== "substitute" && node.elements("name").length() === 0) {
            var name = <name/>;
            node.appendChild(name);
        }
    }
};

CSL_E4X.prototype.addInstitutionNodes = function(myxml) {
    var institution_long, institution_short, name_part, children, node, xml;
    default xml namespace = "http://purl.org/net/xbiblio/csl"; with({});
    //institution_short = <institution
    //    institution-parts="long"
    //    delimiter=", "
    //    substitute-use-first="1"
    //    use-last="1"/>;
    for each (node in myxml..names) {
        //print("names");
        if ("xml" == typeof node && node.elements("name").length() > 0) {
            if (node.institution.length() === 0) {
                //print("adding node");
                institution_long = <institution
                    institution-parts="long"
                    substitute-use-first="1"
                    use-last="1"/>
                institution_part = <institution-part name="long"/>;
                node.name += institution_long;
                node.institution.@delimiter = node.name.@delimiter.toString();
                if (node.name.@and.toString()) {
                    node.institution.@and = "text";
                }

                node.institution[0].appendChild(institution_part);
                for each (var attr in CSL.INSTITUTION_KEYS) {
                    if (node.name.@[attr].toString()) {
                        node.institution['institution-part'][0].@[attr] = node.name.@[attr].toString();
                    }
                }
                for each (var namepartnode in node.name['name-part']) {
                       if (namepartnode.@name.toString() === 'family') {
                        for each (var attr in CSL.INSTITUTION_KEYS) {
                            if (namepartnode.@[attr].toString()) {
                                node.institution['institution-part'][0].@[attr] = namepartnode.@[attr].toString();
                            }
                        }
                       }
                }
            }
        }
    }
};

CSL_E4X.prototype.flagDateMacros = function(myxml) {
    default xml namespace = "http://purl.org/net/xbiblio/csl"; with({});
    for each (node in myxml..macro) {
        if (node..date.length()) {
            node.@['macro-has-date'] = 'true';
        }
    }
};
