# Event-based recording of video to files based on messages from via hub source

This topology enables you to record video clips to the local file system of the edge device whenever an external sensor sends a message to the Media Graph. You can read more about this scenario in the documentation page. The diagram below shows a door sensor as an external module, but it could be any sensor or app sending the message.  

Note: This topology is very similar to the [topology](../evr-hubMessage-assets/topology.json) where you recorded video clips only when desired objects were detected. For this topology to work, you will need to connect and deploy an external module which will generate events and you will also need to declare routes in the IoT Edge deployment manifest to send those events from the module to the IoT Hub Source node.

<br>
<p align="center">
  <img src="./topology.png" title="Event-based recording of video to files based on messages from via hub source"/>
</p>
<br>
