FROM python:3.8-slim

WORKDIR /lvaextension

RUN pip install -U pip

RUN	pip install grpcio grpcio-tools opencv-python \
	&& apt-get update && apt-get install -y --no-install-recommends \
	libglib2.0-0 libsm6 libxext6 libxrender-dev libgl1-mesa-dev \
	cmake gcc g++ make libgomp1 libprotobuf-dev wget \
	&& pip install onnxruntime scipy \
    \
    && wget https://media.githubusercontent.com/media/onnx/models/master/vision/object_detection_segmentation/yolov4/model/yolov4.onnx -q --show-progress --progress=bar:force 2>&1 \
    && wget https://raw.githubusercontent.com/hunglc007/tensorflow-yolov4-tflite/master/data/classes/coco.names -q --show-progress --progress=bar:force 2>&1 \
    && wget https://raw.githubusercontent.com/onnx/models/master/vision/object_detection_segmentation/yolov4/dependencies/yolov4_anchors.txt -q --show-progress --progress=bar:force 2>&1 \
    \
    && apt-get purge -y --auto-remove \
        cmake make gcc g++ wget \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

COPY server/* ./
COPY lib/* ./

CMD ["python", "server.py", "-p", "44000"]