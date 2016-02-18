Meteor.publish('agents', function (_id) {
  return Agents.find({
    $or : [{active:true}, {_id:_id}]
  });
});

Agents.allow({
  insert  : function () {return true;},
  update  : function () {return true;}
});