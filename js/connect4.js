/*
 *   Connect 4 by Kevin Shannon and Tanner Krewson
 *
 *   Single Player: player is always red. first player is randomized
 *   Local Multi:   players stay same color. first player is randomized
 *   Online Multi:  players stay same color. first player is randomized
 *
 */

/*
 * Setup
 */

//colors and design
var RED = "red";
var BLUE = "blue";

//board resolution
var bw = 1400;
var bh = bw * (6 / 7);

//canvases
var chips = $("<canvas/>")
  .attr({
    width: bw,
    height: bh + bh / 6
  })
  .appendTo("#game");
var chipCanvas = chips.get(0).getContext("2d");

// move the chip canvas down one chip length
chipCanvas.translate(0, bw / 7);

var brd = $("<canvas/>")
  .attr({
    width: bw,
    height: bw
  })
  .appendTo("#game");
var boardCanvas = brd.get(0).getContext("2d");

$(window).on("resize", function() {
  makeCanvasAndItsContainerTheSameSize();
  repositionButtons();
});

$(function() {
  $('[data-toggle="popover"]').popover();
});

var mainBoard;
var moves = 0;
var inGame = false; // false when menu is on screen, true all other times

var redVictories = 0; // TODO: maybe refactor out
var blueVictories = 0; // TODO: maybe refactor out

var lastPlayer1;
var lastPlayer2;

//event blocker: when false, click and hover events do not work
var playerCanDropChips = false;

var allImagesLoaded = false;
var pageReady = false;

//images
var numOfImagesLoaded = 0;
var TOTAL_IMAGES = 7;

function imageLoaded() {
  numOfImagesLoaded++;
  if (numOfImagesLoaded >= TOTAL_IMAGES) {
    allImagesLoaded = true;
    checkForReady();
  }
}

var redchip = new Image(),
  bluechip = new Image(),
  board = new Image(),
  redwins = new Image(),
  bluewins = new Image(),
  draw = new Image(),
  XXX = new Image();

redchip.onload = function() {
  imageLoaded();
};
bluechip.onload = function() {
  imageLoaded();
};
board.onload = function() {
  imageLoaded();
};
redwins.onload = function() {
  imageLoaded();
};
bluewins.onload = function() {
  imageLoaded();
};
draw.onload = function() {
  imageLoaded();
};
XXX.onload = function() {
  imageLoaded();
};

redchip.src = "img/bestchipred.png";
bluechip.src = "img/bestchipblue.png";
board.src = "img/board.png";
redwins.src = "img/redwins.png";
bluewins.src = "img/bluewins.png";
draw.src = "img/draw.png";
XXX.src = "img/X.png";

//Ran when the site is fully loaded
$(document).ready(function() {
  pageReady = true;
  checkForReady();
});

function checkForReady() {
  if (allImagesLoaded && pageReady) {
    initialize();
  }
}

/*
 * Main Game Functions
 */

function initialize() {
  drawBoard();

  //or else everything will be under the canvas
  makeCanvasAndItsContainerTheSameSize();

  repositionButtons();

  //hide the loading screen and copyBox
  $("#loading").hide();
  $("#copyBox").hide();

  var urlParams = new URLSearchParams(window.location.search);
  var joinID = urlParams.get("joinid");
  var createID = urlParams.get("createid");

  if (joinID) {
    // remove the params from the url in the browser bar
    window.history.replaceState(null, null, window.location.pathname);

    startJoin(joinID);
  } else if (createID) {
    // remove the params from the url in the browser bar
    window.history.replaceState(null, null, window.location.pathname);

    start(
      new RemotePlayer(helperMethods, {
        isHost: true,
        createID
      }),
      new LocalPlayer(helperMethods)
    );
  } else {
    //popup the gamemode selector
    gamemodeSelector();
  }
}

function gamemodeSelector() {
  $("#gamemodeSelector").modal("show");

  $("#single").on("click", function() {
    var computerPlayerDelay = 1000;
    start(
      new LocalPlayer(helperMethods, RED),
      new MinmaxPlayer(helperMethods, {
        delay: computerPlayerDelay,
        chipColor: BLUE
      })
    );
  });

  $("#local").on("click", function() {
    start(new LocalPlayer(helperMethods, RED), new LocalPlayer(helperMethods, BLUE));
  });

  $("#host").on("click", function() {
    start(
      new LocalPlayer(helperMethods, RED),
      new RemotePlayer(helperMethods, {
        isHost: true,
        chipColor: BLUE
      })
    );
    copyBox();
  });

  $("#aivsai").on("click", function() {
    start(
      new DrunkPlayer(helperMethods, {
        delay: 200,
        chipColor: RED
      }),
      new DrunkPlayer(helperMethods, {
        delay: 200,
        chipColor: BLUE
      })
    );
  });
}

function startJoin(gn) {
  start(
    new RemotePlayer(helperMethods, {
      isHost: false,
      gameCode: gn,
      chipColor: RED
    }),
    new LocalPlayer(helperMethods, BLUE)
  );
}

function start(player1, player2) {
  lastPlayer1 = player1;
  lastPlayer2 = player2;

  $("#resetButton").css("visibility", "visible");

  $("#gamemodeSelector").modal("hide");

  $("#single").off("click");
  $("#local").off("click");
  $("#host").off("click");
  //$("#aivsai").off("click");

  //actual board width and height
  var w = chips.get(0).scrollWidth;
  var h = chips.get(0).scrollHeight;

  //sets postion of indicator tiles
  $("#redturnIn").css("left", $(window).width() / 10 + "px");
  $("#blueturnIn").css("left", $(window).width() / 6 + "px");
  $("#redturnIn").css("top", $(window).height() / 6 + "px");
  $("#blueturnIn").css("top", $(window).height() / 6 + "px");
  //sets size of indicator tiles
  $("#redturnIn").css("height", h / 6 + "px");
  $("#blueturnIn").css("height", h / 6 + "px");
  $("#redturnIn").css("width", w / 6 + "px");
  $("#blueturnIn").css("width", w / 6 + "px");
  //makes tiles visible once gamplay has commensed
  $("#redturnIn").css("visibility", "visible");
  $("#blueturnIn").css("visibility", "visible");
  $("#redVic").css("visibility", "visible");
  $("#blueVic").css("visibility", "visible");
  $("#resetButton").css("visibility", "visible");
  //sets postion of win counter text
  $("#redVic").css("left", $(window).width() / 10 + w / 24 + "px");
  $("#blueVic").css("left", $(window).width() / 6 + w / 24 + "px");
  $("#redVic").css("top", $(window).height() / 6 + h / 96 + "px");
  $("#blueVic").css("top", $(window).height() / 6 + h / 96 + "px");
  //sizes the loading animation
  $("#LoadingAnimation").css("height", h / 6 + "px");
  $("#LoadingAnimation").css("width", w / 7 + "px");
  //postions play again button
  $("#playpop").css("right", $(window).width() / 10 + "px");
  $("#playpop").css("top", $(window).height() / 5 + "px");

  //get the mainBoard ready for some epic connect4 action
  mainBoard = fillArray();

  var numberOfReadyPlayers = 0;
  function onReady() {
    numberOfReadyPlayers++;

    // if both players are ready
    if (numberOfReadyPlayers === 2) {
      inGame = true;

      //start turn one
      nextTurn(player1, player2);
    }
  }

  player1.getReady(onReady);
  player2.getReady(onReady);
}

function nextTurn(playerToTakeTurnNow, playerToTakeTurnAfter, previousColumn) {
  var isGameWon = helperMethods.checkForWin(
    mainBoard,
    function(colorThatWon) {
      //ran when someone has won
      if (playerToTakeTurnNow.winningMove) {
        playerToTakeTurnNow.winningMove(previousColumn);
      }
      win(colorThatWon);
      if (moves % 2) {
        askIfPlayersWantToPlayAgain(playerToTakeTurnNow, playerToTakeTurnAfter);
      } else {
        askIfPlayersWantToPlayAgain(playerToTakeTurnAfter, playerToTakeTurnNow);
      }
    },
    function() {
      //ran in the event of a tie
      tie();
      askIfPlayersWantToPlayAgain(playerToTakeTurnAfter, playerToTakeTurnNow);
    }
  );

  //if there's a winner, get outta here
  if (isGameWon) {
    return;
  }

  advanceTurn();
  console.log("Turn " + moves + ", " + playerToTakeTurnNow.chipColor + "'s turn.");

  setIndicatorColor(playerToTakeTurnNow.chipColor);

  tryTurn(playerToTakeTurnNow, playerToTakeTurnAfter, previousColumn);
}

function tryTurn(playerToTakeTurnNow, playerToTakeTurnAfter, previousColumn) {
  // records the current time before the move is made
  var beforeMove = performance.now();

  //give the correct player control based on the gamemode
  playerToTakeTurnNow.takeTurn(mainBoard, previousColumn, function(columnToDropIn, shouldAnimate) {
    //ran when the player makes their moves

    //the player has decided their move, so let's execute it.
    var chipWasDropped = helperMethods.dropChip(mainBoard, columnToDropIn, playerToTakeTurnNow.chipColor, function(column, j, chipColor) {
      //ran when the chip has been dropped into the board array

      // log how long it took to make the move
      var afterMove = performance.now();
      var moveTime = (afterMove - beforeMove) / 1000;
      console.log(chipColor + " took " + moveTime.toFixed(6) + " seconds to drop in column " + column);

      drawChip(column, j, chipColor, shouldAnimate);
    });

    if (chipWasDropped) {
      //player has successfully made their move,
      //so switch the color and players and keep going.
      nextTurn(playerToTakeTurnAfter, playerToTakeTurnNow, columnToDropIn);
    } else {
      //try the same thing again
      tryTurn(playerToTakeTurnNow, playerToTakeTurnAfter, previousColumn);
    }
  });
}

function drawChip(x, y, chipColor, shouldAnimate) {
  var chipImage = new Image();

  //Set the correct color chip to draw
  chipImage = chipColor == RED ? redchip : bluechip;

  x = (bw / 7) * (x - 1);
  y = (bh / 6) * (y - 1);
  var chip = {
    x: x,
    y: 0,
    width: bw / 7,
    height: bh / 6
  };
  var startTime = new Date().getTime();

  if (shouldAnimate) {
    window.requestAnimFrame = (function(callback) {
      return (
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback) {
          window.setTimeout(callback, 1000 / 60);
        }
      );
    })();

    //initial call, and recurs until the chip drops all the way
    animate(chip, chipCanvas, startTime);

    function animate(chip, chipCanvas, startTime) {
      // prevents drawings on board after we're back on the menu
      if (!inGame) return;

      // update
      var time = new Date().getTime() - startTime;
      var a = bh * 1.7;
      // pixels / second
      var newY = a * Math.pow(time / 1000, 2) - bh / 6;
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
        }, 100);
      }
      chipCanvas.clearRect(x, chip.y - bh / 6, bw / 7, bh / 6 + bh / 12);
      chipCanvas.drawImage(chipImage, chip.x, chip.y, chip.width, chip.height);
    }
  } else {
    chipCanvas.drawImage(chipImage, chip.x, y, chip.width, chip.height);
    setTimeout(function() {
      chipCanvas.drawImage(chipImage, chip.x, y, chip.width, chip.height);
    }, 200);
  }
}

function setIndicatorColor(newColor) {
  if (newColor == RED) {
    $("#redturnIn").css("WebkitFilter", "grayscale(0%) opacity(100%) blur(0px)");
    $("#blueturnIn").css("WebkitFilter", "grayscale(50%) opacity(70%) blur(2px)");
  } else {
    $("#redturnIn").css("WebkitFilter", "grayscale(50%) opacity(70%) blur(2px)");
    $("#blueturnIn").css("WebkitFilter", "grayscale(0%) opacity(100%) blur(0px)");
  }
}

function copyBox() {
  $("#copyBox").css("display", "flex");
  $("#copyButton").on("click", function() {
    $("#hostLink").select();
    document.execCommand("copy");
    window.getSelection().removeAllRanges();
    $("#hostLink").blur();
  });
}

function clearCurrentGame() {
  resetBoard();
  clearGameStatus();
}

function resetGame() {
  clearCurrentGame();

  inGame = false;

  AIDelay = 1000;

  redVictories = 0;
  blueVictories = 0;
  $("#redVic").text(redVictories);
  $("#blueVic").text(redVictories);

  $("#redturnIn").css("visibility", "hidden");
  $("#blueturnIn").css("visibility", "hidden");
  $("#redVic").css("visibility", "hidden");
  $("#blueVic").css("visibility", "hidden");
  $("#resetButton").css("visibility", "hidden");

  $("#copyBox").hide();

  if (lastPlayer1.onReset) {
    lastPlayer1.onReset();
  }

  if (lastPlayer2.onReset) {
    lastPlayer2.onReset();
  }

  //restart the game
  gamemodeSelector();
}

function resetBoard() {
  mainBoard.length = 0;
  mainBoard = fillArray();
  moves = 0;
  playerCanDropChips = false;
  chipCanvas.clearRect(0, -(bh / 6), bw, bh + bh / 6);
  setTimeout(function() {
    chipCanvas.clearRect(0, -(bh / 6), bw, bh + bh / 6);
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
function win(color) {
  console.log(color + " wins on turn " + moves);
  winAdder(color);
  //this is to make sure that the events are blocked
  playerCanDropChips = false;
  //Draw the win pic based on the color of the chip that won after a delay
  setTimeout(drawWinBanner, 500, color);
  //delay
  setTimeout(drawWinXs, 1000, color);
  clearGameStatus();
}

function tie() {
  setTimeout(function() {
    //manual win event instead of using win function
    console.log("The game is a draw");
    setTimeout(function() {
      chipCanvas.drawImage(draw, (3 * bw) / 10, -(bh / 6), bw / 2.5, bh / 6);
    }, 450);
  }, 50);
  clearGameStatus();
}

function askIfPlayersWantToPlayAgain(player1, player2) {
  // wait until after the Xs and win banner have been drawn
  setTimeout(function() {
    var numberOfPlayersThatWantToPlayAgain = 0;

    player1.onGameEnd(function() {
      numberOfPlayersThatWantToPlayAgain++;

      if (player2.onPlayAgainRequest) {
        player2.onPlayAgainRequest();
      }

      // if both players want to play again
      if (numberOfPlayersThatWantToPlayAgain === 2) {
        playAgain(player1, player2);
      }
    });

    player2.onGameEnd(function() {
      numberOfPlayersThatWantToPlayAgain++;

      if (player1.onPlayAgainRequest) {
        player1.onPlayAgainRequest();
      }

      // if both players want to play again
      if (numberOfPlayersThatWantToPlayAgain === 2) {
        playAgain(player1, player2);
      }
    });
  }, 1100);
}

function playAgain(player1, player2) {
  clearCurrentGame();
  start(player1, player2);
}

function winAdder(color) {
  if (color == RED) {
    redVictories++;
    $("#redVic").text(redVictories);
  } else {
    blueVictories++;
    $("#blueVic").text(blueVictories);
  }
}

function drawWinBanner(color) {
  // prevents drawings on board after we're back on the menu
  if (!inGame) return;

  //choose the correct picture for either red or blue
  var bannerImage = color == RED ? redwins : bluewins;

  //draw that sucker
  chipCanvas.drawImage(bannerImage, bw / 6, -(bh / 6), bw / 1.5, bh / 6);
}

function draw4Xs(i, j, direction) {
  //repeat four times because it's connect FOUR
  for (var n = 1; n < 5; n++) {
    //draw the X
    chipCanvas.drawImage(XXX, (bw / 7) * (i - 1), (bh / 6) * (j - 1), bw / 7, bh / 6);
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

function drawWinXs(color) {
  // prevents drawings on board after we're back on the menu
  if (!inGame) return;

  for (var i = 1; i < 8; i++) {
    for (var j = 6; j > 0; j--) {
      if (mainBoard[i][j] == undefined) break;
      if (mainBoard[i][j] == color) {
        if (i < 5 && color == mainBoard[i + 1][j] && color == mainBoard[i + 2][j] && color == mainBoard[i + 3][j]) draw4Xs(i, j, "h");
        if (j < 4 && color == mainBoard[i][j + 1] && color == mainBoard[i][j + 2] && color == mainBoard[i][j + 3]) draw4Xs(i, j, "v");
        if (i < 5 && j > 3 && color == mainBoard[i + 1][j - 1] && color == mainBoard[i + 2][j - 2] && color == mainBoard[i + 3][j - 3]) draw4Xs(i, j, "//");
        if (i < 5 && j < 4 && color == mainBoard[i + 1][j + 1] && color == mainBoard[i + 2][j + 2] && color == mainBoard[i + 3][j + 3]) draw4Xs(i, j, "\\");
      }
    }
  }
}

function drawBoard() {
  boardCanvas.drawImage(board, 0, 0, bw, bh + bh / 6);
}

function makeCanvasAndItsContainerTheSameSize() {
  var canvasHeight = brd.get(0).scrollHeight;
  $(".canvasContainer").height(canvasHeight);
}

function repositionButtons() {
  var width = $(window).width();
  var buttons = $("#gamemodeSelectorButtons");

  if (width < 544) {
    //if its a small screen
    buttons.addClass("btn-group-vertical");
    buttons.find("*").addClass("btn-lg");

    buttons.find("*").addClass("small-screen-button");
    buttons.find("*").removeClass("big-screen-button");
  } else {
    //if its a big screen
    buttons.removeClass("btn-group-vertical");
    buttons.find("*").removeClass("btn-lg");

    buttons.find("*").addClass("big-screen-button");
    buttons.find("*").removeClass("small-screen-button");
  }
}

function getOppositeColor(color) {
  return color == RED ? BLUE : RED;
}

//returns who's turn it is now
function advanceTurn() {
  moves++;
}

function clearGameStatus() {
  helperMethods.setGameStatus("");
}
