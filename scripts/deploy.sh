#!/bin/bash
# Go to project root dir
DOCKER_DIR="docker"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[ 0 ]}" )" >/dev/null 2>&1 && pwd )"
cd $SCRIPT_DIR
cd ..

# @TODO Accept opts offset by one
pull=false
start=false
while getopts ps flag
do
	case "${flag}" in
		p) pull=true;;
		s) start=true;;
	esac
done
ENV_ARG=${!OPTIND} # get first argument using getops arg index
OPTIND+=1
MODULE_ARG=${!OPTIND}

print_usage() {
	echo "Usage:		deploy [ OPTIONS ] ENVIRONMENT [ modules... ]"
	echo "		deploy [ -h | --help ]"
	echo ""
	echo "Options:"
	echo "		-h, --help		Prints usage"
	echo "		-p			Pull images"
	echo "		-s			Start containers"
	echo ""
	echo "Commands:"
	echo "		development		Deploy services in development environment."
	echo "		staging			Deploy services in staging environment."
	echo "		production		Deploy services in production environment."
}

if [ "$#" -eq 0 ] || [ "$ENV_ARG" = "-h" ] || [ "$ENV_ARG" = "--help" ]; then
	print_usage
	exit
elif [ "$ENV_ARG" = "development" ] || [ "$ENV_ARG" = "dev" ]; then
	ENV="development"
elif [ "$ENV_ARG" = "staging" ]; then
	ENV="staging"
elif [ "$ENV_ARG" = "production" ]; then
	ENV="production"
else
	print_usage
	exit
fi

stop_existing_containers() {
	CONTAINERS="$(docker ps --all --quiet)"
	# If greater than zero characters in CONTAINERS
	if [ ${#CONTAINERS} -gt 0 ]; then
		echo "Stopping all containers..."
		docker stop $CONTAINERS
	else
		echo "There are no containers to be stopped"
	fi
}

remove_stopped_containers() {
	CONTAINERS="$(docker ps -a -f status=exited -q)"
	# If greater than zero characters in CONTAINERS
	if [ ${#CONTAINERS} -gt 0 ]; then
		echo "Stopping all stopped containers..."
		docker stop $CONTAINERS
	else
		echo "There are no containers to be stopped"
	fi
}

remove_unused_volumes() {
	VOLUMES="$(docker volume ls -qf dangling=true)"
	# If greater than zero characters in VOLUMES
	if [ ${#VOLUMES} -gt 0 ]; then
		echo "Stopping all stopped containers..."
		docker volume rm $VOLUMES
	else
		echo "There are no unused volumes to remove"
	fi
}

clean() {
	echo "Cleaning..."
	stop_existing_containers
	remove_stopped_containers
	remove_unused_volumes
}

pull() {
	echo "Pulling images..."
	docker pull wokenetwork/woke:server
	docker pull wokenetwork/woke:oracle
	docker pull wokenetwork/woke:tipper
	docker pull wokenetwork/woke:notifier
}

# For use in container optimized OS
docker_compose() {
	docker run --rm \
		-v /var/run/docker.sock:/var/run/docker.sock \
		-v "$PWD:$PWD" \
		-w="$PWD" \
		docker/compose:1.24.1 ${@}
	}

compose_up() {
	file=$1
	if hash docker-compose; then
		docker-compose -f ${DOCKER_DIR}/server.docker-compose.yml up -d
	else
		docker_compose -f ${DOCKER_DIR}/server.docker-compose.yml up -d
	fi
}

if ${pull} = true; then
	pull
fi

if ${start} = true; then
	# Run containers
	echo "Starting $ENV_ARG containers..."
	if [ "$ENV_ARG" = "production" ]; then
		compose_up ${DOCKER_DIR}/server.docker-compose.yml
		compose_up ${DOCKER_DIR}/bot.docker-compose.yml
		compose_up ${DOCKER_DIR}/oracle.docker-compose.yml
	elif [ "$ENV_ARG" = "staging" ]; then
		echo "Staging deployment not configured."
	elif [ "$ENV_ARG" = "development" ]; then
		echo "Develpoment deployment not configured."
	fi
fi
