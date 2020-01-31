#!/bin/bash
# Copy contract artifacts into app src after truffle migration.
# Temporary work around to avoid issue lerna builds on netlify.
echo "Migrating smart-contracts ... "
DEFAULT_ENV=development
if [ -z "$1" ]; then
	echo "No environment specified. Using $DEFAULT_ENV."
fi
CONTRACT_ENV="${1:-$DEFAULT_ENV}"

# @TODO exit if fail
npm run "migrate:$CONTRACT_ENV"

WORK_DIR=$(pwd)
BASE_DIR=${WORK_DIR##*/}
if [[ "$BASE_DIR" != "contracts-src" ]]; then
	echo "FAILED .. script must be run from @woke/contracts"
	exit
fi

APP_DEST="../app/src/contracts/$CONTRACT_ENV"
# @woke/contracts package
PKG_DEST="../contracts/$CONTRACT_ENV"
mkdir -p "$APP_DEST"
mkdir -p "$PKG_DEST"

BUILD_DIR="./build/contracts/artifacts"
echo "Copying contracts $APP_DEST ..."
cp "$BUILD_DIR/TwitterOracleMock.json" "$APP_DEST"
cp "$BUILD_DIR/WokeToken.json" "$APP_DEST"

cp "$BUILD_DIR/TwitterOracleMock.json" "$PKG_DEST"
cp "$BUILD_DIR/WokeToken.json" "$PKG_DEST"
