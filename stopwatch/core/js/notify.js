/**
 * Created with JetBrains PhpStorm.
 * User: Tobias
 * Date: 24/03/13
 * Time: 3:03 PM
 * To change this template use File | Settings | File Templates.
 */

// if running start notification every 30 min reminding user that it's running maybe giving the ability to stop
var interval;
var notifyWorkIntervalTime=30;
function startNotify(task){
    interval = setInterval(function(){notifyWorking(task)}, notifyWorkIntervalTime * 60 *1000);//notifyWorkIntervalTime * 60 * 1000
}

function stopNotify(){
    clearInterval(interval);
}

function notifyWorking(task){
    if(!window.webkitNotifications){
        stopNotify();
        return;
    }
    //uses web_accessible_resources
    var notification = webkitNotifications.createNotification(
        "../icons/timer48x48.png",
        'Still working on Task:',
        task.name+'\n'+task.details.split(', Due:')[0]
    );

    // Or create an HTML notification: (chrome extension only)
   /* var notification = webkitNotifications.createHTMLNotification(
     'core/js/workingNotify.html?name='+task.name+'&id='+task.ID  // html url - can be relative
     );
     */
    notification.show();

    setTimeout(function(){
        notification.cancel();
    },7000);
}

//should I create an interval to check if friday then clear, otherwise check every 60 min for 4:30 ?
function notifyFriday(){
    var notification = webkitNotifications.createNotification(
        "icons/timer48x48.png",
        'Remember: Submit Timesheet!',
        ''
    );

    notification.show();

    setTimeout(function(){
        notification.cancel();
    },7000);
}
