#!/bin/bash 
echo "Pushing server..."
docker push wokenetwork/woke:server
echo "Pushing oracle..."
docker push wokenetwork/woke:oracle
echo "Pushing tipper..."
docker push wokenetwork/woke:tipper
echo "Pushing notifier..."
docker push wokenetwork/woke:notifier
