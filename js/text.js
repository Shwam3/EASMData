function Text(jsonObj)
{
    this.htmlID = getNextID();
    this.posX = jsonObj['posX'];
    this.posY = jsonObj['posY'];
    this.text = escapeHTML(jsonObj['text']).replaceAll('\\n','<br/>');
    this.type = jsonObj['type'];
    this.url = jsonObj['url'];
    this.description = jsonObj['description'] || jsonObj['text'].replaceAll('\\n','<br/>').replaceAll('<br/>',' ');

    //types: 'TEXT', 'LINK', (LOCATION) 'LOC', (MAJOR LOCATION) 'MLOC', (NAVIGATION) 'NAV', (MAJOR NAVIGATION) 'MNAV'

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
    else
        txt.className += ' backText';

    if (this.type == 'LINK' || this.type == 'MLINK')
    {
        txt.href = this.url;
        if (this.type == 'MLINK')
            txt.className = 'textLarge';
    }
    else if (this.type == 'LOC' || this.type == 'MLOC')
    {
        txt.href = 'http://www.realtimetrains.co.uk/search/advanced/' + this.url + '?stp=WVS&show=all&order=actual';
        if (this.type == 'MLOC')
            txt.className = 'textLarge';
    }
    else if (this.type == 'NAV' || this.type == 'MNAV')
    {
        txt.title = this.description = 'GOTO: ' + this.description;
        txt.href = '#' + this.url;
        txt.onclick = function(e)
        {
            loadPage(navIndex[e.currentTarget.hash.substring(1)]);
            e.preventDefault();
            return false;
        };
        txt.target = '_self';
        if (this.type == 'MNAV')
            txt.className = 'textLarge';
    }
    this.domElement = txt;

    addObj(this.htmlID, this);
}

Text.prototype.display = function(disp)
{
    if (disp != this.domElement.style.display == '')
        this.domElement.style.display = disp ? '' : 'none';
};
