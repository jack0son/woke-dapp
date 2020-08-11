#!/bin/bash
./scripts/server:build.sh
./scripts/build-oracle.sh
./scripts/build-tipper.sh
./scripts/build-notifier.sh
