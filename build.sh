#!/usr/bin/env bash

NAME=$(node -pe 'JSON.parse(process.argv[1]).name' "$(cat manifest.json)");
VERSION_NAME=$(node -pe 'JSON.parse(process.argv[1]).version_name' "$(cat manifest.json)");

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
cp src/css/style.css dist/unpackaged/css/style.css
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
uglifyjs src/js/browser.js > dist/unpackaged/js/browser.min.js;
uglifyjs src/js/main.js > dist/unpackaged/js/main.min.js;
uglifyjs src/js/setup.js > dist/unpackaged/js/setup.min.js;

#build assets
cp -R src/img dist/unpackaged/img;

#build meta
cp manifest.json dist/unpackaged/manifest.json;
cp schema.json dist/unpackaged/schema.json;

# package it
cd dist;
zip -r $VERSION_NAME-chrome-app.zip unpackaged;

# build desktop versions
build --tasks win-x86,win-x64,linux-x86,linux-x64,mac-x64 --mirror https://dl.nwjs.io/ --chrome-app unpackaged;


# create osx dmg
cd mac-x64;
echo "{
  \"title\": \"$NAME\",
  \"icon\": \"../unpackaged/img/icon.icns\",
  \"contents\": [
    { \"x\": 448, \"y\": 344, \"type\": \"link\", \"path\": \"/Applications\" },
    { \"x\": 192, \"y\": 344, \"type\": \"file\", \"path\": \"$NAME.app\" }
  ],
  \"code-sign\": {
      \"signing-identity\": \"3rd Party Mac Developer Application: Matthew Cook (5BNMYJ6L8S)\"
  }
}" > appdmg.json;
node ../../node_modules/appdmg/bin/appdmg.js appdmg.json ../$VERSION_NAME-mac-x64.dmg;
rm appdmg.json;
cd ..;
rm -rf mac-x64;

# clean up
rm -rf win-x64
rm -rf win-x86
mv win-x64-Setup.exe $VERSION_NAME-win-x64-setup.exe
mv win-x86-Setup.exe $VERSION_NAME-win-x86-setup.exe
zip -r $VERSION_NAME-linux-x86.zip linux-x86;
rm -rf linux-x86;
zip -r $VERSION_NAME-linux-x64.zip linux-x64;
rm -rf linux-x64;
rm versions.nsis.json

# generate MD5 hashes
echo "MD5 Checksums" >> checksums.txt;
echo "-------------" >> checksums.txt;
md5 -r $VERSION_NAME-chrome-app.zip >> checksums.txt;
md5 -r $VERSION_NAME-linux-x64.zip >> checksums.txt;
md5 -r $VERSION_NAME-linux-x86.zip >> checksums.txt;
md5 -r $VERSION_NAME-mac-x64.dmg >> checksums.txt;
md5 -r $VERSION_NAME-win-x64-setup.exe >> checksums.txt;
md5 -r $VERSION_NAME-win-x86-setup.exe >> checksums.txt;

