FROM node:9.3.0
# FROM node:9.3.0-alpine

# RUN apk --no-cache add g++ gcc libgcc libstdc++ linux-headers make python
# RUN npm install --quiet node-gyp -g
# RUN apk --no-cache add --virtual native-deps \
#   g++ gcc libgcc libstdc++ linux-headers make python && \
#   npm install --quiet node-gyp -g &&\
#   npm install --quiet && \
#   apk del native-deps

COPY package.json /app/

WORKDIR /app

RUN npm install

RUN npm install -g nodemon

COPY . /app

CMD [ "npm", "start" ]
