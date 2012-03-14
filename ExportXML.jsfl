// Config

var lang = "en";
var outputDir = "file:///Users/jedrichards/Documents/work/hogarth/automation";
var logDir = "file:///Users/jedrichards/Documents/work/hogarth/automation";
var logToFile = true;
var logToIDE = true;
var libDir = fl.configURI+"Commands/HogarthAutomation/lib/"
var scriptURI = fl.scriptURI;
var scriptURIParts = scriptURI.split("/");
var scriptName = scriptURIParts[scriptURIParts.length-1].split(".")[0];
var processID = "0";

// Load modules

fl.runScript(libDir+"Logger.jsfl");

// Init modules

Logger.init(logToFile,logToIDE,logDir,processID,scriptName);
Logger.log("Script started")



//fl.outputPanel.trace(Logging);

//eval(FLfile.read(scriptDir+"lib/logging.jsfl"));

//Logging.logToFlashIDE("hello world");

//fl.outputPanel.t~race(scriptDir);

//fl.outputPanel.trace(FLfile.exists(scriptDir));

// Setup logging

//fl.outputPanel.clear();

/*logCodes =
{
	CRITICAL : "[CRITICAL_ERROR]",
	WARNING : "[WARNING]",
	SYSTEM : "[SYSTEM]"
}*/
//var log = fl.outputPanel.trace;

//fl.

// Init

//var dom = fl.getDocumentDOM();
//var lib = dom.library;
//var xml = eval(FLfile.read("file:///Users/jedrichards/Library/Application\ Support/Adobe/Flash\ CS5.5/en_US/Configuration/Commands/translations.xml"));

// Loop through library

//var itemArray = lib.items;

//for ( var i=0; i<itemArray.length; i++ )
//{
	//var item = itemArray[i];
	//var node = xml.*.(@id==item.name);
	//var translation = node;
	//var font = node.@font;

	//log(item.name);

	//if ( translation != null )
	//{
		//for ( var k in item )
		//log("tl: "+item.timeline);
		
		//log(tl === null );

		//if ( tl )
		//{
			//var tf = tl.layers[0].frames[0].elements[0];
		
			//log(tf.elementType);
		//}

		

		//tf.setTextAttr("face",font);
		//tf.setTextString(translation);

		//tf.setTextAttr("face","Georgia");
		//tf.setTextString("Hello world!");
	//}

	

	//var tfArray = getTranslatableTextFields();
//}

//log(isValidTranslatablePathName("tf11"));
//log(isValidTranslatablePathName("foobar"));
//log(isValidTranslatablePathName("foobar"));
//log(isValidTranslatablePathName("foobar/tf1245345"));
//log(isValidTranslatablePathName("MyFolder/tf2"));
//log(isValidTranslatablePathName("MyFolder/tf2/tf88"));

/*function getTranslatableTextFields()
{
	var data = [];
	var lib = fl.getDocumentDOM().library;
	var libItems = lib.items;
	var numLibItems = libItems.length;

	for ( var i=0; i<numLibItems; i++ )
	{
		var libItem = libItems[i];
		var namePath = libItem.name;
		var type = lib.getItemType(namePath);

		if ( type != "movie clip")
		{
			continue;
		}

		var tl = libItem.timeline;

		if ( tl.layers.length > 1 )
		{
			continue;
		}

		if ( tl.layers[0].frames.length > 1 )
		{
			continue;
		}

		if ( tl.layers[0].frames[0].elements.length > 1 )
		{
			continue;
		}

		var element = tl.layers[0].frames[0].elements[0];



		log(libItem.name+" "+lib.getItemType(libItem.name));
	}

	return data;
}*/

/*function getItemTranslationID(p_pathName)
{
	if ( isValidTranslatablePathName(p_pathName) )
	{
		var pathParts = p_pathName.split("/");
	
		return pathParts[pathParts.length-1];
	}
	else
	{

	}
}*/

/*function isValidTranslatablePathName(p_pathName)
{
	if ( p_pathName == null || p_pathName == "" || p_pathName == undefined )
	{
		return false;
	}

	var pathParts = p_pathName.split("/");
	var itemName = pathParts[pathParts.length-1];

	var nameParts = itemName.split("tf");

	if ( nameParts.length != 2 )
	{
		return false;
	}

	var tfNum = nameParts[1];

	if ( isNaN(tfNum) )
	{
		return false;
	}

	return true;
}*/

/*function exportXML(p_fileName,p_lang)
{

}*/