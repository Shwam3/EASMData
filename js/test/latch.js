function Latch(jsonObj)
{
    this.htmlID = getNextID();
    this.dataIDs = jsonObj['dataIDs'];
    this.posX = jsonObj['posX'];
    this.posY = jsonObj['posY'];
    this.description = jsonObj['description'];
    this.dataValue = 0;
    
    var lat = document.createElement('img');
    map.appendChild(lat);
    lat.title = this.description;
    lat.id = this.htmlID;
    lat.className = 'signal noPost';
    lat.src = '/webclient/images/signals/LATCH_OFF.png';
    lat.style.left = this.posX + 'px';
    lat.style.top  = this.posY + 'px';
    this.domElement = lat;
    
    addObj(this.htmlID, this);
}

Latch.prototype.update = function()
{
    this.dataValue = 0;
    for (var i = 0; i < this.dataIDs.length; i++)
        if (getData(this.dataIDs[i]) == '1')
        {
            this.dataValue = 1;
            break;
        }
            
    this.domElement.src = '/webclient/images/signals/LATCH_' + (this.dataValue == 1 ? 'ON' : 'OFF') + '.png';
};

Latch.prototype.display = function(disp)
{
    this.domElement.style.display = disp ? '' : 'none';
};