function backingScale(context) {
  if ('devicePixelRatio' in window) {
    if (window.devicePixelRatio > 1) {
      return window.devicePixelRatio;
    }
  }
  return 1;
}

function moveTowards(mover, target, alpha) {
  var dx = target.x - mover.x;
  var dy = target.y - mover.y;
  mover.x += dx/2*alpha;
  mover.y += dy/2*alpha;
}

Template.documentGraph.onCreated(function () {
  var self = this;
  
  self.force = d3.layout.force();

  self.force.lineWidth = 1.5;
  self.force.strokeStyle = 'grey';


  self.force
    .gravity(0)
    .charge(0)
    .friction(0.8)
    .linkDistance(function (link) {
      var from = link.source;
      var to = link.target;
      return self.margin + Math.sqrt( Math.pow(from.w + to.w, 2) + Math.pow(from.h + to.h, 2) );
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
});

Template.documentGraph.onRendered(function () {
  var self = this;

  self.width = $(this.firstNode).width();
  self.height = $(this.firstNode).height();

  self.canvas = self.$('.document-graph-canvas')[0];
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
      //  push node into view, even fixed nodes
      if (node1.position) {

        node1.x = self.width/2 + node1.position.x;
        node1.y = self.height/2 + node1.position.y;

        return;
      }

      var offLeft = node1.x - node1.w/2 < self.margin;
      var offRight = node1.x + node1.w/2 > self.width - self.margin;
      var offTop = node1.y - node1.h/2 < self.margin;
      var offBottom = node1.y + node1.h/2 > self.height - self.margin;

      if (offLeft || offRight || offTop || offBottom) {
        node1.fixed = false;
      }

      if (offLeft  ) node1.x += (node1.w/2 - node1.x + self.margin) * alpha * self.edgeConstraintStrength;
      if (offRight ) node1.x -= (node1.x + node1.w/2 - self.width + self.margin) * alpha * self.edgeConstraintStrength;
      if (offTop   ) node1.y += (node1.h/2 - node1.y + self.margin) * alpha;
      if (offBottom) node1.y -= (node1.y + node1.h/2 - self.height + self.margin) * alpha * self.edgeConstraintStrength;      
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
        if (node1.group != node2.group) return;
        var overlapX = (node1.w + node2.w)/2 - Math.abs(node1.x - node2.x) + self.margin;
        var overlapY = (node1.h + node2.h)/2 - Math.abs(node1.y - node2.y) + self.margin;
        overlap = Math.min(overlapX, overlapY);

        if (overlapY > self.margin) { //  prevent from sliding to corner
          if (node2.x < node1.x) {
            if (!node2.fixed) node2.x -= overlap*alpha;
            if (!node1.fixed) node1.x += overlap*alpha;
          }
          else {
            if (!node2.fixed && !node2.group) node2.x += overlap*alpha;
            if (!node1.fixed) node1.x -= overlap*alpha;
          }
        }

        if (overlapX > self.margin) { //  prevent from sliding to corner
          if (node2.y < node1.y) {
            if (!node2.fixed) node2.y -= overlap*alpha;
            if (!node1.fixed) node1.y += overlap*alpha;
          }
          else {
            if (!node2.fixed) node2.y += overlap*alpha;
            if (!node1.fixed) node1.y -= overlap*alpha;
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

    self.force.nodes().forEach(function (nodeData) {
      var x = Math.round(nodeData.x - nodeData.w/2);
      var y = Math.round(nodeData.y - nodeData.h/2)
      $(nodeData.element).css({
        transform : 'translate(' + x + 'px, ' + y + 'px) '
                  + 'scale(' + nodeData.scale + ')'
      });
    });

    //  draw links
    context.beginPath();
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

      context.moveTo(
        parseInt(sx + sw/2),
        parseInt(sy  + sh/2));

      context.lineTo(
        parseInt(tx + tw/2),
        parseInt(ty + th/2));
    });
    context.closePath();

    context.lineWidth = self.force.lineWidth;
    context.strokeStyle = self.force.strokeStyle;
    context.stroke();

    
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
    if (inLinks[i].element == element
    ||  inLinks[i].element == element) {
      inLinks.splice(i, 1);
      i -= 1;
    }
  }

  for (var i=0; i<outLinks.length; i++) {
    if (outLinks[i].element == element
    ||  outLinks[i].element == element) {
      outLinks.splice(i, 1);
      i -= 1;
    }
  }
}


Template.documentGraph.events({
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

    var x = template.width/2 + (Math.random() - 0.5)*2;
    var y = template.height/2 + (Math.random() - 0.5)*2;

    if (event.nodeData.position) {
      //  counted from center
      x += event.nodeData.position.x;
      y += event.nodeData.position.y;
    }

    event.nodeData.x  = x;
    event.nodeData.y  = y;
    event.nodeData.px = template.width/2 + (Math.random() - 0.5)*2;
    event.nodeData.py = template.height/2 + (Math.random() - 0.5)*2;
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
  },
  'addgroup' : function (event, template) {
    event.stopPropagation();
    var group = event.groupId;
    event.groupNodeData.group = true;
    template.groupIdToNodeData[group] = event.groupNodeData;
    if (template.started) template.force.start();
  },
  'addgroupmember' : function (event, template) {
    //  document graph document added relevant data to node data already
    if (template.started) template.force.start();
  },
  'removegroup' : function (event, template) {
    var group = event.group;
    if (event.passed_group_layer) {
      //  capture addgroup after it has passed the group layer
      event.stopPropagation();
      delete template.groupIdToNodeData[group.id];
    }
    else {
      event.passed_group_layer = true;
    }
  },
  'removegroupmember' : function (event, template) {
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
        id : event.linkData.id,
        sourceElement : outLink.element,
        targetElement : inLink.element,
        source : outLink.document.nodeData,
        target : inLink.document.nodeData
      };
      var addLinkEvent = $.Event("addlink", { linkData : linkData });
      $(template.firstNode).trigger(addLinkEvent);
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
        id : event.linkData.id,
        sourceElement : outLink.element,
        targetElement : inLink.element,
        source : outLink.document.nodeData,
        target : inLink.document.nodeData
      };
      var addLinkEvent = $.Event("addlink", { linkData : linkData });
      $(template.firstNode).trigger(addLinkEvent);
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
      if (template.started) template.force.start();
    }
    else {
      console.log('exists...')
    }
  },
  'removeoutlink' : function (event, template) {
    event.stopPropagation();

    var sourceElement = event.linkData.element;
    for (var i=0; i<template.links.length; i++) {
      var link = template.links[i];
      //  remove link if it is part of this out link
      if (link.sourceElement == sourceElement) {
        //  remove link from cache
        template.links.splice(i, 1)[0]
        cleanInAndOutLinks(template, link.id, sourceElement);
        i -= 1;
      }
    }
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
        template.links.splice(i, 1)[0]
        cleanInAndOutLinks(template, link.id, targetElement);
        i -= 1;
      }
    }
    if (template.started) template.force.start();
  }
});

Template.documentGraphDocument.onCreated(function () {
  this.nodeData = {};
  //  in case there is some explicit positioning information
  //  if there is, use it...
  this.nodeData.position = this.data.data.position;
  this.nodeData.context = this.data.data;
  this.nodeData.groups = {};
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

Template.documentGraphDocument.onDestroyed(function () {
  var removeNodeEvent = $.Event("removenode", { nodeData : this.nodeData });
  $(this.firstNode).trigger(removeNodeEvent);
});

//  add the link's template
Template.documentGraphDocument.events({
  'addoutlink' : function (event, template) {
    event.linkData.document = template;
  },
  'addgroup, removegroup' : function (event, template) {
    // add current node data as group data so parent can track group node position
    event.groupNodeData = template.nodeData;
  },
  'addgroupmember' : function (event, template) {
    template.nodeData.groups[event.groupId] = true;
  },
  'removegroupmember' : function (event, template) {
    delete template.nodeData.groups[event.groupId];
  },
  'removeoutlink' : function (event, template) {
    event.linkData.document = template;
  },
  'addinlink' : function (event, template) {
    event.linkData.document = template;
  },
  'removeinlink' : function (event, template) {
    event.linkData.document = template;
  },
  'tap' : function (event, template) {
    template.nodeData.force.start();
  },
  'drag' : function (event, template) {
    template.nodeData.fixed = true;
    template.nodeData.px += event.dx;
    template.nodeData.py += event.dy;
    template.nodeData.force.resume();
  },
  'doubletap' : function (event, template) {
    if (template.nodeData.fixed) template.nodeData.fixed = false;
    Meteor.setTimeout(template.nodeData.force.start);
  }
});

//  on rendered
//////////////////

Template.documentGraphOutLink.onRendered(function () {
  this.linkData = {
    id : this.data.id,
    element : this.firstNode
  };
  var addOutLinkEvent = $.Event("addoutlink", { linkData : this.linkData });
  $(this.firstNode).trigger(addOutLinkEvent);
});

Template.documentGraphInLink.onRendered(function () {
  this.linkData = {
    id : this.data.id,
    element : this.firstNode
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
  var addGroupEvent = $.Event("addgroup", {groupId : this.data.id});
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