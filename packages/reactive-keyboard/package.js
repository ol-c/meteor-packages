Package.describe({
  name: 'jasonford:reactive-keyboard',
  version: '0.0.3',
  // Brief, one-line summary of the package.
  summary: 'reative variables exposed for keyboard actions',
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
    'jquery',
    'reactive-var'
  ], 'client');
  api.addFiles([
    'reactive-keyboard.js'
  ], 'client');

  api.export('Keyboard');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('jasonford:reactive-keyboard');
  api.addFiles('reactive-keyboard-tests.js');
});
