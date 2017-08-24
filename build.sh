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
uglifyjs src/js/browser.js > dist/js/browser.js;
uglifyjs src/js/main.js > dist/js/main.js;
uglifyjs src/js/setup.js > dist/js/setup.js;
uglifyjs src/www/js/admin.js > dist/www/js/admin.js;

#build assets
cp -R src/img dist/img;
cp -R src/www/font dist/www/font;
cp src/www/favicon.ico dist/www/favicon.ico;

#build meta
cp manifest.json dist/manifest.json;
cp schema.json dist/schema.json;