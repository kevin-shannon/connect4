var peerNum;
var RemotePlayer = function(helperMethods, data) {
  var peer;
  var connection;

  function initHost (onReady) {
    console.log("Game number: " + peerNum);
    helperMethods.showGameNumber(peerNum);

    console.log("Waiting for a player to join...");
    peer.on("connection", function(conn) {
      console.log("Opponent has connected!");
      helperMethods.disallowUIChipDrop(RED);
      connection = conn;

      // we are ready to play
      onReady();

      connection.on('close', function () {
        onOpponentDisconnect();
      });
    });
  }

  function initJoin (onReady) {
    console.log('Connecting to other player...');
    connection = peer.connect(data.gameCode);

    connection.on('open', function () {
      console.log('Connected to opponent!');

      // we are ready to play
      onReady();
    });

    //ran if connection to host fails
    peer.on("error", function(err) {
      if (err.type === "peer-unavailable") {
        onOpponentDisconnect();
      }
    });
  }

  function onOpponentDisconnect() {
    console.log('Disconnected');
    alert('Lost connection to opponent.');
    exitGame();
  }

  function sendLastMove(lastMove) {
    connection.send({
      lastMove
    });
  }

  function waitForMoveFromOtherPlayer(onMove) {
    connection.once("data", function(receivedData) {
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

  function generateId() {
    code = 'c4-';
		var possible = 'abcdefghijklmnopqrstuvwxyz';
		for (var i = 0; i < 4; i++) {
			code += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return code;
  }

  function endConnection() {
    console.log('Closing connection.');
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
      helperMethods.disallowUIChipDrop('connection');

      peerNum = generateId();
      peer = new Peer(peerNum);

      console.log('Connecting to the Peer.js server..');
      
      peer.on('open', function () {
        console.log('Connected to Peer.js server!');
        peerNum = peer.id;

        if (data.isHost) {
          initHost(onReady);
        } else {
          initJoin(onReady);
        }
      });
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
      endConnection();
    }
  };
};
