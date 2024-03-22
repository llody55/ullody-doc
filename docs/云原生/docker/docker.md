## Docker一文入门

### 简介

> Docker 是一个开放源代码的软件平台，它允许用户轻松地在任何地方运行、开发和管理应用程序。通过使用 Docker，开发者可以将应用程序及其依赖环境打包成一个轻量级、可移植的容器，这使得应用程序的部署和扩展变得非常简单。

#### 基本概念

* **容器** ：容器是 Docker 的基本单元，它是一个轻量级的、可执行的包，包含了运行某个应用程序所需的一切：代码、运行时环境、库、环境变量和配置文件等。
* **镜像** ：镜像是容器的模板，可以把它想象成是一个应用程序的快照。当你想启动一个容器时，Docker 会从这个镜像来创建容器。镜像是只读的。
* **Dockerfile** ：这是一个文本文件，其中包含了一系列的指令和参数，用来自动构建 Docker 镜像。
* **Docker Hub** ：一个类似于 GitHub 的服务，用户可以在这里找到、分享和存储 Docker 镜像。


#### 如何使用

1. **安装 Docker** ：首先，你需要在你的计算机上安装 Docker。Docker 支持多种平台，包括 Windows、MacOS 和各种 Linux 发行版。
2. **获取镜像** ：安装完成后，你可以通过 Docker Hub 下载一个已经存在的镜像来运行你的第一个容器，或者你可以创建一个新的镜像。
3. **运行容器** ：有了镜像后，你就可以用它来启动一个新的容器。Docker 会为每个容器分配独立的空间，容器之间是隔离的，确保应用稳定运行。
4. **管理容器** ：你可以启动、停止、移动和删除容器，还可以查看容器的状态，甚至进入容器内部进行操作。

#### 为什么使用 Docker

* **便携性** ：由于容器内包含了所有必要的依赖，所以可以确保应用在任何环境中都能以相同的方式运行。
* **快速部署** ：创建和启动容器只需要几秒钟，这使得部署应用变得非常快速。
* **持续集成和持续部署（CI/CD）** ：Docker 与现代的自动化工具和流程相兼容，支持快速迭代和高效的工作流程。
* **微服务架构** ：Docker 非常适合微服务架构，因为它允许你将应用程序分解为较小的、独立的服务，这些服务可以独立开发和部署。

#### 官网地址

* [官方文档](https://docs.docker.com/ "官方文档")

* [官方安装教程](https://docs.docker.com/engine/install/centos/ "官方安装教程")

### 安装 -- 以Linux为例

#### 安装常用工具

```
yum -y install gcc lrzsz vim wget net-tools bash-completion
```

#### 关闭selinux

```
sed -i '/SELINUX/s/enforcing/disabled/g' /etc/selinux/config 
```

#### 关闭防火墙

```
systemctl status firewalld
systemctl stop firewalld
systemctl disable firewalld
```

#### 开始安装docker

##### 安装依赖包

```
yum install -y epel-release
yum install yum-utils device-mapper-persistent-data lvm2
```

##### 添加docker镜像软件源

```
# 官方源
yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
# 阿里源
yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo

# 更新yum索引
yum makecache fast
```

##### 安装版本

```
# 安装最新版
yum install -y docker-ce docker-ce-cli containerd.io

# 安装指定版本
## 查看要安装的版本
yum list docker-ce --showduplicates | sort -r

# 安装指定的版本例如 -- 18.09.9
yum install -y docker-ce-18.09.9 docker-ce-cli-18.09.9 containerd.io
```

##### 卸载方法

```
yum remove docker docker-common docker-selinux -y
```

##### 配置镜像加速

```
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://1do67ezy.mirror.aliyuncs.com"]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
sudo systemctl enable docker
```

#### 镜像管理

##### 镜像获取与管理

* `docker pull <image-name>`

  **作用** : 从远程仓库（如 Docker Hub）下载镜像到本地。

  **示例** : `docker pull ubuntu` - 下载最新版的 Ubuntu 镜像。
* `docker push <image-name>`

  **作用** : 将本地镜像推送到远程仓库。

  **示例** : `docker push myusername/myimage` - 将本地的 `myimage` 镜像推送到 Docker Hub 上的 `myusername` 用户的仓库。
* `docker build -t <tag> .`

  **作用** : 根据当前目录下的 Dockerfile 构建一个新的镜像并标记。

  **示例** : `docker build -t myimage:v1 .` - 根据 Dockerfile 构建一个标记为 `myimage:v1` 的镜像。
* `docker images` 或 `docker image ls`

  **作用** : 列出本地存在的镜像。

  **示例** : `docker images` - 显示所有本地镜像。

##### 镜像修改与保存

* `docker rmi <image-name>`

  **作用** : 删除一个或多个本地的镜像。

  **示例** : `docker rmi ubuntu` - 删除本地的 Ubuntu 镜像。
* `docker tag <image-name> <new-image-name>`

  **作用** : 给本地镜像标记一个新的名称或标签。

  **示例** : `docker tag ubuntu ubuntu:latest` - 给本地的 ubuntu 镜像标记为最新版。
* `docker save -o <path-for-tar> <image-name>`

  **作用** : 将镜像保存为 tar 归档文件。

  **示例** : `docker save -o ubuntu.tar ubuntu` - 将 ubuntu 镜像保存为 ubuntu.tar 文件。
* `docker load -i <path-for-tar>`

  **作用** : 从 tar 归档文件中加载一个镜像。

  **示例** : `docker load -i ubuntu.tar` - 从 ubuntu.tar 文件中加载镜像。

##### 镜像查看和检查

* `docker history <image-name>`

  **作用** : 显示一个镜像的历史。

  **示例** : `docker history ubuntu` - 显示 ubuntu 镜像的历史。
* `docker inspect <image-name>`

  **作用** : 显示一个镜像的详细信息，如其 JSON 配置文件等。

  **示例** : `docker inspect ubuntu` - 显示 ubuntu 镜像的详细信息。

#### 容器管理

##### 创建与启动

* `docker create <image>`: 创建一个新的容器但不启动它。

  * 示例: `docker create -t ubuntu` 创建一个基于 `ubuntu` 镜像的新容器但不立即启动。
* `docker run <image>`: 创建并启动一个新的容器。

  * 示例: `docker run -it ubuntu /bin/bash` 以交互模式启动一个 `ubuntu` 容器并打开一个终端会话。
* `docker run `参数示例。

  ```
  docker run [OPTIONS] IMAGE [COMMAND] [ARG...]
   OPTIONS说明（常用）：有些是一个减号，有些是两个减号
  --name="容器新名字": 为容器指定一个名称；
  -d: 后台运行容器，并返回容器ID，也即启动守护式容器；
  --rm 运行结束删除容器
  -i：以交互模式运行容器，通常与 -t 同时使用；
  -t：为容器重新分配一个伪输入终端，通常与 -i 同时使用；
  -P: 随机端口映射；
  -p: 指定端口映射，有以下四种格式：
        映射到指定地址的指定端口       docker run -d -p 127.0.0.1:80:80 nginx:alpine
        ip:hostPort:containerPort
        映射到指定地址的任意端口      docker run -d -p 127.0.0.1::80 nginx:alpine
        ip::containerPort
        映射所有接口地址             docker run -d -p 80:80 nginx:alpine
        hostPort:containerPort
        containerPort

  查看服务映射的端口
  docker port [NAMES] [PORTS]
  ```
* 补充

  ```
  示例：
  内存限额：
  允许容器最多使用500M内存和100M的Swap，并禁用 OOM Killer：
  docker run -d --name nginx03 --memory="500m" --memory-swap=“600m" --oom-kill-disable nginx
  CPU限额：
  允许容器最多使用一个半的CPU：
  docker run -d --name nginx04 --cpus="1.5" nginx
  允许容器最多使用50%的CPU：
  docker run -d --name nginx05 --cpus=".5" nginx
  ```

##### 容器状态管理

* `docker start <container>`: 启动一个或多个已停止的容器。
  * 示例: `docker start my_container` 启动名称为 `my_container` 的容器。
* `docker stop <container>`: 停止一个运行中的容器。
  * 示例: `docker stop my_container` 停止 `my_container`。
* `docker restart <container>`: 重启容器。
  * 示例: `docker restart my_container` 重启 `my_container`。
* `docker pause <container>`: 暂停容器中的所有进程。
  * 示例: `docker pause my_container` 暂停 `my_container`。
* `docker unpause <container>`: 恢复容器中被暂停的所有进程。
  * 示例: `docker unpause my_container` 恢复 `my_container`。
* `docker kill <container>`: 立即停止容器运行。
  * 示例: `docker kill my_container` 立即停止 `my_container` 的运行。

##### 容器查询与监控

* `docker ps`: 列出当前所有运行中的容器。
  * 示例: `docker ps` 显示所有活动容器。
* `docker logs <container>`: 获取容器的日志输出。
  * 示例: `docker logs my_container` 查看 `my_container` 的日志。
* `docker inspect <container>`: 显示一个容器的详细配置信息。
  * 示例: `docker inspect my_container` 查看 `my_container` 的详细信息。
* `docker stats`: 显示一个或多个容器的实时资源使用情况。
  * 示例: `docker stats` 显示所有容器的资源使用情况。

##### 容器操作与维护

* `docker exec <container> <command>`: 在运行的容器中执行命令。
  * 示例: `docker exec my_container echo "Hello World"` 在 `my_container` 中执行 `echo` 命令。
* `docker cp <container>:<path> <local_path>`: 从运行的容器中复制文件到本地。
  * 示例: `docker cp my_container:/var/log/dmesg .` 将 `my_container` 中的 `/var/log/dmesg` 文件复制到当前目录。
* `docker attach <container>`: 连接到正在运行的容器。
  * 示例: `docker attach my_container` 连接到 `my_container`。

##### 容器清理

* `docker rm <container>`: 删除一个或多个容器。
  * 示例: `docker rm my_container` 删除 `my_container`。
* `docker container prune`: 删除所有停止的容器。
  * 示例: `docker container prune` 删除所有未运行的容器。

#### 网络管理

##### 创建与管理

* `docker network create <options> <network_name>`

  **作用** : 创建一个新的网络。

  **示例** : `docker network create --driver bridge my_network` 创建一个名为 `my_network` 的桥接网络。
* `docker network ls`

  **作用** : 列出所有网络。

  **示例** : `docker network ls` 显示所有现有网络。
* `docker network rm <network_name>`

  **作用** : 删除一个或多个网络。

  **示例** : `docker network rm my_network` 删除名为 `my_network` 的网络。
* `docker network connect <network_name> <container_name>`

  **作用** : 将一个运行中的容器连接到网络。

  **示例** : `docker network connect my_network my_container` 将名为 `my_container` 的容器连接到 `my_network` 网络。
* `docker network disconnect <network_name> <container_name>`

  **作用** : 将一个容器从网络中断开。

  **示例** : `docker network disconnect my_network my_container` 将 `my_container` 从 `my_network` 网络中断开。

##### 网络查看与检查

* `docker network inspect <network_name>`
  **作用** : 显示一个网络的详细信息。
  **示例** : `docker network inspect my_network` 查看 `my_network` 网络的详细信息。

##### 网络驱动

* Docker 网络驱动包括但不限于 `bridge`、`host`、`overlay`、`none` 和 `macvlan`：
  * `bridge`: 默认的网络驱动。如果没有指定驱动，Docker 会使用桥接网络。
  * `host`: 移除了容器和 Docker 主机之间的网络隔离。使用 Docker 主机的网络。
  * `overlay`: 用于在 Docker Swarm 集群的不同主机上的容器之间，建立安全的网络通信。
  * `none`: 禁用所有网络。
  * `macvlan`: 允许为容器分配 MAC 地址，使其像物理设备一样出现在网络上。

#### 存储管理

##### 数据卷（Volumes）管理

* `docker volume create <options> <volume_name>`

  **作用** : 创建一个新的数据卷。

  **示例** : `docker volume create my_volume` 创建名为 `my_volume` 的数据卷。
* `docker volume ls`

  **作用** : 列出所有数据卷。

  **示例** : `docker volume ls` 显示所有现有数据卷。
* `docker volume inspect <volume_name>`

  **作用** : 显示一个数据卷的详细信息。

  **示例** : `docker volume inspect my_volume` 查看 `my_volume` 数据卷的详细信息。
* `docker volume rm <volume_name>`

  **作用** : 删除一个或多个数据卷。

  **示例** : `docker volume rm my_volume` 删除名为 `my_volume` 的数据卷。
* `docker volume prune`

  **作用** : 删除所有未被容器使用的数据卷。

  **示例** : `docker volume prune` 用于清理不再使用的数据卷，释放存储空间。

##### 绑定挂载（Bind Mounts）

绑定挂载使用的是主机文件系统上的路径。当启动容器时，使用 `-v` 或 `--mount` 标志将主机的路径挂载到容器中。这不是一个单独的命令，而是在使用例如 `docker run` 命令时的一个选项。

* **示例** : `docker run -v /host/path:/container/path <image_name>` 将主机上的 `/host/path` 挂载到容器的 `/container/path`

> 但是最常用的还是Bind Mounts方式进行挂载。


### Dockerfile入门

> **Dockerfile是用来构建Docker镜像的构建文件，是由一系列命令和参数构成的脚本。**
>
> 构建三步骤：1，编写dockerfile文件，2，docker build 3，docker run

#### **dockerfile基础知识**

> **1：每条保留字指令都必须为大写字母且后面要跟随至少一个参数**
>
> **2：指令按照从上到下，顺序执行**
>
> **3：#表示注释**
>
> **4：每条指令都会创建一个新的镜像层，并对镜像进行提交**

#### **dockerfile执行流程**

>
> **（1）docker从基础镜像运行一个容器**
>
> **（2）执行一条指令并对容器作出修改**
>
> **（3）执行类似docker commit的操作提交一个新的镜像层**
>
> **（4）docker再基于刚提交的镜像运行一个新容器**
>
> **（5）执行dockerfile中的下一条指令直到所有指令都执行完成**

#### DockerFile体系结构(**保留字指令**)

```
FROM：基础镜像，当前新镜像是基于哪个镜像的
MAINTAINER：镜像维护者的姓名和邮箱地址
RUN：容器构建时需要运行的命令
EXPOSE：当前容器对外暴露出的端口
WORKDIR：指定在创建容器后，终端默认登陆的进来工作目录，一个落脚点
ENV：用来在构建镜像过程中设置环境变量
ENV MY_PATH /usr/mytest
这个环境变量可以在后续的任何RUN指令中使用，这就如同在命令前面指定了环境变量前缀一样；
也可以在其它指令中直接使用这些环境变量，
比如：WORKDIR $MY_PATH
ADD：将宿主机目录下的文件拷贝进镜像且ADD命令会自动处理URL和解压tar压缩包
COPY：类似ADD，拷贝文件和目录到镜像中。将从构建上下文目录中 <源路径> 的文件/目录复制到新的一 层的镜像内的 <目标路径> 位置，例如：COPY src dest  或者 COPY ["src", "dest"]
VOLUME：容器数据卷，用于数据保存和持久化工作
CMD：指定一个容器启动时要运行的命令，Dockerfile 中可以有多个 CMD 指令，但只有最后一个生效，	   
CMD 会被 docker run 之后的参数替换
ENTRYPOINT：指定一个容器启动时要运行的命令，ENTRYPOINT 的目的和 CMD 一样，都是在指定容   器启动程序及参数
HEALTHCHECK： 健康检查，指令是告诉 Docker 应该如何进行判断容器的状态是否正常。
ONBUILD：当构建一个被继承的Dockerfile时运行命令，父镜像在被子继承后父镜像的onbuild被触发
井号 ：“#” 后是注释
```

### Dockerfile实战

#### java

```
vim Dockerfile

FROM debian:oldstable-slim
LABEL maintainer llody
WORKDIR /opt
ADD  jdk-11.0.11_linux-x64_bin.tar.gz /usr/local/java/
RUN ln -s /usr/local/java/jdk-11.0.11/bin/java /usr/bin/java

ENV  JAVA_HOME=/usr/local/java/jdk-11.0.11
ENV  JRE_HOME=${JAVA_HOME}/jre
ENV  CLASSPATH=.:${JAVA_HOME}/lib:${JRE_HOME}/lib
ENV  PATH $PATH:${JAVA_HOME}/bin
ENV  export DOCKER_BUILDKIT=1

```

> 制作java基础镜像。
>
> 将jdk-11.0.11_linux-x64_bin.tar.gz安装包与Dockerfile放在相同目录build即可

#### nginx

```
vim nginx.conf

user  nginx;
worker_processes  1;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;


events {
    worker_connections  4096;
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


```
vim Dockerfile

FROM nginx:1.22.0

LABEL maintainer llody

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```


#### Jenkins-agent

```
FROM centos:7
LABEL maintainer llody


ADD  jdk-11.0.11_linux-x64_bin.tar.gz /usr/local/java/
ADD  apache-maven-3.8.2-bin.tar.gz   /usr/local/ 
RUN ln -s /usr/local/java/jdk-11.0.11/bin/java /usr/bin/java

RUN  mkdir -p /usr/local/
COPY sonar-scanner /usr/local/

ENV  JAVA_HOME=/usr/local/java/jdk-11.0.11/
ENV  JRE_HOME=${JAVA_HOME}/jre
ENV  CLASSPATH=.:${JAVA_HOME}/lib:${JRE_HOME}/lib
ENV  M2_HOME=/usr/local/apache-maven-3.8.2
ENV  SONAR_SCANNER_HOME=/usr/local/sonar-scanner
ENV  PATH $PATH:${JAVA_HOME}/bin:$M2_HOME/bin:${SONAR_SCANNER_HOME}/bin:$M2_HOME/bin
ENV  export DOCKER_BUILDKIT=1

RUN mkdir -p ~/.docker/cli-plugins

COPY buildx-v0.9.1.linux-amd64 ~/.docker/cli-plugins/docker-buildx
COPY buildx-v0.9.1.linux-amd64 /usr/libexec/docker/cli-plugins/docker-buildx
RUN chmod +x /usr/libexec/docker/cli-plugins/docker-buildx

RUN yum install -y curl git libtool-ltdl-devel && \ 
    yum clean all && \
    rm -rf /var/cache/yum/* && \
    mkdir -p /usr/share/jenkins

COPY slave.jar /usr/share/jenkins/slave.jar  
COPY jenkins-slave /usr/bin/jenkins-slave
COPY settings.xml /etc/maven/settings.xml
COPY settings.xml /root/.m2/settings.xml
RUN chmod +x /usr/bin/jenkins-slave
COPY helm kubectl /usr/bin/

WORKDIR /opt/

ENTRYPOINT ["jenkins-slave"]
```

>
> 组件包含：
>
> jenkins-slave
>
> kubectl
>
> helm
>
> jdk11
>
> mvn3.8
>
> buildx
>
> sonar-scanner

#### Gitlab-Runner

```
FROM centos:7
LABEL maintainer llody

ADD  jdk-11.0.15_linux-x64_bin.tar.gz /usr/local/java/
ADD  apache-maven-3.8.2-bin.tar.gz   /usr/local/ 
ADD  sources.list /etc/apt
RUN  ln -s /usr/local/java/jdk-11.0.15/bin/java /usr/bin/java

RUN  mkdir -p /usr/local/

COPY sonar-scanner /usr/local/

ENV  JAVA_HOME=/usr/local/java/jdk-11.0.15/
ENV  JRE_HOME=${JAVA_HOME}/jre
ENV  CLASSPATH=.:${JAVA_HOME}/lib:${JRE_HOME}/lib
ENV  M2_HOME=/usr/local/apache-maven-3.8.2
ENV  SONAR_SCANNER_HOME=/usr/local/sonar-scanner
ENV  PATH $PATH:${JAVA_HOME}/bin:${SONAR_SCANNER_HOME}/bin:$M2_HOME/bin

RUN mkdir -p ~/.docker/cli-plugins

COPY buildx-v0.9.1.linux-amd64 ~/.docker/cli-plugins/docker-buildx
COPY buildx-v0.9.1.linux-amd64 /usr/libexec/docker/cli-plugins/docker-buildx
RUN chmod +x /usr/libexec/docker/cli-plugins/docker-buildx

COPY settings.xml /etc/maven/settings.xml
COPY settings.xml /root/.m2/settings.xml
COPY helm kubectl /usr/bin/
```

### docker部署实战

#### it-Tools工具箱

```
docker run -d --name it-tools --restart unless-stopped -p 8080:80 corentinth/it-tools:latest
```

#### linux速查

```
docker run --name linux-command -itd -p 9665:3000 wcjiang/linux-command:latest
```

#### mysql

```
# 创建持久化目录
mkdir -p /data/mysql/{logs,data,conf,mysql-files}

# 创建配置文件
vim /data/mysql/conf/my.cnf

[mysqld]
port = 3306
log-bin=mysql-bin
binlog-format=ROW
server_id=1
#socket = /tmp/mysql.sock
socket = /var/run/mysqld/mysqld.sock
basedir = /usr/local/mysql
datadir = /var/lib/mysql
bind-address = 0.0.0.0
group_concat_max_len = 102400
default-time-zone = '+08:00'
max_connections = 1000
expire_logs_days=30

# 运行容器
docker run -p 33066:3306 --name mysql -v /data/mysql/logs:/var/log/mysql -v  /data/mysql/mysql-files:/var/lib/mysql-files -v /data/mysql/data:/var/lib/mysql -v  /data/mysql/conf:/etc/mysql -e MYSQL_ROOT_PASSWORD=123456 -d mysql/mysql-server:8.0.27-1.2.6-server
```

#### rabbitmq

```
# 创建数据目录
mkdir -p /data/rabbitmq/data

# 运行容器
docker run -d --name rabbitmq  -v /data/rabbitmq/data:/var/lib/rabbitmq -e RABBITMQ_DEFAULT_VHOST=/ -e RABBITMQ_DEFAULT_USER=lgkj -e RABBITMQ_DEFAULT_PASS=123456  -p 15672:15672 -p 5672:5672  rabbitmq:3.8.26-management
```

#### redis

```
# 创建数据目录
mkdir -p /data/redis/{conf,data}

vim /data/redis/conf/redis.conf

bind 0.0.0.0
port 16379
requirepass 123456
timeout 600
protected-mode no
maxclients 1000000
maxmemory 1932735283
maxmemory-policy volatile-lru

docker run -p 16379:16379 --name redis -v /data/redis/conf/redis.conf:/etc/redis/redis.conf  -v  /data/redis/data:/data -d redis:6.2  redis-server /etc/redis/redis.conf --appendonly yes

```

> 长期维护更新。
