## 端口探测-nc命令

### 安装

```
yum install -y nmap-ncat
```

### TCP端口探测

```
nc -vz -w 2 10.0.1.161 9999 # -v 可视化，-z 扫描时不发送数据，-w 超时几秒
```

### 扫描多个端口

```
nc -vz -w 2 10.0.1.161 9998-9999
```

### UDP端口探测

```
nc -vuz 10.0.1.161 9998  # u 表示 udp 端口，v 表示可视化输出，z 表示扫描时不发送数据
```

### UDP端口探测扫描大量端口

```
nc -vuz 10.0.1.161 1-1000
```

![](https://static.llody.top/images/202403231945801.png)
