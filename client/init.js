
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

keepAddingCarousel();


//  FOR SCROLL
scrollCollection = new Mongo.Collection(null);
var i;

for (i=0; i<=10; i++) {
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

keepAddingScroll();


Meteor.setTimeout(function () {
  scrollCollection.insert({
    index : 2.5
  });
}, 5000);

Template.registerHelper('scrollCursor', function () {
  return scrollCollection.find({}, {sort : {index : 1}});
});

Template.randomSize.onRendered(function () {
  var self = this;
  $(self.firstNode).css({
    margin : '4px',
    background : '#EEEEEE',
    width : '100%',
    height : 16 + Math.random() * 256,
    display : 'inline-block'
  });
});