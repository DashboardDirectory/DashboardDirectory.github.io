
// JavaScript source code

///  atTaskServicesModule:
///         A number of general purpose functions for using AtTask Web Service functions 
///         inside the AngularJS framework. 
///
///         Main output is angularJS module 'atTaskServiceModule' and 
///             the 'atTaskWebService' angularJS service to be injected into
///             any angularJS controller that wishes to communicate with the AtTask Web service


// helper function to extract parameters from querystring.
// TODO: should go into a more suitable library.

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

var atTaskServiceModule = angular.module('atTaskServiceModule', []);

atTaskServiceModule.service('atTaskWebService', function ($http) {

    this.textToFile = function(txtContents,mimeType,fileName)
    {
        if (mimeType == null)
        {
            mimeType = 'application/text';
        }

        var theBlob = new Blob([txtContents], { type: mimeType });
        theBlob.lastModifiedDate = new Date();
        theBlob.name = fileName;

        return theBlob;
    }

   





    this.recalculateCustomValuesForProject = function (server, sessionID, projectID, callback, errorCallback) {

        var URL = 'https://' + server + '/attask/api/v7.0/proj/search?method=GET&sessionID=' + sessionID + '&ID=' + projectID + '&fields=tasks:ID';
        var cCount = 0;

        batchedLoad(URL, 1000,

        function (data) {

            data[0].tasks.map(function (t) {
                var tUrl = 'https://' + server + '/attask/api/v7.0/task/' + t.ID + '/calculateDataExtension?method=PUT&sessionID=' + sessionID;
                cCount++;

                $http.get(tUrl).then(                
                    function (data) {
                        cCount--;
                        // envoke callback function when last refresh completes
                        if (cCount == 0) {

                            callback();
                        }
                    }).error(errorCallback);

            })
        }
        , errorCallback); //batchedLoad

    }

 


    getDocObjCode = function (objectType) {
        var code;

        switch (objectType.toLowerCase()) {
            case "portfolio": code = "PORT"; break;
            case "project": code = "PROJ"; break;
            case "task": code = "TASK"; break;

        }

        return code;

    }

     crawlCustomErrors = function (deTerms,baseURL,errorTerms,callback)
     {
        var context = this;

        if (deTerms.length == 0)
        {
            callback(errorTerms);
        }
        else
        {
            var term = deTerms.shift();
            var url = baseUrl + '&fields=' + term + '&$$FIRST=1&$$LIMIT=1';

            try
            {

              $http.get(url).then(
                    function (response) {

                        if (!(typeof response.data.error === 'undefined')   )
                        { if (response.data.error != null)
                            {
                               errorTerms.push(term);
                            }
                        }

                        crawlCustomErrors(deTerms,baseURL,errorTerms,callback);

                        }
                           
                      );

            }
            catch
            {
                errorTerms.push(term);
                crawlCustomErrors(deTerms,baseURL,errorTerms,callback);

            }

        }
     }

     diagnoseCustomDataError = function (url,errorCallback)
     {
      
            var baseRegex = /(.+method=GET)/g;
            var queryMatch = regex.exec(url);
            
            if (queryMatch != null)
            {
                var query = queryMatch[1];

                var regex = /(DE:[\w| |:]+)/g;
                var deTerms = [];
                var  match = regex.exec(url);

                while (match != null)
                {
                    var term = match[1].trim;                

                    if (deTerms.filter(function(t){return t == term}).length == 0)
                    {
                        deTerms.push(term);
                    }

                    match = regex.exec(url);
                }

                if (deTerms.length > 0)
                {

                    crawlCustomErrors(deTerms,query,[],
                        function (errorTerms)
                        {
                            if (errorTerms.length > 0)
                            {
                                var errorList = error.terms.join(",").replace(/DE:/g,'');
                                callback({ error: { message: "Workfront API returned an error trying to retrieve the following custom fields: " + errorTerms}});
                            }
                            else
                            {

                             callback({ error: { message: "Workfront API returned an incomplete result.  No issues found with custom fields."}});   

                            }
                        })


                }
                else
                {
                    callback({ error: { message: "Workfront API returned an incomplete result.  No custom fields located."}});
                }
            }
            else
            {
                callback({ error: { message: "Workfront API returned an incomplete result."}});
            }
      }
    
    

 

    // Recursive call-back function to batch load data from AtTask    
    loadCascade = function (url, first, count, batchSize, cumulativeData, finalCallBack, errorCallBack, incrementalCallBack) {

        if (first < count) {
            var batchURL = url + '&$$FIRST=' + first + '&$$LIMIT=' + batchSize;

            
            try
            {

            $http.get(batchURL).then(function (response) {

                if (!(typeof response.data.error === 'undefined')   )
                { if (response.data.error != null)
                {
                    if (typeof errorCallBack === 'undefined') { finalCallBack(response.data) } else { errorCallBack(response.data)};
                }
                } else
                {

                    if(incrementalCallBack != null)
                    {
                        incrementalCallBack(response.data.data);
                    }

                    loadCascade(url, first + batchSize, count, batchSize, cumulativeData.concat(response.data.data), finalCallBack, errorCallBack, incrementalCallBack);
                } 
            }, 

            function (error)
            {
                if (error.message.indexOf("JSON") >= 0)
                {
                    diagnoseCustomDataError(url, typeof errorCallBack === 'undefined' ? finalCallBack : errorCallBack);
                }             
                else
                {
                    errorCallback(error);
                }
            }

             );

        }

        catch

        {
              diagnoseCustomDataError(url, typeof errorCallBack === 'undefined' ? finalCallBack : errorCallBack);
        }



        }
        else {
            finalCallBack(cumulativeData);
        }
    };



    // Make multiple REST calls to AtTask Webservice "url" (based on batchSize limit)
    batchedLoad = function (url, batchSize, finalCallBack, errorCallBack, incrementalCallBack) {

        if (typeof errorCallBack === 'undefined') errorCallBack = finalCallBack;

        // TODO: (Ryan) Remove need for this.
        url  = url.replace('&jsonp=JSON_CALLBACK','');

        if (url.indexOf("search?") == -1)
        {

            $http.get(url).then(
                            function (response) {

                                if (!(typeof response.data.error === 'undefined')   )
                                { if (response.data.error != null)
                                {
                                    if (typeof errorCallBack === 'undefined') { finalCallBack(response.data) } else { errorCallBack(response.data)};
                                }
                                } else
                                {
                                    finalCallBack(response.data.data)
                                }
                            }
                          ,  
                              errorCallBack
                           
                      );

        }
        else
        {
            // get rowcount query by swapping search keyword for count keyword
            var countUrl = url.replace('search?', 'count?');
            $http.get(countUrl).then(
                      function (response) {

                          if (!(typeof response.data.error === 'undefined')   )
                          { if (response.data.error != null)
                          {
                              if (typeof errorCallBack === 'undefined') { finalCallBack(response.data) } else { errorCallBack(response.data)};
                          }
                          } else
                          {
                              // Kick off cascading recursive function that accumulates batch records and then makes callback when done
                              loadCascade(url, 0, response.data.data.count, batchSize, [], finalCallBack, errorCallBack, 
                           (incrementalCallBack != null ?                              
                              function (iData) { 
                                  iData.totalCount = response.data.data.count; 
                                  iData.batchSize = batchSize; 
                                  incrementalCallBack(iData) }:null));                            
                         }
                      }                  
            
            ,  
            errorCallBack
             
                );
        }

    };

    this.atTaskPutJsonp = function (url, callback, error) {
        if (url.indexOf("&jsonp") == -1) url += "&jsonp=JSON_CALLBACK";
        $http.jsonp(url).then(callback, error);
    }

    this.atTaskPut = function (url, $bodyParams, callback, error) {    

        if (typeof $bodyParams === 'function')
        {
            error = callback;
            callback = $bodyParams;
            $bodyParams = null;
            $http.get(url).then(callback,error);
        }
        else if (url.indexOf("DELETE") > 0 )
        {
              var config = {
               headers : {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
                }
                }

            $http.post(url,$bodyParams.join(""),config).then(callback, error);
        } 
        else
        {
            $http.put(url, $bodyParams).then(callback, error);
        }
    }


    


    this.atTaskErrorStepBulkUpdate = function (objType, url, updates, callback, error, results)
    {
        var context = this;
        var item = {};
        if (results == null)
            results = [];

        if (updates.length == 0) {
            callback(results);
            return;
        }

        var success = function (r) {
            if (!(typeof r.data.error === 'undefined')) {
                if (r.data.error != null) {
                    if (r.data.error.message == 'category cannot be null' || r.data.error.message.indexOf('Invalid Parameter') != -1)
                        results.push({ type: objType, updates: r.config.url, comments: 'ERROR. This record is missing a required custom form assigment.', batch: itm});
                    else
                        results.push({ type: objType, updates: r.config.url, comments: 'ERROR. ' + r.data.error.message , batch: itm});

                    context.atTaskErrorStepBulkUpdate(objType, url, updates, callback, error, results);
                }
                // hmmm - won't the recursive call chain be broken if r.data.error is null?
            }
            else {
                results.push({ type: objType, comments: 'UPDATES', updates: r.config.url , batch: itm });
                context.atTaskErrorStepBulkUpdate(objType, url, updates, callback, error, results);
            }

        };

        var fail = function(r){
            if (!(typeof r.data.error === 'undefined')) {
                if (r.data.error != null) {
                    if (r.data.error.message == 'category cannot be null' || r.data.error.message.indexOf('Invalid Parameter') != -1)
                        results.push({ type: objType, updates: r.config.url, comments: 'ERROR. This record is missing a required custom form assigment.' , batch: itm});
                    else
                        results.push({ type: objType, updates: r.config.url, comments: 'ERROR. ' + r.data.error.message, batch: itm });

                    context.atTaskErrorStepBulkUpdate(objType, url, updates, callback, error, results);
                }
                // hmmm - won't the recursive call chain be broken if r.data.error is null?
            }
            else {
                error(r);
            }
        }


        itm = updates.shift();
        this.atTaskPut(url, itm, success, fail);
    }


    this.atTaskBulkUpdate = function (objType, url, updates, callback, error, results) {
        // TODO: (Ryan) This code assumes the url already has method=PUT and Session_id in the query string
        var context = this;
        if (results == null)
            results = [];

        if (updates.length == 0) {
            callback(results);
            return;
        }

        var MAX_BATCH_SIZE = 100;
        var batch = [];
        while (updates.length > 0 && batch.length < MAX_BATCH_SIZE) {
            batch.push(updates.shift());
        }

        var success = function (r) {
            var incrementalCallback = function () {
                context.atTaskBulkUpdate(objType, url, updates, callback, error, results);
            }
            if (!(typeof r.data.error === 'undefined')) {
                if (r.data.error != null) {
                    if (r.data.error.message == 'category cannot be null' || r.data.error.message.indexOf('Invalid Parameter') != -1) {
                        results.push({ type: objType, updates: r.config.url, comments: 'ERROR. Bulk update failed. One or more records are missing a required custom form attachment. Re-running update one record at a time...', batch:batch });
                    }
                    else {
                        results.push({ type: objType, updates: r.config.url, comments: 'ERROR. Bulk update failed. Stepping each item one at a time. Message:' + r.data.error.message });
                    }

                    // switch to update one row at a time mode
                    context.atTaskErrorStepBulkUpdate(objType, url, batch, incrementalCallback, error, results);
                }
                // hmmm - recursive call chain is broken here when r.data.error is null
            }
            else {
                results.push({ type: objType, comments: 'UPDATES', updates: r.config.url, batch:batch });
                incrementalCallback();
            }
        }

        var fail = function(r){
            var incrementalCallback = function () {
                context.atTaskBulkUpdate(objType, url, updates, callback, error, results);
            }
             // switch to update one row at a time mode
             context.atTaskErrorStepBulkUpdate(objType, url, batch, incrementalCallback, error, results);
        }
        
        this.atTaskPut(url, batch, success, fail);
    }




    this.atTaskInternalObjectGet = function (url, success, error) {

            $http.get(url).then(success,error);

    }


    this.atTaskGet = function (url, finalCallBack, errorCallBack, incrementalCallBack) {
        batchedLoad(url, 1000, finalCallBack, errorCallBack, incrementalCallBack);

    }

    this.atTaskBatchGet = function (atTaskInstance, atTaskObject, sessionId, filter, fields, finalCallBack, errorCallBack, incrementalCallBack) {
        var url = 'https://' + atTaskInstance + '/attask/api-internal/' + atTaskObject + '/search?method=GET' + filter + '&sessionID=' + sessionId + '&fields= ' + fields;
        batchedLoad(url, 1000, finalCallBack, errorCallBack, incrementalCallBack);
    }



    function atTaskExpandSetForIDFilter(loadSet, idName, idListOrig) {
        // Takes a loadSet Query, a list of WorkFront ID's, and the name of the identifier, and breaks the query, if needed, into smaller 
        //  queries that can be processed using JSONP with limited http query header length limits.  (set to 1500).

        var maxQuerySize = 1500;
        var tmpEndQuery = idName + "_Mod=in";
        var idList = idListOrig.concat([]);

        var len = loadSet.query.length + tmpEndQuery.length + 1;

        var returnQuery = [];
        var tmpQuery = "";

        while (idList.length > 0) {
            while (len <= maxQuerySize && idList.length > 0) {
                var head = "&" + idName + "=" + idList.shift();
                tmpQuery += head;
                len += head.length;
            }

            returnQuery.push({ dataSetName: loadSet.dataSetName, query: loadSet.query + tmpQuery + "&" + tmpEndQuery });
            var len = loadSet.query.length + tmpEndQuery.length + 1;
            tmpQuery = "";

        }

        return returnQuery;

    }

    this.atTaskLoadSetWithIdFilters = function (loadSet, idName, idList, finalCallBack, errorCallBack,incrementalCallBack) {
        var totalLoadSet = [];

        loadSet.map(function (ls) {
            totalLoadSet = totalLoadSet.concat(atTaskExpandSetForIDFilter(ls, idName, idList));
        });

        this.atTaskLoadSet(totalLoadSet, finalCallBack, errorCallBack,incrementalCallBack);

    }


    this.atTaskLoadSet = function (loadSet, finalCallBack, errorCallBack,incrementalCallBack) {
        // loadset = [{'dataSetName' : name , 'query' : query}]
        // results = {name1 : [data1], name2 : [data2] ... }

        var results = {};
            

        loadSet.map(function (itm) { itm["loaded"] = false; results[itm.dataSetName] = []; });

        // make parallel batch loads of all dataSets, perform call back when last set is completed.
        loadSet.map(
            function (itm, i, arr) {
                itm.batchCount = 0;
                batchedLoad(itm.query, 1000,
                    function (data) {
                        itm.loaded = true;
                    
                        results[itm.dataSetName] = results[itm.dataSetName].concat(data);
                        if (arr.filter(function (itm2) { return (itm2.loaded == false) }).length == 0) {
                            finalCallBack(results);
                        }
                    }
                , errorCallBack, (incrementalCallBack != null ?                    
                function (iData)
                {
                    iData.dataSetName = itm.dataSetName;
                    iData.batchCount = itm.batchCount++;
                    incrementalCallBack(iData);
                }:null))
            })
    }



this.atTaskStepUpdateCustomFields = function(objType,url,obj,singleFieldMode,chunkData,callback,error)
{
    var id = obj.ID;
    var baseFields = {};
    var custFields = [{}];
    var maxSize = 3000;
    var i = 0;
    var totSize = 0;
    var context = this;


    for (var fld in obj)
    {
        if (fld.indexOf("DE:") > -1 && fld != "ID")
        { 
    
            if (totSize + JSON.stringify(obj[fld]).length + 1 > maxSize || singleFieldMode)
            { 
                i++;
                custFields[i] = {};
                totSize = 0;
            }

            totSize += JSON.stringify(obj[fld]).length + 1;

            custFields[i][fld] = obj[fld];
        } 
        else if (fld != "ID")
        {
            baseFields[fld] = obj[fld];
        }

    }

    putCustomFields = function (url, ID, custFields,chunkData,callback,error)
    {
        if (custFields.length > 0)
        {
            var custField = custFields.shift();
            custField['ID'] = ID;

            var tmpURL = url + '&updates=[' + JSON.stringify(custField).replace(/%/g, '%25').replace(/&/g, '%26').replace(/#/g,'%23').replace(/\+/g,'%2B') + ']';

            context.atTaskPut(tmpURL , function (results) {
                chunkData.push({type:objType,comments:'UPDATE (Long Text)',updates:results.config.url});              
                putCustomFields(url,ID,custFields,chunkData,callback,error);  
            }, function (error) {
                chunkData.push({type:objType,comments:'Error',updates:error});
                putCustomFields(url,ID,custFields,chunkData,callback,error);
            });


        }
        else
        {
            callback(chunkData);
        }
    }

    var tmpURL = JSON.stringify(baseFields);
    if ( tmpURL != "{}")
    {
        baseFields[ID] = ID;

        tmpURL = tmpURL.replace(/%/g, '%25').replace(/&/g, '%26').replace(/#/g,'%23').replace(/\+/g,'%2B');

        tmpURL = url + '&updates=[' + tmpURL + ']';

        context.atTaskPut(tmpURL, function (results) { 
            chunkData.push({type:objType,comments:'UPDATE (Long Text)',updates:results.config.url});             
            putCustomFields(url,ID,custFields,chunkData,callback,error);                          
        }, error);

    }
    else
    {
        putCustomFields(url,id,custFields,chunkData,callback,error); 
    }

}




 

    //Given a folder path, and an AtTask objectType, server, session, and optional document parent:
    //    1) identify whether full path exists 2) create any subdirectories needed to build out path
    //    3) Return ID of the end folder of the full path

    this.createOrGetFolderPath = function (id, objectType, path, server, session, parentId, callback, errorCallback) 
    {
        var paths = path.split('\\');
        var context = this;


                    createDirectory = function (id, objectType, dirName, server, session, parentId, callback, errorCallback) 
                {
                    var URL = 'https://' + server + '/attask/api/v7.0/docfdr?method=POST&sessionID=' + session +
                                           '&updates=[{ID:"",name:"' + dirName + '",' + objectType + 'ID:"' + id + '"';

                    if (!(typeof parentId === 'undefined')) {
                        URL += ',parentID:"' + parentId + '"';
                    }
                    URL += '}]';

                   context.atTaskPut(URL,
                        function (data) 
                        {
                            callback(data.data.data[0].ID)
                        },    errorCallback    );

                }


        if (paths.length > 1) {
            // If path has subdirs, get the ID of the head element and recurse on tail, passing the head element
            // id along to the recursion.  Pass along incoming callback function to return bottom level Id when found/made

            var head = paths[0]; paths.shift();
            var tail = paths.join('\\');

            this.createOrGetFolderPath(id, objectType, head, server, session, parentId,
              function (dirId) {
                  context.createOrGetFolderPath(id, objectType, tail, server, session, dirId, callback, errorCallback);
              }

    );
        }
        else {      // Dealing with single folder level.  See if it exists

            var URL = 'https://' + server + '/attask/api/v7.0/docfdr/search?method=GET&sessionID=' + session +
                       '&name=' + path + '&securityRootID=' + id;

            if (!(typeof parentId === 'undefined')) {
                URL += '&parentID=' + parentId;
            }

            this.atTaskGet(URL,
                 function (data) {
                     if (data.length > 0) {
                         // Base return case for existing folder

                         callback(data[0].ID);
                     }
                     else {
                         // Base create case for non-existant folder.

                          createDirectory(id, objectType, path, server, session, parentId, callback, errorCallback);
                     }
                 }
             ,errorCallback);
        }
    };

})  

