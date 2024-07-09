## docker-compose快速部署MySQL8

### 创建持久化目录

```bash
mkdir -p /data/mysql/{mysql-init,data,logs,mysql-files,conf}
```

### 创建初始化sql

```bash
vim user_init.sql
```

```sql
-- MySQL dump 10.13  Distrib 8.0.30, for Linux (x86_64)
UPDATE mysql.user SET host = '%' WHERE user = 'root';
FLUSH PRIVILEGES;
```

### 创建my.cnf

```bash
vim my.cnf
```

```bash
[mysqld]
port = 3306
log-bin=mysql-bin
binlog-format=ROW
server_id=1
#socket = /tmp/mysql.sock
#socket = /var/run/mysqld/mysqld.sock
basedir = /usr/local/mysql
datadir = /var/lib/mysql
#log-error=/var/log/mysqld/mysqld.log
bind-address = 0.0.0.0
group_concat_max_len = 102400
default-time-zone = '+08:00'
max_connections = 1000
expire_logs_days=30
```

### 创建mysql.yml

```bash
vim mysql.yml
```

```yaml
version: '3.1'

services:
  mysql:
    image: swr.cn-southwest-2.myhuaweicloud.com/llody/mysql-server:8.0.32 
    container_name: mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: "123456" 
      TZ: "Asia/Shanghai"
    ports:
      - "3306:3306"
    volumes:
      - /data/mysql/mysql-init:/docker-entrypoint-initdb.d # 将包含多个SQL文件的目录映射到容器内
      - /data/mysql/data:/var/lib/mysql
      - /data/mysql/logs:/var/log/mysqld
      - /data/mysql/mysql-files:/var/lib/mysql-files
      - /data/mysql/conf:/etc/mysql

```

### 拷贝文件到指定目录

```bash
mv user_init.sql  /data/mysql/mysql-init/
mv my.cnf /data/mysql/conf/
```

### 授权

```bash
chmod -R 755 /data/mysql
```

### 部署

```bash
docker-compose  -f mysql.yml up -d
```
