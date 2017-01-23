var initFile;
var logFile;
var initContents;
var logContents;
var replayData;
var isReplaying = false;
var lastReplayTime = -1;
var replayState = 0; // 0: pause, -1: rev, 1: fwd
var replaySpeed = 1;
var replayDate = -1;
var replayTime = -1;
var replayDataIndex = 0;
var updaterID;

function showReplay()
{
    if (initFile && logFile)
        document.getElementById('replayGo').removeAttribute('disabled');
}

function loadReplay()
{
    if (!initFile)
    {
        alert('No init file selected');
        return;
    }
    if (!logFile)
    {
        alert('No log file selected');
        return;
    }
    if (logFile.name.substring(0,8) != initFile.name.substring(0,8))
    {
        alert('File dates differ');
        return;
    }
    
    document.getElementById('replayGo').setAttribute('disabled',true);
    document.getElementById('controllerPlayRev').removeAttribute('disabled');
    document.getElementById('controllerPause').removeAttribute('disabled');
    document.getElementById('controllerPlayFor').removeAttribute('disabled');
    document.getElementById('controllerSpeed').removeAttribute('disabled');
    
    var initReader = new FileReader();
    initReader.onload = function(e) { initContents = e.target.result; loadReplay2(); }
    initReader.readAsText(initFile);
    var logReader = new FileReader();
    logReader.onload = function(e) { logContents = e.target.result; loadReplay2(); }
    logReader.readAsText(logFile);
}

function loadReplay2()
{
    if (initContents == undefined || logContents == undefined)
        return;
    
    try
    {
        var fileDateBits = initFile.name.substring(0,8).split('-');
        replayDate = new Date('20'+fileDateBits[2], fileDateBits[1]-1, fileDateBits[0]).getTime();
        replayTime = 0;
        replayDataIndex = 0;
        replayState = 0;
        
        var initData = JSON.parse(initContents).TDData;
        closeSocket(true);
        data = initData;
        data['XXMOTD'] = data['XXMOTD'] || 'Replaying ' + initFile.name.substring(0,8);
        fillBerths();
        
        replayData = [];
        var logSplit = logContents.split('\n');
        for (line in logSplit)
        {
            if (!logSplit[line] || logSplit[line].length < 43)
                continue;
            
            var replayEvent = {};
            var lineTimeBits = logSplit[line].substring(10,18).split(':')
            replayEvent['time'] = getTime(lineTimeBits[0],lineTimeBits[1],lineTimeBits[2]);
            replayEvent['event'] = logSplit[line].substring(20);
            replayData.push(replayEvent);
        }
        
        replayData.sort(function(o1, o2)
        {
            return o1.time - o2.time;
        });
        
        isReplaying = true;
    }
    catch(err)
    {
        alert('File read failed');
        console.error(err);
    }
    
    console.log('Reading complete');
}
function replayUpdate()
{
    var time = performance.now();
    if (lastReplayTime < 0)
    {
        lastReplayTime = time;
        return;
    }
    var delta = (time - lastReplayTime) * replaySpeed;
    lastReplayTime = time;
    
    replayTime += delta * replayState;
    replayTime = Math.min(Math.max(replayTime, 0), 86400000);
    if (replayTime <= 0 || replayTime >= 86400000)
        controllerPause();
    
    if (replayState > 0)
    {
        while (replayData[replayDataIndex].time < replayTime)
        {
            applyEvent(replayData[replayDataIndex].event, false);
            replayDataIndex++;
            
            if (replayDataIndex >= replayData.length)
            {
                fillBerths();
                controllerPause();
                alert('End of replay data');
                break;
            }
        }
        fillBerths();
    }
}
function controllerPlayRev()
{
    if (replayState == 0)
        updaterID = setInterval(replayUpdate, 100/6);
    replayState = -1;
    
    document.getElementById('controllerPlayRev').style.color = 'black';
    document.getElementById('controllerPause').style.color = 'darkgray';
    document.getElementById('controllerPlayFor').style.color = 'darkgray';
}
function controllerPause()
{
    clearInterval(updaterID);
    updaterID = undefined;
    replayState = 0;
    lastReplayTime = -1;
    
    document.getElementById('controllerPlayRev').style.color = 'darkgray';
    document.getElementById('controllerPause').style.color = 'black';
    document.getElementById('controllerPlayFor').style.color = 'darkgray';
}
function controllerPlayFor()
{
    if (replayState == 0)
        updaterID = setInterval(replayUpdate, 100/6);
    replayState = 1;
    
    document.getElementById('controllerPlayRev').style.color = 'darkgray';
    document.getElementById('controllerPause').style.color = 'darkgray';
    document.getElementById('controllerPlayFor').style.color = 'black';
}
function controllerSpeed()
{
    replaySpeed = document.getElementById('controllerSpeed').value;
}
doClock = function()
{
    var date = new Date(isReplaying ? (replayDate+replayTime) : Date.now());
    document.getElementById('clock').innerHTML = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) +
        ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) +
        ':' + (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());
}
var oldRecon = reconnect;
reconnect = function()
{
    if (isReplaying)
        window.location.reload();
    else
        oldRecon();
}
function applyEvent(event, invert)
{
    if (event.startsWith('Change '))
    {
        setData(event.substring(7, 13), invert ? event.substring(19,20) : event.substring(24,25));
    }
    else if (event.startsWith('Interpose '))
    {
        setData(event.substring(18, 24), invert ? '' : event.substring(10,14));
    }
    else if (event.startsWith('Cancel '))
    {
        setData(event.substring(17, 23), invert ? event.substring(7,11) : '');
    }
    else if (event.startsWith('Step '))
    {
        setData(event.substring(15, 21),  invert ? event.substring(5,9) : '');
        setData(event.substring(25, 31), !invert ? event.substring(5,9) : '');
    }
}
function getTime(hr,mn,sc)
{
  return hr*3600000 + mn*60000 + sc*1000;
}

document.getElementById('replayInit').addEventListener('change', function(e) { if (e.target.files[0]) initFile = e.target.files[0]; showReplay(); }, false);
document.getElementById('replayLog').addEventListener('change', function(e) { if (e.target.files[0]) logFile = e.target.files[0]; showReplay(); }, false);
document.getElementById('controllerPlayRev').addEventListener('click', controllerPlayRev, false);
document.getElementById('controllerPause').addEventListener('click', controllerPause, false);
document.getElementById('controllerPlayFor').addEventListener('click', controllerPlayFor, false);