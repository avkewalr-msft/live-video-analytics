# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

FROM ubuntu:18.04

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y make build-essential wget libssl-dev

RUN wget http://www.live555.com/liveMedia/public/live555-latest.tar.gz && \
    tar -xzf live555-latest.tar.gz

RUN cd live && \
    ./genMakefiles linux && \
    make

WORKDIR /live/mediaServer

ADD ./win10.mkv /live/mediaServer/media/

ENTRYPOINT [ "./live555MediaServer" ]
