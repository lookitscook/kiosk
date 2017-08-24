#!/usr/bin/env bash

rm -rf dist;
mkdir dist;
mkdir dist/www;
mkdir dist/www/js;
mkdir dist/www/css;
mkdir dist/js;
mkdir dist/css;
mkdir dist/windows;
mkdir dist/js/lib;

#build css
cp src/www/css/materialize.min.css dist/www/css/materialize.min.css
cp -R src/www/css/material-icons dist/www/css/material-icons
node-sass src/css/browser.scss --output-style compressed -o dist/css/
node-sass src/www/css/shared.scss --output-style compressed -o dist/www/css/

#build html
htmlmin src/windows/browser.html > dist/windows/browser.html
htmlmin src/windows/setup.html > dist/windows/setup.html
htmlmin src/www/index.html > dist/www/index.html

#build js
cp src/www/js/jquery.min.js dist/www/js/jquery.min.js;
cp src/www/js/materialize.min.js dist/www/js/materialize.min.js;
cp src/www/js/moment.js dist/www/js/moment.js;
cp src/js/lib/wsc-chrome.js dist/js/lib/wsc-chrome.js;
browserify src/js/browser.js | uglifyjs > dist/js/browser.js;
browserify src/js/main.js | uglifyjs > dist/js/main.js;
browserify src/js/setup.js | uglifyjs > dist/js/setup.js;
browserify src/www/js/admin.js | uglifyjs > dist/www/js/admin.js;

#build assets
cp -R src/img dist/img;
cp -R src/www/font dist/www/font;
cp src/www/favicon.ico dist/www/favicon.ico;

#build meta
cp manifest.json dist/manifest.json;
cp schema.json dist/schema.json;