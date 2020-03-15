# RTSP Simulator using Live555 Media Server

The following instructions enable using [Live555 Media Server](http://www.live555.com/mediaServer/) as a RTSP simulator in a docker container.

## Prerequisites
1. [Install Docker](http://docs.docker.com/docker-for-windows/install/) on your machine
2. Install a RTSP player such as [VLC Media Player](http://www.videolan.org/vlc/) on your machine. This will be useful for testing.

## Building the docker container

1. Create a new directory on your machine and copy Dockerfile and win10.mkv from this GitHub folder to that directory.
2. Build the container image (should take around 10 minutes or less) by running the following docker command from a command window in that directory

    ```powershell
    docker build . -t live555:latest
    ```

    The build may generate warnings, but they should not prevent the server from working

## Running and Testing

Run the container using the following docker command

```powershell
    docker run -p 554:554  -i live555:latest
```


Test the stream using a RTSP media player such as [VLC media player](https://www.videolan.org/vlc/)

```powershell
    vlc rtsp://localhost:554/media/win10.mkv
```

You can also run the container while mounting the /media folder in the container to a local media folder (e.g. /home/xyz/Videos/) on your host machine

```powershell
    # This exposes the 554 port on the host and mounts the local media folder to the /media folder in the server
    docker run -p 554:554 -v <local_media_folder>:/live/mediaServer/media -i live555:latest 
```

Test the stream

```powershell
    vlc rtsp://localhost:554/media/<my-media-file>
```

my-media-file refers to a media file in your local_media_folder. Note that only file formats supported by Live555 will work.

## Cleanup

Once you are done, stop the docker container by executing the following commands

```powershell
    docker ps -a 
```

This will enumerate all the containers. Copy the container id of the live555:latest container

```powershell
    docker stop <container-id> 
```

Once stopped, you can remove the container with the following command

```powershell
    docker rm <container-id> 
```
