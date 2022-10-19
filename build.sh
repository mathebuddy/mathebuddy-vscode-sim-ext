#!/bin/bash

# This script assumes that repository https://github.com/mathebuddy/mathebuddy-downloads is cloned next 
# to this repository (https://github.com/mathebuddy/mathebuddy-vscode-lang-ext)

# It is also necessary to compile mathebuddy dependencies "mathebuddy-compiler" and "mathebuddy-simulator" locally!
# TODO: publish npm packages

npm install
cp node_modules/@mathebuddy/mathebuddy-compiler/build/mathebuddy-compiler.min.js media/
cp node_modules/@mathebuddy/mathebuddy-simulator/build/mathebuddy-simulator.min.js media/
cp node_modules/bootstrap/dist/css/bootstrap.min.css media/

mkdir -p media/fontawesome-free/css
mkdir -p media/fontawesome-free/webfonts
cp -r node_modules/@fortawesome/fontawesome-free/css/all.min.css media/fontawesome-free/css/
cp -r node_modules/@fortawesome/fontawesome-free/webfonts/*.woff2 media/fontawesome-free/webfonts/

npm run compile
vsce package --out "../mathebuddy-downloads/vscode-extensions/"
