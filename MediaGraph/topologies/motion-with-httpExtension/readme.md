# HTTP Graph extension for inferencing based on motion detection
This topology enables you to extend the Media graph by interfacing it with an External AI module. However, it does so intelligently based on motion such that the AI is called only when motion is detected within the video.
You can read more about the scenario in this documentation page.

Additionally, the graph passes the motion detection event to a signal gate which connects to an Asset Sink,so that the relevant video clips can be generated as an AMS asset on the cloud. 

<br>
<p align="center">
  <img src="./topology.png" title="Analyze video intelligently based on motion via an external AI and publish relevant video clips to cloud as media assets"/>
</p>
<br>

