## nerdctl管理Containerd

### 简介

> nerdctl 是一个与 Docker CLI 风格兼容的 containerd 的 CLI 工具，使用体验和 Docker 基本一致。
>
> 目前，nerdctl 已经作为子项目加入了 containerd 项目,它的 github 地址是 ：
>
> ```
> https://github.com/containerd/nerdctl
> ```
>
> Nerdctl 基本涵盖了 Docker CLI 的所有功能，同时，它还实现了很多 Docker 中不具备的功能，比如：延迟拉取镜像（lazy-pulling）、镜像加密（imgcrypt）等。

### 安装并配置 Nerdctl

#### 下载nerdctl

```
wget https://github.com/containerd/nerdctl/releases/download/v0.22.2/nerdctl-0.22.2-linux-amd64.tar.gz
```

#### 解压

```
tar xf nerdctl-0.22.2-linux-amd64.tar.gz
```

#### 拷贝运行文件到运行目录

```
mv nerdctl /usr/local/bin/
```

### 通过 nerdctl 创建容器

> 如果要使用 nerdctl 创建容器，需要提前配置 CNI Plugins

```
mkdir -p /opt/cni/bin
wget -c https://github.com/containernetworking/plugins/releases/download/v1.0.1/cni-plugins-linux-amd64-v1.0.1.tgz  -O - |  tar -xz -C /opt/cni/bin/
```

#### 使用 nerdctl 运行容器

```
[root@llody55 ~]# nerdctl run -d --name nginx -p 8000:80 nginx:alpine
docker.io/library/nginx:alpine:                                                   resolved       |++++++++++++++++++++++++++++++++++++++| 
index-sha256:082f8c10bd47b6acc8ef15ae61ae45dd8fde0e9f389a8b5cb23c37408642bf5d:    done           |+++++++++++++++++
+++++++++++++++++++++| 
manifest-sha256:2959a35e1b1e61e2419c01e0e457f75497e02d039360a658b66ff2d4caab19c4: done           |++++++++++++++++++++++++++++++++++++++| 
config-sha256:804f9cebfdc58964d6b25527e53802a3527a9ee880e082dc5b19a3d5466c43b7:   done           |++++++++++++++++++++++++++++++++++++++| 
layer-sha256:b231d02e51502ce72ff0813057a12b7778148c2e629aa21fe30d1cb1d0d5671b:    done           |++++++++++++++++++++++++++++++++++++++| 
layer-sha256:213ec9aee27d8be045c6a92b7eac22c9a64b44558193775a1a7f626352392b49:    done           |++++++++++++++++++++++++++++++++++++++| 
layer-sha256:2546ae67167b3580b7dcc4a4d56e504594bac17e22e046b2d215fc2d021d6d7e:    done           |++++++++++++++++++++++++++++++++++++++| 
layer-sha256:23b845224e138d383175fc5fb15d93ad0795468b8d6210edf3a50f23ded3ed8b:    done           |++++++++++++++++++++++++++++++++++++++| 
layer-sha256:9bd5732789a330a86ed2257e6bf18928c6ae873107ef0a408f1ad65b42f6d14f:    done           |++++++++++++++++++++++++++++++++++++++| 
layer-sha256:328309e59ded59f3fc9eb5ade5c0135ec9aae5553ab837ed763fc1510799bae8:    done           |++++++++++++++++++++++++++++++++++++++| 
elapsed: 12.9s                                                                    total:  9.8 Mi (773.5 KiB/s)     
870eb079afac3cdb261d7c538998d41aa69739b6f0459221ae81445a16f8c40f
[root@llody55 ~]# docker ps
CONTAINER ID   IMAGE              COMMAND                  CREATED       STATUS       PORTS                                                                                          NAMES
9804d511dad0   weejewel/wg-easy   "docker-entrypoint.s…"   7 weeks ago   Up 7 weeks   0.0.0.0:51820->51820/udp, :::51820->51820/udp, 0.0.0.0:51821->51821/tcp, :::51821->51821/tcp   wg
[root@ecs-137347 ~]# nerdctl ps
CONTAINER ID    IMAGE                             COMMAND                   CREATED          STATUS    PORTS                   NAMES
870eb079afac    docker.io/library/nginx:alpine    "/docker-entrypoint.…"    9 seconds ago    Up        0.0.0.0:8000->80/tcp    nginx
[root@llody55 ~]# nerdctl rm -f nginx
nginx
[root@llody55 ~]# nerdctl ps
CONTAINER ID    IMAGE    COMMAND    CREATED    STATUS    PORTS    NAMES
[root@ecs-137347 ~]# 
```

#### 构建镜像

> Nerdctl 构建镜像需要结合 buildkit ([https://github.com/moby/buildkit)](https://github.com/moby/buildkit)))，所以，需要先安装并启动 buildkit

```
wget -c https://github.com/moby/buildkit/releases/download/v0.9.0/buildkit-v0.9.0.linux-amd64.tar.gz -O - |  tar -xz -C /usr/local/
buildkitd --containerd-worker-addr="/run/k3s/containerd/containerd.sock" --oci-worker=false --containerd-worker=true &
```

**接下来，我们就可以使用 nerdctl 构建容器镜像**

```
nerdctl build -t "nginx:t1" .
```

> 实际上，nerdctl 的使用方式和 Docker CLI 几乎一致，我们可以轻松从 Docker 过渡到 nerdctl+containerd。在只有安装containerd的主机上，使用nerdctl管理 containerd 也许是更好的选择。

#### 多架构镜像示例

```
nerdctl build --platform=amd64,arm64 --output type=image,name=example.com/foo:latest,push=true .
```

### 常用命令

```
nerdctl pull nginx:1.18.0
nerdctl ps -a
nerdctl images -a
nerdctl run -d -p 8080:80 --name=nginx --restart=always nginx:1.18.0
nerdctl exec -it 70d014105fed bash
nerdctl network ls
nerdctl network inspect bridge
nerdctl rm -f 600f493049b9
```

#### 登录harbor

```
nerdctl login 192.168.1.221 -u llody  -p llody12345  --insecure-registry
```

#### 操作时可加命名空间

```
nerdctl -n k8s.io ps -a
```
