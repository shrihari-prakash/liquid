const gulp = require('gulp');
const babel = require('gulp-babel');
const debug = require('gulp-debug');
const replace = require('gulp-replace');
const del = require('del');

function copyStatic() {
    return gulp.src('./src/public/**/*')
        .pipe(gulp.dest('build/public'));
}

function cleanStatic() {
    return del(['./build/public/components']);
}

function compileComponents() {
    return gulp.src('./src/public/components/*.js')
        .pipe(debug())
        .pipe(babel({
            presets: ['@babel/react']
        }))
        .pipe(gulp.dest('./build/public/compiled'))
}

function swapReactProduction() {
    return gulp.src(['./build/public/index.html'])
        .pipe(debug())
        .pipe(replace('.development.js', '.production.min.js'))
        .pipe(replace('<!-- Note: when deploying, replace "development.js" with "production.min.js". -->', ''))
        .pipe(gulp.dest('./build/public'))
}

exports.buildStatic = gulp.series(copyStatic, compileComponents, swapReactProduction, cleanStatic);