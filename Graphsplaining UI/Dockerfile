FROM node:12.7-alpine

RUN npm install -g react-scripts
RUN mkdir -p /usr/src/app
COPY package.json /usr/src/app/package.json

WORKDIR /usr/src/app
RUN npm install

COPY . /usr/src/app

CMD ["npm", "start"]
