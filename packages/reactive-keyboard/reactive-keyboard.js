Keyboard = {
  shiftDown   : new ReactiveVar(false),
  commandDown : new ReactiveVar(false),
  altDown     : new ReactiveVar(false),
  controlDown : new ReactiveVar(false),
};

$(document).on('keydown', function (event) {
  var code = event.keyCode;
  Keyboard.shiftDown  .set(code == 16);
  Keyboard.commandDown.set(code == 93 || code == 91);
  Keyboard.altDown    .set(code == 18);
  Keyboard.controlDown.set(code == 17);
});

$(document).on('keyup', function (event) {
  var code = event.keyCode;
  if (code == 16) {
    Keyboard.shiftDown.set(false);
  }
  else if (code == 93 || code == 91) {
    Keyboard.commandDown.set(false);
  }
  else if (code == 18) {
    Keyboard.altDown.set(false);
  }
  else if (code == 17) {
    Keyboard.controlDown.set(false);
  }
});