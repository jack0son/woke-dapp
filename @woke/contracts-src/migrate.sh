#!/bin/bash
# Copy contract artifacts into app src after truffle migration.
# Temporary work around to avoid issue lerna builds on netlify.
echo "Migrating smart-contracts ... "
DEFAULT_ENV=development
if [ -z "$1" ]; then
	echo "No environment specified. Using $DEFAULT_ENV."
fi
CONTRACT_ENV="${1:-$DEFAULT_ENV}"

ARGS=
# @TODO warn
if [ "$2" == "reset" ]; then
	echo "Resetting migrations."
	ARGS="--reset"
fi


WORK_DIR=$(pwd)
BASE_DIR=${WORK_DIR##*/}
if [[ "$BASE_DIR" != "contracts-src" ]]; then
	echo "FAILED .. script must be run from @woke/contracts"
	exit
fi

# @TODO exit if fail
npm run migrate:$CONTRACT_ENV -- $ARGS

BUILD_DIR="./build/contracts/artifacts"
APP_DEST="app/src/contracts/$CONTRACT_ENV"
PKG_DEST="contracts/$CONTRACT_ENV"
mkdir -p "$APP_DEST"
mkdir -p "$PKG_DEST"

echo "Adding contracts to app $APP_DEST ..."
cp $BUILD_DIR/{TwitterOracleMock,WokeToken,UserRegistry}.json "../$APP_DEST"

echo "Adding contracts to lib package $PKG_DEST ..."
cp $BUILD_DIR/{TwitterOracleMock,WokeToken,UserRegistry}.json "../$PKG_DEST"

CLONE=false
PACKAGES_PATH="$HOME/Repositories/jack0son/tmp/woke-dapp/@woke"
if $CLONE; then
	echo "Cloning artifacts into $PACKAGES_PATH ..."
	cp $BUILD_DIR/{TwitterOracleMock,WokeToken,UserRegistry}.json "$PACKAGES_PATH/$PKG_DEST"
fi
