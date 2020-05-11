# Event-based video recording to Assets based on motion events, and using HTTP Extension to send images to an external inference engine

This topology enables you perform event-based recording. The video from an RTSP-capable camera is analyzed for the presence of motion. When motion is detected, those events are published to the IoT Hub. In addition, the motion events are used to trigger a signal gate which will send frames to an Asset Sink only when motion is present. As a result, new Assets are created containing clips where motion was detected.

Additionally, this topology enables you to run video analytics only when motion is detected. Upon detecting motion, a subset of the video frames (as controlled by the Frame Rate Filter) are sent to an external AI inference engine. The results are then published to the IoT Hub.

<br>
<p align="center">
  <img src="./topology.png" title="Event-based video recording to Assets based on motion events, and using HTTP Extension to send images to an external inference engine"/>
</p>
<br>
