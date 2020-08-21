#include <iomanip>
#include <string>
#include <vector>
#include <fstream>

#include "yolov4.h"

#include <opencv2/opencv.hpp>


MLModel::MLModel()
{
    namesFile = "coco.names";
    cfgFile = "yolov4.cfg";
    weightsFile = "yolov4.weights";
    detector = new Detector(cfgFile, weightsFile);
    objectNames = ObjectsNamesFromFile(namesFile);
}

MLModel::~MLModel()
{
    delete detector;
}

std::vector<std::string> MLModel::ObjectsNamesFromFile(std::string const filename)
{
    std::ifstream file(filename);

    std::vector<std::string> fileLines;
    if (!file.is_open()) return fileLines;
    for(std::string line; getline(file, line);) fileLines.push_back(line);
    return fileLines;
}

std::string MLModel::Score(cv::Mat cvImage, bool drawBoxes)
{
    std::string result = "";

    try 
    {
        auto detImage = detector->mat_to_image_resize(cvImage);

        // Uncomment below lines to measure inference time
        // auto start = std::chrono::steady_clock::now();
        std::vector<bbox_t> resultVec = detector->detect_resized(*detImage, cvImage.size().width, cvImage.size().height);
        // auto end = std::chrono::steady_clock::now();
        // std::chrono::duration<double> spent = end - start;
        // std::cout << "Inference Time: " << spent.count() << " sec \n";

        for (auto &i : resultVec)
        {
            std::string label = "-";
            if (objectNames.size() > i.obj_id) label = objectNames[i.obj_id];

            std::string l = std::to_string((float)i.x / (float)cvImage.size().width);
            std::string t = std::to_string((float)i.y / (float)cvImage.size().height);
            std::string w = std::to_string((float)i.w / (float)cvImage.size().width);
            std::string h = std::to_string((float)i.h / (float)cvImage.size().height);

            result += "{\"type\":\"entity\",\"entity\":{\"tag\":{\"value\": \"" + label + "\",\"confidence\":" + std::to_string(i.prob) + "},\"box\":{\"l\":" + l + ",\"t\":" + t + ",\"w\":" + w + ",\"h\":" + h + "}}},\n";
        }

        result = "{\"inferences\":[" + result.substr(0, result.size() - 2) + "]}";

        if (drawBoxes) DrawBoxes(cvImage, resultVec);
    }
    catch (std::exception &e) { std::cerr << "exception: " << e.what() << "\n"; getchar(); }
    catch (...) { std::cerr << "unknown exception \n"; getchar(); }

    return result;
}

void MLModel::DrawBoxes(cv::Mat cvImage, std::vector<bbox_t> resultVec)
{
    for (auto &i : resultVec) {
        cv::Scalar color = obj_id_to_color(i.obj_id);
        cv::rectangle(cvImage, cv::Rect(i.x, i.y, i.w, i.h), color, 2);
        if (objectNames.size() > i.obj_id) 
        {
            std::string objName = objectNames[i.obj_id];
            cv::Size const textSize = getTextSize(objName, cv::FONT_HERSHEY_COMPLEX_SMALL, 1.2, 2, 0);
            int maxWidth = (textSize.width > i.w + 2) ? textSize.width : (i.w + 2);
            maxWidth = std::max(maxWidth, (int)i.w + 2);

            cv::rectangle(cvImage, cv::Point2f(std::max((int)i.x - 1, 0), std::max((int)i.y - 35, 0)),
                cv::Point2f(std::min((int)i.x + maxWidth, cvImage.cols - 1), std::min((int)i.y, cvImage.rows - 1)),
                color, CV_FILLED, 8, 0);
            putText(cvImage, objName, cv::Point2f(i.x, i.y - 16), cv::FONT_HERSHEY_COMPLEX_SMALL, 1.2, cv::Scalar(0, 0, 0), 2);
        }
    }
}