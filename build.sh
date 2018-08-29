#!/usr/bin/env bash

npm run beautify

rm -rf dist;
mkdir dist;
mkdir dist/js;
mkdir dist/css;
mkdir dist/windows;
mkdir dist/js/lib;

#build css
cp -R lib/material-icons dist/css/material-icons
cp node_modules/materialize-css/dist/css/materialize.min.css dist/css/materialize.min.css
node-sass src/css/browser.scss --output-style compressed -o dist/css/
node-sass src/css/shared.scss --output-style compressed -o dist/css/
cp src/css/style.css dist/css/style.css
cp src/css/ghpages-materialize.css dist/css/ghpages-materialize.css

#build html
htmlmin src/windows/browser.html > dist/windows/browser.html
htmlmin src/windows/setup.html > dist/windows/setup.html

#build js
cp node_modules/async/dist/async.min.js dist/js/async.min.js;
cp node_modules/jquery/dist/jquery.min.js dist/js/jquery.min.js;
cp node_modules/materialize-css/dist/js/materialize.min.js dist/js/materialize.min.js;
cp node_modules/moment/min/moment.min.js dist/js/moment.min.js;
cp lib/lodash.min.js dist/js/lodash.min.js;
cp lib/wsc-chrome/wsc-chrome.js dist/js/lib/wsc-chrome.js;
uglifyjs src/js/browser.js > dist/js/browser.min.js;
uglifyjs src/js/main.js > dist/js/main.min.js;
uglifyjs src/js/setup.js > dist/js/setup.min.js;

#build assets
cp -R src/img dist/img;

#build meta
cp manifest.json dist/manifest.json;
cp schema.json dist/schema.json;