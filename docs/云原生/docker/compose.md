## Docker-Compose 入门实战

### 简介

> Docker Compose 是一个用于定义和运行多容器 Docker 应用程序的工具。通过 Compose，你可以在一个文件中配置你的应用服务，并且仅用一条命令就可以创建和启动所有服务。这个文件通常被命名为 `docker-compose.yml`。

### 安装

> [!NOTE]
>
> 在开始之前，请确认已经安装了docker。

#### 二进制安装

```
curl -L https://github.com/docker/compose/releases/download/2.23.3/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
docker-compose version
```
