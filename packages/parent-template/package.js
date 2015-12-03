Package.describe({
  name: 'jasonford:parent-template',
  version: '0.0.3',
  // Brief, one-line summary of the package.
  summary: 'extend template instance with method parentTemplate() to get the parent template',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.0.2');
  api.use([
    'ecmascript',
    'blaze'
  ], 'client');
  api.addFiles('parent-template.js', 'client');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('jasonford:parent-template');
  api.addFiles('parent-template-tests.js');
});
