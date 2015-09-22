Template.reactiveScroll.onRendered(function () {
  var self = this;
  var container = $(self.firstNode);
  var indicator = $(self.firstNode).children().last();
  var filling = false;

  self.cursor = self.data.cursor;
  self.renderedViews = [];
  self.container = container;
  var items = [];

  var index = 0;
  var lastTop = 0;

  function item(index) {
    return function () {
      //  binds to cursor
        if (items[index] === undefined) {
          items[index] = new ReactiveVar();
        }
        return items[index].get();
    }
  }

  self.fill = function () {
    if (filling) return;
    var d = indicator.offset().top - container.offset().top;
    var nextNode = indicator[0];
    if (d < container.height() * 2) {
      filling = true;
      //  only add the next one if the current one is available
      if (items[index]) {
        var i = index;
        index += 1;
        insert(i, nextNode, function () {
          filling = false;
          self.fill();
        });
      }
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
      currentAnimationFrame = null
    }
    if (currentAnimationFrame) {
      perform();
    }
    else {
      currentAnimationFrame = requestAnimationFrame(perform);
    }
  }

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
});

Template.reactiveScroll.onDestroyed(function () {
  this.handle.stop();
})

Template.reactiveScrollItem.onRendered(function () {

})

Template.reactiveScroll.events({
  'touchmove': function (event, template) {
    template.fill();
  },
  'scroll' : function (event, template) {
    template.fill();
  }
});