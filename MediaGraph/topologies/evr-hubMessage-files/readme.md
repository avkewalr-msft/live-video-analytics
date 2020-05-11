# Event-based recording of video to files based on messages from via hub source

This topology enables you to record video clips to the local file system of the edge device whenever an external sensor sends a message to the Media Graph. You can read more about this scenario in the documentation page. The diagram below shows a door sensor but it could be any sensor or app sending the message.

Note: the topology creates new MP4 files each time the event trigger is received. Over time, this can fill up the local filesystem. You should monitor the contents of the output directory and prune older files as necessary.

<br>
<p align="center">
  <img src="./topology.png" title="Event-based recording of video to files based on messages from via hub source"/>
</p>
<br>
