# Build Aerospike C client
FROM alpine:3.6 as c-builder
WORKDIR /src

ENV AS_C_VERSION 4.3.5

RUN apk update
RUN apk add --no-cache \
    build-base \
    bash linux-headers \
    libuv libuv-dev \
    openssl openssl-dev \
    lua5.1 lua5.1-dev

RUN wget https://artifacts.aerospike.com/aerospike-client-c/${AS_C_VERSION}/aerospike-client-c-src-${AS_C_VERSION}.zip \
    && unzip aerospike-client-c-src-${AS_C_VERSION}.zip \
    && mv aerospike-client-c-src-${AS_C_VERSION} aerospike-client-c \
    && cd aerospike-client-c \
    && make EVENT_LIB=libuv




# Build Aerospike Node.js client
FROM node:9-alpine as node-builder
WORKDIR /src

COPY --from=c-builder /src/aerospike-client-c/target/Linux-x86_64/include/ aerospike-client-c/include/
COPY --from=c-builder /src/aerospike-client-c/target/Linux-x86_64/lib/ aerospike-client-c/lib/

ENV AS_NODEJS_VERSION 3.2.0
ENV PREFIX=/src/aerospike-client-c/

RUN apk update
RUN apk add --no-cache \
      build-base bash python linux-headers zlib-dev
RUN npm install aerospike@${AS_NODEJS_VERSION}




# Build MissionControl
FROM node:9.3.0-alpine
WORKDIR /app

COPY package.json /app/
COPY --from=node-builder /src/node_modules/ node_modules/

RUN npm install
RUN npm install -g nodemon

COPY . /app

CMD [ "npm", "start" ]

EXPOSE 8888
