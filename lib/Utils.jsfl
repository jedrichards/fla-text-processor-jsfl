var Utils =
{
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

	getTranslationIDByLibPathName : function(p_pathName)
	{
		if ( this.isTranslatableLibPathName(p_pathName) )
		{
			var pathParts = p_pathName.split("/");
		
			return pathParts[pathParts.length-1];
		}
		else
		{
			return "invalidItem"
		}
	},

	getTranslationDataByLib : function(p_lib)
	{
		var data = [];
		var libItems = p_lib.items;
		var numLibItems = libItems.length;

		for ( var i=0; i<numLibItems; i++ )
		{
			var libItem = libItems[i];
			var pathName = libItem.name;

			if ( !this.isTranslatableLibPathName(pathName) )
			{
				continue;
			}

			var id = this.getTranslationIDByLibPathName(pathName);
			var type = p_lib.getItemType(pathName);

			if ( type != "movie clip")
			{
				Logger.log("Translatable library item \""+id+"\" is not a MovieClip",Logger.WARNING);

				continue;
			}

			var tl = libItem.timeline;

			if ( tl.layers.length > 1 )
			{
				Logger.log("Translatable MovieClip library item \""+id+"\" has more than 1 layer",Logger.WARNING);

				continue;
			}

			if ( tl.layers[0].frames.length > 1 )
			{
				Logger.log("Translatable MovieClip library item \""+id+"\" has more than 1 frame",Logger.WARNING);

				continue;
			}

			if ( tl.layers[0].frames[0].elements.length == 0 )
			{
				Logger.log("Translatable MovieClip library item \""+id+"\" is empty",Logger.WARNING);

				continue;
			}

			if ( tl.layers[0].frames[0].elements.length > 1 )
			{
				Logger.log("Translatable MovieClip library item \""+id+"\" contains more than child symbol",Logger.WARNING);

				continue;
			}

			var element = tl.layers[0].frames[0].elements[0];

			if ( element.elementType != "text" )
			{
				Logger.log("Translatable MovieClip library item \""+id+"\" does not contain a TextField",Logger.WARNING);

				continue;
			}

			data.push({tf:element,id:id,text:element.getTextString(),font:element.getTextAttr("face"),size:element.getTextAttr("size"),bold:element.getTextAttr("bold"),italic:element.getTextAttr("italic")});
		}

		return data;
	},

	guid : function()
	{	
    	var s4 = function()
    	{
       		return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    	};

    	return (s4()+s4()+"-"+s4()+"-"+s4()+"-"+s4()+"-"+s4()+s4()+s4());
	},

	convertTranslationDataToXML : function(p_data,p_lang)
	{
		var xml = <root></root>;

		xml.@lang = p_lang;
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
	},

	saveXML : function(p_xml,p_dirPath,p_fileName)
	{
		var success = FLfile.write(p_dirPath+p_fileName,p_xml.toXMLString());

		if ( success )
		{
			Logger.log("Wrote XML file "+p_fileName+" to disk");
		}
		else
		{
			Logger.log("Error writing XML file to disk "+p_fileName+" to disk",Logger.CRITICAL);
		}
	}
};