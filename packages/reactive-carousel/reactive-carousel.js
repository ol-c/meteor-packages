Template.reactiveCarousel.onCreated(function () {
  var self = this;

  self.timeCreated = new Date();

  self.scale = 1;
  self.dx = 0;
  self.dy = 0;
  self.cursor = self.data.cursor;
  self.list   = self.data.list;
  self.collection = self.data.collection;
  self.index  = self.data.startIndex;
  self.template = Template[self.data.template];
  self.items = [];
  self.addedAfterCreated = 0;
  self.firstRendered = false;
  self.lastIndexChange = new ReactiveVar();

  if (self.list) {

  }
  else if (self.cursor) {
    //  behave nicely when the cursor data gets messed with around index
    self.handle = self.cursor.observe({
      addedAt : function (doc, i, before) {
        self.items.splice(i, 0, new ReactiveVar(doc));
        if (self.firstRendered && i <= self.index) {
          self.index += 1;
          self.addedAfterCreated += 1;
        }
        self.lastIndexChange.set(Math.random());
      },
      changedAt : function (newDoc, oldDoc, i) {
        //  change item
        self.items[i].set(newDoc);
      },
      removedAt : function (oldDoc, i) {
        //  remove from items and from view
        self.items.splice(i, 1);
      },
      movedAt : function (doc, fromIndex, toIndex, before) {
        //  move the item appropriately;
        self.items.splice(toIndex, 0, self.items.splice(fromIndex, 1));
        if (self.firstRendered) {
          if (fromIndex <= self.index) {
            self.index -= 1;
            self.addedAfterCreated -= 1;
          }
          if (toIndex <= self.index) {
            self.index += 1;
            self.addedAfterCreated += 1;
          }
        }
        self.lastIndexChange.set(Math.random());
      }
    });
  } else {
    throw new Error('reactive carousel requires a cursor or a list of ids');
  }
  console.log('time to create ' + (new Date() - self.timeCreated));
});

Template.reactiveCarousel.onRendered(function () {
  var self = this;
  console.log('time to start rendering ' + (new Date() - self.timeCreated));

  var nextRenderFrame;
  var container = $(self.firstNode);

  var views = [
    insertForIndex(self.index - 1),
    insertForIndex(self.index    ),
    insertForIndex(self.index + 1)
  ];

  function insertForIndex(index, waitOnTransition) {
    function item() {
      self.lastIndexChange.get(); //  ensures re-evaluation on last index change

      var item;
      var i = index + self.addedAfterCreated;

      if (self.list) {
        item = self.collection.findOne(self.list[i]);
      }
      else if (self.items[i]) {
        item = self.items[i].get();
      }

      if (item && index == self.index && !self.firstRendered) {
        self.firstRendered = true;
        var itemChangeEvent = $.Event("itemchange", {
          item : item,
        });
        container.trigger(itemChangeEvent);
        console.log('time to first render ' + (new Date() - self.timeCreated));
      }

      return item;
    }

    var nextNode;
    if (index + self.addedAfterCreated < self.index) {
      //  if index less than current index,
      //  insert the view as the first in container
      nextNode = container[0].firstChild;
    }

    var view = Blaze.renderWithData(
      Template.reactiveCarouselSlide,
      item,
      container[0],
      nextNode,
      self.view
    );
    
    if (waitOnTransition) {
      $(view.firstNode()).css('visibility', 'hidden');
    }

    return view;
  }

  self.move = function (direction) {
    self.render(true, function () {
      self.scale = 1;
      self.dx = 0;
      self.dy = 0;

      //  only advance the view if there is
      //  an item for the new current index
      var nextItem;
      if (self.cursor) {
        nextItem = self.items[self.index + direction];
        if (nextItem) nextItem = nextItem.get();
      }
      else if (self.list) {
        nextItem = self.collection.findOne(self.list[self.index + direction]);
      }
      if (nextItem) {
        //  increment index and add new view in proper direction
        self.index += direction;
        //  insert and manage views
        var view = insertForIndex(self.index + direction - self.addedAfterCreated, true);
        if (direction < 0) {
          Blaze.remove(views.pop());
          views.unshift(view);
        }
        else {
          Blaze.remove(views.shift());
          views.push(view);
        }

        var itemChangeEvent = $.Event("itemchange", {
          item : nextItem,
          index : self.index
        });
        container.trigger(itemChangeEvent);
      }
    });
  }

  var lastDx;
  var lastDy;
  var lastScale;

  self.render = function (animating, beforeRender, force) {
    if (animating) self.animating = true;
    var frame = requestAnimationFrame(function () {
      if (beforeRender) beforeRender();
      if (nextRenderFrame !== frame) {
        return; //  no need to render unless most recent call
      }
      if (!force //  allow same styles to be applied for resize
      &&  lastDx    === parseInt(self.dx)
      &&  lastDy    === parseInt(self.dy)
      &&  lastScale === Math.round(self.scale*1000)/1000) {
        //  no need to render. in fact if we do, the
        //  transitionend will not be triggered
        self.animating = false;
        return;
      }
      if (animating) container.addClass('animating');
      else container.removeClass('animating');
      var children = container.children('.reactive-carousel-slide');
      var width = container.width();

      for (var i=0; i<children.size(); i++) {
        var style = {
          webkitTransformOrigin : '0 0',
          webkitTransform : 'translate('  + parseInt((-width + width*i)*self.scale + self.dx) + 'px, '+ parseInt(self.dy) + 'px) ' 
                          + 'scale(' + (Math.round(self.scale*1000)/1000) + ')'
        }
        if (self.animating) {
          style.webkitTransition = "300ms ease-out";
        }
        $(children[i]).css(style);
      }

      //  ensure all children are visible
      $(children[1]).one('transitionend', function () {
        self.animating = false;
        container.children().css('-webkit-transition', 'none');
        container.removeClass('animating');
        children.css('visibility', 'visible');
      });

      lastDx = parseInt(self.dx);
      lastDy = parseInt(self.dy);
      lastScale = Math.round(self.scale*1000)/1000;
    });
    nextRenderFrame = frame;
  }

  //  render so initial transform is set
  self.render();
  $(container).on('elementresize', function () {
    self.render(false, false, true);
  });

  console.log('time to finish rendering ' + (new Date() - self.timeCreated));
});

Template.reactiveCarousel.onDestroyed(function () {
  if (this.handle) this.handle.stop();
})

Template.reactiveCarousel.events({
  'tap' : function (event, template) {
    var carousel = $(template.firstNode);

    //  do not tap if animating
    if (template.animating) return;

    var offset = carousel.offset();

    var offX = event.x - (offset.left + template.dx);
    var offY = event.y - (offset.top  + template.dy);

    if (template.scale > 1) {
      template.dx = 0;
      template.dy = 0;
      template.scale = 1;
    }
    else {
      template.dx -= (offX * (2 - template.scale));
      template.dy -= (offY * (2 - template.scale));
      template.scale = 2;
    }

    template.render(true);
  },
  'drag' : function (event, template) {
    var carousel = $(template.firstNode);

    if (template.animating) return;

    template.dx += event.dx;
    template.dy += event.dy;

    var exposedDirection = template.dx / Math.abs(template.dx);
    var exposedItem;

    if (template.cursor) {
      exposedItem = template.items[template.index - exposedDirection];
      if (exposedItem) exposedItem = exposedItem.get();
    }
    else if (template.list){
      exposedItem = template.collection.findOne(template.list[template.index - exposedDirection]);
    }

    if (exposedItem) {
      //  there is an element in the space that is exposed
    }
    else {
      //  if draging off the edge, only drag half distance
      template.dx -= event.dx/2;
    }

    var height = carousel.height();
    var width = carousel.width();
    var minY = height - height*template.scale;
    var maxY = 0;
    if (template.scale === 1) {
      template.dy = Math.max(minY, Math.min(maxY, template.dy));
    }
    else if (template.scale > 1) {
      //  if beyond bounds, only drag half the distance
      if (template.dy >= maxY || template.dy <= minY) {
        template.dy -= event.dy/2;
      }
    }
    else {
      if (template.dy < 0) {
        template.dy = 0;
      }
      if (template.dy + height * template.scale > height) {
        template.dy = height * (1 - template.scale);
      }
    }
    //  don't let us see before prev or after last
    if (template.dx > width * template.scale) {
      template.dx = width * template.scale;
    }
    if (template.dx < width - 2*width*template.scale) {
      template.dx = width - 2*width*template.scale;
    }
    template.render();
  },
  'pinch .reactive-carousel-slide' : function (event, template) {
    var carousel = $(template.firstNode);

    //  do not pinch if animating
    if (template.animating) return;

    var offset = carousel.offset();

    var offX = event.x - (offset.left + template.dx);
    var offY = event.y - (offset.top + template.dy);

    template.dx -= (offX * (event.scale - 1));
    template.dy -= (offY * (event.scale - 1));

    template.scale *= event.scale;
    if (template.scale < 1/3) {
      template.scale = 1/3;
    }

    var width = carousel.width();

    //  don't let us see before prev or after last
    if (template.dx > width * template.scale) {
      template.dx = width * template.scale;
    }
    if (template.dx < width - 2*width*template.scale) {
      template.dx = width - 2*width*template.scale;
    }

    template.render();
  },
  'touch' : function (event, template) {
    template.animating = false;

    var carousel = $(template.firstNode);

    //  do not drop if animating
    if (template.animating) return;

    var width = carousel.width() * template.scale;
    var height = carousel.height() * template.scale;

    if (template.dx > carousel.width()/2) {
      template.move(-1);
    }
    else if (template.dx + width < carousel.width()/2) {
      template.move(1);
    }
    else {
      if (template.scale < 1.1) {
        //  only keep significant scales above scale 1 (so edge drag behavior stays nice)
        template.scale = 1;
      }
      template.dx = Math.max(width/template.scale - width, Math.min(0, template.dx));
      template.dy = Math.max(height/template.scale - height, Math.min(0, template.dy));

      template.render(true);
    }
  }, 
  'drop' : function (event, template) {
    var carousel = $(template.firstNode);

    //  do not drop if animating
    if (template.animating) return;

    var width = carousel.width() * template.scale;
    var height = carousel.height() * template.scale;

    if (template.dx > carousel.width()/2) {
      template.move(-1);
    }
    else if (template.dx + width < carousel.width()/2) {
      template.move(1);
    }
    else {
      if (template.scale < 1.1) {
        //  only keep significant scales above scale 1 (so edge drag behavior stays nice)
        template.scale = 1;
      }
      template.dx = Math.max(width/template.scale - width, Math.min(0, template.dx));
      template.dy = Math.max(height/template.scale - height, Math.min(0, template.dy));

      template.render(true);
    }
  },
  'mousewheel' : function (event, template) {
    var dragEvent = $.Event('drag', {
      dx : -event.originalEvent.deltaX,
      dy : -event.originalEvent.deltaY
    });

    //$(event.target).trigger(dragEvent);
  },
  'swiperight' : function (event, template) {
    if (template.animating) return;
    else template.move(-1);
  },
  'swipeleft' : function (event, template) {
    if (template.animating) return;
    else template.move(1);
  },
});
