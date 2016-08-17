function Berth(jsonObj)
{
    this.htmlID = getNextID();
    this.dataIDs = jsonObj['dataIDs'];
    this.posX = jsonObj['posX'];
    this.posY = jsonObj['posY'];
    this.description = jsonObj['description'];
    this.hasBorder = jsonObj['hasBorder'] || false;
    this.displayMainID = false;
    this.dataValue = null;
    
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

    $(bthP).mouseenter(function(e){$(e.target).css('background-color','#404040');});
    $(bthP).mouseleave(function(e){$(e.target).css('background-color','transparent');});
    
    setData(this.dataIDs[0], getData(this.dataIDs[0]) || '');
    this.update();
    addObj(this.htmlID, this);
}

Berth.prototype.update = function()
{
    var oldData = this.dataValue;
    this.dataValue = '';
    for (var i = 0; i < this.dataIDs.length; i++)
        if (getData(this.dataIDs[i]))
        {
            this.dataValue = getData(this.dataIDs[i]);
            break;
        }
    
    if (this.displayMainID)
        this.dataValue = this.dataIDs[0].substring(2);

    if (oldData != null && oldData == this.dataValue)
        return;
    
    var bthA = this.domElement;
    var bthP = this.domElement.children[0];
    bthA.title = (this.description ? this.description + '\n' : '');
    for (var i in this.dataIDs)    
        bthA.title += this.dataIDs[i] + ': ' + getData(this.dataIDs[i]) + (i<this.dataIDs.length-1?'\n':'');
    bthP.innerHTML = this.dataValue;
    if (this.dataValue.match(/([0-9][A-Z][0-9]{2}|[0-9]{3}[A-Z])/))    
    {
        bthA.href = 'http://www.realtimetrains.co.uk/search/advancedhandler?type=advanced&search=' + bthP.innerHTML;
        bthA.target = '_blank';
    }
    else
    {
        bthA.removeAttribute('href');
        bthA.removeAttribute('target');
    }

    if (this.dataValue)
    {
        if (this.displayMainID && this.dataValue == this.dataIDs[0].substring(2))
            bthP.style.color = '#000';
        else if (this.dataValue == '1Z99')
            bthP.style.color = '#0FF';
        else if (this.dataValue.match(/([0-9][A-Z][0-9]{2}|[0-9]{3}[A-Z])/))
            bthP.style.color = '#090';
        else
            bthP.style.color = '#FFF';

        bthA.style.color = bthP.style.color;
        bthA.style.backgroundColor = '#404040';
    }
    else
    {
        bthA.style.backgroundColor = 'transparent';
    }
};
Berth.prototype.display = function(disp)
{
    if ((this.domElement.style.display == 'initial') != disp)
        this.domElement.style.display = disp ? 'initial' : 'none';
};
Berth.prototype.displayID = function(disp)
{
    if (this.displayMainID != disp)
    {
        this.displayMainID = disp;
        this.update();
    }
};