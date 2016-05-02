Package.describe({
  name: 'mongo-input',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'simply add mong-id="" and mongo-field="reference.to.field" to an input and that reference will be set on change.',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.1');
  api.use('ecmascript');
  api.addFiles('mongo-input.js');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('mongo-input');
  api.addFiles('mongo-input-tests.js');
});
