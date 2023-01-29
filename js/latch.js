function Latch(jsonObj)
{
    this.htmlID = getNextID();
    this.dataIDs = jsonObj['i'] || jsonObj['dataIDs'] || [jsonObj['dataID']];
    this.posX = jsonObj['x'] || jsonObj['posX'];
    this.posY = jsonObj['y'] || jsonObj['posY'];
    this.colour = jsonObj['c'] || jsonObj['colour'] || 'G';
    this.flash = jsonObj['f'] || jsonObj['flash'] || [];
    this.description = jsonObj['d'] || jsonObj['description'];
    this.dataValue = 0;

    var lat = document.createElement('span');
    map.appendChild(lat);
    lat.title = this.description;
    lat.dataset.id = this.htmlID;
    lat.className = 'signal noPost spriteMain LATCH_'+this.colour+'_OFF';
    lat.style.left = this.posX + 'px';
    lat.style.top  = this.posY + 'px';
    this.domElement = lat;
}

Latch.prototype.update = function()
{
    this.dataValue = 0;
    for (var i = 0; i < this.dataIDs.length; i++)
        if (getData(this.dataIDs[i]) == '1' || getData(this.dataIDs[i]) != '')
        {
            this.dataValue = 1;
            break;
        }

    if (this.dataValue == 0)
        for (var i = 0; i < this.flash.length; i++)
            if (getData(this.flash[i]) == '1' || getData(this.flash[i]) != '')
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
