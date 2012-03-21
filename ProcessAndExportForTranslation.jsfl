/**
 * ProcessAndExportForTranslation
 *
 * Takes an FLA as input and generates an XML file containing the text content ready for
 * translation. Static TextFields in a properly prepared FLA should each be wrapped in a MovieClip
 * named "tf1", "tf2" ... "tfn" in the library. The "tfn" library name becomes the text content's ID
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
 * TODO:
 *
 * - Process should be first fix invalid TextFields *then* compile a list of fields to translate
 *   rather than both these operations happening in the same function.
 * - IDs should be added to the XML in numerical order.
 * - Check for next available ID in FLA with while loop?
 * - Handle dynamic/input TextFields more gracefully.
 * - At the moment MovieClips in the library with a zero use count are ignored even if they
 *   are being exported for ActionScript.
 * - Test with lots of banners from the wild.
 * - Lock file should only be deleted by JSFL not created.
 * - Tidying unused MovieClips not working?
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
	flaFilePath : "", // Master FLA file path
	outputXMLFilePath : "", // XML file path to write
	outputFLAFilePath : "", // FLA file path to write
	outputSWFFilePath : "", // SWF file path to write
	libDir : "" // Static JSFL library directory
}

var startTime = new Date();
var scriptPath = fl.scriptURI;
var scriptPathParts = scriptPath.split("/");
var scriptName = scriptPathParts[scriptPathParts.length-1];
var scriptDir = scriptPath.split(scriptName)[0];

// Set defaults if not supplied by PHP:

if ( config.logFilePath == "" ) config.logFilePath = scriptDir+"log";
if ( config.lockFilePath == "" ) config.lockFilePath = scriptDir+"lock";
if ( config.libDir == "" ) config.libDir = scriptDir+"lib/";
if ( config.flaFilePath == "" ) config.flaFilePath = scriptDir+"test.fla";

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
if ( config.outputSWFFilePath === "" ) config.outputSWFFilePath = scriptDir+"output/"+guid+".swf";

// Define methods

/**
 * Process an FLA for translation. This involves parsing the contents of FLA for translatable
 * static TextFields, wrapping them in a MovieClip if required and returning the data collection
 * as an Array suitable for converting to XML.
 *
 * returns Array.
 */
function doProcessAndExport(p_doc)
{
	// 1. Temporarily add MovieClips to the stage that have zero use count but are exported for AS.
	// 2. Fix TextFields that are not wrapped in a properly translatable MovieClip.
	//    - TextFields that are formatted correctly but just have wrong name should be renamed.
	// 3. Sweep FLA again, adding all formatted wrapped TextFields to a master array.
	// 4. Remove temporarily added MovieClips

	var data = [];
	var library = p_doc.library;
	var i;

	// Add to the root timeline any unused symbols that are exported for ActionScript to make sure
	// we include them in our processing. We'll delete this temporary layer later:

	library.editItem(p_doc);

	var rootTimeine = p_doc.getTimeline();
	var tempLayerName = Utils.guid();
	var tempLayerIndex = rootTimeine.addNewLayer(tempLayerName)
	var tempLayer = rootTimeine.layers[tempLayerIndex];
	
	var unUsedSymbols = Utils.getAllUnusedExportedSymbols(p_doc);

	for ( i=0; i<unUsedSymbols.length; i++ )
	{
		p_doc.addItem({x:0,y:0},unUsedSymbols[i]);
	}

	if ( unUsedSymbols.length > 0 )
	{
		Logger.log("Temporarily added "+unUsedSymbols.length+" unused but exported for AS library items to the timeline temporarily");
	}

	// Find all static TextFields. Analyse them to see if they're in the correct translatable format
	// and if required fix them (wrap them in a MovieClip):

	var staticTextFields = Utils.getAllStaticTextFields(p_doc);
	var validCount = 0;
	var invalidCount = 0;

	Logger.log("Found "+staticTextFields.length+" static TextFields in the FLA");

	for ( i=0; i<staticTextFields.length; i++ )
	{
		var tfObj = staticTextFields[i];

		if ( tfObj.parent === undefined )
		{
			invalidCount++;

			fixInvalidTextFieldObject(tfObj,p_doc,getNextAvailableTextFieldName(library));
		}
		else
		{
			if ( !Utils.isTranslatableMovieClip(tfObj.parent.obj.libraryItem,library) )
			{
				invalidCount++;

				fixInvalidTextFieldObject(tfObj,p_doc,getNextAvailableTextFieldName(library));
			}
			else
			{
				validCount++;
			}
		}
	}

	return data;

	/*
	var data = [];
	var validItems = [];
	var invalidItems = [];
	var lib = p_doc.library;
	var results = fl.findObjectInDocByType(Utils.TEXTFIELD_TIMELINE_ELEMENT,p_doc);
	var i;

	Logger.log("Found "+results.length+" TextField candidates for translation in the FLA");

	// Loop through all TextField elements found in the document.

	for ( i=0; i<results.length; i++ )
	{
		var o = results[i];

		var element = o.obj;
		var parent = o.parent;

		// Skip any dynamic or input TextFields, these are not supported.

		if ( element.textType != Utils.STATIC_TEXTFIELD )
		{
			Logger.log("Warning "+element.textType+" TextField found, skipping ...",Logger.WARNING);

			continue;
		}

		if ( parent === undefined )
		{
			// Parent is undefined, therefore TextField is directly on the main timeline and is not
			// nested in a parent symbol.

			invalidItems.push(o);
		}
		else
		{
			var parentPathName = parent.obj.libraryItem.name;
			
			if ( Utils.isTranslatableMovieClip(parent.obj.libraryItem,lib) )
			{
				validItems.push(o);
			}
			else
			{
				invalidItems.push(o);
			}
		}
	}

	if ( validItems.length > 0 ) Logger.log(validItems.length+" TextFields were wrapped in properly formatted MovieClips");
	if ( invalidItems.length > 0 ) Logger.log(invalidItems.length+" TextFields found were either on the root timeline or in improperly formatted MovieClips");

	pushTranslationObjects(data,validItems);

	if ( invalidItems.length > 0 )
	{
		Logger.log("Wrapping invalid TextFields in MovieClips ...");
		
		var idNum = getNextID(data);

		for ( i=0; i<invalidItems.length; i++ )
		{
			do
			{
				idNum++;
			}
			while ( Utils.isItemInLib("tf"+idNum,lib) )

			fixInvalidItem(invalidItems[i],lib,p_doc,"tf"+idNum);
		}
		
		pushTranslationObjects(data,invalidItems);
	}

	return data;
	*/
}

/**
 * Parses the interim arrays generated by the processForTranslation method and pushes
 * translation data objects onto the supplied master array.
 *
 * @param p_data Master array being built by processForTranslation.
 * @param p_tfObjects Generic TextField Object array (as generated by fl.findObjectInDocByType).
 *
 * returns Void;
 */
function pushTranslationObjects(p_data,p_tfObjects)
{
	for ( var i=0; i<p_tfObjects.length; i++ )
	{
		var tfObject = p_tfObjects[i];
		var element  = tfObject.obj;
		var parent = tfObject.parent;

		var namePath = parent.obj === undefined ? parent.name : parent.obj.libraryItem.name;

		var translationObj =
		{
			id : Utils.getIDByLibPathName(namePath),
			text : element.getTextString(),
			font : element.getTextAttr("face"),
			size : element.getTextAttr("size"),
			bold : element.getTextAttr("bold"),
			italic : element.getTextAttr("italic")
		}

		p_data.push(translationObj);
	}
}

/**
 * Generate an E4X XML object from a data array in the format returned from the
 * doProcessAndExport method.
 *
 * @param Data array from doProcessAndExport.
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

function getNextAvailableTextFieldName(p_library)
{
	var num = 1;

	while ( Utils.isItemInLib("tf"+num,p_library) )
	{
		num++;
	}

	return "tf"+num;
}

/**
 * Where a static TextField is found on a timeline and not wrapped in a translatable MovieClip
 * this method will attempt to dyncamically create a MovieClip and reparent the TextField into it.
 *
 * @param p_tfObj Generic TextField object as generated by fl.findObjectsByType.
 * @param p_doc Reference to the current FLA document being worked on.
 * @param p_id The desired ID of the new translatable MovieClip in the format "tfn".
 *
 * returns Void.
 */
function fixInvalidTextFieldObject(p_tfObj,p_doc,p_id)
{
	var library = p_doc.library;
	var element  = p_tfObj.obj;
	var parent = p_tfObj.parent;

	if ( parent === undefined )
	{
		library.editItem(p_doc);
	}
	else
	{
		library.editItem(parent.obj.libraryItem.name);
	}
	
	p_doc.selectNone();
	p_doc.getTimeline().currentFrame = p_tfObj.keyframe.startFrame;
	element.selected = true;

	var newMC = p_doc.convertToSymbol("movie clip",p_id,"top left");

	p_tfObj.parent = newMC;
}

/**
 * Main processing function for this JSFL script. Calls the various utility methods and reports
 * errors.
 *
 * returns Boolean indicating success or failure.
 */
function go()
{
	var xml;
	var data;
	var doc;

	doc = Utils.loadFLA(config.flaFilePath);

	if ( !doc )
	{
		return false;
	}

	Utils.tidyLibrary(doc.library,doc);

	try
	{
		data = doProcessAndExport(doc);
	}
	catch (p_error)
	{
		Logger.log("Error processing FLA. "+p_error,Logger.CRITICAL);

		return false;
	}

	Utils.tidyLibrary(doc.library,doc);

	Logger.log("Generated "+data.length+" items for translation, converting to XML ...");

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
	Logger.log("Errors encountered, operation failed",Logger.WARNING);
}

// Unlock and exit

Logger.log("Script exiting ("+((new Date().getTime()-startTime.getTime())/1000)+"s)");
FLfile.remove(config.lockFilePath);