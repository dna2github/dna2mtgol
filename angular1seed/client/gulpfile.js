var gulp = require('gulp');
var gulp_concat = require('gulp-concat');
var gulp_pre = require('gulp-preprocess');
var gulp_angular_templatecache = require('gulp-angular-templatecache');
var gulp_clean = require('gulp-clean');

gulp.task('clean', [], function () {
  return gulp.src('dist', {read: false}).pipe(gulp_clean());
})

gulp.task('build', ['clean'], function() {
  gulp.src([
    'node_modules/bootstrap/dist/css/bootstrap.min.css',
    'node_modules/font-awesome/css/font-awesome.min.css',
    'node_modules/angular-toastr/dist/angular-toastr.min.css',
    'node_modules/angular-ui-select/select.min.css'
  ]).pipe(gulp_concat('vendor.css'))
    .pipe(gulp.dest('dist/styles/'));
  gulp.src([
    'node_modules/angular/angular.min.js',
    'node_modules/angular-sanitize/angular-sanitize.min.js',
    'node_modules/angular-animate/angular-animate.min.js',
    'node_modules/angular-toastr/dist/angular-toastr.tpls.min.js',
    'node_modules/angular-ui-select/select.min.js',
    'node_modules/angular-ui-router/release/angular-ui-router.min.js',
    'node_modules/angular-cookie/angular-cookie.min.js'
  ]).pipe(gulp_concat('vendor.js'))
    .pipe(gulp.dest('dist/scripts/'));
  gulp.src([
    'node_modules/font-awesome/fonts/*',
    'node_modules/bootstrap/dist/fonts/*'
  ]).pipe(gulp.dest('dist/fonts/'));

  gulp.src([
    'app/**/*.css'
  ]).pipe(gulp_concat('app.css'))
    .pipe(gulp.dest('dist/styles/'));
  gulp.src([
    'app/index.js', 'app/**/*.js'
  ]).pipe(gulp_concat('app.js'))
    .pipe(gulp.dest('dist/scripts/'));
  gulp.src([
    'app/**/*.html', '!app/index.html'
  ]).pipe(gulp_angular_templatecache(
    'templates.js',
    {
      module: 'templates.app',
      standalone: true
    })
  ).pipe(gulp.dest('dist/scripts/'));
  gulp.src([
    'app/images/**/*'
  ]).pipe(gulp.dest('dist/images/'));
  gulp.src([
    'app/index.html'
  ]).pipe(gulp.dest('dist/'));
});

gulp.task('serve', ['build'], function () {
  var live = require('gulp-connect'),
      proxy = require('http-proxy-middleware'),
      server = live.server({
        host: '0.0.0.0',
        port: 8081,
        root: ['./dist/'],
        middleware: function(connect, opt) {
          return [
            proxy('/api', {
              target: 'http://127.0.0.1:8080',
              changeOrigin: true
            })
          ];
        }
      });
  gulp.watch(['dist/**/*.js', 'dist/**/*.css', 'dist/**/*.html']);
});

gulp.task('default', ['serve'], function() { });
