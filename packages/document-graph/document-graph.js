// from https://github.com/substack/point-in-polygon
function pointInPolygon (point, vs) {
  // ray-casting algorithm based on
  // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
  var xi, xj, i, intersect,
      x = point[0],
      y = point[1],
      inside = false;
  for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    xi = vs[i][0],
    yi = vs[i][1],
    xj = vs[j][0],
    yj = vs[j][1],
    intersect = ((yi > y) != (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function sqr(x) { return x * x }
function dist2(v, w) { return sqr(v[0] - w[0]) + sqr(v[1] - w[1]) }
function closestPointToLineSegment(p, v, w) {
  var l2 = dist2(v, w);
  if (l2 == 0) return;
  var t = ((p[0] - v[0]) * (w[0] - v[0]) + (p[1] - v[1]) * (w[1] - v[1])) / l2;
  if (t < 0) return;
  if (t > 1) return;
  return [ v[0] + t * (w[0] - v[0]), v[1] + t * (w[1] - v[1]) ];
}

//  for retina support of canvas
function backingScale(context) {
  if ('devicePixelRatio' in window) {
    if (window.devicePixelRatio > 1) {
      return window.devicePixelRatio;
    }
  }
  return 1;
}

function drawPath(context, path) {
  var scale = backingScale(context);
  if (path.length > 2) {
    context.moveTo(
      parseInt(path[0][0] * scale),
      parseInt(path[0][1] * scale)
    );

    for (var i=1; i<path.length; i++) {
      context.lineTo(
        parseInt(path[i][0] * scale),
        parseInt(path[i][1] * scale)
      );
    }

    context.lineTo(
      parseInt(path[0][0] * scale),
      parseInt(path[0][1] * scale)
    );
  }
}

function overlap(node1, node2) {
  var overlappingX = Math.abs(node1.x - node2.x) < (node1.w + node2.w)/2;
  var overlappingY = Math.abs(node1.y - node2.y) < (node1.h + node2.h)/2;
  return overlappingX && overlappingY;
}

function pointsOnEllipse(xAxisLength, yAxisLength, position, numPoints) {
  var points = [];
  for (var i=0; i<numPoints; i++) {
    var theta = 2*Math.PI/numPoints * i;
    var x = xAxisLength * Math.cos(theta);
    var y = yAxisLength * Math.sin(theta);
    points.push([position.x + x, position.y + y]);
  }
  return points;
}

//  TODO: this should probably be provided by the client
function nodeHull(node, padding) {
  padding = padding || 0;
  if (node.group) {
    return pointsOnEllipse(node.w + 2*padding, node.h + 2*padding, node, 8);
  }
  else {
    var d = 32 + 2*padding;
    return pointsOnEllipse(d, d, {
      x : node.x - node.w/2,
      y : node.y - node.h/2,
    }, 8);
  }
}

var activeDocument = new ReactiveVar();

function moveTowards(mover, target, alpha) {

  var dx = target.x - mover.x;
  var dy = target.y - mover.y;
  mover.x += dx*alpha;
  mover.y += dy*alpha;

  //  if overlaps, undo the change
  if (overlap(mover, target)) {
    mover.x -= dx*alpha;
    mover.y -= dy*alpha;
  }
}

Template.documentGraph.helpers({
  groupHulls : function () {
    return Template.instance().groupHulls.find();
  },
  linkCollection : function () {
    return Template.instance().linkCollection.find();
  }
});

Template.documentGraph.onCreated(function () {
  var self = this;
  
  self.force = d3.layout.force();

  self.force.lineWidth = 1.5;
  self.force.strokeStyle = 'grey';

  self.hullPadding = 8;
  self.wideHullPadding = 8;


  self.force
    .gravity(0)
    .charge(0)
    .friction(0.8)
    .linkDistance(function (link) {
      return 0;
    })
    .linkStrength(function (link) {
      return 0;
    });

  if (self.data.onCreated) {
    //  give access to the force graph
    //  so client can set options
    self.data.onCreated(self.force);
  }

  self.graph = d3.select(self.firstNode);

  self.numNodes = new ReactiveVar(0);

  self.idToInLink = {};
  self.idToOutLink = {};

  self.groupIdToNodeData = {};

  self.margin = 0;
  self.edgeConstraintStrength = 1

  self.nodes = self.force.nodes();
  self.links = self.force.links();

  self.groupHulls = new Meteor.Collection(null);
  self.linkCollection = new Meteor.Collection(null);
});

Template.documentGraph.onRendered(function () {
  var self = this;

  self.width = $(this.firstNode).width();
  self.height = $(this.firstNode).height();

  self.canvas = self.$('.document-graph-canvas')[0];
  self.svg    = self.$('.document-graph-svg')[0];
  self.canvas.width = self.width;
  self.canvas.height = self.height;
  self.canvasContext = self.canvas.getContext('2d');

  self.scaleFactor = backingScale(self.canvasContext);

  if (self.scaleFactor > 1) {
      self.canvas.width = self.canvas.width * self.scaleFactor;
      self.canvas.height = self.canvas.height * self.scaleFactor;
      // update the context for the new canvas scale
      self.canvasContext = self.canvas.getContext("2d");
  }

  $(self.canvas).css({
    width  : self.canvas.width/self.scaleFactor,
    height : self.canvas.height/self.scaleFactor,
  })


  self.force.size([self.width, self.height]);

  self.force.on("tick", function () {
    self.offset = $(self.firstNode).offset();
    var context = self.canvasContext;

    context.clearRect(0, 0, self.canvas.width, self.canvas.height);

    var alpha = self.force.alpha();

    var nodes = self.force.nodes().slice(0);
    var node = nodes.pop();

    self.nodes.forEach(function (node1) {
      if (node1.dragging) {
        return;
      }

      if (node1.position && (!node1.positionApplied || node1.position.locked || self.frozen)) {
        node1.x = node1.position.x*self.width/2 + self.width/2;
        node1.y = node1.position.y*self.height/2 + self.height/2;
        //  only use it the first time
        node1.positionApplied = true;
      }
/* allow nodes to be off screen... since messing with position will mess with the internal data of the item...
//  can do this in future, if client code is robust when dragging (checking absolute position rather than relative...)
      //  push node into view, even fixed nodes
      var offLeft   = node1.x < self.margin;
      var offRight  = node1.x > self.width - self.margin;
      var offTop    = node1.y < self.margin;
      var offBottom = node1.y > self.height - self.margin;

      if (offLeft) x = self.margin;
      if (offTop) y = self.margin;
      if (offRight) x = self.width - node1.w - self.margin;
      if (offBottom) y = self.height - node1.h - self.margin;

      if (offLeft  ) node1.x += (node1.w/2 - node1.x + self.margin) * self.edgeConstraintStrength;
      if (offRight ) node1.x -= (node1.x + node1.w/2 - self.width + self.margin) * self.edgeConstraintStrength;
      if (offTop   ) node1.y += (node1.h/2 - node1.y + self.margin) * self.edgeConstraintStrength;
      if (offBottom) node1.y -= (node1.y + node1.h/2 - self.height + self.margin) * self.edgeConstraintStrength;
*/
      node1.px = node1.x;
      node1.py = node1.y;

    });

    while (node) {
      node.overlapping.splice(0, node.overlapping.length);
      for (var i=0; i<nodes.length; i++) {
        var overlappingX = Math.abs(node.x - nodes[i].x) < (node.w + nodes[i].w)/2 + self.margin;
        var overlappingY = Math.abs(node.y - nodes[i].y) < (node.h + nodes[i].h)/2 + self.margin;
        if (overlappingX && overlappingY) {
          node.overlapping.push(nodes[i]);
        }
      }
      node = nodes.pop();
    }

    self.nodes.forEach(function (node1) {
      //  push overlapping nodes off of eachother
      node1.overlapping.forEach(function (node2) {
        //  groups and other nodes only move away from same kinds
        //  if (node1.group != node2.group) return;
        var overlapX = (node1.w + node2.w)/2 - Math.abs(node1.x - node2.x) + self.margin;
        var overlapY = (node1.h + node2.h)/2 - Math.abs(node1.y - node2.y) + self.margin;
        var overlap = Math.min(overlapX, overlapY);

        var bothGroups = node1.group && node2.group;
        var bothUnfixed = !node1.fixed && !node2.fixed;
        var moveNode1 = (!node1.fixed && !node1.group) || bothUnfixed;
        var moveNode2 = (!node2.fixed && !node2.group) || bothUnfixed;


        if (overlapY > self.margin) { //  prevent from sliding to corner
          if (node2.x < node1.x) {
            if (moveNode2) node2.x -= overlap*alpha;
            if (moveNode1) node1.x += overlap*alpha;
          }
          else {
            if (moveNode2) node2.x += overlap*alpha;
            if (moveNode1) node1.x -= overlap*alpha;
          }
        }

        if (overlapX > self.margin) { //  prevent from sliding to corner
          if (node2.y < node1.y) {
            if (moveNode2) node2.y -= overlap*alpha;
            if (moveNode1) node1.y += overlap*alpha;
          }
          else {
            if (moveNode2) node2.y += overlap*alpha;
            if (moveNode1) node1.y -= overlap*alpha;
          }
        }
      });

      //  pull nodes toward groups
      if (!node1.fixed) {
        for (var groupId in node1.groups) {
          var groupData = self.groupIdToNodeData[groupId];
          if (groupData) {
            moveTowards(node1, groupData, alpha);
          }
        }
      }
    });

    //  convex hull for groups
    var groups = {};
    for (var groupId in self.groupIdToNodeData) {
      groups[groupId] = [self.groupIdToNodeData[groupId]];
    }
    self.force.nodes().forEach(function (node) {
      for (var groupId in node.groups) {
        if (groups[groupId]) {
          groups[groupId].push(node);
        }
      }
    });
    var hulls = [];
    var wideHulls = [];
    var hullGroupIds = [];
    for (var groupId in groups) {
      //  collect all relevant vertices for group hull
      //  (corners of nodes in group)
      var groupVertices = [];
      var wideGroupVertices = [];
      groups[groupId].forEach(function (node) {
        nodeHull(node, self.hullPadding).forEach(function (corner) {
          groupVertices.push(corner);
        });
        nodeHull(node, self.wideHullPadding).forEach(function (corner) {
          wideGroupVertices.push(corner);
        });
      });
      var groupHull = d3.geom.hull(groupVertices);
      var wideGroupHull = d3.geom.hull(wideGroupVertices);
      hullGroupIds.push(groupId);
      hulls.push(groupHull);
      wideHulls.push(wideGroupHull);
    }

    //  move nodes off of hulls they are not in (use wide hulls)
    self.force.nodes().forEach(function (node) {
      //  if group and dragging is happening, then don't move group node off since we might be dragging a node
      if (node.fixed || (node.group && self.dragging)) return;
      for (var i=0; i<wideHulls.length; i++) {
        //  if on hull but not in group, move it off
        var groupId = hullGroupIds[i];
        //  TODO: check if node is in group that is in this group...
        //        if so, don't move
        var hull = wideHulls[i];
        var nodeCoord = [node.x, node.y];
        if (node !== self.groupIdToNodeData[groupId] //  node is not group for hull we are assessing
        &&  !node.groups[groupId] //  node is not in the group for current hull
        &&  pointInPolygon(nodeCoord,hull)) {
          // find point on polygon closest to node and move towards it
          var closestDistanceSquared = Infinity;
          var closestPoint = hull[0];
          for (var j=1; j<hull.length; j++) {
            var point = closestPointToLineSegment(nodeCoord, hull[j-1], hull[j]);
            if (point) {
              var d = dist2(point, nodeCoord)
              if (d < closestDistanceSquared) {
                closestDistanceSquared = d;
                closestPoint = point;
              }
            }
          }
          //  push nodes off of hull at constant rate
          var dx = closestPoint[0] - node.x;
          var dy = closestPoint[1] - node.y;
          var dist = Math.sqrt(Math.pow(dx, 2), Math.pow(dy, 2));
          //  make sure really small distances don't make a huge jump
          if (dist > 0.1) {
            node.x += Math.min(10, dx/dist) * 50 * alpha;
            node.y += Math.min(10, dy/dist) * 50 * alpha;
          }
        }
      }
    });

    var pathString = d3.svg.line()
                           .x(function (d) {return d[0]})
                           .y(function (d) {return d[1]})
                           .interpolate('basis-closed');

    for (var i=0; i<hulls.length; i++) {
      self.groupHulls.update(
        {groupId : hullGroupIds[i]},
        {$set : {hull : pathString(hulls[i]) + ' Z'}}
      );
    }

    self.force.nodes().forEach(function (nodeData) {
      var x = Math.round(nodeData.x - nodeData.w/2);
      var y = Math.round(nodeData.y - nodeData.h/2)
      $(nodeData.element).css({
        transform : 'translate(' + x + 'px, ' + y + 'px) '
                  + 'scale(' + nodeData.scale + ')'
      });
    });

    //  draw links
    self.links.forEach(function (link) {
      var source = $(link.sourceElement);
      var target = $(link.targetElement);
      var sourceOffset = source.offset();
      var targetOffset = target.offset();

      var sx = (sourceOffset.left - self.offset.left) * self.scaleFactor;
      var sy = (sourceOffset.top  - self.offset.top) * self.scaleFactor;
      var sw = source.width() * self.scaleFactor;
      var sh = source.height() * self.scaleFactor;

      var tx = (targetOffset.left - self.offset.left) * self.scaleFactor;
      var ty = (targetOffset.top  - self.offset.top) * self.scaleFactor;
      var tw = target.width() * self.scaleFactor;
      var th = target.height() * self.scaleFactor;

      self.linkCollection.update(link._id, {
        $set : {
          'source.x' : parseInt(sx + sw/2)/self.scaleFactor,
          'source.y' : parseInt(sy + sh/2)/self.scaleFactor,
          'target.x' : parseInt(tx + tw/2)/self.scaleFactor,
          'target.y' : parseInt(ty + th/2)/self.scaleFactor,
        }
      })
    });

    
  });

  self.force.start();
  self.started = true;
});

Template.documentGraph.onDestroyed(function () {
  this.force.stop();
});

function cleanInAndOutLinks(template, linkId, element) {
  var inLinks  = template.idToInLink[linkId];
  var outLinks = template.idToOutLink[linkId];

  for (var i=0; i<inLinks.length; i++) {
    if (inLinks[i].element == element) {
      var inLink = inLinks.splice(i, 1)[0];
      i -= 1;
    }
  }

  for (var i=0; i<outLinks.length; i++) {
    if (outLinks[i].element == element) {
      var outLink = outLinks.splice(i, 1)[0];
      i -= 1;
    }
  }
}


Template.documentGraph.events({
  'freeze' : function (event, template) {
    //  freeze at start
    template.frozen = true;
    template.force.start();
  },
  'unfreeze' : function (event, template) {
    //  unfreeze
    template.frozen = false;
    template.force.start();
  },
  'resize' : function (event, template) {
    template.width = $(template.firstNode).width();
    template.height = $(template.firstNode).height();
    template.$('.document-graph-canvas')
            .attr( 'width', self.width)
            .attr('height', self.height);
    template.force.size([width, height]);
  },
  'addnode' : function (event, template) {
    event.stopPropagation();

    var x = template.width/2;
    var y = template.height/2;

    if (event.nodeData.position) {
      x = event.nodeData.position.x*template.width/2 + template.width/2;
      y = event.nodeData.position.y*template.height/2 + template.height/2;
    }

    event.nodeData.x  = x;
    event.nodeData.y  = y;
    event.nodeData.px = x;
    event.nodeData.py = y;
    event.nodeData.force = template.force;

    template.nodes.push(event.nodeData);
    if (template.started) template.force.start();
  },
  'removenode' : function (event, template) {
    event.stopPropagation();

    var nodes = template.force.nodes();
    for (var i=0; i<nodes.length; i++) {
      if (nodes[i].context = event.nodeData.context) {
        nodes.splice(i, 1);
        break;
      }
    }
    if (template.started) template.force.start();
  },
  'addgroup' : function (event, template) {
    event.stopPropagation();
    var group = event.groupId;
    event.groupNodeData.group = true;
    template.groupIdToNodeData[group] = event.groupNodeData;
    if (template.started) template.force.start();
    template.groupHulls.insert({
      groupId : group,
      hull : '',
      fillColor : event.color
    });
  },
  'addgroupmember' : function (event, template) {
    //  document graph document added relevant data to node data already
    if (template.started) template.force.start();
  },
  'removegroupmember' : function (event, template) {
    if (template.started) template.force.start();
    //  document graph document added relevant data to node data already
  },
  'addoutlink' : function (event, template) {
    event.stopPropagation();

    var outLink = event.linkData;

    var inLinks = template.idToInLink[event.linkData.id] || [];
    template.idToInLink[event.linkData.id] = inLinks;

    var outLinks = template.idToOutLink[event.linkData.id] || [];
    template.idToOutLink[event.linkData.id] = outLinks;

    inLinks.forEach(function (inLink) {
      var linkData = {
        instanceId : outLink.instanceId,
        id : outLink.id,
        style :outLink.style,
        sourceElement : outLink.element,
        targetElement : inLink.element,
        source : outLink.document.nodeData,
        target : inLink.document.nodeData
      };
      if ($.contains(document, inLink.element)) {
        var addLinkEvent = $.Event("addlink", { linkData : linkData });
        $(template.firstNode).trigger(addLinkEvent);
      }
      else {
        //  unremoved straggler... clean better on remove...
      }
    });

    outLinks.push(outLink);
  },
  'addinlink' : function (event, template) {
    event.stopPropagation();

    var inLink = event.linkData;

    var inLinks = template.idToInLink[event.linkData.id] || [];
    template.idToInLink[event.linkData.id] = inLinks;

    var outLinks = template.idToOutLink[event.linkData.id] || [];
    template.idToOutLink[event.linkData.id] = outLinks;

    outLinks.forEach(function (outLink) {
      var linkData = {
        instanceId : outLink.instanceId,
        id : inLink.id,
        style : inLink.style,
        sourceElement : outLink.element,
        targetElement : inLink.element,
        source : outLink.document.nodeData,
        target : inLink.document.nodeData
      };
      if ($.contains(document, outLink.element)) {
        var addLinkEvent = $.Event("addlink", { linkData : linkData });
        $(template.firstNode).trigger(addLinkEvent);
      }
      else {
        //  unremoved straggler...  clean better on remove...
      }
    });

    inLinks.push(inLink);
  },
  'addlink' : function (event, template) {
    event.stopPropagation();

    var linkData = event.linkData;
    var exists = false;
    for (var i=0; i<template.links.length; i++) {
      var link = template.links[i];
      exists  = linkData.sourceElement == link.sourceElement
             &&  linkData.targetElement == link.targetElement;
      // if exact link already exists
      // we don't need to add a new one
      if (exists) break;
    }

    //  TODO: can check existance before this point
    //  by hashing link properties in
    //  addinlink/addoutlink handler and checking here
    if (!exists) {
      template.links.push(linkData);
      var id = template.linkCollection.insert({
        instanceId : linkData.instanceId,
        stroke : linkData.style.strokeStyle,
        source : {
          x : 0,
          y : 0
        },
        target : {
          x : 0,
          y : 0
        }
      });
      linkData._id = id;
      if (template.started) template.force.start();
    }
    else {
      console.log('exists...')
    }
  },
  'removegroup' : function (event, template) {
    var groupId = event.groupId;
    event.stopPropagation();
    delete template.groupIdToNodeData[groupId];
    if (template.started) template.force.start();
    template.groupHulls.remove({
      groupId : groupId
    });
  },
  'removeoutlink' : function (event, template) {
    event.stopPropagation();

    var sourceElement = event.linkData.element;
    for (var i=0; i<template.links.length; i++) {
      var link = template.links[i];
      //  remove link if it is part of this out link
      if (link.sourceElement == sourceElement) {
        //  remove link from cache
        template.links.splice(i, 1);
        cleanInAndOutLinks(template, link.id, sourceElement);
        i -= 1;
      }
    }
    template.linkCollection.remove({instanceId : event.linkData.instanceId});
    if (template.started) template.force.start();
  },
  'removeinlink' : function (event, template) {
    event.stopPropagation();

    var targetElement = event.linkData.element;
    for (var i=0; i<template.links.length; i++) {
      var link = template.links[i];
      //  remove link if it is part of this in link
      if (link.targetElement == targetElement) {
        //  remove link from cache
        template.links.splice(i, 1);
        cleanInAndOutLinks(template, link.id, targetElement);
        i -= 1;
      }
    }
    template.linkCollection.remove({instanceId : event.linkData.instanceId});
    if (template.started) template.force.start();
  },
  'drag' : function (event, template) {
    template.dragging = true;
  },
  'drop' : function (event, template) {
    template.dragging = false;
    if (event.droppedDocument || event.linkedDocument) {
      //  search nodes for node under the given one
      template.force.nodes().forEach(function (node) {
        if (node.template !== event.droppedDocument && node.template !== event.linkedDocument && pointInRect(event, node)) {
          var target = node.template.$('.document-graph-document').children().first();
          var receiveEventData = {};
          if (event.droppedDocument) {
            receiveEventData.document = event.droppedDocument.data.data;
            receiveEventData.template = event.droppedDocument;
          }
          else if (event.linkedDocument) {
            receiveEventData.linkedDocument = event.linkedDocument.data.data;
            receiveEventData.template = event.linkedDocument;
          }
          var receiveEvent = $.Event("receive", receiveEventData);
          target.trigger(receiveEvent);
        }
      });
    }
  }
});

function pointInRect(point, rect) {
  return rect.x - rect.w/2 < point.x && rect.x + rect.w/2 > point.x
      && rect.y - rect.h/2 < point.y && rect.y + rect.h/2 > point.y;
}


//  alt used to toggle node type focus
var altsPressed = new ReactiveVar(0);
$(document).on('keydown', function (event) {
  if (event.keyCode == 18) {
    altsPressed.set(altsPressed.get() + 1);
  }
});

Template.body.events({
  touch : function (event, template) {
    var active = activeDocument.get();
    if (!event.passedDocument && active) {
      if (!active.nodeData.forceFixed) {
        active.nodeData.fixed = false;
      }
      active.nodeData.force.start();
      activeDocument.set(undefined);
    }
  }
});

Template.documentGraphDocument.onCreated(function () {
  var self = this;
  this.nodeData = {};
  //  in case there is some explicit positioning information
  //  if there is, use it...
  this.nodeData.position = this.data.data.position;
  this.nodeData.context = this.data.data;
  this.nodeData.groups = {};
  this.isGroup = new ReactiveVar(false);

  //  keep this special data in context
  this.autorun(function () {
    currentData = Template.currentData().data;
    currentData.$active = function () {
      //  always be active
      return true;/*(self.isGroup.get()  && altsPressed.get()%2==1)
          || (!self.isGroup.get() && altsPressed.get()%2==0);*/
    };
    currentData.$focused = function () {
      return activeDocument.get() == self;
    };
  });
});

Template.documentGraphDocument.onRendered(function () {
  var template = this;
  var maxW = 64;
  var maxH = 64;
  
  var w = $(this.firstNode).width();
  var h = $(this.firstNode).height();
  var scale = Math.min(maxW/w, maxH/h);
  scale = 1;
  this.nodeData.scale = scale;
  this.nodeData.w = w * scale;
  this.nodeData.h = h * scale;
  this.nodeData.overlapping = [];
  this.nodeData.element = this.firstNode;
  this.nodeData.template = this;

  $(template.nodeData.element).on('elementresize', function (event) {
    //  reheat when element resizes
    if (event.target == template.nodeData.element) {
      //  keep contained in same width and height
      var w = $(template.firstNode).width();
      var h = $(template.firstNode).height();
      var scale = Math.min(maxW/w, maxH/h);
      scale = 1;
      template.nodeData.scale = scale;
      template.nodeData.w = $(template.firstNode).width() * scale;
      template.nodeData.h = $(template.firstNode).height() * scale;
      template.nodeData.force.resume();
    }
  });

  var addNodeEvent = $.Event("addnode", { nodeData : this.nodeData });
  $(this.firstNode).trigger(addNodeEvent);
});

Template.documentGraphDocument.helpers({
  isGroup : function () {
    return Template.instance().isGroup.get();
  }
});

Template.documentGraphDocument.onDestroyed(function () {
  var removeNodeEvent = $.Event("removenode", { nodeData : this.nodeData });
  $(this.firstNode).trigger(removeNodeEvent);
});

//  add the link's template
Template.documentGraphDocument.events({
  'lockposition' : function (event, template) {
    template.nodeData.position.locked = true;
  },
  'unlockposition' : function (event, template) {
    template.nodeData.position.locked = false;
  },
  'hold' : function (event, template) {
    template.held = true;
  },
  'reposition' : function (event, template) {
    template.nodeData.position.x = event.x;
    template.nodeData.position.y = event.y;
  },
  'hover, touch, focus' : function (event, template) {
    // set as active documnet
    if (activeDocument.get() && !activeDocument.get().nodeData.forceFixed) {
      activeDocument.get().nodeData.fixed = false;
    }
    template.nodeData.fixed = true;
    activeDocument.set(template);
    event.passedDocument = true;
  },
  'addoutlink' : function (event, template) {
    event.linkData.document = template;
  },
  'elementresize' : function (event, template) {
    template.nodeData.force.start();
  },
  'addgroup' : function (event, template) {
    template.isGroup.set(true);
  },
  'addgroup, removegroup' : function (event, template) {
    // add current node data as group data so parent can track group node position
    event.groupNodeData = template.nodeData;
  },
  'addgroupmember' : function (event, template) {
    template.nodeData.groups[event.groupId] = true;
  },
  'addinlink' : function (event, template) {
    event.linkData.document = template;
  },
  'removeinlink' : function (event, template) {
    event.linkData.document = template;
  },
  'removeoutlink' : function (event, template) {
    event.linkData.document = template;
  },
  'removegroupmember' : function (event, template) {
    delete template.nodeData.groups[event.groupId];
  },
  'touch' : function (event, template) {
    event.passedDoucument = true;
    template.nodeData.force.start();
  },
  'drag' : function (event, template) {
    template.nodeData.fixed = true;
    template.nodeData.dragging = true;
    if (template.held) {
      //  don't drag so link can drag
    }
    else {
      template.nodeData.px += event.dx;
      template.nodeData.py += event.dy;
      template.nodeData.force.resume();
    }
  },
  'drop' : function (event, template) {
    var active = activeDocument.get()
    if (active != template && !active.nodeData.forceFixed) {
      template.nodeData.fixed = false;
    }
    template.nodeData.dragging = false;
    if (template.held) {
      template.held = false;
      event.linkedDocument = template;
    }
    else {
      event.droppedDocument = template;
    }
    template.nodeData.force.resume();
  },
  'doubletap' : function (event, template) {
    Meteor.setTimeout(template.nodeData.force.start);
  },
  'fixnode' : function (event, template) {
    //  let all other events proagate past, then fix the node
    template.nodeData.force.stop();
    Meteor.setTimeout(function () {
      template.nodeData.fixed = true;
      template.nodeData.forceFixed = event.forceFixed;
      template.nodeData.force.start();
    });
  },
  'unfixnode' : function (event, template) {
    //  let all other events proagate past, then unfix the node
    template.nodeData.force.stop();
    Meteor.setTimeout(function () {
      template.nodeData.forceFixed = false;
      template.nodeData.fixed = false;
      template.nodeData.force.start();
    }, 100);
  }
});

//  on rendered
//////////////////

var uniqueIds = 0;

Template.documentGraphOutLink.onRendered(function () {
  this.linkData = {
    instanceId : uniqueIds++,
    id : this.data.id,
    element : this.firstNode,
    style : this.data.style || {}
  };
  var addOutLinkEvent = $.Event("addoutlink", { linkData : this.linkData });
  $(this.firstNode).trigger(addOutLinkEvent);
});

Template.documentGraphInLink.onRendered(function () {
  this.linkData = {
    instanceId : uniqueIds++,
    id : this.data.id,
    element : this.firstNode,
    style : this.data.style || {}
  };
  var addInLinkEvent = $.Event("addinlink", {linkData : this.linkData});
  $(this.firstNode).trigger(addInLinkEvent);
});

Template.documentGraphGroupMember.onRendered(function () {
  this.element = this.firstNode;
  var addGroupMemberEvent = $.Event("addgroupmember", {groupId : this.data.id});
  $(this.element).trigger(addGroupMemberEvent);
});

Template.documentGraphGroup.onRendered(function () {
  this.element = this.firstNode;
  var addGroupEvent = $.Event("addgroup", {
    groupId : this.data.id,
    color : this.data.color
  });
  $(this.element).trigger(addGroupEvent);
});


//  on destroyed
//////////////////

//  the removal of a link happens whenever
//  the in and/or out link is destroyed

Template.documentGraphOutLink.onDestroyed(function () {
  var removeOutLinkEvent = $.Event("removeoutlink", { linkData : this.linkData });
  $(this.linkData.element).trigger(removeOutLinkEvent);
});

Template.documentGraphInLink.onDestroyed(function () {
  var removeInLinkEvent = $.Event("removeinlink", { linkData : this.linkData });
  $(this.linkData.element).trigger(removeInLinkEvent);
});

Template.documentGraphGroupMember.onDestroyed(function () {
  var removeGroupMemberEvent = $.Event("removegroupmember", {groupId : this.data.id});
  $(this.element).trigger(removeGroupMemberEvent);
});

Template.documentGraphGroup.onDestroyed(function () {
  var removeGroupEvent = $.Event("removegroup", {groupId : this.data.id});
  $(this.element).trigger(removeGroupEvent);
});