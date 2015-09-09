Template.reactiveCarousel.onRendered(function () {
  var self = this;

  self.scale = 1;
  self.dx = 0;
  self.dy = 0;
  self.cursor = self.data.cursor;
  self.index  = self.data.startIndex;
  self.template = Template[self.data.template];
  self.renderedViews = {};
  self.renderedItems = {};
  self.items = {};

  var nextRenderFrame;
  var container = $(self.firstNode);

  self.autorun(function () {
    //  behave nicely when the cursor data gets messed with around index
    self.cursor.observe({
      addedAt : function (doc, i, before) {
        if (i>=self.index-1 && i<=self.index+1) {
          if (self.items[i] === undefined) {
            self.items[i] = new ReactiveVar(doc);
          }
          else {
            self.items[i].set(doc);
          }
        }
      },
      changedAt : function (newDoc, oldDoc, i) {
        if(self.items[i]) {
          self.items[i].set(newDoc);
        }
      },
      removedAt : function (oldDoc, index) {
        //  remove from items and from view
        if (self.items[i]) {
          // TODO: adjust for remove
        }
      }
    });
  });

  function insertForIndex(index, waitOnTransition) {
    function item() {
      if (self.items[index] == undefined) {
        self.items[index] = new ReactiveVar(self.cursor.fetch()[index]);
      }
      return self.items[index].get();
    }

    var nextNode;
    if (index < self.index) {
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

    self.renderedViews[index] = view;
  }

  insertForIndex(self.index - 1);
  insertForIndex(self.index    );
  insertForIndex(self.index + 1);

  self.move = function (direction) {

    self.scale = 1;
    self.dx = 0;
    self.dy = 0;

    //  only advance the view if there is
    //  an item for the new current index
    var nextItem = self.items[self.index + direction];
    if (nextItem && nextItem.get()) {
      //  remove offsceen view if exists
      var oldView = self.renderedViews[self.index - direction];
      if (oldView) {
        Blaze.remove(oldView);
        delete self.renderedItems[self.index - direction];
        delete self.renderedViews[self.index - direction];
      }

      //  increment index and add new view in proper direction
      self.index += direction;
      insertForIndex(self.index + direction, true);
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