dev = true;
hideUsed = true;
var wait = 2000;
function reload()
{
    dev = true;
    $.get('/webclient/data/dev/data.json', {r:Date.now()}, function(json)
    {
        mapJSON = json;
        updatePageList(json);
        load();
    }, 'json').fail(function(e) { console.error(e); });
}
function searchSubmitted()
{
    alert(document.getElementById('search').value);
}
function flash(id)
{
    var val = getData(id);
    setData(id, 1);
    fillBerths();
    setTimeout(function(){ setData(id, val); fillBerths(); }, wait);
}
function cycle(ids, setto)
{
    if(!ids || ids.length == 0)
    {
        document.title = "East Anglia Signal Maps";
        console.log('Done');
        return;
    }
    var id = ids.shift();
    var val = getData(id);
    document.title = "East Anglia Signal Maps - " + id;
    setData(id, setto || 1);
    fillBerths();
    setTimeout(function(){ setData(id, val); fillBerths(); cycle(ids); }, wait);
}
function next(id)
{
    var area = id.substring(0,2);
    var addr = id.substring(2,4);
    var ind = parseInt(id.charAt(5)) + 1;
    if (ind == 9)
    {
        ind = 1;
        addr = ('0' + (parseInt(addr, 16) + 1).toString(16)).slice(-2);
    }
    return (area + addr + ':' + ind).toUpperCase();
}
function list(f,l)
{
    var ls = [];
    while(f != l)
    {
        ls.push(f);
        f = next(f);
    }
    ls.push(l);
    return ls;
}
function largestID(area)
{
    var exists = false;
    for (var k in data)
        if (data[k].indexOf(area))
        {
            exists = true;
            break;
        }
        
    var largest = 0;
    if (exists)
        for (var k in data)
            if (k.indexOf(':') == 4 && k.indexOf(area) == 0)
            {
                var id = parseInt(k.substring(2,4),16);
                if (id > largest)
                    largest = id;
            }
    return (area + (largest < 16 ? '0':'') + largest.toString(16) + (exists ? ':8' : ':1')).toUpperCase();
}
function getRnd()
{
    return Date.now();
}

function devPage()
{
    var map = document.getElementById('map');
    
    document.getElementById('desc').innerHTML = 1+maxPageId + '. Dev Page';
    document.title = 'Signal Maps - Dev Page';
    map.innerHTML = defaultInner;
    document.getElementById('mapImage').src = '/webclient/images/blank.png';
    document.getElementById('mapImage').style.minWidth = 'initial';
    document.getElementById('map').style.overflowY = 'auto';
    
    doClock();
    
    berths = [];
    signals = [];
    points = [];
    dataText = [];
    text = [];
    trackc = [];
    
  //var areas = ['AW','CA','CC','CT','EN','K2','KX','LS','PB','Q1','SE',/*'SI',*/'SO','SX','UR','U2','U3','WG','XX'];
    var areas = ['AW','CA','CC','CT','EN','K2',     'LS',     'Q1','SE',/*'SI',*/     'SX','UR','U2','U3'          ];
    var usedIDs = ['XXMOTD'];
    if (hideUsed)
    {
        for (var p in mapJSON)
        {
            if (!('data' in mapJSON[p]) || mapJSON[p].data == {})
            {
                downloadPage(mapJSON[p].panelUID);
                return;
            }
            
            var pag = mapJSON[p].data || {};
            for (var sg in pag.signals)
            {
                var sig = pag.signals[sg];
                if (sig.dataID)  usedIDs.push(sig.dataID);
                if (sig.dataIDs) usedIDs.push.apply(usedIDs, sig.dataIDs);
                if (sig.routes)  usedIDs.push.apply(usedIDs, sig.routes);
            }
            
            for (var pt in pag.points)
            {
                usedIDs.push.apply(usedIDs, pag.points[pt].dataIDs);
            }
            
            for (var bt in pag.berths)
            {
                usedIDs.push.apply(usedIDs, pag.berths[bt].dataIDs);
            }
            
            for (i = 0; i < usedIDs.length; i++)
            {
                usedIDs[i] = usedIDs[i].replace('!', ':');
            }
        }
    }
    
    var lastArea = '';
    var x = 26;
    var y = 26;
    var leftGap = true;
    var ids = [];
    for (var i in areas)
        ids.push.apply(ids, list(areas[i] + '00:1', largestID(areas[i])));
    
    text.push(new Text({type:'TEXT',posX:x,posY:y-12,text:areas[0]}));
    for (var id in ids)
    {
        if (ids[id].indexOf(':') < 0 || usedIDs.indexOf(ids[id]) >= 0)
        {
            if (!leftGap)
            {
                x += 12;
                if (x+12 > 1828)
                {
                    x = 26;
                    y += 12;
                }
            }
            leftGap = true;
            continue;
        }
        leftGap = false;
        
        if (lastArea && lastArea != ids[id].substring(0,2))
        {
            x = 26;
            text.push(new Text({type:'TEXT',posX:x,posY:y+12,text:ids[id].substring(0,2)}));
            y += 24;
        }
        lastArea = ids[id].substring(0,2);
        
        signals.push(new Signal({type:'TEST',posX:x+4,posY:y+4,dataID:ids[id],description:ids[id]}));
        
        x += 12;
        if (x+12 > 1828)
        {
            x = 26;
            y += 12;
        }
    }
    
    x = 26;
    y += 48;
    
    areas = ['AW','CA','CC','CT','EN','K2','KX','LS','PB','Q1','SE',/*'SI',*/'SO','SX','UR','U2','U3','WG','XX'];
    ids = [];
    lastArea = undefined;
    var keys = Object.keys(data).sort();
    for (var k in keys)
        if (areas.indexOf(keys[k].substring(0,2)) >= 0 && keys[k].indexOf(':') < 0 && keys[k].length == 6)
            ids.push(keys[k]);
    
    text.push(new Text({type:'TEXT',posX:x,posY:y-14,text:areas[0]}));
    for (var id in ids)
    {
        if (ids[id].indexOf(':') >= 0 || (usedIDs.indexOf(ids[id]) >= 0 && hideUsed))
            continue;
        
        if (lastArea && lastArea != ids[id].substring(0,2))
        {
            x = 26;
            text.push(new Text({type:'TEXT',posX:x,posY:y+20,text:ids[id].substring(0,2)}));
            y += 32;
        }
        lastArea = ids[id].substring(0,2);
        
        berths.push(new Berth({hasBorder:true,posX:x,posY:y,dataIDs:[ids[id]]}));
        
        x += 56;
        if (x+48 > 1828)
        {
            x = 26;
            y += 24;
        }
    }
    
    var spacer = document.createElement('span');
    spacer.className = 'devSpacer';
    spacer.style.top = y+'px';
    spacer.innetHTML = '&nbsp;';
    document.getElementById('map').appendChild(spacer);
    
    document.body.scrollTop = document.documentElement.scrollTop = 0;
    map.style.cursor = 'crosshair';
    fillBerths();
    loaded = true;
    obscureCheck(true);
}

window.onload = function()
{
    document.getElementById('map').style.cursor = 'wait';
    obscureCheck(false);
    
    reload();
    
    openSocket('shwam3.signalmaps.co.uk');
    
    messageRate = new Counter(100);
    
    setInterval(doClock, 100);
    setInterval(fillBerths0, 100);
    setInterval(function()
    {
        if (lastMessage > 0 && Date.now() - lastMessage > 60000)
            connection.close();
    }, 100);
};
function Counter(samples)
{
    this.MAX_SAMPLES = samples;
    this.tickIndex = 0;
    this.tickSum = 0;
    this.tickList = [];
    
    for (var i = 0; i < this.MAX_SAMPLES; i++)
    {
        this.tickList[i] = 0;
    }
    
    this.addTick = function addTick(tick)
    {
        this.tickSum -= this.tickList[this.tickIndex];
        this.tickSum += tick;
        this.tickList[this.tickIndex] = tick;
        
        if (++this.tickIndex == this.MAX_SAMPLES)
            this.tickIndex = 0;

        return this.tickSum / this.MAX_SAMPLES;
    };
    
    this.getAverageTick = function getAverageTick()
    {
        return this.tickSum / this.MAX_SAMPLES;
    }
}
/*port = 6323;
useSSL = false;
function openSocket(ip)
{
    $('p.motd')[0].style.animation = '';
    connected = false;
    lastMessage = 0;
    obscureCheck(true);

    if (++attempt <= 2)
    {
        console.log('WebSocket Opening @ ws' + (useSSL ? 's' : '') + '://' + ip + ':' + port + (attempt > 0 ? ' (attempt ' + (attempt+1) + ')' : ''));
        connection = new WebSocket('ws' + (useSSL ? 's' : '') + '://' + ip + ':' + port);

        connection.onopen = connection.onopen || function onopn(e)
        {
            console.log('WebSocket Open @ ws' + (useSSL ? 's' : '') + '://' + ip + ':' + port);
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
}*/
