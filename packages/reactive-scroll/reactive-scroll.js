Template.reactiveScroll.onRendered(function () {
  var self = this;
  var container = $(self.firstNode);
  var filling = false;

  self.cursor = self.data.cursor;
  self.list   = self.data.list;
  self.collection = self.data.collection;
  self.masonry = self.data.masonry;

  self.renderedViews = [];
  self.container = container;
  var items = [];

  var index = 0;
  var lastTop = 0;

  function item(index) {
    return function () {
      //  binds to cursor
      if (self.list) {
        return self.collection.findOne(self.list[index]);
      }
      else {
        if (items[index] === undefined) {
          items[index] = new ReactiveVar();
        }
        return items[index].get();
      }
    }
  }

  self.fill = function () {
    if (filling) return;
    var roomToFill = false;

    var children = container.children();
    if (children.size() == 0) {
      roomToFill = true;
    }
    else if (self.data.horizontal) {
      roomToFill = children.last().offset().left - container.offset().left < container.width()*2;
    }
    else {
      roomToFill = children.last().offset().top - container.offset().top < container.height()*2;
    }
    var nextNode;
    if (roomToFill) {
      filling = true;
      //  only add the next one if the current one is available
      if (items[index] || (self.list && self.list[index])) {
        var i = index;
        index += 1;
        insert(i, nextNode, function () {
          filling = false;
          self.fill();
        });
      }
    }
  }

  var numColumns = self.masonry;
  var columnHeights = [];
  for (var i=0; i<numColumns; i++) {
    columnHeights.push(0);
  }

  function arrange() {
    if (self.masonry) {
      function shortestColumn() {
        var shortest = 0;
        var soFar = Infinity;
        for (var i=0; i<numColumns; i++) {
          if (soFar > columnHeights[i]) {
            soFar = columnHeights[i];
            shortest = i;
          }
        }
        return shortest;
      }
      container.children(':not(.masonry-set)').each(function (index, element) {
        var shortest = shortestColumn();
        var width = Math.floor(100/self.masonry);
        $(element).css({
          position : 'absolute',
          top : columnHeights[shortest],
          width : width + '%',
          left : (width * shortest) + '%'
        }).addClass('masonry-set');

        var height = $(element).height();
        columnHeights[shortest] = columnHeights[shortest] + height;
      });
    }
  }

  function insert(i, nextNode, callback) {
    function perform() {
      var view = Blaze.renderWithData(
        Template.reactiveScrollItem,
        item(i),
        container[0],
        nextNode,
        self.view
      );
      self.renderedViews.splice(i, 0, view);
      callback();
      currentAnimationFrame = null;
      arrange();
    }
    if (currentAnimationFrame) {
      perform();
    }
    else {
      currentAnimationFrame = requestAnimationFrame(perform);
    }
  }

  if (self.list) {
    self.fill();
  }
  else {
    //  behave nicely when the cursor data gets messed with
    self.handle = self.cursor.observe({
      addedAt : function (doc, i, before) {
        if (i<index && items[i] && items[i + 1]) {
          //  push all items back by one to make room for added
          items.splice(i, 0, new ReactiveVar(doc));
          var nextNode = self.renderedViews[i].firstNode();
          insert(i, nextNode, function () {});
          index += 1;
        }
        else {
          items[i] = new ReactiveVar(doc);
          self.fill();
        }
      },
      changedAt : function (newDoc, oldDoc, i) {
        if(items[i]) items[i].set(newDoc);
      },
      removedAt : function (oldDoc, index) {
        //  remove from items and from view
        if (i < index) {
          items.splice(i, 1);
          Blaze.remove(self.renderedViews.splice(index, 1));
          index -= 1;
        }
      }
    });
  }
});

Template.reactiveScroll.onDestroyed(function () {
  if (this.handle) this.handle.stop();
})

Template.reactiveScrollItem.onRendered(function () {
});

Template.reactiveScroll.events({
  'touchmove': function (event, template) {
    template.fill();
  },
  'scroll' : function (event, template) {
    template.fill();
  }
});