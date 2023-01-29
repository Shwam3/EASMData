function Signal(jsonObj)
{
    this.htmlID = getNextID();
    this.dataID = jsonObj['i'] || jsonObj['dataID'];
    this.routeIDs = jsonObj['r'] || jsonObj['routes'] || [];
    this.posX = jsonObj['x'] || jsonObj['posX'];
    this.posY = jsonObj['y'] || jsonObj['posY'];
    this.type = jsonObj['t'] || jsonObj['type'];
    this.description = jsonObj['d'] || jsonObj['description'];
    this.flashY = jsonObj['f'] || jsonObj['flashY'] || [];
    this.greenBanner = jsonObj['g'] || jsonObj['green'] || [];

    if (this.type.length == 1)
        this.type = {L:'LEFT',R:'RIGHT',U:'UP',D:'DOWN',N:'NONE',T:'NONE'}[this.type]
    else if (this.type == 'TEST')
        this.type = 'NONE';

    var isAuto   = Boolean(jsonObj['iAu'] || jsonObj['isAuto']   || false);
    var isShunt  = Boolean(jsonObj['iSh'] || jsonObj['isShunt']  || false);
    var isSubs   = Boolean(jsonObj['iSu'] || jsonObj['isSubs']   || false);
    var isRepeat = Boolean(jsonObj['iRe'] || jsonObj['isRepeat'] || false);
    var isBanner = Boolean(jsonObj['iBa'] || jsonObj['isBanner'] || false);
    var isTVM430 = Boolean(jsonObj['iTV'] || jsonObj['isTVM430'] || false);
    var isCBTC   = Boolean(jsonObj['iCB'] || jsonObj['isCBTC']   || false);
    var isETCS   = Boolean(jsonObj['iET'] || jsonObj['isETCS']   || false);
    var isRHS    = Boolean(jsonObj['iRH'] || jsonObj['isRHS']    || false);
    var isSBoard = Boolean(jsonObj['iSB'] || jsonObj['isSBoard'] || false);
    var isDBoard = Boolean(jsonObj['iDB'] || jsonObj['isDBoard'] || false);

    this.mainAspects = [];
    if (isTVM430)
    {
        if (isAuto || true)
        {
            var asp = 'T' + (isShunt ? 'S' : '') + (isRHS ? 'R' : 'L') + '_BLANK';
            this.mainAspects = [asp, asp];
        }
    }
    else if (isCBTC || isETCS)
    {
        if (isAuto || isShunt)
        {
            var asp = 'T' + (isShunt ? 'S' : '') + (isRHS ? 'R' : 'L') + '_BLANK';
            this.mainAspects = [asp, asp];
        }
        else
        {
            var asp = 'T' + (isRHS ? 'R' : 'L') + '_';
            this.mainAspects = [asp + 'BLANK', asp + 'OFF'];
        }
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
        else if (isRepeat)
        {
            this.mainAspects = ['S_YELLOW', 'S_WHITE'];
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
            this.mainAspects = ['B_ON', 'B_OFF', 'B_GRN'];
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
    sig.dataset.id = this.htmlID;
    sig.className = 'signal';

    if (this.type == 'UP' || this.type == 'DOWN')
        sig.className += ' verticalPost';
    if (this.type == 'NONE')
        sig.className += ' noPost';

    if (isTVM430)
        sig.className += ' spriteTVM430';
    else if (isCBTC)
        sig.className += ' spriteCBTC';
    else if (isETCS)
        sig.className += ' spriteETCS';
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

    if (this.mainAspects[0][0] == 'B' && this.mainAspects.length > 2)
    {
        for (var i = 0; i < this.greenBanner.length; i++)
        {
            if (getData(this.greenBanner[i]) == 1)
            {
                this.mainAspect = this.mainAspects[2];
                break;
            }
        }
    }

    var newC = this.css + ' ' + this.type + '_' + this.mainAspect + '_' + (this.routeSet ? 'SET' : 'UNSET') + (flash ? ' SIG_FLASH' : '');
    var newT = displayOpts.IDs ? this.description
        + (this.dataID ? '\naspect: ' + this.dataID : '')
        + (this.routeIDs.length > 0 ? '\nroute: ' + this.routeIDs.join(', ') : '')
        + (this.flashY.length > 0 ? '\nflashY: ' + this.flashY.join(', ') : '')
        + (this.greenBanner.length > 0 ? '\ngreen: ' + this.greenBanner.join(', ') : '') :
        this.description;

    if (this.domElement.className != newC) this.domElement.className = newC;
    if (this.domElement.title != newT) this.domElement.title = newT;
};

Signal.prototype.display = function(disp)
{
    if ((this.domElement.style.display != 'none') != disp)
        this.domElement.style.display = disp ? '' : 'none';
};
