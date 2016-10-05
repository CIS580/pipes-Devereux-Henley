"use strict";

module.exports = exports = Pipe;

function PipeRenderInfo(x, y) { 
	this.x = x;
	this.y = y; 
}

function Endpoint(up,down,left,right) {
	this.up = up;
	this.down = down;
	this.left = left;
	this.right = right;
}

function Pipe(pipetype, x, y) {
	this.stateIndex = 0;
	this.x = x;
	this.y = y;
	this.spritesheet = new Image();
	this.spritesheet.src = 'assets/pipes.png';
	this.height = 32;
	this.width = 32;
	this.fillState = "idle";
	this.fillTick = 0;
	switch(pipetype) {
		case "Corner":
			this.states = [
				new PipeRenderInfo(31.5, 31.5),
				new PipeRenderInfo(63, 31.5),
				new PipeRenderInfo(63, 63),
				new PipeRenderInfo(31.5, 63)
			];
			this.endpoints = [
				new Endpoint(false,true,false,true),
				new Endpoint(false,true,true,false),
				new Endpoint(true,false,true,false),
				new Endpoint(true,false,false,true)
			];
			break;
		case "Straight":
			this.states = [
				new PipeRenderInfo(94.5, 31.5),
				new PipeRenderInfo(94.5, 63)
			];
			this.endpoints = [
				new Endpoint(false,false,true,true),
				new Endpoint(true,true,false,false)
			];
			break;
		case "Quad":
			this.states = [
				new PipeRenderInfo(0,0)
			];
			this.endpoints = [
				new Endpoint(true,true,true,true)
			];
			break;
		case "Tri":
			this.states = [
				new PipeRenderInfo(31.5, 94.5),
				new PipeRenderInfo(63, 94.5),
				new PipeRenderInfo(63, 126),
				new PipeRenderInfo(31.5, 126)
			];
			this.endpoints = [
				new Endpoint(false,true,true,true),
				new Endpoint(true,true,true,false),
				new Endpoint(true,false,true,true),
				new Endpoint(true,true,false,true)
			];
			break;
	}
}

Pipe.prototype.rotateRight = function() {
	if(this.fillState == "idle") {
		if(this.stateIndex == this.states.length - 1) {
			this.stateIndex = 0;
		}
		else{
			this.stateIndex++;
		}
	}
}

Pipe.prototype.rotateLeft = function() {
	if(this.fillState == "idle") {
		if(this.stateIndex == 0) {
			this.stateIndex = this.states.length - 1;
		}
		else {
			this.stateIndex--;
		}
	}
}

Pipe.prototype.getEndpoint = function() {
	return this.endpoints[this.stateIndex];
}

Pipe.prototype.update = function(elapsedTime) {
	if(this.fillState == "filling") {
		this.fillTick += 1;
		if(this.fillTick == 5) {
			this.fillState = "full";
		}
	}
}

Pipe.prototype.render = function(elapsedTime, ctx) {
	var rpipe = this.states[this.stateIndex];
	var fillSize = this.fillTick * this.width * 2 / 5;
	ctx.fillStyle = "blue";
	ctx.fillRect(this.x, this.y, fillSize, fillSize);
	ctx.drawImage(
		this.spritesheet,
		rpipe.x, rpipe.y, this.width, this.height,
		this.x, this.y, this.width*2, this.height*2
	)
}
