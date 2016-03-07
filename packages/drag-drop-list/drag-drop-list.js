var lastZindex = 0;

function overlappingY(element1, element2) {
  var rect1 = element1.getBoundingClientRect();
  var rect2 = element2.getBoundingClientRect();
  return !(rect1.right < rect2.left || 
           rect1.left > rect2.right)
}

Template.dragDropList.events({
  'touch' : function (event, template) {
    if (event.touchedItem) {
      var itemContainer = $(event.touchedItem.firstNode);
      var itemContent = $(event.touchedItem.firstNode).children().first();
      var co = itemContent.offset();
      var po = $(template.firstNode).offset();
      template.touchOffset = {
        x : event.x - co.left + po.left,
        y : event.y - co.top + po.top
      };
      event.stopPropagation();
    }
  },
  'drag' : function (event, template) {
    if (event.draggingItem) {
      var itemContainer = $(event.draggingItem.firstNode);
      var itemContent = $(event.draggingItem.firstNode).children().first();

      itemContent.css({
        position : 'absolute',
        zIndex : ++lastZindex,
        left : event.x - template.touchOffset.x,
        top  : event.y - template.touchOffset.y
      });

      itemContainer.addClass('dragging');
      //  move to document for positioning purposes

      // place content container in proper place in list
      var closestElement = null;
      $(template.firstNode).siblings().each(function (index, element) {
        var o = $(element).offset();
        if (event.y > o.top+$(element).height()/2) {
          closestElement = element;
        }
      });
      if (closestElement === null) {
        template.$('.drag-drop-item-container').first().before(itemContainer);
      }
      else if (closestElement != itemContainer[0]) {
        $(closestElement).after(itemContainer);
      }


      itemContainer.width(itemContent.width());
      itemContainer.height(itemContent.height());
      if (overlappingY(itemContent[0], itemContainer[0])) {
        itemContainer.addClass('overlapping');
      }
      else {
        itemContainer.removeClass('overlapping');
      }
    }
  }
});

Template.dragDropItem.onRendered(function () {
  this.itemContent = $(this.firstNode).children().first();
});

Template.dragDropItem.events({
  'touch' : function (event, template) {
    event.touchedItem = template;
  },
  'drag' : function (event, template) {
    event.draggingItem = template;
  },
  'drop' : function (event, template) {
    var itemContainer = $(template.firstNode);
    var itemContent = template.itemContent;
    
    var o = itemContent.offset();
    var rightOverlap = window.innerWidth - o.left - itemContent.width();
    if (rightOverlap < 0) {
      itemContent.css({
        left : parseFloat(itemContent.css('left')) + rightOverlap
      });
      o.left += rightOverlap;
    }
    var leftOverlap = -o.left;
    if (leftOverlap > 0) {
      itemContent.css({
        left : parseFloat(itemContent.css('left')) + leftOverlap
      });
      o.left += leftOverlap;
    }

    var bottomOverlap = window.innerHeight - o.top - itemContent.height();
    if (bottomOverlap < 0) {
      itemContent.css({
        top : parseFloat(itemContent.css('top')) + bottomOverlap
      });
      o.top += bottomOverlap;
    }
    var topOverlap = -o.top;
    if (topOverlap > 0) {
      itemContent.css({
        top : parseFloat(itemContent.css('top')) + topOverlap
      });
      o.top += topOverlap;
    }

    if (overlappingY(itemContent[0], itemContainer[0])) {
      itemContent.first().css({
        position : '',
        zIndex : ++lastZindex,
        left : '',
        top  : ''
      });
      itemContainer.css({
        width : '',
        height : ''
      });
    }
    else {
      itemContainer.css({
        width : 0,
        height : 0
      });
    }

    //  remove after check overlapp
    itemContainer.removeClass('dragging');
    itemContainer.removeClass('overlapping');
  }
})