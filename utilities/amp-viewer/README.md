# AMP viewer
This sample project is a web app and micro service which hosts the Azure Media Player. Please see the [full documentation for Azure Media Player](https://docs.microsoft.com/azure/media-services/latest/use-azure-media-player).

The amp-viewer utility is capable of playing back videos recorded as assets in Azure Media Services. The utility requires you to provide a URL in the following format.

The URL includes an Azure Media Services `asset` [see AMS Documentation here](https://docs.microsoft.com/azure/media-services/latest/assets-concept).

The format of the URL is:
```
http://<this_host>:<this_host_port>/ampplayer?ac=<ams_accountname>&an=<ams_assetname>&st=<start_time>
```
where
    ac = Account Name  
    an = Azure Media Asset Name  
    st = Start Time (in ISO-8601 format)

An example after building and running this project would be:
```
http://localhost:8094/ampplayer?ac=ams_account&an=ams_asset&st=2020-05-23T00:35:00Z
```

*Note that the asset should already have a streaming locater in order for the amp-viewer utility to stream it. See the documentation on [Streaming Locators](https://docs.microsoft.com/azure/media-services/latest/streaming-locators-concept) for more information. You can create locators using the Azure Portal as described [here](https://docs.microsoft.com/azure/media-services/latest/manage-assets-quickstart#streaming-locator)*

The URL will render the Azure Media Player and stream video from the Azure Media Service for playback. This utility is used with the reference app [Azure IoT Central live video analytics gateway module](https://github.com/Azure/live-video-analytics/tree/master/ref-apps/lva-edge-iot-central-gateway) project. This reference app records video clips into assets when objects are detected in the incoming live video, and creates URLs for those assets. This utility then allows users to view those recordings.

## Dependencies
  * Node
  * NPM
  * Docker

## Install
  * Clone the [Live Video Analytics](https://github.com/sseiber/live-video-analytics) repository
    ```
    git clone https://github.com/sseiber/live-video-analytics.git
    ```
  * cd into the amp-viewer-client project directory
    ```
    cd live-video-analytics/utilities/amp-viewer/amp-viewer-client
    ```
  * Install the packages, build the client project, and copy the results to the amp-service project
    ```
    npm i
    npm run build
    npm run copybuild
    ```
  * cd into the amp-viewer service project directory
    ```
    cd ../amp-viewer
    ```
  * Install the project dependencies and build the project
    ```
    npm i
    npm run build
    ```
  * Configure the container registry and optionally the name of your docker image by editing the *configs/imageConfig.json* file.
    ```
    {
        "arch": "amd64",
        "imageName": "<YOUR_CONTAINER_REGISTRY>/amp-viewer",
        "versionTag": "latest"
    }
    ```
  * Build the docker image
    ```
    npm run dockerbuild
    ```

## Run the docker container image
You need to create an Azure Media Services account and then collect the information corresponding to the parameters listed below. You can follow the instructions here to create an [Azure Media Services account](https://docs.microsoft.com/azure/media-services/latest/create-account-howto).
```
docker run \
    -it \
    --rm \
    -e amsAadClientId=<FROM_AZURE_PORTAL> \
    -e amsAadSecret=<FROM_AZURE_PORTAL> \
    -e amsAadEndpoint=https://login.microsoftonline.com \
    -e amsAadTenantId=<FROM_AZURE_PORTAL> \
    -e amsArmAadAudience=<FROM_AZURE_PORTAL> \
    -e amsArmEndpoint=<FROM_AZURE_PORTAL> \
    -e amsSubscriptionId=<FROM_AZURE_PORTAL> \
    -e amsResourceGroup=<FROM_AZURE_PORTAL> \
    -e amsAccountName=<FROM_AZURE_PORTAL> \
    -p 8094:8094 \
    <image-name>:<version-tag>-amd64
```

To run the pre-built docker container follow the same instructions as above but use this container image:
```
mcr.microsoft.com/lva-utilities/amp-viewer:1.0-amd64
```
