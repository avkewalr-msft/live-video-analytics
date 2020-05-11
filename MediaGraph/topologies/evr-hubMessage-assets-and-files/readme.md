# Event-based video recording to Assets and to local filesystem, based on specific objects being detected by external inference engine
This topology enables you to extend the Media graph by interfacing it with an External AI module, relaying inference events from the AI to be published onto the Iot Edge Hub. Additonally, an external edge module triggers the graph to record video clips as MP4 files on the edge and media assets in the cloud. The trigger to generate these clips is based on the AI inference events published onto the Hub. You can read more about the scenario in this documentation page.


Note: the topology creates new MP4 files each time the desired event occurs. Over time, this can fill up the local filesystem. You should monitor the contents of the output directory and prune older files as necessary.
<br>
<p align="center">
  <img src="./topology.png" title="Event-based video recording to Assets and to local filesystem, based on specific objects being detected by external inference engine"/>
</p>
<br>
