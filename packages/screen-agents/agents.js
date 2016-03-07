//  create agent as soon as the client starts

var agentId = Meteor.userId() + '_agent';

Meteor.call('initializeAgent', agentId);

//  heartbeat to keep agent active
Meteor.setInterval(function () {
  Meteor.call('heartbeatAgent', agentId);
}, 5000);


//  subscribe to active agents and own agent
Meteor.subscribe('agents', agentId);

Template.agents.onRendered(function () {
  $('#' + agentId).focus();
  $('#' + agentId).css({opacity : 0});
});

//  return agents to view
Template.agents.helpers({
  agents : function () {
    return Agents.find();
  },
  selections : function () {
    var w = window.innerWidth;
    var h = window.innerHeight;
    var selections = [];
    var pathString = d3.svg.line()
                         .x(function (d) {return d[0]})
                         .y(function (d) {return d[1]})
                         .interpolate('monotone');

    Agents.find().fetch().forEach(function (agent) {
      if (agent.selection.length > 2) {
        var stroke = 'blue';
        var fill = 'none';
        var closing = '';
        if (agent.state !== 'selecting') {
          fill = 'skyblue';
          closing = ' Z';
        }
        var screenSelection = [];
        agent.selection.forEach(function (point) {
          var screenPoint = viewToPixelUnits({x:point[0], y:point[1]});
          screenSelection.push([screenPoint.x, screenPoint.y]);
        });
        selections.push({
          d : pathString(screenSelection) + closing,
          stroke : stroke,
          fill : fill
        });
      }
    });
    return selections;
  }
});

var last = Date.now();
function firstIn(time) {
  var now = Date.now();
  var firstIn = false;
  if (now - last > time) {
    var firstIn = true;
  }
  last = now;
  return firstIn;
}

var lastPosition = {x:window.innerWidth/2,y:window.innerHeight/2};

$(window).on('mousemove', function (event) {
  //  only the first is captured when mouse over inactive window
  //  this ignores that first firing
  if (!firstIn(100)) {
    lastPosition = {
      x : event.clientX,
      y : event.clientY
    };
    Meteor.call('moveAgent', agentId, pixelToViewUnits(lastPosition));
  }
});

Template.body.events({
  'touch' : function (event, template) {
    var agent = Agents.findOne(agentId);
    var point = pixelToViewUnits(event);
    if (pointInPolygon([point.x, point.y], agent.selection)) {
      //  trigger startdragselection, then dragselection, then drop selection with data for polygon
      Meteor.call('agentState', agentId, 'dragselection');
    }
    else {
      Meteor.call('agentState', agentId, 'startselect');
      Meteor.call('moveAgent', agentId, point);
    }
  },
  'drag' : function (event, template) {
    var agent = Agents.findOne(agentId);
    if (agent.state == 'dragselection') {
      var dragselectionEvent = $.Event('dragselection', {
        tx : event.tx,
        ty : event.ty,
        sx : event.sx,
        sy : event.sy,
        dx : event.dx,
        dy : event.dy
      });
      $(event.target).trigger(dragselectionEvent);
    }
  },
  'drop' : function (event, template) {
    var agent = Agents.findOne(agentId);
    if (document.activeElement == document.body) {
      $('#' + agentId).focus();
    }
    if (agent.selection.length > 1) {
      var selectionEvent = $.Event('polygonselection', {selection : agent.selection});
      $(event.target).trigger(selectionEvent);
    }
    Meteor.call('agentState', agentId, '');
  }
});

Template.agent.onRendered(function () {
  $(this.$('.agent-input')).autosizeInput();
});

Template.agent.helpers({
  pixelPoint : function () {
    return viewToPixelUnits(this);
  },
  isActiveAgent : function () {
    return agentId == this._id;
  }
});

Template.agent.events({
  'keypress .agent-input' : function (event, template) {
    var input = $(event.target).val().trim();
    if (input == '') {
      $(event.target).val('');
    }
    if (event.keyCode == 13) {
      $(event.target).val('');
      var agentInputEvent = $.Event("agentinput", {
        agentId : agentId,
        input : input,
        x : lastPosition.x,
        y : lastPosition.y
      });
      $(event.target).trigger(agentInputEvent);
    }
    if (input == '') {
      $('#' + agentId).css({opacity : 0});
    }
    else {
      $('#' + agentId).css({opacity : 1});
    }
  },
  'keyup .agent-input' : function (event, template) {
    var input = $(event.target).val();
    Meteor.call('agentInput', agentId, input);
    if (input == '') {
      $('#' + agentId).css({opacity : 0});
    }
    else {
      $('#' + agentId).css({opacity : 1});
    }
  }
});



//  if user is typing and active element is body
//  prevent default and focus on agent input
$(window).on('keydown', function (event) {
  if (event.keyCode == 9
  && $(document.activeElement).hasClass('agent-input')){
    event.preventDefault(); //  stop tab from changing context
    var agentInputEvent = $.Event("agenttab", {
      agentId : agentId,
      x : lastPosition.x,
      y : lastPosition.y
    });
    $(event.target).trigger(agentInputEvent);
  }
  if (event.keyCode == 18
  && $(document.activeElement).hasClass('agent-input')){
    event.preventDefault(); //  stop tab from changing context
    var agentInputEvent = $.Event("agentalt", {
      agentId : agentId,
      x : lastPosition.x,
      y : lastPosition.y
    });
    $(event.target).trigger(agentInputEvent);
  }
  //  focus on agent if not focused on anything and not selecting anything
  if (document.activeElement == document.body
  && window.getSelection().toString() === '') {
    console.log(event);
    $('#' + agentId).focus();
  }
});

var w = window.innerWidth;
var h = window.innerHeight;
var lastChange = new ReactiveVar();

$(window).on('resize', function () {
  lastChange.set(Date.now());
  w = window.innerWidth;
  h = window.innerHeight;
})

// scale pixel point to x:[-1, 1], y:[-1, 1]
function pixelToViewUnits (point) {
  lastChange.get();
  var x = 2*point.x/w - 1;
  var y = 2*point.y/h - 1;
  return {x:x, y:y};
}

function viewToPixelUnits (point) {
  lastChange.get();
  var x = (point.x + 1)*w/2;
  var y = (point.y + 1)*h/2;
  point = {x:x, y:y};
  return point;
}