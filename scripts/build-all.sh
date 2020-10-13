#!/bin/bash
set -ex

push=false
while getopts i:p flag
do
    case "${flag}" in
        i) image=${OPTARG};;
	p) push=true;;
    esac
done

echo "Image: $image";
echo "Push: $push";

# 1. List of images

# 2. If none provided, build all

# 3. If -p set, push to docker


PARENT_DIR=$(basename "${PWD%/*}")
CURRENT_DIR="${PWD##*/}"
IMAGE_NAME="$PARENT_DIR/$CURRENT_DIR"
TAG="${1}"

REGISTRY="hub.docker.com"

docker build -t ${REGISTRY}/${IMAGE_NAME}:${TAG} -t ${REGISTRY}/${IMAGE_NAME}:latest .
docker push ${REGISTRY}/${IMAGE_NAME}


docker build -f oracle.Dockerfile -t jvindustries/woke:oracle .
docker push jvindustries/woke:notifier
