## Docker-Compose 入门实战

### 简介

> Docker Compose 是一个用于定义和运行多容器 Docker 应用程序的工具。通过 Compose，你可以在一个文件中配置你的应用服务，并且仅用一条命令就可以创建和启动所有服务。这个文件通常被命名为 `docker-compose.yml`。

### 安装

> [!NOTE]
>
> 在开始之前，请确认已经安装了docker。

#### 二进制安装

```
# Linux
curl -L https://github.com/docker/compose/releases/download/2.23.3/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
docker-compose version

# 对于 Windows 和 Mac 用户，Docker Desktop 已经包含了 Docker Compose，无需额外安装。
```

### 实战：部署可道云私有云盘

#### 创建数据目录

> [!WARNING]
>
> 首先创建一个目录作为项目目录，后面所有命令都在这个目录下执行

```
mkdir /data/kodbox && cd /data/kodbox
```

#### 设置数据库环境变量 `vim db.env`

```
MYSQL_PASSWORD=123456
MYSQL_DATABASE=kodbox
MYSQL_USER=kodbox
```

#### 创建docker-compose.yml 文件，在其中配置映射端口、持久化目录

```
vim docker-compose.yml
```

```
version: '3.5'

services:
  db:
    image: mariadb:10.6
    restart: always
    command: --transaction-isolation=READ-COMMITTED --log-bin=binlog --binlog-format=ROW
    volumes:
      - "./db:/var/lib/mysql"       #./db是数据库持久化目录，可以修改
      # - "./etc/mysql/conf.d:/etc/mysql/conf.d"       #增加自定义mysql配置
    environment:
      - MYSQL_ROOT_PASSWORD=
      - MARIADB_AUTO_UPGRADE=1
      - MARIADB_DISABLE_UPGRADE_BACKUP=1
    env_file:
      - db.env
  
  app:
    image: kodcloud/kodbox
    restart: always
    ports:
      - 80:80                       #左边80是使用端口，可以修改
    volumes:
      - "./site:/var/www/html"      #./site是站点目录位置，可以修改
    environment:
      - MYSQL_HOST=db
      - REDIS_HOST=redis
    env_file:
      - db.env
    depends_on:
      - db
      - redis

  redis:
    image: redis:alpine
    restart: always
```

> [!NOTE]
>
> 增加自定义mysql配置

```
mkdir -p ./etc/mysql/conf.d && vim ./etc/mysql/conf.d/custom.cnf
```

#### 运行

> 进入项目目录，执行 `docker compose up -d`启动命令，会自动拉取容器并运行

```
$ docker-compose up -d
#下面是输出内容
Creating network "kodbox_default" with the default driver
Creating kodbox_redis_1 ... done
Creating kodbox_db_1    ... done
Creating kodbox_app_1   ... done

#列出docker容器，可以看到3个容器正在运行
$ docker ps 
#下面是输出内容
CONTAINER ID   IMAGE             COMMAND                  CREATED              STATUS              PORTS                          NAMES
f596f5b00305   kodcloud/kodbox   "/entrypoint.sh /usr…"   About a minute ago   Up About a minute   0.0.0.0:80->80/tcp, 9000/tcp   kodbox_app_1
5f94f6d1aabb   mariadb           "docker-entrypoint.s…"   About a minute ago   Up About a minute   3306/tcp                       kodbox_db_1
e6296b23fb0a   redis:alpine      "docker-entrypoint.s…"   About a minute ago   Up About a minute   6379/tcp                       kodbox_redis_1

#如果需要停止服务
$ docker-compose down
#下面是输出内容
Stopping kodbox_app_1   ... done
Stopping kodbox_db_1    ... done
Stopping kodbox_redis_1 ... done
Removing kodbox_app_1   ... done
Removing kodbox_db_1    ... done
Removing kodbox_redis_1 ... done
Removing network kodbox_default

#因为数据库和kodbox已经挂载了持久化目录，需要时可以重新启动，不用担心数据丢失
$ docker-compose up -d
```

#### 访问

> 访问服务器 `http://IP地址:[映射端口]`，在网页填写配置，完成初始化。

### 实战：离线部署mysql8

```bash
vi mysql.yml
```

```
version: '3.1'

services:
  mysql:
    image: mysql/mysql-server:8.0.30-1.2.9-server
    pull_policy: never
    container_name: mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: "admin123" 
      TZ: "Asia/Shanghai"
    ports:
      - "3306:3306"
    volumes:
      - /data/mysql/mysql-init:/docker-entrypoint-initdb.d # 将包含多个SQL文件的目录映射到容器内
      - /data/mysql/data:/var/lib/mysql
      - /data/mysql/logs:/var/log/mysqld
      - /data/mysql/mysql-files:/var/lib/mysql-files
      - /data/mysql/conf:/etc/mysql
    networks:
      net-test:
        ipv4_address: 100.100.2.2
  
networks:
  net-test:
    external: true
    name: net-test
```

> ## 部分解释
>
> * pull_policy: never  # 表示禁用镜像拉取，从本地镜像启动。
> * /data/mysql/mysql-init    # 此目录下存放的是数据库初始化的sql文件，需要包含创建数据库，创建表的一些语法，让容器启动时将默认数据插入数据库。

### 实战：离线部署nacos

```bash
vi nacos-standlone-mysql.env
```

```bash
PREFER_HOST_MODE=hostname
MODE=standalone
SPRING_DATASOURCE_PLATFORM=mysql
MYSQL_SERVICE_HOST=mysql
MYSQL_SERVICE_DB_NAME=nacos
MYSQL_SERVICE_PORT=3306
MYSQL_SERVICE_USER=root
MYSQL_SERVICE_PASSWORD=admin123
MYSQL_SERVICE_DB_PARAM=characterEncoding=utf8&connectTimeout=1000&socketTimeout=3000&autoReconnect=true&useUnicode=true&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
NACOS_AUTH_IDENTITY_KEY=2222
NACOS_AUTH_IDENTITY_VALUE=2xxx
NACOS_AUTH_TOKEN=SecretKey012345678901234567890123456789012345678901234567890123456789
```


```bash
vi nacos.yml
```

```yaml
version: '3.1'

services:
  nacos:
    image: nacos/nacos-server:v2.2.0-slim
    pull_policy: never
    container_name: nacos
    restart: always
    ports:
      - "8848:8848"
      - "9848:9848"
      - "9849:9849"
    env_file:
      - /data/env/nacos-standlone-mysql.env
    healthcheck:
      test: ["CMD", "curl", "-o", "/dev/null", "-s", "-w", "%{http_code}\n", "http://nacos:8848/nacos/"]
      interval: 30s  # 健康检查的间隔时间
      timeout: 10s   # 健康检查的超时时间
      retries: 3     # 健康检查失败后重试次数
    networks:
      net-test:
        ipv4_address: 100.100.2.3

networks:
  net-test:
    external: true
    name: net-test
```

> * env_file : 从文件中加载环境变量，比使用environment稳定。

### 常用命令

* `docker-compose up `: 构建、(重新)创建、启动和附加到容器。如果运行时带上 `-d` 参数，将会在后台运行。
* `docker-compose down `: 停止并移除所有容器以及网络、卷。如果需要移除数据卷，可以加上 `-v` 参数。
* `docker-compose build `: 构建或重新构建服务中的镜像。这个命令不启动容器，只构建镜像。
* `docker-compose logs `: 查看服务的日志输出。通过 `-f` 参数可以实现跟踪日志输出。
* `docker-compose ps `: 列出所有正在运行的容器。
* `docker-compose stop/start/restart `: 停止/启动/重启服务。
* `docker-compose run `: 在一个服务上运行一个一次性命令。例如，`docker-compose run app sh` 会启动一个具有命令行界面的容器。
