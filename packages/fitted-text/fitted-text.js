function fitContent(element, options) {

    var text = $(element).contents();

    var sizer;

    function fit() {

        if (text.text().trim() == '') return;
        if (!$.contains(document, element)) return;
        text.detach();
        var text_element = $('<div>');
        text_element.css({
            position : 'relative',
            display : 'inline-block'
        });
        
        if (sizer) sizer.remove();
        text_element.append(text);
        sizer = $('<div class="sizer">');
        sizer.append(text_element);
        sizer.css({
            fontSize : 12
        });
        $(element).append(sizer);
        var text_aspect_ratio = $(text_element).width() / $(text_element).height();
        var aspect_ratio = $(element).width() / $(element).height();
        if (text_aspect_ratio > aspect_ratio) {
            $(sizer).width($(text_element).width());
            $(sizer).height($(text_element).width() / aspect_ratio);
        }
        else {
            $(sizer).height($(text_element).height());
            $(sizer).width($(text_element).height() * aspect_ratio);
        }
        while (true) {
            var w = sizer.width();
            var h = sizer.height();
            sizer.width(Math.ceil(w * 0.9));
            sizer.height(Math.ceil(h * 0.9));
            if (sizer.width() < text_element.width() || sizer.height() < text_element.height()) {
                sizer.width(Math.ceil(w));
                sizer.height(Math.ceil(h));
                break;
            }
        }
        //    the sizer is now closest aspect ratio as its parent's
        var scale = $(element).width() / sizer.width();
        text_aspect_ratio = text_element.width() / text_element.height();
        sizer.css({
            'webkitTransformOrigin': '0% 0%',
            'mozTransformOrigin': '0% 0%',
            'msTransformOrigin': '0% 0%',
            'oTransformOrigin': '0% 0%',
            'transformOrigin': '0% 0%',
            'transform' : 'scale(' + scale + ', ' + scale + ')'
        });

        var top = (sizer.height() - text_element.height())/2;
        var left = (sizer.width() - text_element.width())/2;
        var right = 'auto';
        var bottom = 'auto';
        
        if (options.rightAlign) {
          right = 0;
          left = 'auto';
        }
        else if (options.leftAlign) {
          left = 0;
        }
        
        if (options.topAlign) {
          top = 0;
        }
        else if (options.bottomAlign) {
          bottom = 0;
          top = 'auto';
        }

        text_element.css({
            position: 'absolute',
            top : top,
            left : left,
            right : right,
            bottom : bottom
        })
    }
    requestAnimationFrame(fit);
    parentChange(element, fit);
}

Template.fittedText.onRendered(function () {
  fitContent(this.firstNode, {
    topAlign : this.topAlign,
    rightAlign : this.rightAlign,
    bottomAlign : this.bottomAlign,
    leftAlign : this.leftAlign
  });
});

Template.fittedText.helpers({
  text : function () {
    return this.text;
  }
});

function parentChange(element, fn) {
    $(element).on('resize', trigger);
    
    function trigger() {
      fn(true);
    }
}
