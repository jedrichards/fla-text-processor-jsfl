var Utils =
{
	isTranslatableLibPathName = function(p_pathName)
	{
		if ( !p_pathName || p_pathName === "" )
		{
			return false;
		}

		var pathParts = p_pathName.split("/");
		var itemName = pathParts[pathParts.length-1];

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
	}
};