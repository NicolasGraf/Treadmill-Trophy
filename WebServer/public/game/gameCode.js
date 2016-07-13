function initialize(){
	
	var socket = io.connect();
	
	//Array fuer Hindernisse
	var carsOnField = [];
	//Bilder der Hindernisse
	var carsImages = [];
	
	//Zuweisung
	var greenCar = new Image();
	greenCar.src = './Images/greenCar.png';
	carsImages[0] = greenCar;
	
	var yellowCar = new Image();
	yellowCar.src = './Images/yellowCar.png';
	carsImages[1] = yellowCar;
	
	var redCar = new Image();
	redCar.src = './Images/redCar.png';
	carsImages[2] = redCar;	
	
	var explosion = new Image();
	explosion.src = './Images/boom.png';
	var exploding = false;	
	
	var score = 0;
	var movespeed = 5;
	
	//Anzeigefläche der Idle und gameOver-Bilder 
	var divWrapper = document.getElementById("wrapper");
	
	var background = new Image();
	background.src = './Images/asphalt.gif';

	//Alles was die Flaeche betrifft, canvas-maße, lane-breite; fuegt ein canvas element ein;
	var gameArea = {
		canvas : document.createElement("canvas"),
		start : function() {
			//Maße
			this.canvas.width = window.innerWidth;
			this.canvas.height = window.innerHeight;
			
			//Hintergrund
			this.context = this.canvas.getContext("2d");
			this.context.drawImage(background, 0, 0);
			
			//Ein Hinderniss alle 5 Sekunden
			this.spawnDelay = 2500;
			
			//Dynamische Lanes bei veraendern der Aufloesung(canvas-mase)
			this.gap = this.canvas.width * 0.0625;
			//Eine Lane nimmt ein Viertel des Canvas ein
			this.laneWidth = this.canvas.width * 0.25;

			document.body.insertBefore(this.canvas,
			document.body.childNodes[0]);
			
			//Alle 20 Millisekunden ein neuer Frame = 50fps
			this.interval = setInterval(updateGameArea, 20);
			
			
		},
		startSpawn : function(){
			this.spawnInterval = setInterval(spawn, this.spawnDelay);
		},
		
		stopSpawn : function(){
			if(this.spawnInterval != null) clearInterval(this.spawnInterval);
		},
		
		clear : function(){
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);			
		},
		stop : function(){
			clearInterval(this.interval);
			showGameOver();
		}
			
	}
	
	//Neuer Frame
	function updateGameArea(){
		//Lösch alles
		gameArea.clear();
		//Hintergrund neu malen
		gameArea.context.drawImage(background, 0, 0);
		//Hindernisse bewegen
		moveAllCars();
		//Falls Hindernisse das Ende erreichen oder den Spieler berühren
		checkForCollision();
		checkForEnd();
		
		//Nur weitermachen falls der Spieler noch Leben übrig hat
		if(player.lives <= 0){
			gameArea.stop();
			gameArea.stopSpawn();
		}
		//Explosion neu malen		
		if(exploding) gameArea.context.drawImage(explosion, 0, 0);
	
	}
	
	function moveAllCars(){
		if(carsOnField != null){
			for(var i = 0; i < carsOnField.length; i++){
				carsOnField[i].move();
				carsOnField[i].update();
			}	
		}		
	}
	
	function checkForCollision(){
		for(var i = 0; i < carsOnField.length; i++){
			//Eine Kollision entsteht wenn das untere Ende des Hinderniss die (ungefähre) Position vom dem (physichen) Auto erreicht(~800 Pixel vom unteren Rand)
			//Und wenn der Spieler auf der gleichen Fahrbahn ist
			if(carsOnField[i].y + carsOnField[i].height >= gameArea.canvas.height - 200 && carsOnField[i].lane == player.lane){
				player.lives--;
				//Lebensanzahl synchronisieren
				socket.emit("life", {"value": player.lives});
				//Auto entfernen und Explosion anzeigen
				carsOnField.splice(i, 1);
				exploding = true;
				setTimeout(function(){ exploding = false; }, 300);				
			}
		}
	}
	
	function checkForEnd(){
		for(var i = 0; i < carsOnField.length; i++){
			if(carsOnField[i].y + carsOnField[i].height >= gameArea.canvas.height){
				carsOnField.splice(i, 1);
				//Erfolgreich ausgewichen
				scoreUp();
			}
		}
	}
	
	function scoreUp(){
		score += 200;
		socket.emit("score", {"value": score});
	}
	
	//Konstruktor für ein Car-Objekt(Hinderniss)
	function Car(lane, color){
		this.lane = lane;
		this.color = color;
		
		this.x = getLaneCoordinates(lane);
		this.y = 0;
		
		this.width = 350;
		this.height = 600;
		
		this.move = function(){
			this.y += movespeed;
		}
		this.update = function(){
			ctx = gameArea.context;
			ctx.drawImage(carsImages[color], this.x, this.y, this.width, this.height);
		}		
	}
	
	//X-Position wird nach einem bestimmten Layout bestimmt(Lücke -- Fahrbahn -- Lücke -- Fahrbahn -- Lücke -- Fahrbahn -- Lücke)
	function getLaneCoordinates(lane){
		switch(lane){
			case 1:
				return gameArea.gap;
				break;
			case 2:
				return gameArea.gap * 2 + gameArea.laneWidth;
				break;
			case 3:
				return gameArea.gap * 3 + gameArea.laneWidth * 2;
				break;	
		}
	}
	
	//Spieler Objekt zum Speichern der Position
	var player = {
		init : function(lane){
			this.lane = lane;
			this.lives = 3;
		}
	}
	
	//Aktualisier die Spielerposition
	socket.on("lane", function(data){
		console.log(data.value);
		player.lane = data.value;
	});
	
	
	//Neues Hinderniss
	function spawn(){
			var randLane = Math.floor(Math.random() * 3 + 1);
			var randColor = Math.floor(Math.random() * 3);
			carsOnField.push(new Car(randLane, randColor));
	}
	
	//Starte ein neues Spiel
	function startGame(){
		hideIdle();
		score = 0;
		clearInterval(gameArea.interval);
		gameArea.start();
		gameArea.startSpawn();
		//Wird an dieser Stelle mit 2 (der mittleren Position) initialisiert, wird aber sofort aktulisiert auf Nachricht vom Server
		player.init(2);	
		socket.emit("score", {"value" : score});
		socket.emit("life", {"value" : player.lives});	
	}
	socket.on("startGame", startGame);
	
	
	//Anzeige des Idle und Game-Over Screen
	function showIdle(){
		var idleImage = document.createElement("img");
		idleImage.src = './Images/treadStart.gif';
		divWrapper.appendChild(idleImage);
	}
	function hideIdle(){
		if(divWrapper.hasChildNodes())
			 divWrapper.removeChild(divWrapper.firstChild);
	}
	function showGameOver(){
		document.body.removeChild(document.body.childNodes[0]);
		var overImage = document.createElement("img");
		overImage.src = './Images/gameOver.gif';
		divWrapper.appendChild(overImage);
	}	
	
	showIdle();
	
}
