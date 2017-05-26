var templatePlayer = function (helperMethods, data) {


  return {
    takeTurn: function (currentBoard, yourColor, makeMove) {
      setTimeout(function() {
        var column = Math.floor((Math.random() * 7) + 1);
        makeMove(column, true);
      }, 500);
    }
  };

};
