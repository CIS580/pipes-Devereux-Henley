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
var oldTime = 0;
var FILLRATE = 1000/8;


var pipeBoard = [];
for (var i = 0; i < 14; i++) {
	pipeBoard[i] = [];
}

var pipeQueue = [];
for (var i = 0; i < 10; i++) {
	var newPipe = makeRandomPipe(0, 64 * i);	
	pipeQueue.push(newPipe);	
}

var startY = Math.floor(Math.random() * 10) * 64;
var startPipe = new Pipe("Straight",128, startY);
var endY = Math.floor(Math.random() * 10) * 64;
var endPipe = new Pipe("Straight", 15 * 64, endY);
pipeBoard[0][startY / 64] = startPipe;
pipeBoard[13][endY / 64] = endPipe;

canvas.onclick = function(event) {
	event.preventDefault();
	var row = Math.floor(event.offsetX / 64) - 2;
	var column = Math.floor(event.offsetY / 64);	
	if(row < 14 && row >= 0 && column >= 0 && column < 10) {
		if(pipeBoard[row][column] == startPipe || pipeBoard[row][column] == endPipe) return;
		if(pipeBoard[row][column] == undefined)	pipeBoard[row][column] = (popAndAdjust(pipeQueue, event.offsetX, event.offsetY));
		else if(pipeBoard[row][column] != undefined) pipeBoard[row][column].rotateLeft();
	}
};

canvas.oncontextmenu = function(event) {
	event.preventDefault();
	var row = Math.floor(event.offsetX / 64) - 2;
	var column = Math.floor(event.offsetY / 64);
	if(row < 14 && row >= 0 && column >= 0 && column < 10) {
		if(pipeBoard[row][column] == startPipe || pipeBoard[row][column] == endPipe) return;
		if(pipeBoard[row][column] == undefined)	pipeBoard[row][column] = (popAndAdjust(pipeQueue, event.offsetX, event.offsetY));
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
	oldTime += elapsedTime;
	if(oldTime > FILLRATE) {
		for(var i = 0; i < 14; i++) {
			pipeBoard[i].forEach(function (pipe, idx) {
				if(pipe.fillState == "full") {
					fluidPropagate(i, idx, elapsedTime);
				}
			});
		}
	}
	// TODO: Advance the fluid
}

function fluidPropagate(x, y, time) {
	var above = pipeBoard[x][y - 1];
	var left = pipeBoard[x - 1][y];
	var right = pipeBoard[x + 1][y];
	var below = pipeBoard[x][y + 1];
	managePipeState(above, time);
	managePipeState(left, time);
	managePipeState(right, time);
	managePipeState(below, time);	
}

function managePipeState(pipe, time) {
	if(pipe != undefined) {
		switch(pipe.fillState) {
			case "idle":
				pipe.fillState = "filling";
				pipe.update(time);
				break;
			case "filling":
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
