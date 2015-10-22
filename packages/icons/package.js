Package.describe({
  name: 'jasonford:icons',
  version: '0.0.7',
  // Brief, one-line summary of the package.
  summary: 'Template for adding svg based icons. Comes with some icons.',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/ol-c/meteor-packages.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.1.0.3');
  api.use([
    'templating'
  ], 'client');

  api.addFiles([
    'icon.css',
    'icon.html',
    'icons.html',
  ], 'client');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('jasonford:icons');
  api.addFiles('icons-tests.js');
});
