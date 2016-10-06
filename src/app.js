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
		for(var i = 0; i < 14; i++) {
			pipeBoard[i].forEach(function (pipe, idx) {
				if(pipe.fillState == "full") {
					fluidPropagate(i, idx, elapsedTime);
				}
			});
		}
		fluidTimer = 0;
	}
	if(startTimer > time) {
		startPipe.fillState = "full";
		startPipe.fillTick = 5;
	}
	if(endPipe.fillState == "full") {
		onLevel.play();
		level += 1;
		FILLRATE *= 9.0 / 10.0;
		init();
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
	ctx.font = "20px Arial";
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
