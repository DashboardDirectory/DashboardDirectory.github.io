 
 
 
 app.factory('$blob', function () {
            return {
                 xlsHTMLTableToURL: function (content) {
                            var blob;
                            blob = new Blob([content], { type: 'application/xls' });
                            return (window.URL || window.webkitURL).createObjectURL(blob);
                        },
                        sanitizeXLSName: function (name) {
                            if (/^[A-Za-z0-9]+\.xls$/.test(name)) {
                                return name;
                            }
                            if (/^[A-Za-z0-9]+/.test(name)) {
                                return name + ".xls";
                            }
                            throw new Error("Invalid title for XLS file : " + name);
                        },
                rdlStringToURL: function (content) {
                    var blob;
                    blob = new Blob([content], { type: 'application/rdl' });
                    return (window.URL || window.webkitURL).createObjectURL(blob);
                },
                sanitizeRdlName: function (name) {
                    if (/^[A-Za-z0-9]+\.rdl$/.test(name)) {
                        return name;
                    }
                    if (/^[A-Za-z0-9]+/.test(name)) {
                        return name + ".rdl";
                    }
                    throw new Error("Invalid title for rdl file : " + name);
                },
                revoke: function (url) {
                    return (window.URL || window.webkitURL).revokeObjectURL(url);
                }
            };
        });

        app.factory('$click', function () {
            return {
                on: function (element) {
                    var e = document.createEvent("MouseEvent");
                    e.initMouseEvent("click", false, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                    element.dispatchEvent(e);
                }
            };
        });

app.directive('downloadXls', function ($parse, $click, $blob, $log, $timeout) {
    return {
        compile: function ($element, attr) {
            var fn = $parse(attr.downloadXls);

            return function (scope, element, attr) {

                element.on('click', function (event) {


                    if (navigator.appVersion.toString().indexOf('.NET') > 0) {
                        // TODO:  IE file download not yet working.
                        window.navigator.msSaveOrOpenBlob($blob.xlsHTMLTableToURL(content), $blob.sanitizeXLSName(title));
                    }
                    else {


                        var a_href, content, title, url, _ref;
                        _ref = fn(scope), content = _ref.content, title = _ref.title;

                        if (!(content != null) && !(title != null)) {
                            $log.warn("Invalid content or title in download-xls : ", content, title);
                            return;
                        }

                        title = $blob.sanitizeXLSName(title);
                        url = $blob.xlsHTMLTableToURL(content);

                        element.append("<a download=\"" + title + "\" href=\"" + url + "\"></a>");
                        a_href = element.find('a')[0];

                        $click.on(a_href);
                        $timeout(function () { $blob.revoke(url); });

                        element[0].removeChild(a_href);
                    }

                });
            };
        }
    };
});

        app.directive('downloadRdl', function ($parse, $click, $blob, $log, $timeout) {
            return {
                compile: function ($element, attr) {
                    var fn = $parse(attr.downloadRdl);

                    return function (scope, element, attr) {

                        element.on('click', function (event) {


                            if (navigator.appVersion.toString().indexOf('.NET') > 0) {
                                // TODO:  IE file download not yet working.
                                window.navigator.msSaveOrOpenBlob($blob.rdlStringToURL(content), $blob.sanitizeRdlName(title));
                            }
                            else {


                                var a_href, content, title, url, _ref;
                                _ref = fn(scope), content = _ref.content, title = _ref.title;

                                if (!(content != null) && !(title != null)) {
                                    $log.warn("Invalid content or title in download-rdl : ", content, title);
                                    return;
                                }

                                title = $blob.sanitizeRdlName(title);
                                url = $blob.rdlStringToURL(content);

                                element.append("<a download=\"" + title + "\" href=\"" + url + "\"></a>");
                                a_href = element.find('a')[0];

                                $click.on(a_href);
                                $timeout(function () { $blob.revoke(url); });

                                element[0].removeChild(a_href);
                            } //else 

                        }); //element.on
                    }; // function (scope
                } // compile
            }; // return
        }); // client Download
 
