#!/bin/bash 
echo "Pulling server..."
docker pull wokenetwork/woke:server
echo "Pulling oracle..."
docker pull wokenetwork/woke:oracle
echo "Pulling tipper..."
docker pull wokenetwork/woke:tipper
echo "Pulling notifier..."
docker pull wokenetwork/woke:notifier
