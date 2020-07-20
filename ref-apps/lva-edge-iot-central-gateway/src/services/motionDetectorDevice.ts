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

interface IMotionInference {
    type: string;
    motion: {
        box: {
            l: number,
            t: number,
            w: number,
            h: number
        }
    };
}

enum MotionDetectorSensitivity {
    Low = 'low',
    Medium = 'medium',
    High = 'high'
}

enum MotionDetectorSettings {
    Sensitivity = 'wpSensitivity'
}

interface IMotionDetectorSettings {
    [MotionDetectorSettings.Sensitivity]: MotionDetectorSensitivity;
}

const MotionDetectorInterface = {
    Setting: {
        Sensitivity: MotionDetectorSettings.Sensitivity
    }
};

export class AmsMotionDetectorDevice extends AmsCameraDevice {
    private motionDetectorSettings: IMotionDetectorSettings = {
        [MotionDetectorSettings.Sensitivity]: MotionDetectorSensitivity.Medium
    };

    constructor(lvaGatewayModule: ModuleService, amsGraph: AmsGraph, cameraInfo: ICameraDeviceProvisionInfo) {
        super(lvaGatewayModule, amsGraph, cameraInfo);
    }

    public setGraphParameters(): any {
        return {
            motionSensitivity: this.motionDetectorSettings[MotionDetectorSettings.Sensitivity],
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

    public async processLvaInferences(inferences: IMotionInference[]): Promise<void> {
        if (!Array.isArray(inferences) || !this.deviceClient) {
            this.lvaGatewayModule.logger([this.cameraInfo.cameraId, 'error'], `Missing inferences array or client not connected`);
            return;
        }

        try {
            let inferenceCount = 0;

            for (const inference of inferences) {
                ++inferenceCount;

                await this.sendMeasurement({
                    [AiInferenceInterface.Telemetry.Inference]: inference
                });
            }

            if (inferenceCount > 0) {
                this.lastInferenceTime = moment.utc();

                await this.sendMeasurement({
                    [AiInferenceInterface.Telemetry.InferenceCount]: inferenceCount
                });

                await this.updateDeviceProperties({
                    [AiInferenceInterface.Property.InferenceImageUrl]: this.lvaGatewayModule.getSampleImageUrls().MOTION
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
    protected async onHandleDeviceProperties(desiredChangedSettings: any) {
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
                    case MotionDetectorInterface.Setting.Sensitivity:
                        patchedProperties[setting] = this.motionDetectorSettings[setting] = value || '';
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
