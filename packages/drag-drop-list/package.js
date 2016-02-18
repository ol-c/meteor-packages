Package.describe({
  name: 'jasonford:drag-drop-list',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.1');
  api.use([
    'ecmascript',
    'templating',
    'jasonford:client-events@0.0.1'
    ], 'client');
  api.addFiles([
    'drag-drop-list.html',
    'drag-drop-list.css',
    'drag-drop-list.js'
  ], 'client');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('jasonford:drag-drop-list');
  api.addFiles('drag-drop-list-tests.js');
});
