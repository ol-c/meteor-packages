Package.describe({
  name: 'jasonford:rating-bar',
  version: '0.0.2',
  // Brief, one-line summary of the package.
  summary: 'horizontal rating bar for custom range. Depends on a "rating" reactive variable in parent context.',
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
    'templating'
  ], 'client');
  api.addFiles([
    'rating-bar.html',
    'rating-bar.js',
    'rating-bar.css'
  ], 'client');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('jasonford:rating-bar');
  api.addFiles('rating-bar-tests.js');
});
