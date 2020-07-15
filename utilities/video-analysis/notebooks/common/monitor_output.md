# Monitoring IoT Edge Module and IoT Hub Message Flow
In VSCode, under the "AZURE IOT HUB" panel,  
1. Right click on the device name.  
2. Click on "Start Monitoring Built-In Event Endpoint".  

    <img src="../../../../images/_monitor01.jpg" width=500px/>   

3. You will see the message flow with inference results and the video chunk logs that are sent to Azure Media Services.  

    <img src="../../../../images/_monitor02.png" width=1200px/>   

## Monitoring the archived video streams in Azure Media Services
On the Azure portal, explore the resource group used to create LVA and open the Azure Media Services resource that we created earlier in this sample. In the "assets" section of Azure Media Services, you will see chunks of recording where motion was detected.


<img src="../../../../images/_monitor03.png" width=800px/>   


To play these clips, click on the desired asset. Then, locate the "Streaming URL" textbox and click on the "Create new" link. In the pane that opens for "Add streaming locator", accept the defaults and hit "Add" at the bottom. In the Asset details page, the video player should now load to the first frame of the video, and you can hit the play button.


<img src="../../../../images/_asset-streaming-url.png" width=450px/>   

## Troubleshooting
If you need help with troubleshooting, please review the [Troubleshooting section](deploy_iotedge_modules.ipynb) or [read the LVA Troubleshooting guide](https://docs.microsoft.com/en-us/azure/media-services/live-video-analytics-edge/troubleshoot-how-to).

## Next Steps

If all the inference server works as expected, return to the Readme page to continue.   