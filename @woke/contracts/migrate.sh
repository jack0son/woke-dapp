echo "Migrating smart-contracts ... "
DEFAULT_ENV=development
if [[ -z "$1" ]]; then
	echo "No environment selected. Using $DEFAULT_ENV"
fi

ENV="${1:-$DEFAULT_ENV}"

npm run "migrate:$ENV"

WORK_DIR=$(pwd)
BASE_DIR=${WORK_DIR##*/}
echo $BASE_DIR

if [[ BASE_DIR != "contracts" ]]; then
	echo "FAILED .. script must be run from @woke/contracts"
	exit
fi

mkdir -p ../app/src/contracts/

echo "Copying contracts into app src ..."
cp "./artifacts/$ENV/TwitterOracleMock.json" "../app/src/contracts/$ENV"
cp "./artifacts/$ENV/WokeToken.json" "../app/src/contracts/$ENV"
echo "... DONE"

