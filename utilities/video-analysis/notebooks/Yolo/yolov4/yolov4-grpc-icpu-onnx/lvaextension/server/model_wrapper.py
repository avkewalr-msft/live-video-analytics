import os
import threading
import cv2
import numpy as np
from exception_handler import PrintGetExceptionDetails
from scipy import special

import onnxruntime

import logging

class YoloV4Model:
    def __init__(self):
        try:
            self._lock = threading.Lock()
            self._modelFileName = 'yolov4.onnx'
            self._modelLabelFileName = 'coco.names'
            self._anchorsFileName = 'yolov4_anchors.txt'
            self._labelList = None

            # Get labels
            with open(self._modelLabelFileName, "r") as f:
                self._labelList = [l.rstrip() for l in f]

            # Get anchors
            with open(self._anchorsFileName, "r") as f:
                anchors = f.readline()
            anchors = np.array(anchors.split(','), dtype=np.float32)
            self._anchors = anchors.reshape(3, 3, 2)

            # YoloV4 specific model vars.
            self._strides = np.array([8, 16, 32])
            self._xyscale = [1.2, 1.1, 1.05]

            # Get Topology struct and create inference session
            self._onnxSession = onnxruntime.InferenceSession(self._modelFileName)
            self._onnxSessionOutputName = self._onnxSession.get_outputs()[0].name
            self._onnxSessionInputName = self._onnxSession.get_inputs()[0].name

        except:
            PrintGetExceptionDetails()
            raise

    def Preprocess(self, cvImage):
        try:
            imageBlob = cv2.cvtColor(cvImage, cv2.COLOR_BGR2RGB)
            imageBlob = np.array(imageBlob, dtype='float32')
            imageBlob /= 255.
            # imageBlob = np.transpose(imageBlob, [0, 1, 2])
            imageBlob = np.expand_dims(imageBlob, 0)

            return imageBlob
        except:
            PrintGetExceptionDetails()
            raise

    def PostprocessBbox(self, predBbox):
        for i, pred in enumerate(predBbox):
            convShape = pred.shape
            outputSize = convShape[1]
            convRawdxdy = pred[:, :, :, :, 0:2]
            convRawdwdh = pred[:, :, :, :, 2:4]
            xyGrid = np.meshgrid(np.arange(outputSize), np.arange(outputSize))
            xyGrid = np.expand_dims(np.stack(xyGrid, axis=-1), axis=2)

            xyGrid = np.tile(np.expand_dims(xyGrid, axis=0), [1, 1, 1, 3, 1])
            xyGrid = xyGrid.astype(np.float)

            predXY = ((special.expit(convRawdxdy) * self._xyscale[i]) - 0.5 * (self._xyscale[i] - 1) + xyGrid) * self._strides[i]
            predWH = (np.exp(convRawdwdh) * self._anchors[i])
            pred[:, :, :, :, 0:4] = np.concatenate([predXY, predWH], axis=-1)

        predBbox = [np.reshape(x, (-1, np.shape(x)[-1])) for x in predBbox]
        predBbox = np.concatenate(predBbox, axis=0)
        return predBbox

    def PostprocessBoxes(self, predBbox, orgImgShape, inputSize, scoreThreshold):
        validScale=[0, np.inf]
        predBbox = np.array(predBbox)

        predXYWH = predBbox[:, 0:4]
        predConf = predBbox[:, 4]
        predProb = predBbox[:, 5:]

        # # (1) (x, y, w, h) --> (xmin, ymin, xmax, ymax)
        predCoor = np.concatenate([predXYWH[:, :2] - predXYWH[:, 2:] * 0.5,
                                    predXYWH[:, :2] + predXYWH[:, 2:] * 0.5], axis=-1)
        # # (2) (xmin, ymin, xmax, ymax) -> (xmin_org, ymin_org, xmax_org, ymax_org)
        orgH, orgW = orgImgShape
        resizeRatio = min(inputSize / orgW, inputSize / orgH)

        dw = (inputSize - resizeRatio * orgW) / 2
        dh = (inputSize - resizeRatio * orgH) / 2

        predCoor[:, 0::2] = 1.0 * (predCoor[:, 0::2] - dw) / resizeRatio
        predCoor[:, 1::2] = 1.0 * (predCoor[:, 1::2] - dh) / resizeRatio

        # # (3) clip some boxes that are out of range
        predCoor = np.concatenate([np.maximum(predCoor[:, :2], [0, 0]),
                                    np.minimum(predCoor[:, 2:], [orgW - 1, orgH - 1])], axis=-1)
        invalidMask = np.logical_or((predCoor[:, 0] > predCoor[:, 2]), (predCoor[:, 1] > predCoor[:, 3]))
        predCoor[invalidMask] = 0

        # # (4) discard some invalid boxes
        bboxesScale = np.sqrt(np.multiply.reduce(predCoor[:, 2:4] - predCoor[:, 0:2], axis=-1))
        scaleMask = np.logical_and((validScale[0] < bboxesScale), (bboxesScale < validScale[1]))

        # # (5) discard some boxes with low scores
        classes = np.argmax(predProb, axis=-1)
        scores = predConf * predProb[np.arange(len(predCoor)), classes]
        score_mask = scores > scoreThreshold
        mask = np.logical_and(scaleMask, score_mask)
        coors, scores, classes = predCoor[mask], scores[mask], classes[mask]

        return np.concatenate([coors, scores[:, np.newaxis], classes[:, np.newaxis]], axis=-1)

    def bboxesIOU(self, boxes1, boxes2):
        '''calculate the Intersection Over Union value'''
        boxes1 = np.array(boxes1)
        boxes2 = np.array(boxes2)

        boxes1_area = (boxes1[..., 2] - boxes1[..., 0]) * (boxes1[..., 3] - boxes1[..., 1])
        boxes2_area = (boxes2[..., 2] - boxes2[..., 0]) * (boxes2[..., 3] - boxes2[..., 1])

        left_up       = np.maximum(boxes1[..., :2], boxes2[..., :2])
        right_down    = np.minimum(boxes1[..., 2:], boxes2[..., 2:])

        inter_section = np.maximum(right_down - left_up, 0.0)
        inter_area    = inter_section[..., 0] * inter_section[..., 1]
        union_area    = boxes1_area + boxes2_area - inter_area
        ious          = np.maximum(1.0 * inter_area / union_area, np.finfo(np.float32).eps)

        return ious

    def nms(self, bboxes, iou_threshold, sigma=0.3, method='nms'):
        """
        :param bboxes: (xmin, ymin, xmax, ymax, score, class)

        Note: soft-nms, https://arxiv.org/pdf/1704.04503.pdf
            https://github.com/bharatsingh430/soft-nms
        """
        classes_in_img = list(set(bboxes[:, 5]))
        best_bboxes = []

        for cls in classes_in_img:
            cls_mask = (bboxes[:, 5] == cls)
            cls_bboxes = bboxes[cls_mask]

            while len(cls_bboxes) > 0:
                max_ind = np.argmax(cls_bboxes[:, 4])
                best_bbox = cls_bboxes[max_ind]
                best_bboxes.append(best_bbox)
                cls_bboxes = np.concatenate([cls_bboxes[: max_ind], cls_bboxes[max_ind + 1:]])
                iou = self.bboxesIOU(best_bbox[np.newaxis, :4], cls_bboxes[:, :4])
                weight = np.ones((len(iou),), dtype=np.float32)

                assert method in ['nms', 'soft-nms']

                if method == 'nms':
                    iou_mask = iou > iou_threshold
                    weight[iou_mask] = 0.0

                if method == 'soft-nms':
                    weight = np.exp(-(1.0 * iou ** 2 / sigma))

                cls_bboxes[:, 4] = cls_bboxes[:, 4] * weight
                score_mask = cls_bboxes[:, 4] > 0.
                cls_bboxes = cls_bboxes[score_mask]

        return best_bboxes

    def Score(self, cvImage):
        try:
            with self._lock:
                imageBlob = self.Preprocess(cvImage)

                detections = self._onnxSession.run([self._onnxSessionOutputName], {self._onnxSessionInputName: imageBlob})[0]

                predBbox = self.PostprocessBbox(np.expand_dims(detections, axis=0))

                originalImageSize = cvImage.shape[:2]
                bboxes = self.PostprocessBoxes(predBbox, originalImageSize, 416, 0.25)

                # bboxes: [x_min, y_min, x_max, y_max, probability, cls_id] format coordinates.
                bboxes = self.nms(bboxes, 0.213, method='nms')

            return bboxes, originalImageSize

        except:
            PrintGetExceptionDetails()
            raise