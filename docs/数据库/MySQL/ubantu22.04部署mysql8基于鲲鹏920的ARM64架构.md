## 准备

### 安装环境

```bash
root@mysql:~# uname -a
Linux mysql 5.15.0-116-generic #126-Ubuntu SMP Mon Jul 1 10:08:40 UTC 2024 aarch64 aarch64 aarch64 GNU/Linux

```

### 发行版本

```bash
root@mysql:~# cat /etc/os-release 
PRETTY_NAME="Ubuntu 22.04.4 LTS"
NAME="Ubuntu"
VERSION_ID="22.04"
VERSION="22.04.4 LTS (Jammy Jellyfish)"
VERSION_CODENAME=jammy
ID=ubuntu
ID_LIKE=debian
HOME_URL="https://www.ubuntu.com/"
SUPPORT_URL="https://help.ubuntu.com/"
BUG_REPORT_URL="https://bugs.launchpad.net/ubuntu/"
PRIVACY_POLICY_URL="https://www.ubuntu.com/legal/terms-and-policies/privacy-policy"
UBUNTU_CODENAME=jammy

```

### 查看可以安装的版本

```bash
root@mysql:~# apt-cache policy mysql-server
mysql-server:
  Installed: (none)
  Candidate: 8.0.39-0ubuntu0.22.04.1
  Version table:
     8.0.39-0ubuntu0.22.04.1 500
        500 https://mirrors.ustc.edu.cn/ubuntu-ports jammy-updates/main arm64 Packages
        500 https://mirrors.ustc.edu.cn/ubuntu-ports jammy-security/main arm64 Packages
     8.0.28-0ubuntu4 500
        500 https://mirrors.ustc.edu.cn/ubuntu-ports jammy/main arm64 Packages

```

## 部署

### 安装mysql

```bash

# 安装默认版本

sudoapt-getinstallmysql-server-y


# 安装指定版本方式

sudoapt-getinstallmysql-server=8.0.28-0ubuntu4

```

### 卸载mysql方法

```bash

# 卸载mysql服务

aptremovemysql-server--purge

# 删除部分依赖

aptautoremove

```

### 启动

```bash

systemctlstartmysql.service

systemctlstatusmysql.service

systemctlenablemysql.service

```

### 创建账户

```bash


# 设置root密码并指定密码认证组件,注意，这样设置后，root用户就必须使用密码才能进行登录了。

ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'you_password';

FLUSH PRIVILEGES;


# 创建用户

create user llody@'%'identifiedby'you_password';


grant all privileges on *.*  to llody@'%' with grant option;


ALTER USER 'llody'@'%' IDENTIFIED WITH mysql_native_password BY 'you_password';


flush privileges;


select * from mysql.user where user='llody'\G;


# 创建开发者账户,没有删除权限

CREATE USER 'dev'@'%' IDENTIFIED BY 'you_password';

GRANT SELECT,INSERT,UPDATE,CREATE ON *.* TO 'dev'@'%';

FLUSH PRIVILEGES;


```

### 迁移数据目录

#### 查看当前数据库存储路径

```bash

root@mysql:~# mysql -uroot -p
mysql> show variables like 'datadir';
+---------------+-----------------+
| Variable_name | Value           |
+---------------+-----------------+
| datadir       | /var/lib/mysql/ |
+---------------+-----------------+
1 row in set (0.00 sec)

```

#### 停止mysql服务

```bash

root@mysql:~# systemctl stop mysql.service 

```

#### 创建新的存储路径，并将MySQL的数据复制到新的目录中

```bash

root@mysql:~# mkdir -p /data/mysql/data/
root@mysql:~# cp -ar /var/lib/mysql/* /data/mysql/data
root@mysql:~# chown -R mysql:mysql /data/mysql
root@mysql:~# chmod -R 750 /data/mysql



```

#### 修改MySQL的配置文件

```bash

root@mysql:~# vim /etc/mysql/mysql.conf.d/mysqld.cnf

修改（没有就新增）datadir为新的mysql存储路径：
datadir         = /data/mysql/data

```

#### 修改安全保护文件

```bash
root@mysql:~# vim /etc/apparmor.d/usr.sbin.mysqld
修改# data dir access下的文件路径：
# Allow data dir access
  #/var/lib/mysql/ r,
  #/var/lib/mysql/** rwk,
  /data/mysql/data/ r,
  /data/mysql/data/** rwk,
```

#### 修改mysql访问控制文件

```bash
root@mysql:~# vim /etc/apparmor.d/abstractions/mysql

将 /var/lib/mysql{,d}/mysql{,d}.sock rw,
改成 /data/mysql/data{,d}/mysql{,d}.sock rw,

```

#### 重载AppArmor配置并启动MySQL服务

```bash
root@mysql:~# systemctl reload apparmor.service 
root@mysql:~# systemctl start mysql.service 
root@mysql:~# systemctl status mysql.service 
● mysql.service - MySQL Community Server
     Loaded: loaded (/lib/systemd/system/mysql.service; enabled; vendor preset: enabled)
     Active: active (running) since Tue 2024-08-06 17:46:20 CST; 7s ago
    Process: 233698 ExecStartPre=/usr/share/mysql/mysql-systemd-start pre (code=exited, status=0/SUCCESS)
   Main PID: 233706 (mysqld)
     Status: "Server is operational"
      Tasks: 38 (limit: 154216)
     Memory: 365.6M
        CPU: 745ms
     CGroup: /system.slice/mysql.service
             └─233706 /usr/sbin/mysqld

Aug 06 17:46:19 mysql systemd[1]: Starting MySQL Community Server...
Aug 06 17:46:20 mysql systemd[1]: Started MySQL Community Server.

```

### 开放3306端口

```bash

vim/etc/mysql/mysql.conf.d/mysqld.cnf


将bind-address            =127.0.0.1

修改为bind-address            =0.0.0.0

```

### mysql配置优化

```bash
[mysqld]
user            = mysql
pid-file        = /var/run/mysqld/mysqld.pid
socket  = /var/run/mysqld/mysqld.sock
port            = 3306
#datadir        = /var/lib/mysql
datadir         = /data/mysql/data
bind-address            = 0.0.0.0
mysqlx-bind-address     = 127.0.0.1
key_buffer_size         = 16M
log_error = /var/log/mysql/error.log
max_binlog_size   = 100M

# 开启binlog日志
log_bin = mysql-bin
binlog_format = ROW
server_id = 1
expire_logs_days = 30 #超过30天的binlog删除

# 慢日志
slow_query_log = 1
slow_query_log_file = /var/log/mysql/mysql-slow.log
long_query_time = 2 #慢查询时间 超过2秒则为慢查询

# 最大连接数
max_connections = 1000

# 最大长度
group_concat_max_len = 102400

# 设置时区
default_time_zone = '+8:00'

# 内存优化
innodb_buffer_pool_size = 60G
innodb_buffer_pool_instances = 80
innodb_log_file_size = 1G 
innodb_log_buffer_size = 16M
innodb_io_capacity = 2000
innodb_io_capacity_max = 4000
innodb_read_io_threads = 8
innodb_write_io_threads = 8

table_open_cache = 10000
table_definition_cache = 10000

tmp_table_size = 1G
max_heap_table_size = 1G

innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

wait_timeout = 28800


```
