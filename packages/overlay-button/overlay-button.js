var overlayButtonOverlay = new Meteor.Collection(null);

Template.body.helpers({
  overlayButtonOverlay : function () {
    return overlayButtonOverlay.find();
  }
});

Template.overlayButton.onCreated(function () {
  var self = this;
  this.data.active = new ReactiveVar(false);
  this.autorun(function () {
    overlayButtonOverlay.find().observe({
      removed : function (oldDoc) {
        if (oldDoc._id === self.data._id) {
          self.data.active.set(false);
        }
      }
    })
  });
});

//  trigger window taps on topmost overlay to get rid of it
Meteor.startup(function() {
  $(window).on("tap", function(event) {
    var overlay = $(event.target).closest('.overlay-button-overlay');
    if ($(event.target).closest('.overlay-button-back').size() === 1) {
      var id = overlay.attr('data-id');
      overlayButtonOverlay.remove(id);
    }    
    //  if there are no overlays, then remove all except the one that was pressed
    if (overlay.size() === 0) {
      $('.overlay-button-overlay').each(function (index, element) {
        var id = $(element).attr('data-id');
        if (event.overlayButtonId != id) {
          overlayButtonOverlay.remove(id);
        }
      });
    }
    else { // if tap through to an overlay, remove all above it
      overlay.nextAll('.overlay-button-overlay').each(function (index, element) {
        overlayButtonOverlay.remove($(element).attr('data-id'));
      });
    }
  });
});

Template.overlayButton.events({
  'tap' : function (event, template) {
    var id = template.data._id;
    if (id == undefined || overlayButtonOverlay.findOne(id) == undefined) {
      id = overlayButtonOverlay.insert(template.data);
      template.data._id = id;
      template.data.active.set(true);
      event.overlayButtonId = id;
    }
    else {
      overlayButtonOverlay.remove(id);
      template.data.active.set(false);
    }
  }
});