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

#### 其他

##### 通过环境变量自动配置

kodbox容器支持通过环境变量自动配置。您可以在首次运行时预先配置安装页面上要求的所有内容。要启用自动配置，请通过以下环境变量设置数据库连接。

 **MYSQL/MariaDB** :

* `MYSQL_DATABASE` 数据库名称.
* `MYSQL_USER` 数据库用户.
* `MYSQL_PASSWORD` 数据库用户密码.
* `MYSQL_SERVER` 数据库服务地址.
* `MYSQL_PORT` 数据库端口，默认3306

如果设置了任何值，则在首次运行时不会在安装页面中询问这些值。通过使用数据库类型的所有变量完成配置后，您可以通过设置管理员和密码（仅当您同时设置这两个值时才有效）来配置kodbox实例：

* `KODBOX_ADMIN_USER` 管理员用户名，可以不设置，访问网页时自己填.
* `KODBOX_ADMIN_PASSWORD` 管理员密码，可以不设置，访问网页时自己填.

 **redis/memcached** :

* `SESSION_TYPE` 缓存类型，默认redis，仅当配置 `SESSION_HOST`时生效.
* `SESSION_HOST` 缓存地址.
* `SESSION_PORT` 缓存端口，默认6379，仅当配置 `SESSION_HOST`时生效.

### 常用命令

* `docker-compose up `: 构建、(重新)创建、启动和附加到容器。如果运行时带上 `-d` 参数，将会在后台运行。
* `docker-compose down `: 停止并移除所有容器以及网络、卷。如果需要移除数据卷，可以加上 `-v` 参数。
* `docker-compose build `: 构建或重新构建服务中的镜像。这个命令不启动容器，只构建镜像。
* `docker-compose logs `: 查看服务的日志输出。通过 `-f` 参数可以实现跟踪日志输出。
* `docker-compose ps `: 列出所有正在运行的容器。
* `docker-compose stop/start/restart `: 停止/启动/重启服务。
* `docker-compose run `: 在一个服务上运行一个一次性命令。例如，`docker-compose run app sh` 会启动一个具有命令行界面的容器。
