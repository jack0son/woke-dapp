# woke-dapp
Mono repo for the woke dApp client, smart-contracts, and back-end services. 


## Repo Structure
Packages `@woke/PACKAGE`

### @woke/app
React app.

### @woke/lib
Web3 init, twitter client, utils.

### @woke/bot
Tipping, twitter notifications, leaderboard, token distribution. 

### @woke/contracts 
The contract artifacts which are built by truffle contain the compiled contract
binaries, method interfaces, and the migration configuration.

Migration configuration is essentially the contract address and network
information for each chain the the contract has been deployed to. Truffle
will continually update this build file as you migrate so a contract
residing on multiple networks can be interacted with using one artifact.

Unfortunately a clean method of importing the contract artifacts without
commiting them to the repo on each migration isn't in place yet. Plan is to pull
them from an S3 bucket.

### @woke/contracts-src
Solidity source code and truffle based tests.

# Deployment
The dApp client is currently deployed on netlify whilst all the back end
services are deployed on google cloud compute engine.

### Deployment branches
Deploy process
1. Make changes on feature branch
2. Merge into `develop`
3. Merge into `deploy`
4. Merge into hooked branch
..+ Netlify: `deploy-netlify`
..+ GCloud: `deploy-gcloud`

Deployment branches must always be downstream of develop.

## Hosting
### Netlify
Because of the more limited build options available on netlify, it was simplest
to avoid using any lerna dependencies and simply copy the contract artifacts
into the `@woke/app/src` on every production migration.

### Google Cloud

**Configuring docker-compose for container optimized OS**

This [tutorial](https://cloud.google.com/community/tutorials/docker-compose-on-container-optimized-os)
guides you through running Docker Compose in a container on a [Container Optimized
OS](https://cloud.google.com/container-optimized-os/docs/concepts/features-and-benefits) 
instance.

## Ethereum
Goerli is the testnet. Also configured for Rinkeby. Goerli appears to be more
reliable and less congested atm (so fresh).

# Development
No automation yet. Use these commands to set up a local dev environment.

**Nodejs:** 
Using version 10. Just use [nvm](https://github.com/nvm-sh/nvm#installing-and-updating).
```
nvm install 10.17.0
```
**App:**
To make changes to the app view you don't need any of the back-end services.

```
# View only
npm run design

# Local instance with blockchain
npm run start

```

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

*Readme TODO*
[] Dev env for testing on mobile.
[] Bot readme

