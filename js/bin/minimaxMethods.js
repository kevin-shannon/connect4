importScripts("../bin/helperMethods.js");

var maxDepth;
var scoreMap = new Map();

var RED = "red";
var BLUE = "blue";

var moves;

onmessage = function(e) {
  // transfer external stuff into the worker
  var currentBoard = e.data[0];
  var yourColor = e.data[1];
  moves = e.data[2];
  var sobriety = e.data[3];

  if (sobriety) {
    maxDepth = Math.round(Math.log(3000000) / Math.log(possibleMoves(currentBoard).length + 1));
  } else {
    maxDepth = Math.round(Math.log(1000000) / Math.log(possibleMoves(currentBoard).length + 1));
  }
  console.log("minimax depth: " + maxDepth);

  //drunk player has a 50% chance to make a random move

  if (sobriety || Math.random() < 0.5) {
    var column = minimax(helperMethods.copyBoard(currentBoard), maxDepth, yourColor, yourColor, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY).action;
  } else {
    //I don't feel so good
    var column = possibleMoves(currentBoard)[Math.floor(Math.random() * possibleMoves(currentBoard).length)];
  }

  postMessage(column);
};

function getOppositeColor(color) {
  return color == RED ? BLUE : RED;
}

function possibleMoves(boardArray) {
  var possible = new Array();
  for (var i = 0; i < 7; i++) {
    // i but from the middle outwards
    var column = Math.round(7 / 2 + ((1 - 2 * (i % 2)) * (i + 1)) / 2);

    // we drop RED because color doesn't matter,
    // we're just seeing if the column is full or not
    if (helperMethods.dropChip(boardArray, column, RED)) {
      possible.push(column);
      helperMethods.undropChip(boardArray, column);
    }
  }
  return possible;
}

function boardScore(boardArray, color, winCheck, additonalMoves) {
  var score = 0;
  if (winCheck == color) {
    score = 10000 - moves - additonalMoves;
  } else if (typeof winCheck == "string" && winCheck == getOppositeColor(color)) {
    score = -10000 + moves + additonalMoves;
  } else {
    var hash = helperMethods.hashBoard(boardArray, color);
    score = scoreMap.get(hash);
    if (score == undefined) {
      score = middleScorer(boardArray, color) + 5 * availableWins(boardArray, color);
      scoreMap.set(hash, score);
    }
  }
  return score;
}

function availableWins(boardArray, color) {
  var numWins = 0;
  for (var i = 1; i <= 7; i++) {
    for (var j = 6; j >= 1; j--) {
      if (boardArray[i][j] == null) break;
      if (boardArray[i][j] == color) {
        var x = 1;
        var y = 1;
        for (var t = -1; t < 2; t += 2) {
          for (n = 0; n < 2; n++) {
            x += t;
            numWins += openCheck(boardArray, color, i, j, x, y);
          }
          for (n = 0; n < 2; n++) {
            y += t;
            numWins += openCheck(boardArray, color, i, j, x, y);
          }
        }
      }
    }
  }
  return numWins;
}

function openCheck(boardArray, color, i, j, x, y) {
  for (var a = 1; a < 4; a++) {
    if (i + a * x > 7 || j + a * y > 6 || i + a * x < 1 || j + a * y < 1) break;
    if (boardArray[i + a * x][j + a * y] == getOppositeColor(color)) break;
    if (a == 3) {
      return 1;
    }
  }
  return 0;
}

function middleScorer(boardArray, color) {
  var counter = 0;
  for (var i = 1; i <= 7; i++) {
    for (var j = 6; j >= 1; j--) {
      if (boardArray[i][j] == null) break;
      if (boardArray[i][j] == color) counter += 48 / (Math.abs(i - 4) + 1);
      else {
        counter -= 48 / (Math.abs(i - 4) + 1);
      }
    }
  }
  return counter;
}

function minimax(state, depth, colorToMax, currentColor, alpha, beta, lastDropColumn) {
  var thisStateWinStatus = helperMethods.checkForLastDropWin(state, lastDropColumn);

  if (depth == 0 || thisStateWinStatus) {
    return {
      value: boardScore(state, colorToMax, thisStateWinStatus, maxDepth - depth),
      action: 0
    };
  }
  var bestValue, bestAction, actionValue;
  if (colorToMax == currentColor) {
    //maximizing player
    bestValue = Number.NEGATIVE_INFINITY;
    for (let action of possibleMoves(state)) {
      helperMethods.dropChip(state, action, currentColor);
      actionValue = minimax(state, depth - 1, colorToMax, getOppositeColor(currentColor), alpha, beta, action).value;
      helperMethods.undropChip(state, action);
      if (actionValue >= bestValue) {
        bestValue = actionValue;
        bestAction = action;
      }
      if (bestValue > beta) {
        return {
          value: bestValue,
          action: bestAction
        };
      }
      alpha = Math.max(alpha, bestValue);
    }
    return {
      value: bestValue,
      action: bestAction
    };
  } else {
    //minimizing player
    bestValue = Number.POSITIVE_INFINITY;
    for (let action of possibleMoves(state)) {
      helperMethods.dropChip(state, action, currentColor);
      actionValue = minimax(state, depth - 1, colorToMax, getOppositeColor(currentColor), alpha, beta, action).value;
      helperMethods.undropChip(state, action);
      if (actionValue <= bestValue) {
        bestValue = actionValue;
        bestAction = action;
      }
      if (bestValue < alpha) {
        return {
          value: bestValue,
          action: bestAction
        };
      }
      beta = Math.min(beta, bestValue);
    }
    return {
      value: bestValue,
      action: bestAction
    };
  }
}
