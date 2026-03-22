do shell script "export PATH=/usr/local/bin:/opt/homebrew/bin:/opt/homebrew/sbin:$PATH; cd /Users/leninsantanadejesus/Documents/Loteria && npx pm2 restart loteria-backend || npx pm2 start backend/server.js --name loteria-backend"
delay 2
tell application "Safari"
    activate
    open location "http://localhost:4000"
end tell
