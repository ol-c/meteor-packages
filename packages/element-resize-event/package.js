Package.describe({
  name: 'jasonford:element-resize-event',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'can bind to "elementresize" on DOM elements',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.0.2');
  api.use([
    'ecmascript',
    'jquery'
  ], 'client');
  api.addFiles([
    'ElementQueries.js',
    'ResizeSensor.js',
    'element-resize-event.js'
  ], 'client');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('jasonford:element-resize-event');
  api.addFiles('element-resize-event-tests.js');
});
