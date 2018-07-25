
function openApp(url, window_params){
    popupWindow = window.open(url, 'popUpWindow', window_params);
}

window.onload = function () {

    var url = "https://dashboard.directory/stopwatch/launch.html"+location.search;
    var window_params = 'height=600,width=450,left=100,top=100,resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,directories=no, status=no';
    var link = "javascript: (function(){window.open('"+url+"','popUpWindow','"+window_params+"')})();";
    jQuery('.bookmark').each(function() {
        jQuery(this).attr('href',link);
    });
    var ua = navigator.userAgent;
    var msie = ua.indexOf ( "MSIE " );

    if ((typeof window.sidebar == "object") && (typeof window.sidebar.addPanel == "function")) {
        // Gecko
        jQuery('.firefox').show();
    } else if (msie>0 && typeof window.external == "object") {
       // if (isIE8()) {
            // IE 8
       //     jQuery('.ie').show();
       // }
       // else
       if(9 > parseInt (ua.substring (msie+5, ua.indexOf (".", msie )))) {
            // IE 6
            jQuery('#message').hide();
            jQuery('#bookmark').hide();
            jQuery('.ie6').show();
            return;
        }else{
            jQuery('.ie').show();
        }
    } else if (window.opera) {
        jQuery('.opera').show();
    } else if (window.hasOwnProperty('chrome')) {
        jQuery('.chrome').show();
    } else if (ua.indexOf('Safari') != -1 &&
        ua.indexOf('Chrome') == -1) {
        jQuery('.safari').show();
    }
    openApp(url, window_params);
};
//todo test for ie6 and show message not supported
function isIE8() {
    var rv = -1;
    if (navigator.appName == 'Microsoft Internet Explorer') {
        var ua = navigator.userAgent;
        var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
        if (re.exec(ua) != null) {
            rv = parseFloat(RegExp.$1);
        }
    }
    if (rv > -1) {
        if (rv >= 8.0) {
            return true;
        }
    }
    return false;
}