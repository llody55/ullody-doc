## smem内存排查命令

### 安装

```
yum install epel-release
yum install smem
```

### 使用示例

```
[root@VM-0-3-centos ~]# smem -r -t -k | head -n 6
  PID User     Command                         Swap      USS      PSS      RSS 
31722 root     java -Xmx256m -Xms256m org.     9.4M   454.3M   454.3M   454.4M 
 3201 www      /app/gitea/gitea web           29.8M    76.0M    76.0M    76.0M 
 2452 mysql    /www/server/mysql/bin/mysql   346.0M    48.2M    48.6M    51.0M 
 2722 root     /www/server/panel/pyenv/bin    83.9M    46.9M    47.8M    50.5M 
14969 root     /usr/bin/python /usr/bin/sm        0    33.1M    33.3M    34.5M 
```

> 每个字段的含义如下：
>
> * PID: 进程ID
> * User: 进程所属用户
> * Command: 进程的命令
> * Swap: 进程在交换空间中的占用大小
> * USS: 进程独占的内存大小（不包括共享的）
> * PSS: 进程使用的物理内存大小（包括共享的）
> * RSS: 进程实际使用的物理内存大小
