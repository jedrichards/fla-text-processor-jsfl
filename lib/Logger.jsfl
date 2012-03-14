var Logger =
{
	SYSTEM : "[SYST]",
	WARNING : "[WARN]",
	CRITICAL : "[CRIT]",
	
	logToFile : true,
	logToIDE : true,
	logDir : "",
	logFile : "",
	jobID : "",
	scriptName : "",

	init : function(p_logToFile,p_logToIDE,p_logDir,p_jobID,p_scriptName)
	{
		this.logToFile = p_logToFile;
		this.logToIDE = p_logToIDE;
		this.logDir = p_logDir;
		this.logFile = logDir+"log";
		this.jobID = p_jobID;
		this.scriptName = p_scriptName;

		if ( this.logToIDE )
		{
			fl.outputPanel.clear();
		}
	},

	log : function(p_text,p_type)
	{
		var logString = "job"+this.jobID+" "+this.scriptName+" "+this.getTimeStamp();

		if ( !p_type || p_type === "" )
		{
			logString = this.SYSTEM+" "+logString;
		}
		else
		{
			logString = p_type+" "+logString;
		}

		logString = logString+" "+p_text;

		if ( this.logToIDE )
		{
			fl.outputPanel.trace(logString);
		}

		FLfile.write(this.logFile,logString+"\n","append");
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