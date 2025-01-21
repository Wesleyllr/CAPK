@echo off
cd C:\Users\PC PAPELARIA\Documents\GITHUB\CAPK
npx expo export --platform web
cd dist
http-server
