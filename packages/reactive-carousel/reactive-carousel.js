Template.reactiveCarousel.onRendered(function () {
  var self = this;

  self.scale = 1;
  self.dx = 0;
  self.dy = 0;
  self.cursor = self.data.cursor;
  self.index  = self.data.startIndex;
  self.template = Template[self.data.template];
  self.items = [];

  var nextRenderFrame;
  var container = $(self.firstNode);
  var firstRendered = false;
  var addedAfterRender = 0;

  var lastIndexChange = new ReactiveVar();

  var views = [
    insertForIndex(self.index - 1),
    insertForIndex(self.index    ),
    insertForIndex(self.index + 1)
  ];

  //  behave nicely when the cursor data gets messed with around index
  self.handle = self.cursor.observe({
    addedAt : function (doc, i, before) {
      self.items.splice(i, 0, new ReactiveVar(doc));
      if (firstRendered && i <= self.index) {
        self.index += 1;
        addedAfterRender += 1;
      }
      lastIndexChange.set(Math.random());
    },
    changedAt : function (newDoc, oldDoc, i) {
      //  change item
      self.items[i].set(newDoc);
    },
    removedAt : function (oldDoc, i) {
      //  remove from items and from view
      self.items[i].splice(i, 1);
    },
    movedAt : function (doc, fromIndex, toIndex, before) {
      //  move the item appropriately;
      self.items.splice(toIndex, 0, self.items.splice(fromIndex, 1));
      if (firstRendered) {
        if (fromIndex <= self.index) {
          self.index -= 1;
          addedAfterRender -= 1;
        }
        if (toIndex <= self.index) {
          self.index += 1;
          addedAfterRender += 1;
        }
      }
      lastIndexChange.set(Math.random());
    }
  });

  function insertForIndex(index, waitOnTransition) {
    function item() {
      lastIndexChange.get();
      if (self.items[index + addedAfterRender]) {
        if (index == self.index) {
          firstRendered = true;
        }
        return self.items[index + addedAfterRender].get();
      }
    }

    var nextNode;
    if (index + addedAfterRender < self.index) {
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
      container.one('transitionend', function (event) {
        $(view.firstNode()).css('visibility', 'visible');
      });
    }

    return view;
  }

  self.move = function (direction) {

    self.scale = 1;
    self.dx = 0;
    self.dy = 0;

    //  only advance the view if there is
    //  an item for the new current index
    var nextItem = self.items[self.index + direction];
    if (nextItem && nextItem.get()) {
      //  increment index and add new view in proper direction
      self.index += direction;
      //  insert and manage views
      var view = insertForIndex(self.index + direction - addedAfterRender, true);
      if (direction < 0) {
        Blaze.remove(views.pop());
        views.unshift(view);
      }
      else {
        Blaze.remove(views.shift());
        views.push(view);
      }
    }

    container.addClass('animating');
    self.render(true);
  }

  var lastDx = self.dx;
  var lastDy = self.dy;
  var lastScale = self.scale;

  self.render = function (animating) {
    var frame = requestAnimationFrame(function () {
      if (nextRenderFrame !== frame) {
        return; //  no need to render unless most recent call
      }
      if (lastDx    === self.dx
      &&  lastDy    === self.dy
      &&  lastScale === self.scale) {
        //  no need to render. in fact if we do, the
        //  transitionend will not be triggered
        return;
      }
      if (animating) container.addClass('animating');
      else container.removeClass('animating');
      container.css({
        webkitTransformOrigin : '0 0',
        webkitTransform : 'translate('  + self.dx + 'px, '+ self.dy + 'px) ' 
                        + 'scale(' + self.scale + ')'
      });

      lastDx = self.dx;
      lastDy = self.dy;
      lastScale = self.scale;
    });
    nextRenderFrame = frame;
  }

  container.on('transitionend', function () {
    container.removeClass('animating');
  });

});

Template.reactiveCarousel.onDestroyed(function () {
  this.handle.stop();
})

Template.reactiveCarousel.events({
  'tap' : function (event, template) {
    var carousel = $(template.firstNode);

    //  do not tap if animating
    if (carousel.hasClass('animating')) return;

    var offset = carousel.offset();

    var offX = (event.x - offset.left);
    var offY = (event.y - offset.top );

    if (template.scale > 1) {
      template.dx = 0;
      template.dy = 0;
      template.scale = 1;
    }
    else {
      template.scale = 2;
      template.dx += (offX * (1 - 2));
      template.dy += (offY * (1 - 2));
    }

    template.render(true);
  },
  'drag' : function (event, template) {
    var carousel = $(template.firstNode);

    //  do not drag if animating
    if (carousel.hasClass('animating')) return;

    template.dx += event.dx;
    template.dy += event.dy;

    var exposedDirection = template.dx / Math.abs(template.dx);
    var exposedItem = template.items[template.index - exposedDirection];
    if (exposedItem && exposedItem.get()) {
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
  'pinch' : function (event, template) {
    var carousel = $(template.firstNode);

    //  do not pinch if animating
    if (carousel.hasClass('animating')) return;

    var offset = carousel.offset();

    var offX = (event.x - offset.left);
    var offY = (event.y - offset.top );

    template.dx += (offX * (1 - event.scale));
    template.dy += (offY * (1 - event.scale));

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
  'drop' : function (event, template) {
    var carousel = $(template.firstNode);

    //  do not drop if animating
    if (carousel.hasClass('animating')) return;

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
  'swiperight' : function (event, template) {
    template.move(-1);
  },
  'swipeleft' : function (event, template) {
    template.move(1);
  },
});