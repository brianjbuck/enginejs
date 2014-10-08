/* --------------------------------------------------------------------------------------------------------------
*   API:            JSMX (JavaScript MX) - Universal Ajax API for ColdFusion, PHP, .NET, or anything other language.
*   AUTHOR:         Todd Kingham [todd@lalabird.com] with contributions by Jan Jannek [jan.jannek@Cetecom.de] and Yin Zhao [bugz_podder@yahoo.com]
*   CREATED:        8.21.2005
*   VERSION:        2.6.3
*   DESCRIPTION:    This API uses XMLHttpRequest to post/get data from a ColdFusion interface.
*                   The CFC's/CFM's will return a string representation of a JS variable: response_param.
*                   The "onreadystatechange event handler" will eval() the string into a JS variable 
*                   and pass the value back to the "return function". To Download a full copy of the sample 
*                   application visit: http://www.lalabird.com/JSMX/?fa=JSMX.downloads
*
*   HISTORY:        2.0.0:  Todd: Scripted Out Original Version
*                   2.1.0:  Todd: Modified for Download
*                   2.2.0:  Todd: Modified the firstWord() function to be backward compatable with
*                                 CF5 and to be more stable all-around.
*                   2.3.0:  Todd: Added "wait div" functionality
*                   2.4.0:  Todd: XML!!!! Now JSMX will allow you to pass XML Documents to the API in
*                                 addition to the original JavaScript method.
*                   2.4.1:  Jan:  2006-02-16, XMLHTTP requests can now handle more than one request at once. By placing the onreadystatechange event as a local variable inside the actual http() function.
*                           Jan:  Added fix for strange IE bug that returned Header Info.
*                           Todd: Added the jsmx object to allow users to override defaults and set custom "async", "wait" and "error" methods
*                   2.5.0:  Todd: Added JSON Support! So now you can pass JavaScript, XML, or JSON.
*                   2.5.1:  Todd: Version 2.5.0 was premature. Needed to fix an eval() bug when I introduced JSON.
*                   2.5.2:  Todd: Fixed a bug in the onreadystatechange. Based on the order you call the event handler... "State Change 1" gets called twice. Added code to only process code inside 'CASE 1:' once
*                   2.5.3:  Todd: Fixed a bug in the try/catch of the parser by placing the callback() call within the try/catch statement. This caused errors in the callback function to be "masked" and appear as "parsing errors", even when the parse was successful.
*                   2.6.0:  Todd: Added WDDX Parser! Now you can return WDDX Strings as well.
*                   2.6.1:  Todd: Streamlined the ClassicMode and JSON parser into one function.
*                   2.6.2:  Todd: Replaced ParseInt() with ParseFloat() in the my WDDX Parser.
*                           Yin: _escape_utf8() to allow UTF-8 Chars. (modified from Cal Henderson's <cal@iamcal.com> version)
*                   2.6.3:  Todd: _escape_utf8() was choking on CR+LF: chr(13) && chr(10) ... modified function to correct problem.
*
*
*   LICENSE:        THIS IS AN OPEN SOURCE API. YOU ARE FREE TO USE THIS API IN ANY APPLICATION,
*                   TO COPY IT OR MODIFY THE FUNCTIONS FOR YOUR OWN NEEDS, AS LONG THIS HEADER INFORMATION
*                   REMAINS IN TACT AND YOU DON'T CHARGE ANY MONEY FOR IT. USE THIS API AT YOUR OWN
*                   RISK. NO WARRANTY IS EXPRESSED OR IMPLIED, AND NO LIABILITY ASSUMED FOR THE RESULT OF
*                   USING THIS API.
*
*                   THIS API IS LICENSED UNDER THE CREATIVE COMMONS ATTRIBUTION-SHAREALIKE LICENSE.
*                   FOR THE FULL LICENSE TEXT PLEASE VISIT: http://creativecommons.org/licenses/by-sa/2.5/
*
-----------------------------------------------------------------------------------------------------------------*/
// UNCOMMENT THE FOLLOWING LINE IF YOU WILL BE RETURNING QUERY OBJECTS. (note: you may need to point the SRC to an alternate location.
/*document.writeln('<SCRIPT TYPE="text/javascript" LANGUAGE="JavaScript" SRC="/CFIDE/scripts/wddx.js"></SCRIPT >');*/

var jsmx = new jsmxConstructor();
function jsmxConstructor()
{
    this.isJSMX = true;
    this.async = true;
    this.debug = false;
    this.http = http;
    this.onError = _onError;
}

// perform the XMLHttpRequest();
function http(verb, url, cb, q)
{
    var self = (this.isJSMX) ? this : jsmx ;
    //reference our arguments
    var qryStr = (!q) ? '' : _toQueryString(q);
    var calledOnce = false; //this is to prevent a bug in onreadystatechange... "state 1" gets called twice.
    try
    {   
        //this should work for most modern browsers excluding: IE Mac
        var xhr = (window.XMLHttpRequest) ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP") ;
            xhr.onreadystatechange = function()
            {
                switch(xhr.readyState)
                {
                    case 0:
                        // UNSENT
                        break;
                    case 1: 
                        // OPENED
                        break;
                    case 2:
                        // HEADERS_RECEIVED
                        break;
                    case 3:
                        // LOADING
                        break;
                    case 4:
                        // DONE
                        if (xhr.status == 200)
                        {
                            // only if "OK"
                            var success = true;
                            try
                            {
                                var rObj = _parseResponse(xhr);
                            }
                            catch(e)
                            { 
                                self.onError(xhr, self, 1);
                                success = false;
                            }
                            if(success)
                            {
                                cb(rObj);
                            }
                        }
                        else
                        {
                            self.onError(xhr, self, 2);
                        }
                    delete xhr; // clean this function from memory once we re done with it.
                    break;
                }
            };
            
            xhr.open(verb, _noCache(url), self.async);
            
            if(verb.toLowerCase() == 'post')
            {
                var contenttype = "application/x-www-form-urlencoded";
                xhr.setRequestHeader("Content-Type", contenttype);
            }

            xhr.send(qryStr);
    }
    catch(e)
    {
        self.onError(xhr, self, 3);
    }
}

/*--- BEGIN: RESPONSE PARSING FUNCTIONS ---*/
function _parseResponse(resp)
{
    var str = _cleanString(resp.responseText);
    var xml = resp.responseXML;
    var type = resp.responseType;
    
    try
    {
        return JSON.parse(str);
    }
    catch(err)
    {
        // fall through to try parsing as xml
    }
    if(xml != null && xml.childNodes.length)
    {
        return xml;
    }
    console.error("Could not parse the response:", resp);
}

// jan.jannek@cetecom.de, 2006-02-16, weird error: some IEs show the
// responseText followed by the complete response (header and body again) 
function _cleanString(str)
{ 
    //Left Trim
    var rex = /\S/i;
    str = str.substring(str.search(rex),str.length);
    
    var i = str.indexOf("HTTP/1");
    if (i > -1)
    {
        str = str.substring(i, str.length);
        i = str.indexOf(String.fromCharCode(13, 10, 13, 10));
        if (i > -1)
        {
            str = str.substring(i + 2, str.length);
        }
    }
    return str; 
}
/*--- END: RESPONSE PARSING FUNCTIONS ---*/


/*--- BEGIN: REQUEST PARAMETER FUNCTIONS ---*/
function _toQueryString(obj)
{
    // determine the variable type
    if(typeof(obj) == 'string')
    {
        return obj;
    }

    if(typeof(obj) == 'object')
    {
        // It's an Object()!
        if(typeof obj.elements == 'undefined')
        {
            return _object2queryString(obj);
        }
        // It's a form!
        else
        {
            return _form2queryString(obj);
        }
    }   
}

function _object2queryString(obj)
{
    var ar = new Array();
    for(x in obj)
    {
        ar[ar.length] = _escape_utf8(x) + '=' + _escape_utf8(obj[x]);
    }
    return ar.join('&');
}

function _form2queryString(form)
{
    var obj = new Object();
    var ar = new Array();
    for(var i = 0; i < form.elements.length; i++)
    {
        try
        {
            elm = form.elements[i];
            nm = elm.name;
            if(nm != ''){
                switch(elm.type.split('-')[0])
                {
                    case "select":
                        for(var s=0;s < elm.options.length;s++)
                        {
                            if(elm.options[s].selected)
                            {
                                if(typeof(obj[nm]) == 'undefined')
                                {
                                    obj[nm] = new Array();
                                }
                                obj[nm][obj[nm].length] = _escape_utf8(elm.options[s].value);
                            }   
                        }
                        break;                      
                    case "radio":
                        if(elm.checked)
                        {
                            if(typeof(obj[nm]) == 'undefined')
                            {
                                obj[nm] = new Array();
                            }
                            obj[nm][obj[nm].length] = _escape_utf8(elm.value);
                        }   
                        break;                      
                    case "checkbox":
                        if(elm.checked)
                        {
                            if(typeof(obj[nm]) == 'undefined')
                            {
                                obj[nm] = new Array();
                            }
                            obj[nm][obj[nm].length] = _escape_utf8(elm.value);
                        }   
                        break;                      
                    default:
                        if(typeof(obj[nm]) == 'undefined')
                        {
                            obj[nm] = new Array();
                        }
                        obj[nm][obj[nm].length] = _escape_utf8(elm.value);
                        break;
                }
            }
        }
        catch(e)
        {}
    }
    
    for(x in obj)
    {
        ar[ar.length] = x + '=' + obj[x].join(',');
    }
    return ar.join('&');
}
/*--- END: REQUEST PARAMETER FUNCTIONS ---*/

// IE likes to cache so we will fix it's wagon!
function _noCache(url)
{
    var qs = new Array();
    var arr = url.split('?');
    var scr = arr[0];
    if(arr[1])
    {
        qs = arr[1].split('&');
    }
    qs[qs.length] = 'noCache=' + new Date().getTime();
    return scr + '?' + qs.join('&');
}

function _onError(obj, inst, errCode)
{ 
    var e;
    var msg;

    switch(errCode)
    {
        case 1:
            /* parsing error */
            e = 'Parsing Error: The value returned could not be evaluated.';
            msg = (inst.debug) ? obj.responseText : e;
            break;
        case 2: /* server error */
            e = 'There was a problem retrieving the data:\n' + obj.status + ' : ' + obj.statusText;
            msg = (inst.debug) ? obj.responseText : e;
            break;
        case 3: /* browser not equiped to handle XMLHttp */
            msg = 'Unsupported browser detected.';
            return;/* you can remove this return to send a message to the screen */
            break;      
    }

    if(inst.debug)
    {
        var debugWin = window.open('', 'error');
        debugWin.document.write(msg);
        debugWin.focus();
    }
    else
    {
        console.error(msg);
    }
}

function _escape_utf8(data)
{
    if (data=="" || data == null)
    {
        return "";
    }

    data = data.toString();
    var buf = "";

    for (var i = 0; i < data.length; i++)
    {
        var c=data.charCodeAt(i);
        var bs = [];
        if (c > 0x10000)
        {
            bs[0] = 0xF0 | ((c & 0x1C0000) >>> 18);
            bs[1] = 0x80 | ((c & 0x3F000) >>> 12);
            bs[2] = 0x80 | ((c & 0xFC0) >>> 6);
            bs[3] = 0x80 | (c & 0x3F);
        }
        else if (c>0x800)
        {
            bs[0] = 0xE0 | ((c & 0xF000) >>> 12);
            bs[1] = 0x80 | ((c & 0xFC0) >>> 6);
            bs[2] = 0x80 | (c & 0x3F);
        }
        else  if (c>0x80)
        {
            bs[0] = 0xC0 | ((c & 0x7C0) >>> 6);
            bs[1] = 0x80 | (c & 0x3F);
        }
        else
        {
            bs[0] = c;
        }
        
        if (c == 10 || c == 13)
        {
            buf += '%0'+c.toString(16);
        }// added to correct problem with hard returns
        else if (bs.length == 1 && c>=48 && c<127 && c!=92)
        {
            buf += data.charAt(i);
        }
        else
        {
            for(var j = 0; j < bs.length; j++)
            {
                buf += '%' + bs[j].toString(16);
            }
        }
    }
    return buf;
}

function $(id)
{
    return document.getElementById(id);
}