Package.describe({
  name: 'jasonford:openjscad',
  version: '0.0.2',
  // Brief, one-line summary of the package.
  summary: 'easily add openjscad objects to your meteor project!',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.1');
  api.use('ecmascript');
  api.addFiles([
    'three.min.js',
    'canvasrenderer.js',
    'orbitcontrols.js',
    'projector.js',
    'csg.js',
    'openjscad.js',
    'threecsg.js',
    'formats.js'
  ], 'client');
  api.addAssets([
    'csg.js',
    'formats.js',
    'openjscad.js',
    'threecsg.js'
  ], 'client');
  api.export('OpenJsCad', 'client');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('jasonford:openjscad');
  api.addFiles('openjscad-tests.js');
});
