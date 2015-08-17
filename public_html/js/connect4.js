
/*
 *   Connect 4 by Kevin Shannon
 */


/*
 * Variable declarations
 */

//board dimensions
var bw = 1050;
var bh = 900;

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
var winner = "False";
var once = "False";

//images
var redchip = new Image(), bluechip = new Image(), board = new Image(), redwins = new Image(), bluewins = new Image(), draw = new Image(), XXX = new Image();
redchip.src = "img/bestchipred.png";
bluechip.src = "img/bestchipblue.png";
board.src = "img/board.png";
redwins.src = "img/redwins.png";
bluewins.src = "img/bluewins.png";
draw.src = "img/draw.png";
XXX.src = "img/X.png";


/*
 * Main Code
 */

//Prepare the array for the glorious connect 4
fillArray();

//Draw the board upon load
$(window).load(drawBoard);

//Ran when the site is fully loaded
$(document).ready(function () {

    //Ran when user clicks on the canvas
    $('canvas').click(click);

    //called when the mouse moves across the canvas
    $('canvas').mousemove(hoverChip);
});


/*
 * Functions
 */

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

    //initial call, and recurs until the chip drops all the way
    animate(chip, canvas, ctx, startTime);

    function animate(chip, canvas, ctx, startTime) {
        // update
        var time = (new Date()).getTime() - startTime;
        var a = 1300;
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
        ctx.clearRect(x, (chip.y - 110), (bw / 7), ((bh / 6) + 30));
        ctx.drawImage(chipColor, chip.x, chip.y, chip.width, chip.height);
    }

    window.requestAnimFrame = (function (callback) {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
                function (callback) {
                    window.setTimeout(callback, 1000 / 60);
                };
    })();

}

function dropChip(x) {
//for loop that checks array starting at bottom of board which is at 6 going up to 1
    for (var j = 6; j > 0; j--) {
        if (pos_array[x][j] === undefined && winner === "False") {
            drawChip(x, j);
            moves++;
            winCondition();
            break;
        }
    }
}

function Reset() {
    pos_array.length = 0;
    ctx.clearRect(0, -(bh / 6), bw, bh + (bh / 6));
    fillArray();
    winner = "False";
    once = "False";
    moves = 0;
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
    if (moves === 42 && winner === "False") {
//manual win event instead of using win function
        winner = "True";
        setTimeout(function () {
            ctx.drawImage(draw, (3 * bw / 10), -(bh / 6), (bw / 2.5), (bh / 6));
        }, 500);
    }
}

//i and j are the coord of the first chip in the winning four
function win(i, j, direction) {
    winner = "True";
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
//drop the chip where the user clicked
    var offset = $(this).offset();
    var xPos = (e.pageX - offset.left);
    for (var i = 1; i < 8; i++) {
        if (((i - 1) * (bw / 7)) < xPos && xPos < ((i) * (bw / 7))) {
            dropChip(i);
        }
    }
}

function hoverChip(e) {
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
        if (xPos > ((i - 1) * (bw / 7)) && xPos < (i * (bw / 7)) && winner === "False") {
            ctx.clearRect(0, -(bh / 6), bw, (bh / 6));
            ctx.drawImage(image, ((i - 1) * (bw / 7)), -(bh / 6), (bw / 7), (bh / 6));
        }
    }

//clear all draws of hover chips
    if (winner === "True" && once === "False") {
        ctx.clearRect(0, -(bh / 6), bw, (bh / 6));
        once = "True";
    }
}