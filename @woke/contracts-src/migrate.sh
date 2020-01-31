#!/bin/bash
# Copy contract artifacts into app src after truffle migration.
# Temporary work around to avoid issue lerna builds on netlify.
echo "Migrating smart-contracts ... "
DEFAULT_ENV=development
if [ -z "$1" ]; then
	echo "No environment selected. Using $DEFAULT_ENV."
fi
CONTRACT_ENV="${1:-$DEFAULT_ENV}"
npm run "migrate:$CONTRACT_ENV"

WORK_DIR=$(pwd)
BASE_DIR=${WORK_DIR##*/}
if [[ "$BASE_DIR" != "contracts" ]]; then
	echo "FAILED .. script must be run from @woke/contracts"
	exit
fi

APP_DEST="../app/src/contracts/$CONTRACT_ENV"
mkdir -p "$APP_DEST"

BUILD_DIR="./build/contracts"
if [[ "$ENV" == "production" ]]; then
	BUILD_DIR="./artifacts/${CONTRACT_ENV}"
fi

echo "Copying contracts $APP_DEST ..."
cp "$BUILD_DIR/$ENV/TwitterOracleMock.json" "$APP_DEST"
cp "$BUILD_DIR/$ENV/WokeToken.json" "$APP_DEST"
