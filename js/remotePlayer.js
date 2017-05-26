var RemotePlayer = function(helperMethods, data) {

	//online multiplayer
	var peer;
	var connection;
	var wantToPlayAgain = false;
	var isMultiplayerTurnEventInPlace = false;

	function askToPlayAgain() {
		wantToPlayAgain = true;
		console.log("sending 0 from ask");
		sendMove(0);
	}

	function receivePlayAgainRequest() {
		//if wantToPlayAgain is true, then this means both players want to play
		//      again and we can start the new game.
		//else we will ask the player if they want to play again, and if they do,
		//      we will play.
		if (wantToPlayAgain) {
			playAgain();
		} else {
			//TODO: ask the player to respond to the request from their oppenent to
			//      player again.
			//if they say yes:
			console.log("sending 0 from receive");
			sendMove(0);
			playAgain();
		}
	}

	function setUpOnline() {
		var peerNum = Math.floor(Math.random() * 900) + 100;
		console.log("Peer id: " + peerNum);
		peer = new Peer(peerNum, {
			key: 'fe7e2757-bbef-4456-a934-ae93385502b9'
		});
		return peerNum;
	}

	function hostOnlineGame() {
		//start new game
		//alert("Your game number is " + peerNum);
		if ($('#popup').css('visibility') === "hidden") {
			$("#LoadingAnimation").css('visibility', 'visible');
		}
		peer.on('connection', function(conn) {
			connection = conn;
			openConnection();
			start(2);
		});
	}

	function joinOnlineGame(gameNum) {
		setUpOnline();

		//join game
		//var gameNum = window.prompt("Enter an game number to join");
		$("#LoadingAnimation").css('visibility', 'visible');
		connection = peer.connect(gameNum);
		peer.on('error', function(err) {
			if (err.type === 'peer-unavailable') {
				Reset();
				alert('Game does not exist.');
			}
		});
		openConnection();
	}

	function multiplayerTurn() {
		//prevent duplicates
		if (!isMultiplayerTurnEventInPlace) {
			connection.on('data', function(data) {
				console.log("Received " + data + " from peer");
				//0 is sent when a player wants to play again and the game has been won
				if (data === 0 && winner) {
					receivePlayAgainRequest();
				} else if (currentTurn() === opponentsColor) {
					dropChip(data, currentTurn(), pos_array, false);
					nextTurn();
				}
			});
			isMultiplayerTurnEventInPlace = true;
		}
	}

	function sendMove(data) {
		console.log("Sent " + data + " to peer");
		connection.send(data);
	}

	function openConnection() {
		connection.on('open', function() {
			console.log("Connection open");
			$("#LoadingAnimation").css('visibility', 'hidden');
			playerCanDropChips = currentTurn() === playersColor;
			$('#host').click();
		});

		connection.on('close', function() {
			//make sure that the person who clicked the reset button doesn't
			//  get this message
			if (resetButtonActive) {
				console.log('Connection lost');
				popupConnectionLost();

				Reset();
			}
		});
	}

	function closeConnection() {
		if (gamemode === 2 || gamemode === 3) {
			try {
				peer.destroy();
				connection.close();
				isMultiplayerTurnEventInPlace = false;
			} catch (err) {
				console.log("error closing connection");
			}
		}
	}

	function popupConnectionLost() {
		alert('Your opponent ended the match.');
	}

	return {
		takeTurn: function(currentBoard, yourColor, makeMove) {
			setTimeout(function() {
				var column = Math.floor((Math.random() * 7) + 1);
				makeMove(column);
			}, 500);
		}
	};

};
