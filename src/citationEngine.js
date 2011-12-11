var citationEngine = {

formatCitations: function (style, documents, citationClusters) {
	jsonDocuments = documents;

	var result = {"statusMessage":"", "formattedCitations":[], "formattedBibliography":""};

	result.statusMessage = "";

	try
	{
		var sys = new Sys(abbreviations);
		var citeproc = new CSL.Engine(sys, style);
	}
	catch(err)
	{
		result.statusMessage = "Citeproc initialisation exception: " + err;
		return result;
	}
	
	var inLineCitations = "";
	var inLineCitationArray = new Array();
	
	for (var cluster=0; cluster<citationClusters.length; cluster++)
	{
		try
		{
			var citations = citeproc.appendCitationCluster(citationClusters[cluster],false);
		}
		catch(err)
		{
			result.statusMessage = "Citeproc exception: " + err;
			return result;
		}
		
		for (var i = 0; i < citations.length; i++)
		{
			var pos = citations[i][0];
			
			if (inLineCitations != "")
			{
				inLineCitations += "<br>";
			}
			
			inLineCitations += citations[i][1];
			inLineCitationArray.push(citations[i][1]);
		}
	}
	result.formattedCitations = inLineCitationArray;
	
	var makeBibliographyArgument;
	
	var enumerateCitations = true;
	if (enumerateCitations == true)
	{
		makeBibliographyArgument = undefined;
	}
	else
	{
		makeBibliographyArgument = "citation-number";
	}
	
	try
	{
		var bibliography = citeproc.makeBibliography(makeBibliographyArgument);
	}
	catch(err)
	{
		result.statusMessage = "Citeproc exception: " + err;
		return result;
	}

	var hangingindent = false;
	var has_bibliography = (bibliography !== false);

	if (has_bibliography)
	{
		hangingindent = (bibliography[0].hangingindent != 0 && "undefined" !== typeof(bibliography[0].hangingindent));
		bibliography = bibliography[1];
	}
	else
	{
		bibliography = [[(citations[0][1])]];
	}

	result.formattedBibliography = bibliography.join("<br>");

	return result;
}

};

