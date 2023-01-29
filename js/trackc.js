function TrackCircuit(jsonObj)
{
    this.htmlID =      getNextID();
    this.dataIDs =     jsonObj['i'] || jsonObj['dataIDs'];
    this.posX =        jsonObj['x'] || jsonObj['posX'];
    this.posY =        jsonObj['y'] || jsonObj['posY'];
    this.width  =      jsonObj['w'] || jsonObj['width']  || 2;
    this.height =      jsonObj['h'] || jsonObj['height'] || 2;
    this.description = jsonObj['d'] || jsonObj['description'];
    this.unoccInv =    jsonObj['u'] || false;
    this.colours =     jsonObj['c'] || ['#404040', '#900'];
    this.dataValue = 0;

    var tc = document.createElement('p');
    map.appendChild(tc);
    tc.title = this.description;
    tc.dataset.id   = this.htmlID;
    tc.className    = 'trackc';
    tc.style.left   = this.posX + 'px';
    tc.style.top    = this.posY + 'px';
    tc.style.width  = this.width  + 'px';
    tc.style.height = this.height + 'px';
    tc.style.backgroundColor = this.dataValue == 1 ? ((this.unoccInv && !displayOpts.IDs) ? 'transparent' : this.colours[0]) : this.colours[1];
    this.domElement = tc;
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
    this.domElement.style.backgroundColor = this.dataValue == 0 ? ((this.unoccInv && !displayOpts.IDs) ? 'transparent' : this.colours[0]) : this.colours[1];
    this.domElement.title = displayOpts.IDs ? this.description + '\n' + this.dataIDs.join(', ') : this.description;
};

TrackCircuit.prototype.display = function(disp)
{
    this.domElement.style.display = disp ? '' : 'none';
};
