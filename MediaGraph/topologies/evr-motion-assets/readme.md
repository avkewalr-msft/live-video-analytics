# Event-based video recording to Assets based on motion events

This topology enables you perform event-based recording. The video from an RTSP-capable camera is analyzed for the presence of motion. When motion is detected, those events are published to the IoT Hub. In addition, the motion events are used to trigger a signal gate which will send frames to an Asset Sink only when motion is present. As a result, new Assets are created containing clips where motion was detected.

<br>
<p align="center">
  <img src="./topology.png" title="Event-based video recording to Assets based on motion events"/>
</p>
<br>
