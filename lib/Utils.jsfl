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
	 * Parses the interim arrays generated by the processForTranslation method and appends
	 * translation data objects onto the supplied master array.
	 *
	 * @param p_data Master array being built by processForTranslation.
	 * @param p_elements Interim array of data objects.
	 *
	 * returns void;
	 */
	addValidTFElementsToData : function(p_data,p_elements)
	{
		for ( var i=0; i<p_elements.length; i++ )
		{
			var tfElement  = p_elements[i].element;
			var parent = p_elements[i].parent;
			var namePath = parent.obj === undefined ? parent.name : parent.obj.libraryItem.name;

			var o =
			{
				id : this.getIDByLibPathName(namePath),
				text : tfElement.getTextString(),
				font : tfElement.getTextAttr("face"),
				size : tfElement.getTextAttr("size"),
				bold : tfElement.getTextAttr("bold"),
				italic : tfElement.getTextAttr("italic")
			}

			p_data.push(o);
		}
	},

	/**
	 * Parses an interim array generated by the processForTranslation method and computes
	 * the next highest id safe to use.
	 *
	 * @param p_data Master array being built by processForTranslation.
	 *
	 * returns void;
	 */
	getNextID : function(p_data)
	{
		var ids = [];

		for ( var i=0; i<p_data.length; i++ )
		{
			var id = p_data[i].id;

			ids.push(parseInt(id.split("tf")[1]));
		}

		return Math.max.apply(Math,ids)+1;
	},

	fixInvalidItem : function(p_o,p_lib,p_doc,p_id)
	{
		var tfElement  = p_o.element;
		var parent = p_o.parent;

		if ( parent === undefined )
		{
			p_lib.editItem(p_doc);
		}
		else
		{
			p_lib.editItem(parent.obj.libraryItem.name);
		}
		
		p_doc.selectNone();
		p_doc.getTimeline().currentFrame = p_o.frameIndex;
		tfElement.selected = true;

		if ( p_doc.selection.length == 0 )
		{
			Logger.log("no selection!");
		}

		p_o.parent = p_doc.convertToSymbol("movie clip",p_id,"top left");
	},

	isItemInLib : function(p_name,p_lib)
	{
		var numItems = p_lib.items.length;

		for ( var i=0; i<numItems; i++ )
		{
			var item = p_lib.items[i];

			if ( item.name.indexOf(p_name) > -1 )
			{
				return true;
			}
		}

		return false;
	},

	tidyLibrary : function(p_lib,p_folder)
	{
		if ( !p_lib.itemExists(p_folder) )
		{
			p_lib.newFolder(p_folder);
		}

		for ( var i=0; i<p_lib.items.length; i++ )
		{
			var item = p_lib.items[i];

			if ( this.isTranslatableLibPathName(item.name) && item.name.indexOf(p_folder) == -1 )
			{
				p_lib.moveToFolder(p_folder,item.name,true);
			}
		}
	},

	isFolderEmpty : function(p_lib,p_folderName)
	{

	},

	guid : function()
	{	
    	var s4 = function()
    	{
       		return (((1+Math.random())*0x10000)|0).toString(16).substring(1).toUpperCase();
    	};

    	return (s4()+s4()+"-"+s4()+"-"+s4()+"-"+s4()+"-"+s4()+s4()+s4());
	}
};