//  prevent rubber band overscroll behavior on mobile browsers
//  allows native default behavior for elements inside body, but not
//  for the scrolling the page itself

$(function () {
  var onScroll = true;
  $('html').on('touchstart', function (event) {
    var target = event.target;
    while (target && target.style) {
      //  must be scrollable and have room to
      //  scroll to allow native scrolling
      var scrolling = false;
      if ($(target).css('overflow-y') == 'scroll' &&  target.scrollHeight > $(target).height()) {
        var max = target.scrollHeight - $(target).height() - 1;
        var min = 1;
        $(target).scrollTop(Math.min(max, Math.max(min, $(target).scrollTop())))
        scrolling = true;
      }
      if ($(target).css('overflow-x') == 'scroll' &&  target.scrollWidth > $(target).width()) {
        var max = target.scrollWidth - $(target).width() - 1;
        var min = 1;
        $(target).scrollLeft(Math.min(max, Math.max(min, $(target).scrollLeft())))
        scrolling = true;
      }
      if (scrolling) return;
      target = target.parentNode;
    }
    onScroll = false;
  });

  $('html').on('touchend', function (event) { onScroll = true; });

  $('html').on('touchmove', function (event) {
    if (onScroll) {}
    else {
      event.preventDefault();
    }
  });
});