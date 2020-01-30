# woke-dapp
Mono repo for the woke dApp client, smart-contracts, and back-end services. 


## Repo Structure

### Contract Artifacts
The contract artifacts which are built by truffle contain the compiled contract
binaries, method interfaces, and the migration configuration.

Migration configuration is essentially the contract address and network
information for each chain the the contract has been deployed to.

Truffle will continually update this build file as you migrate so a contract
residing on multiple networks can be interacted with using one artifact.


# Deployment
The dApp client is currently deployed on netlify whilst all the back end
services are deployed on google cloud compute engine.

## App Services
### Netlify
Because of the more limited build options available on netlify, it was simplest
to avoid using any lerna dependencies and simply copy the contract artifacts
into the `@woke/app/src` on every production migration.

### Google Cloud
[Container Optimized
OS](https://cloud.google.com/container-optimized-os/docs/concepts/features-and-benefits)

**Configuring docker-compose for container optimized OS**
This [tutorial](https://cloud.google.com/community/tutorials/docker-compose-on-container-optimized-os)
guides you through running Docker Compose in a container on a
Container-Optimized OS instance.

## Ethereum
Rinkby is the testnet being used at the moment. 

### Faucets

# Development
No automation yet to get up and running locally: run the following series of
commands.

**Monorepo setup:**
```
# In project root dir
npm install -g lerna
lerna bootstrap
```

**Mock ethereum blockchain:**
```
cd @woke/contracts
npm run ganache:client

# New terminal
npm run migrate:client
```

**Server:**
Make sure docker is running.
```
# Run server DB in docker container
dockerd
./scripts/start-server-db.sh
npm run dev
```

**Oracle:**
```
npm run dev
```

**App:**
```
npm run start
```






