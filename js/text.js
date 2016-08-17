function Text(jsonObj)
{
    this.htmlID = getNextID();
    this.posX = jsonObj['posX'];
    this.posY = jsonObj['posY'];
    this.text = escapeHTML(jsonObj['text']).replace('\\n','<br/>');
    this.type = jsonObj['type'];
    this.url = jsonObj['url'];
    this.description = jsonObj['description'] || this.text.replace('<br/>',' ');
    
    //types: 'TEXT', 'LINK', (LOCATION) 'LOC', (MAJOR LOCATION) 'MLOC', (NAVIGATION) 'NAV'
    
    var txt = document.createElement(this.type == 'TEXT' ? 'p' : 'a');
    map.appendChild(txt);
    txt.title = this.description;
    txt.id = this.htmlID;
    txt.className = 'text';
    txt.style.left = this.posX + 'px';
    txt.style.top  = this.posY + 'px';
    txt.innerHTML = this.text;
    if (this.type != 'TEXT')
        txt.target = '_blank';
    
    if (this.type == 'LINK')
    {
        txt.href = this.url;
    }
    else if (this.type == 'LOC' || this.type == 'MLOC')
    {
        txt.href = 'http://www.realtimetrains.co.uk/search/advanced/' + this.url + '?stp=WVS&show=all&order=actual';
        if (this.type == 'MLOC')
            txt.className = 'textLarge';
    }
    else if (this.type == 'NAV')
    {
        txt.href = '#' + navIndex[this.url];
        txt.target = '';
        txt.className = 'textLarge';
    }
    this.domElement = txt;
    
    addObj(this.htmlID, this);
}

Text.prototype.display = function(disp)
{
    this.domElement.style.display = disp ? '' : 'none';
};