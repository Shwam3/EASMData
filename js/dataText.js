function DataText(jsonObj)
{
    this.htmlID = getNextID();
    this.dataIDs = jsonObj['i'] || jsonObj['dataIDs'];
    this.posX = jsonObj['x'] || jsonObj['posX'];
    this.posY = jsonObj['y'] || jsonObj['posY'];
    this.text = [];
    this.text[0] = typeof jsonObj['0'] !== 'undefined' ? escapeHTML(jsonObj['0']).replaceAll('\\n','<br/>') : (typeof jsonObj['text0'] !== 'undefined' ? escapeHTML(jsonObj['text0']).replaceAll('\\n','<br/>') : undefined);
    this.text[1] = typeof jsonObj['1'] !== 'undefined' ? escapeHTML(jsonObj['1']).replaceAll('\\n','<br/>') : (typeof jsonObj['text1'] !== 'undefined' ? escapeHTML(jsonObj['text1']).replaceAll('\\n','<br/>') : undefined);
    this.description = jsonObj['d'] || jsonObj['description'];
    this.colour = jsonObj['c'] || jsonObj['colour'];
    this.dataValue = null;

    var txt = document.createElement('p');
    map.appendChild(txt);
    txt.title = this.description;
    txt.dataset.id = this.htmlID;
    txt.className = 'text';
    txt.style.left = this.posX + 'px';
    txt.style.top  = this.posY + 'px';
    txt.style.color = this.text[0] ? this.colour : null;
    txt.innerHTML = this.text[0] || '';
    this.domElement = txt;
}

DataText.prototype.update = function()
{
    var dv = 0;
    for (var k in this.dataIDs)
        if (getData(this.dataIDs[k]) == '1')
        {
            dv = 1;
            break;
        }

    if (dv != this.dataValue)
    {
        this.dataValue = dv;

        var useHide = false;
        if (this.text[0] == undefined || this.text[1] == undefined)
          useHide = true;

        this.domElement.innerHTML = this.text[this.dataValue] || this.text[1 - this.dataValue];
        if ((this.text[this.dataValue] || '').trim())
        {
            this.domElement.className = 'textOn';
            if (this.colour != undefined)
                this.domElement.style.color = this.colour;
        }
        else
        {
            this.domElement.className = useHide ? 'textHide' : 'textOff';
            if (this.colour != undefined)
                this.domElement.style.color = null;
        }
    }
    this.domElement.title = displayOpts.IDs ? this.description + '\n' + this.dataIDs.join(', ') : this.description;
};

DataText.prototype.display = function(disp)
{
    this.domElement.style.display = disp ? '' : 'none';
};
