function TrackCircuit(jsonObj)
{
    this.htmlID = getNextID();
    this.dataIDs = jsonObj['dataIDs'];
    this.posX = jsonObj['posX'];
    this.posY = jsonObj['posY'];
    this.width  = jsonObj['width'];
    this.height = jsonObj['height'];
    this.description = jsonObj['description'];
    this.dataValue = 0;
    
    var tc = document.createElement('p');
    map.appendChild(tc);
    tc.title = this.description;
    tc.id = this.htmlID;
    tc.className    = 'trackc';
    tc.style.left   = this.posX + 'px';
    tc.style.top    = this.posY + 'px';
    tc.style.width  = this.width  + 'px';
    tc.style.height = this.height + 'px';
    tc.style.backgroundColor = this.dataValue == 1 ? '#404040' : '#900';
    this.domElement = tc;
    
    addObj(this.htmlID, this);
}

TrackCircuit.prototype.update = function()
{
    this.dataValue = 0;
    for (var i = 0; i < this.dataIDs.length; i++)
        if (getData(this.dataIDs[i]) == '1')
        {
            this.dataValue = 1;
            break;
        }
    this.domElement.style.backgroundColor = this.dataValue == 0 ? '#404040' : '#900';
};

TrackCircuit.prototype.display = function(disp)
{
    this.domElement.style.display = disp ? '' : 'none';
};