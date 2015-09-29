Package.describe({
  name: 'jasonford:scaled-to-parent',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'scale any content (including flowing content like text) to fit parent',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.0.1');
  api.use('ecmascript');
  api.use([
    'templating'
  ], 'client')
  api.addFiles([
    'scaled-to-parent.html',
    'scaled-to-parent.js',
  ], 'client');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('jasonford:scaled-to-parent');
  api.addFiles('scaled-to-parent-tests.js');
});
