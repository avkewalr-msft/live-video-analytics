# Yolov3 ONNX model

The following instruction will enable you to build a docker container with [Yolov3](http://pjreddie.com/darknet/yolo/) [ONNX](http://onnx.ai/) model using [nginx](https://www.nginx.com/), [gunicorn](https://gunicorn.org/), [flask](https://github.com/pallets/flask), and [runit](http://smarden.org/runit/).

Note: References to third-party software in this repo are for informational and convenience purposes only. Microsoft does not endorse nor provide rights for the third-party software. For more information on third-party software please see the links provided above.

## Contributions needed
* Improved logging
* Graceful shutdown of nginx and gunicorn

## Prerequisites
1. [Install Docker](http://docs.docker.com/docker-for-windows/install/) on your machine
2. Install [curl](http://curl.haxx.se/)

## Building the docker container

1. Create a new directory on your machine and copy all the files (including the sub-folders) from this GitHub folder to that directory.
2. Build the container image (should take some minutes) by running the following docker command from a command window in that directory

    ```
    docker build . -t yolov3-onnx:latest
    ```
    
## Running and testing

Run the container using the following docker command

```
    docker run  --name my_yolo_container -d  -i yolov3-onnx:latest
```

Get the IP address of the container by running the following command (replace grep with findstr if running on Windows)
```
    docker inspect my_yolo_container | grep IPAddress
```

Test the container using the following command

```
   curl -X POST http://<my_yolo_container_ip_address>/score -H "Content-Type: image/jpeg" --data-binary @<image_file_in_jpeg>
```

If everything worked as expected, you should see a JSON output with the list of detected objects.

To see the bounding boxes overlaid on the image run the following command

```
   curl -X POST http://<my_yolo_container_ip_address>/annotate -H "Content-Type: image/jpeg" --data-binary @<image_file_in_jpeg> --output out.jpeg
```

If successful, you will see a file out.jpeg with bounding boxes overlaid on the input image.

## Upload docker image to Azure container registry

Follow instruction in [Push and Pull Docker images  - Azure Container Registry](http://docs.microsoft.com/en-us/azure/container-registry/container-registry-get-started-docker-cli) to save your image for later use on another machine.

## Deploy as an Azure IoT Edge module

Follow instruction in [Deploy module from Azure portal](https://docs.microsoft.com/en-us/azure/iot-edge/how-to-deploy-modules-portal) to deploy the container image as an IoT Edge module (use the IoT Edge module option). 

