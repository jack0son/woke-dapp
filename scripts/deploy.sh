#!/bin/bash
# Go to project root dir
DOCKER_DIR="docker"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[ 0 ]}" )" >/dev/null 2>&1 && pwd )"
cd $SCRIPT_DIR
cd ..

# @TODO Accept opts offset by one
PULL=false
start=false
STOP_CONTAINERS=false
while getopts i:prs flag
do
	case "${flag}" in
		i) module=${OPTARG};;
		p) PULL=true;;
		r) start=true;;
		s) STOP_CONTAINERS=true;;
	esac
done
ENV_ARG=${!OPTIND} # get first argument using getops arg index
OPTIND+=1
MODULE_ARG=${!OPTIND}

print_usage() {
	echo "Usage:		deploy [ OPTIONS ] COMMAND [ modules... ]"
	echo "		deploy [ -h | --help ]"
	echo ""
	echo "Options:"
	echo "  -h, --help		Prints usage"
	echo "  -p			Pull images"
	echo "  -i, --image=MODULE	Module pull choice"
	echo "  -r			Start (run) containers"
	echo "  -s			Stop containers"
	echo ""
	echo "Commands:"
	echo "  development		Deploy services in development environment."
	echo "  staging		Deploy services in staging environment."
	echo "  production		Deploy services in production environment."
	echo ""
	echo "Example: Pull and run the oracle service in the staging environment"
	echo "  $ deploy -pr staging oracle"
}

# Print usage if input does not constitute a valid command
if [ "$#" -eq 0 ] || [ "$ENV_ARG" = "-h" ] || [ "$ENV_ARG" = "--help" ]; then
	print_usage
	exit
elif [ "$ENV_ARG" = "development" ] || [ "$ENV_ARG" = "dev" ]; then
	ENV="development"
elif [ "$ENV_ARG" = "staging" ]; then
	ENV="staging"
elif [ "$ENV_ARG" = "production" ]; then
	ENV="production"
elif [ ${PULL} = false ]; then
	print_usage
	exit
fi

# @TODO Some should be stopped using compose
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
	TAG=$1;
	if [ -z ${TAG} ]; then
		echo "Pulling images..."
		docker pull wokenetwork/woke:server
		docker pull wokenetwork/woke:oracle
		docker pull wokenetwork/woke:tipper
		docker pull wokenetwork/woke:notifier
	else 
		echo "Pulling $TAG..."
		docker pull wokenetwork/woke:${TAG}
	fi
}

development() {
	ENV="${1:-production}"
	IMAGE="wokenetwork/woke:oracle"

	docker run -e "NODE_ENV=${ENV}" ${IMAGE}

	compose_up server.docker-compose.local.yml
	docker-compose -f server.docker-compose.local.yml up -d --build db
	docker-compose -f bot.docker-compose.local.yml up -d --build bot-db
	docker-compose -f bot.docker-compose.local.yml down
}

stop_containers() {
	docker-compose -f bot.docker-compose.local.yml down
}

command_exists() {
	hash $1 2>/dev/null
}

# For use in container optimized OS
docker_compose() {
	#if hash docker-composedfadsf 2>/dev/null; then
	if command_exists "docker-compose"; then
		docker-compose ${@}
	elif command_exists "docker"; then
		docker run --rm \
			-v /var/run/docker.sock:/var/run/docker.sock \
			-v "$PWD:$PWD" \
			-w="$PWD" \
			docker/compose:1.24.1 ${@}

	else
		echo "Docker compose is not available on this system"
	fi
}

start_container() {
	MODULE_NAME=$1
	DEPLOY_ENV=$2

	if [ -z ${DEPLOY_ENV}} ]; then
		# Default to production
		compose_up ${DOCKER_DIR}/${MODULE_NAME}.docker-compose.yml
	else
		compose_up ${DOCKER_DIR}/${MODULE_NAME}.docker-compose.${DEPLOY_ENV}.yml
	fi
}

stop_container() {
	MODULE_NAME=$1
	DEPLOY_ENV=$2

	if [ -z ${DEPLOY_ENV}} ]; then
		# Default to production
		compose_down ${DOCKER_DIR}/${MODULE_NAME}.docker-compose.yml
	else
		compose_down ${DOCKER_DIR}/${MODULE_NAME}.docker-compose.${DEPLOY_ENV}.yml
	fi
}

start_containers() {
	echo "Starting $ENV_ARG containers..."
	if [ -z ${MODULE_ARG} ]; then
		start_container server $ENV_ARG
		start_container oracle $ENV_ARG
		start_container bot $ENV_ARG
	else
		start_container $MODULE_ARG $ENV_ARG
	fi
}

stop_containers() {
	echo "Stopping $ENV_ARG containers..."
	if [ -z ${MODULE_ARG} ]; then
		stop_container server $ENV_ARG
		stop_container oracle $ENV_ARG
		stop_container bot $ENV_ARG
	else
		stop_container $MODULE_ARG $ENV_ARG
	fi
}

compose_up() {
	file=$1
	docker_compose -f ${file} up -d
}

compose_down() {
	file=$1
	docker_compose -f ${file} down
}

if ${PULL} = true; then
	if [ -z ${module} ]; then
		pull $MODULE_ARG
	else
		pull ${module}
	fi
fi

runcommand="start"
if ${STOP_CONTAINERS} = true; then
	runcommand="stop"
fi

# Run containers
if [ "$ENV_ARG" = "production" ]; then
	${runcommand}_containers
elif [ "$ENV_ARG" = "staging" ]; then
	${runcommand}_containers
elif [ "$ENV_ARG" = "development" ]; then
	ENV_ARG=local
	${runcommand}_containers
	# echo "Develpoment deployment not configured."
fi
