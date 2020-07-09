# Event-based video recording to local files and assets based on motion events

This topology enables you to record motion-detected video clip to the edge and the cloud. The video from an RTSP-capable camera is analyzed for the presence of motion. When motion is detected, events are sent to a signal gate processor node which opens, sending frames to a file sink as well as asset sink. As a result of the file sink, new files (MP4 format) are created on the local file system of the edge device, containing the frames where motion was detected. In addition as a result of the asset sink connected to the same signal gate, corresponding assets with same content as edge mp4 files are created on the cloud.

Note: This topology creates new MP4 files each time motion is detected. Over time, this can fill up the local filesystem. You should monitor the contents of the output directory and prune older files as necessary.
<br>
<p align="center">
  <img src="./topology.png" title="Event-based video recording to local files and Assets based on motion events"/>
</p>
<br>
