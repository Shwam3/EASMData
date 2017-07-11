dev = true;
hideUsed = true;
var wait = 2000;
var area_filter = {};
function reload()
{
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
        document.title = "Signal Maps";
        console.log('Done');
        return;
    }
    var id = ids.shift();
    var val = getData(id);
    document.title = "Signal Maps - " + id;
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
function checkboxEvt(e)
{
    switch(e.id)
    {
        case 'l': displayOpts.railcam = e.checked; localStorage.setItem('l',displayOpts.railcam); break;
        case 'b': displayOpts.berths = e.checked; break;
        case 'c': displayOpts.trackC = e.checked; break;
        case 'd': displayOpts.IDs = e.checked; break;
        case 'h': displayOpts.headcodes = e.checked; break;
        case 'p': displayOpts.points = e.checked; break;
        case 'r': displayOpts.dataText = e.checked; break;
        case 's': displayOpts.signals = e.checked; break;
        case 't': displayOpts.text = e.checked; break;
    }
    fillBerths();
}

var fb0 = fillBerths0;
fillBerths0 = function()
{
    fb0();

    document.getElementById('l').checked = displayOpts.railcam;
    document.getElementById('b').checked = displayOpts.berths;
    document.getElementById('c').checked = displayOpts.trackC;
    document.getElementById('d').checked = displayOpts.IDs;
    document.getElementById('h').checked = displayOpts.headcodes;
    document.getElementById('p').checked = displayOpts.points;
    document.getElementById('r').checked = displayOpts.dataText;
    document.getElementById('s').checked = displayOpts.signals;
    document.getElementById('t').checked = displayOpts.text;
}

function devPage()
{
    var map = document.getElementById('map');

    document.getElementById('desc').innerHTML = 1+maxPageId + '. Dev Page';
    document.title = 'Signal Maps - Dev Page';
    map.innerHTML = defaultInner;
    document.getElementById('mapImage').src = '/webclient/images/blank.png';
    document.getElementById('mapImage').style.minWidth = 'initial';
    document.getElementById('mapImage').style.display = 'none';
    document.getElementById('map').style.overflowY = 'auto';

    doClock();
    
    berths = [];
    signals = [];
    points = [];
    dataText = [];
    text = [];
    trackc = [];
    
    var areas = ['A2','AW','CA','CC','CT','EN','K2','KX','LS','PB','Q1','Q2',/*'SE','SI',*/'SO','SX','UR','U2','U3','WC','WG','WH','WJ','WY','WS','XX','hideUsed'];
    var div = document.createElement('div');
    div.style.margin = '5px 26px';
    for (a in areas)
    {
        var area = areas[a];
        var lab = document.createElement('label');
        area_filter[area] = area_filter[area] == undefined ? true : area_filter[area];
        lab.innerHTML = '<input type="checkbox" id="area_'+area+'" name="'+area+'" onchange="filterArea(this)"'+(area_filter[area] ? ' checked' : '')+'>'+area;
        div.appendChild(lab);
    }
    document.getElementById('map').appendChild(div);
    hideUsed = area_filter['hideUsed'];

    var areas = ['A2','AW','CA','CC','CT','EN','K2',     'LS',     'Q1','Q2',/*'SE','SI',*/     'SX','UR','U2','U3',          'WH','WJ',              ];
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
    var y = 41;
    var leftGap = true;
    var ids = [];
    for (var i in areas)
        ids.push.apply(ids, list(areas[i] + '00:1', largestID(areas[i])));

    if (area_filter[areas[0]])
        text.push(new Text({type:'TEXT',posX:x,posY:y-12,text:areas[0]}));
    for (var id in ids)
    {
        if (area_filter[ids[id].substring(0, 2)])
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

            signals.push(new Signal({type:'TEST',posX:x+4,posY:y+4,dataID:ids[id],description:ids[id]}));

            x += 12;
            if (x+12 > 1828)
            {
                x = 26;
                y += 12;
            }
        }
        lastArea = ids[id].substring(0,2);
    }

    x = 26;
    y += 48;

    areas = ['A2','AW','CA','CC','CT','EN','K2','KX','LS','PB','Q1','Q2',/*'SE','SI',*/'SO','SX','UR','U2','U3','WC','WG','WH','WJ','WY','WS','XX'];
    ids = [];
    lastArea = undefined;
    var keys = Object.keys(data).sort();
    for (var k in keys)
        if (areas.indexOf(keys[k].substring(0,2)) >= 0 && keys[k].indexOf(':') < 0 && keys[k].length == 6 )
            ids.push(keys[k]);

    if (area_filter[areas[0]])
        text.push(new Text({type:'TEXT',posX:x,posY:y-14,text:areas[0]}));
    for (var id in ids)
    {
        if (ids[id].indexOf(':') >= 0
                || ids[id].indexOf('!') >= 0
                || ids[id].substring(2, 6) == 'PRED'
                || ids[id].substring(2, 6) == 'PGRN'
                || (usedIDs.indexOf(ids[id]) >= 0 && hideUsed))
            continue;

        if (area_filter[ids[id].substring(0,2)])
        {
            if (lastArea && lastArea != ids[id].substring(0,2))
            {
                x = 26;
                text.push(new Text({type:'TEXT',posX:x,posY:y+20,text:ids[id].substring(0,2)}));
                y += 32;
            }

            berths.push(new Berth({hasBorder:true,posX:x,posY:y,dataIDs:[ids[id]],allowLU:ids[id].startsWith('WS')}));

            x += 56;
            if (x+48 > 1828)
            {
                x = 26;
                y += 24;
            }
        }
        lastArea = ids[id].substring(0,2);
    }

    var spacer = document.createElement('span');
    spacer.className = 'devSpacer';
    spacer.style.top = y+'px';
    spacer.innerHTML = '&nbsp;';
    document.getElementById('map').appendChild(spacer);

    document.body.scrollTop = document.documentElement.scrollTop = 0;
    map.style.cursor = 'crosshair';
    fillBerths();
    loaded = true;
    console.log('Dev page loaded')
    obscureCheck(true);
}
function filterArea(evt)
{
    console.log(evt.name, evt.checked ? 'shown' : 'hidden')
    area_filter[evt.name] = evt.checked;
    devPage();
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
