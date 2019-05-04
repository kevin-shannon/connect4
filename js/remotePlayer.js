var peerNum;
var RemotePlayer = function(helperMethods, data) {
  var peer;
  var connection;

  peerNum = generateId();
  
  peer = new Peer(peerNum);

  console.log('Connecting to the Peer.js server..');
  
  peer.on('open', function () {
    console.log('Connected to Peer.js server!');
    peerNum = peer.id;

    if (data.isHost) {
      console.log("Game number: " + peerNum);
      helperMethods.showGameNumber(peerNum);

      console.log("Waiting for a player to join...");
      peer.on("connection", function(conn) {
        console.log("Opponent has connected!");
        $("#game-status").html("");
        connection = conn;

        connection.on('close', function () {
          console.log('Opponent disconnected.');
        });
      });

    } else {
      console.log('Connecting to other player...');
      connection = peer.connect(data.gameCode);

      connection.on('open', function () {
        console.log('Connected to opponent!');
      });
  
      //ran if connection to host fails
      peer.on("error", function(err) {
        console.error('Connection failed.');
        if (err.type === "peer-unavailable") {
          Reset();
          alert("Game does not exist.");
        }
      });
    }
  });

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

  function removeAllDataListeners(conn) {
    conn._events.data = new Array(0);
  }

  function generateId() {
    code = 'c4-';
		var possible = 'abcdefghijklmnopqrstuvwxyz';
		for (var i = 0; i < 4; i++) {
			code += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return code;
  }

  return {
    getReady: function(onReady) {
      onReady();
    },
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
      console.log('Attempting to close connection...');
      try {
        if (connection) {
          connection.close();
        }
        peer.destroy();
      } catch (err) {
        console.log("Error closing connection");
      }
    }
  };
};
