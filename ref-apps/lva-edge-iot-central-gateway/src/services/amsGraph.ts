import {
    ICameraDeviceProvisionInfo,
    ModuleService
} from './module';
import { Message as IoTMessage } from 'azure-iot-device';
import * as fse from 'fs-extra';
import { resolve as pathResolve } from 'path';
import * as moment from 'moment';

const contentRootDirectory = process.env.CONTENT_ROOT || '/data/content';

export class AmsGraph {
    public static async createAmsGraph(lvaGatewayModule: ModuleService, amsAccountName: string, cameraInfo: ICameraDeviceProvisionInfo): Promise<AmsGraph> {
        try {
            const graphInstancePath = pathResolve(contentRootDirectory, `${cameraInfo.detectionType}GraphInstance.json`);
            const graphInstance = fse.readJSONSync(graphInstancePath);

            graphInstance.name = cameraInfo.cameraId;

            // lvaGatewayModule.logger(['AmsGraph', 'info'], `### graphData: ${JSON.stringify(graphInstance, null, 4)}`);

            const graphTopologyPath = pathResolve(contentRootDirectory, `${cameraInfo.detectionType}GraphTopology.json`);
            const graphTopology = fse.readJSONSync(graphTopologyPath);

            // lvaGatewayModule.logger(['AmsGraph', 'info'], `### graphData: ${JSON.stringify(graphTopology, null, 4)}`);

            const amsGraph = new AmsGraph(lvaGatewayModule, amsAccountName, cameraInfo, graphInstance, graphTopology);

            return amsGraph;
        }
        catch (ex) {
            lvaGatewayModule.logger(['AmsGraph', 'error'], `Error while loading graph topology: ${ex.message}`);
        }
    }

    public static getCameraIdFromLvaMessage(message: IoTMessage): string {
        const subject = AmsGraph.getLvaMessageProperty(message, 'subject');
        if (subject) {
            const graphPathElements = subject.split('/');
            if (graphPathElements.length >= 3 && graphPathElements[1] === 'graphInstances') {
                const graphInstanceName = graphPathElements[2] || '';
                if (graphInstanceName) {
                    return graphInstanceName.substring(graphInstanceName.indexOf('_') + 1) || '';
                }
            }
        }

        return '';
    }

    public static getLvaMessageProperty(message: IoTMessage, propertyName: string): string {
        const messageProperty = (message.properties?.propertyList || []).find(property => property.key === propertyName);

        return messageProperty?.value || '';
    }

    private lvaGatewayModule: ModuleService;
    private amsAccountName: string;
    private amsAssetName: string;
    private rtspUrl: string;
    private rtspAuthUsername: string;
    private rtspAuthPassword: string;
    private instance: any;
    private topology: any;
    private instanceName: any;
    private topologyName: any;

    constructor(lvaGatewayModule: ModuleService, amsAccountName: string, cameraInfo: ICameraDeviceProvisionInfo, instance: any, topology: any) {
        this.lvaGatewayModule = lvaGatewayModule;
        this.amsAccountName = amsAccountName;
        this.amsAssetName = '';
        this.rtspUrl = cameraInfo.rtspUrl;
        this.rtspAuthUsername = cameraInfo.rtspAuthUsername;
        this.rtspAuthPassword = cameraInfo.rtspAuthPassword;
        this.instance = instance;
        this.topology = topology;

        this.instanceName = {
            ['@apiVersion']: instance['@apiVersion'],
            name: instance.name
        };

        this.topologyName = {
            ['@apiVersion']: topology['@apiVersion'],
            name: topology.name
        };
    }

    public getInstance() {
        return this.instance;
    }

    public getTopology() {
        return this.topology;
    }

    public getInstanceName() {
        return this.instanceName?.name || '';
    }

    public getTopologyName() {
        return this.topologyName?.name || '';
    }

    public setParam(paramName: string, value: any) {
        if (!paramName || value === undefined) {
            this.lvaGatewayModule.logger(['AmsGraph', 'error'], `setParam error - param: ${paramName}, value: ${value}`);
            return;
        }

        const params = this.instance.properties?.parameters || [];
        const param = params.find(item => item.name === paramName);
        if (!param) {
            this.lvaGatewayModule.logger(['AmsGraph', 'warning'], `setParam no param named: ${paramName}`);
            return;
        }

        param.value = value;
    }

    public async startLvaGraph(graphParameters: any): Promise<boolean> {
        this.lvaGatewayModule.logger(['AmsGraph', 'info'], `startLvaGraph`);

        let result = false;

        try {
            result = await this.setTopology();

            if (result === true) {
                result = await this.setInstance(graphParameters);
            }

            if (result === true) {
                result = await this.activateInstance();
            }
        }
        catch (ex) {
            this.lvaGatewayModule.logger(['AmsGraph', 'error'], `startLvaGraph error: ${ex.message}`);
        }

        return result;
    }

    public async stopLvaGraph(): Promise<boolean> {
        this.lvaGatewayModule.logger(['AmsGraph', 'info'], `stopLvaGraph`);

        let result = false;

        try {
            await this.deactivateInstance();

            result = true;
        }
        catch (ex) {
            this.lvaGatewayModule.logger(['AmsGraph', 'error'], `stopLvaGraph error: ${ex.message}`);
        }

        return result;
    }

    public async deleteLvaGraph(): Promise<boolean> {
        this.lvaGatewayModule.logger(['AmsGraph', 'info'], `deleteLvaGraph`);

        let result = false;

        try {
            await this.deactivateInstance();
            await this.deleteInstance();
            await this.deleteTopology();

            result = true;
        }
        catch (ex) {
            this.lvaGatewayModule.logger(['AmsGraph', 'error'], `deleteLvaGraph error: ${ex.message}`);
        }

        return result;
    }

    public createInferenceVideoLink(videoPlaybackHost: string, startTime: moment.Moment, duration: number): string {
        if (videoPlaybackHost.slice(-1) === '/') {
            videoPlaybackHost = videoPlaybackHost.slice(0, -1);
        }

        return `${videoPlaybackHost}/ampplayer?ac=${this.amsAccountName}&an=${this.amsAssetName}&st=${startTime.format('YYYY-MM-DDTHH:mm:ss[Z]')}&du=${duration}`;
    }

    private async setTopology(): Promise<boolean> {
        const response = await this.lvaGatewayModule.invokeLvaModuleMethod(`GraphTopologySet`, this.topology);
        return (response.status || 500) > 299 ? false : true;
    }

    // @ts-ignore
    private async deleteTopology() {
        return this.lvaGatewayModule.invokeLvaModuleMethod(`GraphTopologyDelete`, this.topologyName);
    }

    private async setInstance(graphParameters: any): Promise<boolean> {
        this.amsAssetName = graphParameters.assetName;
        this.setParam('assetName', this.amsAssetName);

        this.setParam('rtspUrl', this.rtspUrl);
        this.setParam('rtspAuthUsername', this.rtspAuthUsername);
        this.setParam('rtspAuthPassword', this.rtspAuthPassword);

        for (const param in graphParameters) {
            if (!graphParameters.hasOwnProperty(param)) {
                continue;
            }

            this.setParam(param, graphParameters[param]);
        }

        const response = await this.lvaGatewayModule.invokeLvaModuleMethod(`GraphInstanceSet`, this.instance);
        return (response.status || 500) > 299 ? false : true;
    }

    // @ts-ignore
    private async deleteInstance() {
        return this.lvaGatewayModule.invokeLvaModuleMethod(`GraphInstanceDelete`, this.instanceName);
    }

    private async activateInstance(): Promise<boolean> {
        const response = await this.lvaGatewayModule.invokeLvaModuleMethod(`GraphInstanceActivate`, this.instanceName);
        return (response.status || 500) > 299 ? false : true;
    }

    private async deactivateInstance() {
        return this.lvaGatewayModule.invokeLvaModuleMethod(`GraphInstanceDeactivate`, this.instanceName);
    }
}
