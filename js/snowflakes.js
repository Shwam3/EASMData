var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

var transformProperty = 'transform';

var snowflakes = [];

var browserWidth;
var browserHeight;

var resetPosition = false;

var snowflakesActive = false;

setInterval(function(){ browserWidth = document.documentElement.clientWidth; browserHeight = document.documentElement.clientHeight; }, 1000);

function Snowflake(element, xPos, yPos)
{
    this.element = element;
    
    this.reset()
    this.yPos = -50 - Math.random()* browserHeight/2;
}

Snowflake.prototype.update = function update()
{
	this.counter += this.speed / 5000;
	this.xPos += this.sign * this.speed * Math.cos(this.counter) / 40;
	this.yPos += Math.sin(this.counter) / 40 + this.speed / 30;
	
    this.element.style.transform = 'translate3d(' + Math.round(this.xPos*100)/100 + 'px, ' + Math.round(this.yPos*100)/100 + 'px' + ', 0)';
    
	if (this.yPos > browserHeight)
		this.reset();
}

Snowflake.prototype.reset = function reset()
{
    this.speed = 10 + Math.random()*20;
    this.yPos = -50 - Math.random()*250;
    this.xPos = getPosition(50, browserWidth);
	
    this.counter = 0;
    this.sign = Math.random() < 0.5 ? 1 : -1;
	
    this.element.style.opacity = 0.2 + Math.random()*0.7;
    this.element.style.fontSize = 12 + Math.random() * 50 + 'px';
}

function generateSnowflakes()
{
    snowflakesActive = true;
    
	var originalSnowflake = document.querySelector('.snowflake');
	
	var snowflakeContainer = originalSnowflake.parentNode;
    
	browserWidth = document.documentElement.clientWidth;
	browserHeight = document.documentElement.clientHeight;
    
    var numberOfSnowflakes = Math.ceil(browserWidth * browserHeight / 185000);

	for (var i = 0; i < numberOfSnowflakes; i++)
    {
		var snowflakeClone = originalSnowflake.cloneNode(true);
		snowflakeContainer.appendChild(snowflakeClone);
		    
		snowflakes.push(new Snowflake(snowflakeClone));
	}
    
	snowflakeContainer.removeChild(originalSnowflake);
	
    moveSnowflakes();
}

function removeSnowflakes()
{
    snowflakesActive = false;
    
    var container = document.getElementById('snowflakeContainer');
    container.innerHTML = '<p class="snowflake">*</p>';
}

function moveSnowflakes()
{
	for (var i = 0; i < snowflakes.length; i++)
	    snowflakes[i].update();
    
	if (resetPosition)
    {
		browserWidth = document.documentElement.clientWidth;
		browserHeight = document.documentElement.clientHeight;
		
		for (var i = 0; i < snowflakes.length; i++)
        {
			var snowflake = snowflakes[i];
			
			snowflake.xPos = getPosition(50, browserWidth);
		}
		
		resetPosition = false;
	}
    
    if (snowflakesActive)
        requestAnimationFrame(moveSnowflakes);
}

function getPosition(offset, size)
{
	return Math.round(-1*offset + Math.random() * (size+2*offset));
}

function setResetFlag(e)
{
	resetPosition = true;
}