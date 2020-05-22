# Setting up resources for the samples

This folder contains:

- [setup.sh]() is bash script intended to be use in [Azure Cloud Shell](http://shell.azure.com/). Other files in the folder are referenced by this script.
- [cloud-init.yml]() defines the configuration for the VM acting as the edge runtime for LVA. More info can be found [here](https://docs.microsoft.com/azure/virtual-machines/linux/using-cloud-init).
- [deploy.json] is an [Azure Resource Management template](https://docs.microsoft.com/azure/templates/) for deploying various resources in Azure required by the sample.
- [deployment.template.json] is a template the script uses to generate a [deployment manifest](https://docs.microsoft.com/azure/iot-edge/module-composition) for the Azure IoT Edge runtime. 
- [LVAEdgeUserRoleDefinition.json] defines a [custom role](https://docs.microsoft.com/azure/role-based-access-control/custom-roles) for use with the service principal used by LVA.

The script is aliased by https://aka.ms/lva-edge/setup-resources-for-samples
You can execute it in Cloud Shell using:

`bash -c "$(curl -sL https://aka.ms/lva-edge/setup-resources-for-samples)"`