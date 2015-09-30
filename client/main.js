var currentDemo = new ReactiveVar('');

Template.registerHelper('currentDemo', function () {
  return currentDemo.get();
});

Template.registerHelper('randomText', function () {
  return 'this is not yet random text';
});

Template.registerHelper('username', function () {
  return Meteor.user().username;
});

Template.registerHelper('equals', function (a, b) {
  return a === b;
});

Template.body.events({
  'change select' : function  (event, template) {
    currentDemo.set($(event.target).val());
  }
});


//  FOR CAROUSEL
carouselCollection = new Mongo.Collection(null);

for (var i=1; i<=1000; i++) {
  carouselCollection.insert({
    index : i
  });
}

Template.registerHelper('carouselCursor', function () {
  return carouselCollection.find({}, {sort : {index : 1}});
});

//  always updating
function keepAddingCarousel() {
  carouselCollection.insert({
    index : i*Math.random()
  });
  Meteor.setTimeout(keepAddingCarousel, 100);
}

//keepAddingCarousel();


//  FOR SCROLL
scrollCollection = new Mongo.Collection(null);
var i;

for (i=0; i<=100; i++) {
  scrollCollection.insert({
    index : i
  });
}

//  always updating
function keepAddingScroll() {
  scrollCollection.insert({
    index : i*Math.random()
  });
  Meteor.setTimeout(keepAddingScroll, 100);
}

//keepAddingScroll();


Meteor.setTimeout(function () {
  scrollCollection.insert({
    index : 2.5
  });
}, 5000);

Template.registerHelper('scrollCursor', function () {
  return scrollCollection.find({});
});

Template.randomSize.onCreated(function () {
  var self = this;
  this.data.width = '90%';
  this.data.height = (64 + Math.random() * 128) + 'px';
});
