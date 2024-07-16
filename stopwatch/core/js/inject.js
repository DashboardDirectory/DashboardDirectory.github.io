function init() {
    const targetNode = document.getElementById('root');
    const config = { childList: true, subtree: true };
    var lastTaskNav = '';
    var lastTaskHead = '';
    var getSwHtml = function(name) {
     return '<div role="button" tabindex="0" aria-disabled="false" aria-roledescription="sortable" aria-describedby="DndDescribedBy-7" style="transition: transform 0ms linear 0s;">' +
        '<div data-testid="navitem-tabs-task-stopwatch">' +
        '<div class="relative "><a class="" style="background: #ffaa01; display: flex; align-items: center; justify-content: flex-start; height: 32px; white-space: nowrap; text-decoration: none; position: relative; z-index: 2; margin: 0px 8px 4px; padding: 10px;"' +
        ' href="javascript: (function(){' +
        'const url = \'https://dashboard.directory/stopwatch/launch.html?autostart=true&taskname='+encodeURIComponent(name.split("'").join(''))+'\';' +
        'if (window.swpop && window.swpop.opener) { window.swpop.location.href = url; window.swpop.focus(); } else {' +
        'window.swpop = window.open(url,\'swpop\', \'height=600,width=450,left=100,top=100,resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,directories=no,status=no\');' +
        '}})()"' +
        ' aria-current="page"><span style=" flex-direction: column; display: flex; justify-content: center; margin: 0px 8px 0px 0px; min-width: 20px;" aria-labelledby="Stopwatch">⏱' +
        '</span><div class="secondary-nav-tab-label secondary-nav-default-label" id="stopwatch"><span class="" data-testid=""><span data-testid="" class="">Stopwatch</span></span></div>' +
        '</a></div></div></div>'};
    const callback = function(mutationsList, observer) {
        let navElement;
        let taskElement;
        let shareElement;
        for (let mutation of mutationsList) {
            if (mutation.type === 'childList') {
                taskElement = taskElement? taskElement : document.querySelector('[data-testid="name-editor-wrapper"]');
                if (!taskElement) {
                    return;
                }
                navElement = navElement ? navElement : document.querySelector('[data-testid="secondary-nav-root"] > div > div > div');
                if (navElement && taskElement.textContent !== lastTaskNav) {
                    lastTaskNav = taskElement.textContent;
                    let e = document.createElement('div');
                    e.innerHTML = getSwHtml(lastTaskNav);
                    navElement.appendChild(e );
                } else {
                    shareElement = shareElement ? shareElement : document.querySelector('[id="update-status-toolbar"] > div > div > div');
                    if (shareElement && taskElement.textContent !== lastTaskHead) {
                        lastTaskHead = taskElement.textContent;
                        let etop = document.createElement('div');
                        etop.innerHTML = getSwHtml(lastTaskHead);
                        shareElement.appendChild(etop);
                    }
                }
                break;
            }
        }
    };

    const observer = new MutationObserver(callback);
    observer.observe(targetNode, config);
};

init();