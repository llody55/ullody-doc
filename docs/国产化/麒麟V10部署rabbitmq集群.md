## docker-compase多主机搭建rabbitmq集群

### 环境规划

| 主机IP          | 主机名         | 系统               | MQ版本         | CPU架构 | 说明 |
| --------------- | -------------- | ------------------ | -------------- | ------- | ---- |
| 192.168.174.18  | rabbitmq-1-18  | Ubuntu 22.04.4 LTS | 3.9-management | ARM64   |      |
| 192.168.174.218 | rabbitmq-2-218 | Ubuntu 22.04.4 LTS | 3.9-management | ARM64   |      |
| 192.168.174.112 | rabbitmq-3-112 | Ubuntu 22.04.4 LTS | 3.9-management | ARM64   |      |

### 端口

| 端口  | 说明 |
| ----- | ---- |
| 4369  |      |
| 5672  |      |
| 15672 |      |
| 15692 |      |
| 25672 |      |

### 默认账户密码

> guest/guest

### 部署

#### 创建持久化目录(所有节点)

```bash
mkdir /data/rabbitmq/
```

#### 修改主机名

```bash
# 对应节点运行
hostnamectl set-hostname rabbitmq-1-18
hostnamectl set-hostname rabbitmq-2-218
hostnamectl set-hostname rabbitmq-3-112
```

#### 创建hosts文件(所有节点)

```bash
cat >> /data/rabbitmq/hosts << EOF
192.168.174.18  rabbitmq-1-18
192.168.174.218  rabbitmq-2-218
192.168.174.112   rabbitmq-3-112
EOF
```

#### 创建docker-compose文件

##### rabbitmq-1-18

```bash
mkdir /root/shell/
```

```bash
vim /root/shell/rabbitmq-1-18.yml
```

```yaml
version: '3'
services:
  rabbitmq-1-18:
    image: arm64v8/rabbitmq:3.9-management
    hostname: rabbitmq-1-18
    container_name: rabbitmq-1-18
    restart: always
    ports:
      - "4369:4369"
      - "5672:5672"
      - "15672:15672"
      - "15692:15692"
      - "25672:25672"
    volumes:
      - /data/rabbitmq/:/var/lib/rabbitmq:z
      - /data/rabbitmq/hosts:/etc/hosts
    environment:
      - RABBITMQ_ERLANG_COOKIE=rabbitClusterCookie
    extra_hosts:
      - "rabbitmq-1-18:192.168.174.18"
      - "rabbitmq-2-218:192.168.174.218"
      - "rabbitmq-3-112:192.168.174.112"

```

```bash
docker-compose -p rabbitmq -f shell/rabbitmq-1-18.yml up -d
```


##### rabbitmq-2-218

```bash
mkdir /root/shell/
```

```bash
vim /root/shell/rabbitmq-2-218.yml
```

```yaml
version: '3'
services:
  rabbitmq-2-218:
    image: arm64v8/rabbitmq:3.9-management
    hostname: rabbitmq-2-218
    container_name: rabbitmq-2-218
    restart: always
    ports:
      - "4369:4369"
      - "5672:5672"
      - "15672:15672"
      - "15692:15692"
      - "25672:25672"
    volumes:
      - /data/rabbitmq/:/var/lib/rabbitmq:z
      - /data/rabbitmq/hosts:/etc/hosts
    environment:
      - RABBITMQ_ERLANG_COOKIE=rabbitClusterCookie
    extra_hosts:
      - "rabbitmq-1-18:192.168.174.18"
      - "rabbitmq-2-218:192.168.174.218"
      - "rabbitmq-3-112:192.168.174.112"

```

```bash
docker-compose -p rabbitmq -f shell/rabbitmq-2-218.yml up -d
```

##### rabbitmq-3-112

```bash
mkdir /root/shell/
```

```bash
vim /root/shell/rabbitmq-3-112.yml
```

```yaml
version: '3'
services:
  rabbitmq-3-112:
    image: arm64v8/rabbitmq:3.9-management
    hostname: rabbitmq-3-112
    container_name: rabbitmq-3-112
    restart: always
    ports:
      - "4369:4369"
      - "5672:5672"
      - "15672:15672"
      - "15692:15692"
      - "25672:25672"
    volumes:
      - /data/rabbitmq/:/var/lib/rabbitmq:z
      - /data/rabbitmq/hosts:/etc/hosts
    environment:
      - RABBITMQ_ERLANG_COOKIE=rabbitClusterCookie
    extra_hosts:
      - "rabbitmq-1-18:192.168.174.18"
      - "rabbitmq-2-218:192.168.174.218"
      - "rabbitmq-3-112:192.168.174.112"

```

```bash
docker-compose -p rabbitmq -f shell/rabbitmq-3-112.yml up -d
```

#### 加入集群,以rabbitmq-1-18为基准

```bash
#218 
root@rabbitmq-2-218:~# docker exec -it rabbitmq-2-218 /bin/bash
root@rabbitmq-2-218:/# rabbitmqctl stop_app
RABBITMQ_ERLANG_COOKIE env variable support is deprecated and will be REMOVED in a future version. Use the $HOME/.erlang.cookie file or the --erlang-cookie switch instead.
Stopping rabbit application on node rabbit@rabbitmq-2-218 ...

root@rabbitmq-2-218:/# rabbitmqctl join_cluster rabbit@rabbitmq-1-18
RABBITMQ_ERLANG_COOKIE env variable support is deprecated and will be REMOVED in a future version. Use the $HOME/.erlang.cookie file or the --erlang-cookie switch instead.
Clustering node rabbit@rabbitmq-2-218 with rabbit@rabbitmq-1-18
root@rabbitmq-2-218:/# rabbitmqctl start_app
RABBITMQ_ERLANG_COOKIE env variable support is deprecated and will be REMOVED in a future version. Use the $HOME/.erlang.cookie file or the --erlang-cookie switch instead.
Starting node rabbit@rabbitmq-2-218 ...


#112
root@rabbitmq-3-112:~# docker exec -it rabbitmq-3-112 /bin/bash
root@rabbitmq-3-112:/# rabbitmqctl stop_app
RABBITMQ_ERLANG_COOKIE env variable support is deprecated and will be REMOVED in a future version. Use the $HOME/.erlang.cookie file or the --erlang-cookie switch instead.
Stopping rabbit application on node rabbit@rabbitmq-3-112 ...
root@rabbitmq-3-112:/# rabbitmqctl join_cluster rabbit@rabbitmq-1-18
RABBITMQ_ERLANG_COOKIE env variable support is deprecated and will be REMOVED in a future version. Use the $HOME/.erlang.cookie file or the --erlang-cookie switch instead.
Clustering node rabbit@rabbitmq-3-112 with rabbit@rabbitmq-1-18
root@rabbitmq-3-112:/# rabbitmqctl start_app
RABBITMQ_ERLANG_COOKIE env variable support is deprecated and will be REMOVED in a future version. Use the $HOME/.erlang.cookie file or the --erlang-cookie switch instead.
Starting node rabbit@rabbitmq-3-112 ...

```

### 验证

> 登录：http://192.168.174.18:15672   进行验证，默认账户密码：guest/guest
