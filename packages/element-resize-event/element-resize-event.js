$.event.special['elementresize'] = {              
    version: '0.2.0',
    
    setup: function() {
        if (this.nodeType === 1) {
            var self = this;
            new ResizeSensor(this, function () {
              var resizeEvent = $.Event('elementresize', {});
              $(self).trigger(resizeEvent);
            });
        } else {
            throw new Error('Unsupported node type: ' + this.nodeType);
        }
    },
    
    teardown: function() {
         // TODO when element is removed...
    }
}; 