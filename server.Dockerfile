FROM node:10-alpine

WORKDIR /usr/src/app

RUN npm i lerna -g --loglevel notice

# Take advantage of layered caching
# http://bitjudo.com/blog/2014/03/13/building-efficient-dockerfiles-node-dot-js/
COPY package.json .
RUN npm install --loglevel notice

# Lerna will fail gracefully when packages listed inside lerna.json do not exist
COPY @woke/lib ./@woke/lib
COPY @woke/actors ./@woke/actors
COPY @woke/wact ./@woke/wact
COPY @woke/web3-nact ./@woke/web3-nact
COPY @woke/contracts ./@woke/contracts
COPY @woke/server ./@woke/server
COPY @woke/funder ./@woke/funder

COPY lerna.json .
RUN lerna bootstrap

# Add the wait script to the image
# Script originally from https://github.com/ufoscout/docker-compose-wait/releases/download/2.4.0/wait /usr/bin/wait
COPY @woke/server/scripts/wait /usr/bin/wait
RUN chmod +x /usr/bin/wait

CMD ["sh", "-c", "/usr/bin/wait && exec npm --prefix @woke/server run start"]
#CMD [ "npm", "--prefix", "@woke/server", "run", "start-docker" ]
