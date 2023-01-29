function Berth(jsonObj)
{
    this.htmlID = getNextID();
    this.dataIDs = jsonObj['dataIDs'];
    this.posX = jsonObj['posX'];
    this.posY = jsonObj['posY'];
    this.description = jsonObj['description'];
    this.hasBorder = jsonObj['hasBorder'] || false;
    this.displayMainID = false;
    this.lastDataValue = null;
    this.dataValue = '';
    this.allowLU = jsonObj['allowLU'] || false;
    this.showBerth = jsonObj['showBerth'] || [];
    this.lastData = null;
    this.data = [];
    this.forceUpdate = true;
    this.lastUpdate = -1;

    for (var k in this.dataIDs)
        setData(this.dataIDs[k], getData(this.dataIDs[k]) || '');

    var bthA = document.createElement('a');
    var bthP = document.createElement('p');
    bthA.appendChild(bthP);
    document.getElementById('map').appendChild(bthA);
    bthA.className = 'berth' + (this.hasBorder ? ' berthBorder' : '');
    bthP.className = 'berth' + (this.hasBorder ? ' berthBorder' : '');
    bthA.style.left = this.posX + 'px';
    bthA.style.top  = this.posY + 'px';
    bthA.title = (this.description ? this.description + '\n' : '');
    for (var i in this.dataIDs)
      bthA.title += this.dataIDs[i] + ': ' + getData(this.dataIDs[i]) + (i < this.dataIDs.length - 1 ? '\n' : '');
    bthA.id = this.htmlID;

    this.domElement = bthA;

    bthP.addEventListener('mouseover', function(e){e.target.style.backgroundColor ='#404040';});
    bthP.addEventListener('mouseleave', function(e){e.target.style.backgroundColor = 'transparent';});

    setData(this.dataIDs[0], getData(this.dataIDs[0]) || '');
    this.update();
    addObj(this.htmlID, this);
}

Berth.prototype.update = function(force)
{
    this.forceUpdate = this.forceUpdate || (force == true);
    var hide = false;
    if (this.showBerth.length > 0)
        for (var i = 0; i < this.showBerth.length; i++)
        {
            hide = !parseInt(getData(this.showBerth[i]));
            if (hide)
                break;
        }

    this.data = [];
    this.dataValue = '';
    var currId = this.dataIDs[0];
    for (var i = 0; i < this.dataIDs.length; i++)
    {
        var d = getData(this.dataIDs[i]).toString();
        this.data[i] = d;
        if (this.dataValue == '')
        {
            this.dataValue = d;
            currId = this.dataIDs[i];
        }
    }

    if (this.displayMainID)
        this.dataValue = this.dataIDs[0].substring(2);
    else if (hide)
        this.dataValue = '';

    if (this.lastUpdate < delayData.lastUpdate || !arraysEqual(this.lastData, this.data) || this.dataValue != this.lastDataValue || this.forceUpdate)
    {
        var bthA = this.domElement;
        var bthP = this.domElement.children[0];
        bthA.title = (this.description ? this.description + '\n' : '');
        for (var i in this.dataIDs)
            bthA.title += this.dataIDs[i] + ': ' + getData(this.dataIDs[i]) + (i<this.dataIDs.length-1?'\n':'');

        bthP.innerHTML = getHeadcode(this.dataValue, this);

        if (!this.displayMainID && this.dataValue.match(/([0-9][A-Z][0-9]{2}|[0-9]{3}[A-Z])/))
        {
            if (displayOpts.railcam)
                bthA.href = 'https://railcam.uk/rcdata/RCData2_detail.php?r=S&hc=' + this.dataValue + '&td=' + currId.substring(0,2) + '&vip=Y';
            else
            {
                if (dev)
                    bthA.href = 'https://sigmaps1s.signalmaps.co.uk/schedule/search/?hc=' + this.dataValue + '&td=' + currId.substring(0, 2) + '&rtt=true';
                else
                    bthA.href = 'https://www.realtimetrains.co.uk/search/handler?qsearch=' + this.dataValue;
            }
            bthA.rel = 'nofollow noreferrer noopener';
            bthA.target = '_blank';
            bthA.className = 'berth berthOcc' + (this.hasBorder ? ' berthBorder' : '');
        }
        else
        {
            bthA.removeAttribute('href');
            bthA.removeAttribute('target');
            bthA.removeAttribute('rel');
            bthA.className = 'berth' + (this.hasBorder ? ' berthBorder' : '');
        }

        if (this.dataValue)
        {
            var delayFound = false;
            if (this.displayMainID)
                bthP.style.color = '#000';
            else if (this.dataValue == '1Z99')
                bthP.style.color = '#0FF';
            else if (this.dataValue.match(/([0-9][A-Z][0-9]{2}|[0-9]{3}[A-Z])/))
            {
                if (displayOpts.delays && !isReplaying)
                {
                    var matches = delayData.data.filter(d => d.tds.includes(currId.substring(0, 2)) && (d.train_id_current.substring(2, 6) == this.dataValue || d.train_id.substring(2, 6) == this.dataValue)).sort((a,b) => b.next_expected_update - a.next_expected_update).sort((a,b) => b.next_expected_update - a.next_expected_update);
                    if (matches.length == 0 && this.dataValue.match(/([0-9]{3}[A-Z])/))
                        matches = delayData.data.filter(d => d.tds.includes(currId.substring(0, 2)) && (d.train_id_current.substring(2, 6) == getHeadcode(this.dataValue, this) || d.train_id.substring(2, 6) == this.dataValue)).sort((a,b) => b.next_expected_update - a.next_expected_update).sort((a,b) => b.next_expected_update - a.next_expected_update);
                    if (matches.length > 0)
                    {
                        var train = matches[0];
                        var colours = getDelayColoursForTrain(train);
                        bthP.style.color = colours.fg;
                        bthA.style.backgroundColor = colours.bg;
                        bthA.style.backgroundImage = bthP.style.backgroundImage = 'none';
                        if (dev)
                        {
                            bthA.title += '\n' + train.origin_dep.substring(0,2) + ':' + train.origin_dep.substring(2).trim().replace('H','½') + ' ' + train.loc_origin + ' - ' + train.loc_dest + 
                                '\nTrain ID: ' + train.train_id_current + (train.train_id_current != train.train_id ? ' (' + train.train_id + ')' : '') +
                                '\nUID: ' + train.schedule_uid +
                                '\nDelay: ' + (colours.dl == 0 ? 'RT' : (Math.abs(colours.dl) + (colours.dl < 0 ? 'E' : 'L')).replace('0.5','½').replace('.5','½')) +
                                    (train.off_route ? ' (Off Route)' : '') +
                                '\nTDs: ' + train.tds.join(',');
                            if (matches.length > 1)
                                bthA.title += '\n' + matches.length + ' matches: ' + matches.map(m => m.schedule_uid).join(', ');
                        }
                        else
                        {
                            bthA.title += '\n' + train.origin_dep.substring(0,2) + ':' + train.origin_dep.substring(2).trim().replace('H','½') + ' ' + train.loc_origin + ' - ' + train.loc_dest +
                                '\nDelay: ' + (colours.dl == 0 ? 'RT' : (Math.abs(colours.dl) + (colours.dl < 0 ? 'E' : 'L')).replace('0.5','½').replace('.5','½')) +
                                    (train.off_route ? ' (Off Route)' : '');
                        }

                        if (displayOpts.railcam)
                            //bthA.href = 'https://railcam.uk/rcdata/RCData2_detail.php?r=S&tid=' + train.train_id + '&vip=Y';
                            bthA.href = 'https://sigmaps1.signalmaps.co.uk/schedule/search?tid=' + train.train_id;
                        else
                        {
                            var d = new Date();
                            var ds = parseInt(train.train_id.substring(8));
                            if (d.getDate() > ds) d = new Date(Date.now() - 86400000);
                            else if (d.getDate() < ds) d = new Date(Date.now() + 86400000);

                            if (ds != d.getDate() && dev)
                                console.warn('Mismatch for link', ds, d.getDate(), this);
                            bthA.href = 'https://www.realtimetrains.co.uk/train/' + train.schedule_uid.replace('O','') + '/' + d.getFullYear() + '-' + (d.getMonth()+1 < 10 ? '0'+(d.getMonth()+1) : (d.getMonth()+1))  + '-' + (d.getDate() < 10 ? '0'+d.getDate() : d.getDate()) + '/detailed';
                        }
                        delayFound = true;
                    }
                }

                if (!delayFound)
                {
                    bthP.style.color = '#090';
                    bthA.style.backgroundColor = '#404040';
                    bthA.style.backgroundImage = bthP.style.backgroundImage = null;
                }
            }
            else if (this.allowLU && this.dataValue.match(/([A-Z][0-9]{3})/))
                bthP.style.color = '#FFA0FF';
            else
                bthP.style.color = '#FFF';

            bthA.style.color = bthP.style.color;
            if (!delayFound)
            {
                bthA.style.backgroundColor = '#404040';
                bthA.style.backgroundImage = bthP.style.backgroundImage = null;
            }
        }
        else
        {
            bthA.style.backgroundColor = 'transparent';
            bthA.style.backgroundImage = bthP.style.backgroundImage = null;
        }
        this.lastUpdate = delayData.lastUpdate;
        this.lastData = this.data;
        this.lastDataValue = this.dataValue;
        this.forceUpdate = false;
    }
};
Berth.prototype.display = function(disp, id)
{
    this.domElement.style.display = disp ? '' : 'none';
};
Berth.prototype.displayID = function(disp)
{
    this.displayMainID = disp;
};
function getDelayColoursForTrain(train)
{
    var delay = train.current_delay;
    var colourObj = {fg: 'black', dl: delay};
    if (delayData.lastUpdate > train.next_expected_update && train.next_expected_update != -1)
    {
        if (train.off_route == true && ((train.next_expected_update - delayData.lastUpdate) / 60000) - Math.max(delay, 0) > 1)
            return Object.assign(colourObj, {fg: '#090', bg: '#404040', off_route: true});
        else if (train.finished == false)
            delay = Math.max((delayData.lastUpdate - train.next_expected_update) / 60000, delay);
    }
    colourObj.dl = Math.round(delay * 2) / 2;

    if (delay <= -20)
        return Object.assign(colourObj, {bg: '#0FF'});
    else if (delay <= -3)
        return Object.assign(colourObj, {bg: colour({r:0,g:210,b:210}, {r:0,g:255,b:255}, (-delay-3) / 17)});
    else if (delay >= 60)
        return Object.assign(colourObj, {bg: '#8A2BE2'});
    else if (delay >= 20)
        return Object.assign(colourObj, {bg: colour({r:221,g:0,b:221}, {r:138,g:43,b:226}, (delay-20) / 40)});
    else if (delay >= 10)
        return Object.assign(colourObj, {bg: colour({r:221,g:0,b:0}, {r:221,g:0,b:221}, (delay-10) / 10)});
    else if (delay >= 3)
        return Object.assign(colourObj, {bg: colour({r:221,g:221,b:0}, {r:221,g:0,b:0}, (delay-3) / 7)});
    else
        return Object.assign(colourObj, {bg: '#0D0'});
}
function colour(frm, to, perc)
{
    var dr = to.r - frm.r;
    var dg = to.g - frm.g;
    var db = to.b - frm.b;

    return 'rgb(' + (frm.r + dr*perc) + ',' + (frm.g + dg*perc) + ',' + (frm.b + db*perc) + ')';
}
