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
    this.lastData = null;
    this.data = [];
    this.forceUpdate = true;

    for (var k in this.dataIDs)
        setData(this.dataIDs[k], getData(this.dataIDs[k]) || '');

    var bthA = document.createElement('a');
    var bthP = document.createElement('p');
    bthA.appendChild(bthP);
    document.getElementById('map').appendChild(bthA);
    bthA.className = 'berth' + (this.hasBorder?' berthBorder':'');
    bthP.className = 'berth' + (this.hasBorder?' berthBorder':'');
    bthA.style.left = this.posX + 'px';
    bthA.style.top  = this.posY + 'px';
    bthA.title = (this.description ? this.description + '\n' : '');
    for (var i in this.dataIDs)
      bthA.title += this.dataIDs[i] + ': ' + getData(this.dataIDs[i]) + (i<this.dataIDs.length-1?'\n':'');
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

    if (!arraysEqual(this.lastData, this.data) || this.dataValue != this.lastDataValue || this.forceUpdate)
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
                bthA.href = 'http://railcam.co.uk/hc/RCTrainInfo.php?r=S&hc=' + this.dataValue + '&td=' + currId.substring(0,2);
            else
                bthA.href = 'http://www.realtimetrains.co.uk/search/advancedhandler?type=advanced&map=true&search=' + this.dataValue;
            bthA.rel = 'nofollow noreferrer noopener';
            bthA.target = '_blank';
        }
        else
        {
            bthA.removeAttribute('href');
            bthA.removeAttribute('target');
            bthA.removeAttribute('rel');
        }

        if (this.dataValue)
        {
            if (this.displayMainID)// && this.dataValue == this.dataIDs[0].substring(2))
                bthP.style.color = '#000';
            else if (this.dataValue == '1Z99')
                bthP.style.color = '#0FF';
            else if (this.dataValue.match(/([0-9][A-Z][0-9]{2}|[0-9]{3}[A-Z])/))
                bthP.style.color = '#090';
            else if (this.allowLU && this.dataValue.match(/([A-Z][0-9]{3})/))
                bthP.style.color = '#FFA0FF';
            else
                bthP.style.color = '#FFF';

            bthA.style.color = bthP.style.color;
            bthA.style.backgroundColor = '#404040';
        }
        else
        {
            bthA.style.backgroundColor = 'transparent';
        }
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
