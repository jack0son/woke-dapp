#!/bin/bash
set -e
#set -x

push=false
build=false

while getopts i:pb flag
do
	case "${flag}" in
		i) module=${OPTARG};;
		p) push=true;;
		b) build=true;;
	esac
done

# Assume script is located in in woke-dapp/scripts
DOCKER_DIR="docker"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $SCRIPT_DIR
cd ..

REGISTRY="wokenetwork"
IMAGE_NAME="woke"
build() {
	TAG=$1
	echo "Building ${TAG}..."
	# OR using local tags (not doing this for the moment, will need for
	# seperating staging images from production images)
	# docker build -t ${REGISTRY}/${IMAGE_NAME}:${TAG} -t ${REGISTRY}/${IMAGE_NAME}:latest .

	# Store all the images under the same name as different tags (free lol)
	docker build -f $DOCKER_DIR/${image}.Dockerfile -t ${REGISTRY}/${IMAGE_NAME}:${TAG} .
}

push() {
	TAG=$1
	echo "Pushing ${TAG}..."
	# OR using local tags (not doing this for the moment, will need for
	docker push ${REGISTRY}/${IMAGE_NAME}:${TAG}
}

single_image() {
	image=$1
	if ${build} = true; then
		build $image
	fi
	if ${push} = true; then
		push $image
	fi
}

all_images() {
	for dockerfile in $DOCKER_DIR/*.Dockerfile; do
		# extract module name
		M=$(basename $dockerfile .Dockerfile)
		single_image $M
	done
}

if [ -z ${module} ]; then
	all_images
else
	# If image name provided
	if ls $DOCKER_DIR | grep -x -q "${module}.Dockerfile" ; then
		single_image ${module}
	else
		echo "Docker image '${image}' does not exist"
	fi
fi
