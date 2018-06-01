
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

var atTaskServiceModule = angular.module('atTaskServiceModule', ['ngFileUpload']);

atTaskServiceModule.service('atTaskWebService', function ($http,Upload) {

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

  
    ngUploadToWorkfrontTemp = function(server,file,sessionID,objType,objId,successCallBack,errorCallBack)
    {
        var tmpUrl = "https://" + server + "/documents/uploadTemp";


        Upload.upload({
            url: tmpUrl,
            headers: {sessionID:sessionID},
            data: {objID:objId, docObjCode: objType,
                file: file
            },
        }).then(function (response) {            
            successCallBack(response.data.handle);
        }, function (response) {
            errorCallBack(response);
        }) ;

    }

 


    createDirectory = function (id, objectType, dirName, server, session, parentId, callback, errorCallback) {


        var URL = 'https://' + server + '/attask/api/v7.0/docfdr?method=POST&sessionID=' + session +
                               '&updates=[{ID:"",name:"' + dirName + '",' + objectType + 'ID:"' + id + '"';

        if (!(typeof parentId === 'undefined')) {
            URL += ',parentID:"' + parentId + '"';
        }
        URL += '}]';

        $http.jsonp(URL + '&jsonp=JSON_CALLBACK').success(
    function (data) {

        callback(data.data[0].ID);

    }).error(
    errorCallback
    );

    }



    //Given a folder path, and an AtTask objectType, server, session, and optional document parent:
    //    1) identify whether full path exists 2) create any subdirectories needed to build out path
    //    3) Return ID of the end folder of the full path

    createOrGetFolderPath = function (id, objectType, path, server, session, parentId, callback, errorCallback) {
        var paths = path.split('\\');

        if (paths.length > 1) {
            // If path has subdirs, get the ID of the head element and recurse on tail, passing the head element
            // id along to the recursion.  Pass along incoming callback function to return bottom level Id when found/made

            var head = paths[0]; paths.shift();
            var tail = paths.join('\\');

            createOrGetFolderPath(id, objectType, head, server, session, parentId,
              function (dirId) {
                  createOrGetFolderPath(id, objectType, tail, server, session, dirId, callback, errorCallback);
              }

    );
        }
        else {      // Dealing with single folder level.  See if it exists

            var URL = 'https://' + server + '/attask/api/v7.0/docfdr/search?method=GET&sessionID=' + session +
                       '&name=' + path + '&securityRootID=' + id;

            if (!(typeof parentId === 'undefined')) {
                URL += '&parentID=' + parentId;
            }

            $http.jsonp(URL + '&jsonp=JSON_CALLBACK').success(
                 function (data) {
                     if (data.data.length > 0) {
                         // Base return case for existing folder

                         callback(data.data[0].ID);
                     }
                     else {
                         // Base create case for non-existant folder.

                         createDirectory(id, objectType, path, server, session, parentId, callback, errorCallback);
                     }
                 }
             ).error(errorCallback);
        }
    };
 
    attachHandle = function (server, session, filename, handle, objID, objectType, folderID, callback, errorCallback) 
    {
        var URL = 'https://' + server + '/attask/api/v7.0/document?method=POST&sessionID=' + session +
                    '&updates ={{name:"' + filename + '",handle:"' + handle +
                     '",docObjCode:"' + objectType +
                     '",objID:"' + objID + '", ' +
                     (folderID == null ? '' : 'folders=[{ID:"' + folderID +'"}],') +
                 'currentVersion:{{version:"v1.0",filename:"' + filename + '"}} }}';

        $http.jsonp(URL + '&jsonp=JSON_CALLBACK').success(callback).error(errorCallback);


    };

 
    this.uploadFile = function (file, filename, id, objectType, path, server, session, callback, errorCallback) {

        if (path != '')
        {

            createOrGetFolderPath(id, objectType, path, server, session, null,
                function (parentID) {
                    ngUploadToWorkfrontTemp(server,file,session,objectType,id, 
                        function (handle) {
                            attachHandle(server, session, filename, handle, id, objectType,parentID,callback, errorCallback);
                        },
                        errorCallback);
                }

            , errorCallback);
        }
        else
        {
            ngUploadToWorkfrontTemp(server,file,session,objectType,id, 
                            function (handle) {
                                attachHandle(server, session, filename, handle, id, objectType,null,callback, errorCallback);
                            },
                            errorCallback);

        }

    }






    this.recalculateCustomValuesForProject = function (server, sessionID, projectID, callback, errorCallback) {

        var URL = 'https://' + server + '/attask/api/v7.0/proj/search?method=GET&sessionID=' + sessionID + '&ID=' + projectID + '&fields=tasks:ID';
        var cCount = 0;

        batchedLoad(URL, 1000,

        function (data) {

            data[0].tasks.map(function (t) {
                var tUrl = 'https://' + server + '/attask/api/v7.0/task/' + t.ID + '/calculateDataExtension?method=PUT&sessionID=' + sessionID;
                cCount++;

                $http.jsonp(tUrl + '&jsonp=JSON_CALLBACK').success(
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

     


    // Recursive call-back function to batch load data from AtTask    
    loadCascade = function (url, first, count, batchSize, cumulativeData, finalCallBack, errorCallBack, incrementalCallBack) {

        if (first < count) {
            var batchURL = url + '&$$FIRST=' + first + '&$$LIMIT=' + batchSize;

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
            }, errorCallBack

             );

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
                          , function (response) {
                              errorCallBack
                          }
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
            
            , function (response) {
            errorCallBack
            }
                );
        }

    };

    this.atTaskPutJsonp = function (url, callback, error) {
        if (url.indexOf("&jsonp") == -1) url += "&jsonp=JSON_CALLBACK";
        $http.jsonp(url).then(callback, error);
    }

    this.atTaskPut = function (url, $bodyParams, callback, error) {     
        $http.put(url, $bodyParams).then(callback, error);
    }


    this.atTaskPutWithBodyExample = function () {
        //var $allUrl="https://mbiinc.preview.workfront.com/attask/api/v7.0/project?method=PUT&sessionID=c72d0eb145ff4fc89d282dc46ffe9929&updates={ name :'MM TEST2' }&ID=58ee774300b51b98b89d7294c23f6cfa";
        var $lesserMostUrl="https://mbiinc.preview.workfront.com/attask/api/v7.0/project?method=PUT&sessionID=c72d0eb145ff4fc89d282dc46ffe9929";
        
        var $data = "{name : 'RM TESTY', ID : '58ee774300b51b98b89d7294c23f6cfa'}";
        $http.put($lesserMostUrl, $data).then( function(response){
            alert('put finished successfully');
        }, function(response) {
            alert('put request failed!');
        });     
    }


    this.atTaskErrorStepBulkUpdate = function (objType, url, updates, callback, error, results)
    {
        var context = this;
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
                        results.push({ type: objType, updates: r.config.url, comments: 'ERROR. This record is missing a required custom form assigment.' });
                    else
                        results.push({ type: objType, updates: r.config.url, comments: 'ERROR. ' + r.data.error.message });

                    context.atTaskErrorStepBulkUpdate(objType, url, updates, callback, error, results);
                }
                // hmmm - won't the recursive call chain be broken if r.data.error is null?
            }
            else {
                results.push({ type: objType, comments: 'UPDATES', updates: r.config.url });
                context.atTaskErrorStepBulkUpdate(objType, url, updates, callback, error, results);
            }

        };

        this.atTaskPut(url, updates.shift(), success, error);
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
            batch.push(JSON.stringify(updates.shift(), null, ' '));
        }

        var success = function (r) {
            var incrementalCallback = function () {
                context.atTaskBulkUpdate(objType, url, updates, callback, error, results);
            }
            if (!(typeof r.data.error === 'undefined')) {
                if (r.data.error != null) {
                    if (r.data.error.message == 'category cannot be null' || r.data.error.message.indexOf('Invalid Parameter') != -1) {
                        results.push({ type: objType, updates: r.config.url, comments: 'ERROR. Bulk update failed. One or more records are missing a required custom form attachment. Re-running update one record at a time...' });
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
                results.push({ type: objType, comments: 'UPDATES', updates: r.config.url });
                incrementalCallback();
            }
        }
        
        this.atTaskPut(url, batch, success, error);
    }




    this.atTaskInternalObjectGet = function (url, success, error) {

        if(url.indexOf("jsonp") == -1) url += "&jsonp=JSON_CALLBACK";

        $http.jsonp(url).then(success,error);

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

})  
// JavaScript source code
