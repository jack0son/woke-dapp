#!/bin/bash
# docker container stop woke-dapp_db_1
docker container stop woke-dapp_db_1
docker container rm woke-dapp_db_1
docker volume rm woke-dapp_postgres_data

