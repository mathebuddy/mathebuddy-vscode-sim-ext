#!/bin/bash

# This script assumes that repository https://github.com/mathebuddy/mathebuddy-downloads is cloned next 
# to this repository (https://github.com/mathebuddy/mathebuddy-vscode-lang-ext)

# It is also necessary to compile mathebuddy dependencies "mathebuddy-compiler" and "mathebuddy-simulator" locally!
# TODO: publish npm packages

cp node_modules/@mathebuddy/mathebuddy-simulator/build/mathebuddy-simulator.min.js media/
vsce package --out "../mathebuddy-downloads/vscode-extensions/"
