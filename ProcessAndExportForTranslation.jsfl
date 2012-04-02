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
 * If the outputFormattedText config value is set to true the script will attempt to parse the style
 * information into HTML tags for inclusion in the XML in CDATA section, or if set to false the text
 * content is outputted as raw strings.
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
	flaFilePath : "", // Master FLA file path
	outputXMLFilePath : "", // XML file path to write
	outputFLAFilePath : "", // FLA file path to write
	outputSWFFilePath : "", // SWF file path to write
	outputFormattedText : true, // Output the text in the XML with formatting or else raw strings.
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
if ( config.flaFilePath == "" ) config.flaFilePath = scriptDir+"test-files/process-test.fla";

// Lock it

FLfile.write(config.lockFilePath,new Date().toString());

// Load modules

fl.runScript(config.libDir+"Utils.jsfl");
fl.runScript(config.libDir+"Logger.jsfl");
fl.runScript(config.libDir+"HTMLParser.jsfl");
fl.runScript(config.libDir+"Processor.jsfl");
fl.runScript(fl.configURI+"JavaScript/ObjectFindAndSelect.jsfl");

// Set more defaults if not supplied by PHP:

var guid = Utils.guid();

if ( config.outputXMLFilePath === "" ) config.outputXMLFilePath = scriptDir+"output/"+guid+".xml";
if ( config.outputFLAFilePath === "" ) config.outputFLAFilePath = scriptDir+"output/"+guid+".fla";
if ( config.outputSWFFilePath === "" ) config.outputSWFFilePath = scriptDir+"output/"+guid+".swf";

// Start

Utils.initLogger(config,scriptName);

var success = Processor.go(config.flaFilePath,config,true);

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