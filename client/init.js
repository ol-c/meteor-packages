
//  FOR CAROUSEL
var carouselCollection = new Mongo.Collection(null);

for (var i=1; i<=1000; i++) {
  carouselCollection.insert({
    index : i
  });
}

Template.registerHelper('carouselCursor', function () {
  return carouselCollection.find({}, {sort : {index : 1}});
});


//  FOR SCROLL
var scrollCollection = new Mongo.Collection(null);

for (var i=0; i<=10; i++) {
  scrollCollection.insert({
    index : i
  });
}

Meteor.setTimeout(function () {
  for (var i=11; i<=20; i++) {
    scrollCollection.insert({
      index : i
    });
  }
}, 3000);

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