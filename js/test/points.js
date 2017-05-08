function Points(jsonObj)
{
    this.htmlID = getNextID();
    this.dataIDs = jsonObj['dataIDs'];
    this.posX = jsonObj['posX'];
    this.posY = jsonObj['posY'];
    this.images = [];
    this.images[0] = jsonObj['type0'] || 'NONE';
    this.images[1] = jsonObj['type1'] || 'NONE';
    this.images[2] = 'NONE';
    this.description = jsonObj['description'];
    this.dataValue = 0;
    this.displayImage = false;

    var pts = document.createElement('img');
    document.getElementById('map').appendChild(pts);
    pts.title = this.description;
    pts.id = this.htmlID;
    pts.src = '/webclient/images/points/' + this.images[this.dataValue] + '.png';
    pts.className = 'points';
    pts.style.left = this.posX + 'px';
    pts.style.top = this.posY + 'px';
    this.domElement = pts;

    this.update();
    addObj(this.htmlID, this);
}

Points.prototype.update = function()
{
    this.dataValue = 0;
    for (var i = 0; i < this.dataIDs.length; i++)
        if (getData(this.dataIDs[i]) == '1')
        {
            this.dataValue = 1;
            break;
        }

    this.domElement.src = '/webclient/images/points/' + this.images[this.dataValue] + '.png';
    this.domElement.style.webkitFilter = this.displayImage ? "invert(40%)" : null;
    this.domElement.style.filter = this.displayImage ? "invert(40%)" : null;
    this.domElement.title = this.displayImage ? this.description + '\n' + this.dataIDs.join(', ') : this.description;
};

Points.prototype.display = function(disp)
{
    this.domElement.style.display = disp ? '' : 'none';
};
Points.prototype.displayID = function(disp)
{
    this.displayImage = disp;
    this.update();
};
