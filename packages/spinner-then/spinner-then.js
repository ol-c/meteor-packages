var loaded = {};

Template.registerHelper('spinnerThen', function (src) {
  if (loaded[src]) {
   return loaded[src].get();
  }
  else {
    loaded[src] = ReactiveVar('/packages/jasonford_spinner-then/spinner.svg');
    var image = new Image();
    image.addEventListener('load', function () {
      loaded[src].set(src);
    });
    image.addEventListener('error', function () {
      loaded[src].set('/packages/jasonford_spinner-then/error.svg');
    });
    image.src = src;
    return loaded[src].get();
  }
});