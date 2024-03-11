import gulp from "gulp";
import babel from "gulp-babel";
import debug from "gulp-debug";
import replace from "gulp-replace";
import { deleteAsync } from "del";

export function staticCopy() {
  return gulp.src("./src/public/**/*").pipe(gulp.dest("build/public"));
}

export function staticClean() {
  return deleteAsync(["./build/public/components"]);
}

export function staticCompile() {
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

export function staticSwapReactProduction() {
  return gulp
    .src(["./build/public/index.html"])
    .pipe(debug())
    .pipe(replace(".development.js", ".production.min.js"))
    .pipe(replace('<!-- Note: when deploying, replace "development.js" with "production.min.js". -->', ""))
    .pipe(gulp.dest("./build/public"));
}

export const static_build = gulp.series(staticCopy, staticCompile, staticSwapReactProduction, staticClean);

