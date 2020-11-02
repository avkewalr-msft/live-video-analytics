# Azure IoT Central gateway module for Live Video Analytics
 Live Video Analytics on IoT Edge. It is used when you build and deploy an app for analyzing live video using an Azure IoT Central app template. The full tutorial showing how to modify and use this IoT Edge module code can be found at [Tutorial: Build and register the LVA Gateway Module](https://docs.microsoft.com/azure/iot-central/retail/tutorial-video-analytics-build-module).

To learn how to use Live Video Analytics on IoT Edge see the full documentation at [Live Video Analytics on IoT Edge documentation](https://docs.microsoft.com/en-us/azure/media-services/live-video-analytics-edge/).

## Prerequisites
To complete the steps in this tutorial, you need:
* [Node.js](https://nodejs.org/en/download/) v13 or later
* [Visual Studio Code](https://code.visualstudio.com/Download) with [TSLint](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-tslint-plugin) extension installed
* [Docker](https://www.docker.com/products/docker-desktop) engine
* An [Azure Container Registry](https://docs.microsoft.com/azure/container-registry/) to host your versions of the modules
* An [Azure Media Services](https://docs.microsoft.com/azure/media-services/) account.

## Clone the repository
If you haven't already cloned the repository, use the following command to clone it to a suitable location on your local machine:
```
git clone https://github.com/Azure/live-video-analytics
```
Open the cloned **live-video-analytics** repository and cd into the *ref-apps/lva-edge-iot-central-gateway* folder with VS Code.

## Edit the deployment.amd64.json file
1. If you haven't already done so, create a folder called *storage* in the project folder. This folder is ignored by Git so as to prevent you accidentally checking in any confidential information.
1. Copy the file setup/deployment.amd64.json* and save it in the *storage* folder.
1. In VS Code, open the the *storage/deployment.amd64.json* file.
1. Edit the `registryCredentials` section to add your Azure Container Registry credentials.
1. Edit the `LvaEdgeGatewayModule` module section to add the name of your image and your AMS account name in the `env:amsAccountName:value`.
1. See the [Create a Live Video Analytics application in Azure IoT Central](https://docs.microsoft.com/azure/iot-central/retail/tutorial-video-analytics-create-app) for more information about how to complete the configuration.

## Build the code
1. Before you try to build the code for the first time, run the install command. This command installs the required packages and runs the setup scripts.
    ```
    npm install
    ```
1. Edit the *./setup/imageConfig.json* file to update the image named based on your container registry name:
    ```
    {
        "arch": "[amd64|arm64v8]",
        "imageName": "[Server].azurecr.io/lva-edge-gateway",
        "versionTag": "latest"
    }
    ```
3. Use the VS Code terminal to run the docker login command. Use the same credentials that you provided in the deployment manifest for the modules.
    ```
    docker login [your server].azurecr.io
    ```

4. Use the VS Code terminal to run the commands to build the image and push it to your docker container registry. The build scripts deploy the image to your container registry. The output in the VS Code terminal window shows you if the build is successful.
    ```
    npm run dockerbuild
    npm run dockerpush
    ```
