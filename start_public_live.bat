@echo off
title AegisAI - Server & Public Live Tunnel
echo =================================================================
echo   Starting AegisAI Video Threat Recognition Platform...
echo =================================================================

start "" python app.py
timeout /t 3 /nobreak >nul

echo.
echo =================================================================
echo   Starting Public Secure HTTPS Tunnel (localhost.run)...
echo =================================================================
echo Share the https:// URL shown below with your partner!
echo.

ssh -R 80:127.0.0.1:5000 -o StrictHostKeyChecking=no -o ServerAliveInterval=30 nokey@localhost.run
pause
