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
cp node_modules/materialize-css/dist/css/materialize.css dist/unpackaged/css/materialize.css
node-sass src/css/browser.scss --output-style expanded -o dist/unpackaged/css/
node-sass src/css/shared.scss --output-style expanded -o dist/unpackaged/css/
node-sass src/css/style.scss --output-style expanded -o dist/unpackaged/css/
cp src/css/ghpages-materialize.css dist/unpackaged/css/ghpages-materialize.css
cp -R lib/material-wifi-icons dist/unpackaged/css/material-wifi-icons


#build html
cp src/windows/browser.html dist/unpackaged/windows/browser.html
cp src/windows/setup.html dist/unpackaged/windows/setup.html
cp src/windows/pair.html dist/unpackaged/windows/pair.html
cp src/windows/status.html dist/unpackaged/windows/status.html

#build js
cp node_modules/async/dist/async.js dist/unpackaged/js/async.js;
cp node_modules/jquery/dist/jquery.js dist/unpackaged/js/jquery.js;
cp node_modules/moment/moment.js dist/unpackaged/js/moment.js;
cp lib/materialize-custom.min.js dist/unpackaged/js/materialize.js;
cp lib/lodash.min.js dist/unpackaged/js/lodash.js;
cp lib/wsc-chrome/wsc-chrome.js dist/unpackaged/js/lib/wsc-chrome.js;
cat node_modules/async/dist/async.js <(echo) lib/lodash.min.js <(echo) lib/wsc-chrome/wsc-chrome.js <(echo) src/js/main.js > dist/unpackaged/js/main.js
cp src/js/browser.js dist/unpackaged/js/browser.js;
cp src/js/setup.js dist/unpackaged/js/setup.js;
cp src/js/pair.js dist/unpackaged/js/pair.js;
cp src/js/status.js dist/unpackaged/js/status.js;

#build assets
cp -R src/img dist/unpackaged/img;

#build meta
cp manifest.json dist/unpackaged/manifest.json;
cp schema.json dist/unpackaged/schema.json;