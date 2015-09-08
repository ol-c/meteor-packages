var collection = new Mongo.Collection(null);

for (var i=1; i<=10; i++) {
  collection.insert({
    index : i
  });
}

Template.registerHelper('cursor', function () {
  return collection.find({}, {sort : {index : 1}});
});