var Utils =
{
	INSTANCE_TIMELINE_ELEMENT : "instance",
	SHAPE_TIMELINE_ELEMENT : "shape",
	TEXTFIELD_TIMELINE_ELEMENT : "text",
	
	UNDEFINED_LIB_ITEM : "undefined",
	COMPONENT_LIB_ITEM : "component",
	MOVIECLIP_LIB_ITEM : "movie clip",
	GRAPHIC_LIB_ITEM : "graphic",
	BUTTON_LIB_ITEM : "button",
	FOLDER_LIB_ITEM : "folder",
	FONT_LIB_ITEM : "font",
	SOUND_LIB_ITEM : "sound",
	BITMAP_LIB_ITEM : "bitmap",
	COMPILED_CLIP_LIB_ITEM : "compiled clip",
	SCREEN_LIB_ITEM : "screen",
	VIDEO_LIB_ITEM : "video",

	STATIC_TEXTFIELD : "static",
	DYNAMIC_TEXTFIELD : "dynamic",
	INPUT_TEXTFIELD : "input",

	/**
	 * Analyses a library item's path name and determines if the path name follows the "tfn" format.
	 *
	 * @param p_pathName Library item's path name, e.g. "somefolder/textfields/tf12".
	 *
	 * returns boolean.
	 */ 
	isTranslatableLibPathName : function(p_pathName)
	{
		if ( !p_pathName || p_pathName === "" )
		{
			return false;
		}

		var pathParts = p_pathName.split("/");
		var itemName = pathParts[pathParts.length-1];

		if ( itemName.indexOf("tf") != 0 )
		{
			return false;
		}

		var itemNameParts = itemName.split("tf");

		if ( itemNameParts.length != 2 )
		{
			return false;
		}

		var tfNum = itemNameParts[1];

		if ( isNaN(tfNum) )
		{
			return false;
		}

		return true;
	},

	/**
	 * Where a path name follows the "tfn" naming convention this function will extract the ID from
	 * a library item's path name. E.g. "somefolder/textfields/tf12" will be converted to "tf12".
	 *
	 * @param p_pathName Library item's path name, e.g. "somefolder/textfields/tf12".
	 *
	 * returns string, the translation ID or "!" if the "tfn" convention isn't followed.
	 */
	getIDByLibPathName : function(p_pathName)
	{
		if ( this.isTranslatableLibPathName(p_pathName) )
		{
			var pathParts = p_pathName.split("/");
		
			return pathParts[pathParts.length-1];
		}
		else
		{
			return "!"
		}
	},

	/**
	 * Determine if a MovieClip is a valid translatable item. To be a translatable the MovieClip's
	 * library name should follow the "tfn" format and should only contain one static TextField on
	 * one layer and in one frame.
	 *
	 * @param p_libItem Library item of type MovieClip.
	 * @param p_lib A reference to the item's associated library object.
	 *
	 * returns Boolean.
	 */
	isTranslatableMovieClip : function(p_libItem,p_lib)
	{
		var pathName = p_libItem.name;

		var type = p_lib.getItemType(pathName);
		var hasValidPathName = this.isTranslatableLibPathName(pathName);
		var id = this.getIDByLibPathName(pathName);

		if ( type != this.MOVIECLIP_LIB_ITEM )
		{
			if ( hasValidPathName ) Logger.log("Library item \""+pathName+"\" is not a MovieClip",Logger.WARNING);

			return false;
		}

		var tl = p_libItem.timeline;

		if ( tl.layers.length > 1 )
		{
			if ( hasValidPathName ) Logger.log("MovieClip library item \""+pathName+"\" has more than 1 layer",Logger.WARNING);

			return false;
		}

		if ( tl.layers[0].frames.length > 1 )
		{
			if ( hasValidPathName ) Logger.log("MovieClip library item \""+pathName+"\" has more than 1 frame",Logger.WARNING);

			return false;
		}

		if ( tl.layers[0].frames[0].elements.length == 0 )
		{
			if ( hasValidPathName ) Logger.log("MovieClip library item \""+pathName+"\" is empty",Logger.WARNING);

			return false;
		}

		if ( tl.layers[0].frames[0].elements.length > 1 )
		{
			if ( hasValidPathName ) Logger.log("MovieClip library item \""+pathName+"\" contains more than child symbol",Logger.WARNING);

			return false;
		}

		var element = tl.layers[0].frames[0].elements[0];

		if ( element.elementType != this.TEXTFIELD_TIMELINE_ELEMENT )
		{
			if ( hasValidPathName ) Logger.log("MovieClip library item \""+pathName+"\" does not contain a TextField",Logger.WARNING);

			return false;
		}

		if ( !hasValidPathName )
		{
			return false;
		}

		return true;
	},

	/**
	 * Determine if an item is present in a FLA library by passing in all or part of its name path.
	 *
	 * @param p_namePart Part or all of its name path, e.g. passing in "tf12" would still return
	 *                   true if the item was present in the library at "folder1/folder2/tf12".
	 * @param p_lib A reference to the library object to search.
	 *
	 * returns Boolean.
	 */
	isItemInLib : function(p_namePart,p_lib)
	{
		var numItems = p_lib.items.length;

		for ( var i=0; i<numItems; i++ )
		{
			var item = p_lib.items[i];

			if ( item.name.indexOf(p_namePart) > -1 )
			{
				return true;
			}
		}

		return false;
	},

	/**
	 * Tidy the library by moving library items to descriptively named folders and then removing
	 * any empty folders. MovieClips with a zero use count that aren't exported for AS are also
	 * removed.
	 *
	 * @param p_lib A reference to the library object to tidy.
	 * @param p_doc A reference to the associated FLA document.
	 *
	 * returns Void.
	 */
	tidyLibrary : function(p_lib,p_doc)
	{
		// Create folders:

		var mcFolderName = "movieclips";
		var textMCFolderName = "movieclips-text";
		var graphicsFolderName = "graphics";
		var bitmapsFolderName = "bitmaps";
		var componentsFolderName = "components";
		var buttonsFolderName = "buttons";
		var otherFolderName = "other";

		p_lib.newFolder(mcFolderName);
		p_lib.newFolder(textMCFolderName);
		p_lib.newFolder(graphicsFolderName);
		p_lib.newFolder(bitmapsFolderName);
		p_lib.newFolder(componentsFolderName);
		p_lib.newFolder(buttonsFolderName);
		p_lib.newFolder(otherFolderName);

		// Move items to folders depending on their item type:

		var i;
		var item;

		for ( i=0; i<p_lib.items.length; i++ )
		{
			item = p_lib.items[i];

			var destinationFolder;

			switch ( p_lib.getItemType(item.name) )
			{
				case this.MOVIECLIP_LIB_ITEM:
					if ( this.isTranslatableLibPathName(item.name) )
					{
						 destinationFolder = textMCFolderName;
					}
					else
					{
						destinationFolder = mcFolderName;
					}
					break;
				case this.GRAPHIC_LIB_ITEM:
					destinationFolder = graphicsFolderName;
					break;
				case this.BITMAP_LIB_ITEM:
					destinationFolder = bitmapsFolderName;
					break;
				case this.COMPONENT_LIB_ITEM:
				case this.COMPILED_CLIP_LIB_ITEM:
					destinationFolder = componentsFolderName;
					break;
				case this.BUTTON_LIB_ITEM:
					destinationFolder = buttonsFolderName;
					break;
				case this.FOLDER_LIB_ITEM:
					break;
				default:
					destinationFolder = otherFolderName;
					break;
			}

			p_lib.moveToFolder(destinationFolder,item.name,true);
		}

		// Clean up any empty folders:

		this.deleteEmptyLibFolders(p_lib);

		// Clean up any MovieClips that have a zero use count and aren't exported for AS:

		this.deleteUnusedSymbols(p_doc);
	},

	/**
	 * Deletes any unused symbols from the library.
	 *
	 * @param p_doc A reference to the document to tidy up.
	 *
	 * returns Void.
	 */
	deleteUnusedSymbols : function(p_doc)
	{
		var namesForDeletion = [];
		var i;

		for ( i=0; i<p_doc.library.items.length; i++ )
		{
			item = p_doc.library.items[i];

			var useCount = this.getUseCount(item.name,p_doc);
			var type = p_doc.library.getItemType(item.name);

			switch ( type )
			{
				case this.MOVIECLIP_LIB_ITEM:
				case this.BUTTON_LIB_ITEM:
					if ( !item.linkageExportForAS && useCount == 0 )
					{
						namesForDeletion.push(item.name);
					}
					break;
				case this.GRAPHIC_LIB_ITEM:
				case this.BITMAP_LIB_ITEM:
					if ( useCount == 0 )
					{
						namesForDeletion.push(item.name);
					}
					break;
				default:
					break;
			}
		}

		for ( i=0; i<namesForDeletion.length; i++ )
		{
			p_doc.library.deleteItem(namesForDeletion[i]);
		}
	},

	/**
	 * Step through the entire DOM of an FLA counting the number of uses of the specified library
	 * item. Why isn't this in the API?
	 *
	 * @param p_namePath Library name path of the item to search for.
	 * @param p_doc A reference to the document to search.
	 *
	 * returns Number item's use count.
	 */
	getUseCount : function(p_namePath,p_doc)
	{
		p_doc.library.editItem(p_doc);

		var timeline = p_doc.getTimeline();
		var useCount = {count:0};

		parseTimeline(p_namePath,timeline,useCount);

		function parseTimeline(p_namePath,p_timeline,p_countObj)
		{
			var layers = p_timeline.layers;
			var numLayers = layers.length;

			for ( var i=0; i<numLayers; i++ )
			{
				var layer = layers[i];

				var frames = layer.frames;
				var numFrames = layer.frames.length;

				for ( var j=0; j<numFrames; j++ )
				{
					var frame = frames[j];
					var isKeyFrame = frame.startFrame == j;

					if ( isKeyFrame )
					{
						var elements = frame.elements;
						var numElements = elements.length;

						for ( var k=0; k<numElements; k++ )
						{
							var element = elements[k];
							var elementType = element.elementType;
							var libraryItem = element.libraryItem;
							
							if ( libraryItem )
							{
								if ( libraryItem.name == p_namePath )
								{
									p_countObj.count++;
								}

								if ( libraryItem.timeline )
								{
									parseTimeline(p_namePath,libraryItem.timeline,p_countObj);
								}
							}
						}
					}
				}
			}
		}

		return useCount.count;
	},

	/**
	 * Recursively remove all empty folders from the library no matter how deeply nested.
	 *
	 * @param p_lib A reference to the library object to tidy.
	 *
	 * returns Void.
	 */
	deleteEmptyLibFolders : function(p_lib)
	{
		while ( this.libHasEmptyFolders(p_lib) )
		{
			for ( var i=0; i<p_lib.items.length; i++ )
			{
				var item = p_lib.items[i];

				if ( p_lib.getItemType(item.name) == this.FOLDER_LIB_ITEM )
				{
					if ( this.isLibFolderEmpty(p_lib,item.name) )
					{
						p_lib.deleteItem(item.name);
					}
				}
			}
		}
	},

	/**
	 * Determine if a library folder has contents.
	 *
	 * @param p_lib A reference to the library object.
	 * @param p_folderName The folder path to search.
	 *
	 * returns Boolean.
	 */
	isLibFolderEmpty : function(p_lib,p_folderName)
	{
		var count = 0;

		for ( var i=0; i<p_lib.items.length; i++ )
		{
			var item = p_lib.items[i];

			if ( item.name.indexOf(p_folderName) > -1 )
			{
				count++;
			}

			if ( count > 1 )
			{
				break;
			}
		}

		return count < 2;
	},

	/**
	 * Determine if the library contains any empty folders at all.
	 *
	 * @param p_lib A reference to the library object to search.
	 *
	 * returns Boolean.
	 */
	libHasEmptyFolders : function(p_lib)
	{
		for ( var i=0; i<p_lib.items.length; i++ )
		{
			var item = p_lib.items[i];

			if ( p_lib.getItemType(item.name) == this.FOLDER_LIB_ITEM )
			{
				if ( this.isLibFolderEmpty(p_lib,item.name) )
				{
					return true;
				}
			}
		}

		return false;
	},

	/**
	 * Return a 32 character hexadecimal GUID, e.g. 21EC2020-3AEA-1069-A2DD-08002B30309D.
	 *
	 * returns GUID String.
	 */
	guid : function()
	{	
    	var s4 = function()
    	{
       		return (((1+Math.random())*0x10000)|0).toString(16).substring(1).toUpperCase();
    	};

    	return (s4()+s4()+"-"+s4()+"-"+s4()+"-"+s4()+"-"+s4()+s4()+s4());
	},

	/**
	 * Return the current system time as a timestamp in the format [DD/MM/YYYY:HH:MM:SS].
	 *
	 * returns Timestamp String.
	 */
	getTimeStamp : function()
	{
		var now = new Date();

		var timeStamp = "["+this.zeroPad(now.getDate())+"/"+this.zeroPad(now.getMonth()+1)+"/"+now.getFullYear()+":";

		timeStamp += this.zeroPad(now.getHours())+":"+this.zeroPad(now.getMinutes()+1)+":"+this.zeroPad(now.getSeconds()+1)+"]";

		return timeStamp;
	},
	
	/**
	 * Zero pad a number less than 10 by converting it to a string a prefixing it with a "0".
	 *
	 * @param p_num Number to zero pad.
	 *
	 * returns Zero padded numerical string.
	 */
	zeroPad : function(p_num)
	{
		if ( p_num < 10 )
		{
			return "0"+p_num;
		}
		else
		{
			return p_num;
		}
	},

	/**
	 * Run through all TextFields present in the FLA (does not include TextFields in unused symbols
	 * in the library). For every TextField found push the associated object onto the returned
	 * array. An additional "id" property is added to the TextField's object.
	 *
	 * @param p_doc A reference to the FLA to search.
	 *
	 * returns Array of translatable TextField generic objects (fl.findObjectInDocByType type).
	 */
	getAllTranslatableTextFields : function(p_doc)
	{
		var data = [];
		var results = fl.findObjectInDocByType(this.TEXTFIELD_TIMELINE_ELEMENT,p_doc);

		for ( var i=0; i<results.length; i++ )
		{
			var o = results[i];

			var element = o.obj;
			var parent = o.parent;

			// Skip any dynamic or input TextFields, these are not supported.

			if ( element.textType == this.STATIC_TEXTFIELD && parent != undefined && this.isTranslatableMovieClip(parent.obj.libraryItem,p_doc.library) )
			{
				var pathName = parent.obj.libraryItem.name;
				var id = this.getIDByLibPathName(pathName);

				o.id = id;

				data.push(o);
			}
		}

		return data;
	},

	getAllStaticTextFields : function(p_doc)
	{
		var results = fl.findObjectInDocByType(this.TEXTFIELD_TIMELINE_ELEMENT,p_doc);
		var data = [];

		for ( var i=0; i<results.length; i++ )
		{
			var o = results[i];
			var element = o.obj;

			if ( element.textType == this.STATIC_TEXTFIELD )
			{
				data.push(o);
			}
		}

		return data;
	},

	/**
	 * Generate an array of library items that are not on the current document's stage (or any 
	 * nested MovieClip) but are exported for AS.
	 *
	 * @param p_doc A reference to the document to search.
	 *
	 * returns Array of library items.
	 */
	getAllUnusedExportedSymbols : function(p_doc)
	{
		var library = p_doc.library;
		var items = library.items;
		var numItems = items.length;
		var data = [];
		
		for ( var i=0; i<numItems; i++ )
		{
			var item = items[i];
			var useCount = this.getUseCount(item.name,p_doc);

			if ( item.linkageExportForAS && useCount == 0 )
			{
				data.push(item);
			}
		}

		return data;
	},

	/**
	 * Attempts to load an FLA and logs an error if the FLA is not found.
	 *
	 * @param p_flaPath Full file path to the FLA.
	 *
	 * returns Boolean success value.
	 */
	loadFLA : function(p_flaPath)
	{
		if ( !FLfile.exists(p_flaPath) )
		{
			Logger.log("Error, target FLA not found",Logger.CRITICAL);

			return null;
		}
		else
		{
			return fl.openDocument(p_flaPath);
		}
	},

	/**
	 * Initialise the logger.
	 *
	 * @param p_config Reference to the main config object.
	 * @param p_scriptFileName String containing the filename of the currently executing JSFL.
	 *
	 * returns Void.
	 */
	initLogger : function(p_config,p_scriptFileName)
	{
		if ( !Logger )
		{
			return;
		}

		Logger.init(p_config.logToFile,p_config.logToIDE,p_config.logFilePath,p_config.jobID,p_scriptFileName);

		Logger.log("Script starting ...");

		var configString = "";

		for ( var i in p_config )
		{
			configString += "  "+i+" : "+p_config[i]+"\n";
		}

		configString = configString.slice(0,configString.length-2);

		Logger.log("Using config:\n"+configString);
	},

	/**
	 * Load an external XML file and parse it's contents into a E4X XML object.
	 *
	 * @param p_xmlFilePath Full file path to the XML.
	 *
	 * returns XML object.
	 */
	loadXML : function(p_xmlFilePath)
	{
		var xmlString = FLfile.read(p_xmlFilePath);

		if ( xmlString )
		{
			try
			{
				return new XML(xmlString);
			}
			catch( p_error )
			{
				Logger.log("XML parse error. "+p_error,Logger.WARNING);

				return null;
			}
		}
		else
		{
			return null;
		}
	},

	/**
	 * Export an FLA as a SWF.
	 *
	 * @param p_swfFilePath File path to write the SWF.
	 * @param p_doc Reference to the FLA document to export.
	 *
	 * returns Boolean value indicating success.
	 */
	exportSWF : function(p_swfFilePath,p_doc)
	{
		p_doc.exportSWF(p_swfFilePath,true);

		if ( FLfile.exists(p_swfFilePath) )
		{
			return true;
		}
		else
		{

			return false;
		}
	}
};