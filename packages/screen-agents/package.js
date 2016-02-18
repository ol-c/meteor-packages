Package.describe({
  name: 'jasonford:screen-agents',
  version: '0.0.4',
  // Brief, one-line summary of the package.
  summary: 'add agent to the screen for every user',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md',
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.1');
  api.use([
    'ecmascript',
    'accounts-password'
  ]);
  api.use([
    'templating',
    'jquery',
    'reactive-var',
    'd3@1.0.0'
  ], 'client');
  api.addFiles([
    'methods.js',
    'collections.js'
  ]);
  api.addFiles('publications.js', 'server');
  api.addFiles([
    'agents.css',
    'agents.html',
    'jquery.autosizeinput.js',
    'agents.js',
  ], 'client');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('jasonford:screen-agents');
  api.addFiles('screen-agents-tests.js');
});
