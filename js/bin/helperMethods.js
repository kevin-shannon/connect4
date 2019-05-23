var helperMethods = {
  //Tries to add the chip to the array, returns true if successful
  dropChip: function(boardArray, column, color, onDrop) {
    //for loop that checks array starting at bottom of board which is at 6 going up to 1
    for (var j = 6; j > 0; j--) {
      //the position in the array will be undefined when there is an open space to drop the chip
      if (boardArray[column][j] == undefined) {
        if (onDrop) {
          onDrop(column, j, color);
        }
        boardArray[column][j] = color;
        return true;
      }
    }
    //chip wasn't successfully dropped
    return false;
  },

  undropChip: function(boardArray, column, onUndrop) {
    //for loop that checks array starting at top of board which is at 1 going down to 6
    for (var j = 1; j <= 6; j++) {
      //the position in the array will be undefined when there is chipless space
      if (boardArray[column][j] != undefined) {
        if (onUndrop) {
          onUndrop(column, j, color);
        }

        delete boardArray[column][j];

        return true;
      }
    }
    //there were no chips in the column
    return false;
  },

  copyBoard: function(boardToCopy) {
    return boardToCopy.map(function(arr) {
      return arr.slice();
    });
  },

  checkForLastDropWin: function(board, lastDropColumn) {
    // find the row of the last dropped chip
    // while loop that checks array starting at top of board which is at 1 going down to 6
    if (lastDropColumn == undefined) return false;
    var x = lastDropColumn;
    var y = 1;
    while (board[lastDropColumn][y] == undefined) {
      y++;
    }

    var color = board[lastDropColumn][y];

    // downs
    var B = Math.min(6, y + 3);
    var downCount = 0;
    for (var j = y + 1; j <= B; j++) {
      downCount = board[x][j] == color ? downCount + 1 : 0;
      if (downCount == 3) return color;
    }

    // horizontal
    var L = Math.max(1, x - 3);
    var R = Math.min(7, x + 3);
    var horCount = 0;
    for (var i = L; i <= R; i++) {
      horCount = board[i][y] == color ? horCount + 1 : 0;
      if (horCount == 4) return color;
    }

    // diagonal
    var ldCount = 0;
    for (var n = -3; n <= 3; n++) {
      var i = x + n;
      var j = y + n;

      if (i < 1 || i > 7) continue;
      if (j < 1 || j > 7) continue;

      ldCount = board[i][j] == color ? ldCount + 1 : 0;
      if (ldCount == 4) return color;
    }

    // anti diagonal
    var rdCount = 0;
    for (var n = -3; n <= 3; n++) {
      var i = x + n;
      var j = y - n;

      if (i < 1 || i > 7) continue;
      if (j < 1 || j > 7) continue;

      rdCount = board[i][j] == color ? rdCount + 1 : 0;
      if (rdCount == 4) return color;
    }

    return false;
  },

  checkForWin: function(boardArray, onWin, onTie) {
    //[columns][rows]
    var victory = false;
    var boardIsNotFull = false;

    for (var i = 1; i < 8; i++) {
      for (var j = 6; j > 0; j--) {
        if (boardArray[i][j] == undefined) {
          boardIsNotFull = true;
          break;
        }
        //longest if statement ever checks if there is a connect 4
        if (
          (i < 5 && boardArray[i][j] == boardArray[i + 1][j] && boardArray[i][j] == boardArray[i + 2][j] && boardArray[i][j] == boardArray[i + 3][j]) ||
          (j < 4 && boardArray[i][j] == boardArray[i][j + 1] && boardArray[i][j] == boardArray[i][j + 2] && boardArray[i][j] == boardArray[i][j + 3]) ||
          (i < 5 &&
            j > 3 &&
            boardArray[i][j] == boardArray[i + 1][j - 1] &&
            boardArray[i][j] == boardArray[i + 2][j - 2] &&
            boardArray[i][j] == boardArray[i + 3][j - 3]) ||
          (i < 5 &&
            j < 4 &&
            boardArray[i][j] == boardArray[i + 1][j + 1] &&
            boardArray[i][j] == boardArray[i + 2][j + 2] &&
            boardArray[i][j] == boardArray[i + 3][j + 3])
        ) {
          if (onWin) onWin(boardArray[i][j]);
          return boardArray[i][j];
        }
      }
    }

    if (!boardIsNotFull && onTie) {
      onTie();
      return "draw";
    }
  },

  setGameStatus: function(status) {
    $("#game-status").html(status);
  },

  hashBoard: function(board, color) {
    var hash = color == RED ? "r-" : "b-";

    for (var i = 1; i <= 7; i++) {
      for (var j = 1; j <= 6; j++) {
        var color = board[i][j];
        if (color == RED) {
          hash += "r";
        } else if (color == BLUE) {
          hash += "b";
        } else {
          hash += "x";
        }
      }
    }

    return hash;
  }
};
