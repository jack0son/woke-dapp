FROM node:12-alpine

SHELL ["/bin/sh", "-c"]

WORKDIR /usr/src/app

RUN npm i lerna -g --loglevel notice

COPY package.json .
RUN npm install --loglevel notice

COPY @woke/bot ./@woke/bot

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
RUN lerna bootstrap

COPY @woke/server/scripts/wait /usr/bin/wait
RUN chmod +x /usr/bin/wait

CMD ["sh", "-c", "/usr/bin/wait && exec npm --prefix @woke/bot run tipper"]
