var MinimaxPlayer = function(helperMethods, data) {

	var chipColor;

	function possibleMoves(boardArray, arrayOrNo) {
		var counter = 0;
		var possible = new Array(7);
		for (var i = 1; i < 8; i++) {
			var testingArray = helperMethods.copyBoard(boardArray);

            // we drop RED because color doesn't matter, we're just
            // seeing if the column is full or not
			if (helperMethods.dropChip(testingArray, i, RED, function() {})) {
				possible[i - 1] = true;
			} else {
				possible[i - 1] = false;
				counter++;
			}
		}
		if (counter === 7) {
			return false;
		} else if (arrayOrNo) {
			return possible;
		} else {
			return counter;
		}
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
		if (helperMethods.checkForWin(boardArray, function() {}, function() {}) === color) {
			score = Number.POSITIVE_INFINITY;
		} else if (typeof helperMethods.checkForWin(boardArray, function() {}, function() {}) === "string" && helperMethods.checkForWin(boardArray, function() {}, function() {}) !== color) {
			score = Number.NEGATIVE_INFINITY;
		} else {
			redscore += 100 * redThreeInRows + 50 * redTwoInRows + redMid;
			bluescore += 100 * blueThreeInRows + 50 * blueTwoInRows + blueMid;
			if (color === RED) {
				score = redscore - bluescore;
			} else {
				score = bluescore - redscore;
			}
		}
		return score;
	}

	function threeInRows(boardArray) {
		var redCounter = 0;
		var blueCounter = 0;
		//horizontal
		for (var i = 1; i < 6; i++) {
			for (var j = 1; j < 7; j++) {
				if (boardArray[i][j] !== undefined && boardArray[i][j] === boardArray[i + 1][j] && boardArray[i][j] === boardArray[i + 2][j]) {
					if (boardArray[i][j] === RED) {
						redCounter++;
					} else {
						blueCounter++;
					}
				}
			}
		}

		//vertical
		for (var i = 1; i < 8; i++) {
			for (var j = 1; j < 5; j++) {
				if (boardArray[i][j] !== undefined && boardArray[i][j] === boardArray[i][j + 1] && boardArray[i][j] === boardArray[i][j + 2]) {
					if (boardArray[i][j] === RED) {
						redCounter++;
					} else {
						blueCounter++;
					}
				}
			}
		}
		// /diagonals
		for (var i = 1; i < 6; i++) {
			for (var j = 3; j < 7; j++) {
				if (boardArray[i][j] !== undefined && boardArray[i][j] === boardArray[i + 1][j - 1] && boardArray[i][j] === boardArray[i + 2][j - 2]) {
					if (boardArray[i][j] === RED) {
						redCounter++;
					} else {
						blueCounter++;
					}
				}
			}
		}
		// \diagonals
		for (var i = 1; i < 6; i++) {
			for (var j = 1; j < 5; j++) {
				if (boardArray[i][j] !== undefined && boardArray[i][j] === boardArray[i + 1][j + 1] && boardArray[i][j] === boardArray[i + 2][j + 2]) {
					if (boardArray[i][j] === RED) {
						redCounter++;
					} else {
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
			if (boardArray[4][i] === RED) {
				redCounter += 50;
			}
			if (boardArray[4][i] === BLUE) {
				blueCounter += 50;
			}
			if (boardArray[3][i] === RED) {
				redCounter += 20;
			}
			if (boardArray[5][i] === RED) {
				redCounter += 20;
			}
			if (boardArray[3][i] === BLUE) {
				blueCounter += 20;
			}
			if (boardArray[5][i] === BLUE) {
				blueCounter += 20;
			}
			if (boardArray[2][i] === RED) {
				redCounter += 10;
			}
			if (boardArray[6][i] === RED) {
				redCounter += 10;
			}
			if (boardArray[2][i] === BLUE) {
				blueCounter += 10;
			}
			if (boardArray[6][i] === BLUE) {
				blueCounter += 10;
			}
			if (boardArray[1][i] === RED) {
				redCounter += 5;
			}
			if (boardArray[7][i] === RED) {
				redCounter += 5;
			}
			if (boardArray[1][i] === BLUE) {
				blueCounter += 5;
			}
			if (boardArray[7][i] === BLUE) {
				blueCounter += 5;
			}
		}
		return {
			redCount: redCounter,
			blueCount: blueCounter
		};
	}

	function Tree(board, depth) {
		this.board = board;
		this.depth = depth;
		this.path = new Array();

		//generate the tree
		this.tree = new Node();
		this.tree.setChildren(generateChildren(this.board, this.depth, chipColor, this.depth));

		function generateChildren(boardArray, depth, color, initDepth) {
			var children = [];
			//for each child we need to create
			for (var i = 1; i < 8; i++) {
				var aiArray = helperMethods.copyBoard(boardArray);
				if (helperMethods.dropChip(aiArray, i, color, function() {})) {
					var newChild = new Node();
					if (depth > 1) {
						newChild.setChildren(generateChildren(aiArray, depth - 1, getOppositeColor(color), initDepth));
					} else {
						newChild.setScore(boardScore(aiArray, color));
					}

					//add it to the array
					children.push(newChild);
				} else {
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
		for (var i = 0; i < 7; i++) {
			if (!possibleMoves(this.board, true)[i]) {
				this.path.splice(i, 0, {
					score: null
				});
			}
		}
		return mm;
	};

	Tree.prototype.minmax = function(node, depth, colorToMax, currentColor) {
		if (depth == 0 || !("children" in node)) {
			return {
				score: node.score,
				depth: depth
			};
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
						if (best_value.score === Number.POSITIVE_INFINITY) {
							bestDepth = v.depth > best_value.depth ? v.depth : best_value.depth;
						} else if (best_value.score === Number.NEGATIVE_INFINITY) {
							bestDepth = v.depth < best_value.depth ? v.depth : best_value.depth;
						} else {
							bestDepth = best_value.depth;
						}
					} else {
						bestDepth = bestScore === v.score ? v.depth : best_value.depth;
					}
					best_value = {
						score: bestScore,
						depth: bestDepth
					};
				}
			}
			if (depth === this.depth - 1) {
				this.path.push(best_value);
			}
			return best_value;
		} else {
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
						if (best_value.score === Number.POSITIVE_INFINITY) {
							bestDepth = v.depth < best_value.depth ? v.depth : best_value.depth;
						} else if (best_value.score === Number.NEGATIVE_INFINITY) {
							bestDepth = v.depth > best_value.depth ? v.depth : best_value.depth;
						} else {
							bestDepth = best_value.depth;
						}
					} else {
						bestDepth = bestScore === v.score ? v.depth : best_value.depth;
					}
					best_value = {
						score: bestScore,
						depth: bestDepth
					};
				}
			}
			if (depth === this.depth - 1) {
				this.path.push(best_value);
			}
			return best_value;
		}
	};

	Tree.prototype.bestMove = function(best) {
		var dupes = [];
		for (var i = 0; i < 7; i++) {
			if (this.path[i].score === best.score && this.path[i].depth === best.depth) {
				dupes.push(i);
			}
		}
		return dupes[Math.floor(Math.random() * dupes.length)];
	};

	function Node() {}

	Node.prototype.setChildren = function(children) {
		this.children = children;
	};

	Node.prototype.setScore = function(score) {
		this.score = score;
	};

	function runMinimax(board, depth, colorToMax, currentColor) {
		var tree = new Tree(board, depth);
		var best = tree.getBestValue(colorToMax, currentColor);
		return tree.bestMove(best);
	}

	return {
		takeTurn: function(currentBoard, yourColor, makeMove) {
			chipColor = yourColor;
			setTimeout(function() {
				//decide if chip dropping animation should play
                var maxMillisecondsToAnimateChipDropping = 120;
                var delayEnteredByTheUser = data;
				var shouldAnimate = delayEnteredByTheUser >= maxMillisecondsToAnimateChipDropping;

                //run the ai on the board
                var depth = Math.round(Math.log(30000) / Math.log(7 - possibleMoves(currentBoard, false)));
				var column = runMinimax(currentBoard, depth, yourColor, yourColor) + 1;

				makeMove(column, shouldAnimate);
			}, data);
		}
	};

};
