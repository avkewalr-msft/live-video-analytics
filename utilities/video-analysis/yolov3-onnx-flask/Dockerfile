FROM python:3.7-slim

RUN pip install -U pip
RUN pip install numpy onnxruntime flask pillow

COPY app /app

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y wget

RUN cd app && \
    wget https://onnxzoo.blob.core.windows.net/models/opset_10/yolov3/yolov3.tar.gz && \
    tar -xzf yolov3.tar.gz && \
    rm -rf yolov3.tar.gz

# Expose the port
EXPOSE 8888

# Set the working directory
WORKDIR /app

# Run the flask server for the endpoint
CMD python -u app.py