var MinmaxPlayer = function(helperMethods, data) {
  var chipColor;

  function possibleMoves(boardArray) {
    var possible = new Array();

    for (var i = 0; i < 7; i++) {
      
      // TODO: wtf is this
      var whatIsThisNumberKevin = Math.round(7 / 2 + ((1 - 2 * (i % 2)) * (i + 1)) / 2);

      // we drop RED because color doesn't matter,
      // we're just seeing if the column is full or not
      if (helperMethods.dropChip(boardArray, whatIsThisNumberKevin, RED)) {
        possible.push(whatIsThisNumberKevin);
        helperMethods.undropChip(boardArray, whatIsThisNumberKevin);
      }

    }
    return possible;
  }

  function boardScore(boardArray, color, winCheck) {
    var score = 0;
    if (winCheck == color) {
      score = 10000 - moves;
    } else if (typeof winCheck == "string" && winCheck == getOppositeColor(color)) {
      score = -10000 + moves;
    } else {
      score = middleScorer(boardArray, color) + 5 * availableWins(boardArray, color);
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

  function minimax(state, depth, colorToMax, currentColor, alpha, beta) {
    var thisStateWinStatus = helperMethods.checkForWin(state);
    if (depth == 0 || thisStateWinStatus) {
      return {
        value: boardScore(state, colorToMax, thisStateWinStatus),
        action: 0
      };
    }
    var bestValue, bestAction, actionValue;
    if (colorToMax == currentColor) {
      //maximizing player
      bestValue = Number.NEGATIVE_INFINITY;
      for (let action of possibleMoves(state)) {
        helperMethods.dropChip(state, action, currentColor);
        actionValue = minimax(state, depth - 1, colorToMax, getOppositeColor(currentColor), alpha, beta).value;
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
        actionValue = minimax(state, depth - 1, colorToMax, getOppositeColor(currentColor), alpha, beta).value;
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

  return {
    takeTurn: function(currentBoard, yourColor, previousColumn, makeMove) {
      chipColor = yourColor;
      setTimeout(function() {
        //decide if chip dropping animation should play
        var maxMillisecondsToAnimateChipDropping = 120;
        var delayEnteredByTheUser = data;
        var shouldAnimate = delayEnteredByTheUser >= maxMillisecondsToAnimateChipDropping;
        //run the ai on the board
        var depth = Math.round(Math.log(3000000) / Math.log(possibleMoves(currentBoard).length));
        console.log(depth);
        var column = minimax(helperMethods.copyBoard(currentBoard), depth, yourColor, yourColor, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY).action;
        makeMove(column, shouldAnimate);
      }, data);
    }
  };
};
