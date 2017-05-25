/*
*   Connect 4 by Kevin Shannon and Tanner Krewson
*/

/*
* Variable declarations
*/

//get the url parameters
var urlParams;
(window.onpopstate = function () {
  var match,
  pl     = /\+/g,  // Regex for replacing addition symbol with a space
  search = /([^&=]+)=?([^&]*)/g,
  decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
  query  = window.location.search.substring(1);

  urlParams = {};
  while (match = search.exec(query))
  urlParams[decode(match[1])] = decode(match[2]);
})();

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
var startingColor = ["red", "blue"][Math.floor(Math.random() * 2)];
var playersColor;
var opponentsColor;
var blur = 4;

//board dimensions
var bw = Math.round(($(window).width()*$(window).height())/($(window).width()+$(window).height()))*2;
var bh = bw * (6/7);

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

$(window).on('resize', function(){
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

//images
var redchip = new Image(), bluechip = new Image(), board = new Image(), redwins = new Image(), bluewins = new Image(), draw = new Image(), XXX = new Image();
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

//Draw the board upon load
$(window).on("load", drawBoard);

//Ran when the site is fully loaded
$(document).ready(function () {

  //or else everything will be under the canvas
  makeCanvasAndItsContainerTheSameSize();

  //Ran when user clicks on the canvas
  $('canvas').click(canvasClick);

  //called when the mouse moves across the canvas
  $('canvas').mousemove(hoverChip);

  //run reset function when button is clicked
  $('#reset').click(Reset());

  //makes it so the user cannot drop a chip or hover
  playerCanDropChips = false;

  //check if a match id has been passed
  if (urlParams.host && urlParams.host.length === 40) {
    setUpOnline(urlParams.host);
    hostOnlineGame();
  } else if (urlParams.join && urlParams.join.length === 40) {
    joinOnlineGame(urlParams.join);
    goToStart(3);
  } else {

    //hide the loading screen
    $('#loading').hide();

    //popup the gamemode selector
    gamemodeSelector();
  }
});


/*
* Functions
*/

function start(gm) {
  //received gamemode from the selector
  gamemode = gm;

  //actual board width and height
  var w = chips.get(0).scrollWidth;
  var h = chips.get(0).scrollHeight;

  //sets postion of indicator tiles
  $("#redturnIn").css('left', ($(window).width()/10) + 'px');
  $("#blueturnIn").css('left', ($(window).width()/6) + 'px');
  $("#redturnIn").css('top', ($(window).height()/6) + 'px');
  $("#blueturnIn").css('top', ($(window).height()/6) + 'px');
  //sets size of indicator tiles
  $("#redturnIn").css('height', (h/6) + 'px');
  $("#blueturnIn").css('height', (h/6) + 'px');
  $("#redturnIn").css('width', (w/6) + 'px');
  $("#blueturnIn").css('width', (w/6) + 'px');
  //makes tiles visible once gamplay has commensed
  $("#redturnIn").css('visibility', 'visible');
  $("#blueturnIn").css('visibility', 'visible');
  $("#redVic").css('visibility', 'visible');
  $("#blueVic").css('visibility', 'visible');
  $("#resetButton").css('visibility', 'visible');
  //sets postion of win counter text
  $("#redVic").css('left', ($(window).width()/10) + (w/24) + 'px');
  $("#blueVic").css('left', ($(window).width()/6) + (w/24) + 'px');
  $("#redVic").css('top', ($(window).height()/6) + (h/96)  + 'px');
  $("#blueVic").css('top', ($(window).height()/6) + (h/96) + 'px');
  //sizes the loading animation
  $("#LoadingAnimation").css('height', (h/6) + 'px');
  $("#LoadingAnimation").css('width', (w/7) + 'px');
  //postions play again button
  $("#playpop").css('right', ($(window).width()/10) + 'px');
  $("#playpop").css('top', ($(window).height()/5) + 'px');
  //figure out which gamemode the user wants to play
  console.log("Gamemode " + gamemode + " selected.");

  /*
  //if the gamemode is online multiplayer, let's set that up
  if (gamemode === 2 || gamemode === 3) {
  setUpOnlineMultiplayer();
}*/

//assign colors to players
assignColors();
if (gm !== 2 && gm !== 3){
  startingColor = ["red", "blue"][Math.floor(Math.random() * 2)];
}
//get the pos_array ready for some epic connect4 action
pos_array = fillArray();

//activate reset button
resetButtonActive = true;

//start turn one
nextTurn();
//now we wait for a click event
}

function canvasClick(e) {
  if (playerCanDropChips === false) {
    return false;
  }

  //if this is online multiplayer, make sure the connection is open
  if ((gamemode === 2 || gamemode === 3) && !connection.open) {
    return false;
  }

  //actual board width and height
  //bw bh are the "initial" size of the canvas or
  //whatever idk
  var w = chips.get(0).scrollWidth;
  var h = chips.get(0).scrollHeight;

  //determine where the chip was dropped
  var offset = $(this).offset();
  var xPos = (e.pageX - offset.left);
  for (var i = 1; i < 8; i++) {
    if (((i - 1) * (w / 7)) < xPos && xPos < ((i) * (w / 7))) {
      //if the chip drop was successful
      if (dropChip(i, currentTurn(), pos_array, false)) {
        if (gamemode === 2 || gamemode === 3) {
          sendMove(i);
        }
        nextTurn();
      }
    }
  }
}

function nextTurn() {
  winCondition(pos_array, false);
  //if there's a winner, get outta here
  if (winner || resetButtonActive === false) {
    return;
  }

  advanceTurn();
  console.log("Turn " + moves + ", " + currentTurn() + "'s turn.");

  if (currentTurn() === "red") {
    $("#redturnIn").css('WebkitFilter', 'grayscale(0%) opacity(100%) blur(0px)');
    $("#blueturnIn").css('WebkitFilter', 'grayscale(50%) opacity(70%) blur(2px)');
  }
  else {
    $("#redturnIn").css('WebkitFilter', 'grayscale(50%) opacity(70%) blur(2px)');
    $("#blueturnIn").css('WebkitFilter', 'grayscale(0%) opacity(100%) blur(0px)');
  }

  //give the correct player control based on the gamemode
  switch (gamemode) {
    case 0: //local multiplayer
    playerCanDropChips = true;
    break;
    case 1: //singleplayer
    if (currentTurn() === playersColor) {
      playerCanDropChips = true;
    } else {
      playerCanDropChips = false;

      //remember, randomAI is non-blocking because it is in a timeout
      winningMoveAI();
    }
    break;
    case 2: //p2p host
    if (currentTurn() === playersColor) {
      //for first turn, openConnection function sets it to true
      if (connection === undefined) {
        playerCanDropChips = false;
      } else {
        playerCanDropChips = true;
      }
    } else {
      playerCanDropChips = false;

      multiplayerTurn();
    }
    break;
    case 3: //p2p opponent
    if (currentTurn() === playersColor) {
      playerCanDropChips = true;
    } else {
      playerCanDropChips = false;
      //remember, randomAI is non-blocking because it is in a timeout
      multiplayerTurn();
    }
    break;
    case 4: //ai vs ai
    winningMoveAI();
    break;
  }
}

//Draws the chip, adds it to the array, returns true if successful
function dropChip(x, color, boardArray, AICheck, noAnimation) {
  //for loop that checks array starting at bottom of board which is at 6 going up to 1
  for (var j = 6; j > 0; j--) {
    //the position in the array will be undefined when there is an open space to drop the chip
    if (boardArray[x][j] === undefined && !winCondition(boardArray, AICheck)) {
      if (!AICheck) {
        console.log(color.charAt(0).toUpperCase() + color.slice(1) + " dropped in column " + x);
        drawChip(x, j, color, noAnimation);
      }
      boardArray[x][j] = color;
      return true;
    }
  }
  //chip wasn't successfully dropped
  return false;
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
    window.requestAnimFrame = (function (callback) {
      return window.requestAnimationFrame
      || window.webkitRequestAnimationFrame
      || window.mozRequestAnimationFrame
      || window.oRequestAnimationFrame
      || window.msRequestAnimationFrame
      || function (callback) {
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
        requestAnimFrame(function () {
          animate(chip, chipCanvas, startTime);
        });
      }
      else {
        chip.y = y;
        setTimeout(function () {
          chipCanvas.drawImage(chipImage, chip.x, chip.y, chip.width, chip.height);
        }, 50);
      }
      chipCanvas.clearRect(x, (chip.y - (bh / 6)), (bw / 7), ((bh / 6) + (bh / 12)));
      chipCanvas.drawImage(chipImage, chip.x, chip.y, chip.width, chip.height);
    }
  } else {
    chipCanvas.drawImage(chipImage, chip.x, y, chip.width, chip.height);
    setTimeout(function () {
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
  closeConnection();
  hidePlayAgainPopup();

  //restart the game
  gamemodeSelector();
}

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

function playAgain() {
  console.log("Playing again");

  hidePlayAgainPopup();

  //resetting this variable for next time
  wantToPlayAgain = false;

  resetBoard();
  start(gamemode);
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
  setTimeout(function () {
    chipCanvas.clearRect(0, -(bh / 6), bw, bh + (bh / 6));
  }, 45);
}

function fillArray() {
  arrayToFill = new Array(7);
  for (var i = 1; i < 8; i++) {
    arrayToFill[i] = new Array(6);
  }
  return arrayToFill;
}

//[columns][rows]
//if AICheck is true, a win will not be triggered
//this is for AI
function winCondition(boardArray, AICheck) {
  var victory = false;
  var color;
  //horizontal
  for (var i = 1; i < 5; i++) {
    for (var j = 1; j < 7; j++) {
      if (boardArray[i][j] !== undefined && boardArray[i][j] === boardArray[i + 1][j] && boardArray[i][j] === boardArray[i + 2][j] && boardArray[i][j] === boardArray[i + 3][j]) {
        if (!AICheck)
        win(i, j, "h");
        victory = boardArray[i][j]
      }
    }
  }

  //vertical
  for (var i = 1; i < 8; i++) {
    for (var j = 1; j < 4; j++) {
      if (boardArray[i][j] !== undefined && boardArray[i][j] === boardArray[i][j + 1] && boardArray[i][j] === boardArray[i][j + 2] && boardArray[i][j] === boardArray[i][j + 3]) {
        if (!AICheck)
        win(i, j, "v");
        victory = boardArray[i][j]
      }
    }
  }
  // /diagonals
  for (var i = 1; i < 5; i++) {
    for (var j = 4; j < 7; j++) {
      if (boardArray[i][j] !== undefined && boardArray[i][j] === boardArray[i + 1][j - 1] && boardArray[i][j] === boardArray[i + 2][j - 2] && boardArray[i][j] === boardArray[i + 3][j - 3]) {
        if (!AICheck)
        win(i, j, "//");
        victory = boardArray[i][j]
      }
    }
  }
  // \diagonals
  for (var i = 1; i < 5; i++) {
    for (var j = 1; j < 4; j++) {
      if (boardArray[i][j] !== undefined && boardArray[i][j] === boardArray[i + 1][j + 1] && boardArray[i][j] === boardArray[i + 2][j + 2] && boardArray[i][j] === boardArray[i + 3][j + 3]) {
        if (!AICheck)
        win(i, j, "\\");
        victory = boardArray[i][j]
      }
    }
  }
  // tie
  setTimeout(function () {
    if (moves === 43 && winner === false && !AICheck) {
      //manual win event instead of using win function
      console.log("the game is a draw");
      winner = true;
      setTimeout(function () {
        chipCanvas.drawImage(draw, (3 * bw / 10), -(bh / 6), (bw / 2.5), (bh / 6));
      }, 450);
      displayPlay();
    }
  }, 50);
  return victory;
}

//i and j are the coord of the first chip in the winning four
function win(i, j, direction) {
  winner = true;
  console.log(currentTurn() + " wins on turn " + moves);
  winAdder(currentTurn());
  //this is to make sure that the events are blocked
  playerCanDropChips = false;
  //Draw the win pic based on the color of the chip that won after a delay
  setTimeout(drawWinBanner, 500, pos_array[i][j]);
  //delay
  setTimeout(drawWinXs, 1000, i, j, direction);
  displayPlay();
}

function displayPlay() {

  if (gamemode === 4) {
    var shouldAutoPlayAgain = $('#aivsaicb').prop('checked');
    if (shouldAutoPlayAgain) {
      setTimeout(function () {
        resetBoard();
        start(gamemode);
      }, 1200);
    }
  } else {
    setTimeout(function () {
      if (resetButtonActive) {
        if (gamemode === 2 || gamemode === 3) {
          showPlayAgainPopup(function () {
            askToPlayAgain();
            hidePlayAgainPopup();
          });
        }
        else {
          showPlayAgainPopup(function () {
            resetBoard();
            start(gamemode);
            hidePlayAgainPopup();
          });
        }
      }
    }, 1000);
  }
}

function winAdder(color){
  if (color === "red"){
    redVictories++;
    $("#redVic").text(redVictories);
  }
  else{
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

function hoverChip(e) {
  if (playerCanDropChips === false) {
    return false;
  }

  var offset = $(this).offset();
  var xPos = (e.pageX - offset.left);
  var image = new Image();

  //Set the correct color chip to draw
  image = currentTurn() === "red" ? redchip : bluechip;

  //actual board width and height
  //bw bh are the "initial" size of the canvas or
  //whatever idk
  var w = chips.get(0).scrollWidth;
  var h = chips.get(0).scrollHeight;
  h =  h - (43/300) * h;

  //draw the image of the chip to be dropped
  for (var i = 1; i < 8; i++) {
    if (xPos > ((i - 1) * (w / 7)) && xPos < (i * (w / 7)) && winner === false) {
      chipCanvas.clearRect(0, -(bh / 6), bw, (bh / 6));
      chipCanvas.drawImage(image, ((i - 1) * (bw / 7)), -(bh / 6), (bw / 7), (bh / 6));
    }
  }
}

function randomAI() {
  setTimeout(function () {
    //will try to drop the chip until successful
    var column = Math.floor((Math.random() * 7) + 1);
    while (!dropChip(column, currentTurn(), pos_array, false)) {
      console.log("The AI just tried to drop a chip in column " + column + ", which is full. (What an idiot!)");
      column = Math.floor((Math.random() * 7) + 1);
    }
    nextTurn();
  }, AIDelay);
}

function winningMoveAI() {
  setTimeout(function () {
    //decide chip dropping animation should play
    var shouldNotAnimate = AIDelay <= maxMillisecondsToAnimateChipDropping;
    //not completely necessary, but whatever
    var column = makeTree(pos_array, Math.round(Math.log(30000)/Math.log(7 - possiblemoves(pos_array, false))), currentTurn(), currentTurn()) + 1;
    if (winner === false) {
      while (!dropChip(column, currentTurn(), pos_array, false, shouldNotAnimate)) {
      }
    }
    else {
      return;
    }
    nextTurn();
  }, AIDelay);
}

function possiblemoves(boardArray, arrayOrNo) {
  var counter = 0;
  possible = new Array(7);
  for (var i = 1; i < 8; i++) {
    var testingArray = copyArray(boardArray);
    if (dropChip(i, currentTurn(), testingArray, true)) {
      possible[i-1] = true;
    }
    else {
      possible[i-1] = false;
      counter++;
    }
  }
  if (counter === 7) {
    return false;
  } else if (arrayOrNo){
    return possible;
  } else {
    return counter;
  }
}

function bestPossibleMove(boardArray) {
  /*
  * Order of importance:
  *  -winning move
  *  -blocking move
  *  -random move while avoiding setting the next player up to win
  */
  //the column we will drop into will be random unless we find a better move
  var potentialWinningMove = willCauseWin(boardArray, currentTurn());

  //if there's no winning move, let's check to see if we can block the other player
  if (potentialWinningMove === -1) {
    var potentialBlockingMove = willCauseWin(boardArray, oppositeOfCurrentTurn());
    //if there is a blocking move, let's do that
    if (potentialBlockingMove !== -1) {
      console.log("Blocking move found at " + potentialBlockingMove);
      return potentialBlockingMove;
    }
  } else {
    //we have a winning move! let's drop there
    console.log("Winning move found at " + potentialWinningMove);
    return potentialWinningMove;
  }

  //for every column current color can drop in, we will check if it will cause the other player to win
  for (var i = 1; i <= 7; i++) {
    var testingArray = copyArray(boardArray);
    //if the column is not full
    if (dropChip(i, currentTurn(), testingArray, true)) {
      //check to see if the opponent has a winning move due to the drop we just made
      var opponentWinningMoveColumn = willCauseWin(testingArray, oppositeOfCurrentTurn());
      //if the opponent does have a winning move, take note of that in our array
      if (opponentWinningMoveColumn !== -1) {
        console.log(oppositeOfCurrentTurn() + ' will win by dropping in column '
        + opponentWinningMoveColumn + ' if ' + currentTurn() + ' drops in column ' + i);
        avoid[i] = true;
      } else {
        avoid[i] = false;
      }
    }
  }

  //pick a random move, making sure to avoid columns found above
  while (true) {
    possiblemoves(pos_array, true);
    var is_same = possible.length === avoid.length && possible.every(function (element, index) {
      return element === avoid[index];
    });
    var potentialMove = Math.floor((Math.random() * 7) + 1);
    //if we shouldn't avoid this particular move, then let's do it!
    if (!avoid[potentialMove] || is_same === true) {
      return potentialMove;
    }
  }
}

//returns -1 if no winning move found
function willCauseWin(boardArray, color) {
  //trying each column
  for (var i = 1; i <= 7; i++) {
    //copy actual array to our temporary array
    //var aiArray = pos_array;
    var aiArray = copyArray(boardArray);
    //if our drop into the temporary array is successful, this is true
    var dropChipSuccessful = dropChip(i, color, aiArray, true);
    //if our drop caused our ai to win, this will be true
    var isWinningMove = winCondition(aiArray, true);
    if (dropChipSuccessful && isWinningMove) {
      //we'll drop the chip there
      return i;
      //get outta here cause we already won!
      break;
    }
  }
  return -1;
}

function boardScore(boardArray, color) {
  var redscore = 0;
  var bluescore = 0;
  var score = 0;
  var three = threeInRows(boardArray);
  var redThreeInRows = three.redCount;
  var blueThreeInRows = three.blueCount;
  var two = threeInRows(boardArray);
  var redTwoInRows = two.redCount;
  var blueTwoInRows = two.blueCount;
  var mid = middleScorer(boardArray, color);
  var redMid = mid.redCount;
  var blueMid = mid.blueCount;
  if (winCondition(boardArray, true) === color){
    score = Number.POSITIVE_INFINITY;
  }
  else if (typeof winCondition(boardArray, true) === "string" && winCondition(boardArray, true) !== color) {
    score = Number.NEGATIVE_INFINITY;
  }
  else {
    redscore += 150 * redThreeInRows + 50 * redTwoInRows + redMid;
    bluescore += 150 * blueThreeInRows +  50 * blueTwoInRows + blueMid;
    if (color === "red") {
      score = redscore - bluescore;
    }
    else {
      score = bluescore - redscore;
    }
  }
  return score;
}

function threeInRows(boardArray){
  var redCounter = 0;
  var blueCounter = 0;
  //horizontal
  for (var i = 1; i < 6; i++) {
    for (var j = 1; j < 7; j++) {
      if (boardArray[i][j] !== undefined && boardArray[i][j] === boardArray[i + 1][j] && boardArray[i][j] === boardArray[i + 2][j]) {
        if (boardArray[i][j] === "red"){
          redCounter++;
        }
        else {
          blueCounter++;
        }
      }
    }
  }

  //vertical
  for (var i = 1; i < 8; i++) {
    for (var j = 1; j < 5; j++) {
      if (boardArray[i][j] !== undefined && boardArray[i][j] === boardArray[i][j + 1] && boardArray[i][j] === boardArray[i][j + 2]) {
        if (boardArray[i][j] === "red"){
          redCounter++;
        }
        else {
          blueCounter++;
        }
      }
    }
  }
  // /diagonals
  for (var i = 1; i < 6; i++) {
    for (var j = 3; j < 7; j++) {
      if (boardArray[i][j] !== undefined && boardArray[i][j] === boardArray[i + 1][j - 1] && boardArray[i][j] === boardArray[i + 2][j - 2]) {
        if (boardArray[i][j] === "red"){
          redCounter++;
        }
        else {
          blueCounter++;
        }
      }
    }
  }
  // \diagonals
  for (var i = 1; i < 6; i++) {
    for (var j = 1; j < 5; j++) {
      if (boardArray[i][j] !== undefined && boardArray[i][j] === boardArray[i + 1][j + 1] && boardArray[i][j] === boardArray[i + 2][j + 2]) {
        if (boardArray[i][j] === "red"){
          redCounter++;
        }
        else {
          blueCounter++;
        }
      }
    }
  }

  return {
    redCount: redCounter,
    blueCount: blueCounter
  };
}

function twoInRows(boardArray){
  var redCounter = 0;
  var blueCounter = 0;
  //horizontal
  for (var i = 1; i < 7; i++) {
    for (var j = 1; j < 7; j++) {
      if (boardArray[i][j] !== undefined && boardArray[i][j] === boardArray[i + 1][j]) {
        if (boardArray[i][j] === "red"){
          redCounter++;
        }
        else {
          blueCounter++;
        }
      }
    }
  }

  //vertical
  for (var i = 1; i < 8; i++) {
    for (var j = 1; j < 6; j++) {
      if (boardArray[i][j] !== undefined && boardArray[i][j] === boardArray[i][j + 1]) {
        if (boardArray[i][j] === "red"){
          redCounter++;
        }
        else {
          blueCounter++;
        }
      }
    }
  }
  // /diagonals
  for (var i = 1; i < 7; i++) {
    for (var j = 2; j < 7; j++) {
      if (boardArray[i][j] !== undefined && boardArray[i][j] === boardArray[i + 1][j - 1]) {
        if (boardArray[i][j] === "red"){
          redCounter++;
        }
        else {
          blueCounter++;
        }
      }
    }
  }
  // \diagonals
  for (var i = 1; i < 7; i++) {
    for (var j = 1; j < 6; j++) {
      if (boardArray[i][j] !== undefined && boardArray[i][j] === boardArray[i + 1][j + 1]) {
        if (boardArray[i][j] === "red"){
          redCounter++;
        }
        else {
          blueCounter++;
        }
      }
    }
  }

  return {
    redCount: redCounter,
    blueCount: blueCounter
  };
}

function middleScorer(boardArray) {
  var redCounter = 0;
  var blueCounter = 0;
  for (var i = 1; i <= boardArray[1].length; i++) {
    //this fucking blows
    if (boardArray[4][i] === "red") {
      redCounter += 50;
    }
    if (boardArray[4][i] === "blue") {
      blueCounter += 50;
    }
    if (boardArray[3][i] === "red") {
      redCounter += 20;
    }
    if (boardArray[5][i] === "red") {
      redCounter += 20;
    }
    if (boardArray[3][i] === "blue") {
      blueCounter += 20;
    }
    if (boardArray[5][i] === "blue") {
      blueCounter += 20;
    }
    if (boardArray[2][i] === "red") {
      redCounter += 10;
    }
    if (boardArray[6][i] === "red") {
      redCounter += 10;
    }
    if (boardArray[2][i] === "blue") {
      blueCounter += 10;
    }
    if (boardArray[6][i] === "blue") {
      blueCounter += 10;
    }
    if (boardArray[1][i] === "red") {
      redCounter += 5;
    }
    if (boardArray[7][i] === "red") {
      redCounter += 5;
    }
    if (boardArray[1][i] === "blue") {
      blueCounter += 5;
    }
    if (boardArray[7][i] === "blue") {
      blueCounter += 5;
    }
  }
  return {
    redCount: redCounter,
    blueCount: blueCounter
  };
}

function copyArray(arrayToCopy) {
  return arrayToCopy.map(function (arr) {
    return arr.slice();
  });
}

function currentTurn() {
  if (moves % 2 === 0) {
    return startingColor === "red" ? "blue" : "red";
  }
  else {
    return startingColor;
  }
}

function oppositeOfCurrentTurn() {
  if (moves % 2 === 1) {
    return startingColor === "red" ? "blue" : "red";
  }
  else {
    return startingColor;
  }
}

//returns who's turn it is now
function advanceTurn() {
  moves++;
  return currentTurn();
}

function assignColors() {
  switch (gamemode) {
    case 0: //local mulitplayer
    //doesn't matter because it won't be checked in nextTurn
    break;
    case 1: //singleplayer
    playersColor = "red";
    opponentsColor = "blue";
    break;
    case 2: //p2p host
    startingColor = "red"
    playersColor = "red";
    opponentsColor = "blue";
    break;
    case 3: //p2p opponent
    startingColor = "red"
    playersColor = "blue";
    opponentsColor = "red";
    break;
  }
}

function setUpOnline(forcedPeerNum) {
  var peerNum = forcedPeerNum || Math.floor(Math.random() * 900) + 100;
  console.log("Peer id: " + peerNum);
  peer = new Peer(peerNum, {key: 'fe7e2757-bbef-4456-a934-ae93385502b9'});
  return peerNum;
}

function hostOnlineGame() {
  //start new game
  //alert("Your game number is " + peerNum);
  if($('#popup').css('visibility') === "hidden") {
    $("#LoadingAnimation").css('visibility', 'visible');
  }
  peer.on('connection', function (conn) {
    connection = conn;
    openConnection();
    goToStart(2);
  });
}

function joinOnlineGame(gameNum) {
  setUpOnline();

  //join game
  //var gameNum = window.prompt("Enter an game number to join");
  $("#LoadingAnimation").css('visibility', 'visible');
  connection = peer.connect(gameNum);
  peer.on('error', function(err) {
    if(err.type === 'peer-unavailable') {
      Reset();
      alert('Game does not exist.');
    }
  });
  openConnection();
}

function multiplayerTurn() {
  //prevent duplicates
  if (!isMultiplayerTurnEventInPlace) {
    connection.on('data', function (data) {
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
  connection.on('open', function () {
    console.log("Connection open");
    $("#LoadingAnimation").css('visibility', 'hidden');
    playerCanDropChips = currentTurn() === playersColor;
    $('#host').click();

    //tell the opponent our name
    if (gamemode === 3 && urlParams.name) {
      sendMove('name:' + urlParams.name);
    }

    //set up to receive name from opponent if we're the host
    if (gamemode === 2) {
      connection.on('data', function (data) {
        if (typeof data === 'string' && data.startsWith('name:')) {
          var opponentName = data.split(':')[1];
          popupPlayerName(opponentName);
        }
      });
    }
  });

  connection.on('close', function () {
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

function gamemodeSelector() {
  var peerNum = setUpOnline();

  $('#gamemodeSelector').modal('show');

  $("#single").click(function () {
    goToStart(1);
  });

  $("#local").click(function () {
    goToStart(0);
  });

  $("#host").click(function () {
    hostOnlineGame();
    //goToStart is called within hostOnlineGame
  });

  $("#gamenum").html("Your game number is " + peerNum);

  $('#host').popover({
    html : true,
    trigger: 'hover',
    content: function() {
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
    goToStart(3);
  }

  function startAI () {
    //get the delay from the input box in the popup and send
    //it to the join online game function
    var aid = $('#aiin').val();

    //simulates clicking join online game button to close the popup
    $('#aivsai').click();

    AIDelay = aid;
    goToStart(4);
  }

  $("#joinbut").click(startJoin);

  //checks for enter key press on input box
  $('#joinin').keypress(function (e) {
    if (e.which == 13) {
      startJoin();
      return false;
    }
  });

  $("#aibut").click(startAI);

  //checks for enter key press on input box
  $('#aiin').keypress(function (e) {
    if (e.which == 13) {
      startAI();
      return false;
    }
  });
}

function goToStart(gm) {
  /*$("#single").unbind("click");
  $("#local").unbind("click");
  $("#host").unbind("click");
  $("#joinbut").unbind("click");
  $("#aibut").unbind("click");
  $("#popup").css("visibility", "hidden");*/
  $("#resetButton").css("visibility", "visible");
  $('#gamemodeSelector').modal('hide');
  start(gm);
}

function popupPlayerName(name) {
  alert('You are now playing with ' + name + '.');
}

function popupConnectionLost() {
  alert('Your opponent ended the match.');
}

function getOppositeColor(color) {
  return color === "red" ? "blue" : "red";
}

function Tree(board, depth) {
  this.depth = depth;
  this.path = new Array();

  //generate the tree
  this.tree = new Node();
  this.tree.setChildren(generateChildren(board, this.depth, currentTurn(), this.depth));

  function generateChildren(boardArray, depth, color, initDepth) {
    var children = [];
    //for each child we need to create
    for (var i = 1; i < 8; i++) {
      var aiArray = copyArray(boardArray);
      if (dropChip(i, color, aiArray, true)) {
        var newChild = new Node();
        if (depth > 1) {
          newChild.setChildren(generateChildren(aiArray, depth-1, getOppositeColor(color), initDepth));
        } else {
          newChild.setScore(boardScore(aiArray, currentTurn()));
        }

        //add it to the array
        children.push(newChild);
      }
      else {
        var newChild = new Node();
        newChild.setScore(null);
        children.push(newChild);
      }
    }
    return children;
  }
}

Tree.prototype.getBestValue = function(colorToMax, currentColor) {
  var mm = this.minmax(this.tree, this.depth, colorToMax, currentColor);
  for(var i = 0; i < 7; i++){
    if(!possiblemoves(pos_array, true)[i]) {
      this.path.splice(i, 0, {
        score: null
      });
    }
  }
  return mm;
}

Tree.prototype.minmax = function(node, depth, colorToMax, currentColor) {
  if (depth == 0 || !("children" in node)) {
    return {
      score: node.score,
      depth: depth
    }
  }
  var best_value, v;
  if (colorToMax === currentColor) {
    //maximizing player

    best_value = {
      score: Number.NEGATIVE_INFINITY,
      depth: depth
    };

    for (var child in node.children) {
      if (node.children[child].score !== null) {
        v = this.minmax(node.children[child], depth - 1, getOppositeColor(colorToMax), currentColor);
        var bestScore = Math.max(v.score, best_value.score);
        var bestDepth;
        if (v.score === best_value.score) {
          if (best_value.score === Number.POSITIVE_INFINITY){
            bestDepth = v.depth > best_value.depth ? v.depth : best_value.depth;
          } else if (best_value.score === Number.NEGATIVE_INFINITY) {
            bestDepth = v.depth < best_value.depth ? v.depth : best_value.depth;
          }
          else {
            bestDepth = best_value.depth;
          }
        } else {
          bestDepth = bestScore === v.score ? v.depth : best_value.depth;
        }
        best_value = {
          score: bestScore,
          depth: bestDepth
        }
      }
    }
    if(depth === this.depth - 1) {
      this.path.push(best_value);
    }
    return best_value;
  }
  else {
    //minimizing player
    best_value = {
      score: Number.POSITIVE_INFINITY,
      depth: depth
    };

    for (var child in node.children) {
      if (node.children[child].score !== null) {
        v = this.minmax(node.children[child], depth - 1, getOppositeColor(colorToMax), currentColor);
        var bestScore = Math.min(v.score, best_value.score);
        var bestDepth;
        if (v.score === best_value.score) {
          if (best_value.score === Number.POSITIVE_INFINITY){
            bestDepth = v.depth < best_value.depth ? v.depth : best_value.depth;
          } else if (best_value.score === Number.NEGATIVE_INFINITY) {
            bestDepth = v.depth > best_value.depth ? v.depth : best_value.depth;
          }
          else {
            bestDepth = best_value.depth;
          }
        } else {
          bestDepth = bestScore === v.score ? v.depth : best_value.depth;
        }
        best_value = {
          score: bestScore,
          depth: bestDepth
        }
      }
    }
    if(depth === this.depth - 1) {
      this.path.push(best_value);
    }
    return best_value;
  }
}

Tree.prototype.bestMove = function(tree, best) {
  var dupes = [];
  for(var i = 0; i < 7; i++){
    if (this.path[i].score === best.score && this.path[i].depth === best.depth) {
      dupes.push(i);
    }
  }
  return dupes[Math.floor(Math.random()*dupes.length)];
}

function Node() {}

Node.prototype.setChildren = function(children) {
  this.children = children;
}

Node.prototype.setScore = function(score) {
  this.score = score;
}

function makeTree(board, depth, colorToMax, currentColor) {
  var tree = new Tree(board, depth);
  var best = tree.getBestValue(colorToMax, currentColor);
  return tree.bestMove(tree, best);
}
