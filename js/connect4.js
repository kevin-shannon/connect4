
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
var maxMillisecondsToAnimateChipDropping = 100;
var resetButtonActive = false;

//online multiplayer
var peer;
var connection;
var wantToPlayAgain = false;
var isMultiplayerTurnEventInPlace = false;

//colors and design
var startingColor = "red";
var playersColor;
var opponentsColor;
var blur = 4;

//board dimensions
if ($(window).width() < $(window).height()) {
    var bw = $(window).width() / 1.5;
    var bh = $(window).width() * 4 / 7;
}
else {
    var bw = $(window).width() / 2.5;   // sets board width
    var bh = $(window).width() * 12 / 35;  // sets board height
}

//canvases
var canvas = $('<canvas/>').attr({
    width: bw,
    height: bh + (bh / 6)
}).appendTo('#game');
var ctx = canvas.get(0).getContext("2d");
ctx.translate(0, (bw / 7));
var canvas2 = $('<canvas/>').attr({
    width: bw,
    height: bw
}).appendTo('#game');
var ctx2 = canvas2.get(0).getContext("2d");

//logic globals (these are bad practice and will probably have to be replaced)
var pos_array;
var possible = new Array(7);
var avoid = new Array(7);
var moves = 0;
var winner = false;

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
$(window).load(drawBoard);

//Ran when the site is fully loaded
$(document).ready(function () {

    //Ran when user clicks on the canvas
    $('canvas').click(click);

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

    //figure out which gamemode the user wants to play
    console.log("Gamemode " + gamemode + " selected.");

    /*
     //if the gamemode is online multiplayer, let's set that up
     if (gamemode === 2 || gamemode === 3) {
     setUpOnlineMultiplayer();
     }*/

    //assign colors to players
    assignColors();

    //get the pos_array ready for some epic connect4 action
    pos_array = fillArray();

    //unblur background
    blurBackground(false);

    //activate reset button
    resetButtonActive = true;

    //start turn one
    nextTurn();
    //now we wait for a click event
}

function click(e) {
    if (playerCanDropChips === false) {
        return false;
    }

    //if this is online multiplayer, make sure the connection is open
    if ((gamemode === 2 || gamemode === 3) && !connection.open) {
        return false;
    }

    //determine where the chip was dropped
    var offset = $(this).offset();
    var xPos = (e.pageX - offset.left);
    for (var i = 1; i < 8; i++) {
        if (((i - 1) * (bw / 7)) < xPos && xPos < ((i) * (bw / 7))) {
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
        if (boardArray[x][j] === undefined && winner === false) {
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
        animate(chip, canvas, ctx, startTime);

        function animate(chip, canvas, ctx, startTime) {
            if (resetButtonActive === false) {
                ctx.clearRect(0, -(bh / 6), bw, bh + (bh / 6));
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
                    animate(chip, canvas, ctx, startTime);
                });
            }
            else {
                chip.y = y;
            }
            ctx.clearRect(x, (chip.y - (bh / 6)), (bw / 7), ((bh / 6) + (bh / 12)));
            ctx.drawImage(chipImage, chip.x, chip.y, chip.width, chip.height);
        }
    } else {
        ctx.drawImage(chipImage, chip.x, y, chip.width, chip.height);
    }
}


function Reset() {

    //if the button is somehow displayed even though it shouldn't be
    //make sure reset doesn't run?? -Tanner
    if (resetButtonActive === false) {
        return false;
    }

    resetBoard();

    closeConnection();

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
  $("#playpop").css("visibility", "visible");
  $("#play").click(functionToRunOnClick);
}

function hidePlayAgainPopup() {
  $("#play").unbind("click");
  $("#playpop").css("visibility", "hidden");
}

function resetBoard() {
    console.log("Resetting game");

    pos_array.length = 0;
    ctx.clearRect(0, -(bh / 6), bw, bh + (bh / 6));
    pos_array = fillArray();
    winner = false;
    moves = 0;
    playerCanDropChips = false;
    resetButtonActive = false;
    AIDelay = 1000;
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
    //horizontal
    for (var i = 1; i < 5; i++) {
        for (var j = 1; j < 7; j++) {
            if (boardArray[i][j] !== undefined && boardArray[i][j] === boardArray[i + 1][j] && boardArray[i][j] === boardArray[i + 2][j] && boardArray[i][j] === boardArray[i + 3][j]) {
                if (!AICheck)
                    win(i, j, "h");
                victory = true;
            }
        }
    }

    //vertical
    for (var i = 1; i < 8; i++) {
        for (var j = 1; j < 4; j++) {
            if (boardArray[i][j] !== undefined && boardArray[i][j] === boardArray[i][j + 1] && boardArray[i][j] === boardArray[i][j + 2] && boardArray[i][j] === boardArray[i][j + 3]) {
                if (!AICheck)
                    win(i, j, "v");
                victory = true;
            }
        }
    }
    // /diagonals
    for (var i = 1; i < 5; i++) {
        for (var j = 4; j < 7; j++) {
            if (boardArray[i][j] !== undefined && boardArray[i][j] === boardArray[i + 1][j - 1] && boardArray[i][j] === boardArray[i + 2][j - 2] && boardArray[i][j] === boardArray[i + 3][j - 3]) {
                if (!AICheck)
                    win(i, j, "//");
                victory = true;
            }
        }
    }
    // \diagonals
    for (var i = 1; i < 5; i++) {
        for (var j = 1; j < 4; j++) {
            if (boardArray[i][j] !== undefined && boardArray[i][j] === boardArray[i + 1][j + 1] && boardArray[i][j] === boardArray[i + 2][j + 2] && boardArray[i][j] === boardArray[i + 3][j + 3]) {
                if (!AICheck)
                    win(i, j, "\\");
                victory = true;
            }
        }
    }
    if (victory === true) {
        return true;
    }
    // tie
    if (possiblemoves(pos_array) === false && winner === false) {
        //manual win event instead of using win function
        console.log("the game is a draw");
        winner = true;
        setTimeout(function () {
            ctx.drawImage(draw, (3 * bw / 10), -(bh / 6), (bw / 2.5), (bh / 6));
        }, 500);
    }
}

//i and j are the coord of the first chip in the winning four
function win(i, j, direction) {
    winner = true;
    console.log(currentTurn() + " wins on turn " + moves);
    //this is to make sure that the events are blocked
    playerCanDropChips = false;
    //Draw the win pic based on the color of the chip that won after a delay
    setTimeout(drawWinBanner, 500, pos_array[i][j]);
    //delay
    setTimeout(drawWinXs, 1000, i, j, direction);
    if (gamemode === 2 || gamemode === 3) {
        setTimeout(function () {
            showPlayAgainPopup(function () {
                askToPlayAgain();
                hidePlayAgainPopup();
            });
        }, 1500);
    }
}

function drawWinBanner(color) {

    //choose the correct picture for either red or blue
    var bannerImage = (color === "red") ? redwins : bluewins;

    //draw that sucker
    if (resetButtonActive === true) {
        ctx.drawImage(bannerImage, (bw / 6), -(bh / 6), (bw / 1.5), (bh / 6));
    }
}

function drawWinXs(i, j, direction) {
    //repeat four times because it's connect FOUR
    if (resetButtonActive === false) {
        return;
    }
    for (var n = 1; n < 5; n++) {
        //draw the X
        ctx.drawImage(XXX, (bw / 7) * (i - 1), (bh / 6) * (j - 1), (bw / 7), (bh / 6));
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
    ctx2.drawImage(board, 0, 0, bw, bh + (bh / 6));
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

    //draw the image of the chip to be dropped
    for (var i = 1; i < 8; i++) {
        if (xPos > ((i - 1) * (bw / 7)) && xPos < (i * (bw / 7)) && winner === false) {
            ctx.clearRect(0, -(bh / 6), bw, (bh / 6));
            ctx.drawImage(image, ((i - 1) * (bw / 7)), -(bh / 6), (bw / 7), (bh / 6));
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
        var column = bestPossibleMove(pos_array);
        if (winner === false) {
            while (!dropChip(column, currentTurn(), pos_array, false, shouldNotAnimate)) {
                console.log("The AI just tried to drop a chip in column " + column + ", which is full. (What an idiot!)");
                column = bestPossibleMove(pos_array);
            }
        }
        else {
            return;
        }
        nextTurn();
    }, AIDelay);
}

function possiblemoves(boardArray) {
    var counter = 0;
    possible = new Array(7);
    for (var i = 1; i < 8; i++) {
        var testingArray = copyArray(boardArray);
        if (dropChip(i, currentTurn(), testingArray, true)) {
            possible[i] = true;
        }
        else {
            possible[i] = false;
            counter++;
        }
    }
    if (counter === 7) {
        return false;
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
        possiblemoves(pos_array);
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
            playersColor = "red";
            opponentsColor = "blue";
            break;
        case 3: //p2p opponent
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
    connection = peer.connect(gameNum);
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

function blurBackground(tf) {
    if (tf) {
        $("#game").css("-webkit-filter", "blur(" + blur + "px)");
        $("#game").css("-moz-filter", "blur(" + blur + "px)");
        $("#game").css("filter", "blur(" + blur + "px)");
    } else {
        $("#game").css("-webkit-filter", "blur(0px)");
        $("#game").css("-moz-filter", "blur(0px)");
        $("#game").css("filter", "blur(0px)");
    }
}

function gamemodeSelector() {
    var peerNum = setUpOnline();
    blurBackground(true);
    $("#popup").css("visibility", "visible");
    $("#reset").css("visibility", "hidden");
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

    //join game popup
    $('#join').popup({
        popup: $('#joinpop'),
        on: 'click',
        closeable: true,
        position: 'bottom center'
    });

    $('#aivsai').popup({
        popup: $('#aipop'),
        on: 'click',
        closeable: true,
        position: 'bottom center'
    });

    $("#gamenum").html("Your game number is " + peerNum);

    $('#host').popup({
        popup: $('#hostpop'),
        on: 'click',
        closeable: true,
        position: 'bottom center'
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
    $("#single").unbind("click");
    $("#local").unbind("click");
    $("#host").unbind("click");
    $("#joinbut").unbind("click");
    $("#aibut").unbind("click");
    $("#popup").css("visibility", "hidden");
    $("#reset").css("visibility", "visible");
    start(gm);
}

function popupPlayerName(name) {
    alert('You are now playing with ' + name + '.');
}

function popupConnectionLost() {
    alert('Your opponent ended the match.')
}
