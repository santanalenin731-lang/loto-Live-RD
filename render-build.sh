#!/usr/bin/env bash
# exit on error
set -o errexit

npm install
# Store/Install Puppeteer Cache in Render Build directory
PUPPETEER_CACHE_DIR=/opt/render/project/puppeteer npx puppeteer browsers install chrome
