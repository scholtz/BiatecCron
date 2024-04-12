FROM ubuntu:latest

ARG DEBIAN_FRONTEND=noninteractive

RUN apt update \
  && apt dist-upgrade -y \
  && apt install bc mc wget telnet git curl iotop atop vim dnsutils jq iproute2 software-properties-common npm -y \
  && add-apt-repository 'ppa:deadsnakes/ppa' \
  && apt install python3 python3-pip -y \
  && apt dist-upgrade -y \
  && apt clean autoclean \
  && apt autoremove --yes \
  && rm -rf /var/lib/{apt,dpkg,cache,log}/ \
  && pwd

# install latest node and npm
RUN npm install -g n && n lts
RUN npm install -g npm@latest
RUN pip install algokit
RUN npm install tealscript -g

RUN useradd -ms /bin/bash app
USER app

WORKDIR /app
COPY package-lock.json package-lock.json
COPY package.json package.json
RUN npm ci
COPY . .

EXPOSE 8080
ENTRYPOINT ["npm","run","server"]