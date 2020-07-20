import { HealthState } from './health';
import { Mqtt as IoTHubTransport } from 'azure-iot-device-mqtt';
import {
    DeviceMethodRequest,
    DeviceMethodResponse,
    Client as IoTDeviceClient,
    Twin,
    Message as IoTMessage
} from 'azure-iot-device';
import * as moment from 'moment';
import {
    ICameraDeviceProvisionInfo,
    ModuleService
} from './module';
import { AmsGraph } from './amsGraph';
import { bind, defer, emptyObj } from '../utils';

export type DevicePropertiesHandler = (desiredChangedSettings: any) => Promise<void>;

export interface IClientConnectResult {
    clientConnectionStatus: boolean;
    clientConnectionMessage: string;
}

export interface IoTDeviceInformation {
    manufacturer: string;
    model: string;
    swVersion: string;
    osName: string;
    processorArchitecture: string;
    processorManufacturer: string;
    totalStorage: number;
    totalMemory: number;
}

const defaultVideoPlaybackHost = 'http://localhost:8094';

export enum IoTCameraSettings {
    VideoPlaybackHost = 'wpVideoPlaybackHost'
}

interface IoTCameraSettingsInterface {
    [IoTCameraSettings.VideoPlaybackHost]: string;
}

export const AmsDeviceTag = 'rpAmsDeviceTag';
export const AmsDeviceTagValue = 'AmsInferenceDevice.v1';

export enum IoTCentralClientState {
    Disconnected = 'disconnected',
    Connected = 'connected'
}

export enum CameraState {
    Inactive = 'inactive',
    Active = 'active'
}

export const IoTCameraInterface = {
    Telemetry: {
        SystemHeartbeat: 'tlSystemHeartbeat'
    },
    State: {
        IoTCentralClientState: 'stIoTCentralClientState',
        CameraState: 'stCameraState'
    },
    Property: {
        CameraName: 'rpCameraName',
        RtspUrl: 'rpRtspUrl',
        RtspAuthUsername: 'rpRtspAuthUsername',
        RtspAuthPassword: 'rpRtspAuthPassword',
        AmsDeviceTag
    },
    Setting: {
        VideoPlaybackHost: IoTCameraSettings.VideoPlaybackHost
    }
};

const defaultMaxVideoInferenceTime = 10;

export enum LvaEdgeOperationsSettings {
    AutoStart = 'wpAutoStart',
    MaxVideoInferenceTime = 'wpMaxVideoInferenceTime'
}

interface LvaEdgeOperationsSettingsInterface {
    [LvaEdgeOperationsSettings.AutoStart]: boolean;
    [LvaEdgeOperationsSettings.MaxVideoInferenceTime]: number;
}

const LvaEdgeOperationsInterface = {
    Event: {
        GraphInstanceCreated: 'evGraphInstanceCreated',
        GraphInstanceDeleted: 'evGraphInstanceDeleted',
        GraphInstanceStarted: 'evGraphInstanceStarted',
        GraphInstanceStopped: 'evGraphInstanceStopped',
        RecordingStarted: 'evRecordingStarted',
        RecordingStopped: 'evRecordingStopped',
        RecordingAvailable: 'evRecordingAvailable',
        StartLvaGraphCommandReceived: 'evStartLvaGraphCommandReceived',
        StopLvaGraphCommandReceived: 'evStopLvaGraphCommandReceived'
    },
    Setting: {
        AutoStart: LvaEdgeOperationsSettings.AutoStart,
        MaxVideoInferenceTime: LvaEdgeOperationsSettings.MaxVideoInferenceTime
    },
    Command: {
        StartLvaProcessing: 'cmStartLvaProcessing',
        StopLvaProcessing: 'cmStopLvaProcessing'
    }
};

export enum LvaEdgeDiagnosticsSettings {
    DebugTelemetry = 'wpDebugTelemetry'
}

interface LvaEdgeDiagnosticsSettingsInterface {
    [LvaEdgeDiagnosticsSettings.DebugTelemetry]: boolean;
}

export const LvaEdgeDiagnosticsInterface = {
    Event: {
        RuntimeError: 'evRuntimeError',
        AuthenticationError: 'evAuthenticationError',
        AuthorizationError: 'evAuthorizationError',
        DataDropped: 'evDataDropped',
        MediaFormatError: 'evMediaFormatError',
        MediaSessionEstablished: 'evMediaSessionEstablished',
        NetworkError: 'evNetworkError',
        ProtocolError: 'evProtocolError',
        StorageError: 'evStorageError'
    },
    Setting: {
        DebugTelemetry: LvaEdgeDiagnosticsSettings.DebugTelemetry
    }
};

const defaultInferenceTimeout = 5;

export enum AiInferenceSettings {
    InferenceTimeout = 'wpInferenceTimeout'
}

interface AiInferenceSettingsInterface {
    [AiInferenceSettings.InferenceTimeout]: number;
}

export const AiInferenceInterface = {
    Telemetry: {
        InferenceCount: 'tlInferenceCount',
        Inference: 'tlInference'
    },
    Event: {
        InferenceEventVideoUrl: 'evInferenceEventVideoUrl'
    },
    Property: {
        InferenceVideoUrl: 'rpInferenceVideoUrl',
        InferenceImageUrl: 'rpInferenceImageUrl'
    },
    Setting: {
        InferenceTimeout: AiInferenceSettings.InferenceTimeout
    }
};

export abstract class AmsCameraDevice {
    protected lvaGatewayModule: ModuleService;
    protected amsGraph: AmsGraph;
    protected cameraInfo: ICameraDeviceProvisionInfo;
    protected deviceClient: IoTDeviceClient;
    protected deviceTwin: Twin;

    protected deferredStart = defer();
    protected healthState = HealthState.Good;
    protected lastInferenceTime: moment.Moment = moment.utc(0);
    protected videoInferenceStartTime: moment.Moment = moment.utc();
    protected iotCameraSettings: IoTCameraSettingsInterface = {
        [IoTCameraSettings.VideoPlaybackHost]: defaultVideoPlaybackHost
    };
    protected lvaEdgeOperationsSettings: LvaEdgeOperationsSettingsInterface = {
        [LvaEdgeOperationsSettings.AutoStart]: false,
        [LvaEdgeOperationsSettings.MaxVideoInferenceTime]: defaultMaxVideoInferenceTime
    };
    protected lvaEdgeDiagnosticsSettings: LvaEdgeDiagnosticsSettingsInterface = {
        [LvaEdgeDiagnosticsSettings.DebugTelemetry]: false
    };
    protected aiInferenceSettings: AiInferenceSettingsInterface = {
        [AiInferenceSettings.InferenceTimeout]: defaultInferenceTimeout
    };
    private inferenceInterval: NodeJS.Timeout;
    private createVideoLinkForInferenceTimeout: boolean = false;

    constructor(lvaGatewayModule: ModuleService, amsGraph: AmsGraph, cameraInfo: ICameraDeviceProvisionInfo) {
        this.lvaGatewayModule = lvaGatewayModule;
        this.amsGraph = amsGraph;
        this.cameraInfo = cameraInfo;
    }

    public abstract setGraphParameters(): any;
    public abstract async deviceReady(): Promise<void>;
    public abstract async processLvaInferences(inferenceData: any): Promise<void>;
    public abstract async getCameraProps(): Promise<IoTDeviceInformation>;

    public async connectDeviceClient(dpsHubConnectionString: string): Promise<IClientConnectResult> {
        let clientConnectionResult: IClientConnectResult = {
            clientConnectionStatus: false,
            clientConnectionMessage: ''
        };

        try {
            clientConnectionResult = await this.connectDeviceClientInternal(dpsHubConnectionString, this.onHandleDeviceProperties);

            if (clientConnectionResult.clientConnectionStatus === true) {
                await this.deferredStart.promise;

                await this.deviceReady();
            }

            if (this.lvaEdgeOperationsSettings[LvaEdgeOperationsSettings.AutoStart] === true) {
                try {
                    await this.startLvaProcessingInternal(true);
                }
                catch (ex) {
                    this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'error'], `Error while trying to auto-start Lva graph: ${ex.message}`);
                }
            }
        }
        catch (ex) {
            clientConnectionResult.clientConnectionStatus = false;
            clientConnectionResult.clientConnectionMessage = `An error occurred while accessing the device twin properties`;

            this.lvaGatewayModule.logger(['ModuleService', 'error'], clientConnectionResult.clientConnectionMessage);
        }

        return clientConnectionResult;
    }

    @bind
    public async getHealth(): Promise<number> {
        await this.sendMeasurement({
            [IoTCameraInterface.Telemetry.SystemHeartbeat]: this.healthState
        });

        return this.healthState;
    }

    public async deleteCamera(): Promise<void> {
        this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'info'], `Deleting camera device instance for cameraId: ${this.cameraInfo.cameraId}`);

        try {
            this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'info'], `Deactiving graph instance: ${this.amsGraph.getInstanceName()}`);

            await this.amsGraph.deleteLvaGraph();

            const clientInterface = this.deviceClient;
            this.deviceClient = null;
            await clientInterface.close();

            await this.sendMeasurement({
                [IoTCameraInterface.State.CameraState]: CameraState.Inactive
            });
        }
        catch (ex) {
            this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'error'], `Error while deleting camera: ${this.cameraInfo.cameraId}`);
        }
    }

    public async sendLvaEvent(lvaEvent: string, messageJson?: any): Promise<void> {
        let eventField;
        let eventValue = this.cameraInfo.cameraId;

        switch (lvaEvent) {
            case 'Microsoft.Media.Graph.Operational.RecordingStarted':
                eventField = LvaEdgeOperationsInterface.Event.RecordingStarted;
                eventValue = messageJson?.outputLocation || this.cameraInfo.cameraId;
                break;

            case 'Microsoft.Media.Graph.Operational.RecordingStopped':
                eventField = LvaEdgeOperationsInterface.Event.RecordingStopped;
                eventValue = messageJson?.outputLocation || this.cameraInfo.cameraId;
                break;

            case 'Microsoft.Media.Graph.Operational.RecordingAvailable':
                eventField = LvaEdgeOperationsInterface.Event.RecordingAvailable;
                eventValue = messageJson?.outputLocation || this.cameraInfo.cameraId;
                break;

            case 'Microsoft.Media.Edge.Diagnostics.RuntimeError':
                eventField = LvaEdgeDiagnosticsInterface.Event.RuntimeError;
                eventValue = messageJson?.code || this.cameraInfo.cameraId;
                break;

            case 'Microsoft.Media.Graph.Diagnostics.AuthenticationError':
                eventField = LvaEdgeDiagnosticsInterface.Event.AuthenticationError;
                eventValue = messageJson?.errorCode || this.cameraInfo.cameraId;
                break;

            case 'Microsoft.Media.Graph.Diagnostics.AuthorizationError':
                eventField = LvaEdgeDiagnosticsInterface.Event.AuthorizationError;
                eventValue = messageJson?.errorCode || this.cameraInfo.cameraId;
                break;

            case 'Microsoft.Media.Graph.Diagnostics.DataDropped':
                eventField = LvaEdgeDiagnosticsInterface.Event.DataDropped;
                eventValue = messageJson?.dataType || this.cameraInfo.cameraId;
                break;

            case 'Microsoft.Media.Graph.Diagnostics.MediaFormatError':
                eventField = LvaEdgeDiagnosticsInterface.Event.MediaFormatError;
                eventValue = messageJson?.code || this.cameraInfo.cameraId;
                break;

            case 'Microsoft.Media.Graph.Diagnostics.MediaSessionEstablished':
                eventField = LvaEdgeDiagnosticsInterface.Event.MediaSessionEstablished;
                eventValue = this.cameraInfo.cameraId;
                break;

            case 'Microsoft.Media.Graph.Diagnostics.NetworkError':
                eventField = LvaEdgeDiagnosticsInterface.Event.NetworkError;
                eventValue = messageJson?.errorCode || this.cameraInfo.cameraId;
                break;

            case 'Microsoft.Media.Graph.Diagnostics.ProtocolError':
                eventField = LvaEdgeDiagnosticsInterface.Event.ProtocolError;
                eventValue = `${messageJson?.protocol}: ${messageJson?.errorCode}` || this.cameraInfo.cameraId;
                break;

            case 'Microsoft.Media.Graph.Diagnostics.StorageError':
                eventField = LvaEdgeDiagnosticsInterface.Event.StorageError;
                eventValue = messageJson?.storageAccountName || this.cameraInfo.cameraId;
                break;

            default:
                this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'warning'], `Received Unknown Lva event telemetry: ${lvaEvent}`);
                break;
        }

        if (lvaEvent) {
            await this.sendMeasurement({
                [eventField]: eventValue
            });
        }
        else {
            this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'warning'], `Received Unknown Lva event telemetry: ${lvaEvent}`);
        }
    }

    protected abstract async onHandleDeviceProperties(desiredChangedSettings: any);

    protected async onHandleDevicePropertiesInternal(desiredChangedSettings: any) {
        try {
            this.lvaGatewayModule.logger(['ModuleService', 'info'], `onHandleDeviceProperties`);
            if (this.lvaEdgeDiagnosticsSettings[LvaEdgeDiagnosticsSettings.DebugTelemetry] === true) {
                this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'info'], JSON.stringify(desiredChangedSettings, null, 4));
            }

            const patchedProperties = {};

            for (const setting in desiredChangedSettings) {
                if (!desiredChangedSettings.hasOwnProperty(setting)) {
                    continue;
                }

                if (setting === '$version') {
                    continue;
                }

                const value = desiredChangedSettings[setting].hasOwnProperty('value') ? desiredChangedSettings[setting]?.value : desiredChangedSettings[setting];

                switch (setting) {
                    case IoTCameraInterface.Setting.VideoPlaybackHost:
                        patchedProperties[setting] = (this.iotCameraSettings[setting] as any) = value || defaultVideoPlaybackHost;
                        break;

                    case LvaEdgeOperationsInterface.Setting.AutoStart:
                        patchedProperties[setting] = (this.lvaEdgeOperationsSettings[setting] as any) = value || false;
                        break;

                    case LvaEdgeOperationsInterface.Setting.MaxVideoInferenceTime:
                        patchedProperties[setting] = (this.lvaEdgeOperationsSettings[setting] as any) = value || defaultMaxVideoInferenceTime;
                        break;

                    case LvaEdgeDiagnosticsInterface.Setting.DebugTelemetry:
                        patchedProperties[setting] = (this.lvaEdgeDiagnosticsSettings[setting] as any) = value || false;
                        break;

                    case AiInferenceInterface.Setting.InferenceTimeout:
                        patchedProperties[setting] = (this.aiInferenceSettings[setting] as any) = value || defaultInferenceTimeout;
                        break;

                    default:
                        break;
                }
            }

            if (!emptyObj(patchedProperties)) {
                await this.updateDeviceProperties(patchedProperties);
            }
        }
        catch (ex) {
            this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'error'], `Exception while handling desired properties: ${ex.message}`);
        }
    }

    protected async updateDeviceProperties(properties: any): Promise<void> {
        if (!properties || !this.deviceTwin) {
            return;
        }

        try {
            await new Promise((resolve, reject) => {
                this.deviceTwin.properties.reported.update(properties, (error) => {
                    if (error) {
                        return reject(error);
                    }

                    return resolve();
                });
            });

            if (this.lvaEdgeDiagnosticsSettings[LvaEdgeDiagnosticsSettings.DebugTelemetry] === true) {
                this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'info'], `Device live properties updated: ${JSON.stringify(properties, null, 4)}`);
            }
        }
        catch (ex) {
            this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'error'], `Error while updating client properties: ${ex.message}`);
        }
    }

    protected async sendMeasurement(data: any): Promise<void> {
        if (!data || !this.deviceClient) {
            return;
        }

        try {
            const iotcMessage = new IoTMessage(JSON.stringify(data));

            await this.deviceClient.sendEvent(iotcMessage);

            if (this.lvaEdgeDiagnosticsSettings[LvaEdgeDiagnosticsSettings.DebugTelemetry] === true) {
                this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'info'], `sendEvent: ${JSON.stringify(data, null, 4)}`);
            }
        }
        catch (ex) {
            this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'error'], `sendMeasurement: ${ex.message}`);
            this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'error'], `inspect the error: ${JSON.stringify(ex, null, 4)}`);

            // TODO:
            // Detect DPS/Hub reprovisioning scenarios - sample exeption:
            //
            // [12:41:54 GMT+0000], [log,[this.cameraInfo.cameraId, error]] data: inspect the error: {
            //     "name": "UnauthorizedError",
            //     "transportError": {
            //         "name": "NotConnectedError",
            //         "transportError": {
            //             "code": 5
            //         }
            //     }
            // }
        }
    }

    protected async startLvaProcessingInternal(autoStart: boolean): Promise<boolean> {
        await this.sendMeasurement({
            [LvaEdgeOperationsInterface.Event.StartLvaGraphCommandReceived]: autoStart ? 'AutoStart' : 'Command'
        });

        const startLvaGraphResult = await this.amsGraph.startLvaGraph(this.setGraphParameters());

        if (this.lvaEdgeDiagnosticsSettings[LvaEdgeDiagnosticsSettings.DebugTelemetry] === true) {
            this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'info'], `Graph Instance Name: ${JSON.stringify(this.amsGraph.getInstanceName(), null, 4)}`);
            this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'info'], `Graph Instance: ${JSON.stringify(this.amsGraph.getInstance(), null, 4)}`);
            this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'info'], `Graph Topology Name: ${JSON.stringify(this.amsGraph.getInstanceName(), null, 4)}`);
            this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'info'], `Graph Topology: ${JSON.stringify(this.amsGraph.getTopology(), null, 4)}`);
        }

        await this.sendMeasurement({
            [IoTCameraInterface.State.CameraState]: startLvaGraphResult === true ? CameraState.Active : CameraState.Inactive
        });

        return startLvaGraphResult;
    }

    private async inferenceTimer(): Promise<void> {
        try {
            if (this.lvaEdgeDiagnosticsSettings[LvaEdgeDiagnosticsSettings.DebugTelemetry] === true) {
                this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'info'], `Inference timer`);
            }

            const videoInferenceDuration = moment.duration(moment.utc().diff(this.videoInferenceStartTime));

            if (moment.duration(moment.utc().diff(this.lastInferenceTime)) >= moment.duration(this.aiInferenceSettings[AiInferenceSettings.InferenceTimeout], 'seconds')) {
                if (this.createVideoLinkForInferenceTimeout) {
                    this.createVideoLinkForInferenceTimeout = false;

                    this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'info'], `InferenceTimeout reached`);

                    await this.sendMeasurement({
                        [AiInferenceInterface.Event.InferenceEventVideoUrl]: this.amsGraph.createInferenceVideoLink(
                            this.iotCameraSettings[IoTCameraSettings.VideoPlaybackHost],
                            this.videoInferenceStartTime,
                            Math.trunc(videoInferenceDuration.asSeconds()))
                    });

                    await this.updateDeviceProperties({
                        [AiInferenceInterface.Property.InferenceImageUrl]: this.lvaGatewayModule.getSampleImageUrls().ANALYZE
                    });
                }

                this.videoInferenceStartTime = moment.utc();
            }
            else {
                this.createVideoLinkForInferenceTimeout = true;

                if (videoInferenceDuration >= moment.duration(this.lvaEdgeOperationsSettings[LvaEdgeOperationsSettings.MaxVideoInferenceTime], 'seconds')) {
                    this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'info'], `MaxVideoInferenceTime reached`);

                    await this.sendMeasurement({
                        [AiInferenceInterface.Event.InferenceEventVideoUrl]: this.amsGraph.createInferenceVideoLink(
                            this.iotCameraSettings[IoTCameraSettings.VideoPlaybackHost],
                            this.videoInferenceStartTime,
                            Math.trunc(videoInferenceDuration.asSeconds()))
                    });

                    this.videoInferenceStartTime = moment.utc();
                }
            }
        }
        catch (ex) {
            this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'error'], `Inference timer error: ${ex.message}`);
        }
    }

    private async connectDeviceClientInternal(
        dpsHubConnectionString: string,
        devicePropertiesHandler: DevicePropertiesHandler): Promise<IClientConnectResult> {

        const result: IClientConnectResult = {
            clientConnectionStatus: false,
            clientConnectionMessage: ''
        };

        if (this.deviceClient) {
            await this.deviceClient.close();
            this.deviceClient = null;
        }

        try {
            this.deviceClient = await IoTDeviceClient.fromConnectionString(dpsHubConnectionString, IoTHubTransport);
            if (!this.deviceClient) {
                result.clientConnectionStatus = false;
                result.clientConnectionMessage = `Failed to connect device client interface from connection string - device: ${this.cameraInfo.cameraId}`;
            }
            else {
                result.clientConnectionStatus = true;
                result.clientConnectionMessage = `Successfully connected to IoT Central - device: ${this.cameraInfo.cameraId}`;
            }
        }
        catch (ex) {
            result.clientConnectionStatus = false;
            result.clientConnectionMessage = `Failed to instantiate client interface from configuraiton: ${ex.message}`;

            this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'error'], `${result.clientConnectionMessage}`);
        }

        if (result.clientConnectionStatus === false) {
            return result;
        }

        try {
            await this.deviceClient.open();

            this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'info'], `Device client is connected`);

            this.deviceTwin = await this.deviceClient.getTwin();
            this.deviceTwin.on('properties.desired', devicePropertiesHandler);

            this.deviceClient.on('error', this.onDeviceClientError);

            this.deviceClient.onDeviceMethod(LvaEdgeOperationsInterface.Command.StartLvaProcessing, this.startLvaProcessing);
            this.deviceClient.onDeviceMethod(LvaEdgeOperationsInterface.Command.StopLvaProcessing, this.stopLvaProcessing);

            result.clientConnectionStatus = true;
        }
        catch (ex) {
            result.clientConnectionStatus = false;
            result.clientConnectionMessage = `IoT Central connection error: ${ex.message}`;

            this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'error'], result.clientConnectionMessage);
        }

        return result;
    }

    @bind
    private onDeviceClientError(error: Error) {
        this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'error'], `Device client connection error: ${error.message}`);
        this.healthState = HealthState.Critical;
    }

    @bind
    // @ts-ignore
    private async startLvaProcessing(commandRequest: DeviceMethodRequest, commandResponse: DeviceMethodResponse) {
        this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'info'], `${LvaEdgeOperationsInterface.Command.StartLvaProcessing} command received`);

        try {
            const startLvaGraphResult = await this.startLvaProcessingInternal(false);

            const responseMessage = `LVA Edge start graph request: ${startLvaGraphResult ? 'succeeded' : 'failed'}`;
            this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'info'], responseMessage);

            await commandResponse.send(202);
            await this.updateDeviceProperties({
                [LvaEdgeOperationsInterface.Command.StartLvaProcessing]: {
                    value: responseMessage
                }
            });

            if (startLvaGraphResult) {
                this.lastInferenceTime = moment.utc(0);
                this.videoInferenceStartTime = moment.utc();
                this.createVideoLinkForInferenceTimeout = false;

                this.inferenceInterval = setInterval(async () => {
                    await this.inferenceTimer();
                }, 1000);
            }
        }
        catch (ex) {
            this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'error'], `startLvaProcessing error: ${ex.message}`);
        }
    }

    @bind
    // @ts-ignore
    private async stopLvaProcessing(commandRequest: DeviceMethodRequest, commandResponse: DeviceMethodResponse) {
        this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'info'], `${LvaEdgeOperationsInterface.Command.StopLvaProcessing} command received`);

        try {
            clearInterval(this.inferenceInterval);

            await this.sendMeasurement({
                [LvaEdgeOperationsInterface.Event.StopLvaGraphCommandReceived]: this.cameraInfo.cameraId
            });

            const stopLvaGraphResult = await this.amsGraph.stopLvaGraph();
            if (stopLvaGraphResult) {
                await this.sendMeasurement({
                    [IoTCameraInterface.State.CameraState]: CameraState.Inactive
                });
            }

            const responseMessage = `LVA Edge stop graph request: ${stopLvaGraphResult ? 'succeeded' : 'failed'}`;
            this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'info'], responseMessage);

            await commandResponse.send(202);
            await this.updateDeviceProperties({
                [LvaEdgeOperationsInterface.Command.StopLvaProcessing]: {
                    value: responseMessage
                },
                [AiInferenceInterface.Property.InferenceImageUrl]: this.lvaGatewayModule.getSampleImageUrls().ANALYZE
            });
        }
        catch (ex) {
            this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'error'], `Stop LVA error ${ex.message}`);
        }
    }
}
