var MinmaxPlayer = function(helperMethods, data) {

	var chipColor;

	function possibleMoves(boardArray) {
		var possible = new Array();
		for (var i = 1; i < 8; i++) {
			var testingArray = helperMethods.copyBoard(boardArray);
    	// we drop RED because color doesn't matter, we're just
      // seeing if the column is full or not
			if (helperMethods.dropChip(testingArray, i, RED))
				possible.push(i);
		}
		return possible;
	}

	function boardScore(boardArray, color) {
		var score = 0;
		var winCheck = helperMethods.checkForWin(boardArray);
		if (winCheck == color) {
			score = 10000 - moves;
		} else if (typeof winCheck == "string" && winCheck == getOppositeColor(color)) {
			score = -10000 + moves;
		} else {
			score = middleScorer(boardArray, color);
		}
		return score;
	}

	function middleScorer(boardArray, colorToScore) {
		var counter = 0;
		for (var i = 1; i <= 7; i++) {
			for (var j = 6; j >= 1; j--) {
				if(boardArray[i][j] == null)
					break;
				if(boardArray[i][j] == colorToScore)
					counter += 48/(Math.abs(i-4)+1);
				else {
					counter -= 48/(Math.abs(i-4)+1);
				}
			}
		}
		return counter;
	}

	function minimax(state, depth, colorToMax, currentColor, alpha, beta) {
		if (depth == 0 || helperMethods.checkForWin(state)) {
			return {
				value: boardScore(state, colorToMax),
				action: 0
			};
		}
		var bestValue, bestAction, actionValue, successor;
		if (colorToMax == currentColor) {
			//maximizing player
			bestValue = Number.NEGATIVE_INFINITY;
			for (let action of possibleMoves(state)) {
				successor = helperMethods.copyBoard(state);
				helperMethods.dropChip(successor, action, currentColor);
				actionValue = minimax(successor, depth - 1, colorToMax, getOppositeColor(currentColor), alpha, beta).value;
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
				successor = helperMethods.copyBoard(state);
				helperMethods.dropChip(successor, action, currentColor);
				actionValue = minimax(successor, depth - 1, colorToMax, getOppositeColor(currentColor), alpha, beta).value;
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
        var depth = Math.round(Math.log(1000000) / Math.log(possibleMoves(currentBoard).length));
				console.log(depth);
				var column = minimax(helperMethods.copyBoard(currentBoard), depth, yourColor, yourColor, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY).action;
				makeMove(column, shouldAnimate);
			}, data);
		}
	};
};
