# FROM daocloud.io/library/node:12
FROM daocloud.io/library/ubuntu:20.04

RUN apt-get update
RUN apt-get install -y curl 

#install node.12
RUN curl -fsSL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get install -y nodejs

#install package.json
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --silent && mv node_modules ../

## context
COPY . .

RUN npm i
RUN npm link 

#download from https://github.com/Medium/phantomjs/releases/download/v2.1.1/phantomjs-2.1.1-linux-x86_64.tar.bz2
COPY ./phantomjs-2.1.1-linux-x86_64.tar.bz2 /tmp/phantomjs/phantomjs-2.1.1-linux-x86_64.tar.bz2
RUN bash ./init install

# override node 
ENTRYPOINT [ "node", "/usr/bin/zero-test" ]

CMD ["--help"]
