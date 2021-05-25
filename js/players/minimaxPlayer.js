var MinmaxPlayer = function(helperMethods, data) {
  var worker = new Worker("js/bin/minimaxMethods.js");
  var minimumMoveTime = data.delay;
  var chipColor = data.chipColor;

  return {
    getReady: function(onReady) {
      onReady();
    },
    takeTurn: function(currentBoard, previousColumn, makeMove) {
      helperMethods.setGameStatus("Waiting on " + chipColor + "...");

      var beforeTime = performance.now();

      var sobriety = true;

      //decide if chip dropping animation should play
      var maxMillisecondsToAnimateChipDropping = 120;
      var delayEnteredByTheUser = minimumMoveTime;
      var shouldAnimate = delayEnteredByTheUser >= maxMillisecondsToAnimateChipDropping;

      //run the ai on the board in a worker
      worker.postMessage([currentBoard, chipColor, moves, sobriety]);

      worker.onmessage = function(e) {
        // example to explain the following code:

        // if the AI takes 0.1 seconds to move and the set minimum
        // move time is 1 second, wait for 0.9 more seconds (the
        // remaining delay)

        // if the AI takes 8 seconds to make a move, "remainingDelay"
        // will be negative. setTimeout will just do it asap.

        var afterTime = performance.now();
        var moveTimeSoFar = afterTime - beforeTime;

        var remainingDelay = minimumMoveTime - moveTimeSoFar;

        setTimeout(function() {
          var column = e.data;
          makeMove(column, shouldAnimate);
        }, remainingDelay);
      };
    },
    onGameEnd: function(playAgain) {
      // the AI is always ready to play again
      playAgain();
    },
    onReset: function() {
      worker.terminate();
    },
    chipColor: chipColor
  };
};
