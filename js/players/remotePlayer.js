var RemotePlayer = function(helperMethods, data) {
  var peer;
  var connection;
  var hasBeenReset = false;

  helperMethods.setGameStatus("Waiting on a connection...");

  if (data.isHost) {
    peer = new Peer(generateId());
  } else {
    peer = new Peer();
  }

  console.log("Connecting to the Peer.js server..");

  peer.once("open", function() {
    console.log("Connected to Peer.js server!");
  });

  function initHost(onReady) {
    console.log("Game number: " + peer.id);
    helperMethods.setGameStatus("Your game number is " + peer.id);

    console.log("Waiting for a player to join...");
    peer.once("connection", function(conn) {
      console.log("Opponent has connected!");
      connection = conn;

      // we are ready to play
      onReady();
    });
  }

  function initJoin(onReady) {
    console.log("Connecting to other player...");
    connection = peer.connect(data.gameCode);

    connection.once("open", function() {
      console.log("Connected to opponent!");

      // we are ready to play
      onReady();
    });

    //ran if connection to host fails
    peer.once("error", function(err) {
      if (err.type === "peer-unavailable") {
        onOpponentDisconnect();
      }
    });
  }

  function onOpponentDisconnect() {
    alert("Opponent disconnected.");
    resetGame();
  }

  function sendLastMove(lastMove) {
    connection.send({
      lastMove
    });
  }

  function sendPlayAgainRequest() {
    connection.send({
      playAgainRequest: true
    });
  }

  function sendEndGame() {
    if (!connection) return;

    connection.send({
      endGame: true
    });
  }

  function openUpToReceiveData(onMove) {
    connection.on("data", function(receivedData) {
      if (receivedData.endGame && !hasBeenReset) {
        onOpponentDisconnect();
        return;
      }

      if (onMove) {
        onMove(receivedData.lastMove, true);
      }
    });
  }

  function removeOldDataReceiver() {
    if (connection) {
      connection.off("data");
    }
  }

  function waitForPlayAgainRequest(onRequest) {
    connection.on("data", function(receivedData) {
      if (receivedData.playAgainRequest) {
        helperMethods.setGameStatus("The other player wants to play again!");
        onRequest();
      }
      if (receivedData.endGame && !hasBeenReset) {
        onOpponentDisconnect();
      }
    });
  }

  function whenConnected(next) {
    if (connection) {
      onValidConnection();
    } else {
      peer.on("connection", function(conn) {
        connection = conn;
        onValidConnection();
      });
    }

    function onValidConnection() {
      if (connection.open) {
        next();
      } else {
        connection.on("open", function() {
          next();
        });
      }
    }
  }

  function generateId() {
    code = "c4-";
    var possible = "abcdefghijklmnopqrstuvwxyz";
    for (var i = 0; i < 4; i++) {
      code += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return code;
  }

  function endConnection() {
    console.log("Closing connection.");
    try {
      if (connection) {
        connection.close();
      }
      peer.destroy();
    } catch (err) {
      console.log("Error closing connection");
    }
  }

  return {
    getReady: function(onReady) {
      // runs before every game.
      // code that runs once is at the top of the file

      // wait until we are connected to the peer server
      // to connect to the other player
      if (peer.disconnected) {
        peer.once("open", () => init());
      } else {
        init();
      }

      // ensure no old data receivers were left behind
      removeOldDataReceiver();

      function init() {
        if (data.isHost) {
          initHost(readyToGo);
        } else {
          initJoin(readyToGo);
        }
      }

      function readyToGo() {
        // open up early to receive end game mesages
        openUpToReceiveData();

        onReady();
      }
    },
    takeTurn: function(currentBoard, yourColor, previousColumn, makeMove) {
      whenConnected(function() {
        sendLastMove(previousColumn);
        helperMethods.setGameStatus("Waiting on " + yourColor + "...");

        removeOldDataReceiver();
        openUpToReceiveData(makeMove);
      });
    },
    winningMove: function(theMove) {
      whenConnected(function() {
        sendLastMove(theMove);
      });
    },
    onPlayAgainRequest: function() {
      // this runs when the local player want to play again
      // tells the remote player that the local player wants to play again
      sendPlayAgainRequest();
    },
    onReset: function() {
      if (hasBeenReset) return;

      sendEndGame();

      // end game message won't get sent if you end the connection immediately
      setTimeout(() => endConnection(), 1000);

      hasBeenReset = true;
    },
    onGameEnd: function(playAgain) {
      removeOldDataReceiver();

      // if the remote player says they want to play again,
      // run the playAgain function.

      // if the local player hasn't pressed the button,
      // the status will be updated to tell them that the
      // remote player wants to play again

      // if the local player has already pressed the button
      // once the play again request is received, the game
      // will start
      waitForPlayAgainRequest(playAgain);
    }
  };
};
