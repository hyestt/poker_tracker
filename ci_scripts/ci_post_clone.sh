#!/bin/sh
set -e
cd fe_poker
npm ci
cd ios
pod install
