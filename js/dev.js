dev = true;
hideUsed = true;
var wait = 2000;
var area_filter = {'hideUsed':true};
function reload()
{
    get('https://sigmaps1s.signalmaps.co.uk/webclient/data/dev/data.json?r='+Date.now(), function(json)
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
    var ind = parseInt(id[5]) + 1;
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

        if (ls.length > 2048)
            throw "list() unbounded";
    }
    ls.push(l);
    return ls;
}
function largestID(area)
{
    var exists = false;
    var largest = 0;
    for (var k in data)
        if (k[4] == ':' && k.indexOf(area) == 0)
        {
            exists = true;
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
        case 'h': displayOpts.headcodes = e.checked; localStorage.setItem('h',displayOpts.headcodes); break;
        case 'p': displayOpts.points = e.checked; break;
        case 'r': displayOpts.dataText = e.checked; break;
        case 's': displayOpts.signals = e.checked; break;
        case 't': displayOpts.text = e.checked; break;
        case 'e': displayOpts.delays = e.checked; localStorage.setItem('e',displayOpts.delays); setAreas(null); break;
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
    document.getElementById('e').checked = displayOpts.delays;
}
var areasA = ['A2','AW','CA','CC','CT','D0','D1','D3','D4','D5','D6','D7','D9','EN','IH','K2','KX','LS','NJ','NX','PB','Q1','Q2','SO','SX','UR','U2','U3','WC','WG','WH','WJ','WY','WS','X0','XX'];
var areasS = ['A2','AW','CA','CC','CT','D0','D1','D3','D4','D5','D6','D7','D9','EN','IH','K2',     'LS','NJ','NX',     'Q1','Q2',     'SX','UR','U2','U3',          'WH','WJ',          'X0'     ];
if (localStorage.getItem('areasA') != null) areasA = localStorage.getItem('areasA').split(',');
if (localStorage.getItem('areasS') != null) areasS = localStorage.getItem('areasS').split(',');

function devPage()
{
    var map = document.getElementById('map');

    document.getElementById('desc').textContent = 'Dev Page';
    window.location.replace(window.location.href.split('#')[0] + '#dev');
    map.innerHTML = defaultInner;
    document.getElementById('mapImage').src = 'https://sigmaps1s.signalmaps.co.uk/webclient/images/blank.png';
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
    areasA = areasA.sort();
    areasS = areasS.sort();
    setAreas([...new Set([...areasA, ...areasS])].sort());

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

    var usedIDs = [];
    if (hideUsed)
    {
        var downloaded = false;
        for (var pag of mapJSON)
        {
            if ((!('data' in pag) || pag.data == {}) && pag.areas.some(id => areasA.indexOf(id) >= 0 || areasS.indexOf(id) >= 0))
            {
                if (!pag['downloading'])
                {
                    pag.downloading = true;
                    downloadPage(pag.panelUID, load);
                }
                downloaded = true;
            }
        }
        if (downloaded)
            return;

        for (var pag of mapJSON)
        {
            pag = pag.data || {};
            if (pag.signals)
            for (var sig of pag.signals)
            {
                if (sig.dataID)  usedIDs.push(sig.dataID);
                if (sig.dataIDs) usedIDs.push.apply(usedIDs, sig.dataIDs);
                if (sig.routes)  usedIDs.push.apply(usedIDs, sig.routes);
                if (sig.flash)   usedIDs.push.apply(usedIDs, sig.flash);
            }

            if (pag.points)
            for (var pts of pag.points)
            {
                usedIDs.push.apply(usedIDs, pts.dataIDs);
            }

            if (pag.berths)
            for (var bths of pag.berths)
            {
                usedIDs.push.apply(usedIDs, bths.dataIDs);
            }

            if (pag.conditionals)
            for (var cond of pag.conditionals)
            {
                usedIDs.push.apply(usedIDs, cond.cond.flat(10).filter(i => i.length == 6 && (i.indexOf(':') == 4 || i.indexOf('!') == 4)));
            }
            
            for (var i = 0; i < usedIDs.length; i++)
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
            if (id[4] != ':' || usedIDs.indexOf(id) >= 0)
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
        if (key.length == 6 && key.indexOf(':') < 0 && areasA.indexOf(key.substring(0,2)) >= 0)
            ids.push(key);

    if (area_filter[areasA[0]])
        text.push(new Text({type:'TEXT',posX:x,posY:y-14,text:areasA[0]}));
    for (id of ids)
    {
        if (id[4] == ':' || id[4] == '!'
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
function unused(a)
{
    var usedIDs = [];
    var downloaded = false;
    for (pag of mapJSON)
    {
        if ((!('data' in pag) || pag.data == {}) && pag.areas.some(id => a == id))
        {
            if (!pag['downloading'])
            {
                pag.downloading = true;
                downloadPage(pag.panelUID, () => unused(a));
            }
            downloaded = true;
        }
    }
    if (downloaded)
        return;

    for (var pag of mapJSON)
    {
        pag = pag.data || {};
        if (pag.signals)
        for (var sig of pag.signals)
        {
            if (sig.dataID)  usedIDs.push(sig.dataID);
            if (sig.dataIDs) usedIDs.push.apply(usedIDs, sig.dataIDs);
            if (sig.routes)  usedIDs.push.apply(usedIDs, sig.routes);
            if (sig.flash)   usedIDs.push.apply(usedIDs, sig.flash);
        }

        if (pag.points)
        for (var pts of pag.points)
        {
            usedIDs.push.apply(usedIDs, pts.dataIDs);
        }

        if (pag.berths)
        for (var bths of pag.berths)
        {
            usedIDs.push.apply(usedIDs, bths.dataIDs);
        }

        if (pag.conditionals)
        for (var conds of pag.conditionals)
        {
            usedIDs.push.apply(usedIDs, conds.cond.flat(10).filter(i => i.length == 6 && (i.indexOf(':') == 4 || i.indexOf('!') == 4)));
        }

        for (var i = 0; i < usedIDs.length; i++)
        {
            usedIDs[i] = usedIDs[i].replace('!', ':');
        }
    }

	console.log(list(a + '00:1', largestID(a)).filter(x => usedIDs.indexOf(x) < 0).join(','));
}
function filterArea(evt)
{
    console.log(evt.name, evt.checked ? 'shown' : 'hidden')
    area_filter[evt.name] = evt.checked;
    devPage();
}
function downloadPage(uid, callback)
{
    if (!callback) callback = load;

    setTimeout(() => {
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
    }, 0);
}
function updatePageList(json)
{
    if (json)
    {
        navIndex = {};
        var list = document.getElementById('pageSelectorList');
        if (list == null)
        {
            var spd = document.getElementById('controllerSpeed');
            list = document.createElement('select');
            list.id = 'pageSelectorList';
            list.addEventListener('change', evt => loadPage(parseInt(evt.target.options[evt.target.selectedIndex].value.split(' ')) - 1));
            spd.parentElement.insertBefore(list, null);
        }
        list.innerHTML = '';
        var pnls = [];
        for (var p in json)
        {
            var pageData = json[p];
            p = parseInt(p);
            navIndex[pageData.panelUID] = p;
            var opt = document.createElement('option');
            opt.textContent = (1 + p) + '. ' + pageData.panelUID;
            if (page == p) opt.selected = true;
            list.insertBefore(opt, null);
        }
        maxPageId = list.children.length-1;

        if (dev)
        {
            navIndex['dev'] = ++maxPageId;
            var opt = document.createElement('option');
            opt.textContent = (maxPageId+1) + '. dev';
            if (page == maxPageId) opt.selected = true;
            list.insertBefore(opt, null);
        }
    }
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
    console.log('Using ' + getImgExt());

    reload();

    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://sigmaps1s.signalmaps.co.uk/webclient/css/sprites.' + (canUseWebP ? 'webp.css' : 'css') + '?r=' + Date.now();
    css.type = 'text/css';
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
function previewPrep()
{
    closeSocket(false);

    berths.forEach(b => b.dataIDs.forEach(i => setData(i, '')));
    signals.forEach(s => setData(s.dataID, 0));
    signals.forEach(s => s.routeIDs.forEach(i => setData(i, 0)));
    trackc.forEach(t => t.dataIDs.forEach(i => setData(i, 0)));
    latches.forEach(l => l.dataIDs.forEach(i => setData(i, 0)));
    dataText.forEach(d => d.dataIDs.forEach(i => setData(i, 0)));
}
function Counter(samples)
{
    this.MAX_SAMPLES = samples;
    this.samples = 1;
    this.tickIndex = 0;
    this.tickSum = 0;
    this.tickList = [];

    this.totalData = 0;

    for (var i = 0; i < this.MAX_SAMPLES; i++)
    {
        this.tickList[i] = 0;
    }

    this.addTick = function addTick(tick, data)
    {
        this.totalData += data;

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
