#ifndef HANDLER_H
#define HANDLER_H
#include <iostream>
#include "stdafx.h"

#include "yolov4.h"

using namespace std;
using namespace web;
using namespace http;
using namespace utility;
using namespace http::experimental::listener;

class Handler
{
    public:
        Handler(utility::string_t url);
        virtual ~Handler();

        pplx::task<void>Open(){return mListener.open();}
        pplx::task<void>Close(){return mListener.close();}

    protected:

    private:
        MLModel *inferenceEngine = NULL;
        pplx::extensibility::critical_section_t mRespLock;

        void HandlePost(http_request message);
        http_listener mListener;
};

#endif // HANDLER_H


