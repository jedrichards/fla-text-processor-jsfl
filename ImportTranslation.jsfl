/**
 * ImportTranslation
 *
 * Attempts to import the contents of a translated XML file into a FLA.
 *
 * TODO:
 *
 * - At the moment MovieClips in the library with a zero use count are ignored even if they
 *   are being exported for ActionScript.
 *
 * @author JedR, Seisaku Ltd <jed@seisaku.co.uk>
 */

 // Init

var config =
{
	jobID : "001", // PHP's job ID, use to match log entries to jobs
	logToFile : true, // Whether to log to a file
	logToIDE : true, // Whether to log to the IDE's output panel
	logFilePath : "", // Log file path
	lockFilePath : "", // Lock file path
	flaFilePath : "", // Master FLA file path
	outputFLAFilePath : "", // FLA file path to write
	outputSWFFilePath : "", // SWF file path to write
	xmlFilePath : "", // XML file path to import
	libDir : "" // Static JSFL library directory
}

var startTime = new Date();
var scriptPath = fl.scriptURI;
var scriptPathParts = scriptPath.split("/");
var scriptName = scriptPathParts[scriptPathParts.length-1];
var scriptDir = scriptPath.split(scriptName)[0];
var doc;

// Set defaults if not supplied by PHP:

if ( config.logFilePath == "" ) config.logFilePath = scriptDir+"log";
if ( config.lockFilePath == "" ) config.lockFilePath = scriptDir+"lock";
if ( config.libDir == "" ) config.libDir = scriptDir+"lib/";
if ( config.flaFilePath == "" ) config.flaFilePath = scriptDir+"import-test.fla";
if ( config.xmlFilePath == "" ) config.xmlFilePath = scriptDir+"test.xml";


// Lock it

FLfile.write(config.lockFilePath,new Date().toString());

// Load modules

fl.runScript(config.libDir+"Utils.jsfl");
fl.runScript(config.libDir+"Logger.jsfl");
fl.runScript(fl.configURI+"JavaScript/ObjectFindAndSelect.jsfl");

// Set more defaults if not supplied by PHP:

var guid = Utils.guid();

if ( config.outputFLAFilePath === "" ) config.outputFLAFilePath = scriptDir+"output/"+guid+".fla";
if ( config.outputSWFFilePath === "" ) config.outputSWFFilePath = scriptDir+"output/"+guid+".swf";

// Define methods

/**
 * Imports translation data into the FLA.
 *
 * @param p_textFields Array of valid translatable TextField generic objects.
 * @param p_translationData Generic object containing all the translation data.
 *
 * returns Boolean value indicating success or failure.
 */
function importData(p_textFields,p_translationData)
{
	var success = true;

	if ( p_textFields.length == 0 || p_translationData.items.length == 0 )
	{
		success = false;
	}

	if ( p_textFields.length != p_translationData.items.length )
	{
		Logger.log("Warning, mismatch between number of translatable TextFields in the FLA and in the XML.");

		success = false;
	}

	for ( var i=0; i<p_translationData.items.length; i++ )
	{
		var translationObj = p_translationData.items[i];
		var tfObj;

		for ( var j=0; j<p_textFields.length; j++ )
		{
			if ( p_textFields[j].id == translationObj.id )
			{
				tfObj = p_textFields[j];

				break;
			}
		}

		if ( tfObj )
		{
			applyTranslationToTextField(translationObj,tfObj);
		}
		else
		{
			Logger.log("Warning, no TextField found for XML id \""+translationObj.id+"\"");

			success = false;
		}
	}

	Logger.log("Applied "+p_translationData.items.length+" translations onto "+p_textFields.length+" TextFields");

	return success;
}

/**
 * Applies translation data to a TextField.
 *
 * @param p_translationObj Generic object containing XML derived translation data for a single item.
 * @param p_tfObj Generic TextField object of the type returned by fl.getObjectsByType.
 *
 * returns Void.
 */
function applyTranslationToTextField(p_translationObj,p_tfObj)
{
	p_tfObj.obj.setTextString(p_translationObj.text);
}

/**
 * Parse the E4X XML object into generic JavaScript objects.
 *
 * @param XML object to parse.
 *
 * returns Object.
 */
function parseXML(p_xml)
{
	var o = {};

	o.lang = p_xml.@lang;

	Logger.log("XML has country code "+o.lang);

	o.items = [];

	var items = p_xml.items..item;

	Logger.log("Found "+items.length()+" translation items in the XML");

	for ( var i=0; i<items.length(); i++ )
	{
		var item = items[i];

		o.items.push
		(
			{
				id : item.@id,
				font : item.@font,
				size : item.@size,
				bold : item.@bold,
				italic : item.@italic,
				text : item.toString()
			}
		);
	}

	return o;
}

/**
 * Main processing function for this JSFL script. Calls the various utility methods and reports
 * errors.
 *
 * returns Boolean indicating success or failure.
 */
function go()
{
	var textFields;
	var xml;
	var translationData;

	var flaSaved = false;
	var writeError = false;

	doc = Utils.loadFLA(config.flaFilePath);

	if ( !doc )
	{
		return false;
	}

	try
	{
		textFields = Utils.getAllTranslatableTextFields(doc);
	}
	catch (p_error)
	{
		Logger.log("Error gathering translatable TextFields from FLA. "+p_error,Logger.CRITICAL);

		return false;
	}

	Logger.log("Found "+textFields.length+" translatable TextFields in the FLA");

	if ( textFields.length == 0 )
	{
		Logger.log("No translatable TextFields found in the FLA",Logger.CRITICAL);

		return false;
	}

	xml = Utils.loadXML(config.xmlFilePath);

	if ( !xml )
	{
		return false;
	}

	try
	{
		translationData = parseXML(xml);
	}
	catch (p_error)
	{
		Logger.log("Error parsing the XML for translation data. "+p_error);
	}

	if ( translationData.items.length == 0 )
	{
		Logger.log("No translation data found in the XML",Logger.CRITICAL);

		return false;
	}

	try
	{
		importData(textFields,translationData);
	}
	catch (p_error)
	{
		Logger.log("Error importing translation data into FLA. "+p_error,Logger.WARNING);

		return false;
	}

	flaSaved = fl.saveDocument(doc,config.outputFLAFilePath);

	if ( flaSaved )
	{
		Logger.log("FLA written to disk");
	}
	else
	{
		Logger.log("Error, can't save FLA",Logger.WARNING);

		writeError = true;
	}

	var swfSaved = Utils.exportSWF(config.outputSWFFilePath,doc);

	if ( swfSaved )
	{
		Logger.log("SWF written to disk");
	}
	else
	{
		Logger.log("Error, can't save SWF",Logger.WARNING);

		writeError = true;
	}

	fl.closeAll(false);

	if ( writeError )
	{
		return false;
	}
	else
	{
		return true;
	}
}

// Start

Utils.initLogger(config,scriptName);

var success = go();

if ( success )
{
	Logger.log("Processing completed successfully");
}
else
{
	Logger.log("Errors encountered, operation may have failed",Logger.CRITICAL);
}

// Unlock and exit

Logger.log("Script exiting ("+((new Date().getTime()-startTime.getTime())/1000)+"s)");
FLfile.remove(config.lockFilePath);