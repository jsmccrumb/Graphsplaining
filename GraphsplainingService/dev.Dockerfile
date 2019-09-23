FROM node:12.7-alpine

RUN npm install -g nodemon
RUN mkdir -p /usr/src/app
COPY package.json /usr/src/app/package.json
COPY package-lock.json /usr/src/app/package-lock.json

WORKDIR /usr/src/app
RUN npm install

COPY . /usr/src/app

CMD ["npx", "nodemon", "index.js"]
