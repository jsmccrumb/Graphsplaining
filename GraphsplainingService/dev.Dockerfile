FROM node:12.7-alpine

RUN mkdir -p /usr/src/app
RUN npm install -g nodemon
COPY package.json /usr/src/app/package.json
COPY package-lock.json /usr/src/app/package-lock.json

WORKDIR /usr/src/app
RUN npm install

COPY . /usr/src/app

CMD ["nodemon", "index.js"]
