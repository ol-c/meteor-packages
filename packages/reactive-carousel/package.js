Package.describe({
  name: 'jasonford:reactive-carousel',
  version: '0.6.2',
  // Brief, one-line summary of the package.
  summary: 'Fully reactive carousel that renders only the previous, current and next item of a cursor.',
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
    'reactive-var',
    'jasonford:client-events@0.0.1',
    'jasonford:element-resize-event@0.0.1'
  ], 'client');
  api.addFiles([
    'reactive-carousel.html',
    'reactive-carousel.css',
    'reactive-carousel.js'
  ], 'client');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('jasonford:reactive-carousel');
  api.addFiles('reactive-carousel-tests.js');
});
