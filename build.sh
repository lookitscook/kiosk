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
cp -R lib/material-icons dist/www/css/material-icons
cp node_modules/materialize-css/dist/css/materialize.min.css dist/www/css/materialize.min.css
node-sass src/css/browser.scss --output-style compressed -o dist/css/
node-sass src/www/css/shared.scss --output-style compressed -o dist/www/css/

#build html
htmlmin src/windows/browser.html > dist/windows/browser.html
htmlmin src/windows/setup.html > dist/windows/setup.html
htmlmin src/www/index.html > dist/www/index.html

#build js
cp node_modules/async/dist/async.min.js dist/www/js/async.min.js;
cp node_modules/jquery/dist/jquery.min.js dist/www/js/jquery.min.js;
cp node_modules/materialize-css/dist/js/materialize.min.js dist/www/js/materialize.min.js;
cp node_modules/moment/min/moment.min.js dist/www/js/moment.min.js;
cp lib/lodash.min.js dist/www/js/lodash.min.js;
cp lib/wsc-chrome/wsc-chrome.js dist/js/lib/wsc-chrome.js;
uglifyjs src/js/browser.js > dist/js/browser.min.js;
uglifyjs src/js/main.js > dist/js/main.min.js;
uglifyjs src/js/setup.js > dist/js/setup.min.js;
uglifyjs src/www/js/admin.js > dist/www/js/admin.min.js;

#build assets
cp -R src/img dist/img;
cp src/www/favicon.ico dist/www/favicon.ico;

#build meta
cp manifest.json dist/manifest.json;
cp schema.json dist/schema.json;