

var server;
var apiVer;
var atTaskWebService;
var lastRun;
var calculationRules = [];
var incrementalRun = false;

function CreateFilterFieldString(filters, separator) {

    if (separator == null)
        separator = '&';

    if (typeof filters == "object") {
        if (Object.prototype.toString.call(filters) == '[object Array]') {
            return filters.reduce(function (a, b) { return CreateFilterFieldString(a, separator) + separator + CreateFilterFieldString(b, separator) });
        }
        else {
            var filter = "";
            var def = filters;
            for (itm in def) {
                def[itm] = def[itm].replace(/&/g, '%26').replace(/%/g, '%25');
                filter += separator + def[itm].split('\t').map(function (str) { return itm + '=' + str }).join(separator);
            }

            if (filter.length > 0)
                filter = filter.substr(1, filter.length);

            return filter;

        }
    }
    else
        return filters;

}



function WorkfrontBulkUpdate(objType, updates, success, error) {
    if (calcMode == "angular") {
        var URL = server + apiVer + objType + "?method=PUT&sessionID=" + sessionID;
        
        atTaskWebService.atTaskBulkUpdate(objType,URL, updates, success, error);
        
    }

}



function WorkfrontGetPowerSearch(objType, filters, fields, powerSearch, executeIncremental, success, error) {

    if (calcMode == "angular") {
        var URL = server + apiVer + objType + "/search?method=GET&sessionID=" + sessionID + '&' +
        CreateFilterFieldString(filters) + '&' + powerSearch + CreateFilterFieldString(fields, ",");
            atTaskWebService.atTaskGet(URL, success, error);
    }
}



 

function WorkfrontGetUserFilter(filterName, objType, success, error) {

    if (calcMode == "angular") {
       //var URL = server + '/attask/api-internal/uift/filtersForObjCode?method=GET&filterType=STANDARD&objCode=' +
       //objType.toUpperCase() + '&sessionID=' + sessionID + '&fields=definition&jsonp=JSON_CALLBACK';

        var URL = server + '/attask/api/v5.0/uift/search?method=GET&name=' + encodeURI(filterName) 
              + '&sessionID=' + sessionID 
              +'&uiObjCode='+ objType.toUpperCase() 
              +'&fields=definition&jsonp=JSON_CALLBACK';

        atTaskWebService.atTaskGet(URL,

function (response) {

if (typeof response.error === 'undefined' && response.length > 0)
{
success(response[0].definition);
}
else if (typeof response.error === 'undefined')
{
  error('An error without response has occured - Possibly undeclared custom field.');
} 
else
{
error(response.error);
}

//    success(response.data.data.filter(function (d) { return d.name == filterName })[0].definition);

}, error);
    }

}


function WorkfrontGetUserView(viewName, objType, success, error) {

    if (calcMode == "angular") {
       // var URL = server + '/attask/api-internal/uivw/viewsForObjCode?method=GET&objCode=' +
       // objType.toUpperCase() + '&sessionID=' + sessionID + '&fields=definition&jsonp=JSON_CALLBACK';
   var URL = server + '/attask/api/v5.0/uivw/search?method=GET&name=' + encodeURI(viewName) 
              + '&sessionID=' + sessionID 
              +'&uiObjCode='+ objType.toUpperCase() 
              +'&fields=definition&jsonp=JSON_CALLBACK';

        atTaskWebService.atTaskGet(URL,

function (response) {

if (typeof response.error === 'undefined')
{

if (response.length == 0)
{
error({message:"The selected View name '"+ viewName +"' does not exist, or has no columns"});
}
else
{    
var itms = response[0].definition.column.map(function (f) 

    { 
        return (f.valueformat.match(/custom.+/) != null ? 'DE:' + f.valuefield : f.valuefield).replace(/&/g, '%26'); 
    }); 
    success(itms);
}
}
else
{
error(response);
}
}, error);
    }
}

function WorkfrontPut(objType,objID,updates, callback, error)
{
    if (calcMode == "angular")
    {
        var URL = server + apiVer + objType + "?ID=" + objID + "&method=PUT&sessionID=" + sessionID + '&updates=' + updates + '&jsonp=JSON_CALLBACK';
       
        atTaskWebService.atTaskPut (URL, callback, error) ;

    }
}


function WorkfrontGet(objType, filters, fields, success, error) {
    WorkfrontGetPowerSearch(objType, filters, fields, 'fields=', false, success, error);
}

function WorkfrontLoadSetWithIdFilters(objType, loadSet, idName, idList, finalCallBack, errorCallBack) {

    if (calcMode == "angular") {
        loadSet.map(function (ls) {
            ls.query = server + apiVer + objType + "/search?method=GET&sessionID=" + sessionID + '&' + ls.query + '&jsonp=JSON_CALLBACK';
        });
        atTaskWebService.atTaskLoadSetWithIdFilters(loadSet, idName, idList, finalCallBack, errorCallBack);
    }

}

function translateWFDate(wfDateString)
{
    return (new Date(wfDateString.replace(/:(\\d\\d\\d)/g, ".$1")));
}


function GetIncrementalData(filterClause, fieldList, lastUpdated, callback, error, logMessage) {

    var qry = "";
    var qryIncr;
    var incField;
 

    if ( typeof calculationRule.configuration.sourceObjIncrementalDate === 'undefined')
    {
        incField = "lastUpdateDate";
    }
    else
    {
        incField = calculationRule.configuration.sourceObjIncrementalDate;
    }

    var incFilter = incField + "=" + lastUpdated + "&" + incField + "_Mod=gt&fields=" + incField;


    callback({calculation: calculationRule.name , comments:'Running Calculation ' + calculationRule.name + '.  Looking for updates since last run.'},false);

    if (!(typeof calculationRule.configuration.sourceQuery === 'undefined') && calculationRule.configuration.sourceQuery != null) {
        qry = calculationRule.configuration.sourceQuery;
        qryIncr = qry + '&' + incFilter + (fieldList == null ? '' : ',');
    }
    else {
        qryIncr = incFilter + (fieldList == null ? '' : ',');
    }

    
    WorkfrontGetPowerSearch(calculationRule.configuration.sourceObjType, filterClause, fieldList, qryIncr, incrementalRun,

    function (response) {
        var targetList = [];
        var uniqueTargets = [];
        var maxUpdate = new Date('2001-01-01');

        if (response.length == 0)
{
            
            callback({calculation: calculationRule.name , comments: 'No Records Updated Since Last Run. Nothing to calculate.'},true);
            cascadeCalculationRules(callback,error);
} 
       else
            callback({calculation: calculationRule.name , comments: response.length + ' records found.  Running Calculations... '},false);
        if (new Date(lastUpdated).getFullYear() > 2001 && incrementalRun ) 
        {
            calculationRule.configuration.operations.map(function (o) {


                response.map(function (r) {

                    var incDate;

                    if (incField.indexOf(":") != -1)
                    {
                        incDate = incField.split(":").reduce(function(pv,cv){ return pv[cv] },r);
                      
                    }
                    else
                    {
                      incDate = r[incField];
                    }

                    var jsonDate = incDate.replace(/:(\d\d\d)/g, ".$1");
                    var rDate = new Date(jsonDate);
                    if (rDate > maxUpdate)
                    {
                        maxUpdate = rDate;
                    }

                    var toLinkBy 

                    if (o.targetObjLinkBy.indexOf(":") >= 0)     
                        toLinkBy = o.targetObjLinkBy.split(":").reduce(function(pv,cv){ return pv[cv] },r);
                    else
                        toLinkBy = r[o.targetObjLinkBy];

                    if (targetList.filter(function (t) { 


                    return (t.ID == toLinkBy) }).length == 0 && toLinkBy != null) {
                        targetList.push({ type: o.targetObjType, linkBy: o.targetObjLinkBy, ID: toLinkBy });

                        if (uniqueTargets.filter(function (u) { return (u.type == o.targetObjType && u.linkBy == o.targetObjLinkBy) }).length == 0)
                            uniqueTargets.push({ type: o.targetObjType, linkBy: o.targetObjLinkBy });


                    }
                })

        
            

                qry = CreateFilterFieldString(filterClause) + '&' + qry + (fieldList != null ? '&fields=' + CreateFilterFieldString(fieldList, ",") : '');


                uniqueTargets.map(function (u) {
                    var loadset = [{ 'dataSetName': 'aggregations', 'query': qry }];
                    var idList = targetList.filter(function (t) { return (t.type == u.type && t.linkBy == u.linkBy) }).map(function (i) { return i.ID });

                    //var objLink = u.linkBy.replace(/\./g,":");
                    WorkfrontLoadSetWithIdFilters(calculationRule.configuration.sourceObjType, loadset, u.linkBy, idList,

                   function (response) {
                       calculateAggregation(response.aggregations, maxUpdate,callback,error,logMessage,incrementalRun);
                   }
                       , error);
                }

                )
            
         
            }            
       
        );
        }
        else
        {
            calculateAggregation(response, maxUpdate,callback,error,logMessage,incrementalRun);
        }

    }

    , function (response)
        {
        callback({calculation: calculationRule.name , comments:'ERROR',error:response,},true);
        }
)

}

function updateLastRunTime(lastUpdateDate,callback,error)
{ 
  if (calculationRule.configuration.operations[0].targetObjType == calculationRule.configuration.sourceObjType)
    {
     lastUpdateDate = new Date();
    }
else
{
  lastUpdateDate = new Date(lastUpdateDate);
}
 
  if (lastUpdateDate.getFullYear() > 2001)
{
    lastUpdateDate.setSeconds(lastUpdateDate.getSeconds() + 1);
    var update = '{"' + timerVarName + '":"' + lastUpdateDate.toJSON() + '"}';

    WorkfrontPut(timerObjType,timerObjID,  update, callback,error); 
}
else
{ 
callback();
}
}


function calculateAggregation(response, lastUpdateDate,callback,error,logMessage,executeIncremental ) {
    output = lastUpdateDate;

    data = response; //.aggregations;


    var calcConfig = calculationRule.configuration;
    var calcArray = [];
    var source = []
    var aggValue;
    var updates = [];
    var objects = [];

    calcConfig.operations.map(function (calc) {

        if (calc.calcType == "Sum")
            calc.calcCode = "source.reduce(function(a,b){return a + b},0)";
        else
            if (calc.calcType == "Count")
                calc.calcCode = "source.length";
            else
                if (calc.calcType == "Min")
                    calc.calcCode = "source.reduce(function(a,b){return (a < b ? a : b)})";
                else
                    if (calc.calcType == "Max")
                        calc.calcCode = "source.reduce(function(a,b){return (a > b ? a : b)})";
                    else
                        if (calc.calcType == "Avg")
                            calc.calcCode = "(source.length > 0 ? source.reduce(function(a,b){return a + b})/source.length : 0)";



       

        var dVar = "d";
        calc.targetObjLinkBy = calc.targetObjLinkBy.replace("DE:","DE|");
        calc.targetObjLinkBy.split(":").map(function (s) { dVar += "['" + s + "']" });
        calc.linkPath = calc.targetObjLinkBy.split(":").map(function(x){return x.replace("DE|","DE:")});
        dVar = dVar.replace("DE|","DE:");
        calc.evalLinkID = dVar;

        if (!(typeof calc.field === 'undefined'))
        {
        calc.sourcePath = calc.field.replace("DE:","DE|").split(":").map(function(x){return x.replace("DE|","DE:")});
        }


        data.map(function (d) {d.aggObjId = calc.linkPath.reduce(function(pv,cv)
            {
              if (pv == null) 
                 return null; 
              else 
                 return pv[cv];
             },d) });

        data.map(function (d) {
            if (updates.filter(function (t) {
               
                  
                return t.ID == d.aggObjId && t.objType == calc.targetObjType
            }
                              ).length == 0 && d.aggObjId != null ) {
                updates.push({ ID: d.aggObjId, objType: calc.targetObjType });

                if (objects.filter(function (o) { return o.type == calc.targetObjType }).length == 0)
                    objects.push({ type: calc.targetObjType });
            }
        });

    });

    var remainingUpdates = objects.length;
    var itemCount = 0;
    var updateCount = 0;
    var updatedItems = [];

    objects.map(function (o) {
        updates.filter(function (f) { return f.objType == o.type }).map(function (u) {


            u["updateClause"] = { ID: u.ID };


            calcConfig.operations.filter(function(op){return op.targetObjType == o.type}).map(function (calc) {


                if (calc.calcType != "Custom") {
                    calcArray = data.filter(function (d) { return calc.linkPath.reduce(function(pv,cv){ if (pv == null) return null; else return pv[cv];},d) == u.ID });

                    if (calc.expression != null && calc.expression != "") {
                        calc.expression = calc.expression.replace(new RegExp( calcConfig.sourceObjType + "()","g" ), "d$1");
                        calcArray = calcArray.filter(function (d) { return eval(calc.expression) });
                    }

                    source = calcArray.map(function (d) { return  calc.sourcePath.reduce(function(pv,cv){if (pv == null) return null; else return pv[cv];},d)});


                    
                    aggValue = eval(calc.calcCode);
                    if (calc.decimals != null && calc.decimals != "") 
                    {
                    aggValue = aggValue.toFixed(calc.decimals);
                    }
                    u[calc.target] = aggValue;
                    u.updateClause[calc.target] = aggValue;
                }
                else {
                    source = data.filter(function (d) { return calc.linkPath.reduce(function(pv,cv){if (pv == null) return null; else return pv[cv];},d) == u.ID });
                    target = { ID: u.ID };

                    eval(calc.calcCode);

                    u.updateClause = target;
                }
            }); // updates

        }); // operations

        WorkfrontBulkUpdate(o.type, updates.filter(function (f) { return (f.objType == o.type && f.updateClause.ID != null) }).map(
           function (u) { 
               itemCount++;
               
               return u.updateClause }),
        function (results) {
             updateCount += results.length;
            callback(updatedItems.concat(results.map(function(r){  return {calculation: calculationRule.name , comments: r.comments, type:r.type,updates:'<a target="_blank" href=' + encodeURI(r.updates) + '>query</a>'}}) ),false);
            remainingUpdates--;
            if (remainingUpdates == 0 )
            {
                lastRun = lastUpdateDate.toJSON().substring(0,19);
                //callback(updatedItems.concat(results.map(function(r){  return {calculation: calculationRule.name , comments: r.comments, type:r.type,updates:'<a target="_blank" href=' + encodeURI(r.updates) + '>query</a>'}}) ),false);
                callback({calculation: calculationRule.name , comments:'Updates Complete.'},false);

                cascadeCalculationRules(callback,error);
            }


        },
        error);


    })
}

function cascadeCalculationRules(callback,error)
{
    if (calculationRules.length > 0)
    { 
        calculationRule = calculationRules.shift();

        if (!(typeof calculationRule.configuration.sourceObjFilter === 'undefined') && calculationRule.configuration.sourceObjFilter != null && calculationRule.configuration.sourceObjFilter != "") 
        {
            WorkfrontGetUserFilter(calculationRule.configuration.sourceObjFilter, calculationRule.configuration.sourceObjType,
          function (userFilter) {


              if (!(typeof calculationRule.configuration.sourceObjView === 'undefined') && calculationRule.configuration.sourceObjView != null) {
                  WorkfrontGetUserView(calculationRule.configuration.sourceObjView, calculationRule.configuration.sourceObjType,

                  function (viewFields) {
                      GetIncrementalData(userFilter, viewFields, lastRun, callback, error);
                  }

           , function (response)
    {      
          callback({calculation: calculationRule.name , comments:'ERROR',error:response,},true);
    }
);
              }
              else
                  GetIncrementalData(userFilter, null, lastRun,  callback, error);




          }
          , error)

        }
        else
            GetIncrementalData(null, null, lastRun, callback, error);



    }
    else
    {
        callback({  comments:'Updating Last Incremental Date after all calculation steps.'},false);
        updateLastRunTime(lastRun,function(data) {
            callback({  comments:'Calculation Complete.'},true);
        },error);

    }
}

function runAggregation(sessionID,host,api,webSvc,data,callback,error,fullRun) {

    atTaskWebService = webSvc;
    server = "https://" + host;
    apiVer = api;
    calcMode = "angular";            
    var lastCal;
        
    timerObjName = data.timerObjName;
    timerVarName = data.timerVarName;
    timerObjType = data.timerObjType;
    timerObjID = "";

    if (typeof data.calculationRules === 'undefined')    
    {
        calculationRules = [data.calculationRule];
    }
    else
    {
        calculationRules = data.calculationRules.sort(function(a,b) { return a.runOrder - b.runOrder}).slice();  
    }

    lastCalc = calculationRules[0].name ;
 
    callback({calculation: calculationRules[0].name , comments:'Checking last incremental run time'},false);

    WorkfrontGet(timerObjType, { name: timerObjName }, timerVarName,
    function (data) { 

        if (typeof data.error === 'undefined')
        {      
        lastRun = data[0][timerVarName].substring(0,19);
        
        
        incrementalRun = !fullRun;

        if (fullRun == true){
            lastRun = new Date('2000-01-01').toJSON().substring(0,19);
            
            callback({calculation: calculationRules[0].name , comments:'Full Run Requested, getting all matching records...'},false);
        }

        timerObjID = data[0].ID;

        cascadeCalculationRules(callback,

function (response)
    {      
          callback({calculation: lastCalc , comments:'ERROR',error:response,},true);
    }
);
        }
        else
          callback({calculation: lastCalc , comments:'Error Encountered:',error:data.error},true);

    })}