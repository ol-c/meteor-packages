Package.describe({
  name: 'transitions',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'transition between templates and contexts',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.1');
  api.use(['ecmascript', 'templating'], 'client');
  api.addFiles('transitions.js');
  api.addFiles('transitions.css');
  api.addFiles('transitions.html');
  api.export("transition")
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('transitions');
  api.addFiles('transitions-tests.js');
});
