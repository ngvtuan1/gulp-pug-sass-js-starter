var gulp = require('gulp');
var sass = require('gulp-sass');
var browserSync = require('browser-sync');
var useref = require('gulp-useref');
var uglify = require('gulp-uglify');
var gulpIf = require('gulp-if');
var cssnano = require('gulp-cssnano');
var imagemin = require('gulp-imagemin');
var cache = require('gulp-cache');
var del = require('del');
var runSequence = require('run-sequence');
var pug = require('gulp-pug');
var autoprefixer = require('gulp-autoprefixer');
var concat = require('gulp-concat');
var minify = require('gulp-minify');
var minifyCss = require('gulp-minify-css');

// Development Tasks
// -----------------

// Start browserSync server
gulp.task('browserSync', function() {
  browserSync({
    port: 9000,
    server: {
      baseDir: 'static'
    }
  })
})

gulp.task('pug', function () {
  return gulp.src('app/*.pug')
    .pipe(pug({
      pretty: true
    }))
    .pipe(gulp.dest('static'));
})

/**
 * Recompile .pug files and live reload the browser
 */
gulp.task('pug-rebuild', ['pug'], function () {
  browserSync.reload();
})

gulp.task('sass', function() {
  return gulp.src('app/scss/*.scss') // Gets all files ending with .scss in app/scss and children dirs
    .pipe(sass({
      includePaths: ['app/scss'],
      outputStyle: 'compressed'
    })
    .on('error', sass.logError)) // Passes it through a gulp-sass, log errors to console
    .pipe( autoprefixer( 'last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4' ) )
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(concat('styles.min.css'))
    .pipe(gulp.dest('static/css')) // Outputs it in the css folder
    .pipe(browserSync.reload({ // Reloading with Browser Sync
      stream: true
    }));
})


// compile js
gulp.task('js', function () {
  gulp.src(['app/js/vendor/*', 'app/js/lib/*', 'app/js/plugins/*'])
    .pipe(concat('main.min.js'))
    .pipe(minify({
      ext:{
        min:'.js'
      },
      noSource: true
    }))
    .pipe(gulp.dest('static/js'));
});

gulp.task('js-rebuild', ['js'], function () {
  browserSync.reload();
})

// Watchers
gulp.task('watch', function() {
  gulp.watch('app/scss/**/*.scss', ['sass']);
  gulp.watch('app/js/**/*.js', ['js-rebuild']);
  gulp.watch('app/images/**/*.+(png|jpg|jpeg|gif|svg)', ['images']);
  gulp.watch(['app/*.pug', 'app/partials/*.pug', 'app/layouts/*.pug'], ['pug-rebuild']);
})

// Optimization Tasks
// ------------------

// Optimizing CSS and JavaScript
gulp.task('useref', function() {
  return gulp.src('app/*.html')
    .pipe(useref())
    .pipe(gulpIf('*.css', cssnano()))
    .pipe(gulp.dest('static'));
});

// Optimizing Images
gulp.task('images', function() {
  return gulp.src('app/images/**/*.+(png|jpg|jpeg|gif|svg)')
    // Caching images that ran through imagemin
    .pipe(cache(imagemin({
      interlaced: true,
    })))
    .pipe(gulp.dest('static/images'))
});

// Copying fonts
gulp.task('fonts', function() {
  return gulp.src('app/fonts/**/*')
    .pipe(gulp.dest('static/fonts'))
})

// Cleaning
gulp.task('clean', function() {
  return del.sync('static').then(function(cb) {
    return cache.clearAll(cb);
  });
})

gulp.task('clean:static', function() {
  return del.sync(['static/**/*', '!static/images', '!static/images/**/*']);
});

// Build Sequences
// ---------------

gulp.task('default', function(callback) {
  runSequence(['sass', 'pug', 'useref', 'images', 'fonts', 'js', 'browserSync'], 'watch',
    callback
  )
})

gulp.task('build', function(callback) {
  runSequence(
    'clean:static',
    'sass',
    'pug',
    ['useref', 'images', 'fonts', 'js'],
    callback
  )
})
