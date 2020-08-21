# YOLOv4 Darknet model

The following instructions will enable you to build a Docker container with Darknet [YOLOv4](http://pjreddie.com/darknet/yolo/) model using [opencv](https://opencv.org/), [cpprestsdk](https://github.com/microsoft/cpprestsdk/).

Note: References to third-party software in this repo are for informational and convenience purposes only. Microsoft does not endorse nor provide rights for the third-party software. For more information on third-party software please see the links provided above.

## Contributions needed

* Production ready C++ REST API Server   
    - To consider: https://pocoproject.org, https://github.com/boostorg/beast

## Prerequisites

1. [Install Docker](http://docs.docker.com/docker-for-windows/install/) on your machine
2. Install [curl](http://curl.haxx.se/)
3. A sample JPEG image containing the objects you want to have detected

## Building the Docker container

Ensure that [Docker is running on your machine.](https://docs.docker.com/docker-for-windows/install/#start-docker-desktop)

Navigate to the directory where you have cloned your repository.
Now, build the container image (should take some minutes) by running the following Docker command from a command window in that directory

```bash
    docker build . -t lvaextension:yolov4.v1
```

## Running and testing

Run the container using the following Docker command

```bash
    docker run --name my_container -p 8080:44000 -d -i lvaextension:yolov4.v1
```

Note that you can use any host port that is available instead of 8080.

Test the container using the following commands

### /score

To get a list of detected objects using the following command

```bash
   curl -X POST http://127.0.0.1:8080/score -H "Content-Type: image/jpeg" --data-binary @<image_file_in_jpeg>
```

If successful, you will see JSON printed on your screen that looks something like this

```JSON
{
    "inferences": [
        {
            "type": "entity",
            "entity": {
                "tag": {
                    "value": "person",
                    "confidence": 0.959613
                },
                "box": {
                    "l": 0.692427,
                    "t": 0.364723,
                    "w": 0.084010,
                    "h": 0.077655
                }
            }
        },
        {
            "type": "entity",
            "entity": {
                "tag": {
                "value": "vehicle",
                "confidence": 0.929751
                },
                "box": {
                    "l": 0.521143,
                    "t": 0.446333,
                    "w": 0.166306,
                    "h": 0.126898
                }
            }
        }
    ]
}
```

## Terminating

Terminate the container using the following Docker commands

```bash
    docker stop my_container
    docker rm my_container
```

## Upload Docker image to Azure container registry

Follow instruction in [Push and Pull Docker images - Azure Container Registry](http://docs.microsoft.com/en-us/azure/container-registry/container-registry-get-started-docker-cli) to save your image for later use on another machine.

## Deploy as an Azure IoT Edge module

Follow instruction in [Deploy module from Azure portal](https://docs.microsoft.com/en-us/azure/iot-edge/how-to-deploy-modules-portal) to deploy the container image as an IoT Edge module (use the IoT Edge module option).
