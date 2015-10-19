Template.overlayButton.onCreated(function () {
  this.data.active = new ReactiveVar(false);
});

Template.overlayButton.events({
  touch : function (event, template) {
    function backIsTarget() {
      var back = $(event.target).closest('.overlay-button-back');
      if (back.size()) {
        var closestOverlay = $(event.target).closest('.overlay-button-overlay')[0];
        var thisOverlay    = template.$('.overlay-button-overlay').first()[0];
        return closestOverlay == thisOverlay;
      }
      return false;
    }

    var active = template.data.active.get()
    if (active) {
      //  if click is not on the overlay template, remove the overlay template
      if (!template.$('.overlay-button-overlay').children().has(event.target).size()) {
        template.data.active.set(false);
      }
      else if (backIsTarget()) {
        tempalte.data.active.set(false);
      }
    }
    else {
      template.data.active.set(true);
    }
  }
})