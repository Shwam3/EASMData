function Text(jsonObj)
{
    this.htmlID = getNextID();
    this.posX = jsonObj['x'] || jsonObj['posX'];
    this.posY = jsonObj['y'] || jsonObj['posY'];
    this.text = escapeHTML(jsonObj['e'] || jsonObj['text']).replaceAll('\\n','<br/>');
    this.type = jsonObj['t'] || jsonObj['type'];
    this.url = jsonObj['u'] || jsonObj['url'];
    this.colour = jsonObj['c'] || jsonObj['colour'];
    this.description = jsonObj['d'] || jsonObj['description'] || (jsonObj['e'] || jsonObj['text']).replaceAll('\\n','<br/>').replaceAll('<br/>',' ');
    this.goToX = jsonObj['g'];
    this.goToXAlign = jsonObj['ga'] || '';
    this.align = jsonObj['a'];
    this.customNav = Boolean(jsonObj['n'] || false);

    //types: 'TEXT', 'LINK', (LOCATION) 'LOC', (MAJOR LOCATION) 'MLOC', (NAVIGATION) 'NAV', (MAJOR NAVIGATION) 'MNAV'

    var txt = document.createElement(this.type == 'TEXT' || this.type == 'MTEXT' ? 'p' : 'a');
    map.appendChild(txt);
    txt.title = this.description;
    txt.dataset.id = this.htmlID;
    txt.className = 'text';
    txt.style.left = this.posX + 'px';
    txt.style.top  = this.posY + 'px';
    txt.innerHTML = this.text;
    if (this.type != 'TEXT' && this.type != 'MTEXT')
    {
        txt.target = '_blank';
        txt.rel = 'nofollow noreferrer noopener';
    }
    else if (this.type == 'MTEXT')
    {
        txt.className = 'textLarge';
        txt.className += ' backText';
    }
    else
        txt.className += ' backText';

    if (this.colour != undefined)
        txt.style.color = this.colour;

    if (this.align != undefined && (this.align == 'L' || this.align == 'R'))
        txt.style.textAlign = this.align == 'L' ? 'left' : 'right';

    if (this.type == 'LINK' || this.type == 'MLINK')
    {
        txt.href = this.url;
        if (this.type == 'MLINK')
            txt.className = 'textLarge';
    }
    else if (this.type == 'LOC' || this.type == 'MLOC')
    {
        txt.href = 'https://www.realtimetrains.co.uk/search/detailed/gb-nr:' + this.url + '?stp=WVS&show=all&order=actual';
        if (this.type == 'MLOC')
            txt.className = 'textLarge';
    }
    else if (this.type == 'NAV' || this.type == 'MNAV')
    {
        txt.title = this.description = 'GOTO: ' + this.description;
        txt.dataset.page = this.url;
        txt.dataset.gotoX = this.goToX;
        txt.dataset.gotoXAlign = this.goToXAlign;
        if (window.custom && !this.customNav)
        {
            txt.href = 'https://signalmaps.co.uk/#' + this.url + ':' + this.goToX + this.goToXAlign;
            txt.target = '_blank';
        }
        else
        {
            txt.href = '#' + this.url + ':' + this.goToX + this.goToXAlign;
            txt.onclick = function(e)
            {
                scrollTo = parseInt(e.currentTarget.dataset.gotoX);
                if (e.currentTarget.dataset.gotoXAlign === 'L')
                    scrollTo -= map.parentElement.clientWidth / 2 - 10;
                else if (e.currentTarget.dataset.gotoXAlign === 'R')
                    scrollTo += map.parentElement.clientWidth / 2 + 10;
                loadPage(navIndex[e.currentTarget.dataset.page]);
                e.preventDefault();
                return false;
            };
            txt.target = '_self';
        }
        if (this.type == 'MNAV')
            txt.className = 'textLarge';
    }
    this.domElement = txt;
}

Text.prototype.display = function(disp)
{
    if (disp != (this.domElement.style.display == ''))
        this.domElement.style.display = disp ? '' : 'none';
};
