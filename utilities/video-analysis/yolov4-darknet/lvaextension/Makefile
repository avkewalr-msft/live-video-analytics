APPNAMESO=lvaextension
LIBNAMESO=libdarknet.so
CPP=g++ -std=c++11

CFLAGS=-Wall -Wfatal-errors -Wno-unused-result -Wno-unknown-pragmas -fPIC
CFLAGS+= -ffp-contract=fast -mavx -mavx2 -msse3 -msse4.1 -msse4.2 -msse4a
CFLAGS+=-Ofast -DOPENCV -fPIC -fopenmp

LDFLAGS= -lm -pthread -lgomp `pkg-config --libs opencv4 2> /dev/null || pkg-config --libs opencv` -lboost_system -lcrypto -lssl -lcpprest

COMMON= -Idarknet/include/ -Idarknet/3rdparty/stb/include -DOPENCV `pkg-config --cflags opencv4 2> /dev/null || pkg-config --cflags opencv`

all: $(APPNAMESO)
$(APPNAMESO): $(LIBNAMESO) darknet/include/yolo_v2_class.hpp yolov4.h main.cpp
	$(CPP) -std=c++11 $(COMMON) $(CFLAGS) -o $@ main.cpp yolov4.cpp handler.cpp $(LDFLAGS) -L ./ -l:$(LIBNAMESO)