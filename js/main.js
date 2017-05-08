var port = 6323;
var page = 0;
var dev = false;
var connection;
var disconn = false;
var attempt = -1;
var lastMessage = -1;
var lastTimestamp = -1;
var needsFilling = true;
var data = {};
var navIndex = {};
var displayOpts = {'IDs': false, 'berths': true, 'points': true, 'signals': true, 'text': true, 'dataText': true, 'trackC': true, 'railcam': !!localStorage.getItem('l')};
var berths = [];
var signals = [];
var points = [];
var latches = [];
var dataText = [];
var text = [];
var trackc = [];
var mapJSON;
var maxPageId = 1;
var loaded = false;
var connected = false;
var connectError = false;
var defaultInner = document.getElementById('map').innerHTML;
var htmlIDToObj = {};
var hashRead = false;

var snowflakesActive = false;

if (typeof String.prototype.replaceAll !== 'function')
{
    String.prototype.replaceAll = function(search, replacement) {
        var target = this;
        return target.replace(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), 'g'), replacement);
    };
}

function loadPage(newPage)
{
    obscureCheck(false);

    page = parseInt(newPage);
    load();
}

function load()
{
    document.getElementById('map').style.cursor = 'wait';

    obscureCheck(false);

    window.onhashchange = window.onhashchange || function()
    {
      var newPage = parseInt(document.location.hash.substring(1));
      if (!navIndex || navIndex == {})
        return
      if (!isNaN(navIndex[document.location.hash.substring(1)]))
        newPage = navIndex[document.location.hash.substring(1)];

        hashRead = false;
        loadPage(newPage);
    }

    if (!hashRead)
    {
        if (location.hash != '' && location.hash != '#' || location.hash.substring(1) in navIndex)
        {
            var hashPage = location.hash.substring(1);
            page = isNaN(hashPage) && navIndex.hasOwnProperty(hashPage) ? navIndex[hashPage] : (+hashPage || 0);
            hashRead = true;
        }
        else
        {
            var lStorePage = localStorage.getItem('page');
            if (isNaN(lStorePage))
            {
                if (lStorePage in navIndex)
                    page = navIndex[lStorePage];
                else
                    page = 0;
            }
            else
                page = +lStorePage;

            hashRead = true;
        }
    }
    if (page > maxPageId)
        page = 0;
    else if (page < 0)
        page = maxPageId;

    if (page == undefined || page == null || page == NaN)
        page = 0;

    var pageData = mapJSON[page];

    document.getElementById('pageSelector').value = page;

    htmlID = 0;
    if (dev && page == maxPageId)
    {
        htmlIDToObj = {};
        devPage();
        return;
    }
    document.getElementById('map').style.overflowY = null;
    localStorage.setItem('page', pageData.panelUID);

    if (!('data' in pageData) || pageData.data == {})
    {
        downloadPage(pageData.panelUID);
        return;
    }

    var mapBerths = pageData.data.berths;
    var mapSignals = pageData.data.signals;
    var mapPoints = pageData.data.points;
    var mapText = pageData.data.text;
    var map = document.getElementById('map');

    doClock();
    document.getElementById('desc').innerHTML = (parseInt(page)+1) + '. ' + pageData.panelDescription;
    document.title = 'Signal Maps - ' + pageData.panelName;

    htmlIDToObj = {};
    map.innerHTML = defaultInner;
    document.getElementById('mapImage').src = '/webclient/images/maps/'+pageData.data.panelUID.replace('+','%2B')+'.png?r=' + getRnd();
    document.getElementById('mapImage').draggable = false;
    berths = [];
    signals = [];
    latches = [];
    points = [];
    dataText = [];
    text = [];
    trackc = [];

    for (var k in mapBerths)
    {
        if (!dev && mapBerths[k]['isDev'])
            continue;
        berths.push(new Berth(mapBerths[k]));
    }

    for (var k in mapSignals)
    {
        if (!dev && mapSignals[k]['isDev'])
            continue;
        else if (mapSignals[k].type.match(/(UP|DOWN|LEFT|RIGHT|NONE)/) || (dev && mapSignals[k].type == 'TEST'))
            signals.push(new Signal(mapSignals[k]));
        else if (mapSignals[k].type == 'TEXT')
            dataText.push(new DataText(mapSignals[k]));
        else if (mapSignals[k].type == 'LATCH')
            latches.push(new Latch(mapSignals[k]));
        else if (mapSignals[k].type == 'TRACKC')
            trackc.push(new TrackCircuit(mapSignals[k]));
    }

    for (var k in mapPoints)
    {
        if (!dev && mapPoints[k]['isDev'])
            continue;
        points.push(new Points(mapPoints[k]))
    }

    for (var k in mapText)
    {
        if (!dev && mapText[k]['isDev'])
            continue;
        text.push(new Text(mapText[k]));
    }
    fillBerths();

    document.body.scrollTop = document.documentElement.scrollTop = 0;
    map.style.cursor = 'crosshair';
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
        for (var p in json)
        {
            var pageData = json[p];
            navIndex[pageData.panelUID] = parseInt(p);
            createPanel(list, p, pageData);
            p++;
        }
        maxPageId = list.children.length-1;

        if (dev)
        {
            navIndex['dev'] = maxPageId+1;
            createPanel(list, ++maxPageId, {panelName:'Dev page',panelDescription:'',panelUID:'blank'});
        }

        var pnls = document.getElementsByClassName('panel');
        for (i = 0; i < pnls.length; i++)
        {
            pnls[i].addEventListener('click', function()
            {
                loadPage(this.getAttribute('data-id'));
                $('#lineSelector').modal('hide');
            });
        }
    }
}

function createPanel(addTo, index, pageData)
{
    var div = document.createElement('div');
    div.style.cursor = 'pointer';
    div.className = 'col-md-6';
    div.innerHTML = '<div class="overview panel panel-default" data-id="' + index + '"><div class="panel-heading">'
        + (+index+1) + '. ' + pageData.panelName + '</div><div class="panel-body panel-img"><img src="/webclient/images/maps/previews/' + pageData.panelUID + '.png"><br></div>'
        + '<div class="panel-footer"><div id="desc">' + pageData.panelDescription + '</div></div></div>';
    addTo.appendChild(div);

    if (index+1 % 2 == 0)
    {
        var cfix = document.createElement('div');
        cfix.className = 'clearfix hidden-xs';
        addTo.appendChild(cfix);
    }
}

window.onload = function()
{
    document.getElementById('map').style.cursor = 'wait';
    obscureCheck(false);

    $.get('/webclient/data/data.json', {r:getRnd()}, function(json)
    {
        var sl = '-=' + ((document.documentElement.clientWidth - 1854)/2);
        $('#map').animate({ scrollLeft: sl });

        updatePageList(json);
        mapJSON = json;
        load();
        console.log('Using main file (data.json)');
    }, 'json').fail(function(e)
        {
            console.log(e || 'fail');
            $.get('https://raw.githubusercontent.com/Shwam3/EASMData/master/data/data.json', {r:getRnd()}, function(json)
            {
                var sl = '-=' + ((document.documentElement.clientWidth - 1854)/2);
                $('#map').animate({ scrollLeft: sl });

                updatePageList(json);
                mapJSON = json;
                load();
                console.log('Using secondary file (data.json)');
            }, 'json');
        });

    openSocket('shwam3.signalmaps.co.uk');
    setInterval(doClock, 100);
    setInterval(fillBerths0, 100);
    setInterval(function()
    {
        if (lastMessage > 0 && Date.now() - lastMessage > 60000)
            connection.close();
    }, 100);
};

$(document).keydown(function(e)
{
    if (!(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey))
    {
        switch(e.which)
        {
            case 37: loadPage(--page); break; // left arrow
            case 39: loadPage(++page); break; // right arrow
            case 66: displayOpts.berths   = !displayOpts.berths; break; // b
            case 67: displayOpts.trackC   = !displayOpts.trackC; break; // c
            case 68: displayOpts.IDs      = !displayOpts.IDs; break; // d
            case 76: displayOpts.railcam  = !displayOpts.railcam; localStorage.setItem('l', displayOpts.railcam); break; // l
            case 80: displayOpts.points   = !displayOpts.points; break; // p
            case 82: displayOpts.dataText = !displayOpts.dataText; break; // r
            case 83: displayOpts.signals  = !displayOpts.signals; break; // s
            case 84: displayOpts.text     = !displayOpts.text; break; // t
        }

        if ([67,66,68,76,80,82,83,84].indexOf(e.which) >= 0)
            fillBerths();
    }
});

function closeSocket(clear)
{
    disconn = true;
    connected = false;
    lastMessage = -1;
    connection.close();
    if (clear == true)
        data = {};
    fillBerths();
}
function reconnect()
{
    attempt = -1;
    if (connection && (connection.readyState == connection.OPEN || connection.readyState == connection.CONNECTING))
        connection.close();

    openSocket('shwam3.signalmaps.co.uk');
}
function openSocket(ip)
{
    connected = false;
    lastMessage = -1;
    obscureCheck(true);
    attempt++;
    fillBerths();

    console.log('WebSocket Opening @ wss://' + ip + ':' + port + (attempt > 0 ? ' (attempt ' + (attempt+1) + ')' : ''));
    connection = new WebSocket('wss://' + ip + ':' + port);

    connection.onopen = connection.onopen || function onopn(e)
    {
        console.log('WebSocket Open @ wss://' + ip + ':' + port);
        attempt = -1;
    };
    connection.onclose = connection.onclose || function oncls(e)
    {
        if ((connection.readyState == WebSocket.CLOSED || !connection) && !disconn)
        {
            connected = false;
            connectError = false;
            lastMessage = -1;
            obscureCheck(true);
            console.warn('WebSocket Closed reopening...');

            setTimeout(function() { openSocket('shwam3.signalmaps.co.uk'); }, 3000 + Math.min(attempt * 2000, 27000));
        }
        else
            console.log('WebSocket Closed');
    };
    connection.onerror = connection.onerror || function onerr(e)
    {
        console.error('WebSocket Error');
        console.error(e);

        connection.close();
    };
    connection.onmessage = connection.onmessage || function onmsg(e)
    {
        var jsonMsg = JSON.parse(e.data).Message;
        var jsonMsgData = jsonMsg.message;

        var timestamp = performance.now() + performance.timing.navigationStart;

        if (window['messageRate'])
            messageRate.addTick(timestamp - lastMessage);

        if (timestamp > lastMessage)
        {
            lastMessage = timestamp;
            lastTimestamp = parseInt(jsonMsg.timestamp);
        }

        /*var tsDate = new Date(lastTimestamp);
        if (tsDate.getDate() == 25 && tsDate.getMonth() == 11)
        {
            if (!snowflakesActive)
                generateSnowflakes();
        }
        else if (snowflakesActive)
            removeSnowflakes();*/

        if (jsonMsg.type == 'SEND_ALL')
        {
            for (var id in data)
                setData(id, '');
        }

        for (var key in jsonMsgData)
            setData(key, jsonMsgData[key].trim());

        fillBerths();

        document.getElementById('map').style.cursor = 'crosshair';
        connected = true;
        connectError = false;
        obscureCheck(true);
    };
}
function downloadPage(uid)
{
    var pageNo = navIndex[uid] || 0;
    $.get('/webclient/data/' + (dev ? 'dev/' : '') + uid + '.json', {r:getRnd()}, function(json)
    {
        mapJSON[pageNo]['data'] = json;
        load();
        console.log('Downloading main file (' + uid + '.json)');
    }, 'json').fail(function(e)
        {
            console.error(JSON.stringify(e) || 'fail');
            $.get('https://raw.githubusercontent.com/Shwam3/EASMData/master/data/' + (dev ? 'dev/' : '') + uid + '.json', {r:getRnd()}, function(json)
            {
                mapJSON[pageNo]['data'] = json;
                load();
                console.log('Downloading secondary file (' + uid + '.json)');
            }, 'json');
        });
}

function doClock()
{
    var date = new Date();
    document.getElementById('clock').innerHTML = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) +
        ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) +
        ':' + (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());
}
function obscureCheck(changed)
{
    var obscurer = $('#obscure');
    var obsHidden = obscurer[0].style.display == 'none';
    if (loaded && (connected || disconn))
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
        berths[b].display(displayOpts.berths);
        berths[b].displayID(displayOpts.IDs);
    }
    for (var s in signals)
        signals[s].display(displayOpts.signals);
    for (var p in points)
    {
        points[p].display(displayOpts.points);
        points[p].displayID(displayOpts.IDs);
    }
    for (var l in latches)
        latches[l].display(displayOpts.signals);
    for (var t in text)
        text[t].display(displayOpts.text);
    for (var d in dataText)
        dataText[d].display(displayOpts.dataText);
    for (var c in trackc)
        trackc[c].display(displayOpts.trackC);

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

    if (lastMessage < 0 || !connected)
    {
        document.getElementById('time').innerHTML = 'Last Update: Not Connected (' + attempt + ')'
    }
    else
    {
        var date = new Date(lastMessage);
        var newTime = 'Last Update: ';
        try
        {
            newTime += date.toLocaleString('en-GB', {hour: '2-digit', hour12: false, timeZone: 'Europe/London', minute: '2-digit', second: '2-digit' });
        }
        catch(e)
        {
            newTime += (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':' +
                (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':' +
                (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());
        }

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
    return (++htmlID).toString();
}

function getRnd()
{
    return Date.now() - (Date.now() % 3.6e6);
}

function getData(id)
{
    if (id == undefined || id.length != 6)
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
    if (id == undefined || id.length != 6)
        return;
    else if (id.charAt(4) == '!')
        data[id.split('!')[0]+':'+id.split('!')[1]] = value;
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
