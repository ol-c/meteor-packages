Package.describe({
  name: 'jasonford:fitted-text',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'Have text aesthetically fill its parent element',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.0.1');
  api.use([
    'ecmascript',
    'templating',
    'jasonford:element-resize-event@0.0.1'
  ], 'client');
  api.addFiles([
    'fitted-text.html',
    'fitted-text.js'
  ], 'client');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('jasonford:fitted-text');
  api.addFiles('fitted-text-tests.js');
});
