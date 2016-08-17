var port = 6322;
var page;
var dev = false;
var connection;
var disconn = false;
var attempt = -1;
var lastMessage = -1;
var lastTimestamp = -1;
var needsFilling = true;
var data = {};
var navIndex = {};
var displayIDs = false;
var displayBerths = true;
var displayPoints = true;
var displaySignals = true;
var displayText = true;
var displayDataText = true;
var displayTrackC = true;
var berths = [];
var signals = [];
var points = [];
var latches = [];
var dataText = [];
var text = [];
var trackc = [];
var statusElem = undefined;
var mapJSON;
var maxPageId = 1;
var loaded = false;
var connected = false;
var defaultInner = document.getElementById('map').innerHTML;
var htmlIDToObj = {};
var ntpTypeOffset = 0;

function loadPage(newPage)
{    
    obscureCheck(false);

    page = parseInt(newPage);
    load();
}

function load()
{
    var oldCursor = document.getElementById('map').style.cursor;
    document.getElementById('map').style.cursor = 'wait';

    obscureCheck(false);

    if (!page && page != 0)
        page = parseInt(window.location.hash.substring(1) || localStorage.getItem('page') || '0');
    else if (page > maxPageId)
        page = 0;
    else if (page < 0)
        page = maxPageId;
    window.location.hash = '#' + page;
    document.getElementById('pageSelector').value = page;
    localStorage.setItem('page',page);
    
    htmlID = 0;
    if (dev && page == maxPageId)
    {
        htmlIDToObj = {};
        devPage();
        return;
    }
    document.getElementById('map').style.overflowY = null;

    var pageData = mapJSON.signalMap[page];
    var mapBerths = pageData.berths;
    var mapSignals = pageData.signals;
    var mapPoints = pageData.points;
    var mapText = pageData.text;
    var map = document.getElementById('map');

    doClock();
    document.getElementById('desc').innerHTML = (page+1) + '. ' + pageData.panelDescription;

    htmlIDToObj = {};
    map.innerHTML = defaultInner;
    document.getElementById('mapImage').src = '/webclient/images/maps/'+pageData.imageName.replace('+','%2B')+'.png?r=' + getRnd();
    document.getElementById('mapImage').draggable = false;
    berths = [];
    signals = [];
    latches = [];
    points = [];
    dataText = [];
    text = [];
    trackc = [];
    statusElem = undefined;
    
    for (var k in mapBerths)
    {
        berths.push(new Berth(mapBerths[k]));
    }

    for (var k in mapSignals)
    {
        if (mapSignals[k].type.match(/(UP|DOWN|LEFT|RIGHT|NONE)/) || (dev && mapSignals[k].type == 'TEST'))
            signals.push(new Signal(mapSignals[k]));
        else if (mapSignals[k].type == 'TEXT')
            dataText.push(new DataText(mapSignals[k]));
        else if (mapSignals[k].type == 'LATCH')
            latches.push(new Latch(mapSignals[k]));
        else if (mapSignals[k].type == 'TRACKC')
            trackc.push(new TrackCircuit(mapSignals[k]));
        else if (mapSignals[k].type == 'SYSMSG')
            statusElem = new Status(mapSignals[k]);
    }

    for (var k in mapPoints)
    {
        points.push(new Points(mapPoints[k]))
    }
    
    for (var k in mapText)
    {
        text.push(new Text(mapText[k]));
    }
    fillBerths();
    
    document.body.scrollTop = document.documentElement.scrollTop = 0;
    map.style.cursor = oldCursor || 'crosshair';
    loaded = true;
    obscureCheck(true);
}

function updatePageList(json)
{
    if (json)
    {
        navIndex = {};
        var list = document.getElementById('pageSelector');
        list.innerHTML = '';
        for (var p in json.signalMap)
        {
            var page = json.signalMap[p];
            navIndex[page.panelUID] = p;
            var opt = document.createElement('option');
            opt.value = p;
            opt.innerHTML = (++p) + '. ' + page.panelName;
            list.appendChild(opt);
        }
        maxPageId = list.children.length-1;
        
        if (dev)
        {
            navIndex['dev'] = maxPageId+1;
            var opt = document.createElement('option');
            opt.value = ++maxPageId;
            opt.innerHTML = (maxPageId+1) + '. Dev Page';
            list.appendChild(opt);
        }
    }
}

window.onload = function()
{
    document.getElementById('map').style.cursor = 'wait';
    obscureCheck(false);

    $.get('/webclient/data/signalmap.json', {r:getRnd()}, function(json)
    {
        var sl = '-=' + ((document.documentElement.clientWidth - 1854)/2);
        $('#map').animate({ scrollLeft: sl });

        updatePageList(json);
        mapJSON = json;
        page = parseInt(window.location.hash.length>0?window.location.hash.substring(1):localStorage.getItem('page')) || 0;
        load();
        console.log('Using main file');
    }, 'json').fail(function(e)
        {
            console.log(e || 'fail');
            $.get('https://raw.githubusercontent.com/Shwam3/EastAngliaSignalMapData/master/signalmap.json', {r:getRnd()}, function(json)
            {
                var sl = '-=' + ((document.documentElement.clientWidth - 1854)/2);
                $('#map').animate({ scrollLeft: sl });

                updatePageList(json);
                mapJSON = json;
                page = parseInt(window.location.hash.length>0?window.location.hash.substring(1):localStorage.getItem('page')) || 0;
                load();
                console.log('Using fallback map file');
            }, 'json');
        });

    openSocket('shwam3.ddns.net');
    setInterval(doClock, 100);
    setInterval(fillBerths0, 100);
    setInterval(function()
    {
        if (lastMessage > 0 && Date.now() - lastMessage > 60000)
            connection.close();
    }, 100);
};

$(window).on('hashchange', function()
{
  var newPage = parseInt(document.location.hash.substring(1));
  if ((!newPage && newPage != 0) || newPage < 0 || newPage > maxPageId || newPage==page)
    window.location.hash = '#' + page;
  else
    loadPage(newPage);
});

$(document).keydown(function(e)
{
    if (e.which == 37 &&!(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey))
        loadPage(--page);
    else if (e.which == 39 &&!(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey))
        loadPage(++page);
    else if (e.which == 66 &&!(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey))
        displayBerths = !displayBerths;
    else if (e.which == 67 &&!(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey))
        displayTrackC = !displayTrackC;
    else if (e.which == 68 &&!(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey))
        displayIDs = !displayIDs;
    else if (e.which == 80 &&!(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey))
        displayPoints = !displayPoints;
    else if (e.which == 82 &&!(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey))
        displayDataText = !displayDataText;
    else if (e.which == 83 &&!(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey))
        displaySignals = !displaySignals;
    else if (e.which == 84 &&!(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey))
        displayText = !displayText;

    if ((e.which == 67 || e.which == 66 || e.which == 68 || e.which == 80 || e.which == 82 || e.which == 83 || e.which == 84) && !(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey))
    {
        for (var b in berths)
        {
            berths[b].display(displayBerths);
            berths[b].displayID(displayIDs);
        }
        for (var s in signals)
            signals[s].display(displaySignals);
        for (var p in points)
        {
            points[p].display(displayPoints);
            points[p].displayID(displayIDs);
        }
        for (var l in latches)
            latches[l].display(displaySignals);
        for (var t in text)
            text[t].display(displayText);
        for (var d in dataText)
            dataText[d].display(displayDataText);
        for (var c in trackc)
            trackc[c].display(displayTrackC);
    }
});

function closeSocket(clear)
{
    disconn = true;
    connection.close();
    if (clear == true)
        data = {};
    data['XXMOTD'] = 'Disconnected';
    fillBerths();
}
function reconnect()
{
    attempt = -1;
    openSocket('shwam3.ddns.net');
}
function openSocket(ip)
{
    $('p.motd')[0].style.animation = '';
    connected = false;
    lastMessage = 0;
    obscureCheck(true);

    if (++attempt <= 2)
    {
        console.log('WebSocket Opening @ ws://' + ip + ':' + port + (attempt > 0 ? ' (attempt ' + (attempt+1) + ')' : ''));
        connection = new WebSocket('ws://' + ip + ':' + port);

        connection.onopen = connection.onopen || function onopn(e)
        {
            console.log('WebSocket Open @ ws://' + ip + ':' + port);
            attempt = -1;
        };
        connection.onclose = connection.onclose || function oncls(e)
        {
            if ((connection.readyState == WebSocket.CLOSED || !connection) && !disconn)
            {
                connected = false;
                obscureCheck(true);
                console.warn('WebSocket Closed reopening...');

                setTimeout(function() { openSocket('shwam3.ddns.net'); }, 3000);
            }
            else
                console.log('WebSocket Closed');
        };
        connection.onerror = connection.onerror || function onerr(e)
        {
            console.log('WebSocket Error');
            console.log(e);

            connection.close();
        };
        connection.onmessage = connection.onmessage || function onmsg(e)
        {
            var jsonMsg = JSON.parse(e.data).Message;
            var jsonMsgData = jsonMsg.message;
            lastMessage = Date.now();
            lastTimestamp = parseInt(jsonMsg.timestamp);

            if (jsonMsg.type == 'SEND_ALL')
            {
                for (var id in data)
                    data[id] = '';
                
                ntpTypeOffset = jsonMsg.timestamp - Date.now();
            }

            for (var key in jsonMsgData)
                data[key] = jsonMsgData[key];
            
            /*****MOTD***FIX*****/
            //data['XXMOTD'] = 'Minimal problems';
            /********************/

            fillBerths();

            document.getElementById('map').style.cursor = 'crosshair';
            connected = true;
            obscureCheck(true);
        };
    }
    else
    {
        $('p.motd')[0].style.animation = 'error 5s linear infinite';
        data['XXMOTD'] = '<span style="font-weight: bold;color: red;">Unable to connect to server, please use the reconnect button to try again</span>';
        fillBerths();
        $.get('/webclient/data/motd.json', {r:Date.now() - (Date.now() % 9e5)}, function(js)
        {
            data['XXMOTD']  = '<p style="font-weight:bold;color:red">Unable to connect to server, please use the reconnect button to try again</p>';
            data['XXMOTD'] += '<p style="color:#F5BD00">' + js.MOTD.message + '</p>';
            fillBerths();
        }, 'json');

        document.getElementById('map').style.cursor = 'crosshair';
        connected = true;
        obscureCheck(true);
    }
}

function doClock()
{
    var date = new Date(Date.now()+ntpTypeOffset);
    document.getElementById('clock').innerHTML = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) +
        ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) +
        ':' + (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());
}
function updateNTPOffset()
{
    var reqTime = Date.now();
    $.get('http://ntp-a1.nict.go.jp/cgi-bin/jsont', {t:reqTime}, function(js)
    {
        ntpTypeOffset = reqTime - JSON.parse(js.substring(7, js.length-2)).st*1000;
    }, 'text').fail(function(e){console.warn(e);});
}
function obscureCheck(changed)
{
    var obscurer = $('#obscure');
    var obsHidden = obscurer[0].style.display == 'none';
    if (loaded && connected)
    {
        if (!obsHidden) { changed ? obscurer.fadeOut() : obscurer.hide(); }
    }
    else
    {
        if (obsHidden) { changed ? obscurer.fadeIn() : obscurer.show(); }
    }
}

function fillBerths()
{
    needsFilling = true;
}
function fillBerths0()
{
    if (needsFilling == false)
        return;
    
    needsFilling = false;
    for (var b in berths)
    {
        berths[b].display(displayBerths);
        berths[b].displayID(displayIDs);
    }
    for (var s in signals)
        signals[s].display(displaySignals);
    for (var p in points)
        points[p].display(displayPoints);
    for (var l in latches)
        latches[l].display(displaySignals);
    for (var t in text)
        text[t].display(displayText);
    for (var d in dataText)
        dataText[d].display(displayDataText);
    for (var c in trackc)
        trackc[c].display(displayTrackC);
    
    for (var b in berths)
        berths[b].update();
    for (var s in signals)
        signals[s].update();
    for (var p in points)
        points[p].update();
    for (var l in latches)
        latches[l].update();
    for (var d in dataText)
        dataText[d].update();
    for (var c in trackc)
        trackc[c].update();
    if (statusElem)
        statusElem.update();
    
    document.getElementById('motd').innerHTML = data['XXMOTD'];
    
    if (lastMessage <= 0)
    {
        document.getElementById('time').innerHTML = 'Last Update: --:--:--';
    }
    else
    {
        var date = new Date(lastMessage);
        var date2 = new Date(lastTimestamp || 0);
        var newTime = 'Last Update: ' +
            (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':' +
            (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':' +
            (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds()) + ' (' +
            (date2.getHours() < 10 ? '0' + date2.getHours() : date2.getHours()) + ':' +
            (date2.getMinutes() < 10 ? '0' + date2.getMinutes() : date2.getMinutes()) + ':' +
            (date2.getSeconds() < 10 ? '0' + date2.getSeconds() : date2.getSeconds()) + ')';
            
        document.getElementById('time').innerHTML = newTime;
    }
}

function pageSelected()
{
    var sel = document.getElementById('pageSelector');
    loadPage(sel.options[sel.selectedIndex].value);
}

function getNextID()
{
    return ++htmlID + '';
}

function getRnd()
{
    return Date.now() - (Date.now() % 3.6e6);
}

function getData(id)
{
    if (id == undefined)
        return 0;
    else if (typeof(data[id]) != 'undefined')
        return data[id];
    else if (id.charAt(4) == '!')
        return 1 - parseInt(data[id.split('!')[0]+':'+id.split('!')[1]]);
    else
        return data[id];
}
function setData(id, value)
{
    if (id == undefined)
        return;
    else if (id.charAt(4) == '!')
        data[data[id.split('!')[0]+':'+id.split('!')[1]]] = value;
    else
        data[id] = value;
    fillBerths();
}

function addObj(htmlID, obj)
{
    if (htmlIDToObj[htmlID])
        console.error("htmlID '" + htmlID + "' already in use");
    else
        htmlIDToObj[htmlID] = obj;
}

function escapeHTML(string)
{
    return string.match(/&(amp|lt|gt|quot);/) ? string : string.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;').replace('"','&quot;');
}