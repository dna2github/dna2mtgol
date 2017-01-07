var gulp = require('gulp');
var gulp_concat = require('gulp-concat');
var gulp_clean = require('gulp-clean');

gulp.task('clean', [], function () {
   return gulp.src('client/dist', { read: false }).pipe(gulp_clean());
})

gulp.task('build', ['clean'], function () {
   gulp.src([
      'node_modules/bootstrap/dist/css/bootstrap.min.css',
   ]).pipe(gulp_concat('vendor.css'))
      .pipe(gulp.dest('client/dist/styles/'));

   gulp.src([
      'node_modules/jquery/dist/jquery.min.js'
   ]).pipe(gulp_concat('vendor.js'))
      .pipe(gulp.dest('client/dist/scripts/'));
   gulp.src([
      'node_modules/bootstrap/dist/fonts/*',
      'client/fonts/*',
   ]).pipe(gulp.dest('client/dist/fonts/'));

});

gulp.task('serve', ['build'], function () {
   var live = require('gulp-connect'),
      proxy = require('http-proxy-middleware'),
      server = live.server({
         host: '0.0.0.0',
         port: 8080,
         root: ['./dist/'],
         middleware: function (connect, opt) {
            return [
               proxy('/api', {
                  target: 'http://127.0.0.1:9090',
                  changeOrigin: true
               })
            ];
         }
      });
   gulp.watch(['client/dist/**/*.js', 'client/dist/**/*.css', 'client/dist/**/*.html']);
});

gulp.task('default', ['serve'], function () { });