 

var ATTASK_INSTANCE = 'www.attasksandbox.com';   
var isLoaded = false; 
var host = getParameterByName("host");
var credential = getParameterByName("credential");
var sessionID = getParameterByName("s");
var objID = getParameterByName("objID");
var userSessionID = sessionID;            
var showDownload = false ;
var ext =  getParameterByName("ext");
var showToolbox = getParameterByName("toolbox");
var uberForm = getParameterByName("uberForm");
var showReports = getParameterByName("reports");
var designerMode = false;
var configObjType = "proj";
var configObjName = "AtApp Control";
var reportTitle = getParameterByName("reportSectionTitle");
var dateFilter = getParameterByName("dateFilter");
var customFrom = getParameterByName("fromDate");
var customTo = getParameterByName("toDate");
var yearFilter = getParameterByName("yearFilter");
var dashboardReport = getParameterByName("dashboardReport");
var reportName = getParameterByName("reportName");
var showTaskFilter = getParameterByName("showTaskFilter");
var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
var timer = getParameterByName("timer");
var scheduledReport = getParameterByName("scheduledReport");
var ATAPP_HOST = document.location.protocol + '//' + document.location.host;
var LICENSE_HOST = 'https://secure.atappstore.com';
var logTo = getParameterByName("logTo");
var logLevel = getParameterByName("logLevel");
var userFilterType = getParameterByName("otherFilterObj");
var defaultUserFilter = getParameterByName("otherFilterDefault");
var userFilterName = getParameterByName("otherFilterLabel");
var showProjectFilter = getParameterByName("showProjectFilter");
var showDateFilter = getParameterByName("showDateFilter");
var api = "api/v7.0";
var useViewer = (getParameterByName("useViewer") == "true");

if (showToolbox == "true")
{
    document.getElementById("adminToolbox").style["display"] = "inline";

}



var renderer = getParameterByName("renderer");

if (renderer == "")
{
    renderer = "reports.corp.gs";
}

 


if (ext == null)
{
    ext = "pdf";
}

if (reportTitle == "")
{
    reportTitle = "Administrative Reports";
}




if (dashboardReport == "true")
{
    document.getElementById("pdfFrame").style["visibility"] = "visible";
    document.getElementById("pdfFrame").style["display"] = "inline";
 

  
}




if (getParameterByName("design") == "true")
{
    designerMode = true;
}

if (getParameterByName("ShowDownload") == "true")
{
    showDownload  = true;
}

if (getParameterByName("configName") != "")
{
    configObjName =getParameterByName("configName") ;
}

if (getParameterByName("configObj") != "")
{
    configObjType =getParameterByName("configObj") ;
}


  
if ( host == "")
{      
    if (document.referrer != "") 
    {
        ATTASK_INSTANCE = document.referrer.substring(8, document.referrer.indexOf(".com") + 4);
    }
}
else
{
    ATTASK_INSTANCE = host;
}


// Create https hostname from INSTANCE
atTaskHost = 'https://' + ATTASK_INSTANCE;
       


loadAdminDashboardConfig = function () {};
      
// routine called back by .qry file provides function handle to load dataset

function adminDashboardCallback (getAdminDashboardOptions)
{
    if (isLoaded) return;

    isLoaded = true;       
    getAdminDashboardOptions ( loadAdminDashboardConfig  );

}   
 
           
  
var app=angular.module('app', ['atTaskServiceModule']);


// Main render routine for page data:
app.controller('AtTaskAdminDashboardCTRL',   function ($scope, $http, $sce, $location, $compile,  atTaskWebService)     
{

    $scope.trustAsHtml = function(html) {
        return $sce.trustAsHtml(html);
    }

    $scope.atTaskWebService = atTaskWebService;

    if ( getParameterByName("ShowLabels") == "true");
    {
        $scope.showLabels = true;
    }

    var thisYear = new Date().getFullYear();
    $scope.filterYears = []
    for (i = thisYear - 5; i <= thisYear + 5; i++)
    {
        $scope.filterYears.push(i);
    }

    $scope.getCompanyList = function()
    {
        var url = atTaskHost + "/attask/" + api + "/cmpy/search?method=GET&" + 
           "&sessionID=" + sessionID +
           "&fields=name,ID";
        
        atTaskWebService.atTaskGet(url, 

            function (data)
            {
                $scope.filterCompanies = [{name:"-All-",ID:""}];
                $scope.filterCompanies = $scope.filterCompanies.concat(data);
                $scope.selectedCompanyFilter  = $scope.filterCompanies[0];

            });

    }


    $scope.selectDateRangeForFilter = function()
    {
        var yr = new Date().getFullYear();
        var mn = new Date().getMonth();
        var fromDate ;
        var toDate;
        var x = $scope.selectedDateFilter.value;

        if ($scope.selectedDateFilter.type == "y")
        {  
   
            fromDate = new  Date(yr + x,0,1);
            toDate =  new Date( yr + x,11,31);
        } 
        else if ($scope.selectedDateFilter.type == "q")
        {   
            var newMn = mn + x*3;

            if (newMn < 0)
            {
                fromDate = new Date(yr - 1,9,1);
                toDate = new Date(yr-1,11,31);
            } else if (newMn > 11)
            {
                fromDate = new Date(yr + 1,0,1);
                toDate = new Date(yr + 1,2,31);
            } else
            {
                fromDate = new Date(yr, (newMn - newMn % 3), 1);
                toDate =  new Date(yr, (newMn - newMn % 3) + 3, 1);
                toDate.setDate(0);
            }
        }
        else if ($scope.selectedDateFilter.type == "m")
        {
            var newMn = mn + x;

            if (newMn < 0)
            {
                fromDate = new Date(yr - 1,11,1);
                toDate = new Date(yr - 1,11,31);
            } else if (newMn > 11)
            {
                fromDate = new Date(yr + 1,0,1);
                toDate = new Date(yr + 1,0,31);
            } else
            {
                fromDate = new Date(yr, newMn, 1);
                toDate =  new Date(yr, newMn + 1, 1);
                toDate.setDate(0);
            }
        }
        else if ($scope.selectedDateFilter.type == "w")
        {
     
            var msDay = 86400000;
            fromDate = new Date();
            fromDate = new Date(fromDate.getTime() + msDay * (7 * x - fromDate.getDay()));
            toDate = new Date(fromDate.getTime() + (6 * msDay));
 

        }

        if ($scope.selectedDateFilter.type == "c")
        {
            if ($scope.fromDate == null ||   $scope.toDate == null)
            {
                $scope.fromDate = new  Date(yr ,0,1);
                $scope.toDate =  new Date( yr ,11,31);
            }
            document.getElementById("dateRangeSpan").style["display"] = "inline"; 
            document.getElementById("dateRangeSpanAdmin").style["display"] = "inline"; 
        }
        else
        {
            document.getElementById("dateRangeSpan").style["display"] = "none"; 
            document.getElementById("dateRangeSpanAdmin").style["display"] = "none"; 
            $scope.fromDate = fromDate;
            $scope.toDate = toDate;
        }

    }
    // {name:"-All-",type:"a"},    
    $scope.filterDates = [
   
        {name:"Last Year",type:"y",value:-1},
        {name:"This Year",type:"y",value:0},
        {name:"Next Year",type:"y",value:1},
        {name:"Last Quarter",type:"q",value:-1},
        {name:"This Quarter",type:"q",value: 0},
        {name:"Next Quarter",type:"q",value: 1},
        {name:"Last Month",type:"m",value:-1},
        {name:"This Month",type:"m",value: 0},
        {name:"Next Month",type:"m",value: 1},
        {name:"Last Week",type:"w",value:-1},
        {name:"This Week",type:"w",value: 0},
        {name:"Next Week",type:"w",value: 1},
        {name:"Custom",type:"c"},
    ];
 

    if (dateFilter == "")
    {
        $scope.selectedDateFilter = $scope.filterDates[1];
    }
    else
    {
        $scope.selectedDateFilter = $scope.filterDates.filter(function(d){return (d.name == dateFilter)})[0];

        if (dateFilter == "Custom")
        {
            var fDate = new Date(customFrom);
            var tDate = new Date(customTo);

            if (fDate < new Date('01/01/2000'))
            { fDate.setFullYear(fDate.getFullYear() + 100);}

            if (tDate < new Date('01/01/2000'))
            { tDate.setFullYear(tDate.getFullYear() + 100);}

            $scope.fromDate = fDate;
            $scope.toDate = tDate;

        }
    }

    if (yearFilter != "")
    {
        $scope.selectedYear = yearFilter;
    }
    else
    {
        $scope.selectedYear = thisYear;
    }

    $scope.reportTitle =reportTitle;

    $scope.setStyle = function(source,target)
    {
        if (source==target){return {display:"inline"};}
        else
        {return {display:"none"};}
    }

    $scope.customParameter = function (scopeName,setValue)
    {
        var match = $scope.CustomParameters.filter(function(cp){return cp.scope == scopeName});
        if (match.length > 0)
        {  
            if (setValue != null) 
            {
                match[0].value = setValue;
                match[0].dateValue = match[0].type == "date" ? setValue : null;
            }           
            return match[0].type == "date" ?  match[0].dateValue : match[0].value;
        } 
        else
            return null;
    }

    $scope.projectFilterChanged = function ()
    {
        if (document.getElementById('adminProjectFilter').style["display"] == "inline")
        {
            $scope.getProjectFilterCount( function(count) {
                $scope.currentBatchStep = 'Note:  Selected project filter contains ' + count + ' projects.';
            });
        }
    }

    $scope.toolSelectionChanged = function ()
    {
        document.getElementById("batchTableOutput").innerHTML = "";
        document.getElementById("xlsDownloadButton").style["visibility"] = "hidden";
 
        $scope.currentBatchStep = '';
        if (showToolbox == "true" && !(typeof $scope.selectedTool === 'undefined'))
        {

            var projDiv = document.getElementById('adminProjectFilter');
            projDiv.style['display'] = 'none';

            var taskDiv = document.getElementById('adminTaskFilter');
            taskDiv.style['display'] = 'none';

            var dateDiv = document.getElementById('adminDateFilter');
            dateDiv.style['display'] = 'none';

            if (!(typeof $scope.selectedTool.arguments === 'undefined'))
            {
                if ($scope.selectedTool.arguments.indexOf("projectFilter") >= 0)
                    projDiv.style['display'] = 'inline';
                if ($scope.selectedTool.arguments.indexOf("taskFilter") >= 0)
                    taskDiv.style['display'] = 'inline';
                if ($scope.selectedTool.arguments.indexOf("dateFilter") >= 0)
                    dateDiv.style['display'] = 'inline';
            }

            var othDiv = document.getElementById('adminOtherDiv');
            othDiv.style['display'] = 'none';

          


            if (typeof $scope.selectedTool === 'undefined') {
                return;
            }


            if (!(typeof $scope.selectedTool.includes === 'undefined') && document.getElementById($scope.selectedTool.name + '_src_include_0') == null)
            {
                var i = 0;

                $scope.selectedTool.includes.map( function(t)
                {
                    var js = document.createElement('script');   
                    js.id =  $scope.selectedTool.name + '_src_include_' + i;            
                    js.src = t;          
                    document.head.appendChild(js);
                    i++;
                });

            }
            if (!(typeof $scope.selectedTool.custom === 'undefined'))
            {
           
                othDiv.style['display'] = 'inline';
                $scope.CustomParameters = $scope.selectedTool.custom;
                
                $scope.CustomParameters.map(function(cp)
                {
                    cp.dateValue = (cp.type == "date" ? new Date(eval(cp.default)) : null);
                    if (cp.type == 'userFilter')
                    {
                        $scope.loadCustomUserFilter(cp.objCode,
                         function(data)
                         {
                             cp.type = 'select';
                             cp.options = data.map(function(d) { 
                                 var opt = {key:d.name,value:d.filter};                                
                                 if (cp.default == d.name) 
                                 { cp.value = d.filter; }                                
                                 return opt;                            
                             });
                            

                            

                         }
                            );
                    }
                    else  if (cp.type == 'select')
                    {
                        if (typeof cp.options[0].key === 'undefined')
                        {
                            cp.options = cp.options.map(function (o) {                             
                                return {key:o,value:o}});
                        }
                        cp.value = eval(cp.default);
                    }
                    else
                    {
                        cp.value = eval(cp.default);                       
                    }
                })
            }
            else
            {
                $scope.CustomParameters = [];
            }      

        }
    }


    $scope.reportSelectionChanged = function ()
    {

        if (typeof $scope.selectedReport === 'undefined' || $scope.selectedReport == null) {
            return;
        }
        else if (!(typeof $scope.selectedReport.filters === 'undefined'))
        {
            if ($scope.selectedReport.filters.filter(function (f) { return f.key  == "year"}).length > 0) 
            {
                document.getElementById("yearFilterSpan").style["display"] = "inline"; 
                document.getElementById("dateTab").style["display"] = "inline";
            }

            if ($scope.selectedReport.filters.filter(function (f) { return f.key  == "showLabels"}).length > 0) 
            {
                document.getElementById("showLabelsSpan").style["display"] = "inline";
                document.getElementById("otherTab").style["display"] = "inline";
            } 

 

            if ($scope.selectedReport.filters.filter(function (f) { return f.key  == "dateFilter"}).length > 0) 
            {
                document.getElementById("dateFilterSpan").style["display"] = "inline";
                document.getElementById("dateTab").style["display"] = "inline";

        
            } 

            var tmpFilters = $scope.selectedReport.filters.filter(function (f) { return f.key  == "showLabels"});
            if (tmpFilters.length > 0) 
            {
                $scope.showFilters = tmpFilters[0].value;
                document.getElementById("showLabelsSpan").style["display"] = "inline"; 
                document.getElementById("otherTab").style["display"] = "inline";
            }
            else
            {
                $scope.showFilters = false;
            }

            if ($scope.selectedReport.filters.filter(function (f) { return f.key  == "companyFilter"}).length > 0) 
            {
                document.getElementById("companyFilterSpan").style["display"] = "inline"; 
                document.getElementById("otherTab").style["display"] = "inline";
            }

            var custVal = $scope.selectedReport.filters.filter(function (f) { return f.key  == "customValuesFilter"})
            if (custVal.length > 0) 
            {        
                document.getElementById("customValuesTab").style["display"] = "inline";
                $scope.customValueFilterName = custVal[0].value.filterName;
                $scope.customFilterValues = custVal[0].value.filterValues;
                if (typeof $scope.customValueFilterName === 'undefined')
                    {
                        defaultCustomFilter = ""; 
                    }
                else
                    {
                    defaultCustomFilter = getParameterByName($scope.customValueFilterName);
                    }
                
                if (defaultCustomFilter != "")
                {
                    defFlt = custVal[0].value.filterValues.filter(function(f){return f.key == defaultCustomFilter});
                    $scope.selectedCustomValueFilter=  (defFlt.length == 1? defFlt[0] : custVal[0].value.filterValues[0]); 
                }
                else
                {
                    $scope.selectedCustomValueFilter = custVal[0].value.filterValues[0];
                }
        

            }


        }
    }

    

    $scope.$watch('selectedReport',  $scope.reportSelectionChanged);
    $scope.$watch('selectedTool', $scope.toolSelectionChanged);
    $scope.$watch('currentProjectFilter',$scope.projectFilterChanged);

    $scope.loadUberForms = function (forms) 
    {
        if (!(typeof forms === 'undefined') && (uberForm != "" && uberForm != null))
        {
            $scope.uberForms = forms;
            var ufSpan =  document.getElementById("uberForm");
            var uForm = forms.filter(function(f){return f.name == uberForm})[0];

            if (!(typeof uForm.includes === 'undefined') && document.getElementById(uForm.name + '_src_include_0') == null)
            {
                var i = 0;

                uForm.includes.map( function(t)
                {
                    var js = document.createElement('script');   
                    js.id =  uForm.name + '_src_include_' + i;            
                    js.src = t;          
                    document.head.appendChild(js);
                    i++;
                });

            }


            ufSpan.innerHTML = uForm.htmlBlock;
            ufSpan.style["display"] = "inline";
            angUF = (angular.element(ufSpan));
            $compile(angUF)($scope);

            if (!(typeof uForm.callback === 'undefined'))
            {
                uForm.callback();
            }


        }
    }

       
    $scope.loadAdminDashboardConfig = function (tools,reports,forms)
    {
        $scope.adminTools = tools;
        $scope.adminReports =  reports ;
       



         

        $scope.sequentialLoadRDLDocumentList(
           $scope.adminReports.map(function (r) { return $scope.configDocuments.filter(function (c) {return (c.name == r.template && c.currentVersion.ext == 'tpx')})[0]}),

           function () 
           {
               $scope.selectedTool = $scope.adminTools[0];

               if (reportName ==""){
                   $scope.selectedReport = $scope.adminReports[0]; 
               }
               else
               {
                   $scope.selectedReport = $scope.adminReports.filter(function(r){ return (r.name == reportName);})[0];
               }

               $scope.reportSelectionChanged();
               $scope.toolSelectionChanged(); 
               $scope.loadUberForms(forms);
            
               $scope.$apply();

               if (showReports == "true")
               {
                   document.getElementById("adminReports").style["display"] = "inline";
                   document.getElementById("pdfFrame").style["visibility"] = "visible";
                   document.getElementById("pdfFrame").style["display"] = "inline";
  
               }
                
               if (dashboardReport == "true")
               {
                 document.getElementById('adminReports').style['display'] = 'inline';
                 if (showReports != 'true')
                 {
                    document.getElementById('reportParams').style['display'] = 'none';
                    document.getElementById('viewReportButton').style['display'] = 'none';

                 }
                 $scope.viewReport();
               }
 
               $scope.initTimer();
                


           });
       
    }  



    loadAdminDashboardConfig = $scope.loadAdminDashboardConfig;

    $scope.createFilterFromDefinition = function(def,prefix)
    {
        var filter ="";
            
        for (itm in def)

        {
            def[itm] = def[itm].replace(/&/g,'%26');
            filter += '&' + def[itm].split('\t').map(function(str) { return prefix + itm + '=' + str}).join('&');
        }
        return filter;
  
    }

    $scope.loadCustomUserFilter = function (objCode,callback) {
        var  newFilter = [{'name':'-ALL-',definition:'',filter:''}];
        var path = 'api-internal/uift/filtersForObjCode';
        var filter = 'sessionID=' + sessionID + '&objCode=' + objCode.toUpperCase() + '&filterType=STANDARD';
        var fields = [ 'name', 'definition'];
        var filterURL = 'https://' + ATTASK_INSTANCE + '/attask/' + path + '?method=GET&' + filter + '&fields= ' + fields.join(',') ;

        
         atTaskWebService.atTaskGet(filterURL, 
                function (data) 
                    {
                        newFilter = newFilter.concat(data.map(function (tFilter) 
                                    {
                                        tFilter['filter'] = $scope.createFilterFromDefinition(tFilter.definition, ''); return tFilter;
                                    }));
                        callback(newFilter);
                    });
             
        


    }



    $scope.loadProjectFilters = function (prefix) {
        $scope.projectFilters =  [{'name':'-ALL-',definition:'ID_Mod=notnull',filter:'&ID_Mod=notnull'}]; 

        var path = 'api-internal/uift/filtersForObjCode';
        var filter = 'sessionID=' + sessionID + '&objCode=PROJ&filterType=STANDARD';
        var fields = [ 'name', 'definition'];
        var filterURL = 'https://' + ATTASK_INSTANCE + '/attask/' + path + '?method=GET&' + filter + '&fields= ' + fields.join(',');

        atTaskWebService.atTaskGet(filterURL, 
                function (data) {                      
                                $scope.projectFilters = $scope.projectFilters.concat(
                                        data.map(function (pFilter) {
                                            pFilter['filter'] = $scope.createFilterFromDefinition(pFilter.definition,prefix); return pFilter;
                                        }));
                                $scope.setDefaultProjectFilter();
                                });
        
    }


    $scope.setDefaultProjectFilter = function () {
        
        // Page can have "ProjectFilter" argument
        var vProj  = getParameterByName("projectFilter");
            
        if (typeof $scope.currentProjectFilter === 'undefined') {

           
    
             
            $scope.currentProjectFilter = $scope.projectFilters[0];
            
            if (vProj != "")
            {
                var search = $scope.projectFilters.filter(function(pf){ return (pf.name == vProj)});
                if (search.length > 0)
                    $scope.currentProjectFilter = $scope.projectFilters.filter(function(pf){ return (pf.name == vProj)})[0];
                      
            }
        }
    }


            
    $scope.loadTaskFilters = function (prefix) {
        $scope.taskFilters = [{'name':'-ALL-',definition:'ID_Mod=notnull',filter:'&ID_Mod=notnull'}];

        var path = 'api-internal/uift/filtersForObjCode';
        var filter = 'sessionID=' + sessionID + '&objCode=TASK&filterType=STANDARD';
        var fields = [ 'name', 'definition'];
        var filterURL = 'https://' + ATTASK_INSTANCE + '/attask/' + path + '?method=GET&' + filter + '&fields= ' + fields.join(',') ;

        atTaskWebService.atTaskGet(filterURL, function (data) {
                      
            $scope.taskFilters = $scope.taskFilters.concat(data.map(function (tFilter) {
                tFilter['filter'] = $scope.createFilterFromDefinition(tFilter.definition,prefix); return tFilter;
            }));



            $scope.setDefaultTaskFilter();

        });
    }


    $scope.setDefaultTaskFilter = function () {
        
        // Page can have "TaskFilter" argument
        var vTask  = getParameterByName("taskFilter");
            
        if (typeof $scope.currentTaskFilter === 'undefined') {

           
    
             
            $scope.currentTaskFilter = $scope.taskFilters[0];
            
            if (vTask != "")
            {
                var search = $scope.taskFilters.filter(function(tf){ return (tf.name == vTask)});
                if (search.length > 0)
                    $scope.currentTaskFilter = $scope.taskFilters.filter(function(tf){ return (tf.name == vTask)})[0];
                      
            }
        }
            
    };

    $scope.reloadPage = function()
    {
        location.reload();
    }

    $scope.reloadIfTimeout = function()
    {
        if (!isLoaded)
        {
            location.reload();
        }
    }

   
    $scope.uploadConfigFile = function(fileName,fileData,callback,error)
    {
        

        var fileInfo = "?fileName="+ fileName +"&objType=" + configObjType + "&id=" +  $scope.configObjID +
         "&path=&server=" + ATTASK_INSTANCE + "&session=" + sessionID;

        $http({
            method: 'POST',
            url:  'https://' + renderer + '/WorkfrontUploadProxy.aspx' +
                    fileInfo,
            headers: { 'Content-Type': null },
            responseType: 'text/plain',            
            data: fileData
        })
    .success(

        function(data)
        { 
            callback(data);

        } )  


    }


    $scope.loadAdminDashboardAtApp = function(callback, reloadReportsOnly)
    {
        isloaded=false;

        if (typeof reloadReports === 'undefined') reloadReportsOnly = false;

        try {
            var url = atTaskHost + "/attask/" + api + "/" + configObjType + '/search?method=GET&name=' + configObjName + 
            "&sessionID=" + sessionID +
            "&fields=documents:downloadURL,documents:currentVersion:ext,documents:parameterValues:*,parameterValues:*" +
            (configObjType.toUpperCase() == "PROJ" ? ",tasks:parameterValues:*" : "" );
        
            atTaskWebService.atTaskGet(url, 

                function (data)
                {

                    if (!reloadReportsOnly)
                    {
                        $scope.configObjID = data[0].ID;
                        $scope.configDocuments = data[0].documents;

                        if (configObjType.toUpperCase() == "PROJ") 
                        {
                           $scope.configTasks = data[0].tasks;
                        }
                        else
                        {
                           $scope.configTasks = [];
                        }


                        $scope.configDocuments.filter(function (d) {return(d.name !='AdminDashboard' && d.currentVersion.ext == 'atapp')}).map 
                                          (
                    
                        // Load supporting .atapp configuration files.  Attach as script and execute code. 
                    
                                          function (file) 
                                          {                             
                                              var js = document.createElement('script');                
                                              js.src = atTaskHost + file.downloadURL + "&sessionID=" + sessionID;          
                                              document.head.appendChild(js);
                                          }
                        )
                    
                        // Load AdminDashboard.atapp configuration file.  Attach as script and execute code. 
                        $scope.configDocuments.filter(function (d) {return(d.name =='AdminDashboard' && d.currentVersion.ext == 'atapp')}).map 
                          (
                            function (file) 
                            {                             
                                var js = document.createElement('script');                
                                js.src = atTaskHost + file.downloadURL + "&sessionID=" + sessionID;          
                                document.head.appendChild(js);
                               
                            }
                          );
                    }

                    $scope.scheduledReports = [];

                    

                    $scope.configTasks.filter(function (t) { return (!(typeof t.parameterValues["DE:Report Schedule Active"] === 'undefined'));}).map
                       (
                         function (task)
                         {
                             task.parameterValues.ID = task.ID;  
                             task.parameterValues.name = task.name; 
                             $scope.scheduledReports.push(task.parameterValues);
                         }
                       );


                    if ($scope.scheduledReports.length > 0)
                    {
                        p = data[0].parameterValues;
                        $scope.smtpSettings = {account:p["DE:Email Account"],password:p["DE:Password"],credential:p["DE:Encrypted Credential"],smtpHost:p["DE:SMTP Host"],port:p["DE:SMTP Port"],useSSL:p["DE:SMTP Use SSL?"]};                  
                    }
                    callback();
                },
                function ()
                {
                    if (timer == null || timer == "") alert('An error occured trying to load admin dashboard configuration.');
                    else setTimeout($scope.reloadPage,60000);
                }
                )
        }
        catch (err)
        {
            if (timer == null || timer == "")
                alert('An error occured trying to load admin dashboard configuration.');
            else
                setTimeout($scope.reloadPage,60000);

        }
    
    }


 
    $scope.sequentialLoadRDLDocumentList = function (docs,callback)
    {
        if (docs.length > 0)
        {
            var doc = docs.pop();
            var js = document.createElement('script');

            js.onload = function ()
            {
                var str = rdlContents.toString();
                rdlContents = null;
                js = null;
                $scope.adminReports.filter(function(r) { return (r.template == doc.name)}).map(function(d) {
                    d.rdl = str.substring(str.lastIndexOf("/*") + 2, str.lastIndexOf("*/")).trim()});
                $scope.sequentialLoadRDLDocumentList(docs,callback);
            }

            js.src = atTaskHost + doc.downloadURL + "&sessionID=" + sessionID;      
            document.head.appendChild(js);
        }
        else
        {
            callback();
        }
    }

 

     
 


 



    $scope.downloadBlob = function (blob,fileName)
    {
 
        if(window.navigator.msSaveOrOpenBlob) 
        {
            window.navigator.msSaveOrOpenBlob(blob,fileName);
        } 
        else
        {
            var url = window.URL.createObjectURL(blob);
                       
            var a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display:none";
            a.href = url;
            a.download =  fileName + (ext != "" ,"." + ext,"");
            a.click();
            //$scope.incrementBatchTracker(fileName);
            // window.URL.revokeObjectURL(url);
        }        

        if (showDownload){
            setDownloadButton();
        }
    }

    $scope.downloadFile = function ()
    {
  
        btn = document.getElementById('downloadFile');
        btn.disabled = true;
        btn.innerHTML = '<img src="https://reports.corp.gs/img/395.gif" width="15px" height="15px"/> please wait... ';
        btn.style["background-color"] = "white";
        btn.style["color"] = "#4a4a4a";
        //$scope.createDashboard(projectID,taskID,programID,rptDocName,$scope.downloadBlob,null,null,ext);

        $scope.renderReport($scope.selectedReport,'Report',$scope.downloadBlob,null,ext);
    }

    $scope.showBlob = function (blob,fileName)
    {

         
         //   setTimeout( function () {window.navigator.msSaveOrOpenBlob(blob,fileName);},500);
        
            var newRL = URL.createObjectURL(blob);
            var frm = document.getElementById('pdfFrame');
            
            if(window.navigator.msSaveOrOpenBlob || useViewer)
            {
                if (blob.type == 'text/html') 
                {
                  frm.src = newRL;
                }
                else
                {
                    frm.src ="/Reports/web/viewer.html?file=" + newRL;
                }
                
                
            }
            else frm.src = newRL;
        

        if (showDownload)
        {
            setDownloadButton();   
        }
    }

    function setDownloadButton()
    {

        var btn = document.getElementById('downloadFile');

        if (is_chrome) 
        {

            btn.style["margin-top"] = "25px";        
            btn.style["background-color"] = "#323639";
        }
        else
        {

            btn.style["background-color"] = "#4a4a4a";
        }
        btn.innerHTML = "➨ ." + ext ;   

        btn.disabled = false;
        btn.style["color"] = "white";
        btn.style["visibility"] = "visible";
    }

 


    $scope.renderPDF = function(rdlData,fileName,blobCallback,uploadTo, fExt, rptSMTP) 
    {
        var qryParam;

        
        $scope.currentReportStep = "Data Loaded.  Rendering Report...";

        if (uploadTo == null)
        {
            qryParam = '?s=' + sessionID + '&sn=' + ATTASK_INSTANCE ;
        } 
        else
        {
           qryParam = '?s=' + sessionID + '&sn=' + ATTASK_INSTANCE +  '&name=' + fileName + '&' + uploadTo;
            //      '&uploadToObjType=project&uploadToObjId=' + projId + '&uploadToDirId=' + dirId;
        }

        if (fExt != null && fExt != "")
        {
            qryParam += "&ext=" + fExt;
        }

         
         
        if  (!( typeof rptSMTP   === 'undefined'))
        {
            qryParam +=  rptSMTP; 
        }




        $http({
            method: 'POST',
            url:  'https://' + renderer + '/RenderRDLReportFile.aspx' +
                    qryParam,
            headers: { 'Content-Type': null },
            responseType: 'arraybuffer',
            transformRequest: function (data) {
                var formData = new FormData();
                formData.append(fileName,rdlData); 
                return formData;
            },
            data: {rdlData:rdlData}
        })
    .success(

        function(response)
        {

            var contentType = "application/pdf";

            if (fExt != null)
            { if (ext == "pdf")
                contentType = "application/pdf";
            else if (ext == "docx")
                contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            else if (ext == "xlsx")
                contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            else if (ext == "doc")
                contentType = "application/msword";
            else if (ext == "xls")
                contentType = "application/vnd.ms-excel";
            else if (ext == "tiff")
                contentType = "image/tiff";
            else if (ext == "png")
                contentType = "image/png";
            else if (ext == "jpg")
                contentType = "image/jpg";
            else if (ext == "gif")
                contentType = "image/gif";
            }

            if (uploadTo == null)
            {
                var pdfBlob = new Blob([response], { type: contentType })
                blobCallback(pdfBlob,fileName + "." + ext);
            }
            else
            {
                blobCallback( eval("[" + (new TextDecoder("utf-8")).decode(response) + "]")[0] , fileName + "." + ext) ;
            }
            $scope.currentReportStep = "";
        }
            )
    .error(
        function(data,status)
        {
            if (timer == null || timer == "")
            {
            alert('Failed to generate ' + fileName + '.  Error Status = ' + status);
            } else setTimeout($scope.reloadPage,60000);
        });
             

    }; // $scope.renderPDF
   

    $scope.getProjectFilterCount = function (callback)
    {   
        if (typeof $scope.currentProjectFilter === 'undefined') return false;

        var url = atTaskHost  + '/attask/' + api + '/proj/count?method=GET' +   $scope.currentProjectFilter.filter + '&sessionID=' + sessionID ;
        atTaskWebService.atTaskGet(url, 
             function (data)
             {
                 if (data.length == 0) callback(0); else callback(data.count);
             })
    }

    $scope.applyProjectFilterToJSONObj = function(adminReport,obj, otherObjs, callback)
    {

        if (document.getElementById("adminReports").style["display"] != "inline" || $scope.currentProjectFilter.name == '-ALL-') 
        {
            callback(obj,otherObjs);
        }
        else
        {
            var url = atTaskHost  + '/attask/' + api + '/proj/search?method=GET' +   $scope.currentProjectFilter.filter + '&sessionID=' + sessionID ;
            atTaskWebService.atTaskGet(url, 
                 function (data)
                 {

                     obj = obj.filter(function (o) 
                     {
                         if (typeof o.project === 'undefined')
                         {
                             if (typeof o.ID === 'undefined') return data
                             else
                                 return data.filter(function (d) { return(d.ID == o.ID || d.ID == o.projectID)}).length > 0;
                         }
                         else if (o.project != null)
                         {
                             return data.filter(function (d) { return(d.ID == o.project.ID|| d.ID == o.projectID)}).length > 0;
                         }                            }
                                     );

                     for (var oo in otherObjs)
                     {


                         var oq =  adminReport.otherQueries.filter(function(oq){return oq.dataSetName == oo});

                         if (oq.length == 0 || (!(typeof oq[0].ignoreProjectFilter === 'undefined') && oq[0].ignoreProjectFilter == true  ))
                         {

                         }
                         else
                         {
                             otherObjs[oo] = otherObjs[oo].filter(function (o) 
                             {
                                 if (typeof o.project === 'undefined')
                                 {
                                     if (typeof o.ID === 'undefined') return data
                                     else
                                         return data.filter(function (d) { return(d.ID == o.ID || d.ID == o.projectID)}).length > 0;
                                 }
                                 else
                                 {
                                     return data.filter(function (d) { return(d.ID == o.project.ID|| d.ID == o.projectID)}).length > 0;
                                 }
                             }
                             
                                    );
                         }}                      

                     if (typeof $scope.currentTaskFilter === 'undefined') {


                         callback(obj,otherObjs);
                     }

                     else
                     {
                         // $scope.applyTaskFilterToJSONObj(obj, otherObjs, callback);
                         callback(obj,otherObjs);
                     }

                 },
         function ()
         {
            if (timer == null || timer == "" ) alert ('Error Retrieving project filter');
            else setTimeout($scope.reloadPage,60000);
         });

        }
 
    }

    $scope.applyTaskFilterToJSONObj = function(obj, otherObjs, callback)
    {
        var url = atTaskHost  + '/attask/' + api + '/task/search?method=GET' +   $scope.currentTaskFilter.definition ;
        atTaskWebService.atTaskGet(url, 
             function (data)
             {

                 obj = obj.filter(function (o) 
                 {
                     if (typeof o.task === 'undefined')
                     {
                         if (typeof o.ID === 'undefined') return data
                         else
                             return data.filter(function (d) { return(d.ID == o.ID || d.ID == o.taskID)}).length > 0;
                     }
                     else
                     {
                         return data.filter(function (d) { return(d.ID == o.task.ID|| d.ID == o.taskID)}).length > 0;
                     }                            }
                                 );

                 for (var oo in otherObjs)
                 {
                     otherObjs[oo] = otherObjs[oo].filter(function (o) 
                     {
                         if (typeof o.task === 'undefined')
                         {
                             if (typeof o.ID === 'undefined') return data
                             else
                                 return data.filter(function (d) { return(d.ID == o.ID || d.ID == o.taskID)}).length > 0;
                         }
                         else
                         {
                             return data.filter(function (d) { return(d.ID == o.task.ID|| d.ID == o.taskID)}).length > 0;
                         }
                     }
                                );
                 };

                 callback(obj,otherObjs);

             },
     function ()
     {
        if (timer == null || timer == "") alert ('Error Retrieving task filter');
        else setTimeout($scope.reloadPage,60000);
     });

 
    }


    $scope.appendFilters = function (url)
    {

        $scope.filterDescription = $scope.selectedReport.filterDescription;

        $scope.selectedReport.filters.map( function (f)
        {
            if (f.key == "yearFilter")
            {
                url += "&" + f.value.replace(/{year}/g, $scope.selectedYear);
                $scope.filterDescription = $scope.filterDescription.replace(/{yearFilter}/g,$scope.selectedYear);

            }
            else if (f.key == "dateFilter" && $scope.selectedDateFilter.type != "a")
            {
                url += "&" + f.value.replace(/{fromDate}/g, $scope.fromDate.toJSON()).replace(/{toDate}/g,$scope.toDate.toJSON());
                $scope.filterDescription = $scope.filterDescription.replace(/{dateFilter}/g,$scope.fromDate.toDateString() + ' - ' + $scope.toDate.toDateString());
            }
            else if (f.key == "companyFilter" && $scope.selectedCompanyFilter.ID != "")
            {
                url += "&" + f.value.replace(/{companyID}/g, $scope.selectedCompanyFilter.ID);
                $scope.filterDescription = $scope.filterDescription.replace(/{companyFilter}/g,$scope.selectedCompanyFilter.name);
            }

        }
        );
        $scope.filterDescription = $scope.filterDescription.replace(/({projectFilter})/g,$scope.currentProjectFilter.name);
 
        if ( !typeof($scope.currentTaskFilter) === 'undefined')
        {
            $scope.filterDescription = $scope.filterDescription.replace(/({taskFilter})/g,$scope.currentTaskFilter.name);
        }

        $scope.filterDescription = $scope.filterDescription.replace(/({companyFilter})|({yearFilter})|({dateFilter})|({projectFilter})|({tFilter})/g,"").trim();

        if (showTaskFilter == "true")
        {
            url +=     $scope.currentTaskFilter.filter;
        }

        return url;

    };

    $scope.loadOtherQueries = function(adminReport,callback)
    {
        if ( (typeof adminReport.otherQueries === 'undefined') || adminReport.otherQueries.length == 0 )
        {
            callback([]);
        }
        else

        {
            var oQuery = []; 
            adminReport.otherQueries.map(function(q){
                if (q.query.indexOf(atTaskHost) == -1) {
                    var query = q.query;
                    query  =  query.replace(/{SESSIONID}/g,sessionID);
                    query =  query.replace(/{ID}/g,objID);
                    query = atTaskHost + '/attask/' + api + '/' +  query  ;
                    oQuery.push({dataSetName:q.dataSetName, query:query});
                };
            });

     
            atTaskWebService.atTaskLoadSet(oQuery, 

            function (querydata) {            
                callback(querydata);
            });

            
        }

    }


     $scope.completeRender = function (data, adminReport,fileName,blobCallback,dirId,fExt,rptSMTP)
                    {
                    //Insert data object into report file
                    var rdlCopy = adminReport.rdl.slice();
                    var rdlData = convertJSONArraytoRDLDataSet(data,'WorkfrontData',rdlCopy,false);

            
                    rdlData = rdlData.replace('{FilterDescription}',$scope.filterDescription);
                    rdlData = rdlData.replace('{ShowLabels}',$scope.showLabels);


                    if (!designerMode) {        
                        $scope.renderPDF(rdlData,fileName,blobCallback,dirId,fExt,rptSMTP);  
                    }
                    else
                    { // Code to edit .rdl file 

                        blob = new Blob([rdlData],{type:"octet/stream"});
                        if(window.navigator.msSaveOrOpenBlob) 
                        {
                            window.navigator.msSaveOrOpenBlob(blob,fileName +'.rdl');
                        }
                        else
                        {
                            var url = window.URL.createObjectURL(blob);

                            // var frm = document.getElementById('pdfFrame');
                            // frm.src = url;   
                                    
                            var a = document.createElement("a");
                            document.body.appendChild(a);
                            a.style = "display:none";
                            a.href = url;
                            a.download =  fileName +'.rdl';
                            a.click();
                            //   window.URL.revokeObjectURL(url);
                        }
             
                    } //else rdl file
                  }  // Complete Render Function


  $scope.renderReport = function(adminReport,fileName,blobCallback,uploadTo,fExt) {

  
        var url = adminReport.query;
        url = url.replace(/{SESSIONID}/g,sessionID);
        url = url.replace(/{ID}/g,objID);
        url = $scope.appendFilters(url);
        url = atTaskHost + '/attask/' + api + '/' + url  + '&jsonp=JSON_CALLBACK';

        var rptSMTP = adminReport.rptSMTP;
          
            
        atTaskWebService.atTaskGet(url, 
    function (rawData)
    {
        $scope.loadOtherQueries(adminReport,function(otherRawData)
        {

            $scope.applyProjectFilterToJSONObj(adminReport, rawData, otherRawData, function (data,otherData) 
            {          
            if (!(typeof data.error === 'undefined'))
                {
                    if (timer == null || timer == "") alert('Error With Workfront Query. msg:' + JSON.stringify(data.error));
                    else setTimeout($scope.reloadPage,60000);
                }
                else if (data.length > 0)
                {
            
                    if (!(typeof adminReport.postProcessFunction  === 'undefined') && adminReport.postProcessFunction != null)
                    {
                        if (adminReport.postProcessFunction.length < 3)
                        {
                            var finalData = adminReport.postProcessFunction(data,otherData);
                            $scope.completeRender(finalData, adminReport,fileName,blobCallback,uploadTo,fExt,rptSMTP);
                        }
                        else
                        {
                            adminReport.postProcessFunction(data,otherData, 
                                function(finalData) 
                                {
                                    if (finalData == null || finalData.length == 0)
                                    {
                                       blobCallback(new Blob(['No data to report.'],{type : 'text/html'}),'nodata.html');
                                    }
                                    else
                                    {
                                        $scope.completeRender(finalData, adminReport,fileName,blobCallback,uploadTo,fExt,rptSMTP);
                                    }
                                });
                        }
                    }
                    else
                    {
                    $scope.completeRender(data, adminReport,fileName,blobCallback,uploadTo,fExt,rptSMTP);
                    }
                }
                else
                {
                    blobCallback(new Blob(['No data to report.'],{type : 'text/html'}),'nodata.html');
                }
            })}) } // success
     ,
    function (response)
    {   
        if (timer == null || timer == "") 
            {
               

                 document.getElementById("pdfFrame").src = URL.createObjectURL(new Blob(['<h1>An issue was encountered generating report</h1><br><br>Message: ' + response.error.message],{type : 'text/html'}));
            }
        else setTimeout($scope.reloadPage,60000);

    }  );
}

    $scope.viewReport = function ()

    {
        if (typeof $scope.selectedReport.rdl === 'undefined')
        {
            $scope.currentReportStep = "report definition not yet loaded.  Please retry.";
        }
        else
        {
            $scope.currentReportStep = "Fetching Data from Workfront...";
            document.getElementById("pdfFrame").src = "https://reports.corp.gs/loading.html";
            document.getElementById("pdfFrame").style["background-color"] ="white";
            var fExt = (ext == "tiff" || ext == "png" || ext == "jpg" || ext == "gif" ? ext : null);
            $scope.renderReport($scope.selectedReport,'Report',$scope.showBlob,null,fExt);
        }
    }
 

    $scope.JSONtoTable = function(json)
    {

        if (!(typeof json === 'object'))
        {
            return json;
        }
        else
        {

            if (!(Object.prototype.toString.call( json ) === '[object Array]'))
            {
                json = [json];
            }
  
            if (logLevel != "")

            {

                var filterOut = [];

                if (logLevel.toUpperCase() == 'ERROR')
                {
                    filterOut =['UPDATE','Bulk update failed.']
                }

                if (filterOut.length > 0)
                {

                    json =    json.filter(function(j) {  
                        var match = true; 
                        for (p in j)
                        {
                            filterOut.map(function(fo) {
                                match = match && ( (JSON.stringify(j[p]).indexOf(fo) == -1));
                            });
                        }
                        return match
                    });

                }
            }
            var theads = [];
            var gTypeAdded = false;

            json.map(function(r) {
                var guidType = '';
                for (p in r)
                {
              
                    if (theads.filter(function(t){return t== p}).length == 0)
                    {
                        theads.push(p);          
                        if (p== 'link') gTypeAdded=true;
                    }

                    if (p == "type" && r[p] != null)
                    {
                        guidType = r[p].toUpperCase();
                        if (!gTypeAdded){
                            theads.push('link');
                            gTypeAdded = true;
                        }
                    }
                    else if (r.link == null)
                    {
                        var re = new RegExp('%22(ID)%22[%20]*:[%20]*%22([a-f|0-9]+)%22','g');
                        var tmpJson  = (typeof r[p] === 'object' ? JSON.stringify(r[p]) : r[p]);
                        if (re.test(tmpJson))
                        {
                            if (r.link == null){
                     
                                r.link = '';
                            }   

                            re.lastIndex = 0;
                            var match;
                            while ((match = re.exec(tmpJson)) != null)
                            {
                                r.link += '<a target="_blank" href=' + atTaskHost + '/search?objCode=' + guidType +'&allowRedirect=false&query=' + match[2] + '&showResultsPage=false>'+ match[2] +'</a>&nbsp; ';
                            }

                            //r.link += tmpJson.replace(re,'<a target="_blank" href=' + atTaskHost + '/search?objCode=' + guidType +'&allowRedirect=false&query=$2&showResultsPage=false>$2</a>');
     
                        }

                    }

        

                }
            });

            json.map(function(r) {
                theads.map(function(c)
                { 

                    if (typeof r[c] === 'undefined')
                    { 
                        r[c] = null;
                    }
                })
            });

            var html = "<table><thead>";
            theads.map(function(c) {
                html += '<th>'+ c + '</th>';
            });
            html += '</thead><tbody>';
        
            json.map(function(r){
                html += '<tr>';
                theads.map(function(c) {
                    html += '<td style="max-width:500px;max-height:100px">' + (typeof r[c] ==='object' ? JSON.stringify(r[c]) : r[c]) + '</td>';
                });
                html += '</tr>';
            });     

            html += '</tbody></table>';

            return html;
        }
    }




    $scope.runReportSchedule = function(rpt, callback)
    {
   
        
        if (typeof rpt["DE:Report Schedule Active"] === 'undefined' || 
            typeof rpt["DE:Report Schedule Next Run Date"] === 'undefined' || 
            typeof rpt["DE:Period"] === 'undefined' || 
            typeof rpt["DE:Repeat Every"] === 'undefined' || 
            typeof rpt["DE:Scheduled Report Name"] === 'undefined' ||
            typeof rpt["DE:Email Subject"] === 'undefined' ||
            typeof rpt["DE:Report Email Options"]  === 'undefined' ||
            typeof rpt["DE:Permitted Execution Lag"]  === 'undefined'
           )
        { 
             
            callback();
            return;
        }

        var now = (new Date()).getTime();        
        var nextRun = new Date(rpt["DE:Report Schedule Next Run Date"].replace(/:\d\d\d/g,'')).getTime();
        var subsequentRun
        var lastRun =  (typeof rpt["DE:Last Run On"] === 'undefined' ? new Date().getTime() - 310000 : new Date(rpt["DE:Last Run On"].replace(/:\d\d\d/g,'')).getTime());
        var lag =  parseInt(rpt["DE:Permitted Execution Lag"]);
       


        if (rpt["DE:Report Schedule Active"] == 'No' || 
            ( rpt["DE:Report Schedule Active"] == 'Pending' && (now - lastRun) < (20 * 60 * 1000) ) )  // Don't run if inactive or recently pending.
        {
             
            callback();
            return;
        }
        else            
            {            

                lag = (lag == -1 ? now - nextRun : 60000 * lag);  // -1 => unlimited lag allowed.     
                if (now <= nextRun + lag && now > nextRun)             
                {     
                                   
                   $scope.logExecution([rpt],"Attempting to Run Report " + rpt.name, false);   
                    rpt["DE:Report Schedule Active"] = "Pending";                      
                    var fSafeDate = new Date();                    
                    rpt["DE:Last Run On"] = fSafeDate.toJSON();      

                  rSelect = $scope.adminReports.filter(function(r){ return (r.name == rpt["DE:Scheduled Report Name"]);});

                    if (rSelect.length == 1)
                    {
                        $scope.selectedReport = rSelect[0];
                        $scope.reportSelectionChanged(); 
                        $scope.$apply();

                        
                        if (rpt["DE:Scheduled Report Project Filter"] != null && (!(typeof rpt["DE:Scheduled Report Project Filter"] === 'undefined')))
                        {
                            var search = $scope.projectFilters.filter(function(pf){ return (pf.name == rpt["DE:Scheduled Report Project Filter"])});
                            if (search.length == 1)
                            {
                                $scope.currentProjectFilter = search[0];
                            }

                        }

                        var body = "";
                        if  (!(typeof rpt["DE:Email Body"] === 'undefined'))
                        {body = rpt["DE:Email Body"];}

                        body = body == "" ?  ' ' : body;

                        rptSMTP =   "&emailFrom=" + $scope.smtpSettings.account;
                        rptSMTP +=  "&emailTo=" + rpt["DE:Email Distribution List"];
                        rptSMTP +=   "&emailSubject=" + rpt["DE:Email Subject"];
                        rptSMTP +=   "&emailBody=" + body.replace(/(<)(\/?\w+?)\/?(>)/g,"[$2]");
                        rptSMTP +=   "&emailSmtpHost=" + $scope.smtpSettings.smtpHost;
                        rptSMTP +=   "&emailSmtpPort=" + $scope.smtpSettings.port;
                        rptSMTP +=   "&emailUseSSL=" + $scope.smtpSettings.useSSL;

                        if($scope.smtpSettings.password != ""){
                            rptSMTP +=   "&emailPassword=" + $scope.smtpSettings.password;
                        }

                        if($scope.smtpSettings.credential != ""){
                            rptSMTP +=   "&emailCredential=" + $scope.smtpSettings.credential;
                        }

                        if ( Array.isArray(rpt["DE:Report Email Options"]))
                            { 
                                if (rpt["DE:Report Email Options"].filter(function(o) { return o == "Include Thumbnail Image"}).length > 0)
                                {
                                    rptSMTP +=   "&emailPreviewExt=png";
                                }
                                if (rpt["DE:Report Email Options"].filter(function(o) { return o == "Include Attachment"}).length > 0)
                                {
                                    rptSMTP += "&emailAttachExt=" + (rpt["DE:Attachment Type"] == "PDF" ? "pdf" : rpt["DE:Attachment Type"] == "Excel" ? "xls" : "doc");
                                }

                            }
                            else 
                            {
                                    if  (rpt["DE:Report Email Options"] == 'Include Thumbnail Image')
                                    {
                                        rptSMTP +=   "&emailPreviewExt=png";
                                    }

                                    if  (rpt["DE:Report Email Options"] == 'Include Attachment')
                                    {
                                     rptSMTP += "&emailAttachExt=" + (rpt["DE:Attachment Type"] == "PDF" ? "pdf" : rpt["DE:Attachment Type"] == "Excel" ? "xls" : "doc");
                                    }
                            }
            
                         

                       

                        $scope.currentBatchStep = "Running Report " + rpt.name;

                       
                        $scope.selectedReport.rptSMTP = rptSMTP;

                       
                      
                        var  failSafeUpdate = {ID:rpt.ID,"DE:Last Run On": fSafeDate.toJSON(),"DE:Last Run Status" : -1, "DE:Report Schedule Active":"Pending" };
                            atTaskWebService.atTaskBulkUpdate("TASK",atTaskHost + "/attask/" + api + '/task?method=PUT&sessionID=' + sessionID,[failSafeUpdate],
                             function (results)
                             { 
                                 $scope.renderReport($scope.selectedReport,'Report', function () 
                                        {

                                            var freq = ((rpt["DE:Period"] == "Hours" ? 60 : rpt["DE:Period"] == "Days" ? 60 * 24 : rpt["DE:Period"] == "Weeks" ? 7 * 60 * 24:1) * 60000) * rpt["DE:Repeat Every"];
                                            var subsequentRun = new Date(nextRun);

                                            if (rpt["DE:Period"] == "Months")
                                                {
                                                    var yrs = Math.floor(rpt["DE:Repeat Every"]/12);
                                                    var mnths = rpt["DE:Repeat Every"] % 12;                                              
                                                  
                                 
                                                    while (now >= subsequentRun.getTime())
                                                    {
                                             
                                                        subsequentRun.setYear(subsequentRun.getFullYear() + yrs);                  
                                   
                                                        var mNo = subsequentRun.getMonth();
                                   
                                                        if (mNo + mnths > 11)
                                                        {
                                                            subsequentRun.setYear(subsequentRun.getYear() + 1);
                                                            subsequentRun.setMonth((mNo + mnths - 11) - 1);
                                                        }
                                                        else if (mnths != 0)
                                                        {
                                                            subsequentRun.setMonth(subsequentRun.getMonth() + mnths);
                                 
                                                        }
                                                        
                                                    }


                                                }
                                                else
                                                {
                                                                                    
                                                    subsequentRun = subsequentRun.getTime();
                                 
                                                    while (subsequentRun <= now)
                                                    { 
                                                        subsequentRun += freq; 
                                                    }

                                                    subsequentRun = new Date(subsequentRun);
                                 
                                                }

                                  
                                            var lRun = new Date(now);

                                            //nRun.setHours(nRun.getHours()+(nRun.getTimezoneOffset()/-60) );

                                            rpt["DE:Last Run On"] = lRun.toJSON();
                                            rpt["DE:Report Schedule Active"] = "Yes";
                                            rpt["DE:Report Schedule Next Run Date"] = subsequentRun.toJSON();
                                            
                                            var update = {ID:rpt.ID,"DE:Last Run On": lRun.toJSON(),"DE:Report Schedule Next Run Date": subsequentRun.toJSON(),"DE:Last Run Status" : 1, "DE:Report Schedule Active":"Yes" };
                                            atTaskWebService.atTaskBulkUpdate("TASK",atTaskHost + "/attask/" + api + '/task?method=PUT&sessionID=' + sessionID,[update],
                                             function (results)
                                             {
                                                  
                                                 $scope.logExecution([rpt],"Email Report " + rpt.name, false);                               
                                                 $scope.currentBatchStep = "Report " + rpt.name + " set to run next on " + subsequentRun.toJSON();
                                                 callback();
                                             });               

                                        },null,ext); // Render Report                                 
                                 
                             });   // Update to assume failure first.
                    } // Report Select Length == 1                                  
                             
                }  // IF now > next run + lag (render report)
                else
                {
                    callback();
                }   // not time to render report.

            } // Report is active



    }
    

    $scope.runTimerTools = function()
    {

    try
    {
        if ($scope.minuteCount > 480)
        {
            isLoaded = false;
            $scope.startup();
            return;
        }

        $scope.currentBatchStep = "Timer Running, Minutes Elapsed: " + $scope.minuteCount;
        $scope.$apply();
        $scope.adminTools.map(function(t)
        {
            var runTool = false;
            var incremental = false;

            if (t.runModes.filter(function(rm){return rm == "timer"}).length == 1)
            {
                if ( (t.timer.firstIncrementalRun <= $scope.minuteCount && t.timer.firstIncrementalRun != -1) ||
                     (t.timer.lastIncrementalRun != null && ($scope.minuteCount - t.timer.lastIncrementalRun) >= t.timer.incremental) )
                {
                    t.timer.firstIncrementalRun = -1;
                    t.timer.lastIncrementalRun = $scope.minuteCount;
                    incremental = true;
                    runTool = true;
                }
                else
                    if ( (t.timer.firstFullRun <= $scope.minuteCount && t.timer.firstFullRun != -1) ||
                          (t.timer.lastFullRun != null && ($scope.minuteCount - t.timer.lastFullRun) >= t.timer.full))
                    {
                        t.timer.firstFullRun = -1;
                        incremental = false;
                        t.timer.lastFullRun = $scope.minuteCount;
                        runTool = true;
                    } 

                if (runTool){
                    $scope.selectedTool = t;
                    $scope.toolSelectionChanged(); 
                    $scope.$apply();
                    $scope.customParameter('aggregateRunType', (incremental ? "Incremental Run" : "Full Run"));
                    $scope.executeIncremental = true;
                
                    setTimeout($scope.runTool,1000);
                }

                
            }
        });

        if ($scope.scheduledReports.length > 0)
        {


            var rpts = $scope.scheduledReports.slice();
            
            $scope.logExecution(rpts,"Schedule Report Run",false);
            seqRun = function ()
            {
                if (rpts.length > 0)
                {
                    var rpt = rpts.shift();
                    setTimeout( function () {$scope.runReportSchedule(rpt,seqRun );},300);
                }
            }
            seqRun(rpts);

            if (($scope.minuteCount % 5) == 0 && $scope.minuteCount > 0)
            {
                $scope.loadAdminDashboardAtApp(
                    function ()
                {

                },true)
                
            }

        }
                    
        $scope.minuteCount++;
   }
   catch (err)
   {
     setTimeout($scope.reloadPage,60000);

   }
   finally
        {    
            setTimeout($scope.runTimerTools,60000);
        }
    }

   

    $scope.initTimer = function ()

    {

        if (timer != "")
        {
            $scope.minuteCount = 0;
            $scope.runTimerTools();
            //setInterval($scope.runTimerTools,60000);
           //setTimeout($scope.runTimerTools,60000);
        }
    }

 

    $scope.runTool = function ()
    {
        $scope.currentBatchStep = "Please wait. Running tool.";
        
        document.getElementById("batchTableOutput").innerHTML = "";
        document.getElementById("xlsDownloadButton").style["visibility"] = "hidden";
        var filter;
        if (typeof $scope.currentProjectFilter === 'undefined')
        {
            filter = null;
        }
        else
        {

            if ($scope.currentProjectFilter == null)
            {
                location.reload();
            }
            filter = $scope.currentProjectFilter.filter;
        }
        var allItems = [];
        var allCount = 0;
        $scope.currentBatchStep = 'Processing Calculation';
        $scope.selectedTool.function (atTaskWebService, ATTASK_INSTANCE,sessionID,filter,
               function (updatedItems,isComplete) 
               {
                   if (!isComplete)
                       $scope.currentBatchStep += '.';
                   else
                       $scope.currentBatchStep = 'Calculation Completed.';


                   if (Array.isArray(updatedItems))
                       allItems=  allItems.concat(updatedItems);
                   else
                   {
                       allItems.push(updatedItems);
                       if (!(typeof updatedItems.error === 'undefined'))
                       {
                           if (updatedItems.error.message == 'You are not currently logged in' && credential != '')
                           {
                               allItems.push({comments:'Attempting to re-establish connection to Workfront.'});
                               $scope.checkForCredential($scope.runTool);
                           }
                       }

                   }
                   allCount = allItems.count; 

                   var tmp = document.getElementById("batchTableOutput");
                   if (isComplete) $scope.logExecution(allItems,$scope.selectedTool.name,true);
                   tmp.innerHTML = $scope.JSONtoTable(allItems); 
                   document.getElementById("xlsDownloadButton").style["visibility"] = "visible";
                   // $scope.currentBatchStep =JSON.stringify(updatedItems);
               }
            ,
               function() 
               {
        
               });
    }        
    
 




    $scope.logUse = function(licenseCallback)
    {

        var url = atTaskHost + "/attask/" + api + "/cmpy/search?method=GET&" + 
                 "&sessionID=" + sessionID +
                 "&fields=customer:name,customer:ID&$$LIMIT=1";
        
        atTaskWebService.atTaskGet(url, 

            function (data)
            {
                if (typeof(data[0]) === 'undefined')
                { 
                    location.reload();
                    return;
                }
                var json = {page:'AdminDashboard.aspx',request:location.search,custID:data[0].customer.ID,company:data[0].customer.name};
                var lDate = new Date();
                lDate.setHours(lDate.getHours() - lDate.getTimezoneOffset() / 60);
                lDate = lDate.toJSON();
                var fname = (data[0].customer.name );
                fname = fname.replace(/[|&;$%@"<>()+,]/g, "");
 

                $http({
                    url:   LICENSE_HOST + '/Tools/Subform/UsageTracker.aspx?f=' + fname,
                    method: "POST",
                    data: {dateTime: lDate, activity: json},
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }
                }).then(licenseCallback);
            },
            function (error) 
            {
               $scope.checkForCredential();
            }
            );

    }


    $scope.logExecution = function(json,logOperation,isUberCalc)
    {

        
      if (isUberCalc)
        json = json.map(function(j){ return {comments:j.comments,link:j.link}});

        var lDate = new Date();
        lDate.setHours(lDate.getHours() - lDate.getTimezoneOffset() / 60);
        lDate = lDate.toJSON();
        var fname = (logTo + ' ' + logOperation);
        fname = fname.replace(/[|&;$%@"<>()+,\/]/g, "");
 
        if (logTo != "")
        {
            $http({
                url:   LICENSE_HOST + '/Tools/Subform/UberCalcStats.aspx?f=' + fname,
                method: "POST",
                data: {executionTime: lDate, executionLog: json},
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }
            });

            var errors = json.filter(function(e){return !(typeof e.error === 'undefined')});
            if (errors.length > 0)
            {
                $http({
                    url:   LICENSE_HOST + '/Tools/Subform/UberCalcStats.aspx?f=' + fname + ' ERR ' + new Date().getTime(),
                    method: "POST",
                    data: {executionTime: lDate, executionLog: json},
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }
                });

            }
        }
    }



    $scope.getHTMLTableforXlsDownload = function () {

 
        // Replace angular ng-binding ng-scope class attribute prefix to allow the above styles to be rendered by excel
        var tableHTML = document.getElementById("batchTableOutput").outerHTML.replace(/ng-binding ng-scope /g, "");
     

        return { "title": $scope.selectedTool.name  , "content":  tableHTML };
    }

    $scope.startup = function ()
    {

        $scope.logUse(
        function (response)
        {

            if (!response.data.isValid)
            {
                document.body.innerHTML =   response.data.message;
            }

            else
                if (response.data.isWarn)
                {
                    var msgDiv = document.body.appendChild(document.createElement('div'));
                    msgDiv["id"] = "LicenseMessageWindow";
                    msgDiv.style["position"] = "absolute";
                    msgDiv.style["top"] = "1px";
                    msgDiv.style["left"] = "1px";
                    msgDiv.style["color"] = "black";
                    msgDiv.style["width"] = "100%";
                    msgDiv.style["padding-left"] = "50px";
                    msgDiv.style["height"] = "100%";
                    msgDiv.style["background-color"] = "white";
                    msgDiv.style["opacity"] = .8;
                    msgDiv.innerHTML = response.data.message;

                    var timeoutMsec = 10000;
                    if (!(typeof response.data.warningTimeoutSeconds === 'undefined'))
                    {
                        timeoutMsec = response.data.warningTimeoutSeconds * 1000;
                    }

                    setTimeout(function()
                    {
                        document.getElementById("LicenseMessageWindow").style["display"] = "None";
                    },timeoutMsec);         

        
                }
                else
                {
                    console.log(JSON.stringify(response.data));
                }
         


 

            if (timer != null)
            {
                setTimeout($scope.reloadIfTimeout,60000);
            }

            launchReportIfLoaded = $scope.launchReportIfLoaded;
            document.getElementById("pdfFrame").style["display"] = "inline";         
            $scope.loadAdminDashboardAtApp(
            function ()
            {
 
                if (showProjectFilter == "false")
                {
                    document.getElementById("projectTab").style["display"] = "none";
                }
                else
                {
                    $scope.loadProjectFilters('');
                }

                if (showTaskFilter != "")
                {
                    $scope.loadTaskFilters('');  
                    document.getElementById("taskFilterSpan").style["display"] = "inline";
                    document.getElementById("taskTab").style["display"] = "inline";
                } 
                else
                {
                    document.getElementById("taskFilterSpan").style["display"] = "none";
                    document.getElementById("taskTab").style["display"] = "none";
                }


                if (userFilterType != "")
                {   
                    $scope.userFilterName = (userFilterName == "" ? "Other Filter" : userFilterName);
                    $scope.loadCustomUserFilter(userFilterType,
                    function (filterData)
                    {
                        $scope.userFilters = filterData;
                        $scope.selectedUserFilter = $scope.userFilters[0];
                        if (defaultUserFilter != "")
                        {
                             var dFilt = $scope.userFilters.map(function (uf) {  return uf.name == defaultUserFilter});
                             if (dFilt.length > 0)
                                {
                                    $scope.selectedUserFilter = dFilt[0];
                                }
                        }
                        document.getElementById("userFilterTab").style["display"] = "inline";
                    });
                }
                else
                {
                    document.getElementById("userFilterTab").style["display"] = "none";
                }

     
                $scope.getCompanyList();

                 if (showDateFilter == "false")
            {
                 document.getElementById("dateTab").style["display"] = "none";
            }
            else
            {
                $scope.selectDateRangeForFilter(); 
            }

            }

            );
        }); //log use
    } // startup

    $scope.checkForCredential = function (callback)
    { 

        if (credential != "" && host != "" )
        {
         
            var  credURL = "https://reports.corp.gs/GetCredentialSession.aspx?credential=" + encodeURIComponent(credential) + "&host=" + host;

            $http({
                method: 'GET',
                url: credURL
            }).then(function successCallback(response) {
                userSessionID = sessionID;
                sessionID = response.data.sessionID;
                callback();                     
            }, function errorCallback(response) {
                 if (timer == null || timer == "") alert ('Credential argument or host argument invalid, or password changed in Workfront'); 
                 else setTimeout($scope.reloadPage,60000);
            });

        }
        else
        {
            callback();
 
        }
    }

    $scope.checkForCredential($scope.startup);
 

} // controller function code
 
); // controller object