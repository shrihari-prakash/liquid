const gulp = require("gulp");
const babel = require("gulp-babel");
const debug = require("gulp-debug");
const replace = require("gulp-replace");
const del = require("del");

function static_copy() {
  return gulp.src("./src/public/**/*").pipe(gulp.dest("build/public"));
}

function static_clean() {
  return del(["./build/public/components"]);
}

function static_compile() {
  return gulp
    .src("./src/public/components/*.js")
    .pipe(debug({ title: "Ready for compile" }))
    .pipe(
      babel({
        presets: ["@babel/react"]
      })
    )
    .pipe(gulp.dest("./build/public/compiled"));
}

function static_swap_react_pdoduction() {
  return gulp
    .src(["./build/public/index.html"])
    .pipe(debug())
    .pipe(replace(".development.js", ".production.min.js"))
    .pipe(replace('<!-- Note: when deploying, replace "development.js" with "production.min.js". -->', ""))
    .pipe(gulp.dest("./build/public"));
}

exports.static_build = gulp.series(static_copy, static_compile, static_swap_react_pdoduction, static_clean);
