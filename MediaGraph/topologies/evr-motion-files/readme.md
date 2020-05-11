# Event-based video recording to local files based on motion events

This topology enables you perform event-based recording. The video from an RTSP-capable camera is analyzed for the presence of motion. When motion is detected, those events are published to the IoT Hub. In addition, the motion events are used to trigger a signal gate which will send frames to a File Sink only when motion is present. As a result, new files (MP4 format) are created on the local file system of the Edge device, containing the frames where motion was detected.

Note: the topology creates new MP4 files each time motion is detected. Over time, this can fill up the local filesystem. You should monitor the contents of the output directory and prune older files as necessary.
<br>
<p align="center">
  <img src="./topology.png" title="Event-based video recording to local files based on motion events"/>
</p>
<br>
