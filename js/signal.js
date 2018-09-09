function Signal(jsonObj)
{
    this.htmlID = getNextID();
    this.dataID = jsonObj['dataID'];
    this.routeIDs = jsonObj['routes'] || [];
    this.posX = jsonObj['posX'];
    this.posY = jsonObj['posY'];
    this.type = jsonObj['type'];
    this.description = jsonObj['description'];
    this.flashY = jsonObj['flashY'] || [];

    if (this.type == 'TEST')
        this.type = 'NONE';

    var isAuto    = jsonObj['isAuto']    || false;
    var isShunt   = jsonObj['isShunt']   || false;
    var isSubs    = jsonObj['isSubs']    || false;
    var isRepeat  = jsonObj['isRepeat']  || false;
    var isBanner  = jsonObj['isBanner']  || false;
    var isTVM430  = jsonObj['isTVM430']  || false;
    var isRHS     = jsonObj['isRHS']     || false;
    var isSBoard  = jsonObj['isSBoard']  || false;
    var isDBoard  = jsonObj['isDBoard']  || false;

    this.mainAspects = [];
    if (isTVM430)
    {
        var asp = 'T' + (isShunt ? 'S' : '') + (isRHS ? 'R' : 'L') + '_BLANK';
        this.mainAspects = [asp, asp];
    }
    else if (isSubs)
    {
        if (isAuto)
        {
            this.mainAspects = ['S_AUTO', 'S_AUTO'];
        }
        else
        {
            this.mainAspects = ['S_BLANK', 'S_WHITE'];
        }
    }
    else if (isShunt)
    {
        if (isAuto)
        {
            this.mainAspects = ['S_AUTO', 'S_AUTO'];
        }
        else
        {
            this.mainAspects = ['S_RED', 'S_WHITE'];
        }
    }
    else if (isBanner)
    {
        if (isAuto)
        {
            this.mainAspects = ['B_BLANK', 'B_BLANK'];
        }
        else
        {
            this.mainAspects = ['B_ON', 'B_OFF'];
        }
    }
    else if (isAuto)
        this.mainAspects = ['M_AUTO', 'M_AUTO'];
    else if (isRepeat)
        this.mainAspects = ['M_YELLOW', 'M_GREEN'];
    else if (isSBoard)
        this.mainAspects = ['STOP', 'STOP'];
    else if (isDBoard)
        this.mainAspects = ['DIST', 'DIST'];
    else
    {
        this.mainAspects = ['M_RED', 'M_GREEN'];
        this.routeIDs = this.routeIDs.concat(this.dataID);
    }

    this.routeSet = false;
    this.mainAspect = this.mainAspects[0];

    var sig = document.createElement('span');
    document.getElementById('map').appendChild(sig);
    sig.title = this.description;
    sig.id = this.htmlID;
    sig.className = 'signal';
    
    if (this.type == 'UP' || this.type == 'DOWN')
        sig.className += ' verticalPost';
    if (this.type == 'NONE')
        sig.className += ' noPost';
    if (isTVM430)
        sig.className += ' spriteTVM430';
    else if (isSBoard || isDBoard)
        sig.className += ' spriteBoard';
    else if (isShunt || isSubs)
        sig.className += ' spriteShunt';
    else if (isBanner)
        sig.className += ' spriteBanner';
    else
        sig.className += ' spriteMain';
    this.css = sig.className;
    sig.className += ' ' + this.type + '_' + this.mainAspect + '_UNSET';
    
    sig.style.left = this.posX + (this.type == 'LEFT' ? -10 : -4) + 'px';
    sig.style.top  = this.posY + (this.type == 'UP'   ? -10 : -4) + 'px';
    this.domElement = sig;

    addObj(this.htmlID, this);
}

Signal.prototype.update = function()
{
    if (this.dataID)
        this.mainAspect = this.mainAspects[getData(this.dataID) || 0];

    this.routeSet = false;
    for (var i = 0; i < this.routeIDs.length; i++)
    {
        if (getData(this.routeIDs[i]) == 1)
        {
            this.routeSet = true;
            break;
        }
    }
    
    var flash = false;
    for (var i = 0; i < this.flashY.length; i++)
    {
        if (getData(this.flashY[i]) == 1)
        {
            flash = true;
            break;
        }
    }

    var newC = this.css + ' ' + this.type + '_' + this.mainAspect + '_' + (this.routeSet ? 'SET' : 'UNSET') + (flash ? ' SIG_FLASH' : '');
    var newT = displayOpts.IDs ? this.description
        + (this.dataID ? '\naspect: ' + this.dataID : '')
        + (this.routeIDs.length > 0 ? '\nroute: ' + this.routeIDs.join(', ') : '')
        + (this.flashY.length > 0 ? '\nflashY: ' + this.flashY.join(', ') : '') :
        this.description;

    if (this.domElement.className != newC) this.domElement.className = newC;
    if (this.domElement.title != newT) this.domElement.title = newT;
};

Signal.prototype.display = function(disp)
{
    if ((this.domElement.style.display != 'none') != disp)
        this.domElement.style.display = disp ? '' : 'none';
};
