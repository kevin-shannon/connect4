var peerNum;
var RemotePlayer = function(helperMethods, data) {
  var peer;
  var connection;

  peerNum = Math.floor(Math.random() * 900) + 100;

  peer = new Peer(peerNum);

  if (data.isHost) {
    console.log("Game number: " + peerNum);
    console.log("Waiting for a player to join...");
    peer.on("connection", function(conn) {
      console.log("Connection received!");
      $("#game-status").html("");
      connection = conn;
    });
  } else {
    connection = peer.connect(data.gameCode);

    //ran if connection to host fails
    peer.on("error", function(err) {
      if (err.type == "peer-unavailable") {
        Reset();
        alert("Game does not exist.");
      }
    });
  }

  function sendLastMove(lastMove) {
    connection.send({
      lastMove
    });
  }

  function waitForMoveFromOtherPlayer(onMove) {
    connection.on("data", function(receivedData) {
      removeAllDataListeners(connection);
      var move = receivedData.lastMove;
      onMove(move, true);
    });
  }

  function whenConnected(next) {
    if (connection) {
      onValidConnection();
    } else {
      peer.on("connection", function() {
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

  function removeAllDataListeners(conn) {
    conn._events.data = new Array(0);
  }

  return {
    takeTurn: function(currentBoard, yourColor, previousColumn, makeMove) {
      whenConnected(function() {
        sendLastMove(previousColumn);
        waitForMoveFromOtherPlayer(makeMove);
      });
    },
    winningMove: function(theMove) {
      whenConnected(function() {
        sendLastMove(theMove);
      });
    },
    clear: function() {
      try {
        peer.destroy();
        if (connection) {
          connection.close();
        }
      } catch (err) {
        console.log("Error closing connection");
      }
    }
  };
};
