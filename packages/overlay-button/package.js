Package.describe({
  name: 'jasonford:overlay-button',
  version: '0.3.8',
  // Brief, one-line summary of the package.
  summary: 'simple utility for creating buttons that produce overlays, and a convenient way to remove them',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.0.2');
  api.use([
    'templating',
    'ecmascript',
    'reactive-var',
    'jasonford:client-events@0.0.1'
  ], 'client');
  api.addFiles([
    'overlay-button.html',
    'overlay-button.js',
    'overlay-button.css'
  ], 'client');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('jasonford:overlay-button');
  api.addFiles('overlay-button-tests.js');
});
