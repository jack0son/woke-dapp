# woke-dapp
Mono repo for the woke dApp client, smart-contracts, and back-end services. 


## Repo Structure

### Contract Artifacts
The contract artifacts which are built by truffle contain the compiled contract
binaries, method interfaces, and the migration configuration.



# Deployment
The dApp client is currently deployed on netlify whilst all the back end
services are deployed on google cloud compute engine.

## App Services
### Netlify
Because of the more limited build options available on netlify, it was simplest
to avoid using any lerna dependencies and simply copy the contract artifacts
into the `@woke/app/src` on every production migration.

### Google Cloud

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






