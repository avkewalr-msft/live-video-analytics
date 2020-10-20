#!/bin/bash
runsvdir /var/runit &
export GST_DEBUG=3
# Copy nvidia pyds module
cp /opt/nvidia/deepstream/deepstream-5.0/lib/pyds.so /app
cp /opt/nvidia/deepstream/deepstream-5.0/lib/setup.py /app
# Copy nvidia deepstream models
cp -r /opt/nvidia/deepstream/deepstream-5.0/samples/models/ /app
python3 setup.py install
python3 main.py -p 5001
