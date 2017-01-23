function Signal(jsonObj)
{
    this.htmlID = getNextID();
    this.dataID = jsonObj['dataID'];
    this.routeIDs = jsonObj['routes'] || [];
    this.posX = jsonObj['posX'];
    this.posY = jsonObj['posY'];
    this.type = jsonObj['type'];
    this.description = jsonObj['description'];
    
    if (this.type == 'TEST')
        this.type = 'NONE';
    
    var isAuto    = jsonObj['isAuto']    || false;
    var isShunt   = jsonObj['isShunt']   || false;
    var isSubs    = jsonObj['isSubs']    || false;
    var isRepeat1 = jsonObj['isRepeat1'] || jsonObj['isRepeat'] || false;
    var isRepeat2 = jsonObj['isRepeat2'] || false;
    var isBanner  = jsonObj['isBanner']  || false;
    
    this.mainAspects = [];
    this.mainAspects[2] = 'BLANK';
    
    //M_RED, M_YELLOW, M_DYELLOW, M_GREEN, S_RED, S_WHITE, S_BLANK, B_ON, B_OFF (Main/Shunt/Banner)
    if (isSubs)
    {
        if (isAuto)
        {
            this.mainAspects[0] = 'S_AUTO';
            this.mainAspects[1] = 'S_AUTO';
        }
        else
        {
            this.mainAspects[0] = 'S_BLANK';
            this.mainAspects[1] = 'S_WHITE';
        }
    }
    else if (isShunt)
    {
        if (isAuto)
        {
            this.mainAspects[0] = 'S_AUTO';
            this.mainAspects[1] = 'S_AUTO';
        }
        else
        {
            this.mainAspects[0] = 'S_RED';
            this.mainAspects[1] = 'S_WHITE';
        }
    }
    else if (isRepeat1)
    {
        this.mainAspects[0] = 'M_YELLOW';
        this.mainAspects[1] = 'M_GREEN';
    }
    else if (isRepeat2)
    {
        this.mainAspects[0] = 'M_DYELLOW';
        this.mainAspects[1] = 'M_GREEN';
    }
    else if (isBanner)
    {
        if (isAuto)
        {
            this.mainAspects[0] = 'B_BLANK';
            this.mainAspects[1] = 'B_BLANK';
        }
        else
        {
            this.mainAspects[0] = 'B_ON';
            this.mainAspects[1] = 'B_OFF';
        }
    }
    else if (isAuto)
    {
        this.mainAspects[0] = 'M_AUTO';
        this.mainAspects[1] = 'M_AUTO';
    }
    else
    {
        this.mainAspects[0] = 'M_RED';
        this.mainAspects[1] = 'M_GREEN';
        this.routeIDs.push(this.dataID);
    }
    
    this.routeSet = false;
    this.mainAspect = this.mainAspects[0];
    
    var sig = document.createElement('img');
    document.getElementById('map').appendChild(sig);
    sig.title = this.description;
    sig.id = this.htmlID;
    sig.src = '/webclient/images/signals/' + this.type + '_' + this.mainAspect + '_' + (this.routeSet ? 'SET' : 'UNSET') + '.png';
    sig.className = 'signal';
    if (this.type.match(/(UP|DOWN)/)) sig.className += ' verticalPost';
    if (this.type == 'NONE') sig.className += ' noPost';
    sig.style.left = this.posX + (this.type == 'LEFT' ? -10 : -4) + 'px';
    sig.style.top  = this.posY + (this.type == 'UP'   ? -10 : -4) + 'px';
    this.domElement = sig;
    
    addObj(this.htmlID, this);
}

Signal.prototype.update = function()
{
    setData(this.dataID, getData(this.dataID) || 0);
    this.mainAspect = this.mainAspects[getData(this.dataID)];
    
    this.routeSet = false;
    for (var i = 0; i < this.routeIDs.length; i++)
    {
        if (getData(this.routeIDs[i]) == '1')
        {
            this.routeSet = true;
            break;
        }
    }
    
    this.domElement.src = '/webclient/images/signals/' + this.type + '_' + this.mainAspect + '_' + (this.routeSet ? 'SET' : 'UNSET') + '.png';
};

Signal.prototype.display = function(disp)
{
    if ((this.domElement.style.display != 'none') != disp)
        this.domElement.style.display = disp ? '' : 'none';
};