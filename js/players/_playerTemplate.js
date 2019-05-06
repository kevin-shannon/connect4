/**
 * connect4 Player Module Template
 *
 * This is a template for a connect 4 playing object
 * It can be used to create any kind of AI, or anything.
 *
 * There is only one thing that must be implemented, and
 * that is, whenever takeTurn is called, this player
 * object must call the makeMove function with the column
 * to drop in. How you determine which column to drop in
 * is up to you.
 *
 * This template has an example of an AI that drops in a
 * random column.
 *
 * To use your player, consider an example called
 * fancyPlayer. Here's the steps you need to take to
 * hook fancyPlayer up to the rest of the game:
 *
 * 1. Rename the var TemplatePlayer below to FancyPlayer.
 * 2. Name the file fancyPlayer.js
 * 3. Import the script at the bottom of index.html, just
 *    like the other player modules that are there.
 * 4. To start a game with FancyPlayer, run the following
 *    function either as a result of a button click, or in
 *    in the development console:
 *
 *    // This will start a game between a local player,
 *    // who will go first, and a FancyPlayer, who will
 *    // go second.
 *    start(new LocalPlayer(helperMethods), new FancyPlayer(helperMethods, data));
 *
 */

var TemplatePlayer = function(helperMethods, data) {
  /** helperMethods:
   * See what methods are availible at the
   * bottom of connect4.js in its helperMethods object.
   */

  /** data:
   * the data parameter can be used to transfer any type
   * of information gathered from the user when the gamemode
   * is selected. In the case of multiplayer and
   * remotePlayer.js, it is used to transfer info about if
   * the player is the host or not, and the game number the
   * player is to join.
   */

  //
  // Place any code that should only run once, before the
  // starts, here. Also, place any functions here.
  //
  // Place any code you want to run every time this player
  // takes a turn in the takeTurn function below. It can call
  // functions placed up here.
  //

  return {
    /* REQUIRED */
    // takeTurn is the only function you must implement.

    takeTurn: function(currentBoard, yourColor, previousColumn, makeMove) {
      /* Example: an AI that drops randomly */

      // wait half a second before sending the move
      setTimeout(function() {
        // pick a random column, between 1 and 7
        var column = Math.floor(Math.random() * 7 + 1);

        // send the move.
        // set the 2nd param to true if the chip drop
        // should be fully animated.
        makeMove(column, true);
      }, 500);

      // NOTE: If the move that is sent through the makeMove
      // function fails for any reason, such as dropping in
      // a column that is full, takeTurn will be called again
      // with the same parameters.
    },

    // Run any code that you want to run before the game starts
    // here. You don't have to make changes, but do not delete this.
    // "onReady" must be run by both players to start the game.
    // this will also be ran when the game starts from a play again
    getReady: function(onReady) {
      onReady();
    },

    // called when the game ends due to win or tie
    // if this player will always be okay with playing again,
    // for example an AI, keep this as is.
    onGameEnd: function(playAgain) {
      // run this function if this player wants to play again
      playAgain();
    },

    /* OPTIONAL */
    // These are not required to be implemented, and may be
    // deleted if you so wish.

    // called when the other player wins
    winningMove: function(theMove) {},

    // called when the game is reset
    onReset: function() {},

    onPlayAgainRequest: function() {}
  };
};
