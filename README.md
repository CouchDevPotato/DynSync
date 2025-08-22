# DynSync
DynSync is a lightweight and reliable service that automatically updates your DynDNS records. It detects IP changes and ensures your domains always point to the current address - perfect fordynamic networks and stable remote access to devices and servers. 

## How to build the image
```bash
docker buildx build . -t DynSync
```

## How to run docker image
```bash
docker run DynSync
```