FROM node:10-alpine

WORKDIR /usr/src/app

RUN npm i lerna -g --loglevel notice

# Take advantage of layered caching
# http://bitjudo.com/blog/2014/03/13/building-efficient-dockerfiles-node-dot-js/
COPY package.json .
RUN npm install --loglevel notice

# Lerna will fail gracefully when packages listed inside lerna.json do not exist
COPY @woke/lib ./@woke/lib
COPY @woke/wact ./@woke/wact
COPY @woke/web3-nact ./@woke/web3-nact
COPY @woke/contracts ./@woke/contracts
COPY @woke/oracle ./@woke/oracle

COPY lerna.json .
RUN lerna bootstrap

CMD [ "npm", "--prefix", "@woke/oracle", "run", "start-docker" ]
