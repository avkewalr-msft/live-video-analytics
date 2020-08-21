# LVA YOLOv3 nGPU ONNX Sample on Jupyter Notebooks 
The following instructions will enable you to run an [ONNX](http://onnx.ai/) based [YOLOv3](http://pjreddie.com/darknet/yolo/) model on Live Video Analytics (LVA) using Jupyter notebooks. This sample is specific for **Nvidia GPU accelerated IoT Edge devices**. 

The image below summarizes the deployment scheme of LVA. As the image indicates, LVA can utilize containers hosted on the Internet, on a local network, or even on a local machine.

<img src="../../../../../../images/_architecture.jpg" width=600px/>  

## Prerequisites
> **1. Install Visual Studio Code**  

We recommend using Visual Studio Code (VSCode) as it has extensions for running and managing Jupyter notebooks and IoT devices as well.  
If you do not already have it installed, please follow the [instructions to install Visual Studio Code](https://code.visualstudio.com/docs/setup/setup-overview).  

> **2. Clone this repository**  

[Clone this repository](/../../) locally into your development PC and open the repository with VSCode. 

> **3. Locate this readme file in VSCode**

>[!Note] 
> Going forward, we will be using VSCode to run this sample. Please navigate to VSCode and continue. 

In VSCode, locate this Readme page and continue reading there. You can preview Markdown (`.md`) pages by pressing `Ctrl+Shift+V` to open a full-screen window or by clicking the preview button on the top toolbar in VSCode. For pictures to render on VSCode, you must have the entire [live-video-analytics](/../..) folder open in your VSCode workspace. 
   
   <img src="../../../../../../images/_markdown_preview.png" alt="preview markdown" width=200px/> 

> **4. Install the requirements**

Install the [requirements for running LVA on Jupyter](../../../common/requirements.md) on your development PC.


## Getting Started
> **5. Set up the common environment**  

In VSCode, [set up the environment](../../../common/setup_environment.ipynb) so that you can test and deploy LVA.  

>[!NOTE]
> Jupyter notebooks (`.ipynb`) may take several seconds to render in VSCode. Please be patient.

> **6. Set up the sample specific environment**  

As this sample requires some specific settings, [set up the sample specific environment](setup_specific_environment.ipynb).

> **7. Create Azure Services**  

Create the required [Azure services](../../../common/create_azure_services.ipynb).

> **8. Create Azure VM as IoT Edge Device**  

You will need an IoT Edge device to deploy the LVA and this sample generated containers. If you don't have a physical IoT Edge device, create an [Azure virtual machine](../../../common/create_azure_vm.ipynb).

> <span style="color:red; font-weight:bold"> [!IMPORTANT] </span>  
> To run the following sections, create a GPU accelerated VM such as the Standard_NC6 VM, which has an NVidia GPU.

> **9. Install IoT Edge Runtime and Drivers on IoT Edge device**  

[Install IoT Edge runtime and the required drivers](../../../common/install_iotedge_runtime_gpu.md) for your NVidia GPU on the Edge device. 

## Build a Docker Container Image of the Inference Server Solution
The following sections will explain how to build a Docker container image of an inference server solution that uses AI logic (i.e., YOLOv3 for object detection) on a **GPU accelerated IoT Edge Device**.

> **10. Create an inference engine**  

Create a [YOLOv3 inference engine](create_yolov3_ngpu_inference_engine.ipynb). The inference engine wrapper will retrieve image data, analyze it, and return the analysis as output.

> **11. Containerize inference engine solution**  

[Create a Docker image](create_yolov3_ngpu_container_image.ipynb) to containerize the ML solution. The ML solution consists of a web application and an inference server.

Optional: [Test the Docker image locally](local_test_ngpu.ipynb) before uploading it to a container registry. 

> **12. Upload container image to ACR**

[Upload the container image](../../../common/upload_container_image_to_acr.ipynb) to your Azure Container Registry (ACR). This will make it accessible by any permitted IoT Edge device.

## Deploy the LVA Extension and LVA Modules
The following sections will let you deploy your LVA module (lvaEdge) and the LVA Extension module (lvaExtension).

> **13. Create deployment manifest file**  

[Update the deployment manifest template file](create_yolov3_ngpu_deployment_manifest.ipynb) with a custom template for this sample.  

> **14. Deploy the lvaEdge and lvaExtension modules**  

[Deploy the inference server](../../../common/deploy_iotedge_modules.ipynb) to an IoT Edge device using the deployment manifest created in the previous section. 

## Deploy Media Graphs and Test LVA
> **15. Deploy media graph**

[Deploy a media graph](../../../common/deploy_media_graph.ipynb) to trigger the inference server.

> **16. Monitor the output** 

[Monitor the output](../../../common/monitor_output.md) of the inference server and test to see if it works as desired.

If you had assets created, follow these instructions to [view those assets](../../../common/asset_playback.md).

> **17. Deactivate and delete media graph**  

Lastly, [deactivate and delete](../../../common/delete_media_graph.ipynb) the media graph to stop the inferences.

## Summary

We provide several notebooks and documents that help in running the YOLOv3 ONNX model on Live Video Analytics:

| Notebook or Document Name                                                                 | Description                                                                                              |
| ---------------------------------------------------------------------------------------   | ---------------------------------------------------------------------------------------------------------|
| [requirements.md](../../../common/requirements.md)                                        | Document that will help you install tools for getting started with this sample                           |
| [setup_environment.ipynb](../../../common/setup_environment.ipynb)                        | Notebook that will help set up the environment so that we can test and deploy LVA                        |
| [setup_specific_environment.ipynb](setup_specific_environment.ipynb)                      | Notebook that will help set up a specific environment for this sample                                    |
| [create_azure_services.ipynb](../../../common/create_azure_services.ipynb)                | Notebook that will help create the required Azure resources                                              |
| [create_azure_vm.ipynb](../../../common/create_azure_vm.ipynb)                            | Notebook that will help choose and configure a virtual machine that will act as the IoT Edge device      |
| [install_iotedge_runtime_gpu.md](../../../common/install_iotedge_runtime_gpu.md)          | Document that will help install IoT Edge runtime and other tools on your IoT Edge device                 |
| [create_yolov3_ngpu_inference_engine.ipynb](create_yolov3_ngpu_inference_engine.ipynb)    | Notebook that will help create a nGPU accelerated YOLOv3 inference engine                               |
| [create_yolov3_ngpu_container_image.ipynb](create_yolov3_ngpu_container_image.ipynb)      | Notebook that will help create a Docker container image. This image acts as an inference server with a scoring REST endpoint |
| [upload_container_image_to_acr.ipynb](../../../common/upload_container_image_to_acr.ipynb)| Notebook that will help upload your local container to Azure Container Registry (ACR)                    |
| [create_yolov3_ngpu_deployment_manifest.ipynb](create_yolov3_ngpu_deployment_manifest.ipynb) | Notebook that will help create a custom deployment manifest file by updating a template |
| [deploy_iotedge_modules.ipynb](../../../common/deploy_iotedge_modules.ipynb)              | Notebook that will help deploy the lvaEdge and lvaExtension modules                                      |
| [deploy_media_graph.ipynb](../../../common/deploy_media_graph.ipynb)                      | Notebook that will help deploy a media graph to your IoT Edge device to activate inference capabilities  |
| [monitor_output.md](../../../common/monitor_output.md)                                    | Document that will help you monitor the output of LVA                                                    |
| [asset_playback.md](../../../common/asset_playback.md)                                    | Document that will help you play back inference outputs on Azure Media Services                          |
| [delete_media_graph.ipynb](../../../common/delete_media_graph.ipynb)                      | Notebook thatt will help you deactivate and delete the media graph                                       |