#include "handler.h"
#include "yolov4.h"
#include <opencv2/opencv.hpp>

Handler::Handler(utility::string_t url):mListener(url)
{
    inferenceEngine = new MLModel(); 
    mListener.support(methods::POST, std::bind(&Handler::HandlePost, this, std::placeholders::_1));
}

Handler::~Handler()
{
    if (inferenceEngine != NULL)
        delete inferenceEngine;
}

void Handler::HandlePost(http_request message)
{
    try
    {    
        pplx::extensibility::scoped_critical_section_t lck(mRespLock);

        concurrency::streams::container_buffer<std::vector<uint8_t>> buffer;
        message.body().read_to_end(buffer).wait();
        std::vector<unsigned char>& data = buffer.collection();

        cv::Mat cvImage = cv::imdecode(cv::Mat(data), 1);
        
        std::string inferenceResult = inferenceEngine->Score(cvImage, false);

        if (inferenceResult.length() > 17){  // empty will be: {"inferences":[]}
            message.reply(status_codes::OK, inferenceResult, U("application/json"));
        } else {
            message.reply(status_codes::NoContent, "", U("application/json"));
        }
    }
    catch (...)
    {
        message.reply(status_codes::InternalError, "Exception occured while calling the inference engine.", U("application/json"));
    }
};