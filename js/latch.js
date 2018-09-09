function Latch(jsonObj)
{
    this.htmlID = getNextID();
    this.dataIDs = jsonObj['dataIDs'] || [jsonObj['dataID']];
    this.posX = jsonObj['posX'];
    this.posY = jsonObj['posY'];
    this.colour = jsonObj['colour'] || 'G';
    this.flash = jsonObj['flash'] || [];
    this.description = jsonObj['description'];
    this.dataValue = 0;

    var lat = document.createElement('span');
    map.appendChild(lat);
    lat.title = this.description;
    lat.id = this.htmlID;
    lat.className = 'signal noPost spriteMain LATCH_'+this.colour+'_OFF';
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

    if (this.dataValue == 0)
        for (var i = 0; i < this.flash.length; i++)
            if (getData(this.flash[i]) == '1')
            {
                this.dataValue = 2;
                break;
            }

    var clas = 'signal noPost spriteMain LATCH_' + this.colour + '_' + (this.dataValue == 1 ? 'ON' : 'OFF') + (this.dataValue == 2 ? ' LATCH_FLASH' : '');
    if (this.domElement.className != clas)
        this.domElement.className = clas;
    this.domElement.title = displayOpts.IDs ? this.description + '\nid: ' + this.dataIDs.join(', ') + '\nflash: ' + this.flash.join(', ') : this.description;
};

Latch.prototype.display = function(disp)
{
    this.domElement.style.display = disp ? '' : 'none';
};
