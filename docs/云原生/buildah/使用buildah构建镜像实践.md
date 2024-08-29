## 简介

> Buildah 是一种基于 Linux 的开源工具，用于构建与开放容器倡议 (OCI) 兼容的容器，这意味着容器也与Docker和Kubernetes兼容。借助 Buildah，您可以使用自己喜欢的工具从现有基础镜像或使用空镜像从头开始创建高效的容器镜像。这是一种更灵活、更安全的构建容器镜像的方式。
>
> Buildah由 Daniel Walsh 和他在 Red Hat 的团队于 2017 年创建。他们着手创建容器镜像的“coreutils”——一种可以与现有容器主机工具一起使用来构建 OCI 和 Docker 兼容容器镜像的工具。然后，这些镜像可以存储在容器仓库中，并在多个运行时环境中使用。

## 特点

Buildah 软件包提供了一个命令行工具，可用于

* 从头开始或使用映像作为起点创建工作容器
* 从工作容器或通过 Dockerfile 中的说明创建映像
* 镜像可以采用 OCI 镜像格式或传统的上游 docker 镜像格式构建
* 挂载工作容器的根文件系统以进行操作
* 卸载工作容器的根文件系统
* 使用容器根文件系统的更新内容作为文件系统层来创建新映像
* 删除工作容器或映像
* 重命名本地容器

## 安装

### 安装buildah

#### CentOS

```bash
yum -y install buildah
```

> Buildah 在 CentOS 7 的默认 Extras 存储库和 CentOS 8 和 Stream 的 AppStream 存储库中可用，但可用版本通常落后于上游版本。

#### Debian

```bash
# Debian Stable/Bookworm or Unstable/Sid
sudo apt-get update
sudo apt-get -y install buildah
```

#### Ubuntu

```bash
# Ubuntu 20.10 and newer
sudo apt-get -y update
sudo apt-get -y install buildah
```

> buildah 软件包可在 Ubuntu 20.10 及更新版本的官方存储库中找到。

## 实践

### 安装fuse

```bash
# For Debian/Ubuntu
sudo apt-get install fuse

# For CentOS/RHEL
sudo yum install fuse

```

### 加载模块

```bash
[root@node1 ~]# modprobe fuse

# 检查模块是否安装
[root@node1 ~]# lsmod | grep fuse
fuse                  135168  1 
```

### **主机启用用户命名空间**

```bash
echo "user.max_user_namespaces=28633" | sudo tee -a /etc/sysctl.conf

# 应用这些更改
sysctl -p
```

### Docker下

#### 确保 Docker 启用了用户命名空间(可选)

在 Docker 的配置文件 `/etc/docker/daemon.json` 中，确保启用用户命名空间。可以使用如下内容：

```bash
{
  "userns-remap": "default"
}

```

> 注意，启用用户空间会导致已经存在并运行的容器被隐藏。

然后重启 Docker 服务：

```bash
sudo systemctl restart docker
```

#### 运行 Buildah 容器

```bash
[root@llody-dev ~]#docker run -it --rm --device /dev/fuse:rw -e _BUILDAH_STARTED_IN_USERNS="" -e BUILDAH_ISOLATION=chroot --security-opt seccomp=unconfined --security-opt label:disabled -v /root/shell/app:/app  swr.cn-southwest-2.myhuaweicloud.com/llody/buildah:v1.37.0  /bin/bash
Unable to find image 'swr.cn-southwest-2.myhuaweicloud.com/llody/buildah:v1.37.0' locally
v1.37.0: Pulling from llody/buildah
1f892f70a8cf: Pull complete 
089585dd1b5b: Pull complete 
65c1c1e612f6: Pull complete 
8d0fbfab5fe0: Pull complete 
da11c1ab79dc: Pull complete 
c86690337885: Pull complete 
dbc06f352834: Pull complete 
2dafe776d118: Pull complete 
8806f0bb0fde: Pull complete 
Digest: sha256:6a58dad8431a84af91b0eb9d425b2305d309c7bfc984a16c5b5891e1a82befcc
Status: Downloaded newer image for swr.cn-southwest-2.myhuaweicloud.com/llody/buildah:v1.37.0
[root@375ed86009c4 /]# mkdir app
[root@375ed86009c4 /]# cd app/
```

#### 创建编译文件

```bash
[root@45e2720e6eba app]# cat Dockerfile 
FROM swr.cn-southwest-2.myhuaweicloud.com/llody/nginx:v1.23.4

LABEL maintainer llody

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
[root@45e2720e6eba app]# cat nginx.conf 
user  nginx;
worker_processes  auto;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;


events {
    worker_connections  8192;
}


http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    server_tokens   off;
    sendfile        on;
    tcp_nopush      on;

    keepalive_timeout  65;

    include /etc/nginx/conf.d/*.conf;
}
```

#### 构建容器

```bash
[root@45e2720e6eba app]# buildah build -f Dockerfile -t 192.168.1.221/llody/nginx:v1.23.4 .
STEP 1/5: FROM swr.cn-southwest-2.myhuaweicloud.com/llody/nginx:v1.23.4
Trying to pull swr.cn-southwest-2.myhuaweicloud.com/llody/nginx:v1.23.4...
Getting image source signatures
Copying blob f03b40093957 done   | 
Copying blob 9989f7b33228 done   | 
Copying blob 0972072e0e8a done   | 
Copying blob a85095acb896 done   | 
Copying blob d24b987aa74e done   | 
Copying blob 6c1a86118ade done   | 
Copying blob 2f51df40373f done   | 
Copying config e0956a87f9 done   | 
Writing manifest to image destination
STEP 2/5: LABEL maintainer llody
STEP 3/5: COPY nginx.conf /etc/nginx/nginx.conf
STEP 4/5: EXPOSE 80
STEP 5/5: CMD ["nginx", "-g", "daemon off;"]
COMMIT 192.168.1.221/llody/nginx:v1.23.4
Getting image source signatures
Copying blob 8cbe4b54fa88 skipped: already exists  
Copying blob 5dd6bfd241b4 skipped: already exists  
Copying blob 043198f57be0 skipped: already exists  
Copying blob 2731b5cfb616 skipped: already exists  
Copying blob 6791458b3942 skipped: already exists  
Copying blob 4d33db9fdf22 skipped: already exists  
Copying blob e8f3a1d2a191 skipped: already exists  
Copying blob 12104f28db6a done   | 
Copying config 4e94533f1f done   | 
Writing manifest to image destination
--> 4e94533f1ff3
Successfully tagged 192.168.1.221/llody/nginx:v1.23.4
4e94533f1ff3a2ed301dd3590dd416bad4fb1e0510061265f42594e84a0ff2dd
```

#### 登录dockerhub

```bash
[root@45e2720e6eba app]# buildah login docker.io
Username: llody
Password: 
Login Succeeded!
```

#### 重新打TAG

```bash
[root@45e2720e6eba app]# buildah tag 192.168.1.221/llody/nginx:v1.23.4 llody/nginx:v1.23.5
```

#### 推送镜像

```bash
[root@45e2720e6eba app]# buildah push llody/nginx:v1.23.5
Getting image source signatures
Copying blob 8cbe4b54fa88 done   | 
Copying blob 6791458b3942 done   | 
Copying blob 043198f57be0 done   | 
Copying blob 5dd6bfd241b4 done   | 
Copying blob 2731b5cfb616 done   | 
Copying blob 4d33db9fdf22 done   | 
Copying blob 12104f28db6a done   | 
Copying blob e8f3a1d2a191 done   | 
Copying config 4e94533f1f done   | 
Writing manifest to image destination
```

#### 拉取镜像测试

```bash
[root@llody-dev ~]#docker run -it --rm llody/nginx:v1.23.5
Unable to find image 'llody/nginx:v1.23.5' locally
v1.23.5: Pulling from llody/nginx
dea060b46dfa: Pull complete 
135f5a3b3281: Pull complete 
cbcd4ebd6343: Pull complete 
b69dcabb9418: Pull complete 
3bfe8767f836: Pull complete 
d3c5dce4932e: Pull complete 
b0994d7a34ba: Pull complete 
41617e3a1841: Pull complete 
Digest: sha256:2d47097d876f3f5e6972e780fde823d7ac2a4f672ea5443b388104bd23a2f239
Status: Downloaded newer image for llody/nginx:v1.23.5
/docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
/docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/
/docker-entrypoint.sh: Launching /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh
10-listen-on-ipv6-by-default.sh: info: Getting the checksum of /etc/nginx/conf.d/default.conf
10-listen-on-ipv6-by-default.sh: info: Enabled listen on IPv6 in /etc/nginx/conf.d/default.conf
/docker-entrypoint.sh: Launching /docker-entrypoint.d/20-envsubst-on-templates.sh
/docker-entrypoint.sh: Launching /docker-entrypoint.d/30-tune-worker-processes.sh
/docker-entrypoint.sh: Configuration complete; ready for start up
```

### CICD流水线中

#### 内核版本

```bash
[root@node1 ~]#uname -r
5.16.15-1.el7.elrepo.x86_64
```

> 内核版本过低可能出现未知错误。

#### 基础环境

| 编排环境 | 运行时 | 代码仓库 | CICD工具 |
| -------- | ------ | -------- | -------- |
| K8S      | docker | gitlab   | drone    |

#### drone开启特权

```yaml
spec:
      containers:
        - name: drone
          image: drone/drone:2
          imagePullPolicy: IfNotPresent
          securityContext:
            privileged: true
```

#### drone挂载fuse

```yaml
spec:
      containers:
        - name: drone
          image: drone/drone:2
          imagePullPolicy: IfNotPresent
          securityContext:
            privileged: true
          volumeMounts:
            - name: fuse
              mountPath: /dev/fuse
          envFrom:
            - configMapRef:
                name: drone-config
          ports:
            - containerPort: 80
            - containerPort: 443
          resources:
            limits:
              cpu: 2000m
              memory: 2048Mi
            requests:
              cpu: 100m
              memory: 512Mi
      volumes:
        - hostPath:
            path: /dev/fuse
            type: CharDevice
          name: fuse
```

> 挂载类型只能是：CharDevice

#### drone.yml配置

```
- name: docker-build
  image: swr.cn-southwest-2.myhuaweicloud.com/llody/buildah:v1.37.0
  privileged: true  # 特权模式
  environment:
    REGISTRY_USERNAME:
      from_secret: aliyun_drone_username
    REGISTRY_PASSWORD:
      from_secret: aliyun_drone_password
    STORAGE_DRIVER: overlay
    BUILDAH_ISOLATION: chroot
  commands:
  - buildah version
  - lsmod | grep fuse
  - echo "$REGISTRY_PASSWORD" | buildah login --username "$REGISTRY_USERNAME" --password-stdin registry.cn-hangzhou.aliyuncs.com
  - buildah build -f Dockerfile -t registry.cn-hangzhou.aliyuncs.com/llody/${DRONE_REPO_NAME}:${DRONE_COMMIT:0:10}
  - buildah push registry.cn-hangzhou.aliyuncs.com/llody/${DRONE_REPO_NAME}:${DRONE_COMMIT:0:10}
  - buildah build -f Dockerfile -t registry.cn-hangzhou.aliyuncs.com/llody/${DRONE_REPO_NAME}:latest
  - buildah push registry.cn-hangzhou.aliyuncs.com/llody/${DRONE_REPO_NAME}:latest

```

#### 测试输出如下

```bash
+ buildah version
Version:         1.37.0
Go Version:      go1.22.5
Image Spec:      1.1.0
Runtime Spec:    1.2.0
CNI Spec:        1.1.0
libcni Version:  
image Version:   5.32.0
Git Commit:  
Built:           Fri Aug  2 12:44:58 2024
OS/Arch:         linux/amd64
BuildPlatform:   linux/amd64
+ lsmod | grep fuse
fuse                  135168  1
+ echo "$REGISTRY_PASSWORD" | buildah login --username "$REGISTRY_USERNAME" --password-stdin registry.cn-hangzhou.aliyuncs.com
Login Succeeded!
+ buildah build -f Dockerfile -t registry.cn-hangzhou.aliyuncs.com/llody/nginx-test:c31435e546
STEP 1/7: FROM registry.cn-hangzhou.aliyuncs.com/llody/nginx:base
Trying to pull registry.cn-hangzhou.aliyuncs.com/llody/nginx:base...
Getting image source signatures
Copying blob sha256:5a9f0a2c61e812cb2b0beaaf24b57aaad92bde7c7c3a7488f0e55ea769daaa98
Copying blob sha256:c4a057508f96954546441044f0d2373303862a4d4accc163e68a4c30d0c88869
Copying blob sha256:9ba64393807bf2549af97a1a074ca5fff1bce25ad115b0a7ced446cd1b4305d0
Copying blob sha256:262f9908119d4529a370bcdf1f1306131ad556edf400413d5fa74008d7919931
Copying blob sha256:10c113fb0c778963cb3069e94e8148a3770122f6763c94373e22f5342b503ab0
Copying blob sha256:cbdbe7a5bc2a134ca8ec91be58565ec07d037386d1f1d8385412d224deafca08
Copying config sha256:2f0006e4f7d9061520aae8bf82de90a0794f45c3b93f4173d755d8c62cb1605d
Writing manifest to image destination
STEP 2/7: ENV LANG en_GB.UTF-8
STEP 3/7: MAINTAINER llody
STEP 4/7: WORKDIR /usr/local/www/
STEP 5/7: COPY --chown=nginx:nginx default.conf  /etc/nginx/conf.d/
STEP 6/7: COPY index.html /usr/local/www/
STEP 7/7: CMD ["nginx", "-g", "daemon off;"]
COMMIT registry.cn-hangzhou.aliyuncs.com/llody/nginx-test:c31435e546
Getting image source signatures
Copying blob sha256:3e207b409db364b595ba862cdc12be96dcdad8e36c59a03b7b3b61c946a5741a
Copying blob sha256:7bb2a9d373374aee9939eff4c7a7883e74c22fd4ad9499497a1a03fa987befd4
Copying blob sha256:5d17421f15719347504420acd3af66f55803fc2f82de17d8be90c432db47c297
Copying blob sha256:570fc47f255858a1ea028ee56a4472c23a37f8103d10066028a534147661d943
Copying blob sha256:a181cbf898a0262fa8f9dfcf769014445ca54f25c0440de8c40692392b57de03
Copying blob sha256:0ed8b5d1cca63d14ffb2e708a037835a6a52dfbdea1757e42a53a85fbfb4d5b0
Copying blob sha256:86cf67cbbfc41244f498413674940c0eab460cade42175df511f6b43526788d0
Copying config sha256:fa7f7beb965efe1885e27c7567c8b5a50e3b68f725b0cae507916119d9fa0064
Writing manifest to image destination
--> fa7f7beb965e
Successfully tagged registry.cn-hangzhou.aliyuncs.com/llody/nginx-test:c31435e546
fa7f7beb965efe1885e27c7567c8b5a50e3b68f725b0cae507916119d9fa0064
+ buildah push registry.cn-hangzhou.aliyuncs.com/llody/nginx-test:c31435e546
Getting image source signatures
Copying blob sha256:3e207b409db364b595ba862cdc12be96dcdad8e36c59a03b7b3b61c946a5741a
Copying blob sha256:7bb2a9d373374aee9939eff4c7a7883e74c22fd4ad9499497a1a03fa987befd4
Copying blob sha256:570fc47f255858a1ea028ee56a4472c23a37f8103d10066028a534147661d943
Copying blob sha256:a181cbf898a0262fa8f9dfcf769014445ca54f25c0440de8c40692392b57de03
Copying blob sha256:5d17421f15719347504420acd3af66f55803fc2f82de17d8be90c432db47c297
Copying blob sha256:0ed8b5d1cca63d14ffb2e708a037835a6a52dfbdea1757e42a53a85fbfb4d5b0
Copying blob sha256:86cf67cbbfc41244f498413674940c0eab460cade42175df511f6b43526788d0
Copying config sha256:fa7f7beb965efe1885e27c7567c8b5a50e3b68f725b0cae507916119d9fa0064
Writing manifest to image destination
+ buildah build -f Dockerfile -t registry.cn-hangzhou.aliyuncs.com/llody/nginx-test:latest
STEP 1/7: FROM registry.cn-hangzhou.aliyuncs.com/llody/nginx:base
STEP 2/7: ENV LANG en_GB.UTF-8
STEP 3/7: MAINTAINER llody
STEP 4/7: WORKDIR /usr/local/www/
STEP 5/7: COPY --chown=nginx:nginx default.conf  /etc/nginx/conf.d/
STEP 6/7: COPY index.html /usr/local/www/
STEP 7/7: CMD ["nginx", "-g", "daemon off;"]
COMMIT registry.cn-hangzhou.aliyuncs.com/llody/nginx-test:latest
Getting image source signatures
Copying blob sha256:3e207b409db364b595ba862cdc12be96dcdad8e36c59a03b7b3b61c946a5741a
Copying blob sha256:7bb2a9d373374aee9939eff4c7a7883e74c22fd4ad9499497a1a03fa987befd4
Copying blob sha256:5d17421f15719347504420acd3af66f55803fc2f82de17d8be90c432db47c297
Copying blob sha256:570fc47f255858a1ea028ee56a4472c23a37f8103d10066028a534147661d943
Copying blob sha256:a181cbf898a0262fa8f9dfcf769014445ca54f25c0440de8c40692392b57de03
Copying blob sha256:0ed8b5d1cca63d14ffb2e708a037835a6a52dfbdea1757e42a53a85fbfb4d5b0
Copying blob sha256:63b08aef3027eb8000346f5be82bf76e4a015cd9f9494b9f626b1cd180015fac
Copying config sha256:c705e3213a83c23659a17e0b0b1c2b8a03f81a7a4bad6fc7f7cc43a2e8388954
Writing manifest to image destination
--> c705e3213a83
Successfully tagged registry.cn-hangzhou.aliyuncs.com/llody/nginx-test:latest
c705e3213a83c23659a17e0b0b1c2b8a03f81a7a4bad6fc7f7cc43a2e8388954
+ buildah push registry.cn-hangzhou.aliyuncs.com/llody/nginx-test:latest
Getting image source signatures
Copying blob sha256:0ed8b5d1cca63d14ffb2e708a037835a6a52dfbdea1757e42a53a85fbfb4d5b0
Copying blob sha256:570fc47f255858a1ea028ee56a4472c23a37f8103d10066028a534147661d943
Copying blob sha256:5d17421f15719347504420acd3af66f55803fc2f82de17d8be90c432db47c297
Copying blob sha256:3e207b409db364b595ba862cdc12be96dcdad8e36c59a03b7b3b61c946a5741a
Copying blob sha256:a181cbf898a0262fa8f9dfcf769014445ca54f25c0440de8c40692392b57de03
Copying blob sha256:7bb2a9d373374aee9939eff4c7a7883e74c22fd4ad9499497a1a03fa987befd4
Copying blob sha256:63b08aef3027eb8000346f5be82bf76e4a015cd9f9494b9f626b1cd180015fac
Copying config sha256:c705e3213a83c23659a17e0b0b1c2b8a03f81a7a4bad6fc7f7cc43a2e8388954
Writing manifest to image destination
```

#### 镜像运行测试

```bash
[root@llody-dev ~]#docker run -it registry.cn-hangzhou.aliyuncs.com/llody/nginx-test
Unable to find image 'registry.cn-hangzhou.aliyuncs.com/llody/nginx-test:latest' locally
latest: Pulling from linggan/nginx-test
cbdbe7a5bc2a: Pull complete 
10c113fb0c77: Pull complete 
9ba64393807b: Pull complete 
262f9908119d: Pull complete 
c4a057508f96: Pull complete 
5a9f0a2c61e8: Pull complete 
6037f70aac90: Pull complete 
Digest: sha256:7bb87c919204e5afcb106d0a4e5dccada6b007b538bb495882c16cbede26164a
Status: Downloaded newer image for registry.cn-hangzhou.aliyuncs.com/llody/nginx-test:latest
/docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
/docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/
/docker-entrypoint.sh: Launching /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh
10-listen-on-ipv6-by-default.sh: Getting the checksum of /etc/nginx/conf.d/default.conf
10-listen-on-ipv6-by-default.sh: /etc/nginx/conf.d/default.conf differs from the packages version, exiting
/docker-entrypoint.sh: Launching /docker-entrypoint.d/20-envsubst-on-templates.sh
/docker-entrypoint.sh: Configuration complete; ready for start up
```


### 多架构实践

#### **为不同架构分别构建镜像**

```bash
# 构建 amd64 架构的镜像
[root@59ed81b0a2e7 app]# buildah build --arch amd64 -f Dockerfile -t llody/nginx:amd64-v1.24.0 .

# 构建 arm64 架构的镜像
[root@59ed81b0a2e7 app]# buildah build --arch arm64 -f Dockerfile -t llody/nginx:arm64-v1.24.0 .
```

#### **创建一个多架构的 Manifest 列表**

```bash
[root@59ed81b0a2e7 app]# buildah manifest create llody/nginx:v1.24.0
```

#### **将不同架构的镜像添加到 Manifest 列表中**

```bash
# amd64
[root@59ed81b0a2e7 app]# buildah manifest add llody/nginx:v1.24.0 llody/nginx:amd64-v1.24.0

# arm64
[root@59ed81b0a2e7 app]# buildah manifest add llody/nginx:v1.24.0 llody/nginx:arm64-v1.24.0
```

#### **推送多架构的镜像**

```bash
# 将多架构镜像推送镜像仓库
[root@59ed81b0a2e7 app]# buildah manifest push --all llody/nginx:v1.24.0 docker://swr.cn-southwest-2.myhuaweicloud.com/llody/nginx:v1.24.0
```

#### 完整输出如下

```bash
[root@llody-dev ~]#docker run -it --rm --device /dev/fuse:rw  -e _BUILDAH_STARTED_IN_USERNS="" -e BUILDAH_ISOLATION=chroot --security-opt seccomp=unconfined --security-opt label:disabled -v /root/shell/app:/app  swr.cn-southwest-2.myhuaweicloud.com/llody/buildah:v1.37.0  /bin/bash
[root@59ed81b0a2e7 /]# cd app/
[root@59ed81b0a2e7 app]# buildah build --arch amd64 -f Dockerfile -t llody/nginx:amd64-v1.24.0 .
STEP 1/5: FROM docker.llody.cn/library/nginx:1.24.0
Trying to pull docker.llody.cn/library/nginx:1.24.0...
Getting image source signatures
Copying blob 57a1056ea484 done   | 
Copying blob 5ac1ebd8aebe done   | 
Copying blob 6989106bacf0 done   | 
Copying blob c00d1142b331 done   | 
Copying blob cb49393af980 done   | 
Copying blob 04e7578caeaa done   | 
Copying config 6c0218f168 done   | 
Writing manifest to image destination
STEP 2/5: LABEL maintainer llody
STEP 3/5: COPY nginx.conf /etc/nginx/nginx.conf
STEP 4/5: EXPOSE 80
STEP 5/5: CMD ["nginx", "-g", "daemon off;"]
COMMIT llody/nginx:amd64-v1.24.0
Getting image source signatures
Copying blob 420179ad2efa skipped: already exists  
Copying blob 13c8460bfc9a skipped: already exists  
Copying blob b9a187a24e19 skipped: already exists  
Copying blob 96c08fed6a4c skipped: already exists  
Copying blob 29492f82bbc2 skipped: already exists  
Copying blob bc4a3582faa9 skipped: already exists  
Copying blob 7d61c3f00166 done   | 
Copying config c68053f6fa done   | 
Writing manifest to image destination
--> c68053f6fae0
Successfully tagged localhost/llody/nginx:amd64-v1.24.0
c68053f6fae022ff8a8f95a85662d9320704b1f15895296ec6992cc0049d1cab
[root@59ed81b0a2e7 app]# buildah build --arch arm64 -f Dockerfile -t llody/nginx:arm64-v1.24.0 .
STEP 1/5: FROM docker.llody.cn/library/nginx:1.24.0
Trying to pull docker.llody.cn/library/nginx:1.24.0...
Getting image source signatures
Copying blob f3d3961ba57b done   | 
Copying blob f2c37d5ba038 done   | 
Copying blob 78979650788c done   | 
Copying blob 8fabaca3129c done   | 
Copying blob a080e9059b73 done   | 
Copying blob 778ddef5c8e3 done   | 
Copying config 9eccb584db done   | 
Writing manifest to image destination
STEP 2/5: LABEL maintainer llody
STEP 3/5: COPY nginx.conf /etc/nginx/nginx.conf
STEP 4/5: EXPOSE 80
STEP 5/5: CMD ["nginx", "-g", "daemon off;"]
COMMIT llody/nginx:arm64-v1.24.0
Getting image source signatures
Copying blob a499da141b41 skipped: already exists  
Copying blob 9a068c457cf7 skipped: already exists  
Copying blob b393e5ec881f skipped: already exists  
Copying blob 3007615cb229 skipped: already exists  
Copying blob 37ae454d9700 skipped: already exists  
Copying blob 1c54ce2d8f71 skipped: already exists  
Copying blob f7dca033a74d done   | 
Copying config f45fb13144 done   | 
Writing manifest to image destination
--> f45fb13144de
Successfully tagged localhost/llody/nginx:arm64-v1.24.0
f45fb13144ded24cd7f8f5c8da7f8532e3571f630f8107ac145ee98b77ba9dd9
[root@59ed81b0a2e7 app]# buildah manifest create llody/nginx:v1.24.0
8e5ab70254beb2353ce634a2b7306decc687cda6b56faf1f7ce49fe6618114a3
[root@59ed81b0a2e7 app]# buildah manifest add llody/nginx:v1.24.0 llody/nginx:amd64-v1.24.0
8e5ab70254beb2353ce634a2b7306decc687cda6b56faf1f7ce49fe6618114a3: sha256:763cfb1d4b1aa084ea55b67c6a16e4557217e1306cc5d1546b47c4cf85cb53e3
[root@59ed81b0a2e7 app]# buildah manifest add llody/nginx:v1.24.0 llody/nginx:arm64-v1.24.0
8e5ab70254beb2353ce634a2b7306decc687cda6b56faf1f7ce49fe6618114a3: sha256:eea560b81ed8d614c9f16ba9abb4c98b0b99c1a39cd00fc2522f7a1c8abe39a3

# 登录镜像仓库
[root@59ed81b0a2e7 app]# buildah login -u llody -p 123456 swr.cn-southwest-2.myhuaweicloud.com
Login Succeeded!
[root@59ed81b0a2e7 app]# buildah manifest push --all llody/nginx:v1.24.0 docker://swr.cn-southwest-2.myhuaweicloud.com/llody/nginx:v1.24.0
Getting image list signatures
Copying 2 images generated from 2 images in list
Copying image sha256:763cfb1d4b1aa084ea55b67c6a16e4557217e1306cc5d1546b47c4cf85cb53e3 (1/2)
Getting image source signatures
Copying blob 13c8460bfc9a done   | 
Copying blob b9a187a24e19 done   | 
Copying blob 420179ad2efa done   | 
Copying blob bc4a3582faa9 done   | 
Copying blob 96c08fed6a4c done   | 
Copying blob 29492f82bbc2 done   | 
Copying blob 7d61c3f00166 done   | 
Copying config c68053f6fa done   | 
Writing manifest to image destination
Copying image sha256:eea560b81ed8d614c9f16ba9abb4c98b0b99c1a39cd00fc2522f7a1c8abe39a3 (2/2)
Getting image source signatures
Copying blob b393e5ec881f done   | 
Copying blob 37ae454d9700 done   | 
Copying blob 1c54ce2d8f71 done   | 
Copying blob a499da141b41 done   | 
Copying blob 9a068c457cf7 done   | 
Copying blob 3007615cb229 done   | 
Copying blob f7dca033a74d done   | 
Copying config f45fb13144 done   | 
Writing manifest to image destination
Writing manifest list to image destination
Storing list signatures
```

#### 运行验证

##### Amd64

```bash
[root@llody-dev ~]#uname -i
x86_64
[root@llody-dev ~]#docker run -it --rm swr.cn-southwest-2.myhuaweicloud.com/llody/nginx:v1.24.0
Unable to find image 'swr.cn-southwest-2.myhuaweicloud.com/llody/nginx:v1.24.0' locally
v1.24.0: Pulling from llody/nginx
85d6efe32e35: Pull complete 
3a7d64661a9e: Pull complete 
ab45b7af6c11: Pull complete 
b90d314ae127: Pull complete 
3456668d0e44: Pull complete 
e8176ff7c0d4: Pull complete 
faacba3c2e01: Pull complete 
Digest: sha256:d573c0bbf0bef750e9912cc033d64a73f7361c4eb780804f9141bfa13532dfc1
Status: Downloaded newer image for swr.cn-southwest-2.myhuaweicloud.com/llody/nginx:v1.24.0
/docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
/docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/
/docker-entrypoint.sh: Launching /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh
10-listen-on-ipv6-by-default.sh: info: Getting the checksum of /etc/nginx/conf.d/default.conf
10-listen-on-ipv6-by-default.sh: info: Enabled listen on IPv6 in /etc/nginx/conf.d/default.conf
/docker-entrypoint.sh: Launching /docker-entrypoint.d/20-envsubst-on-templates.sh
/docker-entrypoint.sh: Launching /docker-entrypoint.d/30-tune-worker-processes.sh
/docker-entrypoint.sh: Configuration complete; ready for start up
```

##### Arm64

```bash
[root@wc-ctu-30web ~]# uname -i
aarch64
[root@wc-ctu-30web ~]# docker run -it --rm swr.cn-southwest-2.myhuaweicloud.com/llody/nginx:v1.24.0
Unable to find image 'swr.cn-southwest-2.myhuaweicloud.com/llody/nginx:v1.24.0' locally
v1.24.0: Pulling from llody/nginx
537d6f39080a: Pull complete 
3168e39911b4: Pull complete 
55c2300f58f5: Pull complete 
13233c34bbee: Pull complete 
b771bdbf856d: Pull complete 
bfa1d0a3ad57: Pull complete 
09b968b31072: Pull complete 
Digest: sha256:d573c0bbf0bef750e9912cc033d64a73f7361c4eb780804f9141bfa13532dfc1
Status: Downloaded newer image for swr.cn-southwest-2.myhuaweicloud.com/llody/nginx:v1.24.0
/docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
/docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/
/docker-entrypoint.sh: Launching /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh
10-listen-on-ipv6-by-default.sh: info: Getting the checksum of /etc/nginx/conf.d/default.conf
10-listen-on-ipv6-by-default.sh: info: Enabled listen on IPv6 in /etc/nginx/conf.d/default.conf
/docker-entrypoint.sh: Launching /docker-entrypoint.d/20-envsubst-on-templates.sh
/docker-entrypoint.sh: Launching /docker-entrypoint.d/30-tune-worker-processes.sh
/docker-entrypoint.sh: Configuration complete; ready for start up
```
