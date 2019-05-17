
function guid() {
    function _p8(s) {
        var p = (Math.random().toString(16) + "000000000").substr(2, 8);
        return s ? p.substr(0, 4) + p.substr(4, 4) : p;
    }
    return _p8() + _p8(true) + _p8(true) + _p8();
}


function xmlSanitize(val) {
    if (typeof val === "string") {

        if (val.length > 19) {
          if (pickRDLType(val) == "Date") {

if (!window.navigator.msSaveOrOpenBlob)
{
                val = new Date(val.replace(/:\d\d\d/,""));
                val = val.getFullYear() + '-' + (val.getMonth() > 8 ? val.getMonth() + 1: "0" + (val.getMonth() + 1)) + '-' + 
                      (val.getDate() > 9 ? val.getDate() : "0" + val.getDate()) + 'T' + val.toTimeString().substr(0,8);
}
else
{
                val = val.substr(0,19); 
}

            }
        }
            
 
        val = val.replace(/[^\u0009\u000a\u000d\u0020-\uD7FF\uE000-\uFFFD]/g,'');
 
            val = val.replace(/&/g,'&amp;amp;');
            val = val.replace(/</g,'&amp;lt;');
            val = val.replace(/>/g,'&amp;gt;');
    

         return val;  
    }
    else
       if (val == null)
            {return '';}
        else
            {return val;}

}

function fieldNameSanitize(fld) {
    
if (fld.substr(0, 3) == "DE:")
    {
        return fieldNameSanitize(fld.substr(3));
    }
    else
   {  
        fld = fld.replace(/^[0-9]/g,'fld$&'); // Append 'fld' before any field that starts as a number
        fld = fld.replace(/%/g,'Pct');  // Change % to "Pct"
        fld = fld.replace(/&/g,'and'); // Change & to "and"
        fld = fld.replace(/\-/g,'_'); // Change dashes to underscores
        fld = fld.replace(/[^a-zA-Z0-9-_~]/g,''); // Remove all other non-alphanumerics

    return fld;
   }
}


 
var dataDictionary = [];
var uniqueFields = {};
var uniqueTables = {};
 

 function buildDataDictionary (objName,field,fsan)
    {

 
     if (!uniqueTables[objName])
        {
            uniqueTables[objName] = true;
            dataDictionary.push({"table":objName,"fields":[]});
        }

     if (!uniqueFields[objName + ':' + field])
        {
            uniqueFields[objName + ':' + field] = true;
            dataDictionary.filter(function(fld) {return (fld.table == objName);})[0].fields.push({"jsonName" : field,"rdlName" : fsan});
        }

    }
 
function isDate(val) {
    
var dCheck = /[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]/.test(val);
dCheck = (dCheck && (! /[a-z]/.test(val)));
  var d = new Date(val);
    return (dCheck && !isNaN(d.valueOf()));
}

function pickRDLType(fld) {
    var retType = "String";

    if (fld != null)
    {
  if (typeof fld === "boolean") {  
       retType = "Boolean"; 
   } else
    if (typeof fld === "number") {
        retType = "Decimal";
    }
    else
        if (!isNaN(fld) ) {
            retType = "Decimal";
        }
        else
            if (fld.length > 20) {
                if (isDate(fld.substr(0, 19)))
                    retType = "Date";

            }
            else if (isDate(fld))
            {
                retType= "Date";
            }
}

    return retType;
}

function sortType (val0, val1)
{
    return evaluateRDLType (pickRDLType(val0),pickRDLType(val1));
}

function evaluateRDLType (type0, type1)
{
   if (type0 == type1) return 0;
   if (type0 == "String") return 0;
   if (type1 == "String") return 1;
   if (type0 == "Boolean") return 1;
   if (type1 == "Boolean") return 0;
   if (type0 == "Decimal") return 1;
   if (type1 == "Decimal") return 0;
   return 0;
}


function convertJsonObjectToRdlData(jsonObj, prefix, childDataSets, moveSubObjectsToRoot) {
    var rdl = "";

    if (typeof jsonObj === "object") {

        for (var key in jsonObj) {
            fsan = fieldNameSanitize(key);
            
            
            if (key != '$$hashKey') {
                if (typeof jsonObj[key] === "object" && jsonObj[key] != null) {

                    if (Object.prototype.toString.call(jsonObj[key]) == '[object Array]'   && jsonObj[key].length > 0)
                    {
                       var subObj = fsan;

                     if (typeof jsonObj[key][0] === "object") 
                      {
                     

                     /*   rdl += '&lt;' + prefix + subObj + '_items&gt;' +  jsonObj[key].map( function(itm) 
                        { return '&lt;' +  prefix + subObj + '&gt;' + convertJsonObjectToRdlData(itm, prefix + subObj + "_")
                            + '&lt;/' +  prefix + subObj + '&gt;\r\n';}).join(" ") + '&lt;/' + prefix + subObj + '_items&gt;'; 
CODE TO BUILD IN-LINE SUB OBJECT
*/
                        appendChildObject(jsonObj[key],prefix + subObj);
                        // childDataSets.childData += createRDLDataSet( jsonObj[key],prefix + subObj,childDataSets,moveSubObjectsToRoot);
                    

                      }
                    else
                        {
                        rdl += '&lt;' + prefix + subObj + '&gt;' + xmlSanitize(jsonObj[key].join(", ")) + '&lt;/' + prefix + subObj + '&gt;\r\n' ;
                        }
                    }
                    else
                    { 
                        if (moveSubObjectsToRoot && !(jsonObj[key] == null)  && (jsonObj[key].length != 0))
                         {
                              appendChildObject(jsonObj[key],fsan);
                          //  childDataSets.childData += createRDLDataSet( [jsonObj[key]],fsan, childDataSets , moveSubObjectsToRoot);
                         }
                        else
                         {  
                            rdl += convertJsonObjectToRdlData(jsonObj[key], prefix + fsan + "_" , childDataSets, moveSubObjectsToRoot);
                         }
                    }
                }
                else {
                    rdl += '&lt;' + prefix + fsan + ' &gt;' + xmlSanitize(jsonObj[key]) + '&lt;/' + prefix + fsan + '&gt;\r\n';
                }
            }
        }
    }
    else
    {
        rdl += '&lt;' + prefix +  ' &gt;' + xmlSanitize(jsonObj) + '&lt;/' + prefix  + '&gt;\r\n';

    }
return rdl;
}

function getMaxJsonObjArray(jsonArr,subObj)
{
 var result = {};

if (typeof subObj != 'undefined')
{
    result = subObj;
}

for (i = 0; i < jsonArr.length; i++) { 

    obj = jsonArr[i];

    for (var x in obj)
    {  
        if (Object.prototype.toString.call(obj[x]) == '[object Array]') 
        {
            if (!result.hasOwnProperty(x))
            {
                result[x] = obj[x];
            }
            else if ( result[x] == null || obj[x].length > result[x].length)
            {
                result[x] = obj[x];
            } 
    
        } else if  (Object.prototype.toString.call(obj[x]) == '[object Object]')
        {

            if (!result.hasOwnProperty(x) || result[x] == null)
            {
                result[x] = {};
            }
           

             if (obj[x] != null && !(typeof obj[x] === 'undefined'))
            {

            
            
                for (var y in obj[x])
                    {
                        if (!result[x].hasOwnProperty(y))
                            {
                                result[x][y] = obj[x][y];
                            }
                        else if (obj[x][y] > result[x][y] && sortType(obj[x][y],result[x][y]) < 1 )
                        {
                            result[x][y] = obj[x][y];
                        }
                    }
             
                
                
            }
        } else 

          if ( (!result.hasOwnProperty(x) || obj[x] > result[x] || result[x] == null) && sortType(obj[x],result[x]) < 1)
            {
                result[x] = obj[x];
            }
     }
    };

return result;
}

function appendChildObject(jsonObj,dataSetName)
{

  if (childObjects.hasOwnProperty(dataSetName))
    {
        Array.prototype.push.apply(childObjects[dataSetName],jsonObj);
    }
else
    {
        childObjects[dataSetName]= jsonObj;
    }

}


function createRDLDataSet(jsonObj,dataSetName,childDataSets, moveSubObjectsToRoot)
{
var rdl = "";

if (jsonObj.length > 0) {

 
    var maxObj = getMaxJsonObjArray(jsonObj);
 
     rdl = '<DataSet Name="' + dataSetName + '">\r\n<Query>\r\n<DataSourceName>EmbeddedDataSource</DataSourceName>\r\n<CommandText> &lt;Query&gt;\r\n';

    rdl += '&lt;ElementPath&gt;\r\nJsonTable{}/JsonRow{' + convertJSONtoRDLElementPath(maxObj, '', moveSubObjectsToRoot).substr(1) + '}\r\n&lt;/ElementPath&gt;\r\n';
    rdl += '&lt;XmlData&gt;\r\n&lt;JsonTable&gt;';

    rdl += jsonObj.map(function (jObj, i, jArr) {
        return '&lt;JsonRow&gt;\r\n' + convertJsonObjectToRdlData(jObj, '', childDataSets, moveSubObjectsToRoot) + '&lt;/JsonRow&gt;\r\n';
    }).join(" ");

    rdl += '&lt;/JsonTable&gt;\r\n&lt;/XmlData&gt;\r\n';
 

    rdl += '&lt;/Query&gt;\r\n</CommandText>\r\n </Query>\r\n';

       
    rdl += '<Fields>\r\n' + convertJSONtoRDLFieldList(maxObj, '', dataSetName, moveSubObjectsToRoot) + '</Fields>\r\n';
    rdl += "</DataSet>";
 
}
 
    return rdl;

}

 

function getJsonFieldsFromRDL(xml)
{
        var fields = xml.match(/Fields!\w+(?=\.Value)|\w+(?="\)<\/Value>)|\w+(?=<\/DataSetName>)|<\/Tablix>/g);
        var tbl = "";

if (fields != null)
 {

fields = fields.map(function (itm) {
                
                if (itm.substr(0, 7) != "Fields!" && itm != "</Tablix>")
                {
                tbl = itm;
                }
                if (itm == "</Tablix>")
                {
                    return tbl;
                }
                else
                {
                    return itm;
                }
        });

tbl = "";
 
fields.reverse();

         


        var uniqueSet = {};
        var uniqueFields = [];

        fields.map(function (itm) {
            if (itm.substr(0, 7) == "Fields!")
            {
                fld = itm.substr(7);
                fval = tbl + "." + fld;

                if (!uniqueSet[fval])
                {
                uniqueSet[fval] = true;
                uniqueFields.push({ "table": tbl, "field": fld });
                }
            }
            else
            {
                tbl = itm;
            }
            return itm;
        });
 
        uniqueFields.sort(function (a, b) { return ((a.table + '.' + a.field).toUpperCase() >= (b.table + '.' + b.field).toUpperCase() ? 1 : -1) });
 
        var tblSet = {};
        var lastSet;

        uniqueFields.map(function (itm, i, arr) {
            
            if (i == 0 || arr[i - 1].table != itm.table) {
               tblSet[itm.table] = {};  
            }
            tblSet[itm.table][itm.field] = false;
             

        });
 
return tblSet;

}

else
{
return {};
}
}  

var rptGUID;
var dataGUID;
var rdlFieldsUsed;
var childObjects = {};

function resetGlobals() 

{

 dataDictionary = [];
 uniqueFields = {};
 uniqueTables = {};
 rptGUID = guid();
 dataGUID = guid();
 rdlFieldsUsed;
 childObjects = {};
  

}

function convertJSONArraytoRDLDataSet(jsonObj, dataSetName, rdlTemplate, moveSubObjectsToRoot ) {
 
    resetGlobals();

    var rdl = "";

    

    var childDataSets = {childData:""};
    rdlFieldsUsed =  getJsonFieldsFromRDL(rdlTemplate);   

    rdl = createRDLDataSet(jsonObj,dataSetName,childDataSets, moveSubObjectsToRoot);
//    rdl += childDataSets.childData;




for (var obj in childObjects)
    {
        rdl += createRDLDataSet(childObjects[obj],obj,{},moveSubObjectsToRoot);
    }

 

    rdl = rdlTemplate.replace("{REPORTGUID}", rptGUID).replace("{DATASOURCEGUID}", dataGUID).replace("{"+ dataSetName +"}", function() { return rdl});


    return rdl;


}


function convertJSONtoRDLElementPath(jsonObj, prefix, moveSubObjectsToRoot) {
    var rdl = '';


    for (var field in jsonObj) {

        var fsan = fieldNameSanitize(field);

        if (field != "$$hashKey") {
            if (typeof jsonObj[field] === "object" && jsonObj[field] != null) {

                if (Object.prototype.toString.call(jsonObj[field]) == '[object Array]' && jsonObj[field].length > 0)
                {
                    if(typeof jsonObj[field][0] === "object" && jsonObj[field][0].hasOwnProperty("ID"))
                    {
                   // rdl += ',' +  convertJSONtoRDLElementPath(jsonObj[field][0], prefix + fsan + '_').substr(1) ;    
                    }
        else
              {
                 
                 rdl += ',' + prefix + fsan + '(string)\r\n';         
               }
                }
                else
                {  
                    if (!moveSubObjectsToRoot)
                     {rdl += convertJSONtoRDLElementPath(jsonObj[field], prefix + fsan + '_', moveSubObjectsToRoot);}
                }

            }
            else {
                rdl += ',' + prefix + fsan + '(' + pickRDLType(jsonObj[field]) + ')\r\n';
                       
            }
        }
    }


    return rdl;
}

function convertJSONtoRDLFieldList(jsonObj, prefix, objName, moveSubObjectsToRoot) {
    var rdl = '';
 
    if (typeof rdlFieldsUsed[objName.split(":")[0]] === 'undefined')
    {
        rdlFieldsUsed[objName.split(":")[0]] = {};
    }

    if (typeof jsonObj === "object") {
 
        for (var field in jsonObj) {
 
            var fsan  = fieldNameSanitize(field);
            
 
   
            if (field != "$$hashKey") {
                if (typeof jsonObj[field] === "object" && jsonObj[field] != null) 
                {          

                    if (Object.prototype.toString.call(jsonObj[field]) == '[object Array]' && jsonObj[field].length > 0)
                    {

                        if (typeof jsonObj[field][0] === "object" ) 
                            {
                                // Is a sub-object and will contain its own field definititions: do nothing

    
                            }
                        else
                            {

                    // Value array case, is converted to string of items

                    fsan =  (prefix != '' ? prefix : '') + fsan;
                    rdl += '<Field Name="' + fsan + '">\r\n';
                    rdl += '<DataField>' + fsan + '</DataField>\r\n';
                    rdl += '<rd:TypeName>System.string';
                    rdl += '</rd:TypeName>\r\n</Field>\r\n';
                             
                            }
                    } 
                            
                    else
                    {  
                        if (!moveSubObjectsToRoot)
                        {
                            //Sub object is not an array, will prefix it with field name and append properties with '_'
                            rdl += convertJSONtoRDLFieldList(jsonObj[field], prefix + fsan + '_', objName + ':' + field ,moveSubObjectsToRoot);
                             
                        }
                    }
                }
                else {
 
                    fsan = prefix + fsan;
                    rdl += '<Field Name="' + fsan + '">\r\n';
                    rdl += '<DataField>' +  fsan + '</DataField>\r\n';
                    rdl += '<rd:TypeName>System.' + pickRDLType(jsonObj[field]);
                    rdl += '</rd:TypeName>\r\n</Field>\r\n';

                }
            }

            rdlFieldsUsed[objName.split(":")[0]][fsan] = true;
            buildDataDictionary (objName,field,fsan);
        } // for loop
    }
    else
    {
        rdl += '<Field Name="' + prefix + '">\r\n';
        rdl += '<DataField>' + prefix + '</DataField>\r\n';
        rdl += '<rd:TypeName>System.' + pickRDLType(jsonObj);
        rdl += '</rd:TypeName>\r\n</Field>\r\n';
 
        rdlFieldsUsed[objName.split(":")[0]][prefix] = true;
        buildDataDictionary (objName,field,prefix);
    }

 if (objName.indexOf(":")==-1)
{
    for (fld in rdlFieldsUsed[objName])
    {

        if (!rdlFieldsUsed[objName][fld])
        {
               rdl += '<Field Name="' + fld + '">\r\n';
               rdl += '<DataField>' + fld + '</DataField>\r\n';
               rdl += '<rd:TypeName>System.string';
               rdl += '</rd:TypeName>\r\n</Field>\r\n';
  
        }
    }
 }

  
 
    return rdl;
}



function resizeTablix(rdl, tablixName, colWidths, prorateToWidth)

{
var wFactor = 1;

  if (prorateToWidth != null) {

/* Supports normalized % Widths based on prorated master width */

    var colSum = colWidths.reduce(function(a, b) {
      return a + b;
    }, 0);

       wFactor = prorateToWidth / colSum;

 }

/* Use reduce function to concatenate a new XML block based on the new table sizes */
    var newXML = colWidths.reduce(function(cumulative, itm) {
      return cumulative + "<TablixColumn><Width>" + ((itm * wFactor).toFixed(5)) + "in</Width></TablixColumn>";
    }, "");

/* Use a RegEx to swap in the tablesize block in the RDL code for the provided Tablix Name */
    re = new RegExp('(<Tablix Name="' + tablixName + '">[\r\n| ]+<TablixBody>[\r\n| ]+<TablixColumns>)[\r\n|<| |TablixColumn|>|Width|0-9|.|\/]+(</TablixColumns>)');
    return rdl.replace(re, '$1' + newXML + '$2');


  

}

 
 
