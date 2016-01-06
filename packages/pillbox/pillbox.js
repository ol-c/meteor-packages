Template.pillbox.events({
  'keypress input.pillbox-pill-input' : function (event, template) {
    var input = $(event.target).val();
    var measure = template.$('pre.pillbox-pill-input');
    measure.text(input);
    $(event.target).width(measure.outerWidth());

    if (event.keyCode == 13 && input.trim() !== '') {
      if (this.onAdd) {
        $(event.target).val('');
        this.onAdd(input);
      }
    }
  },
  'keyup input.pillbox-pill-input' : function (event, template) {
    var input = $(event.target).val();
    var measure = template.$('pre.pillbox-pill-input');
    measure.text(input);
    $(event.target).width(measure.outerWidth());
    if (input == '' && event.keyCode == 8) {
      //  remove the last element in the pillbox collection
      var items = this.items.fetch();
      if (items.length) {
        this.items.collection.remove(items[items.length-1]._id);
      }
    }
  },
  touch : function (event, template) {
    Meteor.setTimeout(function () {
      template.$('input.pillbox-pill-input').focus();
    });
  }
});