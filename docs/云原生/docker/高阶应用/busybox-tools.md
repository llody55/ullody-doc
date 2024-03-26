## 构建的多平台调试工具

### 简介

> 基于alpine自定义构建busybox-tools测试镜像
>
> 包含命令：
>
> * ifconfig
> * ping
> * curl
> * nslookup
> * mysql-client

### 创建Dockerfile

```bash
FROM alpine:v3.19
RUN echo "https://mirror.tuna.tsinghua.edu.cn/alpine/v3.19//main/" > /etc/apk/repositories && \
    echo "https://mirror.tuna.tsinghua.edu.cn/alpine/v3.19/community/" >> /etc/apk/repositories && \
    echo "https://mirror.tuna.tsinghua.edu.cn/alpine/v3.19/releases/" >> /etc/apk/repositories && \
    apk update && apk upgrade && \
    apk --no-cache add curl iproute2 iputils net-tools bind-tools busybox-extras mysql-client
RUN rm -rf /var/cache/apk/*
CMD ["/bin/sh"]
```

### 构建镜像

```bash
docker buildx build -t busybox-tools:v20230428 --platform=linux/arm64,linux/amd64 -o type=registry .
```

### 使用方法

#### docker使用方法

```bash
docker run -it --rm  llody/busybox-tools:v20230428 /bin/sh
```

#### K8S环境使用方法

```bash
kubectl run -it busybox --rm  --image=llody/busybox-tools:v20230428 --restart=Never /bin/sh
```
