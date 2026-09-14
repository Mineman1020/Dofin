@echo off
title Launching Pomodoro Desk Clock...
cd /d "C:\Users\Niketh Sreeram\Downloads\Pomotimer"

:: Start Chrome in full-screen mode pointing to your local app
start chrome --start-fullscreen "http://127.0.0.1:3000"

:: Start the Vite server
npx vite --host 127.0.0.1 --port 3000