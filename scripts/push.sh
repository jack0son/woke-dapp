#!/bin/bash 
echo "Pushing server..."
docker push jvindustries/woke:server
echo "Pushing oracle..."
docker push jvindustries/woke:oracle
echo "Pushing tipper..."
docker push jvindustries/woke:tipper
echo "Pushing notifier..."
docker push jvindustries/woke:notifier
