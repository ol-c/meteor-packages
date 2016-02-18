var currentDemo = new ReactiveVar(location.hash.slice(1));

Template.registerHelper('currentDemo', function () {
  return currentDemo.get();
});

Template.registerHelper('jsonData', function () {
  return {
    type : 'object',
    array : [
      'array item',
      123,
      {
        embeddedObject : true
      }
    ]
  };
});

Template.registerHelper('randomText', function () {
  return 'this is not yet random text';
});

Template.registerHelper('overlayData', function () {
  return {
    index : 'overlay...'
  };
});

Template.registerHelper('username', function () {
  return Meteor.user().username;
});

Template.registerHelper('equals', function (a, b) {
  return a === b;
});

Template.registerHelper('randomId', function () {
  return 'id' + Math.floor(Math.random() * 10);
});

var ratingBarRating = new ReactiveVar(0);

Template.body.helpers({
  carouselCollection : function () {
    return carouselCollection;
  },
  carouselList : function () {
    return carouselIds;
  },
  documentGraphCollection : function () {
    return documentGraphCollection.find({});
  },
  ratingBarRating : function () {
    return ratingBarRating;
  }
});

Template.randomHeightMasonry.helpers({
  height : function () {
    return (Math.random() * 126 + 64) + 'px';
  }
})

Template.body.events({
  'change select' : function  (event, template) {
    currentDemo.set($(event.target).val());
  },
  'itemchange' : function (event, template) {

  }
});

//  FOR DOCUMENT GRAPH
var documentGraphCollection = new Mongo.Collection(null);

var docs = [];
var maxRefs = 5;
var numDocs = 10

for (var i=0; i<numDocs; i++) {
  docs.push({
    index : i,
    references : []
  });
}

function randomRef() {
  return documentGraphCollection.find().fetch()[Math.floor(Math.random() * numDocs)]._id;
}

docs.forEach(function (doc) {
  documentGraphCollection.insert(doc);
});

documentGraphCollection.find().forEach(function (doc) {
  for (var i=0; i<Math.random() * maxRefs; i++) {
    documentGraphCollection.update(doc._id, {
      $push : {
        references : randomRef()
      }
    });
  }
});


//  FOR CAROUSEL
var carouselIds = [];
carouselCollection = new Mongo.Collection(null);

for (var i=1; i<=1000; i++) {
  carouselIds.push(
    carouselCollection.insert({
      index : i
    })
  );
}

Meteor.setTimeout(function () {
  carouselCollection.insert({
    index : -1
  });
}, 5000);

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
  this.data.width = (64 + Math.random() * 128) + 'px';
  this.data.height = (64 + Math.random() * 128) + 'px';
});
