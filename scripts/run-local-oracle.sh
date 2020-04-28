#!/bin/bash
ENV="${1:-production}"
IMAGE="jvindustries/woke:oracle"

docker run -e "NODE_ENV=${ENV}" ${IMAGE}
