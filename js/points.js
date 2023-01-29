function Points(jsonObj)
{
    this.htmlID = getNextID();
    this.dataIDs = jsonObj['i'] || jsonObj['dataIDs'];
    this.posX = jsonObj['x'] || jsonObj['posX'];
    this.posY = jsonObj['y'] || jsonObj['posY'];
    this.images = [];
    this.images[0] = jsonObj['0'] || jsonObj['type0'] || 'NONE';
    this.images[1] = jsonObj['1'] || jsonObj['type1'] || 'NONE';
    this.description = jsonObj['d'] || jsonObj['description'];
    this.dataValue = -1;
    this.displayImage = false;

    var pts = document.createElement('span');
    document.getElementById('map').appendChild(pts);
    pts.title = this.description;
    pts.dataset.id = this.htmlID;
    pts.className = 'points spritePoints NONE';
    pts.style.left = this.posX + 'px';
    pts.style.top = this.posY + 'px';
    this.domElement = pts;
}

Points.prototype.update = function()
{
    var dVal = 0
    for (var i = 0; i < this.dataIDs.length; i++)
        if (getData(this.dataIDs[i]) == '1')
        {
            dVal = 1;
            break;
        }

    if (this.dataValue != dVal)
        this.domElement.className = 'points spritePoints ' + this.images[dVal];
    this.domElement.style.webkitFilter = this.displayImage ? "invert(40%)" : null;
    this.domElement.style.filter = this.displayImage ? "invert(40%)" : null;
    this.domElement.title = this.displayImage ? this.description + '\n' + this.dataIDs.join(', ') : this.description;
    this.dataValue = dVal;
};

Points.prototype.display = function(disp)
{
    this.domElement.style.display = disp ? '' : 'none';
};
Points.prototype.displayID = function(disp)
{
    this.displayImage = disp;
};
