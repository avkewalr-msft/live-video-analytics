# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

import onnxruntime
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import time
import io
import json


# Imports for the REST API
from flask import Flask, request, jsonify, Response

session = None

# Called when the deployed service starts
def init():
    global session
    
    model_path = 'yolov3/yolov3.onnx'
    # Initialize an inference session with  yoloV3 model
    session = onnxruntime.InferenceSession(model_path) 

def letterbox_image(image, size):
    '''Resize image with unchanged aspect ratio using padding'''
    iw, ih = image.size
    w, h = size
    scale = min(w/iw, h/ih)
    nw = int(iw*scale)
    nh = int(ih*scale)

    image = image.resize((nw,nh), Image.BICUBIC)
    new_image = Image.new('RGB', size, (128,128,128))
    new_image.paste(image, ((w-nw)//2, (h-nh)//2))
    return new_image

def preprocess(img):
    model_image_size = (416, 416)
    boxed_image = letterbox_image(img, tuple(reversed(model_image_size)))
    image_data = np.array(boxed_image, dtype='float32')
    image_data /= 255.
    image_data = np.transpose(image_data, [2, 0, 1])
    image_data = np.expand_dims(image_data, 0)
    return image_data

def postprocess(boxes, scores, indices):
    # objects_identified = indices.shape[0]   
    detected_objects = []
    
    for idx_ in indices:
        idx_1 = (idx_[0], idx_[2])
        y1, x1, y2, x2 = boxes[idx_1].tolist()
        
        dobj = {
            "class" : idx_[1].tolist(),
            "score" : scores[tuple(idx_)].tolist(),
            "box" : [x1, y1, x2, y2]
        }
        
        detected_objects.append(dobj)
        
    return detected_objects

def processImage(img):
    try:
        # Preprocess input according to the functions specified above
        img_data = preprocess(img)
        img_size = np.array([img.size[1], img.size[0]], dtype=np.float32).reshape(1, 2)

        inference_time_start = time.time()
        boxes, scores, indices = session.run(None, {"input_1": img_data, "image_shape":img_size})
        inference_time_end = time.time()
        inference_duration = np.round(inference_time_end - inference_time_start, 2)
        
        detected_objects = postprocess(boxes, scores, indices)
        return inference_duration, detected_objects

    except Exception as e:
        print('EXCEPTION:', str(e))
        return 'Error processing image', 500


def drawBboxes(image, detected_objects):
    objects_identified = len(detected_objects)
    
    draw = ImageDraw.Draw(image)    

    textfont = ImageFont.load_default()
    
    for pos in range(objects_identified):        
        x1, y1, x2, y2 = detected_objects[pos]['box']                
        objClass = detected_objects[pos]['class']        

        draw.rectangle((x1, y1, x2, y2), outline = 'blue', width = 2)
        print('rectangle drawn')
        draw.text((x1, y1), str(objClass), fill = "white", font = textfont)
     
    return image


app = Flask(__name__)

# /score routes to scoring function 
# This function returns a JSON object with inference duration and detected objects
@app.route('/score', methods=['POST'])
def score():

    try:
        imageData = io.BytesIO(request.get_data())
        # load the image
        img = Image.open(imageData)

        inference_duration, detected_objects = processImage(img)

        respBody = {
                    "time": inference_duration,                         
                    "objects" : detected_objects
                    }                   

        return respBody
    except Exception as e:
        print('EXCEPTION:', str(e))
        return 'Error processing image', 500

# /annotate routes to annotation function 
# This function returns an image with bounding boxes drawn around detected objects
@app.route('/annotate', methods=['POST'])
def annotate():
    try:
        imageData = io.BytesIO(request.get_data())
        # load the image
        img = Image.open(imageData)

        inference_duration, detected_objects = processImage(img)
        #print('Inference duration=' + str(inference_duration))

        img = drawBboxes(img, detected_objects)
        
        imgByteArr = io.BytesIO()        
        img.save(imgByteArr, format = 'JPEG')        
        imgByteArr = imgByteArr.getvalue()                

        return Response(response = imgByteArr, status = 200, mimetype = "image/jpeg")
    except Exception as e:
        print('EXCEPTION:', str(e))
        return Response(response='Error processing image', status= 500)

if __name__ == '__main__':
    # Load and intialize the model
    init()

    # Run the server
    app.run(host='0.0.0.0', port=8888)
