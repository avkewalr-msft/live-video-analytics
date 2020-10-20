# Tiny YOLOv4 TensorFlow Lite model

The following instructions will enable you to build a docker container with a [YOLOv4 (tiny)](https://github.com//AlexeyAB/darknet) [TensorFlow Lite](https://www.tensorflow.org/lite) model using [nginx](https://www.nginx.com/), [gunicorn](https://gunicorn.org/), [flask](https://github.com/pallets/flask), and [runit](http://smarden.org/runit/).  The app code is based on the [tensorflow-yolov4-tflite](https://github.com/hunglc007/tensorflow-yolov4-tflite) project.  This project uses TensorFlow v2.3.0.

Note: References to third-party software in this repo are for informational and convenience purposes only. Microsoft does not endorse nor provide rights for the third-party software. For more information on third-party software please see the links provided above.

## Prerequisites
1. [Install Docker](http://docs.docker.com/docker-for-windows/install/) on your machine
2. Install [curl](http://curl.haxx.se/)

## Building the docker container

1. Create a new directory on your machine and copy all the files (including the sub-folders) from this GitHub folder to that directory.
2. Build the container image (should take some minutes) by running the following docker command from a command window in that directory.

```bash
docker build . -t yolov4-tflite-tiny:latest
```
    
## Running and testing

The REST endpoint accepts an image with the size of 416 pixels by 416 pixels. This is requirement by the tiny YOLOv4 model. Since the LVA edge module is capable of sending specified size image in specified format, we are not preprocessing the incoming images to resize them. This is mainly because of the performance improvement.

Run the container using the following docker command.

```bash
docker run --name my_yolo_container -p 80:80 -d  -i yolov4-tflite-tiny:latest
```

Test the container using the following commands.

### /score
To get a list of detected objects, use the following command.

```bash
curl -X POST http://127.0.0.1/score -H "Content-Type: image/jpeg" --data-binary @<full_path_to_image_file_in_jpeg>
```
If successful, you will see JSON printed on your screen that looks something like this
```json
{
  "inferences": [
    {
      "type": "entity",
      "entity": {
        "tag": {
          "value": "zebra",
          "confidence": "0.8333446"
        },
        "box": {
          "l": "0.6046585",
          "t": "0.4014857",
          "w": "0.21853799",
          "h": "0.49041268"
        }
      }
    },
    {
      "type": "entity",
      "entity": {
        "tag": {
          "value": "giraffe",
          "confidence": "0.769461"
        },
        "box": {
          "l": "0.33088243",
          "t": "0.0015953871",
          "w": "0.5128964",
          "h": "0.83996487"
        }
      }
    }
  ]
}
```

Terminate the container using the following docker commands.

```bash
docker stop my_yolo_container
docker rm my_yolo_container
```

## Upload docker image to Azure container registry

Follow instruction in [Push and Pull Docker images - Azure Container Registry](http://docs.microsoft.com/en-us/azure/container-registry/container-registry-get-started-docker-cli) to save your image for later use on another machine.

## Deploy as an Azure IoT Edge module

Follow instruction in [Deploy module from Azure portal](https://docs.microsoft.com/en-us/azure/iot-edge/how-to-deploy-modules-portal) to deploy the container image as an IoT Edge module (use the IoT Edge module option). 

## Helpful links

- [`darknet` implementation for YOLOv4](https://github.com/AlexeyAB/darknet)
- [TensorFlow YOLOv4 converters and implementations](https://github.com/hunglc007/tensorflow-yolov4-tflite)
