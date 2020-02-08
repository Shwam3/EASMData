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
    document.title = "Signal Maps - Loading";

    var logReader = new FileReader();
    var initReader = new FileReader();
    logReader.onload = function(e) { logContents = e.target.result; loadReplay2(); }
    initReader.onload = function(e) { initContents = e.target.result; loadReplay2(); }
    if (logFile.size > 0 && initFile.size > 0)
    {
        var logRead = 0;
        var initRead = 0;
        document.title = "Signal Maps - Loading Replay (0%, 0%, 0%)";
        logReader.onprogress  = function(e) { logRead  = e.loaded; document.title = "Signal Maps - Loading (" + Math.floor(100 * initRead / initFile.size) + "%, " + Math.floor(100 * e.loaded / logFile.size) + "%, 0%)"; }
        initReader.onprogress = function(e) { initRead = e.loaded; document.title = "Signal Maps - Loading (" + Math.floor(100 * e.loaded / initFile.size) + "%, " + Math.floor(100 * logRead / logFile.size)  + "%, 0%)"; }
    }
    logReader.readAsArrayBuffer(logFile);
    initReader.readAsText(initFile);
}

function loadReplay2()
{
    if (initContents == undefined || logContents == undefined)
        return;

    if (initFile.size > 0 && logFile.size > 0)
        document.title = "Signal Maps - Loading (100%, 100%, 0.00%)";

    try
    {
        var fileDateBits = initFile.name.substring(0,8).split('-');
        replayDate = new Date('20'+fileDateBits[2], fileDateBits[1]-1, fileDateBits[0]).getTime();
        replayTime = 0;
        replayDataIndex = 0;
        replayState = 0;

        var parser = new Worker(URL.createObjectURL(new Blob(["("+worker_logParser.toString()+")()"], {type: 'text/javascript'})));
        parser.onmessage = function(evt)
        {
            if (evt.data[0] == "title")
                document.title = evt.data[1];
            else if (evt.data[0] == "result")
                loadReplay3(JSON.parse(evt.data[1]));
            parser = undefined;
        }
        parser.onerror = (err) => console.error(err);
        parser.postMessage(logContents, [logContents]);

        initData = JSON.parse(initContents).TDData;
        initContents = undefined;

        if (initFile.size > 0 && logFile.size > 0)
        {
            var logFrac = 10000 * logFile.size / (initFile.size + logFile.size);
            var initPerc = Math.ceil(10000 - logFrac) / 100;
            document.title = "Signal Maps - Loading (100%, 100%, " + initPerc + "%)";
        }
        parser.postMessage([initPerc, logFrac, areasA, areasS]);
    }
    catch(err)
    {
        document.title = "Signal Maps";
        console.error(err);
        alert('File read failed');

        return;
    }
}
function worker_logParser()
{
    var running = false;
    var logContents = undefined;
    var initPerc = undefined;
    var logFrac = undefined;
    var areasA = undefined;
    var areasS = undefined;

    onmessage = function(evt)
    {
        if (Array.isArray(evt.data))
        {
            initPerc = evt.data[0];
            logFrac = evt.data[1];
            areasA = evt.data[2];
            areasS = evt.data[3];

            if (!running && logContents != undefined)
                parse();
        }
        else
        {
            logContents = new TextDecoder("UTF-8").decode(evt.data);

            if (!running && initPerc != undefined && logFrac != undefined)
                parse()
        }
    }

    function parse()
    {
        console.log('Parsing for (A) ' + areasA.join(',') + ' and (S) ' + areasS.join(','));
        
        initPerc *= 100;
        running = true;
        var logSplit = logContents.split('\n');
        logContents = undefined;
        var logLineCount = logSplit.length;
        var replayData = new Array(1000);
        var i = 0;
        var j = 0;

        for (var line of logSplit)
        {
            j++;
            if (j % 1000 == 0)
                postMessage(["title", "Signal Maps - Loading (100%, 100%, " + (Math.floor(initPerc + logFrac * j / logLineCount) / 100) + "%)"]);

            if (!line || line.length < 30)
                continue;
            
            if (line.substring(20, 22) == 'CT' || (line[20] == 'S' ? areasS.indexOf(line.substring(23, 25)) : areasA.indexOf(line.substring(28, 30))) == -1)
                continue;

            replayData[i++] = {time: getTime(line[10]+line[11], line[13]+line[14], line[16]+line[17]), event: line.substring(20).replace('\r', '').split(' ')};
        }

        logSplit = undefined;
        replayData.sort((o1, o2) => o1.time - o2.time);

        postMessage(["title", "Signal Maps - Loading (100%, 100%, 100%)"]);
        postMessage(["result", JSON.stringify(replayData)]);

        running = false;
        close();
    }

    function getTime(hr,mn,sc)
    {
        return hr*3600000 + mn*60000 + sc*1000;
    }

    console.log('Worker initialised');
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
