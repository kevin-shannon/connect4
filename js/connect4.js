/*
 *   Connect 4 by Kevin Shannon and Tanner Krewson
 */

/*
 * Variable declarations
 */


//gamemode (local multiplayer: 0, singleplayer: 1, p2p host: 2, p2p opponent: 3)
var gamemode;
var AIDelay = 1000;
var maxMillisecondsToAnimateChipDropping = 120;
var resetButtonActive = false;

//online multiplayer
var peer;
var connection;
var wantToPlayAgain = false;
var isMultiplayerTurnEventInPlace = false;

//colors and design
var RED = "red";
var BLUE = "blue";

//board dimensions
var bw = 1400;
var bh = bw * (6 / 7);

//canvases
var chips = $('<canvas/>').attr({
	width: bw,
	height: bh + (bh / 6)
}).appendTo('#game');
var chipCanvas = chips.get(0).getContext("2d");
chipCanvas.translate(0, (bw / 7));
var brd = $('<canvas/>').attr({
	width: bw,
	height: bw
}).appendTo('#game');
var boardCanvas = brd.get(0).getContext("2d");

$(window).on('resize', function() {
	makeCanvasAndItsContainerTheSameSize();
});

//logic globals (these are bad practice and will probably have to be replaced)
var pos_array;
var possible = new Array(7);
var avoid = new Array(7);
var moves = 0;
var winner = false;
var redVictories = 0;
var blueVictories = 0;

var lastPlayer1;
var lastPlayer2;

//images
var redchip = new Image(),
	bluechip = new Image(),
	board = new Image(),
	redwins = new Image(),
	bluewins = new Image(),
	draw = new Image(),
	XXX = new Image();
redchip.src = "img/bestchipred.png";
bluechip.src = "img/bestchipblue.png";
board.src = "img/board.png";
redwins.src = "img/redwins.png";
bluewins.src = "img/bluewins.png";
draw.src = "img/draw.png";
XXX.src = "img/X.png";

//event blocker: when false, click and hover events do not work
var playerCanDropChips;


/*
 * Main Code
 */

// load all player modules
// https://stackoverflow.com/questions/11803215/how-to-include-multiple-js-files-using-jquery-getscript-method
$.when(
    $.getScript( "/js/localPlayer.js" ),
    $.getScript( "/js/minimaxPlayer.js" ),
    $.getScript( "/js/remotePlayer.js" ),
    $.Deferred(function( deferred ){
        $( deferred.resolve );
    })
).done(function(){

    // ran after all scripts are loaded

    //Draw the board upon load
    drawBoard();

    //Ran when the site is fully loaded
    $(document).ready(function() {

    	//or else everything will be under the canvas
    	makeCanvasAndItsContainerTheSameSize();

    	//run reset function when button is clicked
    	$('#reset').click(Reset());

    	//makes it so the user cannot drop a chip or hover
    	playerCanDropChips = false;

    	//hide the loading screen
    	$('#loading').hide();

    	//popup the gamemode selector
    	gamemodeSelector();
    });

});


/*
 * Main Game Functions
 * --main
 */

function gamemodeSelector() {
 	//var peerNum = setUpOnline();

 	$('#gamemodeSelector').modal('show');

 	$("#single").click(function() {
 		start(new LocalPlayer(helperMethods), new MinimaxPlayer(helperMethods));
 	});

 	$("#local").click(function() {
 		start(new LocalPlayer(helperMethods), new LocalPlayer(helperMethods));
 	});

 	//$("#gamenum").html("Your game number is " + peerNum);

 	$('#host').popover({
 		html: true,
 		trigger: 'hover',
 		content: function() {
       //start is called within hostOnlineGame
       //hostOnlineGame();
 			return $('#hostpop').html();
 		},
 		placement: 'bottom'
 	});

   function startJoin() {
 		//get the game number from the input box in the popup and send
 		//it to the join online game function
 		var gn = $('#joinin').val();

 		//simulates clicking join online game button to close the popup
 		$('#join').click();

 		joinOnlineGame(gn);
 		start(new LocalPlayer(helperMethods), new RemotePlayer(helperMethods));
 	}

 	function startAI() {
 		//get the delay from the input box in the popup and send
 		//it to the join online game function
 		var aid = $('#aiin').val();

 		start(new MinimaxPlayer(helperMethods, aid), new MinimaxPlayer(helperMethods, aid));
 	}

 	$("#joinbut").click(startJoin);

 	//checks for enter key press on input box
 	$('#joinin').keypress(function(e) {
 		if (e.which == 13) {
 			startJoin();
 			return false;
 		}
 	});

 	$("#aibut").click(startAI);

 	//checks for enter key press on input box
 	$('#aiin').keypress(function(e) {
 		if (e.which == 13) {
 			startAI();
 			return false;
 		}
 	});
}

function start(player1, player2) {

  lastPlayer1 = player1;
  lastPlayer2 = player2;

  $("#resetButton").css("visibility", "visible");
  $('#gamemodeSelector').modal('hide');

	//actual board width and height
	var w = chips.get(0).scrollWidth;
	var h = chips.get(0).scrollHeight;

	//sets postion of indicator tiles
	$("#redturnIn").css('left', ($(window).width() / 10) + 'px');
	$("#blueturnIn").css('left', ($(window).width() / 6) + 'px');
	$("#redturnIn").css('top', ($(window).height() / 6) + 'px');
	$("#blueturnIn").css('top', ($(window).height() / 6) + 'px');
	//sets size of indicator tiles
	$("#redturnIn").css('height', (h / 6) + 'px');
	$("#blueturnIn").css('height', (h / 6) + 'px');
	$("#redturnIn").css('width', (w / 6) + 'px');
	$("#blueturnIn").css('width', (w / 6) + 'px');
	//makes tiles visible once gamplay has commensed
	$("#redturnIn").css('visibility', 'visible');
	$("#blueturnIn").css('visibility', 'visible');
	$("#redVic").css('visibility', 'visible');
	$("#blueVic").css('visibility', 'visible');
	$("#resetButton").css('visibility', 'visible');
	//sets postion of win counter text
	$("#redVic").css('left', ($(window).width() / 10) + (w / 24) + 'px');
	$("#blueVic").css('left', ($(window).width() / 6) + (w / 24) + 'px');
	$("#redVic").css('top', ($(window).height() / 6) + (h / 96) + 'px');
	$("#blueVic").css('top', ($(window).height() / 6) + (h / 96) + 'px');
	//sizes the loading animation
	$("#LoadingAnimation").css('height', (h / 6) + 'px');
	$("#LoadingAnimation").css('width', (w / 7) + 'px');
	//postions play again button
	$("#playpop").css('right', ($(window).width() / 10) + 'px');
	$("#playpop").css('top', ($(window).height() / 5) + 'px');

	//get the pos_array ready for some epic connect4 action
	pos_array = fillArray();

	//activate reset button
	resetButtonActive = true;

	//start turn one
	nextTurn(RED, player1, player2);
	//now we wait for a click event
}

function nextTurn(color, playerToTakeTurnNow, playerToTakeTurnAfter) {
	helperMethods.checkForWin(pos_array, function (colorThatWon, xPos, yPos, direction) {
    //ran when someone has won
    win(colorThatWon, xPos, yPos, direction);
  }, function () {
    //ran in the event of a tie

    setTimeout(function() {
			//manual win event instead of using win function
			console.log("the game is a draw");
			winner = true;
			setTimeout(function() {
				chipCanvas.drawImage(draw, (3 * bw / 10), -(bh / 6), (bw / 2.5), (bh / 6));
			}, 450);
			displayPlay();
  	}, 50);

  });

	//if there's a winner, get outta here
	if (winner || resetButtonActive === false) {
		return;
	}

	advanceTurn();
	console.log("Turn " + moves + ", " + color + "'s turn.");

	if (color === RED) {
		$("#redturnIn").css('WebkitFilter', 'grayscale(0%) opacity(100%) blur(0px)');
		$("#blueturnIn").css('WebkitFilter', 'grayscale(50%) opacity(70%) blur(2px)');
	} else {
		$("#redturnIn").css('WebkitFilter', 'grayscale(50%) opacity(70%) blur(2px)');
		$("#blueturnIn").css('WebkitFilter', 'grayscale(0%) opacity(100%) blur(0px)');
	}

	//give the correct player control based on the gamemode
  playerToTakeTurnNow.takeTurn(pos_array, color, function(columnToDropIn) {
    //ran when the plauer makes their moves

    //the player has decided their move, so let's execute it.
    var chipWasDropped = false;
    while (!chipWasDropped) {
      chipWasDropped = helperMethods.dropChip(
        pos_array,
        columnToDropIn,
        color,
        function (column, j, colorOfChip, noAnimation) {
          //ran when the chip has been dropped into the board array

          console.log(colorOfChip.charAt(0).toUpperCase() + colorOfChip.slice(1) + " dropped in column " + column);
    			drawChip(column, j, colorOfChip, noAnimation);

        }
      );
    }

    //player has successfully made their move,
    //so switch the color and players and keep going.
    nextTurn(getOppositeColor(color), playerToTakeTurnAfter, playerToTakeTurnNow);
  });

}

function drawChip(x, y, chipColor, noAnimation) {
	var chipImage = new Image();

	//Set the correct color chip to draw
	chipImage = chipColor === "red" ? redchip : bluechip;

	x = (bw / 7) * (x - 1);
	y = (bh / 6) * (y - 1);
	var chip = {
		x: x,
		y: 0,
		width: (bw / 7),
		height: (bh / 6)
	};
	var startTime = (new Date()).getTime();

	if (!noAnimation) {
		window.requestAnimFrame = (function(callback) {
			return window.requestAnimationFrame ||
				window.webkitRequestAnimationFrame ||
				window.mozRequestAnimationFrame ||
				window.oRequestAnimationFrame ||
				window.msRequestAnimationFrame ||
				function(callback) {
					window.setTimeout(callback, 1000 / 60);
				};
		})();

		//initial call, and recurs until the chip drops all the way
		animate(chip, chipCanvas, startTime);

		function animate(chip, chipCanvas, startTime) {
			if (resetButtonActive === false) {
				chipCanvas.clearRect(0, -(bh / 6), bw, bh + (bh / 6));
				return;
			}
			// update
			var time = (new Date()).getTime() - startTime;
			var a = bh * 1.7;
			// pixels / second
			var newY = (a * Math.pow(time / 1000, 2) - (bh / 6));
			if (newY < y) {
				chip.y = newY;
				// request new frame
				requestAnimFrame(function() {
					animate(chip, chipCanvas, startTime);
				});
			} else {
				chip.y = y;
				setTimeout(function() {
					chipCanvas.drawImage(chipImage, chip.x, chip.y, chip.width, chip.height);
				}, 50);
			}
			chipCanvas.clearRect(x, (chip.y - (bh / 6)), (bw / 7), ((bh / 6) + (bh / 12)));
			chipCanvas.drawImage(chipImage, chip.x, chip.y, chip.width, chip.height);
		}
	} else {
		chipCanvas.drawImage(chipImage, chip.x, y, chip.width, chip.height);
		setTimeout(function() {
			chipCanvas.drawImage(chipImage, chip.x, y, chip.width, chip.height);
		}, 50);
	}
}

function Reset() {

	//if the button is somehow displayed even though it shouldn't be
	//make sure reset doesn't run?? -Tanner
	if (resetButtonActive === false) {
		return false;
	}

	AIDelay = 1000;

	redVictories = 0;
	blueVictories = 0;
	$("#redVic").text(redVictories);
	$("#blueVic").text(redVictories);

	$("#redturnIn").css('visibility', 'hidden');
	$("#blueturnIn").css('visibility', 'hidden');
	$("#redVic").css('visibility', 'hidden');
	$("#blueVic").css('visibility', 'hidden');
	$("#resetButton").css("visibility", 'hidden');
	//$("#LoadingAnimation").css('visibility', 'hidden');

	resetBoard();
	//closeConnection();
	hidePlayAgainPopup();

	//restart the game
	gamemodeSelector();
}

function showPlayAgainPopup(functionToRunOnClick) {
	$("#playAgainButton").show();
	$("#playAgainButton").click(functionToRunOnClick);
}

function hidePlayAgainPopup() {
	$("#playAgainButton").hide();
}

function resetBoard() {
	console.log("Resetting game");
	pos_array.length = 0;
	pos_array = fillArray();
	winner = false;
	moves = 0;
	playerCanDropChips = false;
	resetButtonActive = false;
	chipCanvas.clearRect(0, -(bh / 6), bw, bh + (bh / 6));
	setTimeout(function() {
		chipCanvas.clearRect(0, -(bh / 6), bw, bh + (bh / 6));
	}, 45);
}

function fillArray() {
	var arrayToFill = new Array(7);
	for (var i = 1; i < 8; i++) {
		arrayToFill[i] = new Array(6);
	}
	return arrayToFill;
}

//i and j are the coord of the first chip in the winning four
function win(color, i, j, direction) {
	winner = true;
	console.log(color + " wins on turn " + moves);
	winAdder(color);
	//this is to make sure that the events are blocked
	playerCanDropChips = false;
	//Draw the win pic based on the color of the chip that won after a delay
	setTimeout(drawWinBanner, 500, pos_array[i][j]);
	//delay
	setTimeout(drawWinXs, 1000, i, j, direction);
	displayPlay();
}

function displayPlay() {
	setTimeout(function() {
		if (resetButtonActive) {
			showPlayAgainPopup(function() {
				resetBoard();
				start(lastPlayer1, lastPlayer2);
				hidePlayAgainPopup();
			});
		}
	}, 1000);
}

function winAdder(color) {
	if (color === "red") {
		redVictories++;
		$("#redVic").text(redVictories);
	} else {
		blueVictories++;
		$("#blueVic").text(blueVictories);
	}
}

function drawWinBanner(color) {

	//choose the correct picture for either red or blue
	var bannerImage = (color === "red") ? redwins : bluewins;

	//draw that sucker
	if (resetButtonActive === true) {
		chipCanvas.drawImage(bannerImage, (bw / 6), -(bh / 6), (bw / 1.5), (bh / 6));
	}
}

function drawWinXs(i, j, direction) {
	//repeat four times because it's connect FOUR
	if (resetButtonActive === false) {
		return;
	}
	for (var n = 1; n < 5; n++) {
		//draw the X
		chipCanvas.drawImage(XXX, (bw / 7) * (i - 1), (bh / 6) * (j - 1), (bw / 7), (bh / 6));
		//change the coordinate position based on which direction the win was
		switch (direction) {
			case "h":
				i++;
				break;
			case "v":
				j++;
				break;
			case "//":
				j--;
				i++;
				break;
			case "\\":
				j++;
				i++;
				break;
		}
	}
}

function drawBoard() {
	boardCanvas.drawImage(board, 0, 0, bw, bh + (bh / 6));
}

function makeCanvasAndItsContainerTheSameSize() {
	var canvasHeight = brd.get(0).scrollHeight;
	$('.canvasContainer').height(canvasHeight);
}

function getOppositeColor(color) {
  return color === RED ? BLUE : RED;
}

//returns who's turn it is now
function advanceTurn() {
	moves++;
}

var helperMethods = {

  //Draws the chip, adds it to the array, returns true if successful
  dropChip: function (boardArray, column, color, onDrop) {
  	//for loop that checks array starting at bottom of board which is at 6 going up to 1
  	for (var j = 6; j > 0; j--) {
  		//the position in the array will be undefined when there is an open space to drop the chip
  		if (boardArray[column][j] === undefined) {
  			onDrop(column, j, color, false);
  			boardArray[column][j] = color;
  			return true;
  		}
  	}
  	//chip wasn't successfully dropped
  	return false;
  },

  copyBoard: function (boardToCopy) {
  	return boardToCopy.map(function(arr) {
  		return arr.slice();
  	});
  },

  checkForWin: function (boardArray, onWin, onTie) {
    //[columns][rows]
  	var victory = false;
  	//horizontal
  	for (var i = 1; i < 5; i++) {
  		for (var j = 1; j < 7; j++) {
  			if (boardArray[i][j] !== undefined && boardArray[i][j] === boardArray[i + 1][j] && boardArray[i][j] === boardArray[i + 2][j] && boardArray[i][j] === boardArray[i + 3][j]) {
          onWin(boardArray[i][j], i, j, "h");
          return;
  			}
  		}
  	}

  	//vertical
  	for (var i = 1; i < 8; i++) {
  		for (var j = 1; j < 4; j++) {
  			if (boardArray[i][j] !== undefined && boardArray[i][j] === boardArray[i][j + 1] && boardArray[i][j] === boardArray[i][j + 2] && boardArray[i][j] === boardArray[i][j + 3]) {
          onWin(boardArray[i][j], i, j, "v");
          return;
  			}
  		}
  	}
  	// /diagonals
  	for (var i = 1; i < 5; i++) {
  		for (var j = 4; j < 7; j++) {
  			if (boardArray[i][j] !== undefined && boardArray[i][j] === boardArray[i + 1][j - 1] && boardArray[i][j] === boardArray[i + 2][j - 2] && boardArray[i][j] === boardArray[i + 3][j - 3]) {
          onWin(boardArray[i][j], i, j, "//");
          return;
  			}
  		}
  	}
  	// \diagonals
  	for (var i = 1; i < 5; i++) {
  		for (var j = 1; j < 4; j++) {
  			if (boardArray[i][j] !== undefined && boardArray[i][j] === boardArray[i + 1][j + 1] && boardArray[i][j] === boardArray[i + 2][j + 2] && boardArray[i][j] === boardArray[i + 3][j + 3]) {
          onWin(boardArray[i][j], i, j, "\\");
          return;
  			}
  		}
  	}

  	//check for a tie
    var boardIsNotFull = false;
    for (var i = 1; i < 8; i++) {
  		for (var j = 1; j < 7; j++) {
        if (boardArray[i][j] === undefined) {
          boardIsNotFull = true;
        }
      }
    }

    if (!boardIsNotFull) {
      onTie();
    }

  },
  allowUIChipDrop: function () {
    playerCanDropChips = true;
  },
  disallowUIChipDrop: function () {
    playerCanDropChips = false;
  }
}
