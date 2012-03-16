/**
 * ProcessAndExportForTranslation
 *
 * Takes an FLA as input and generates an XML file containing the text content ready for
 * translation. Static TextFields in a properly prepared FLA should each be wrapped in a MovieClip
 * named "tf1", "tf2" ... "tfn" in the library. The "tfn" library name becomes the text contents ID
 * in the XML file.
 * 
 * If any static TextFields are found in the FLA placed directly on the root timeline or on a
 * keyframe in a arbitrary MovieClip then this script will dynamically wrap such TextFields in an
 * appropriately named MovieClip before generating the XML. Dynamic and input TextFields are not
 * supported.
 *
 * Config values are dynamically written in by the system executing the script, or filled with
 * sensible default values if left empty.
 *
 * The processed FLA and XML are then saved to the file paths specified in the config.
 *
 * @author JedR, Seisaku Ltd <jed@seisaku.co.uk>
 */

// Init

var config =
{
	lang : "en_GB", // Language code to add to XML file
	jobID : "001", // PHP's job ID, use to match log entries to jobs
	logToFile : true, // Whether to log to a file
	logToIDE : true, // Whether to log to the IDE's output panel
	logFilePath : "", // Log file path
	lockFilePath : "", // Lock file path
	targetFLAFilePath : "", // Master FLA file path
	outputXMLFilePath : "", // XML file path to write
	outputFLAFilePath : "", // FLA file path to write
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
if ( config.targetFLAFilePath == "" ) config.targetFLAFilePath = scriptDir+"test.fla";

// Lock it

FLfile.write(config.lockFilePath,new Date().toString());

// Load modules

fl.runScript(config.libDir+"Utils.jsfl");
fl.runScript(config.libDir+"Logger.jsfl");
fl.runScript(fl.configURI+"JavaScript/ObjectFindAndSelect.jsfl");

// Set more defaults if not supplied by PHP:

var guid = Utils.guid();

if ( config.outputXMLFilePath === "" ) config.outputXMLFilePath = scriptDir+"output/"+guid+".xml";
if ( config.outputFLAFilePath === "" ) config.outputFLAFilePath = scriptDir+"output/"+guid+".fla";

// Define functions

/**
 * Initialise the Logger and print out config values.
 *
 * returns void.
 */
function initLogger()
{
	Logger.init(config.logToFile,config.logToIDE,config.logFilePath,config.jobID,scriptName);

	Logger.log("Script starting ...");

	var configString = "";

	for ( var i in config )
	{
		configString += "  "+i+" : "+config[i]+"\n";
	}

	configString = configString.slice(0,configString.length-2);

	Logger.log("Using config:\n"+configString);
}

/**
 * Attempts to load target FLA.
 *
 * returns boolean success value.
 */
function loadFLA()
{
	if ( !FLfile.exists(config.targetFLAFilePath) )
	{
		Logger.log("Error, target FLA not found",Logger.CRITICAL);

		return false;
	}
	else
	{
		doc = fl.openDocument(config.targetFLAFilePath);

		return true;
	}
}

/**
 * Process an FLA for translation. This involves parsing the contents of FLA for translatable
 * static TextFields, wrapping them in a MovieClip if required and returning the data collection
 * as an Array suitable for converting to XML.
 *
 * returns Array.
 */
function processForTranslation()
{
	var data = [];
	var validItems = [];
	var invalidItems = [];
	var lib = doc.library;
	var tfs = fl.findObjectInDocByType(Utils.TEXTFIELD_TIMELINE_ELEMENT,doc);
	var i;

	Logger.log("Found "+tfs.length+" TextField candidates for translation in the FLA");

	// Loop through all TextFields in the document.

	for ( i=0; i<tfs.length; i++ )
	{
		var o = tfs[i];

		var tfElement = o.obj;
		var parent = o.parent;
		var frameIndex = o.keyframe.startFrame;

		// Skip any dynamic or input TextFields, these are not supported.

		if ( tfElement.textType == Utils.INPUT_TEXTFIELD || tfElement.textType == Utils.DYNAMIC_TEXTFIELD )
		{
			Logger.log("Warning "+tfElement.textType+" TextField found, skipping ...",Logger.WARNING);

			continue;
		}

		if ( parent === undefined )
		{
			// Parent is undefined, therefore TextField is directly on the main timeline and is not
			// nested in a parent symbol.

			invalidItems.push({element:tfElement,parent:parent,frameIndex:frameIndex});
		}
		else
		{
			var parentPathName = parent.obj.libraryItem.name;
			
			if ( Utils.isTranslatableMovieClip(parent.obj.libraryItem,lib) )
			{
				validItems.push({element:tfElement,parent:parent,frameIndex:frameIndex});
			}
			else
			{
				invalidItems.push({element:tfElement,parent:parent,frameIndex:frameIndex});
			}
		}
	}

	if ( validItems.length > 0 ) Logger.log(validItems.length+" TextFields were wrapped in properly formatted MovieClips");
	if ( invalidItems.length > 0 ) Logger.log(invalidItems.length+" TextFields found were either on the root timeline or in improperly formatted MovieClips");

	Utils.addValidTFElementsToData(data,validItems);

	var idNum = Utils.getNextID(data);

	for ( i=0; i<invalidItems.length; i++ )
	{
		do
		{
			idNum++;
		}
		while ( Utils.isItemInLib("tf"+idNum,lib) )

		Utils.fixInvalidItem(invalidItems[i],lib,doc,"tf"+idNum);
	}
	
	Utils.addValidTFElementsToData(data,invalidItems);

	return data;
}

/**
 * Generate an E4X XML object from a data array in the format returned from the
 * processForTranslation method.
 *
 * @param Data array from processForTranslation.
 *
 * returns XML object.
 */
function createXML(p_data)
{
	var xml = <root></root>;

	xml.@lang = config.lang;
	xml.appendChild(<items></items>);

	var items = xml.items;

	for ( var i=0; i<p_data.length; i++ )
	{
		var item = <item></item>;

		item.appendChild(p_data[i].text);

		item.@id = p_data[i].id;
		item.@font = p_data[i].font;
		item.@size = p_data[i].size;
		item.@bold = p_data[i].bold;
		item.@italic = p_data[i].italic;

		items.appendChild(item);
	}

	return xml;
}

function process()
{
	var xml;
	var data;

	var flaLoaded = loadFLA();

	if ( !flaLoaded )
	{
		Logger.log("Error, can't load FLA",Logger.CRITICAL);

		return false;
	}

	try
	{
		data = processForTranslation();
	}
	catch (p_error)
	{
		Logger.log("Error processing FLA. "+p_error,Logger.CRITICAL);

		return false;
	}

	try
	{
		xml = createXML(data);
	}
	catch (p_error)
	{
		Logger.log("Error generating XML. "+p_error,Logger.CRITICAL);

		return false;
	}

	var writeError = false;

	var xmlSaved = FLfile.write(config.outputXMLFilePath,xml.toXMLString());

	if ( xmlSaved )
	{
		Logger.log("XML written to disk");
	}
	else
	{
		Logger.log("Error, can't save XML",Logger.WARNING);

		writeError = true;
	}

	var flaSaved = fl.saveDocument(doc,config.outputFLAFilePath);

	if ( flaSaved )
	{
		Logger.log("FLA written to disk");
	}
	else
	{
		Logger.log("Error, can't save FLA",Logger.WARNING);

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

// Begin

initLogger();

var success = process();

if ( success )
{
	Logger.log("Processing completed successfully");
}
else
{
	Logger.log("Processing completed with errors",Logger.WARNING);
}

FLfile.remove(config.lockFilePath);

Logger.log("Script exiting ("+((new Date().getTime()-startTime.getTime())/1000)+"s)");