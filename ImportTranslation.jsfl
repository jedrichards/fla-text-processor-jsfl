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
if ( config.flaFilePath == "" ) config.flaFilePath = scriptDir+"test.fla";
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

// Define methods

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
 * Main processing function for this JSFL script. Calls the various utility methods and reports
 * errors.
 *
 * returns Boolean indicating success or failure.
 */
function process()
{
	doc = Utils.loadFLA(config.flaFilePath);

	if ( !doc )
	{
		return false;
	}

	var translatableTextFields = Utils.getAllTranslatableTextFields(doc);

	Logger.log("Found "+translatableTextFields.length+" translatable TextFields in the FLA")

	var flaSaved = fl.saveDocument(doc,config.outputFLAFilePath);

	if ( flaSaved )
	{
		Logger.log("FLA written to disk");
	}
	else
	{
		Logger.log("Error, can't save FLA",Logger.WARNING);

		return false;
	}

	fl.closeAll(false);

	return true;
}

// Start

initLogger();

var success = process();

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