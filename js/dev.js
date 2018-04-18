dev = true;
hideUsed = true;
var wait = 2000;
var area_filter = {'hideUsed':true};
function reload()
{
    get('/webclient/data/dev/data.json?r='+Date.now(), function(json)
    {
        mapJSON = json;
        updatePageList(json);
        load();
    }, function(e) { console.error(e); });
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
    setto = setto == undefined ? 1 : setto;
    if(!ids || ids.length == 0)
    {
        document.title = "Signal Maps";
        console.log('Done');
        return;
    }
    var id = ids.shift();
    var val = getData(id);
    document.title = "Signal Maps - " + id;
    setData(id, setto);
    fillBerths();
    setTimeout(function(){ setData(id, val); fillBerths(); cycle(ids, setto); }, wait);
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
    displayOpts.changed = true;
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
var areasA = ['A2','AW','CA','CC','CT','D3','EN','IH','K2','KX','LS','NJ','NX','PB','Q1','Q2','SO','SX','UR','U2','U3','WC','WG','WH','WJ','WY','WS','X0','XX'];
var areasS = ['A2','AW','CA','CC','CT','D3','EN','IH','K2',     'LS','NJ','NX',     'Q1','Q2',     'SX','UR','U2','U3',          'WH','WJ',          'X0'     ];
function devPage()
{
    var map = document.getElementById('map');

    document.getElementById('desc').innerHTML = 'Dev Page';
    document.title = 'Signal Maps - Dev Page';
    window.location.replace(window.location.href.split('#')[0] + '#dev');
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
    setAreas(areasA);

    var div = document.createElement('div');
    div.style.margin = '5px 26px';
    for (ar of areasA)
    {
        var lab = document.createElement('label');
        area_filter[ar] = area_filter[ar] == undefined ? true : area_filter[ar];
        lab.innerHTML = '<input type="checkbox" id="area_'+ar+'" name="'+ar+'" onchange="filterArea(this)"'+(area_filter[ar] ? ' checked' : '')+'>'+ar;
        div.appendChild(lab);
    }
    var lab = document.createElement('label');
    lab.innerHTML = '<input type="checkbox" id="area_hideUsed" name="hideUsed" onchange="filterArea(this)"'+(area_filter.hideUsed ? ' checked' : '')+'>hideUsed';
    div.appendChild(lab);
    document.getElementById('map').appendChild(div);
    hideUsed = area_filter.hideUsed;

    var usedIDs = ['XXMOTD'];
    if (hideUsed)
    {
        for (pag of mapJSON)
        {
            if ((!('data' in pag) || pag.data == {}) && pag.areas.some(id => areasA.indexOf(id) >= 0 || areasS.indexOf(id) >= 0))
            {
                downloadPage(pag.panelUID);
                return;
            }
        }

        for (pag of mapJSON)
        {
            var pag = pag.data || {};
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
    for (ar of areasS)
        ids.push.apply(ids, list(ar + '00:1', largestID(ar)));

    if (area_filter[areasS[0]])
        text.push(new Text({type:'TEXT',posX:x,posY:y-12,text:areasS[0]}));
    for (id of ids)
    {
        if (area_filter[id.substring(0, 2)])
        {
            if (id.indexOf(':') < 0 || usedIDs.indexOf(id) >= 0)
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

            if (lastArea && lastArea != id.substring(0,2))
            {
                x = 26;
                text.push(new Text({type:'TEXT',posX:x,posY:y+12,text:id.substring(0,2)}));
                y += 24;
            }

            signals.push(new Signal({type:'TEST',posX:x+4,posY:y+4,dataID:id,description:id}));

            x += 12;
            if (x+12 > 1828)
            {
                x = 26;
                y += 12;
            }
        }
        lastArea = id.substring(0,2);
    }

    x = 26;
    y += 48;

    ids = [];
    lastArea = undefined;
    var keys = Object.keys(data).sort();
    for (key of keys)
        if (areasA.indexOf(key.substring(0,2)) >= 0 && key.indexOf(':') < 0 && key.length == 6 )
            ids.push(key);

    if (area_filter[areasA[0]])
        text.push(new Text({type:'TEXT',posX:x,posY:y-14,text:areasA[0]}));
    for (id of ids)
    {
        if (id.indexOf(':') >= 0
                || id.indexOf('!') >= 0
                || id.substring(2, 6) == 'PRED'
                || id.substring(2, 6) == 'PGRN'
                || (usedIDs.indexOf(id) >= 0 && hideUsed))
            continue;

        if (area_filter[id.substring(0,2)])
        {
            if (lastArea && lastArea != id.substring(0,2))
            {
                x = 26;
                text.push(new Text({type:'TEXT',posX:x,posY:y+20,text:id.substring(0,2)}));
                y += 32;
            }

            berths.push(new Berth({hasBorder:true,posX:x,posY:y,dataIDs:[id],allowLU:id.startsWith('WS')}));

            x += 56;
            if (x+48 > 1828)
            {
                x = 26;
                y += 24;
            }
        }
        lastArea = id.substring(0,2);
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
function downloadPage(uid)
{
    var pageNo = navIndex[uid] || 0;
    get('/webclient/data/' + (dev ? 'dev/' : '') + uid + '.json?r='+Date.now(), function(json)
    {
        mapJSON[pageNo]['data'] = json;
        load();
        console.log('Downloaded main file (' + uid + '.json)');
    }, function(e)
        {
            console.error(e || 'fail');
            get('https://raw.githubusercontent.com/Shwam3/EASMData/master/data/' + (dev ? 'dev/' : '') + uid + '.json', function(json)
            {
                mapJSON[pageNo]['data'] = json;
                load();
                console.log('Downloaded secondary file (' + uid + '.json)');
            });
        });
}

window.onload = function()
{
    document.getElementById('fbh').addEventListener('click', hcSearch);
    document.getElementById('map').style.cursor = 'wait';
    obscureCheck(false);

    var canv = document.createElement('canvas');
    canv.width = 1;
    canv.height = 1;
    canUseWebP = !!(canv.getContext && canv.getContext('2d')) && canv.toDataURL('image/webp').indexOf('data:image/webp') == 0;
    console.log('Using ' + getImgExt());

    var modal = document.getElementById('modal');
    var modalClose = document.getElementById('modal-close');
    modal.onclick = modalClose.onclick = function(e)
    {
        modal.style.display = 'none';
    }
    
    reload();

    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = '/webclient/sprites.' + (canUseWebP ? 'webp.css' : 'css');
    css.type = 'text/css';
    var csss = document.getElementsByTagName('link');
    document.head.insertBefore(css, document.head.lastElementChild);

    openSocket(host);

    messageRate = new Counter(100);

    setInterval(doClock, 100);
    setInterval(fillBerths0, 100);
    setInterval(function()
    {
        if (connected && lastMessage > 0 && Date.now() - lastMessage > 75000)
        {
            console.log('Closing connection (timeout)');
            connection.close();
        }
    }, 100);
};
function getAllHCs()
{
    for (var b in data)
    {
        if (data[b].match(/[0-9]{3}[A-Z]/))
            getHeadcode(data[b], b.substring(0, 2));
    }
}
function hcSearch(evt)
{
    var h = prompt('pla:');

    if (h != null && h.match(/([0-9][A-Z][0-9]{2}|[0-9]{3}[A-Z])/))
    {
        console.log(h);
    }

    evt.preventDefault();
    return false;
}
function Counter(samples)
{
    this.MAX_SAMPLES = samples;
    this.samples = 1;
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

        this.samples = Math.min(this.MAX_SAMPLES, this.samples + 1);
        return this.tickSum / this.samples;
    };

    this.getAverageTick = function getAverageTick()
    {
        return this.tickSum / this.samples;
    }
}
