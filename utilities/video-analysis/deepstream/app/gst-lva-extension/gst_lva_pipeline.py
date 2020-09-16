import os
import random
from random import randint
import numpy as np
import time
import gi
import io
from io import BytesIO
import logging

from PIL import Image, ImageDraw, ImageFont
import math
import requests

gi.require_version('Gst', '1.0')
gi.require_version('GstApp', '1.0')
gi.require_version('GstVideo', '1.0')

from gi.repository import GObject, Gst, GstVideo

from gst_lva_message import add_message, remove_message, get_message
from exception_handler import PrintGetExceptionDetails
import pyds
import inferencing_pb2
import media_pb2
import extension_pb2

GObject.threads_init()
Gst.init(None)

def has_flag(value: GstVideo.VideoFormatFlags,
             flag: GstVideo.VideoFormatFlags) -> bool:

    # in VideoFormatFlags each new value is 1 << 2**{0...8}
    return bool(value & (1 << max(1, math.ceil(math.log2(int(flag))))))

def get_num_channels(fmt: GstVideo.VideoFormat) -> int:
	"""
		-1: means complex format (YUV, ...)
	"""
	frmt_info = GstVideo.VideoFormat.get_info(fmt)
	
	# temporal fix
	if fmt == GstVideo.VideoFormat.BGRX:
		return 4
	
	if has_flag(frmt_info.flags, GstVideo.VideoFormatFlags.ALPHA):
		return 4

	if has_flag(frmt_info.flags, GstVideo.VideoFormatFlags.RGB):
		return 3

	if has_flag(frmt_info.flags, GstVideo.VideoFormatFlags.GRAY):
		return 1

	return -1


class Gst_Lva_Pipeline:
	def __init__(self, msgQueue, graphName, width, height):
		self.msgQueue = msgQueue
		self.graphName = graphName

		self.is_push_buffer_allowed = None
		self._mainloop = GObject.MainLoop()

		configFile = os.environ['GST_CONFIG_FILE']
		if (configFile is None):
			configFile = "sample.txt"	
		
		pipeline = "appsrc name=lvasource ! videoconvert ! nvvideoconvert nvbuf-memory-type=1 ! capsfilter caps=video/x-raw(memory:NVMM) ! m.sink_0 nvstreammux name=m batch-size=1 width={} height={} batched-push-timeout=33000 nvbuf-memory-type=1 ! nvinfer name=primary-inference config-file-path={} ! nvvideoconvert name=converter nvbuf-memory-type=1 ! videoconvert name=output-convert ! video/x-raw,format=BGR ! appsink name=lvasink".format(width, height, configFile)
		self.MJPEGOutput = os.environ['MJPEG_OUTPUT']	

		print('graphName = {}, width = {}, height = {}, configuration: {}'.format(graphName, width, height, configFile))
		logging.info('Gst pipeline\n' + pipeline)
		
		self._pipeline = Gst.parse_launch(pipeline)

		self._src = self._pipeline.get_by_name('lvasource')
		self._src.connect('need-data', self.start_feed)
		self._src.connect('enough-data', self.stop_feed)

		self._src.set_property('format', 'time')
		self._src.set_property('do-timestamp', True)

		self._sink = self._pipeline.get_by_name('lvasink')
		self._sink.set_property("emit-signals", True)
		self._sink.set_property("max-buffers", 1)		

		self._sink.connect("new-sample", self.on_new_sample)

	def get_lva_MediaStreamMessage(self, buffer, gst_lva_message, ih, iw):

		msg = extension_pb2.MediaStreamMessage()		
		msg.ack_sequence_number = gst_lva_message.sequence_number
		msg.media_sample.timestamp = gst_lva_message.timestamp
			
		# # Retrieve batch metadata from the gst_buffer
		# # Note that pyds.gst_buffer_get_nvds_batch_meta() expects the
		# # C address of gst_buffer as input, which is obtained with hash(gst_buffer)
		batch_meta = pyds.gst_buffer_get_nvds_batch_meta(hash(buffer))
		frame = batch_meta.frame_meta_list
		while frame is not None:
			try:
				# Note that frame.data needs a cast to pyds.NvDsFrameMeta
				# The casting is done by pyds.NvDsFrameMeta.cast()
				# The casting also keeps ownership of the underlying memory
				# in the C code, so the Python garbage collector will leave
				# it alone.
				frame_meta = pyds.NvDsFrameMeta.cast(frame.data)
				objInference = frame_meta.obj_meta_list
				frameWidth = frame_meta.source_frame_width
				frameHeight = frame_meta.source_frame_height

				inference = msg.media_sample.inferences.add()	

				attributes = []
				obj_label = None
				obj_confidence = 0
				obj_left = 0
				obj_width = 0
				obj_top = 0
				obj_width = 0	

				# iterate through objects 
				while objInference is not None:
					try: 
						# Casting objInference.data to pyds.NvDsObjectMeta
						obj_meta=pyds.NvDsObjectMeta.cast(objInference.data)
					except StopIteration:
						break
					
					rect_params=obj_meta.rect_params
					top=int(rect_params.top)
					left=int(rect_params.left)
					width=int(rect_params.width)
					height=int(rect_params.height)
					obj_confidence = obj_meta.confidence
					objLabel = obj_meta.obj_label
					obj_label = objLabel

					obj_left = left / iw
					obj_top = top / ih
					obj_width = width/ iw
					obj_height = height / ih

					inference.type = inferencing_pb2.Inference.InferenceType.ENTITY
					try: 
						objInference=objInference.next
					except StopIteration:
						break

				if obj_label is not None:
					try:
						entity = inferencing_pb2.Entity(
												tag = inferencing_pb2.Tag(
													value = obj_label,
													confidence = obj_confidence
												),
												box = inferencing_pb2.Rectangle(
													l = obj_left,
													t = obj_top,
													w = obj_width,
													h = obj_height
												)												
											)

						for attr in attributes:
							attribute = inferencing_pb2.Attribute(
								name = attr[0],
								value = attr[1],
								confidence = attr[2]
							)

							entity.attributes.append(attribute)
					except:
						PrintGetExceptionDetails()
									
					inference.entity.CopyFrom(entity)
			except StopIteration:
				break

			try:
				frame = frame.next
			except StopIteration:
				break

		return msg		

	def pushImageWithInference(self, sample, inferences):
		try:
			buffer = sample.get_buffer()	
			caps_format = sample.get_caps().get_structure(0)  

			#print(caps_format.get_value('format'))
			video_format = GstVideo.VideoFormat.from_string(caps_format.get_value('format'))
			w, h = caps_format.get_value('width'), caps_format.get_value('height')
			frmt_info = GstVideo.VideoFormat.get_info(video_format)
			
			c = get_num_channels(video_format)	
			buffer_size = buffer.get_size()
			shape = (h, w, c) if (h * w * c == buffer_size) else buffer_size
			#print (shape)
			array = np.ndarray(shape=shape, buffer=buffer.extract_dup(0, buffer_size), dtype=np.uint8) 

			im = Image.fromarray(array)	
			draw = ImageDraw.Draw(im)
			textfont = ImageFont.load_default()

			for inference in inferences:
				x1 = inference.entity.box.l
				y1 = inference.entity.box.t
				x2 = inference.entity.box.w
				y2 = inference.entity.box.h

				x1 = x1 * w
				y1 = y1 * h
				x2 = (x2 * w) + x1
				y2 = (y2 * h) + y1
				objClass = inference.entity.tag.value        
				draw.rectangle((x1, y1, x2, y2), outline = 'blue', width = 1)				
				draw.text((x1, y1-10), str(objClass), fill = "white", font = textfont)

			imgBuf = io.BytesIO()
			im.save(imgBuf, format='JPEG')
			#im.save('test.jpeg')

			# post the image with bounding boxes so that it can be viewed as an MJPEG stream
			postData = b'--boundary\r\n' + b'Content-Type: image/jpeg\r\n\r\n' + imgBuf.getvalue() + b'\r\n'
			requests.post('http://127.0.0.1:80/mjpeg_pub/' + self.graphName, data = postData)		
		except:
			PrintGetExceptionDetails()

	def on_new_sample(self, appsink):
		try:
			sample = appsink.emit("pull-sample")
			buffer = sample.get_buffer()	
			
			caps = sample.get_caps()		

			height = caps.get_structure(0).get_value('height')
			width = caps.get_structure(0).get_value('width')						
			
			gst_lva_message = get_message(buffer)

			msg = self.get_lva_MediaStreamMessage(buffer, gst_lva_message, height, width)

			if msg is None:
				logging.info('media stream message is None')
			else:				
				if (self.msgQueue is not None):
					if (self.msgQueue.full()):
						logging.info("queue is full")
						self.msgQueue.get()

					self.msgQueue.put(msg)				
				else:
					logging.info("msgQueue is null")
			
			remove_message(buffer)

			if self.MJPEGOutput is not None:
				self.pushImageWithInference(sample, msg.media_sample.inferences)
		except:
			PrintGetExceptionDetails()

		return Gst.FlowReturn.OK		

	def start_feed(self, src, length):		
		self.is_push_buffer_allowed = True

	def stop_feed(self, src):		
		self.is_push_buffer_allowed = False

	def play(self):
		self._pipeline.set_state(Gst.State.PLAYING)

	def stop(self):
		self._pipeline.set_state(Gst.State.NULL)

	def run(self):		
		self._mainloop.run()

	def push(self, imgRawBytes, caps, seq_num, timestamp):
		retVal = False

		if self.is_push_buffer_allowed:
			bufferLength = len(imgRawBytes)
			
			# Allocate GstBuffer			
			buf = Gst.Buffer.new_allocate(None, bufferLength, None)
			buf.fill(0, imgRawBytes)

			# Write message to buffer
			add_message(buf, seq_num, timestamp)
			
			# Create GstSample
			sample = Gst.Sample.new(buf, Gst.caps_from_string(caps), None, None)

			# Push sample on appsrc
			gst_flow_return = self._src.emit('push-sample', sample)

			if gst_flow_return != Gst.FlowReturn.OK:
				logging.info('We got some error, stop sending data')
			else:
				retVal = True
		else:
			logging.info('Cannot push buffer forward and hence dropping frame with seq_num ' + str(seq_num))

		return retVal