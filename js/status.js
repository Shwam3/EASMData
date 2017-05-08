function Status(jsonObj)
{
    this.htmlID = getNextID();
    this.dataID = jsonObj['dataID'] || 'XX_SYS';
    this.posX = jsonObj['posX'] || 10;
    this.posY = jsonObj['posY'] || 10;
    this.text = [];
    this.text[0] = "Loading"; //Y
    this.text[1] = "System OK"; //G
    this.text[2] = "Stale Data"; //Y
    this.text[3] = "Disconnected"; //R
    this.description = jsonObj['description'];
    this.dataValue = 0;

    var txt = document.createElement('p');
    map.appendChild(txt);
    txt.title = this.description;
    txt.id = this.htmlID;
    txt.className = 'text textOn';
    txt.style.left = this.posX + 'px';
    txt.style.top = this.posY + 'px';
    txt.innerHTML = this.text[0];
    this.domElement = txt;

    addObj(this.htmlID, this);
}

Status.prototype.update = function()
{
    this.dataValue = getData(this.dataID);

    this.domElement.innerHTML = this.text[this.dataValue];
    this.domElement.style.color = this.dataValue == 3 ? 'red' : (this.dataValue == 0 || this.dataValue == 2 ? 'yellow' : 'green');
};
