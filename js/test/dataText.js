function DataText(jsonObj)
{
    this.htmlID = getNextID();
    this.dataIDs = jsonObj['dataIDs'];
    this.posX = jsonObj['posX'];
    this.posY = jsonObj['posY'];
    this.text = [];
    this.text[0] = typeof jsonObj['text0'] !== 'undefined' ? escapeHTML(jsonObj['text0']).replaceAll('\\n','<br/>') : undefined;
    this.text[1] = typeof jsonObj['text1'] !== 'undefined' ? escapeHTML(jsonObj['text1']).replaceAll('\\n','<br/>') : undefined;
    this.description = jsonObj['description'];
    this.dataValue = 0;

    var txt = document.createElement('p');
    map.appendChild(txt);
    txt.title = this.description;
    txt.id = this.htmlID;
    txt.className = 'text';
    txt.style.left = this.posX + 'px';
    txt.style.top  = this.posY + 'px';
    txt.innerHTML = this.text[0];
    this.domElement = txt;

    addObj(this.htmlID, this);
}

DataText.prototype.update = function()
{
    this.dataValue = 0;
    for (var i = 0; i < this.dataIDs.length; i++)
        if (getData(this.dataIDs[i]) == '1')
        {
            this.dataValue = 1;
            break;
        }

    var useHide = false;
    if (this.text[0] == undefined || this.text[1] == undefined)
      useHide = true;

    this.domElement.innerHTML = this.text[this.dataValue] || this.text[1 - this.dataValue];
    this.domElement.className = (this.text[this.dataValue]||'').trim() ? 'textOn' : (useHide ? 'textHide' : 'textOff');
    this.domElement.title = displayOpts.IDs ? this.description + '\n' + this.dataIDs.join(', ') : this.description;
};

DataText.prototype.display = function(disp)
{
    this.domElement.style.display = disp ? '' : 'none';
};
