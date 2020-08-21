# Jupyter Notebook Samples
<a href="https://azure.microsoft.com/en-us/services/media-services/live-video-analytics" target="_blank">Live Video Analytics on IoT Edge</a> is a new capability of Azure Media Services. Live Video Analytics (LVA) provides a platform for you to build intelligent video applications that span the Edge and the Cloud. The platform offers the capability to capture, record, analyze live video and publish the results (video and/or video analytics) to Azure services (in the Cloud and/or the Edge). The platform can be used to enhance IoT solutions with video analytics. This folder contains [Jupyter notebook](https://jupyter.org/) samples for LVA. With Jupyter, you can create and deploy LVA applications on notebooks that contain live code, equations, and formatted text. To get started, click on any of the samples listed in the table below.  

## Terminology  
In these samples, we refer to the following terms:  
- **Development PC<sup>a</sup>:** A physical or a *virtual machine* that will be used to build and deploy the sample.
- **IoT Edge Device<sup>b</sup>:** A physical or a *virtual machine* that the sample will be deployed into. Per [LVA requirements](https://docs.microsoft.com/en-us/azure/media-services/live-video-analytics-edge/overview#supported-environments), this device should be running on Linux AMD64/x64.
- **Azure Subscription:** An active [Azure subscription](https://azure.microsoft.com/) that will host LVA required services.

> [!NOTE] Your development PC and your IoT Edge device can be the same machine (i.e., developing, debugging, and deploying a sample on the same machine).

> <sup>a</sup> If you need a fresh development PC, you can create an [Azure VM - Azure Virtual Machine](https://docs.microsoft.com/en-us/azure/virtual-machines/) with an OS of your choice and connect to it with remote desktop connection for [Windows](https://docs.microsoft.com/en-us/azure/virtual-machines/windows/connect-logon) or for [Linux](https://docs.microsoft.com/en-us/azure/virtual-machines/linux/use-remote-desktop). 

> <sup>b</sup> If you don't have an IoT Edge device and want to create an Azure VM for it, our samples will guide you with required steps.

## Table of Samples
### <u>YOLOv4</u>
LVA sample using [YOLOv4](https://github.com/onnx/models/tree/master/vision/object_detection_segmentation/yolov4), a real-time convolutional neural network for real-time object detection.

| #   | Framework | Extension | Accelerator             | Test Cases Passed<sup>*</sup> |                                                                   |
|:---:|:---:      |:---:      |:---:                    |:--:                           |:--:                                                               |
| 1   | ONNX      | gRPC      | Intel® CPU              | 1, 2, 3                       |[Launch](Yolo/yolov4/yolov4-grpc-icpu-onnx/readme.md)              | 
| 2   | Darknet   | HTTP      | Intel® CPU              | 2, 3                          |[Launch](Yolo/yolov4/yolov4-http-icpu-darknet/readme.md)           | 


### <u>YOLOv3</u>
LVA sample using [YOLOv3](https://pjreddie.com/darknet/yolo/), a real-time convolutional neural network for real-time object detection.

| #   | Framework | Extension | Accelerator             | Test Cases Passed<sup>*</sup> |                                                                   |
|:---:|:---:      |:---:      |:---:                    |:--:                           |:--:                                                               |
| 3   | ONNX      | HTTP      | Intel® CPU              | 1, 2                          |[Launch](Yolo/yolov3/yolov3-http-icpu-onnx/readme.md)              | 
| 4   | ONNX      | HTTP      | NVidia GPU              | 1, 2, 3                       |[Launch](Yolo/yolov3/yolov3-http-ngpu-onnx/readme.md)              | 
| 5   | ONNX      | gRPC      | Intel® CPU              | 2                             |[Launch](Yolo/yolov3/yolov3-grpc-icpu-onnx/readme.md)              | 

### <u>Tiny YOLOv3</u>
LVA sample using Tiny YOLOv3, a lightweight variant of the YOLOv3 neural network.

| #   | Framework | Extension | Accelerator             | Test Cases Passed<sup>*</sup> |                                                                   |
|:---:|:---:      |:---:      |:---:                    |:--:                           |:--:                                                               |
| 6   | ONNX      | HTTP      | Intel® CPU              |                               |[Launch](Yolo/tinyyolov3/tinyyolov3-http-icpu-onnx/readme.md)      | 
| 7   | ONNX      | gRPC      | Intel® CPU              |                               |[Launch](Yolo/tinyyolov3/tinyyolov3-grpc-icpu-onnx/readme.md)      | 

### <u>ResNet</u>
LVA sample using [ResNet](https://github.com/onnx/models/tree/master/vision/classification/resnet), a residual neural network for image classification.

| #   | Framework | Extension | Accelerator             | Test Cases Passed<sup>*</sup> |                                                                   |
|:---:|:---:      |:---:      |:---:                    |:--:                           |:--:                                                               |
| 8   | ONNX      | HTTP      | Intel® CPU              | 2                             |[Launch](resnet/resnet50/resnet50-http-icpu-onnx/readme.md)        | 

### <u>Custom Vision</u>
LVA sample using [Azure Custom Vision](https://azure.microsoft.com/en-us/services/cognitive-services/custom-vision-service/), an easy-to-use cognitive service that lets you build, deploy, and improve your own image classifiers and object detectors. The integration of LVA with Azure Custom Vision now provides you with a simple and quick way to create an Live Video Analytics solution powered by a Custom Vision model in hours, if not minutes.

| #   | Framework | Extension | Accelerator             | Test Cases Passed<sup>*</sup> |                                                                   |
|:---:|:---:      |:---:      |:---:                    |:--:                           |:--:                                                               |
| 9   | TensorFlow| HTTP      | Intel® CPU              | 1, 2                          |[Launch](customvision/readme.md)                                   | 



### Test Cases<sup>*</sup>
| Environment | Development PC                  | IoT Edge Device               |
| :---        | :---                            | :---                          |
| 1           | Azure VM<br>-OS: Ubuntu 18.04   | Azure VM<br>-OS: Ubuntu 18.04 |
| 2           | Physical PC<br>-OS: Windows 10  | Azure VM<br>-OS: Ubuntu 18.04 |
| 3           | Physical PC<br>-OS: MacOS 15    | Azure VM<br>-OS: Ubuntu 18.04 |  
