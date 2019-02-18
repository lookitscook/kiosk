#!/usr/bin/env bash

npm run beautify

rm -rf dist/build;
mkdir dist/build;
mkdir dist/build/js;
mkdir dist/build/css;
mkdir dist/build/windows;
mkdir dist/build/js/lib;

#build css
cp -R lib/material-icons dist/build/css/material-icons
cp node_modules/materialize-css/dist/css/materialize.min.css dist/build/css/materialize.min.css
node-sass src/css/browser.scss --output-style compressed -o dist/build/css/
node-sass src/css/shared.scss --output-style compressed -o dist/build/css/
cp src/css/style.css dist/build/css/style.css
cp src/css/ghpages-materialize.css dist/build/css/ghpages-materialize.css

#build html
htmlmin src/windows/browser.html > dist/build/windows/browser.html
htmlmin src/windows/setup.html > dist/build/windows/setup.html

#build js
cp node_modules/async/dist/async.min.js dist/build/js/async.min.js;
cp node_modules/jquery/dist/jquery.min.js dist/build/js/jquery.min.js;
cp node_modules/moment/min/moment.min.js dist/build/js/moment.min.js;
cp lib/materialize-custom.min.js dist/build/js/materialize.min.js;
cp lib/lodash.min.js dist/build/js/lodash.min.js;
cp lib/wsc-chrome/wsc-chrome.js dist/build/js/lib/wsc-chrome.js;
uglifyjs src/js/browser.js > dist/build/js/browser.min.js;
uglifyjs src/js/main.js > dist/build/js/main.min.js;
uglifyjs src/js/setup.js > dist/build/js/setup.min.js;

#build assets
cp -R src/img dist/build/img;

#build meta
cp manifest.json dist/build/manifest.json;
cp schema.json dist/build/schema.json;

# package it
cd dist/build;
zip -r "../$(node -pe 'JSON.parse(process.argv[1]).version_name' "$(cat manifest.json)").zip" .;zip -r "../$(node -pe 'JSON.parse(process.argv[1]).version_name' "$(cat manifest.json)").zip" .;

# build desktop versions
build --tasks win-x86,win-x64,linux-x86,linux-x64,mac-x64 --mirror https://dl.nwjs.io/ --chrome-app .