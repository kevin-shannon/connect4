
/*
 *   Connect 4 by Kevin Shannon
 */


/*
 * Variable declarations
 */
var bw = 1050;
var bh = 900;
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
var pos_array;
var xPos = 0;
var moves = 0;
var winner = "False";
var once = "False";
var redchip = new Image;
redchip.src = "img/bestchipred.png";
var bluechip = new Image;
bluechip.src = "img/bestchipblue.png";
var board = new Image;
board.src = "img/board.png";
var redwins = new Image;
redwins.src = "img/redwins.png";
var bluewins = new Image;
bluewins.src = "img/bluewins.png";
var draw = new Image;
draw.src = "img/draw.png";
var XXX = new Image;
XXX.src = "img/X.png";


/*
 * Main Code
 */

fillArray();

//Draw the board upon load
$(window).load(function () {
    ctx2.drawImage(board, 0, 0, bw, bh + (bh / 6));
});

//Ran when the site is fully loaded
$(document).ready(function () {
    //Ran when user clicks on the canvas
    $('canvas').click(function (e) {
        var offset = $(this).offset();
        var xPos = (e.pageX - offset.left);
        for (var i = 1; i < 8; i++) {
            if (((i - 1) * (bw / 7)) < xPos && xPos < ((i) * (bw / 7))) {
                dropChip(i);
            }
        }
    });
});

//Also ran when the site is fully loaded
$(document).ready(function (e) {
    $('canvas').mousemove(function (e) {
        var offset = $(this).offset();
        var xPos = (e.pageX - offset.left);
        var image = new Image();
        if (moves % 2 === 0) {
            image.src = "img/bestchipred.png";
        }
        else {
            image.src = "img/bestchipblue.png";
        }

        for (var i = 1; i < 8; i++) {
            if (xPos > ((i - 1) * (bw / 7)) && xPos < (i * (bw / 7)) && winner === "False") {
                ctx.clearRect(0, -(bh / 6), bw, (bh / 6));
                ctx.drawImage(image, ((i - 1) * (bw / 7)), -(bh / 6), (bw / 7), (bh / 6));
            }
        }
        if (winner === "True" && once === "False") {
            ctx.clearRect(0, -(bh / 6), bw, (bh / 6));
            once = "True";
        }
    });
});


/*
 * Functions
 */
window.requestAnimFrame = (function (callback) {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
            function (callback) {
                window.setTimeout(callback, 1000 / 60);
            };
})();

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

    function drawImage(chip, ctx) {
        ctx.drawImage(chipColor, chip.x, chip.y, chip.width, chip.height);
    }

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

        drawImage(chip, ctx);

    }
    var startTime = (new Date()).getTime();
    animate(chip, canvas, ctx, startTime);
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
    for (var i = 1; i < 5; i++) {
        for (var j = 1; j < 7; j++) {
            if (pos_array[i][j] !== undefined && pos_array[i][j] === pos_array[i + 1][j] && pos_array[i][j] === pos_array[i + 2][j] && pos_array[i][j] === pos_array[i + 3][j]) {
                winner = "True";
                checkColor();
                setTimeout(function (i, j) {
                    for (var n = 1; n < 5; n++) {
                        ctx.drawImage(XXX, (bw / 7) * (i - 1), (bh / 6) * (j - 1), (bw / 7), (bh / 6));
                        i++;
                    }
                }, 1000, i, j);
            }
        }
    }
    for (var i = 1; i < 8; i++) {
        for (var j = 1; j < 4; j++) {
            if (pos_array[i][j] !== undefined && pos_array[i][j] === pos_array[i][j + 1] && pos_array[i][j] === pos_array[i][j + 2] && pos_array[i][j] === pos_array[i][j + 3]) {
                winner = "True";
                checkColor();
                setTimeout(function (i, j) {
                    for (var n = 1; n < 5; n++) {
                        ctx.drawImage(XXX, (bw / 7) * (i - 1), (bh / 6) * (j - 1), (bw / 7), (bh / 6));
                        j++;
                    }
                }, 1000, i, j);
            }
        }
    }
    // /diagonals
    for (var i = 1; i < 5; i++) {
        for (var j = 4; j < 7; j++) {
            if (pos_array[i][j] !== undefined && pos_array[i][j] === pos_array[i + 1][j - 1] && pos_array[i][j] === pos_array[i + 2][j - 2] && pos_array[i][j] === pos_array[i + 3][j - 3]) {
                winner = "True";
                checkColor();
                setTimeout(function (i, j) {
                    for (var n = 1; n < 5; n++) {
                        ctx.drawImage(XXX, (bw / 7) * (i - 1), (bh / 6) * (j - 1), (bw / 7), (bh / 6));
                        j--;
                        i++;
                    }
                }, 1000, i, j);
            }
        }
    }
    // \diagonals
    for (var i = 1; i < 5; i++) {
        for (var j = 1; j < 4; j++) {
            if (pos_array[i][j] !== undefined && pos_array[i][j] === pos_array[i + 1][j + 1] && pos_array[i][j] === pos_array[i + 2][j + 2] && pos_array[i][j] === pos_array[i + 3][j + 3]) {
                winner = "True";
                checkColor();
                setTimeout(function (i, j) {
                    for (var n = 1; n < 5; n++) {
                        ctx.drawImage(XXX, (bw / 7) * (i - 1), (bh / 6) * (j - 1), (bw / 7), (bh / 6));
                        j++;
                        i++;
                    }
                }, 1000, i, j);
            }
        }
    }
    // tie
    if (moves === 42 && winner === "False") {
        winner = "True";
        setTimeout(function () {
            ctx.drawImage(draw, (3 * bw / 10), -(bh / 6), (bw / 2.5), (bh / 6));
        }, 500);
    }

    function checkColor() {
        if (pos_array[i][j] === "red") {
            setTimeout(function () {
                ctx.drawImage(redwins, (bw / 6), -(bh / 6), (bw / 1.5), (bh / 6));
            }, 500);
        }
        else {
            setTimeout(function () {
                ctx.drawImage(bluewins, (bw / 6), -(bh / 6), (bw / 1.5), (bh / 6));
            }, 500);
        }
    }
}