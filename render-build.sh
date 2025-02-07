#!/usr/bin/env bash
set -o errexit

sudo apt update
sudo apt-get install -y chromium



npm run build