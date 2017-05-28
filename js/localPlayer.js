var LocalPlayer = function(helperMethods, data) {

	var chipColor;

	function hoverChip(e) {
		if (playerCanDropChips === false) {
			return false;
		}

		var offset = $('canvas').offset();
		var xPos = (e.pageX - offset.left);
		var image = new Image();

		//Set the correct color chip to draw
		image = chipColor === "red" ? redchip : bluechip;

		//actual board width and height
		//bw bh are the "initial" size of the canvas or
		//whatever idk
		var w = chips.get(0).scrollWidth;

		//draw the image of the chip to be dropped
		for (var i = 1; i < 8; i++) {
			if (xPos > ((i - 1) * (w / 7)) && xPos < (i * (w / 7)) && winner === false) {
				chipCanvas.clearRect(0, -(bh / 6), bw, (bh / 6));
				chipCanvas.drawImage(image, ((i - 1) * (bw / 7)), -(bh / 6), (bw / 7), (bh / 6));
			}
		}
	}

	return {
		takeTurn: function(currentBoard, yourColor, previousColumn, makeMove) {

			$('canvas').off('click');
			helperMethods.allowUIChipDrop();

			//called when the mouse moves across the canvas
			$('canvas').mousemove(hoverChip);
			chipColor = yourColor;

			//Ran when user clicks on the canvas
			$('canvas').click(function(e) {

				//actual board width and height
				//bw bh are the "initial" size of the canvas or
				//whatever idk
				var w = chips.get(0).scrollWidth;

				//determine where the chip was dropped
				var offset = $(this).offset();
				var xPos = (e.pageX - offset.left);
				for (var i = 1; i < 8; i++) {
					if (((i - 1) * (w / 7)) < xPos && xPos < ((i) * (w / 7))) {
						$('canvas').off();
						helperMethods.disallowUIChipDrop();
						makeMove(i, true);
					}
				}
			});
		}
	};

};
