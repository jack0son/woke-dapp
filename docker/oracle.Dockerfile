FROM node:12-alpine

WORKDIR /usr/src/oracle

RUN npm i lerna -g --loglevel notice

# Take advantage of layered caching
# http://bitjudo.com/blog/2014/03/13/building-efficient-dockerfiles-node-dot-js/
COPY package.json .
RUN npm install --loglevel notice

COPY @woke/oracle ./@woke/oracle

# Actor modules
COPY @woke/wact ./@woke/wact
COPY @woke/web3-nact ./@woke/web3-nact
COPY @woke/actors ./@woke/actors
COPY @woke/service ./@woke/service

# Core deps
COPY @woke/lib ./@woke/lib
COPY @woke/contracts ./@woke/contracts
COPY @woke/twitter ./@woke/twitter

# Utils
COPY @woke/jack0son ./@woke/jack0son
COPY @woke/secrets ./@woke/secrets

# Auth keys
COPY secrets ./secrets

COPY lerna.json .
RUN lerna bootstrap -- --production --no-optional

CMD [ "npm", "--prefix", "@woke/oracle", "run", "start" ]
