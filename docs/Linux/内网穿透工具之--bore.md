## 什么是bore?

> Rust 中一种现代、简单的 TCP 隧道，它绕过标准 NAT 连接防火墙，将本地端口公开给远程服务器。**这就是它所做的一切：不多也不少。**

## 安装

### Linux 安装

```bash
wget https://github.com/ekzhang/bore/releases/download/v0.5.0/bore-v0.5.0-x86_64-unknown-linux-musl.tar.gz
```

### widnows 安装

```bash
wget https://github.com/ekzhang/bore/releases/download/v0.5.0/bore-v0.5.0-x86_64-pc-windows-msvc.zip
```

### macOS 安装

```bash
brew install bore-cli
或者
wget https://github.com/ekzhang/bore/releases/download/v0.5.0/bore-v0.5.0-x86_64-apple-darwin.tar.gz
```

## 详细用法

### 服务端

```bash
[root@dockui ~]# hostname -i
fe80::de97:8d40:79f8:9918%ens33 192.168.3.224 172.17.0.1
[root@dockui ~]# tar xf bore-v0.5.0-x86_64-unknown-linux-musl.tar.gz 
[root@dockui ~]# ./bore server
2024-05-04T10:22:55.699068Z  INFO bore_cli::server: server listening addr=0.0.0.0:7835
2024-05-04T10:23:40.963425Z  INFO control{addr=192.168.3.220:59886}: bore_cli::server: incoming connection
2024-05-04T10:23:40.963675Z  INFO control{addr=192.168.3.220:59886}: bore_cli::server: new client port=9654
2024-05-04T10:24:49.399381Z  INFO control{addr=192.168.3.220:59886}: bore_cli::server: new connection addr=192.168.3.8:2245 port=9654
2024-05-04T10:24:49.401403Z  INFO control{addr=192.168.3.220:59888}: bore_cli::server: incoming connection
2024-05-04T10:24:49.401474Z  INFO control{addr=192.168.3.220:59888}: bore_cli::server: forwarding connection id=c1cfa677-4a38-47e5-a81a-162707ed4e95
```

> 服务端启动时因为是随机端口，可以限制端口范围，示例如下：
>
> ```
> ./bore server --min-port 8081 --max-port 8082
> ```

### 客户端

```bash
[root@mysql ~]# hostname -i
fe80::909d:7cd6:713f:b235%ens33 192.168.3.220
[root@mysql ~]# tar xf bore-v0.5.0-x86_64-unknown-linux-musl.tar.gz 
[root@mysql ~]# ./bore local 22 --to 192.168.3.224
2024-05-04T10:23:39.068766Z  INFO bore_cli::client: connected to server remote_port=9654
2024-05-04T10:23:39.068798Z  INFO bore_cli::client: listening at 192.168.3.224:9654
2024-05-04T10:24:49.399454Z  INFO proxy{id=c1cfa677-4a38-47e5-a81a-162707ed4e95}: bore_cli::client: new connection
```

> 参数说明
>
> * local： 必须参数，表示本地主机需要转发的端口
> * --to：必选参数，表示连接的服务端地址，我这里测试是将3.220的22端口转发给服务端3.224，服务端给出了一个随机端口9654

### 验证

```bash
Administrator@DESKTOP-SRV4P6O MINGW64 ~/Desktop
$ ssh -p 9654 root@192.168.3.224
The authenticity of host '[192.168.3.224]:9654 ([192.168.3.224]:9654)' can't be established.
ECDSA key fingerprint is SHA256:SJFFpkF3CtqPojr2TODbunMYPRTWOQjJt1Jg/N0wQD0.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '[192.168.3.224]:9654' (ECDSA) to the list of known hosts.
root@192.168.3.224's password:
Last login: Sat May  4 17:48:52 2024 from 192.168.3.8

[root@mysql ~]# ifconfig
ens33: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.3.220  netmask 255.255.255.0  broadcast 192.168.3.255
        inet6 fe80::909d:7cd6:713f:b235  prefixlen 64  scopeid 0x20<link>
        ether 00:0c:29:2d:5f:49  txqueuelen 1000  (Ethernet)
        RX packets 82135  bytes 101776350 (97.0 MiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 33615  bytes 10620933 (10.1 MiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1  (Local Loopback)
        RX packets 379  bytes 1603999 (1.5 MiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 379  bytes 1603999 (1.5 MiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0


[root@mysql ~]# hostname -i
fe80::909d:7cd6:713f:b235%ens33 192.168.3.220

```

## docker一键启用

### 服务端

```bash
# docker run -it --rm --network host docker.llody.cn/ekzhang/bore server
Unable to find image 'docker.llody.cn/ekzhang/bore:latest' locally
latest: Pulling from ekzhang/bore
Digest: sha256:9ba69617a996503488c07082742e5c2691b7c4615eef3146b23e8be4d6fc09b9
Status: Downloaded newer image for docker.llody.cn/ekzhang/bore:latest
2024-10-25T02:12:02.876554Z  INFO bore_cli::server: server listening addr=0.0.0.0:7835
```

> 将**7835**暴露到公网，以便于客户端连接

### 服务端

```bash
docker run -it --rm --network host docker.llody.cn/ekzhang/bore local 本地端口 --to 公网IP
# 示例
docker run -it --rm --network host docker.llody.cn/ekzhang/bore local 3306 --to 222.12.0.1  
```

> 连接成功会返回一个公网访问的IP和端口，这样就将3306端口穿透到了公网进行访问，绕过了防火墙。

## 传送门地址

```bash
https://github.com/ekzhang/bore
```
