dev = true;
hideUsed = true;
var wait = 2000;
function reload()
{
    dev = true;
    $.get('/webclient/data/newmap.json', {r:Date.now()}, function(js)
    {
        mapJSON = js;
        updatePageList(js);
        load();
    }, 'json');
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
    var largest = -1;
    for (var k in data)
        if (k.indexOf(':') == 4 && k.indexOf(area) == 0)
        {
            var id = parseInt(k.substring(2,4),16);
            if (id > largest)
                largest = id;
        }
    return (area + largest.toString(16) + ':8').toUpperCase();
}
function getRnd()
{
    return Date.now();
}

function devPage()
{
    var map = document.getElementById('map');
    
    document.getElementById('desc').innerHTML = maxPageId + '. Dev page';
    map.innerHTML = defaultInner;
    document.getElementById('mapImage').src = '/webclient/images/blank.png';
    document.getElementById('map').style.overflowY = 'auto';
    
    doClock();
    
    berths = [];
    signals = [];
    points = [];
    dataText = [];
    text = [];
    trackc = [];
    
  //var areas = ['AW','CA','CC','EN','K2','KX','LS','PB','SE','SI','SO','SX','UR','U2','U3','WG','XX'];
    var areas = ['AW','CA','CC','EN','K2',     'LS',     'SE','SI',     'SX','UR','U2','U3'          ];
    var usedIDs = ['XXMOTD'];
    if (hideUsed)
    {
        for (var p in mapJSON.signalMap)
        {
            var pag = mapJSON.signalMap[p];
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
        }
    }
    
    var lastArea = '';
    var x = 26;
    var y = 100;
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
    
    areas = ['AW','CA','CC','EN','K2','KX','LS','PB','SE','SI','SO','SX','UR','U2','U3','WG','XX'];
    ids = [];
    lastArea = undefined;
    var keys = Object.keys(data).sort();
    for (var k in keys)
        if (areas.indexOf(keys[k].substring(0,2)) >= 0 && keys[k].indexOf(':') < 0 && keys[k].length == 6)
            ids.push(keys[k]);
    
    text.push(new Text({type:'TEXT',posX:x,posY:y-14,text:areas[0]}));
    for (var id in ids)
    {
        if (ids[id].indexOf(':') >= 0 || usedIDs.indexOf(ids[id]) >= 0)
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
    
    document.body.scrollTop = document.documentElement.scrollTop = 0;
    map.style.cursor = 'crosshair';
    fillBerths();
    loaded = true;
    obscureCheck(true);
}
var oldLoad = window.onload;
window.onload = function()
{
    oldLoad();
    reload();
};