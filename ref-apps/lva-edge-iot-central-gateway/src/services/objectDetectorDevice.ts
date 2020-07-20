import {
    ICameraDeviceProvisionInfo,
    ModuleService
} from './module';
import { AmsGraph } from './amsGraph';
import {
    IoTDeviceInformation,
    AmsDeviceTagValue,
    IoTCameraInterface,
    IoTCentralClientState,
    CameraState,
    AiInferenceInterface,
    AmsCameraDevice,
    LvaEdgeDiagnosticsSettings
} from './device';
import * as moment from 'moment';
import { bind, emptyObj } from '../utils';

interface IObjectInference {
    type: string;
    entity: {
        box: {
            l: number,
            t: number,
            w: number,
            h: number
        },
        tag: {
            confidence: number;
            value: string
        }
    };
}

const defaultDetectionClass = 'person';
const defaultConfidenceThreshold = 70.0;
const defaultInferenceFps = 2;

enum ObjectDetectorSettings {
    DetectionClasses = 'wpDetectionClasses',
    ConfidenceThreshold = 'wpConfidenceThreshold',
    InferenceFps = 'wpInferenceFps'
}

interface IObjectDetectorSettings {
    [ObjectDetectorSettings.DetectionClasses]: string;
    [ObjectDetectorSettings.ConfidenceThreshold]: number;
    [ObjectDetectorSettings.InferenceFps]: number;
}

const ObjectDetectorInterface = {
    Setting: {
        DetectionClasses: ObjectDetectorSettings.DetectionClasses,
        ConfidenceThreshold: ObjectDetectorSettings.ConfidenceThreshold,
        InferenceFps: ObjectDetectorSettings.InferenceFps
    }
};

export class AmsObjectDetectorDevice extends AmsCameraDevice {
    private objectDetectorSettings: IObjectDetectorSettings = {
        [ObjectDetectorSettings.DetectionClasses]: defaultDetectionClass,
        [ObjectDetectorSettings.ConfidenceThreshold]: defaultConfidenceThreshold,
        [ObjectDetectorSettings.InferenceFps]: defaultInferenceFps
    };

    private detectionClasses: string[] = this.objectDetectorSettings[ObjectDetectorSettings.DetectionClasses].toUpperCase().split(',');

    constructor(lvaGatewayModule: ModuleService, amsGraph: AmsGraph, cameraInfo: ICameraDeviceProvisionInfo) {
        super(lvaGatewayModule, amsGraph, cameraInfo);
    }

    public setGraphParameters(): any {
        return {
            frameRate: this.objectDetectorSettings[ObjectDetectorSettings.InferenceFps],
            assetName: `${this.lvaGatewayModule.getScopeId()}-${this.cameraInfo.cameraId}-${moment.utc().format('YYYYMMDD-HHmmss')}`
        };
    }

    public async deviceReady(): Promise<void> {
        this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'info'], `Device is ready`);

        await this.sendMeasurement({
            [IoTCameraInterface.State.IoTCentralClientState]: IoTCentralClientState.Connected,
            [IoTCameraInterface.State.CameraState]: CameraState.Inactive
        });

        const cameraProps = await this.getCameraProps();

        await this.updateDeviceProperties({
            ...cameraProps,
            [IoTCameraInterface.Property.CameraName]: this.cameraInfo.cameraName,
            [IoTCameraInterface.Property.RtspUrl]: this.cameraInfo.rtspUrl,
            [IoTCameraInterface.Property.RtspAuthUsername]: this.cameraInfo.rtspAuthUsername,
            [IoTCameraInterface.Property.RtspAuthPassword]: this.cameraInfo.rtspAuthPassword,
            [IoTCameraInterface.Property.AmsDeviceTag]: `${this.lvaGatewayModule.getInstanceId()}:${AmsDeviceTagValue}`,
            [AiInferenceInterface.Property.InferenceImageUrl]: this.lvaGatewayModule.getSampleImageUrls().ANALYZE
        });
    }

    public async processLvaInferences(inferences: IObjectInference[]): Promise<void> {
        if (!Array.isArray(inferences) || !this.deviceClient) {
            this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'error'], `Missing inferences array or client not connected`);
            return;
        }

        try {
            let detectionCount = 0;
            let sampleImage = this.lvaGatewayModule.getSampleImageUrls().ANALYZE;

            for (const inference of inferences) {
                const detectedClass = (inference.entity?.tag?.value || '').toUpperCase();
                const confidence = (inference.entity?.tag?.confidence || 0.0) * 100;

                if (this.detectionClasses.includes(detectedClass) && confidence >= this.objectDetectorSettings[ObjectDetectorSettings.ConfidenceThreshold]) {
                    ++detectionCount;
                    sampleImage = this.lvaGatewayModule.getSampleImageUrls()[detectedClass];

                    await this.sendMeasurement({
                        [AiInferenceInterface.Telemetry.Inference]: inference
                    });
                }
            }

            if (detectionCount > 0) {
                this.lastInferenceTime = moment.utc();

                await this.sendMeasurement({
                    [AiInferenceInterface.Telemetry.InferenceCount]: detectionCount
                });

                await this.updateDeviceProperties({
                    [AiInferenceInterface.Property.InferenceImageUrl]: sampleImage
                });
            }
        }
        catch (ex) {
            this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'error'], `Error processing downstream message: ${ex.message}`);
        }
    }

    public async getCameraProps(): Promise<IoTDeviceInformation> {
        // TODO:
        // Introduce some ONVIF tech to get camera props
        return {
            manufacturer: 'AAA',
            model: '1000',
            swVersion: 'v1.0.0',
            osName: 'AAA OS',
            processorArchitecture: 'AAA CPU',
            processorManufacturer: 'AAA',
            totalStorage: 0,
            totalMemory: 0
        };
    }

    @bind
    protected async onHandleDeviceProperties(desiredChangedSettings: any): Promise<void> {
        await super.onHandleDevicePropertiesInternal(desiredChangedSettings);

        try {
            if (this.lvaEdgeDiagnosticsSettings[LvaEdgeDiagnosticsSettings.DebugTelemetry] === true) {
                this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'info'], `desiredPropsDelta:\n${JSON.stringify(desiredChangedSettings, null, 4)}`);
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
                    case ObjectDetectorInterface.Setting.DetectionClasses: {
                        const detectionClassesString = (value || '');

                        this.detectionClasses = detectionClassesString.toUpperCase().split(',');

                        patchedProperties[setting] = detectionClassesString;
                        break;
                    }

                    case ObjectDetectorInterface.Setting.ConfidenceThreshold:
                        patchedProperties[setting] = (this.objectDetectorSettings[setting] as any) = value || defaultConfidenceThreshold;
                        break;

                    case ObjectDetectorInterface.Setting.InferenceFps:
                        patchedProperties[setting] = (this.objectDetectorSettings[setting] as any) = value || defaultInferenceFps;
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

        this.deferredStart.resolve();
    }
}
