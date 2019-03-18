#!/usr/bin/env bash

NAME=$(node -pe 'JSON.parse(process.argv[1]).name' "$(cat manifest.json)");
VERSION_NAME=$(node -pe 'JSON.parse(process.argv[1]).version_name' "$(cat manifest.json)");

./compile.sh

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

