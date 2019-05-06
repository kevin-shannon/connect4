var MinmaxPlayer = function(helperMethods, data) {
  var worker = new Worker('js/minimaxMethods.js');

  return {
    getReady: function(onReady) {
      onReady();
    },
    takeTurn: function(currentBoard, yourColor, previousColumn, makeMove) {
      helperMethods.setGameStatus('Waiting on ' + yourColor + '...');
      setTimeout(function() {
        //decide if chip dropping animation should play
        var maxMillisecondsToAnimateChipDropping = 120;
        var delayEnteredByTheUser = data;
        var shouldAnimate = delayEnteredByTheUser >= maxMillisecondsToAnimateChipDropping;

        //run the ai on the board in a worker
        worker.postMessage([
          currentBoard,
          yourColor,
          moves
        ]);

        worker.onmessage = function (e) {
          var column = e.data;
          makeMove(column, shouldAnimate);
        };

      }, data);
    },
    onGameEnd: function(playAgain) {
      // the AI is always ready to play again
      playAgain();
    },
    onReset: function() {
      worker.terminate();
    }
  };
};
