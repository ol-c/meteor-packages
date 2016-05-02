var loaded = {};

Template.registerHelper('spinnerThen', function (src, retries, retryTime) {
  //  set default retry time (milliseconds)
  if (!retryTime) {
     retryTime = 300;
  }
  if (!retries) {
    retries = 0;
  }
  if (loaded[src]) {
   return loaded[src].get();
  }
  else {
    loaded[src] = ReactiveVar('/packages/jasonford_spinner-then/spinner.svg');
    var image = new Image();
    var tries = 0;
    image.addEventListener('load', function () {
      loaded[src].set(src);
    });
    image.addEventListener('error', function () {
      tries += 1;
      if (tries < retries) {
         Meteor.setTimeout(function () {
           image.src = '/packages/jasonford_spinner-then/spinner.svg?time=' + Date.now();
           Meteor.setTimeout(function () {
             image.src = src;
           });
         }, retryTime)
      }
      else {
        loaded[src].set('/packages/jasonford_spinner-then/error.svg');
      }
    });
    image.src = src;
    return loaded[src].get();
  }
});
