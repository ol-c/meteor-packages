Package.describe({
  name: 'jasonford:login-page',
  version: '0.1.3',
  // Brief, one-line summary of the package.
  summary: 'simple unstyled login page for meteor application',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/ol-c/meteor-packages.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.1.0.3');
  api.use([
    'templating',
    'jasonford:icons@0.0.1'
  ], 'client');

  api.use('accounts-base');

  api.addFiles([
    'login-page.css',
    'login-page.html',
    'login-page.js',
  ], 'client');

  api.addFiles([
    'login-page-allow.js',
  ], ['client', 'server']);
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('jasonford:login-page');
  api.addFiles('login-page-tests.js');
});
