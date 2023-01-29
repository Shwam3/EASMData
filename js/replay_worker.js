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
        areasA = evt.data[0];
        areasS = evt.data[1];

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
            postMessage(["progress", j / logLineCount)]);

        if (!line || line.length < 30)
            continue;
        
        if (line.substring(20, 22) == 'CT' || (line[20] == 'S' ? areasS.indexOf(line.substring(23, 25)) : areasA.indexOf(line.substring(28, 30))) == -1)
            continue;

        replayData[i++] = {time: getTime(line[10]+line[11], line[13]+line[14], line[16]+line[17]), event: line.substring(20).replace('\r', '').split(' ')};
    }

    logSplit = undefined;
    replayData.sort((o1, o2) => o1.time - o2.time);

    postMessage(["progress", j / logLineCount)]);
    var data = ["result", new TextEncoder("UTF-8").encode(JSON.stringify(replayData))];
    console.log("break");
    postMessage(data, [data[1]]);

    running = false;
    close();
}

function getTime(hr,mn,sc)
{
    return hr*3600000 + mn*60000 + sc*1000;
}

console.log('Worker initialised');