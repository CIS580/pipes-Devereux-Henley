(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

/* Classes */
const Game = require('./game');
const Pipe = require('./pipe');

/* Global variables */
var canvas = document.getElementById('screen');
var game = new Game(canvas, update, render);


var score = 0;
var level = 1;
var time = 10000;
var onLoss = new Audio('assets/loss.wav');
var onLevel = new Audio('assets/level.wav');
var onPlace = new Audio('assets/place.wav');
var fillFlag;
var gameOver;
var startTimer;
var fluidTimer;
var FILLRATE = 1000/4;
var pipeBoard;
var pipeQueue;
var startY;
var startPipe;
var endY;
var endPipe;

init();

function init() {
	pipeBoard = [];
	pipeQueue = [];
	for (var i = 0; i < 14; i++) {
		pipeBoard[i] = [];
	}

	for (var i = 0; i < 10; i++) {
		var newPipe = makeRandomPipe(0, 64 * i);	
		pipeQueue.push(newPipe);	
	}
	startY = Math.floor(Math.random() * 10) * 64;
	startPipe = new Pipe("Straight",128, startY);
	endY = Math.floor(Math.random() * 10) * 64;
	endPipe = new Pipe("Straight", 15 * 64, endY);
	pipeBoard[0][startY / 64] = startPipe;
	pipeBoard[13][endY / 64] = endPipe;

	startTimer = 0;
	fluidTimer = 0;
	fillFlag = true;
	gameOver = false;
}

canvas.onclick = function(event) {
	event.preventDefault();
	var row = Math.floor(event.offsetX / 64) - 2;
	var column = Math.floor(event.offsetY / 64);	
	if(row < 14 && row >= 0 && column >= 0 && column < 10) {
		if(pipeBoard[row][column] == startPipe || pipeBoard[row][column] == endPipe) return;
		if(pipeBoard[row][column] == undefined)	{
			onPlace.play();
			pipeBoard[row][column] = (popAndAdjust(pipeQueue, event.offsetX, event.offsetY));
			score += 10;
		}
		else if(pipeBoard[row][column] != undefined) pipeBoard[row][column].rotateLeft();
	}
};

canvas.oncontextmenu = function(event) {
	event.preventDefault();
	var row = Math.floor(event.offsetX / 64) - 2;
	var column = Math.floor(event.offsetY / 64);
	if(row < 14 && row >= 0 && column >= 0 && column < 10) {
		if(pipeBoard[row][column] == startPipe || pipeBoard[row][column] == endPipe) return;
		if(pipeBoard[row][column] == undefined) {
			onPlace.play();
			pipeBoard[row][column] = (popAndAdjust(pipeQueue, event.offsetX, event.offsetY));
			score += 10;
		}			
		else if(pipeBoard[row][column] != undefined) pipeBoard[row][column].rotateRight();
	}
}

function makeRandomPipe(x, y) {
	var ty = Math.floor(Math.random() * 4);
	var newPipe;
	switch(ty) {
		case 0:
			newPipe = new Pipe("Corner", x, y);
			break;
		case 1:
			newPipe = new Pipe("Straight", x, y);
			break;
		case 2:
			newPipe = new Pipe("Quad", x, y);
			break;
		case 3:
			newPipe = new Pipe("Tri", x, y);
			break;
	}
	return newPipe;
}

function popAndAdjust(queue, eventX, eventY) {
	var pipeToReturn = queue.pop();
	pipeToReturn.x = eventX - (eventX % 64);
	pipeToReturn.y = eventY - (eventY % 64);
	queue.forEach(function (pipe) {
		pipe.y += 64;
	});
	queue.unshift(makeRandomPipe(0,0));
	return pipeToReturn;
}

	/**
	 * @function masterLoop
	 * Advances the game in sync with the refresh rate of the screen
	 * @param {DOMHighResTimeStamp} timestamp the current time
	 */
var masterLoop = function(timestamp) {
	game.loop(timestamp);
	window.requestAnimationFrame(masterLoop);
}
masterLoop(performance.now());


	/**
	 * @function update
	 * Updates the game state, moving
	 * game objects and handling interactions
	 * between them.
	 * @param {DOMHighResTimeStamp} elapsedTime indicates
	 * the number of milliseconds passed since the last frame.
	 */
function update(elapsedTime) {
	fluidTimer += elapsedTime;
	startTimer += elapsedTime;
	if(fluidTimer > FILLRATE) {
		fillFlag = false;
		for(var i = 0; i < 14; i++) {
			pipeBoard[i].forEach(function (pipe, idx) {
				if(pipe.fillState == "full") {
					fluidPropagate(i, idx, elapsedTime);
				}
			});
		}
		fluidTimer = 0;
	}
	if(startTimer > time && startPipe.fillState == "idle") {
		startPipe.fillState = "full";
		startPipe.fillTick = 5;
		fillFlag = true;
	}

	if(endPipe.fillState == "full") {
		onLevel.play();
		level += 1;
		FILLRATE *= 9.0 / 10.0;
		init();
	}

	if(!fillFlag && startTimer > time && !gameOver) {
		onLoss.play();
		gameOver = true;
	}
}

function fluidPropagate(x, y, time) {
	var leftCol = pipeBoard[x-1];
	var thisCol = pipeBoard[x];
	var rightCol = pipeBoard[x+1];
	var cur = thisCol[y];

	if(rightCol != undefined) {
		var right = rightCol[y];
		if(right != undefined && cur.getEndpoint().right && right.getEndpoint().left) managePipeState(right, time);
	}
	if(leftCol != undefined) {
		var left = leftCol[y];
		if(left != undefined && cur.getEndpoint().left && left.getEndpoint().right) managePipeState(left, time);
	}
	var above = thisCol[y-1];
	var below = thisCol[y+1];
	if(above != undefined && cur.getEndpoint().up && above.getEndpoint().down) managePipeState(above, time);
	if(below != undefined && cur.getEndpoint().down && below.getEndpoint().up) managePipeState(below, time);	
}

function managePipeState(pipe, time) {
	if(pipe != undefined) {	
		switch(pipe.fillState) {
			case "idle":
				pipe.fillState = "filling";
				fillFlag = true;
				pipe.update(time);
				break;
			case "filling":
				fillFlag = true;
				pipe.update(time);
				break;
		}
	}
}

	/**
	 * @function render
	 * Renders the current game state into a back buffer.
	 * @param {DOMHighResTimeStamp} elapsedTime indicates
	 * the number of milliseconds passed since the last frame.
	 * @param {CanvasRenderingContext2D} ctx the context to render to
	 */
function render(elapsedTime, ctx) {
	ctx.fillStyle = "#777777";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "black";
	ctx.font = "20px Arial";
	if(gameOver) {
		ctx.fillText("Game over", canvas.width / 3, canvas.height / 3);
	}
	else {
		ctx.fillText("The level is " + level, 10, 700);
		ctx.fillText("The score is " + score, 10, 750);
		for(var i = 0; i < 14; i++) {
			ctx.fillRect(128 + 64 * i, 0, 3, 640);
		}
		for(var i = 0; i < 11; i++) {
			ctx.fillRect(128, 64 * i, canvas.width - 128, 3);
		}
		pipeQueue.forEach(function(pipe) {
			pipe.render(elapsedTime, ctx);
		});
		for(var i = 0; i < 14; i++) {
			var pipeRow = pipeBoard[i];
			pipeRow.forEach(function(pipe) {
				pipe.render(elapsedTime, ctx);
			});
		}
	}	
}

},{"./game":2,"./pipe":3}],2:[function(require,module,exports){
"use strict";

/**
 * @module exports the Game class
 */
module.exports = exports = Game;

/**
 * @constructor Game
 * Creates a new game object
 * @param {canvasDOMElement} screen canvas object to draw into
 * @param {function} updateFunction function to update the game
 * @param {function} renderFunction function to render the game
 */
function Game(screen, updateFunction, renderFunction) {
  this.update = updateFunction;
  this.render = renderFunction;

  // Set up buffers
  this.frontBuffer = screen;
  this.frontCtx = screen.getContext('2d');
  this.backBuffer = document.createElement('canvas');
  this.backBuffer.width = screen.width;
  this.backBuffer.height = screen.height;
  this.backCtx = this.backBuffer.getContext('2d');

  // Start the game loop
  this.oldTime = performance.now();
  this.paused = false;
}

/**
 * @function pause
 * Pause or unpause the game
 * @param {bool} pause true to pause, false to start
 */
Game.prototype.pause = function(flag) {
  this.paused = (flag == true);
}

/**
 * @function loop
 * The main game loop.
 * @param{time} the current time as a DOMHighResTimeStamp
 */
Game.prototype.loop = function(newTime) {
  var game = this;
  var elapsedTime = newTime - this.oldTime;
  this.oldTime = newTime;

  if(!this.paused) this.update(elapsedTime);
  this.render(elapsedTime, this.frontCtx);

  // Flip the back buffer
  this.frontCtx.drawImage(this.backBuffer, 0, 0);
}

},{}],3:[function(require,module,exports){
"use strict";

module.exports = exports = Pipe;

var onTurn = new Audio('assets/rotate.wav');

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
	onTurn.play();
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
	onTurn.play();
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

},{}]},{},[1]);
