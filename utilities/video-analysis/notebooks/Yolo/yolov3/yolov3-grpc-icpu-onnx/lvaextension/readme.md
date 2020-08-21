# Compiling the protobuf files for python

Install the protoc tool for python:

```bash
python -m pip install grpcio-tools
```

Use the following command to regenerate the protobuf files using the python protoc complier

```bash
python -m grpc_tools.protoc -I../../../../../../../contracts/grpc ../../../../../../../contracts/grpc/extension.proto --grpc_python_out=lib --python_out=lib
python -m grpc_tools.protoc -I../../../../../../../contracts/grpc ../../../../../../../contracts/grpc/media.proto --python_out=lib
python -m grpc_tools.protoc -I../../../../../../../contracts/grpc ../../../../../../../contracts/grpc/inferencing.proto --python_out=lib
```