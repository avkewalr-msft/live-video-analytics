# Yolov3 ONNX model with Flask

The following instruction will enable you to build a docker container with [Yolov3](http://pjreddie.com/darknet/yolo/) [ONNX](http://onnx.ai/) model using [Flask](https://github.com/pallets/flask). This container is reasonable to use this for development purposes but not recommended for a production deployment.

## Prerequisites
1. [Install Docker](http://docs.docker.com/docker-for-windows/install/) on your machine
2. Install [curl](http://curl.haxx.se/)

## Building the docker container

1. Create a new directory on your machine and copy all the files from this GitHub folder to that directory.
2. Build the container image (should take some minutes) by running the following docker command from a command window in that directory

    ```
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

## Upload docker image to Azure container registry

Follow instruction in [Push and Pull Docker images  - Azure Container Registry](http://docs.microsoft.com/en-us/azure/container-registry/container-registry-get-started-docker-cli) to save your image for later use on another machine.

## Deploy as an Azure IoT Edge module

Follow instruction in [Deploy module from Azure portal](https://docs.microsoft.com/en-us/azure/iot-edge/how-to-deploy-modules-portal) to deploy the container image as an IoT Edge module (use the IoT Edge module option). To submit images for inferencing, you will need to bind the container port to a host port. You can do this by specifying the following in the "Container Create Options"

```
    {
        "HostConfig": {
        "PortBindings" : {
            "8888/tcp" : [
                {
                    "HostPort": "5002"
                }
            ]
        }
    }
```

Test the container using the following command (when running it on the Edge device itself)

```
   curl -X POST http://localhost:5002/score -H "Content-Type: image/jpeg" --data-binary @<image_file_in_jpeg>
```
