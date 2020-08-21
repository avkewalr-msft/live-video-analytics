#include <iostream>

#include "stdafx.h"
#include "handler.h"

#include "yolov4.h"

using namespace std;
using namespace web;
using namespace http;
using namespace utility;
using namespace http::experimental::listener;

std::unique_ptr<Handler> gHttpHandler;

void OnInitialize(const string_t& address)
{
    uri_builder uri(address);
  
    auto addr = uri.to_uri().to_string();
    uri.append_path(U("score"));

    gHttpHandler = std::unique_ptr<Handler>(new Handler(addr));
    gHttpHandler->Open().wait();
}

void OnShutdown()
{
     gHttpHandler->Close().wait();
}

int main(int argc, char *argv[])
{
    utility::string_t address = U("http://0.0.0.0:");
    utility::string_t port = U("44000");
    address.append(port);

    OnInitialize(address);
    std::cout << "Press ENTER to exit." << std::endl;

    std::string line;
    std::getline(std::cin, line);
    std::cout << "Shutting down." << std::endl;

    OnShutdown();
    return 0;
}
