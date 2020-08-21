FROM ubuntu:18.04

ARG WORK_DIR=/lvaextension
WORKDIR ${WORK_DIR}
ENV LD_LIBRARY_PATH=${WORK_DIR}

COPY * ${WORK_DIR}/

RUN apt-get update && apt-get upgrade -y \
    && apt-get install -y --no-install-recommends \
        build-essential cmake git ca-certificates wget libcpprest-dev \
        libtbb2 libtbb-dev pkg-config libswscale-dev libjpeg-dev libeigen3-dev liblapacke-dev libopenblas-dev libatlas-base-dev \
    && git clone https://github.com/opencv/opencv.git \
    && mkdir opencvbuild && cd opencvbuild \
    && cmake -D CMAKE_BUILD_TYPE=Release -D CMAKE_INSTALL_PREFIX=/usr/local -D BUILD_LIST=core,imgcodecs,imgproc,highgui,videoio,video -D OPENCV_GENERATE_PKGCONFIG=ON ../opencv \
    && make -j$(nproc) && make install \
    && cd ${WORK_DIR} && rm -rf opencv && rm -rf opencvbuild \
    \
    && wget https://github.com/AlexeyAB/darknet/releases/download/darknet_yolo_v3_optimal/yolov4.weights  -q --show-progress --progress=bar:force 2>&1 \
    && wget https://github.com/AlexeyAB/darknet/releases/download/darknet_yolo_v4_pre/yolov4-tiny.weights  -q --show-progress --progress=bar:force 2>&1 \
    && git clone https://github.com/AlexeyAB/darknet.git \
    && cd darknet \
    && sed -i 's/OPENCV=0/OPENCV=1/' Makefile \
    && sed -i 's/AVX=0/AVX=1/' Makefile \
    && sed -i 's/OPENMP=0/OPENMP=1/' Makefile \
    && sed -i 's/LIBSO=0/LIBSO=1/' Makefile \
    && sed -i 's/width=608/width=416/' cfg/yolov4.cfg \
    && sed -i 's/height=608/height=416/' cfg/yolov4.cfg \
    && make \
    \
    && cd ${WORK_DIR} \
    && cp darknet/cfg/yolov4.cfg ${WORK_DIR} \
    && cp darknet/data/coco.names ${WORK_DIR} \
    && cp darknet/libdarknet.so ${WORK_DIR} \
    && make \
    && rm *.cpp *.h Makefile \
    && rm -rf darknet \
    \
    && apt-get purge -y --auto-remove \
        build-essential cmake git ca-certificates wget \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

CMD ["./lvaextension"]