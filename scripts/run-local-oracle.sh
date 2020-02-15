#!/bin/bash
ENV="${1:-production}"
IMAGE="woke/tiny-oracle"

docker run -e "NODE_ENV=${ENV}" ${IMAGE}
