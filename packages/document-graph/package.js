Package.describe({
  name: 'jasonford:document-graph',
  version: '0.4.0',
  // Brief, one-line summary of the package.
  summary: 'simply view a force directed graph of colletion data with custom templates',
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
    'templating',
    'reactive-var',
    'd3js:d3@3.0.0',
    'jasonford:client-events@0.0.1',
    'jasonford:element-resize-event@0.0.1'
  ], 'client');
  api.addFiles([
    'document-graph.html',
    'document-graph.css',
    'document-graph.js'
  ], 'client');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('jasonford:document-graph');
  api.addFiles('document-graph-tests.js');
});
