# RTSP Simulator using Live555 Media Server

The following instructions enable using [Live555 Media Server](http://www.live555.com/mediaServer/) as a RTSP simulator in a docker container.

## Prerequisites
1. [Install Docker](http://docs.docker.com/docker-for-windows/install/) on your machine
2. Install a RTSP player such as [VLC Media Player](http://www.videolan.org/vlc/) on your machine. This will be useful for testing.

## Building the docker container

1. Create a new directory on your machine and copy Dockerfile and win10.mkv from this folder to that directory.
2. Build the container image (should take around 10 minutes or less) by running the following docker command from a command window in that directory

    ```powershell
    docker build . -t live555:latest
    ```

    The build may generate warnings, but they should not prevent the server from working

## Running

Run the container using the following docker command

```powershell
    docker run -p 554:554  -i live555:latest
```


Test the stream using a RTSP media player such as [VLC media player](https://www.videolan.org/vlc/)

```powershell
    vlc rtsp://localhost:554/media/win10.mkv
```

You can also run the container while mounting the /media folder in the container to a local media folder on your host machine

```powershell
    # This exposes the 554 port on the host and mounts the media library to the server
    docker run -p 554:554 -v <local_media_folder>:/live/mediaServer/media -i live555:latest 
```

Test the stream

```powershell
    vlc rtsp://localhost:554/media/<my-file>
```

## Jupyter notebook

There is also a Jupyter notebook in this folder that enables you to create a docker container and then push it to your Azure container registry
