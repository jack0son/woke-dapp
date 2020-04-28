FROM node:10-alpine

WORKDIR /usr/src/app

RUN npm i lerna -g --loglevel notice

# Take advantage of layered caching
# http://bitjudo.com/blog/2014/03/13/building-efficient-dockerfiles-node-dot-js/
COPY package.json .
RUN npm install --loglevel notice

# Lerna will fail gracefully when packages listed inside lerna.json do not exist
COPY @woke/lib ./@woke/lib
COPY @woke/bot ./@woke/bot
COPY @woke/contracts ./@woke/contracts
COPY @woke/tiny-oracle ./@woke/tiny-oracle

COPY lerna.json .
RUN lerna bootstrap

CMD [ "npm", "--prefix", "@woke/tiny-oracle", "run", "start-docker" ]
