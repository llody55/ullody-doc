# 基于Docker在arm64机器上快速搭建openvpn

## 部署

### 拉取镜像

```bash
docker pull ixdotai/openvpn:latest
```

> 此项目是[kylemanna/docker-openvpn](https://github.com/kylemanna/docker-openvpn)的一个分支
>
> 本次安装服务器的IP：110.40.239.50

### 创建持久化目录

```bash
mkdir /data/openvpn/
```

> 初始化将保存配置文件的容器 和证书。容器将提示输入密码以保护 新生成的证书颁发机构使用的私钥。/data/openvpn/

### 创建证书

```bash
docker run  -v /lgdata/openvpn/:/etc/openvpn --rm ixdotai/openvpn ovpn_genconfig -u tcp://110.40.239.50
docker run -v /lgdata/openvpn/:/etc/openvpn --rm -it ixdotai/openvpn ovpn_initpki
```

> 为了连接文档性，本次使用TCP连接，流量大可以使用UDP

### 启动OpenVPN服务器进程

```bash
docker run -d --name openvpn-server -v /data/openvpn/:/etc/openvpn -p 1194:1194/tcp --cap-add=NET_ADMIN --restart=always ixdotai/openvpn
```

### 生成不带密码的客户端证书

```bash
docker run -v /data/openvpn/:/etc/openvpn --rm -it ixdotai/openvpn easyrsa build-client-full llody nopass
```

> 其中的llody可以换成自己的用户名

### 导出证书给客户端使用

```
docker run -v /data/openvpn/:/etc/openvpn --log-driver=none --rm ixdotai/openvpn ovpn_getclient llody > llody.ovpn
```

> 执行完成后，在当前目录下面会出现文件llody.ovpn

### 接下来，可以通过 OpenVPN 客户端来连接到服务器。

### 参考地址

> https://hub.docker.com/r/ixdotai/openvpn

## 创建用户脚本

```bash
#!/bin/bash
# @Author: llody
# @Date:   2022-5-5
# @Last Modified by:   llody
# @Last Modified time: 2022-5-5
# @E-mail: llody_55@163.com
read -p "新增的名字: " NAME
docker run -v /data/openvpn/:/etc/openvpn --rm -it kylemanna/openvpn easyrsa build-client-full $NAME nopass
docker run -v /data/openvpn/:/etc/openvpn --rm kylemanna/openvpn ovpn_getclient $NAME > /root/"$NAME".ovpn
docker restart openvpn-server
```

## 删除用户脚本

```bash
#!/bin/bash
# @Author: llody
# @Date:   2022-5-5
# @Last Modified by:   llody
# @Last Modified time: 2022-5-5
# @E-mail: llody_55@163.com
read -p "删除的用户名字: " DNAME
docker run -v /data/openvpn/:/etc/openvpn --rm -it --rm -it kylemanna/openvpn easyrsa revoke $DNAME
docker run -v /data/openvpn/:/etc/openvpn --rm -it kylemanna/openvpn easyrsa gen-crl
docker run -v /data/openvpn/:/etc/openvpn --rm -it kylemanna/openvpn rm -f /etc/openvpn/pki/reqs/"$DNAME".req
docker run -v /data/openvpn/:/etc/openvpn --rm -it kylemanna/openvpn rm -f /etc/openvpn/pki/private/"$DNAME".key
docker run -v /data/openvpn/:/etc/openvpn --rm -it kylemanna/openvpn rm -f /etc/openvpn/pki/issued/"$DNAME".crt
docker restart openvpn-server

```
