// Config

var lang = "en";
var jobID = "0";
var logToFile = true;
var logToIDE = true;
var targetFLA = "";
var outputDir = "";
var outputFileName = "";
var logDir = "";

// Init vars

var startTime = new Date();

// Set paths

var scriptPath = fl.scriptURI;
var scriptPathParts = scriptPath.split("/");
var scriptName = scriptPathParts[scriptPathParts.length-1];
var scriptDir = scriptPath.split(scriptName)[0];
var libDir = scriptDir+"lib/";

if ( logDir === "" ) logDir = scriptDir+"log/";
if ( outputDir === "" ) outputDir = scriptDir+"output/";
if ( targetFLA === "" ) targetFLA = scriptDir+"test-fla/test.fla";

// Load modules

fl.runScript(libDir+"Utils.jsfl");
fl.runScript(libDir+"Logger.jsfl");

// Set output filename

if ( outputFileName === "" ) outputFileName = jobID+"-"+Utils.guid()+".xml";

// Init logger and log config values

Logger.init(logToFile,logToIDE,logDir,jobID,scriptName);

Logger.log("Script started");

Logger.log("lang="+lang);
Logger.log("jobID="+jobID);
Logger.log("logToFile="+logToFile);
Logger.log("logToIDE="+logToIDE);
Logger.log("targetFLA="+targetFLA);
Logger.log("outputDir="+outputDir);
Logger.log("outputFileName: "+outputFileName);
Logger.log("logDir="+logDir);
Logger.log("libDir="+libDir);

// Open FLA

if ( fl.documents.length > 0 )
{
	fl.saveAll();
	fl.closeAll();
}

if ( !FLfile.exists(targetFLA) )
{
	Logger.log("Error, FLA \""+targetFLA+"\" does not exist",Logger.CRITICAL);
}
else
{
	// Export XML

	var dom = fl.openDocument(targetFLA);

	var translationData = Utils.getTranslationDataByLib(dom.library);

	Logger.log("Found "+translationData.length+" translatable MovieClips in the current FLA");

	var xml = Utils.convertTranslationDataToXML(translationData,lang);

	Utils.saveXML(xml,outputDir,outputFileName);
}

// Exit

if ( fl.documents.length > 0 )
{
	fl.saveAll();
	fl.closeAll();
}

var scriptTime = (new Date().getTime()-startTime.getTime())/1000;

Logger.log("Exiting script ("+scriptTime+"s)");