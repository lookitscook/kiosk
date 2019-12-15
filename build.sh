#!/usr/bin/env bash

NAME=$(node -pe 'JSON.parse(process.argv[1]).name' "$(cat ./manifest.json)");
VERSION_NAME=$(node -pe 'JSON.parse(process.argv[1]).version_name' "$(cat ./manifest.json)");

# since we don't currently do this automatically anywhere else
npm run beautify

# remove old build
rm -rf dist build;
mkdir dist;
mkdir -p build/unpackaged;

# copy the required files
cp manifest.json build/unpackaged/manifest.json;
cp schema.json build/unpackaged/schema.json;

cp -R css build/unpackaged/css;
cp -R img build/unpackaged/img;
cp -R js build/unpackaged/js;
cp -R windows build/unpackaged/windows;

mkdir -p build/unpackaged/node_modules/async/dist;
cp node_modules/async/dist/async.js build/unpackaged/node_modules/async/dist/async.js;
mkdir -p build/unpackaged/node_modules/jquery/dist;
cp node_modules/jquery/dist/jquery.js build/unpackaged/node_modules/jquery/dist/jquery.js;
mkdir -p build/unpackaged/node_modules/materialize-css/dist/css;
cp node_modules/materialize-css/dist/css/materialize.css build/unpackaged/node_modules/materialize-css/dist/css/materialize.css
mkdir -p build/unpackaged/node_modules/moment;
cp node_modules/moment/moment.js build/unpackaged/node_modules/moment/moment.js

cd build;

# package it
zip -r ../dist/$VERSION_NAME-chrome-app.zip unpackaged;

# build desktop versions
build --tasks win-x86,win-x64,linux-x86,linux-x64,mac-x64 --mirror https://dl.nwjs.io/ --chrome-app ./unpackaged;

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
node ../../node_modules/appdmg/bin/appdmg.js appdmg.json ../../dist/$VERSION_NAME-mac-x64.dmg;
cd ..;

# clean up
mv win-x64-Setup.exe ../dist/$VERSION_NAME-win-x64-setup.exe
mv win-x86-Setup.exe ../dist/$VERSION_NAME-win-x86-setup.exe
zip -r ../dist/$VERSION_NAME-linux-x86.zip linux-x86;
zip -r ../dist/$VERSION_NAME-linux-x64.zip linux-x64;
cd ../dist;
rm -rf ../build;

# generate MD5 hashes
echo "MD5 Checksums" >> checksums.txt;
echo "-------------" >> checksums.txt;
md5 -r $VERSION_NAME-chrome-app.zip >> checksums.txt;
md5 -r $VERSION_NAME-linux-x64.zip >> checksums.txt;
md5 -r $VERSION_NAME-linux-x86.zip >> checksums.txt;
md5 -r $VERSION_NAME-mac-x64.dmg >> checksums.txt;
md5 -r $VERSION_NAME-win-x64-setup.exe >> checksums.txt;
md5 -r $VERSION_NAME-win-x86-setup.exe >> checksums.txt;

