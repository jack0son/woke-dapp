#  Woke Network 🐦<--->🌐³
**Bridging Twitter to Web3**

Woke Network delivers much needed curation mechanics to the world's (broken) forum.  It is a bridge to the decentralised online communities of the future.

Crypto-incentivised social networks are the way of the future. Steemit and Cent provide curation mechanisms using the programmable market mechanisms native to blockchains, but if a tree falls in the forest and no one tweets about it...

**v0.1.0 Alpha**
1. 💸 **Issuance** Securitisation of followers using a novel issuance method called
   an "influence bonding curve"
2. 🏭 **Minting** Creation of a social currency with the following properties that
   is readily spent and equitably distributed.
3. 👛 **Onboarding** “Walletless” onboarding for non-crypto users into the web3
   ecosystem.
4. 🍄 **Powerups** (walletless transfers) send tokens to any user on
   twitter using a tweet.


**Repo Contents**

Monerepo for the Woke Network dApp client, smart-contracts, and back-end services. 

## Economics


## Repo Structure
Packages `@woke/PACKAGE`

### @woke/app
React app.

### @woke/server
Burner wallet authentication and wallet funder. The current approach to wallet
funding is highly wasteful, inefficient and insecure... we are on testnet.

### @woke/lib
Web3 init, twitter client, utils.

### @woke/bot
Tipping, twitter notifications, leaderboard, token distribution. 

Architecture is centred around the actor model, courtesty of [Nact](https://nact.io).
Learning from the excitement of managing web3 connections, providers and
transctions in the funder, oracle and app, a more fault tolerant and 
*decoupled* structure for dealing with ethereum interactions was needed.

Actors help seperate the frequent and broad set of errors that occur in web3
calls, from the simple core functionality we want: sending transactions and
subscribing to events.

For example:
* Provider / websocket connection errors
* Nonce errors
* Transaction errors (paramaters, client, node, eth network, onchain, etc)

The web3 service (a set of actors) takes responsibility for blockchain
nuances, applying its own policies for problems like account balances, gas
usage, and node availability, giving the rest of the application (other services)
a much smaller error surface to work with and some clean assumptions for how
web3 interactions are handled.

One such assumption is that transactions will never fail due a lack of
connection to the ethereum node. Once the web3 service receives a transaction
message, it becomes responsible for confirming it with the network. Upon
failure, the requesting service receives a message which enacts it's
own policies for dealing with reverts and incorrect parameters.

Once the actors library is tested and cleaned up it will replace existing
server-side web3 code in the oracle and wallet funder.

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
* Solidity source code and truffle based tests.
* Ethereum testchain (ganache), and deployment configuration.

# Deployment
The dApp client is currently deployed on netlify whilst all the back end
services are deployed on google cloud compute engine.

### Deployment branches
Deploy procedure:
1. Make changes on feature branch
2. Merge into `develop`
3. Merge into `deploy`
4. Merge into hooked branch
.. + Netlify: `deploy-netlify`
.. + GCloud: `deploy-gcloud`
Deployment branches must always be downstream of develop.

SSH into deployment instance.
1. Checkout `deploy`
2. `git pull`
3. `bash ./scripts/pull.sh`
4. `docker-compose -f server.docker-compose.yml up -d`
5. `docker-compose -f bot.docker-compose.yml up -d`

## Hosting
### Netlify
Because of the more limited build options available on netlify (and not wanting 
to fiddle with webpack just yet), it was simplest to avoid using any lerna
dependencies and simply copy the contract artifacts into the `@woke/app/src`
on every production migration.

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

**Monorepo setup:**
```
# In project root dir
npm install -g lerna
lerna bootstrap
```

**App:**
To make changes to the app view you don't need any of the back-end services.
To test with local ethereum functionality you must be running the server and
oracle.

```
# View only
npm run design

# Local instance with blockchain
npm run start

```

**Mock ethereum blockchain:**
```
cd @woke/contracts-src
npm run ganache:client

# New terminal
cd @woke/contracts-src
./migrate.sh development
# if this command doesn't work try
bash migrate.sh development
# OR
sh migrate.sh development

# OR if you aren't on unix (god help you)
npm run migrate:client
# Then copy @woke/contracts-src/build/contracts/[WokeToken.json, TwitterOracleMock.json] to @woke/contracts/development/
```

**Server:**

```
# Make sure docker is running.
dockerd
# you'll have to use sudo dockerd if you haven't followed the docker
post-install instructions

# Run server DB in docker container
cd @woke/server
npm run db
npm run dev
```

**Oracle:**
```
npm run dev
```

**Bot:**
Not dependency of app.
```
npm run db
npm run dev
```

## Docker
1. You could use this naughty install script, but it's generally a bad idea to
  sudo run scripts from the internet.
* HEED THE [WARNINGS](https://docs.docker.com/install/linux/docker-ce/ubuntu/#install-using-the-convenience-script)
2. OR [Ubuntu installation](https://docs.docker.com/install/linux/docker-ce/ubuntu/)
* [Run docker commands from user land (without
  sudo)](https://docs.docker.com/install/linux/linux-postinstall/)


**Readme TODO**
* [] Dev env for testing on mobile.
* [] Bot readme
