Meteor.methods({
  initializeAgent : function (_id) {
    Agents.update({_id : _id}, {
      _id : _id,
      x : 0,
      y : 0,
      active : true,
      lastHeartbeat : Date.now(),
      created : Date.now(),
      selection : [],
      name : 'anonymous',
      color : 'purple'
    }, {
      upsert : true
    });
  },
  moveAgent : function (_id, position) {
    var agent = Agents.findOne(_id);
    if (!agent) {
      Meteor.call('initializeAgent', _id);
    }
    if (agent.state == 'startselect') {
      Agents.update(_id, {
        $set : {
          state : 'selecting',
          selection : []
        }
      });
    }
    else if (agent.state == 'selecting') {
      Agents.update(_id, {
        $push : {selection : [position.x, position.y]}
      });
    }
    Agents.update(_id, {
      $set : {
        x : position.x,
        y : position.y,
      }
    });
  },
  agentState : function (_id, state) {
    var set = {state : state};
    if (state == '') {
      set.selection = [];
    }
    Agents.update(_id, {$set : set});
  },
  agentInput : function (_id, input) {
    Agents.update(_id, {
      $set : {
        input : input
      }
    });
  },
  heartbeatAgent: function (_id) {
    var heartbeatTime = Date.now();
    Agents.update(_id, {
      $set : {
        active : true,
        lastHeartbeat : heartbeatTime
      }
    });
  }
});

//  set clients with old heatbeat as inactive
if (Meteor.isServer) {
  Meteor.setInterval(function () {
    Agents.update({
      active : true,
      lastHeartbeat : { $lt : Date.now() - 10000}
    }, {
      $set : { active : false }
    });
  }, 3000);
}