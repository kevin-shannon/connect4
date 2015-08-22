
/*
 *   Connect 4 by Kevin Shannon
 */


/*
 * Variable declarations
 */

//multiplayer
var isMultiplayer = true;
var AIDelay = 1000;

//board dimensions
var bw = $(window).width() / 2.5;   // returns height of browser viewport
var bh = $(window).width() * 12 / 35;  // returns width of browser viewport

//canvases
var canvas = $('<canvas/>').attr({
    width: bw,
    height: bh + (bh / 6)
}).appendTo('body');
var ctx = canvas.get(0).getContext("2d");
ctx.translate(0, (bw / 7));
var canvas2 = $('<canvas/>').attr({
    width: bw,
    height: bw
}).appendTo('body');
var ctx2 = canvas2.get(0).getContext("2d");

//logic globals (these are bad practice and will probably have to be replaced)
var pos_array;
var moves = 0;
var winner = false;
var once = false;
var full = false;

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
var isUsersTurn;

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

    /* New main code */
    main();

});


/*
 * Functions
 */

function main() {
    //makes it so the user cannot drop a chip or hover
    isUsersTurn = false;
    //figure out which gamemode the user wants to play
    switch (askGamemode()) {
        case 0: //local mult
            isMultiplayer = false;
            break;
        case 1: //singleplayer
            isMultiplayer = true;
            break;
        case 2: //p2p multiplayer (not implemented)
            break;
    }
    fillArray();
    isUsersTurn = true;
}

function afterChipDropped() {
    winCondition();
    nextTurn();
}

function drawChip(x, y) {
    var chipColor = redchip;
    if (moves % 2 === 0) {
        color = "red";
        chipColor = redchip;
    } else {
        color = "blue";
        chipColor = bluechip;
    }
    pos_array[x][y] = color;
    x = (bw / 7) * (x - 1);
    y = (bh / 6) * (y - 1);
    var chip = {
        x: x,
        y: 0,
        width: (bw / 7),
        height: (bh / 6)
    };
    var startTime = (new Date()).getTime();

    window.requestAnimFrame = (function (callback) {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
                function (callback) {
                    window.setTimeout(callback, 1000 / 60);
                };
    })();

    //initial call, and recurs until the chip drops all the way
    animate(chip, canvas, ctx, startTime);

    function animate(chip, canvas, ctx, startTime) {
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

        // clear
        ctx.clearRect(x, (chip.y - (bh / 6)), (bw / 7), ((bh / 6) + (bh / 12)));
        ctx.drawImage(chipColor, chip.x, chip.y, chip.width, chip.height);
    }
}

function dropChip(x) {
    //for loop that checks array starting at bottom of board which is at 6 going up to 1
    for (var j = 6; j > 0; j--) {
        //the position in the array will be undefined when there is an open space to drop the chip
        if (pos_array[x][j] === undefined && winner === false) {
            drawChip(x, j);
            return true;
            break;
        }
    }
    //chip wasn't successfully dropped
    return false;
}

function checkFull(x) {
    for (var j = 6; j > 0; j--) {
        if (pos_array[x][j] === undefined && winner === false) {
            full = false;
        }
        else {
            full = true;
        }
    }
}

function Reset() {
    pos_array.length = 0;
    ctx.clearRect(0, -(bh / 6), bw, bh + (bh / 6));
    fillArray();
    winner = false;
    once = false;
    moves = 0;

    //restart the game
    main();
}

function fillArray() {
    pos_array = new Array(7);
    for (var i = 1; i < 8; i++) {
        pos_array[i] = new Array(6);
    }
}

//[columns][rows]
function winCondition() {
    //horizontal
    for (var i = 1; i < 5; i++) {
        for (var j = 1; j < 7; j++) {
            if (pos_array[i][j] !== undefined && pos_array[i][j] === pos_array[i + 1][j] && pos_array[i][j] === pos_array[i + 2][j] && pos_array[i][j] === pos_array[i + 3][j]) {
                win(i, j, "h");
            }
        }
    }

    //vertical
    for (var i = 1; i < 8; i++) {
        for (var j = 1; j < 4; j++) {
            if (pos_array[i][j] !== undefined && pos_array[i][j] === pos_array[i][j + 1] && pos_array[i][j] === pos_array[i][j + 2] && pos_array[i][j] === pos_array[i][j + 3]) {
                win(i, j, "v");
            }
        }
    }
    // /diagonals
    for (var i = 1; i < 5; i++) {
        for (var j = 4; j < 7; j++) {
            if (pos_array[i][j] !== undefined && pos_array[i][j] === pos_array[i + 1][j - 1] && pos_array[i][j] === pos_array[i + 2][j - 2] && pos_array[i][j] === pos_array[i + 3][j - 3]) {
                win(i, j, "//");
            }
        }
    }
    // \diagonals
    for (var i = 1; i < 5; i++) {
        for (var j = 1; j < 4; j++) {
            if (pos_array[i][j] !== undefined && pos_array[i][j] === pos_array[i + 1][j + 1] && pos_array[i][j] === pos_array[i + 2][j + 2] && pos_array[i][j] === pos_array[i + 3][j + 3]) {
                win(i, j, "\\");
            }
        }
    }
    // tie
    if (moves === 42 && winner === false) {
        //manual win event instead of using win function
        winner = true;
        setTimeout(function () {
            ctx.drawImage(draw, (3 * bw / 10), -(bh / 6), (bw / 2.5), (bh / 6));
        }, 500);
    }
}

//i and j are the coord of the first chip in the winning four
function win(i, j, direction) {
    winner = true;
    //this is to make sure that the events are blocked
    isUsersTurn = true;
    //Draw the win pic based on the color of the chip that won after a delay
    setTimeout(drawWinBanner, 500, pos_array[i][j]);
    //delay
    setTimeout(drawWinXs, 1000, i, j, direction);
}

function drawWinBanner(color) {

    //choose the correct picture for either red or blue
    var temp;
    switch (color) {
        case "red":
            temp = redwins;
            break;
        case "blue":
            temp = bluewins;
            break;
    }

    //draw that sucker
    ctx.drawImage(temp, (bw / 6), -(bh / 6), (bw / 1.5), (bh / 6));
}

function drawWinXs(i, j, direction) {
    //repeat four times because it's connect FOUR
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

function click(e) {
    if (isUsersTurn === false) {
        return false;
    }

    //drop the chip where the user clicked
    var offset = $(this).offset();
    var xPos = (e.pageX - offset.left);
    for (var i = 1; i < 8; i++) {
        if (((i - 1) * (bw / 7)) < xPos && xPos < ((i) * (bw / 7))) {
            //if the chip drop was successful
            if (dropChip(i)) {
                afterChipDropped();
            }
        }
    }
}

function hoverChip(e) {
    if (isUsersTurn === false) {
        return false;
    }
    var offset = $(this).offset();
    var xPos = (e.pageX - offset.left);
    var image = new Image();
    //checks which color's turn it is
    if (moves % 2 === 0) {
        image.src = "img/bestchipred.png";
    }
    else {
        image.src = "img/bestchipblue.png";
    }

    //draw the image of the chip to be dropped
    for (var i = 1; i < 8; i++) {
        if (xPos > ((i - 1) * (bw / 7)) && xPos < (i * (bw / 7)) && winner === false) {
            ctx.clearRect(0, -(bh / 6), bw, (bh / 6));
            ctx.drawImage(image, ((i - 1) * (bw / 7)), -(bh / 6), (bw / 7), (bh / 6));
        }
    }

    //clear all draws of hover chips
    if (winner === true && once === false) {
        ctx.clearRect(0, -(bh / 6), bw, (bh / 6));
        once = true;
    }
}

function nextTurn() {
    //advance moves
    moves++;

    //if this is a multiplayer games and every other turn
    if (isMultiplayer === true && moves % 2 === 1 && winner === false) {
        isUsersTurn = false;
        randomAI();
    }
}

function randomAI() {
    setTimeout(function () {
        //will try to drop the chip until successful
        while (!dropChip(Math.floor((Math.random() * 7) + 1))) {
            console.log("randomAI man");
        }
        afterChipDropped();
        isUsersTurn = true;
    }, AIDelay);
}

function askGamemode() {
    if (confirm("Press OK for singleplayer or cancel for local multiplayer") === true) {
        //singleplayer/AI
        return 1;
    } else {
        //local multiplayer
        return 0;
    }
}
