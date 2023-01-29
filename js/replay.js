var initFile;
var logFile;
var initContents;
var logContents;
var replayData;
var initData;
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
    initContents = undefined;
    logContents = undefined;

    document.getElementById('replayGo').setAttribute('disabled', true);
    document.title = "Signal Maps - Loading (0%, 0%)";

    console.profile('fileRead');
    var initStream = initFile.stream();
    if (initFile.type === 'application/x-gzip' || initFile.name.endsWith('.gz'))
        initStream = initStream.pipeThrough(new DecompressionStream('gzip'));
    new Response(initStream).text().then(t => {
            initContents = t;
            document.title = "Signal Maps - Loading (50%, 0%)";
            loadReplay2();
        });

    var logStream = logFile.stream();
    if (logFile.type === 'application/x-gzip' || logFile.name.endsWith('.gz'))
        logStream = logStream.pipeThrough(new DecompressionStream('gzip'));
    new Response(logStream).blob().then(b => b.arrayBuffer()).then(b => {
            logContents = b;
            document.title = "Signal Maps - Loading (50%, 0%)";
            loadReplay2();
        });
}

function loadReplay2()
{
    if (initContents == undefined || logContents == undefined)
        return;
    
    console.profileEnd('fileRead');

    if (initFile.size > 0 && logFile.size > 0)
        document.title = "Signal Maps - Loading (100%, 0%)";

    try
    {
        var fileDateBits = initFile.name.substring(0,8).split('-');
        replayDate = new Date('20'+fileDateBits[2], fileDateBits[1]-1, fileDateBits[0]).getTime();
        replayTime = 0;
        replayDataIndex = 0;
        replayState = 0;

        var parser = new Worker("https://signalmaps.co.uk/webclient/js/replay_worker.js?r=2022-06-23h");
        parser.onmessage = evt =>
        {
            if (evt.data[0] == "progress" && document.title !== "Signal Maps - Loading (100%, " + Math.floor(99 * evt.data[1]) + "%)")
                document.title = "Signal Maps - Loading (100%, " + Math.floor(99 * evt.data[1]) + "%)";
            else if (evt.data[0] == "result")
                loadReplay3(JSON.parse(new TextDecoder("UTF-8").decode(evt.data[1])));
        }
        parser.onerror = err => console.error(err);
        parser.postMessage(logContents, [logContents]);

        initData = JSON.parse(initContents).TDData;
        initContents = undefined;

        document.title = "Signal Maps - Loading (100%, 0%)";
        parser.postMessage([areasA, areasS]);
    }
    catch(err)
    {
        document.title = "Signal Maps";
        console.error('File read failed:');
        console.error(err);

        return;
    }
}
function loadReplay3(parsedData)
{
    closeSocket(true);
    data = initData;
    replayData = parsedData;
    fillBerths();

    document.getElementById('controllerPlayRev').removeAttribute('disabled');
    document.getElementById('controllerPause').removeAttribute('disabled');
    document.getElementById('controllerPlayFor').removeAttribute('disabled');
    document.getElementById('controllerSpeed').removeAttribute('disabled');
    document.title = "Signal Maps - Replay";
    isReplaying = true;
    console.log('Reading complete');
}
function resetReplay(time)
{
    controllerPause();
    
    data = initData;
    lastReplayTime = performance.now();
    replayDataIndex = 0;
    replayTime = time;
    
    replayState = 1;
    replayUpdate();
    controllerPause();
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
    document.getElementById('clock').textContent = clockStr(new Date(isReplaying ? (replayDate+replayTime) : Date.now()));
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
    if (event[0] == 'Change')
    {
        setData(event[1], invert ? event[3] : event[5]);
    }
    else if (event[0] == 'Interpose')
    {
        setData(event[3], invert ? '' : event[1]);
    }
    else if (event[0] == 'Cancel')
    {
        setData(event[3], invert ? event[1] : '');
    }
    else if (event[0] == 'Step')
    {
        setData(event[3], invert ? event[1] : '');
        setData(event[5], invert ? '' : event[1]);
    }
    else if (event[0] == 'CA')
    {
        setData(event[2], invert ? event[1] : '');
        setData(event[3], invert ? '' : event[1]);
    }
    else if (event[0] == 'CB')
    {
        setData(event[2], invert ? event[1] : '');
    }
    else if (event[0] == 'CC')
    {
        setData(event[2], invert ? (event.length == 4 ? event[3] : '') : event[1]);
    }
    else if (event[0][0] == 'S')
    {
        setData(event[1], invert ? event[2] : event[3]);
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
