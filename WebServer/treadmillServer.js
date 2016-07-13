
//Server und Module einrichten
var PORT = 3000;
var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server)

//Library zum GPIO-Pins ansteuern
var Gpio = require('onoff').Gpio;


var player;

server.listen(PORT);
//Fernbedienungs Oberfläche + Spiel
app.use(express.static(__dirname + '/public'));

//Wenn ein Client sich verbindet
io.sockets.on('connection', function (socket) {
	
	openPins();	
	
	//Wenn Fernbedienungs-Client den New Game Button drückt
	socket.on("newGame", function(){
		player = initializePlayer(returnLane());
		io.sockets.emit("startGame", {});
	});
	
	//Steuerung
	socket.on("left", moveLeft);
	
	socket.on("right", moveRight);
	
	//Synchronisieren des Scores von Spiel-Client und Fernbedienungs-Client
	socket.on("score", function(data){
		var score = data.value;
		io.sockets.emit("score",{"score":  score});
	});
	
	//Synchronisieren der Lebensanzahl 
	socket.on("life", function(data){
		var lives = data.value;
		io.sockets.emit("life", {"lives": lives});
	});
	
	socket.on('disconnect', function () {
		cleanup();
	});	
});


function initializePlayer(lane){
	var tempPlayer = new Object();
	tempPlayer.lane = lane;
	return tempPlayer;
}


function changedLane(lane){
	player.lane = lane;
	io.sockets.emit("lane", {"value": lane});
}

//Open and set up Pins
function openPins(){
	//Motor1-Pins, 2 Inputs & 1 Enabler
	mo1_in1 = new Gpio(4, 'out');
	mo1_in2 = new Gpio(17, 'out');
	mo1_en = new Gpio(18, 'out');
	
	//Sensor Pins
	leftSens = new Gpio(27, 'in', 'falling');
	midSens = new Gpio(22, 'in', 'falling');
	rightSens = new Gpio(5, 'in', 'falling');
}

//GPIO-Pins 
function cleanup(){

	if(mo1_in1 != null) mo1_in1.unexport();
	if(mo1_in2 != null) mo1_in2.unexport();
	if(mo1_en != null) mo1_en.unexport();
	if(leftSens != null) leftSens.unexport();
	if(midSens != null) midSens.unexport();
	if(rightSens != null) rightSens.unexport();
	
}

//GPIO Pins setzen für die Bewegung nach Rechts
function moveRight() {
	var lane = returnLane();
	switch(lane){
		case 1:
			//"Dreh" nach Rechts
			turnRight();
			//Solange wir nicht auf der Lane rechts von uns sind, fahr weiter
			while(returnLane() != 2){
				drive();
			}
			//Event wird geschickt
			changedLane(2);
			stop();
			break;
		case 2:
			turnRight();
			while(returnLane() != 3){
				drive();
			}			
			changedLane(1);
			stop();
			break;
		case 3:
			console.log("Already far right");
			break;
		//Wenn 
		case 0:
			console.log("Wait until car is in place");
			break;
	}
}
//GPIO-Pins setzen für die Bewegung nach Links
function moveLeft(){
	var lane = returnLane();
	switch(lane) {
		case 1: 
			console.log("Already far left");
			break;
		case 2:
			turnLeft();
			while(returnLane() != 1){
				drive();
			}
			changedLane(3);
			stop();
			break;
		case 3:
			turnLeft();
			while(returnLane() != 2){
				drive();
			}
			changedLane(2);
			stop();
			break;
		case 0:
			console.log("Wait until car is in place");
			break;
	}
}

function turnLeft(){
	mo1_in1.writeSync(1);
	mo1_in2.writeSync(0);
}

function turnRight(){
	mo1_in1.writeSync(0);
	mo1_in2.writeSync(1);
}

function drive(){	
	mo1_en.writeSync(1);
}

function stop(){
	mo1_en.writeSync(0);
	console.log("stopped");
}

//Sensor geben die Position des Autos wieder		
//Lane 1 = Left, 2 = Middle, 3 = Right
function returnLane(){
		
	if(leftSens.readSync() == 0){
		return 1;
	}
	else if(midSens.readSync() == 0){
		return 2;
	}
	else if(rightSens.readSync() == 0){
		return 3;
	}
	else {
		console.log("Not on a lane");
		return 0;
	}
}
