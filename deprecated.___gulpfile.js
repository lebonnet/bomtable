"use strict";

const
    gulp = require('gulp'),
    del = require('del'),
    webpackStream = require('webpack-stream'),
    gulpSequence = require('gulp-sequence'),
    minJS = require('gulp-minify'),
    cleanCSS = require('gulp-clean-css'),
    rename = require('gulp-rename');

gulp.task('build', cb =>
    gulpSequence(
        'clean',
        'webpack',
        'compressJS',
        'compressCSS',
        cb
    )
);

gulp.task('clean', () => {
    return del([
        'dist/*',
    ]);
});

gulp.task('webpack', () => {
    return gulp.src('src/js/bomtable.js')
        .pipe(webpackStream({
            output: {
                filename: 'bomtable.js',
            },
            module: {
                rules: [
                    {
                        loader: 'babel-loader',
                        query: {
                            presets: ['env']
                        }
                    }
                ]
            }
        })).pipe(gulp.dest('dist'))
});

gulp.task('compressJS', () => {
    return gulp.src('dist/*.js')
        .pipe(minJS({
            ext: {
                min: '.min.js'
            }
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('compressCSS', () => {
    return gulp.src('src/css/*.css')
        .pipe(cleanCSS({compatibility: 'ie9'}))
        .pipe(rename(path => path.basename = path.basename + '.min'))
        .pipe(gulp.dest('dist'))
});