'use strict';

var gulp = require('gulp');
var browserSync = require('browser-sync');

function browserSyncInit(baseDir) {
  browserSync.instance = browserSync.init(null, {
    startPath: '/index.html',
    server: {
      baseDir: baseDir,
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });
}

gulp.task('serve', ['watch'], function () {
  browserSyncInit([
    'src',
    '.tmp'
  ]);
});

gulp.task('serve:dist', ['build'], function () {
  browserSyncInit('dist');
});

