var host = 'ws.signalmaps.co.uk';
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
var displayOpts = {'IDs': false, 'berths': true, 'points': true, 'signals': true, 'text': true, 'dataText': true, 'trackC': true, 'railcam': "true" == localStorage.getItem('l'), 'headcodes': "true" == localStorage.getItem('h'), 'delays': !('e' in localStorage) || "true" == localStorage.getItem('e')};
var berths = [];
var signals = [];
var points = [];
var latches = [];
var dataText = [];
var text = [];
var trackc = [];
var conds = [];
var mapJSON;
var maxPageId = 1;
var loaded = false;
var connected = false;
var connectError = false;
var defaultInner = document.getElementById('map').innerHTML;
var htmlIDToObj = {};
var hashRead = false;
var hcMap = {};
var active_areas = [];
var canUseWebP = false;
var searchData = [];
var delayData = {data: [], lastUpdate: Date.now()};
var isReplaying = false;

var snowflakesMonth = new Date().getMonth() == 11;
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
    updatePageList(mapJSON);

    window.onhashchange = window.onhashchange || function()
    {
        var newPage = parseInt(document.location.hash.substring(1));
        if (!navIndex || navIndex == {})
            return
        if (!isNaN(navIndex[document.location.hash.substring(1)]))
            newPage = navIndex[document.location.hash.substring(1)];

        if (newPage != page)
        {
            hashRead = false;
            loadPage(newPage);
        }
    }

    if (!hashRead)
    {
        if (location.hash != '' && location.hash != '#' && navIndex.hasOwnProperty(location.hash.substring(1)))
        {
            var hashPage = location.hash.substring(1);
            if (hashPage != 'dev')
            {
                page = isNaN(hashPage) && navIndex.hasOwnProperty(hashPage) ? navIndex[hashPage] : (+hashPage || 0);
                hashRead = true;
            }
        }
        
        if (!hashRead)
        {
            var lStorePage = localStorage.getItem('page');
            if (isNaN(lStorePage))
                page = navIndex.hasOwnProperty(lStorePage) ? navIndex[lStorePage] : 0;
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
    var map = document.getElementById('map');
    localStorage.setItem('page', pageData.panelUID);

    if (!pageData.hasOwnProperty('data') || pageData.data == {})
    {
        downloadPage(pageData.panelUID, load);
        return;
    }
    map.style.overflowY = null;
    map.style.width = (pageData['width'] || 1854) + 'px';

    var mapBerths = pageData.data.berths;
    var mapSignals = pageData.data.signals;
    var mapPoints = pageData.data.points;
    var mapConditionals = pageData.data.conditionals;
    var mapText = pageData.data.text;

    doClock();
    document.getElementById('desc').innerHTML = pageData.panelDescription;
    //document.title = 'Signal Maps - ' + pageData.panelName;
    window.location.replace(window.location.href.split('#')[0] + '#' + pageData.panelUID);

    htmlIDToObj = {};
    map.innerHTML = defaultInner;
    // use pageData.data.panelUID to allow 'dev' images
    document.getElementById('mapImage').src = 'https://sigmaps1s.signalmaps.co.uk/webclient/images/maps/'+pageData.data.panelUID + getImgExt() + '?r=' + (dev ? Date.now() : (pageData['r'] || '0'));
    document.getElementById('mapImage').onerror = function(evt) { if (!(evt.srcElement.src && evt.srcElement.src.contains('github'))) evt.srcElement.src = 'https://github.com/Shwam3/EASMData/raw/master/images/maps/'+pageData.data.panelUID+getImgExt(); };
    document.getElementById('mapImage').draggable = false;
    berths = [];
    signals = [];
    latches = [];
    points = [];
    dataText = [];
    text = [];
    trackc = [];
    conds = [];
    setAreas(pageData.areas);

    for (var k in mapBerths)
    {
        if (!dev && mapBerths[k]['isDev'])
            continue;
        berths.push(new Berth(mapBerths[k]));
    }

    for (var k in mapSignals)
    {
        var sig = mapSignals[k];
        if (!dev && sig['isDev'])
            continue;
        else if (sig.type.match(/(UP|DOWN|LEFT|RIGHT|NONE)/) || (dev && sig.type == 'TEST'))
            signals.push(new Signal(sig));
        else if (sig.type == 'TEXT')
            dataText.push(new DataText(sig));
        else if (sig.type == 'LATCH')
            latches.push(new Latch(sig));
        else if (sig.type == 'TRACKC')
            trackc.push(new TrackCircuit(sig));
    }

    for (var k in mapPoints)
    {
        if (!dev && mapPoints[k]['isDev'])
            continue;
        points.push(new Points(mapPoints[k]));
    }

    for (var k in mapConditionals)
    {
        if (!dev && mapConditionals[k]['isDev'])
            continue;
        conds.push(new Conditional(mapConditionals[k]));
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
        var pnls = [];
        for (var p in json)
        {
            var pageData = json[p];
            navIndex[pageData.panelUID] = parseInt(p);
            pnls.push(createPanel(list, p, pageData));
        }
        maxPageId = list.children.length-1;

        if (dev)
        {
            navIndex['dev'] = maxPageId+1;
            pnls.push(createPanel(list, ++maxPageId, {panelName:'Dev page',panelDescription:'',panelUID:'dev',r:Date.now()}));
        }
        for (pnl in pnls)
        {
            pnls[pnl].addEventListener('click', function()
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
        + pageData.panelName + '</div><div class="panel-body panel-img"><img src="https://sigmaps1s.signalmaps.co.uk/webclient/images/maps/previews/' + pageData.panelUID + getImgExt() + '?r=' + (dev ? Date.now() : (pageData['r'] || '0')) + '"><br></div>'
        + '<div class="panel-footer"><div class="panel-desc">' + pageData.panelDescription + '</div></div></div>';
    addTo.appendChild(div);

    if (index+1 % 2 == 0)
    {
        var cfix = document.createElement('div');
        cfix.className = 'clearfix hidden-xs';
        addTo.appendChild(cfix);
    }

    return div.children[0];
}

window.onload = function()
{
    document.getElementById('map').style.cursor = 'wait';
    document.getElementById('fbh').addEventListener('click', hcSearch);
    obscureCheck(false);

    var canv = document.createElement('canvas');
    canv.width = 1;
    canv.height = 1;
    canUseWebP = !!(canv.getContext && canv.getContext('2d')) && canv.toDataURL('image/webp').indexOf('data:image/webp') == 0;

    get('https://sigmaps1s.signalmaps.co.uk/webclient/data/data.json?r=' + Math.floor(Date.now() / 3600000) * 3600000, function(json)
    {
        mapJSON = json;
        load();
    }, function(e)
        {
            console.log(e || 'fail');
            get('https://raw.githubusercontent.com/Shwam3/EASMData/master/data/data.json?r=' + Math.floor(Date.now() / 3600000) * 3600000, function(json)
            {
                mapJSON = json;
                load();
                console.log('Using secondary file (data.json)');
            });
        });

    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://sigmaps1s.signalmaps.co.uk/webclient/css/sprites.' + (canUseWebP ? 'webp.css' : 'css') + '?r=2019-06-30';
    css.type = 'text/css';
    document.head.insertBefore(css, document.head.lastElementChild);

    openSocket(host);
    setInterval(doClock, 100);
    setInterval(fillBerths0, 100);
    setInterval(function()
    {
        if (connected && lastMessage > 0 && Date.now() - lastMessage > 60000)
        {
            console.log('Closing connection (timeout)');
            connection.close();
        }
    }, 100);

    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

    ga('create', 'UA-72821900-1', 'auto');
    ga('send', 'pageview');
};

document.addEventListener('keydown', function(e)
{
    if (!(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey))
    {
        switch(e.key)
        {
            case "Left":
            case "ArrowLeft": loadPage(--page); break;
            case "Right":
            case "ArrowRight": loadPage(++page); break;
            case "v":
            case "V": displayOpts.berths    = !displayOpts.berths; break;
            case "c":
            case "C": displayOpts.trackC    = !displayOpts.trackC; break;
            case "d":
            case "D": displayOpts.IDs       = !displayOpts.IDs; break;
            case "h":
            case "H": displayOpts.headcodes = !displayOpts.headcodes; localStorage.setItem('h',displayOpts.headcodes); break;
            case "l":
            case "L": displayOpts.railcam   = !displayOpts.railcam; localStorage.setItem('l', displayOpts.railcam); break;
            case "p":
            case "P": displayOpts.points    = !displayOpts.points; break;
            case "r":
            case "R": displayOpts.dataText  = !displayOpts.dataText; break;
            case "s":
            case "S": displayOpts.signals   = !displayOpts.signals; break;
            case "t":
            case "T": displayOpts.text      = !displayOpts.text; break;
            case "e":
            case "E": displayOpts.delays    = !displayOpts.delays; localStorage.setItem('e', displayOpts.delays); setAreas(null); break;
        }

        if (["ArrowLeft","ArrowRight","v","V","c","C","d","D","h","H","l","L","p","P","r","R","s","S","t","T","e","E"].indexOf(e.key) >= 0)
        {
            displayOpts.changed = true;
            fillBerths();
        }
    }
});

function closeSocket(clear)
{
    console.log('Closing connection (manual)');
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
    {
        console.log('Closing connection (reconnect)');
        connection.close();
    }
}
function openSocket(ip)
{
    connected = false;
    lastMessage = -1;
    obscureCheck(true);
    attempt++;
    fillBerths();

    if (connection != undefined && connection.readyState != connection.CLOSING && connection.readyState != connection.CLOSED)
        connection.close();

    console.log('WebSocket Opening @ wss://' + ip + (attempt > 0 ? ' (attempt ' + (attempt+1) + ')' : ''));
    connection = new WebSocket('wss://' + ip);

    connection.onopen = connection.onopen || function onopn(e)
    {
        if (connection !== this)
        {
            console.error("connection !== this");
            this.close();
        }
        console.log('WebSocket Open @ wss://' + ip/* + ':' + port*/);
        attempt = -1;
        setAreas(null);
    };
    connection.onclose = connection.onclose || function oncls(e)
    {
        if (!disconn && connection === this)
        {
            connected = false;
            connectError = false;
            lastMessage = -1;
            obscureCheck(true);
            console.warn('WebSocket Closed reopening...');

            setTimeout(function() { openSocket(host); }, 3000 + Math.min(attempt * 2000, 27000));
        }
        else
            console.log('WebSocket Closed' + (disconn ? '' : ' (too many sockets)'));
    };
    connection.onerror = connection.onerror || function onerr(e)
    {
        console.error('WebSocket Error');
        console.error(e);

        if (this.readyState != WebSocket.CLOSING && this.readyState != WebSocket.CLOSED)
            this.close();
    };
    connection.onmessage = connection.onmessage || function onmsg(e)
    {
        var jsonMsg = JSON.parse(e.data).Message;
        var jsonMsgData = jsonMsg.message;

        var timestamp = Date.now();

        if (window['messageRate'])
            messageRate.addTick(timestamp - lastMessage, e.data.length);

        if (timestamp > lastMessage)
        {
            lastMessage = timestamp;
            lastTimestamp = parseInt(jsonMsg.timestamp);
        }

        if (snowflakesMonth)
        {
            var tsDate = new Date(lastTimestamp);
            if (tsDate.getDate() == 25 && tsDate.getMonth() == 11)
            {
                if (!snowflakesActive)
                    generateSnowflakes();
            }
            else if (snowflakesActive)
                removeSnowflakes();
        }

        if (jsonMsg.type.startsWith('SEND_'))
        {
            if (jsonMsg.type == 'SEND_ALL')
                for (var id in data)
                    if (id.substring(0, 2) != '$_' && (jsonMsg['td_area'] ? jsonMsg.td_area == id.substring(0, 2) : true))
                        data[id] = '';
            Object.assign(data, jsonMsgData);
        }
        else if (jsonMsg.type == 'DELAYS')
        {
            delayData['data'] = jsonMsgData;
            delayData['lastUpdate'] = jsonMsg.timestamp;
            displayOpts.changed = true;
        }

        fillBerths();

        document.getElementById('map').style.cursor = 'crosshair';
        var c = connected;
        connected = true;
        if (c == false)
            setAreas(null);
        connectError = false;
        obscureCheck(true);
    };
}
function downloadPage(uid, callback)
{
    if (!callback) callback = load;

    var pageNo = navIndex[uid] || 0;
    get('https://sigmaps1s.signalmaps.co.uk/webclient/data/' + (dev ? 'dev/' : '') + uid + '.json?r=' + (dev ? Date.now() : (mapJSON[pageNo]['r'] || '0')), function(json)
    {
        mapJSON[pageNo]['data'] = json;
        console.log('Downloaded main file (' + uid + '.json)');
        callback();
    }, function(e)
        {
            console.error(e || 'fail');
            get('https://raw.githubusercontent.com/Shwam3/EASMData/master/data/' + (dev ? 'dev/' : '') + uid + '.json?r=' + (dev ? Date.now() : (mapJSON[pageNo]['r'] || '0')), function(json)
            {
                mapJSON[pageNo]['data'] = json;
                console.log('Downloaded secondary file (' + uid + '.json)');
                callback();
            });
        });
}

function doClock()
{
    document.getElementById('clock').textContent = clockStr(new Date());
}
function obscureCheck(changed)
{
    var obscurer = document.getElementById('obscure');
    var obsHidden = obscurer.style.display == 'none';
    if (loaded && (connected || disconn))
    {
        if (!obsHidden) { changed ? fade(obscurer, true) : obscurer.style.display = 'none'; }
    }
    else
    {
        if (obsHidden) { changed ? fade(obscurer, false) : obscurer.style.display = ''; }
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

    for (var n in conds)
        conds[n].update();
    for (var b in berths)
        berths[b].update(displayOpts.changed);
    for (var s in signals)
        signals[s].update(displayOpts.changed);
    for (var p in points)
        points[p].update(displayOpts.changed);
    for (var l in latches)
        latches[l].update(displayOpts.changed);
    for (var d in dataText)
        dataText[d].update(displayOpts.changed);
    for (var c in trackc)
        trackc[c].update(displayOpts.changed);

    if (displayOpts.changed)
        displayOpts.changed = false;

    if (isReplaying)
        document.getElementById('time').textContent = 'Last Update: Replaying';
    else if (lastMessage < 0 || !connected)
        document.getElementById('time').textContent = 'Last Update: Not Connected (' + attempt + ')';
    else
        document.getElementById('time').textContent = 'Last Update: ' + clockStr(new Date(lastTimestamp));
    var map = document.getElementById('map');
    map.style.left = null;
    var pos = map.getBoundingClientRect().left;
    map.style.left = -1*(pos % 1.0) + 'px';
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

function getData(id)
{
    if (id == undefined || id.substring(2) == 'PRED') //|| id.length != 6
        return 0;
    else if (id.substring(2) == 'PGRN')
        return 1;
    else if (typeof(data[id]) != 'undefined')
    {
        var i = parseInt(data[id]);
        return isNaN(i) || i.toString().length != data[id].length ? data[id] : parseInt(data[id]);
    }
    else if (id[4] == '!')
        return 1 - getData(id.split('!')[0]+':'+id.split('!')[1]);
    else
        return id[4] == ':' || id[4] == '!' ? 0 : '';
}

function setData(id, value)
{
    if (id == undefined) //|| id.length != 6)
        return;
    else if (id[4] == '!')
        data[id.split('!')[0]+':'+id.split('!')[1]] = 1-value;
    else
        data[id] = value;
    fillBerths();
}

function getHeadcode(hc, berth)
{
    if (typeof hc == "string" && hc.match(/[0-9]{3}[A-Z]/) && (displayOpts.headcodes || hc[0].match(/[12]/)) && !isReplaying)
    {
        var td = typeof berth == "object" ? berth.dataIDs[0].substring(0, 2) : berth.substring(0, 2)
        var mapping = hcMap[hc];
        if (mapping === undefined)
        {
            mapping = {hc:hc, expire:Date.now()+60000, init:false};
            hcMap[hc] = mapping;
        }

        if (mapping.expire <= Date.now() || !mapping.init)
        {
            mapping.init = true;
            mapping.expire = Date.now()+60000;
            get('https://sigmaps1.signalmaps.co.uk/webclient/get_hc.php?hc='+hc+'&td='+td, function(json)
            {
                json = JSON.parse(json);
                mapping.hc = json.hc;
                mapping.expire = Date.now() + (json.found ? 3600000 + Math.round(Math.random()*900000) : 300000);

                console.log(hc, '=>', json.hc, clockStr(new Date(mapping.expire)), berth);

                if (typeof berth == "object")
                    berth.update(true);
            });
        }

        return mapping.hc;
    }
    else
        return hc;
}

function setAreas(areas)
{
    try
    {
        var options = displayOpts.delays ? ['split_full_messages','delay_colouration'] : ['split_full_messages'];
        if (areas == null)
        {
            if (active_areas.length > 0 && connected)
                connection.send(JSON.stringify({Message:{type:'SET_OPTIONS',areas:active_areas,timestamp:Date.now(),options:options}}));
        }
        else if (areas.toString() != active_areas.toString())
        {
            if (connected)
                connection.send(JSON.stringify({Message:{type:'SET_OPTIONS',areas:areas,timestamp:Date.now(),options:options}}));
            active_areas = areas;
        }
    }
    catch(e) {}
}

function addObj(htmlID, obj)
{
    if (htmlIDToObj[htmlID])
        console.error("htmlID '" + htmlID + "' already in use");
    else
        htmlIDToObj[htmlID] = obj;
}

function clockStr(date)
{
    try
    {
        return date.toLocaleString('en-GB', {hour: '2-digit', hour12: false, timeZone: 'Europe/London', minute: '2-digit', second: '2-digit'});
    }
    catch(e)
    {
        return (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':' +
            (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':' +
            (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());
    }
}

function hcSearch(evt)
{
    var hc = prompt('Enter headcode to find:');

    if (hc != null)
    {
        hc = hc.toUpperCase();
        get('https://sigmaps1s.signalmaps.co.uk/search.php?r=' + Date.now() + '&hc=' + encodeURIComponent(hc) + (dev ? '&dev=true' : ''), function(res)
        {
            var pagesOn = JSON.parse(res).filter(function(x) { return x.map != null; });
            if (pagesOn.length == 1)
                loadPage(navIndex[pagesOn[0].map]);
            else if (pagesOn.length > 1)
            {
                pagesOn = pagesOn.filter(function(value, index, self) { return self.indexOf(value) === index; });
                var i = 1;
                var pgSel = prompt("Choose a page (enter a number 1 to "
                    + pagesOn.length + "):\n"
                    + pagesOn.map(function(x) { return (i++) + ": " + unescapeHTML(mapJSON[navIndex[x.map]].panelName) + " (" + unescapeHTML(mapJSON[navIndex[x.map]].panelDescription) + ")"; }).join('\n')
                )

                if (pgSel != null)
                {
                    pgSel = parseInt(pgSel);
                    if (pgSel <= pagesOn.length && pgSel > 0)
                    {
                        loadPage(navIndex[pagesOn[pgSel - 1].map]);
                    }
                }
            }
            else
                alert("Headcode \'" + hc + "\' could not be found.");
        }, function(res) { alert("Could not retrieve search at this time."); })
    }

    evt.preventDefault();
    return false;
}

function get(url, succ, fail)
{
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    var json = url.split('?')[0].endsWith('.json')
    //if (url.split('?')[0].endsWith('.json'))
    //    request.responseType = 'json';

    request.onload = function()
    {
        try
        {
            if (request.status >= 200 && request.status < 400)
                setTimeout(function() { succ(json ? JSON.parse(request.responseText) : request.responseText); });
            else if (fail)
                setTimeout(function() { fail(); });
        }
        catch(e)
        {
            if (fail)
                setTimeout(function() { fail(e); });
        }
    };

    if (fail)
        request.onerror = function(e) { setTimeout(function() { fail(e); }); };

    request.send();
}
function getImgExt()
{
    return canUseWebP ? '.webp' : '.png';
}
function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length != b.length) return false;

    for (var i = 0; i < a.length; ++i)
        if (a[i] !== b[i]) return false;
    return true;
}
function fade(el, out)
{
    el.style.opacity = out ? 1 : 0;

    var last = +new Date();
    var tick = function() {
        el.style.opacity = (out ? -1 : 1) * +el.style.opacity + (new Date() - last) / 400;
        last = +new Date();

        if (out ? +el.style.opacity > 0 : +el.style.opacity < 1)
            (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16);
    };

    tick();
}
function escapeHTML(string)
{
    return string.match(/&(amp|lt|gt|quot);/) ? string : string.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;').replace('"','&quot;');
}
function unescapeHTML(string)
{
    return string.replace('&amp;','&').replace('&lt;','<').replace('&gt;','>').replace('&quot;','"');
}
if (!String.prototype.endsWith)
{
	String.prototype.endsWith = function(search, this_len) {
		if (this_len === undefined || this_len > this.length) {
			this_len = this.length;
		}
		return this.substring(this_len - search.length, this_len) === search;
	};
}
if (typeof Object.assign != 'function') {
  Object.defineProperty(Object, "assign", {
    value: function assign(target, varArgs) {
      'use strict';
      if (target == null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var to = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource != null) {
          for (var nextKey in nextSource) {
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    },
    writable: true,
    configurable: true
  });
}
