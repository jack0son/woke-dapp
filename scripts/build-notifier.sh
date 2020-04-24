#!/bin/bash 
# docker build -t woke/tiny-oracle -f Dockerfile.tiny-oracle .
docker build -f notifier.Dockerfile -t jvindustries/woke:notifier .
