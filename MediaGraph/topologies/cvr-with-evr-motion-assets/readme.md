# Continuous video recording and motion event-based recording to Azure Media Service Assets

This topology enables you to continuously record the video from an RTSP-capable camera to an Azure Media Services Asset. You can read more about the relevant settings in [this](https://github.com/Azure/live-video-analytics/blob/master/MediaGraph/topologies/cvr-asset/readme.md) page.

Additionally, this topology enables you perform event-based recording. The video from an RTSP-capable camera is analyzed for the presence of motion. When motion is detected, those events are published to the IoT Hub. In addition, the motion events are used to trigger a signal gate which will send frames to an local file only when motion is present. As a result, new files are created containing clips where motion was detected.

<br>
<p align="center">
  <img src="./topology.png" title="Continuous video recording and motion event-based recording to Azure Media Service Assets"/>
</p>
<br>
