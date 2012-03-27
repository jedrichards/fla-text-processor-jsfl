var config =
{
	logToFile : true, // Whether to log to a file
	logToIDE : true, // Whether to log to the IDE's output panel
	logFilePath : "", // Log file path
	libDir : "", // Static JSFL library directory
	jobID : "" // PHP's job ID, use to match log entries to jobs
}

var scriptPath = fl.scriptURI;
var scriptPathParts = scriptPath.split("/");
var scriptName = scriptPathParts[scriptPathParts.length-1];
var scriptDir = scriptPath.split(scriptName)[0];

if ( config.logFilePath == "" ) config.logFilePath = scriptDir+"log";
if ( config.libDir == "" ) config.libDir = scriptDir+"lib/";

fl.runScript(config.libDir+"Utils.jsfl");
fl.runScript(config.libDir+"Logger.jsfl");
fl.runScript(config.libDir+"HTMLParser.jsfl");
fl.runScript(fl.configURI+"JavaScript/ObjectFindAndSelect.jsfl");

Utils.initLogger(config,scriptName);

var doc = fl.getDocumentDOM();
var tf = doc.selection[0];
var html = tfToHTML(tf);

htmlToTF(html,doc.getTimeline().layers[1].frames[0].elements[0])

function tfToHTML(p_tf)
{
	var textRuns = tf.textRuns;
	var html = "";

	for ( var i=0; i<textRuns.length; i++ )
	{
		var textRun = textRuns[i];
		var chars = textRun.characters;

		chars = chars.replace(/\n/g,"<br/>");
		chars = chars.replace(/\r/g,"<br/>");
		chars = chars.replace(/  /g," ");
		chars = chars.replace(/. <br\/>/g,".<br/>");


		var attrs = textRun.textAttrs;

		var font = attrs.face;
		var size = attrs.size;
		var bold = attrs.bold;
		var italic = attrs.italic;
		var colour = attrs.fillColor;

		if ( bold )
		{
			chars = "<b>"+chars+"</b>";
		}

		if ( italic )
		{
			chars = "<i>"+chars+"</i>";
		}

		chars = "<font size=\""+size+"\" face=\""+font+"\" color=\""+colour+"\">"+chars+"</font>";

		html += chars;
	}

	html = html.replace(/.<br\/><br\/><\/font>/g,".</font><br/><br/>");
	html = html.replace(/.<br\/><\/font>/g,".</font><br/>");

	return html;
}

function htmlToTF(p_html,p_tf)
{
	p_html = p_html.replace(/<br\/>/g,"\r");

	// Convert "<br/>"" back to \r carriage returns, and strip tags:

	//p_tf.setTextString(p_html.replace(/<br\/>/g,"\r").replace(/<[^>]+>/g,"$"));

	//p_tf.setTextString(p_html.replace(/(<(br[^>]+)>)/ig,"[BR]"));

	var baseAttrs = p_tf.textRuns[0];

	//p_tf.textType = "dynamic";
	//p_tf.renderAsHTML = true;
	//p_tf.setTextString(p_html);

	var results = [];
	var resultString = "";

	function getLast()
	{
		return results[results.length-1];
	}

	HTMLParser(p_html,
		{
			start : function(p_tag,p_attrs,p_unary )
			{
				switch (p_tag)
				{
					case "font":
						var o =
						{
							startIndex : resultString.length,
							endIndex : 0,
							attrs : cloneTextAttrs(baseAttrs)
						}
						Logger.log(p_attrs[0].escaped);
						break;
					case "b":
						break;
					case "i":
						break;
					default:
						break;
				}
			},
			chars : function( text )
			{
				Logger.log("\""+text+"\"");
			},
			end : function( tag )
			{
				Logger.log("end "+tag)
			}
		}
	);
}

function cloneTextAttrs(p_attrs)
{
	var clone = {};

	for ( var i in p_attrs )
	{
		clone[i] = p_attrs[i];
	}

	return clone;
}