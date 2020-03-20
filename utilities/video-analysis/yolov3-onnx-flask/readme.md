# Yolov3 ONNX model with Flask

The following instruction will enable you to build a docker container with [Yolov3](http://pjreddie.com/darknet/yolo/) [ONNX](http://onnx.ai/) model using [Flask](https://github.com/pallets/flask)

## Prerequisites
1. [Install Docker](http://docs.docker.com/docker-for-windows/install/) on your machine
2. Install [curl](http://curl.haxx.se/)

## Building the docker container

1. Create a new directory on your machine and copy all the files from this GitHub folder to that directory.
2. Build the container image (should take some minutes) by running the following docker command from a command window in that directory

    ```powershell
    docker build . -t yolov3-onnx:latest
    ```
    
## Running and testing

Run the container using the following docker command

```
    docker run --name my_yolo_container -d  -i yolov3-onnx:latest
```

Get the IP address of the container by running the following command (replace grep with findstr if running on Windows)
```
    docker inspect my_yolo_container | grep IPAddress
```

Test the container using the following command

```
   curl -X POST http://<my_yolo_container_ip_address>:8888/score -H "Content-Type: image/jpeg" --data-binary @<image_file_in_jpeg>
```

If everything worked as expected, you should see a JSON output with the list of detected objects
