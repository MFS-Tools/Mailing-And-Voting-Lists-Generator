#!/bin/bash
set -e

PLUGIN_NAME="mfs-spreadsheet-sorter"
BUILD_DIR="./build"
SRC_DIR="./src"

echo
echo "========================="
echo "Building WordPress Plugin"
echo "========================="
echo

echo "Cleaning old build files..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

echo "Zipping $SRC_DIR..."
zip -r "$BUILD_DIR/$PLUGIN_NAME.zip" "$SRC_DIR"

echo "Finished!"
echo
echo "Plugin located at $BUILD_DIR/$PLUGIN_NAME.zip"
echo
