@echo off

set "PLUGIN_NAME=mfs-spreadsheet-sorter"
set "BUILD_DIR=./build"
set "SRC_DIR=./src"

echo:
echo =========================
echo Building WordPress Plugin
echo =========================
echo:

echo Cleaning old build files...
if exist "%BUILD_DIR%" rmdir /s /q "%BUILD_DIR%"
mkdir "%BUILD_DIR%"

echo Zipping %SRC_DIR%...
powershell -Command "Compress-Archive -Path '%SRC_DIR%' -DestinationPath '%BUILD_DIR%\%PLUGIN_NAME%.zip' -Force"

echo Finished!
echo:
echo Plugin located at %BUILD_DIR%/%PLUGIN_NAME%.zip
echo:
