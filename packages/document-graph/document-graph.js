Template.documentGraph.onCreated(function () {
  var self = this;
  
  self.force = d3.layout.force();

  self.force
    .gravity(0)
    .charge(0)
    .friction(0.8)
    .linkDistance(function (link) {
      var from = link.source;
      var to = link.target;
      return self.margin + Math.sqrt( Math.pow(from.w + to.w, 2) + Math.pow(from.h + to.h, 2) );
    });

  self.graph = d3.select(self.firstNode);

  self.numNodes = new ReactiveVar(0);

  self.idToInLink = {};
  self.idToOutLink = {};

  self.margin = 20;
  self.edgeConstraintStrength = 0.1

  self.nodes = self.force.nodes();
  self.links = self.force.links();
});

Template.documentGraph.onRendered(function () {
  var self = this;

  function angleBetweenCentersAndHorizontal(a, b) {
    return Math.tan((a.y - b.y)/(a.x - b.x));
  }

  function desiredCenterDistance(a, b) {
    var r  = self.margin;
    
    //  r based on circle
    r += Math.sqrt( Math.pow(a.w/2, 2) + Math.pow(a.h/2, 2)); //  part contributed by a
    r += Math.sqrt( Math.pow(b.w/2, 2) + Math.pow(b.h/2, 2)); //  part contributed by b
/*
    //  r based on bounding ellipse with same aspect ratio as box
    var theta = angleBetweenCentersAndHorizontal(a, b);
    var arA = (a.w/a.h); // aspect ratio of a
    var arB = (b.w/b.h); // apsect ratio of b
    var sinTheta2 = Math.sin(theta)*Math.sin(theta);
    var cosTheta2 = Math.cos(theta)*Math.cos(theta);
    r += arA/Math.sqrt(arA*arA*sinTheta2 + cosTheta2); // part contributed by a
    r += arB/Math.sqrt(arB*arA*sinTheta2 + cosTheta2); // part contributed by b
*/
    return r;
  }

  function centerDistance(a, b) {
    return Math.sqrt(Math.pow(a.x - b.x,2) + Math.pow(a.y - b.y,2));
  }

  function doOverlap(a, b) {
    var l1 = { x : a.x - a.w/2 - self.margin, y : a.y + a.h/2 + self.margin};
    var r1 = { x : a.x + a.w/2 + self.margin, y : a.y - a.h/2 - self.margin};

    var l2 = { x : b.x - b.w/2 - self.margin, y : b.y + b.h/2 + self.margin};
    var r2 = { x : b.x + b.w/2 + self.margin, y : b.y - b.h/2 - self.margin};

    // If one rectangle is not on left side of other or one rectanle is not above the other
    return !(l1.x > r2.x || l2.x > r1.x) && !(l1.y < r2.y || l2.y < r1.y);
  }

  self.width = $(this.firstNode).width();
  self.height = $(this.firstNode).height();

  self.canvas = self.$('.document-graph-canvas')[0];
  self.canvas.width = self.width;
  self.canvas.height = self.height;
  self.canvasContext = self.canvas.getContext('2d');
  self.force.size([self.width, self.height]);

  self.force.on("tick", function () {
    self.offset = $(self.firstNode).offset();
    var context = self.canvasContext;
    context.clearRect(0, 0, self.canvas.width, self.canvas.height)

    var alpha = self.force.alpha();

    var overlappingNodes = [];
    var nodes = self.force.nodes().slice(0);
    var node = nodes.pop();

    

    var lastTouched = { lastTouch : -Infinity };
    self.force.nodes().forEach(function (nodeData) {
      if (nodeData.lastTouch > lastTouched.lastTouch) {
        lastTouched = nodeData;
      }
      nodeData.fixed = false;
    });
    lastTouched.fixed = true;

    while (node) {
      node.overlapping.splice(0, node.overlapping.length);
      for (var i=0; i<nodes.length; i++) {
        if (centerDistance(node, nodes[i]) < desiredCenterDistance(node, nodes[i])) {
          node.overlapping.push(nodes[i]);
        }
      }
      node = nodes.pop();
    }

    //  push overlapping nodes off of eachother
    self.nodes.forEach(function (node1) {
      //  push node into view
      if (node1.x - node1.w/2 < self.margin)               node1.x += (node1.w/2 - node1.x + self.margin) * alpha * self.edgeConstraintStrength;
      if (node1.x + node1.w/2 > self.width - self.margin)  node1.x -= (node1.x + node1.w/2 - self.width + self.margin) * alpha * self.edgeConstraintStrength;
      if (node1.y - node1.h/2 < self.margin)               node1.y += (node1.h/2 - node1.y + self.margin) * alpha;
      if (node1.y + node1.h/2 > self.height - self.margin) node1.y -= (node1.y + node1.h/2 - self.height + self.margin) * alpha * self.edgeConstraintStrength;

      node1.overlapping.forEach(function (node2) {
        // push nodes off of eachother
        var r  = desiredCenterDistance(node1, node2);
        //  subtract the distance between node centers so strength of repulsion decreases
        r -= centerDistance(node1, node2);

        var d = r*alpha/2;

        if (node2.x < node1.x) {
          if (!node2.fixed) node2.x -= d;
          if (!node1.fixed) node1.x += d;
        }
        else {
          if (!node2.fixed) node2.x += d;
          if (!node1.fixed) node1.x -= d;
        }

        if (node2.y < node1.y) {
          if (!node2.fixed) node2.y -= d;
          if (!node1.fixed) node1.y += d;
        }
        else {
          if (!node2.fixed) node2.y += d;
          if (!node1.fixed) node1.y -= d
        }
      });
    });

    self.force.nodes().forEach(function (nodeData) {
      $(nodeData.element).css({
        transform : 'translate(' + Math.round(nodeData.x - nodeData.w/2) + 'px, ' + Math.round(nodeData.y - nodeData.h/2) + 'px)'
      });
    });

    //  draw links
    context.beginPath();
    self.links.forEach(function (link) {
      var source = $(link.sourceElement);
      var target = $(link.target.element);
      var sourceOffset = source.offset();
      var targetOffset = target.offset();
      context.moveTo(
        parseInt(sourceOffset.left - self.offset.left + source.width()/2),
        parseInt(sourceOffset.top  - self.offset.top  + source.height()/2));
      context.lineTo(
        parseInt(targetOffset.left - self.offset.left + link.target.w/2),
        parseInt(targetOffset.top  - self.offset.top  + link.target.h/2));
    });

    context.lineWidth = 1;
    context.strokeStyle = 'blue';
    context.stroke();
  });

  self.force.start();
  self.started = true;
});

Template.documentGraph.onDestroyed(function () {
  this.force.stop();
});


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

    event.nodeData.x  = template.width/2// + (Math.random() - 1) * 1280;
    event.nodeData.y  = template.height/2// + (Math.random() - 1) * 1280;
    event.nodeData.px = template.width/2// + (Math.random() - 1) * 1280;
    event.nodeData.py = template.height/2// + (Math.random() - 1) * 1280;
    event.nodeData.force = template.force;

    template.nodes.push(event.nodeData);
    if (template.started) template.force.start();
  },
  'removenode' : function (event, template) {
    var nodes = template.force.nodes();
    for (var i=0; i<nodes.length; i++) {
      if (nodes[i].context = event.nodeData.context) {
        nodes.splice(i, 1);
        break;
      }
    }
  },
  'addoutlink' : function (event, template) {
    var outLink = event.linkData;

    var inLinks = template.idToInLink[event.linkData.id] || [];
    template.idToInLink[event.linkData.id] = inLinks;

    var outLinks = template.idToOutLink[event.linkData.id] || [];
    template.idToOutLink[event.linkData.id] = outLinks;

    inLinks.forEach(function (inLink) {
      var linkData = {
        sourceElement : outLink.element,
        source : outLink.document.nodeData,
        target : inLink.document.nodeData
      };
      var addLinkEvent = $.Event("addlink", { linkData : linkData });
      $(template.firstNode).trigger(addLinkEvent);
    });

    outLinks.push(outLink);
  },
  'removeoutlink' : function (event, template) {
  },
  'addinlink' : function (event, template) {
    var inLink = event.linkData;

    var inLinks = template.idToInLink[event.linkData.id] || [];
    template.idToInLink[event.linkData.id] = inLinks;

    var outLinks = template.idToOutLink[event.linkData.id] || [];
    template.idToOutLink[event.linkData.id] = outLinks;

    outLinks.forEach(function (outLink) {
      var linkData = {
        sourceElement : outLink.element,
        source : outLink.document.nodeData,
        target : inLink.document.nodeData
      };
      var addLinkEvent = $.Event("addlink", { linkData : linkData });
      $(template.firstNode).trigger(addLinkEvent);
    });

    inLinks.push(inLink);
  },
  'removeinlink' : function (event, template) {
  },
  'addlink' : function (event, template) {
    var linkData = event.linkData;
    template.links.push(linkData);
    if (template.started) template.force.start();
  }
});

Template.documentGraphDocument.onCreated(function () {
  this.nodeData = {};
});

Template.documentGraphDocument.onRendered(function () {
  var template = this;

  this.nodeData.w = $(this.firstNode).width();
  this.nodeData.h = $(this.firstNode).height();
  this.nodeData.overlapping = [];
  this.nodeData.context = this.data.data;
  this.nodeData.element = this.firstNode;
  this.nodeData.template = this;

  $(template.nodeData.element).on('elementresize', function (event) {
    //  reheat when element resizes
    if (event.target == template.nodeData.element) {
      template.nodeData.force.resume();
      template.nodeData.w = $(template.firstNode).width();
      template.nodeData.h = $(template.firstNode).height();
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
  'removeoutlink' : function (event, template) {
    event.linkData.document = template;
  },
  'addinlink' : function (event, template) {
    event.linkData.document = template;
  },
  'removeinlink' : function (event, template) {
    event.linkData.document = template;
  },
  'touch, mouseover' : function (event, template) {
    template.nodeData.lastTouch = Date.now();
  },
  'drag' : function (event, template) {
    template.nodeData.px += event.dx;
    template.nodeData.py += event.dy;
    template.nodeData.force.resume();
  },
  'doubletap' : function (event, template) {
    console.log('doubletap!!!', event);
  },
  'drop' : function (event, template) {
    
  }
});


Template.documentGraphOutLink.onRendered(function () {
  this.linkData = {
    id : this.data.id,
    element : this.firstNode
  };
  var addOutLinkEvent = $.Event("addoutlink", { linkData : this.linkData });
  $(this.firstNode).trigger(addOutLinkEvent);
});

Template.documentGraphOutLink.onDestroyed(function () {
  var removeOutLinkEvent = $.Event("removeoutlink", { linkData : this.linkData });
  $(this.firstNode).trigger(removeOutLinkEvent);
});

Template.documentGraphInLink.onRendered(function () {
  this.linkData = {
    id : this.data.id,
    element : this.firstNode
  };
  var addInLinkEvent = $.Event("addinlink", {linkData : this.linkData});
  $(this.firstNode).trigger(addInLinkEvent);
});

Template.documentGraphInLink.onDestroyed(function () {
  var removeInLinkEvent = $.Event("removeinlink", { linkData : this.linkData });
  $(this.firstNode).trigger(removeInLinkEvent);
});