var Logger =
{
	SYSTEM : "[SYST]",
	WARNING : "[WARN]",
	CRITICAL : "[CRIT]",
	
	logToFile : true,
	logToIDE : true,
	logFilePath : "",
	jobID : "",
	scriptName : "",

	init : function(p_logToFile,p_logToIDE,p_logFilePath,p_jobID,p_scriptName)
	{
		this.logToFile = p_logToFile;
		this.logToIDE = p_logToIDE;
		this.logFilePath = p_logFilePath;
		this.jobID = p_jobID;
		this.scriptName = p_scriptName;

		if ( this.logToIDE )
		{
			fl.outputPanel.clear();
		}
	},

	log : function(p_logItem,p_type)
	{
		var output = this.jobID+" "+this.scriptName+" "+this.getTimeStamp();

		if ( !p_type || p_type === "" )
		{
			output = this.SYSTEM+" "+output;
		}
		else
		{
			output = p_type+" "+output;
		}

		output = output+" > "+p_logItem;

		if ( this.logToIDE )
		{
			fl.outputPanel.trace(output);
		}

		FLfile.write(this.logFilePath,output+"\n","append");
	},

	getTimeStamp : function()
	{
		var now = new Date();

		var timeStamp = "["+this.zeroPad(now.getDate())+"/"+this.zeroPad(now.getMonth()+1)+"/"+now.getFullYear()+":";

		timeStamp += this.zeroPad(now.getHours())+":"+this.zeroPad(now.getMinutes()+1)+":"+this.zeroPad(now.getSeconds()+1)+"]";

		return timeStamp;
	},
	
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
	}
};