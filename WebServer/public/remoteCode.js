function initialize(){
	//Initialisiere socket.io
	var socket = io.connect()
	
	//Buttons
	var right = document.getElementById("rightButton");
	var left = document.getElementById("leftButton");
	var newGame = document.getElementById("newGameButton");
	
	//Score und Lebensanzeige
	var scoreLabel = document.getElementById("scoreLabel");
	var lifeLabel = document.getElementById("lifeLabel");
	
	socket.on("score", updateScore);

	socket.on("life", updateLives);
	

	function updateScore(data){
		var score = data.score;
		scoreLabel.innerHTML = "Score: " + score + " ";
	}
	function updateLives(data){
		var lives = data.lives;
		lifeLabel.innerHTML = "Lives: " + lives;
	}
	
	function stopHandler(){
		socket.emit("stop",{});
	}
	
	function leftHandler(){
		socket.emit("left",{});
	}
	
	function rightHandler() {
		socket.emit("right", {});
	}
	
	function newGameHandler() {
		socket.emit("newGame", {});
	}
	
	left.addEventListener("click", leftHandler);
	right.addEventListener("click", rightHandler);
	newGame.addEventListener("click", newGameHandler);
	
}

