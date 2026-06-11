@echo off
REM Create scripts directory
if not exist "scripts" mkdir scripts
echo Scripts directory created
REM Run the Node.js setup script
node setup-scripts.js
