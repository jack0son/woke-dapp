FROM node:12-alpine

SHELL ["/bin/sh", "-c"]

WORKDIR /usr/src/app

RUN npm i lerna -g --loglevel notice

# Take advantage of layered caching
# http://bitjudo.com/blog/2014/03/13/building-efficient-dockerfiles-node-dot-js/
COPY package.json .
RUN npm install --loglevel notice

# Lerna will fail gracefully when packages listed inside lerna.json do not exist
COPY @woke/bot ./@woke/bot

# Actor modules
COPY @woke/lib ./@woke/lib
COPY @woke/wact ./@woke/wact
COPY @woke/web3-nact ./@woke/web3-nact
COPY @woke/actors ./@woke/actors
COPY @woke/service ./@woke/service

# Core deps
COPY @woke/contracts ./@woke/contracts
COPY @woke/twitter ./@woke/twitter

# Utils
COPY @woke/jack0son ./@woke/jack0son
COPY @woke/secrets ./@woke/secrets
# COPY @woke/test ./@woke/test

# Auth keys
COPY secrets ./secrets

COPY lerna.json .
# RUN lerna link
# RUN npm install --prefix ./@woke/lib
# RUN lerna clean --yes && lerna bootstrap
RUN lerna bootstrap -- --production --no-optional

# Add the wait script to the image
# Script originally from https://github.com/ufoscout/docker-compose-wait/releases/download/2.4.0/wait /usr/bin/wait
COPY @woke/server/scripts/wait /usr/bin/wait
RUN chmod +x /usr/bin/wait

CMD ["sh", "-c", "/usr/bin/wait && exec npm --prefix @woke/bot run tipper"]
#CMD [ "npm", "--prefix", "@woke/server", "run", "start-docker" ]
