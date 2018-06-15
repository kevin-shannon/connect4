var MinmaxPlayer = function(helperMethods, data) {

	var chipColor;

	function possibleMoves(boardArray, arrayOrNo) {
		var counter = 0;
		var possible = new Array(7);
		for (var i = 1; i < 8; i++) {
			var testingArray = helperMethods.copyBoard(boardArray);

            // we drop RED because color doesn't matter, we're just
            // seeing if the column is full or not
			if (helperMethods.dropChip(testingArray, i, RED)) {
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

		var redMid = middleScorer(boardArray, RED);
		var blueMid = middleScorer(boardArray, BLUE);

		var winCheck = helperMethods.checkForWin(boardArray);
		if (winCheck === color) {
			score = Number.POSITIVE_INFINITY;
		} else if (typeof winCheck === "string" && winCheck !== color) {
			score = Number.NEGATIVE_INFINITY;
		} else {
			redscore += redMid;
		  bluescore += blueMid;
			if (color === RED) {
				score = redscore - bluescore;
			} else {
				score = bluescore - redscore;
			}
		}
		return score;
	}

	function middleScorer(boardArray, colorToScore) {
		var counter = 0;
		for (var i = 1; i <= 7; i++) {
			for (var j = 6; j >= 1; j--) {
				if(boardArray[i][j] == null)
					break;
				if(boardArray[i][j] === colorToScore)
					counter += 48/(Math.abs(i-4)+1);
			}
		}
		return counter;
	}

	function Tree(board, depth) {
		this.board = board;
		this.depth = depth;
		this.path = new Array();

		//generate the tree
		this.tree = new Node();
		var before = new Date();
		this.tree.setChildren(generateChildren(this.board, this.depth, chipColor, this.depth));
		var after = new Date();
		console.log(after.getTime() - before.getTime());

		function generateChildren(boardArray, depth, color, initDepth) {
			var children = [];
			//for each child we need to create
			for (var i = 1; i < 8; i++) {
				var aiArray = helperMethods.copyBoard(boardArray);
				if (!helperMethods.checkForWin(aiArray)) {
					if (helperMethods.dropChip(aiArray, i, color)) {
						var newChild = new Node();
						if (depth > 1) {
							newChild.setChildren(generateChildren(aiArray, depth - 1, getOppositeColor(color), initDepth));
						} else {
							newChild.setScore(boardScore(aiArray, chipColor));
						}

						//add it to the array
						children.push(newChild);
					} else {
						var newChild = new Node();
						newChild.setScore(null);
						children.push(newChild);
					}
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

	Tree.prototype.minmax = function(node, depth, colorToMax, currentColor, alpha, beta) {
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
					v = this.minmax(node.children[child], depth - 1, getOppositeColor(colorToMax), currentColor, alpha, beta);
					var bestScore = Math.max(v.score, best_value.score);
					alpha = Math.max(alpha, bestScore);
					if(beta <= alpha)
						break;
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
					v = this.minmax(node.children[child], depth - 1, getOppositeColor(colorToMax), currentColor, alpha, beta);
					var bestScore = Math.min(v.score, best_value.score);
					beta = Math.min(beta, bestScore);
					if(beta <= alpha)
						break;
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

	function runMinmax(board, depth, colorToMax, currentColor) {
		var tree = new Tree(board, depth);
		var best = tree.getBestValue(colorToMax, currentColor);
		return tree.bestMove(best);
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
        var depth = Math.round(Math.log(200000) / Math.log(7 - possibleMoves(currentBoard, false)));;
				this.tree = new Node();
				var b = new Date();
				var column = runMinmax(currentBoard, depth, yourColor, yourColor, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY) + 1;
				var a = new Date();
				console.log(currentBoard);
				console.log(a.getTime() - b.getTime());
				makeMove(column, shouldAnimate);
			}, data);
		}
	};
};
