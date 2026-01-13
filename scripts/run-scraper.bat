@echo off
cd /d "C:\Users\Berend Mainz\Documents\Start-up\reviewresponder-5"
node scripts/tripadvisor-scraper.js %1 >> scripts/scraper-log.txt 2>&1
