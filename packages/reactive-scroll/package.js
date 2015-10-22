Package.describe({
  name: 'jasonford:reactive-scroll',
  version: '0.2.0',
  // Brief, one-line summary of the package.
  summary: 'render templates for items in a collection on-demand as a user scrolls',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/ol-c/meteor-packages.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.1.0.3');
  api.use([
    'templating',
    'reactive-var'
  ], 'client');

  api.addFiles([
    'reactive-scroll.html',
    'reactive-scroll.css',
    'reactive-scroll.js'
  ], 'client');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('jasonford:reactive-scroll');
  api.addFiles('reactive-scroll-tests.js');
});
