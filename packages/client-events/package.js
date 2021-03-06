Package.describe({
  name: 'jasonford:client-events',
  version: '0.5.0',
  // Brief, one-line summary of the package.
  summary: 'triggers more developer friendly client touch events',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/ol-c/meteor-packages.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.1.0.3');
  api.use([
    'jquery'
  ], 'client');
  api.addFiles([
    'client-events.js',
    'client-events.css'
  ], 'client');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('jasonford:client-events');
  api.addFiles('client-events-tests.js');
});
