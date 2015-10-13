Package.describe({
  name: 'jasonford:no-body-scroll',
  version: '0.0.3',
  // Brief, one-line summary of the package.
  summary: 'disable scrolling and rubber band edge behavior on the body element',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/ol-c/meteor-packages.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.1.0.3');

  api.use([
    'jquery',
    'templating'
  ], 'client');

  api.addFiles([
    'no-body-scroll.html',
    'no-body-scroll.css',
    'no-body-scroll.js'
  ], 'client');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('jasonford:no-body-scroll');
  api.addFiles('no-body-scroll-tests.js');
});
