#ifndef YOLO_V4_CLASS_HPP
#define YOLO_V4_CLASS_HPP

#include "yolo_v2_class.hpp"    // imported functions from DLL - SO

class MLModel {
    private:
        std::string namesFile;
        std::string cfgFile;
        std::string weightsFile;
        std::vector<std::string> objectNames;
        Detector *detector;

        std::vector<std::string> ObjectsNamesFromFile(std::string const filename);

    public:
        MLModel();
        ~MLModel();
        std::string Score(cv::Mat cvImage, bool drawBoxes = false);
        void DrawBoxes(cv::Mat cvImage, std::vector<bbox_t> resultVec);
};

#endif    // YOLO_V4_CLASS_HPP
