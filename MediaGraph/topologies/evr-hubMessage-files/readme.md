# Event-based recording of video to files based on messages from via hub source

This topology enables you to record video clips to the local file system of the edge device whenever an external sensor sends a message to the Media Graph. You can read more about this scenario in the documentation page. The diagram below shows a door sensor as an external module, but it could be any sensor or app sending the message.  

Note: This topology is very similar to the [topology](../evr-hubMessage-assets/topology.json) where you record video clips only when desired objects are detected. To trigger recording of video with this topology, you will need to send events to the IoT Hub source node. You can do that via another IoT Edge module and by configuring message routing in the IoT Edge deployment manifest to send those events from the module to the IoT Hub Source node of the media graph instantiated with this topology.

<br>
<p align="center">
  <img src="./topology.png" title="Event-based recording of video to files based on messages from via hub source"/>
</p>
<br>
