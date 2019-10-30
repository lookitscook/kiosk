#!/usr/bin/env bash

# since we don't currently do this automatically anywhere else
npm run beautify

# remove old build
rm -rf dist;
mkdir dist;
mkdir dist/unpackaged;
mkdir dist/unpackaged/js;
mkdir dist/unpackaged/css;
mkdir dist/unpackaged/windows;
mkdir dist/unpackaged/js/lib;

#build css
cp -R lib/material-icons dist/unpackaged/css/material-icons
cp node_modules/materialize-css/dist/css/materialize.min.css dist/unpackaged/css/materialize.min.css
node-sass src/css/browser.scss --output-style compressed -o dist/unpackaged/css/
node-sass src/css/shared.scss --output-style compressed -o dist/unpackaged/css/
node-sass src/css/style.scss --output-style compressed -o dist/unpackaged/css/
cp src/css/ghpages-materialize.css dist/unpackaged/css/ghpages-materialize.css

#build html
htmlmin src/windows/browser.html > dist/unpackaged/windows/browser.html
htmlmin src/windows/setup.html > dist/unpackaged/windows/setup.html

#build js
cp node_modules/async/dist/async.min.js dist/unpackaged/js/async.min.js;
cp node_modules/jquery/dist/jquery.min.js dist/unpackaged/js/jquery.min.js;
cp node_modules/moment/min/moment.min.js dist/unpackaged/js/moment.min.js;
cp lib/materialize-custom.min.js dist/unpackaged/js/materialize.min.js;
cp lib/lodash.min.js dist/unpackaged/js/lodash.min.js;
cp lib/wsc-chrome/wsc-chrome.js dist/unpackaged/js/lib/wsc-chrome.js;
cat node_modules/async/dist/async.min.js <(echo) lib/lodash.min.js <(echo) lib/wsc-chrome/wsc-chrome.js <(echo) src/js/main.js | uglifyjs -o dist/unpackaged/js/main.min.js
uglifyjs src/js/browser.js > dist/unpackaged/js/browser.min.js;
uglifyjs src/js/setup.js > dist/unpackaged/js/setup.min.js;

#build assets
cp -R src/img dist/unpackaged/img;

#build meta
cp manifest.json dist/unpackaged/manifest.json;
cp schema.json dist/unpackaged/schema.json;