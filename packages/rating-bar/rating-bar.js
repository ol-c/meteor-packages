Template.ratingBar.onCreated(function () {
  var self = this;
});

Template.ratingBar.helpers({
  rangeList : function () {
    var range = Template.instance().data.range;
    var rangeList = [];
    for (var i=0; i<range; i++) { rangeList.push(i); }
    return rangeList;
  },
  greaterThan : function (a, b) {
    return a > b;
  },
  horizontalPadding : function () {
    var range = Template.instance().data.range;
    return 100/range/10/2;
  },
  percentWidth : function () {
    var range = Template.instance().data.range;
    return 100/range - 100/range/10;
  }
});
Template.ratingBar.events({
  'touch .rating-bar-icon' : function (event, template) {
    var rating = $(event.currentTarget).prevAll().size() + 1;
    //  set to 0 if same rating pressed
    if (template.data.rating.get() == rating) {
      rating = 0;
    }
    template.data.rating.set(rating);
  }
});