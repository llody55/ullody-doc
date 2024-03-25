## Docker开启API和TLS认证

### dockers API常见端口包含

```bash
2375 未加密 docker socket，远程访问无密码，外网环境或者生产环境不建议开启
2376 tls 加密套接字，通过 CA 证书进行认证
2377 集群模式套接字，用于集群管理器
5000 docker 注册服务
4789 覆盖网络
7946 集群节点之间通讯
```

### 创建cert.sh脚本

```bash
#!/bin/bash
###
 # @Author: 745719408@qq.com 745719408@qq.com
 # @Date: 2023-11-21 16:33:55
 # @LastEditors: 745719408@qq.com 745719408@qq.com
 # @LastEditTime: 2023-11-21 18:01:24
 # @FilePath: \K8S\组件包\脚本\python操作应用\python操作docker\certs.sh
 # @Description: 给docker的TLS生成证书--最终版
### 

#相关配置信息:
SERVER=${HOSTNAME}
CERT_DIR='/etc/docker/cert'
CA_SRL_FILE="${CERT_DIR}/ca.srl"
CA_KEY_FILE="${CERT_DIR}/ca-key.pem"
CA_CERT_FILE="${CERT_DIR}/ca.pem"
SERVER_KEY_FILE="${CERT_DIR}/server-key.pem"
SERVER_CSR_FILE="${CERT_DIR}/server.csr"
SERVER_CERT_FILE="${CERT_DIR}/server-cert.pem"
SERVER_CN="*"
PASSWORD="llody_55@163"
COUNTRY="CN"
STATE="CD"
CITY="CD"
ORGANIZATION="llody"
ORGANIZATIONAL_UNIT="llody"
EMAIL="llody_55@163.com"
IPADDRESS="192.168.111.131"

###开始生成文件###
echo "开始生成文件"

#切换到生产密钥的目录，如果不存在则创建
mkdir -p "$CERT_DIR"
cd "$CERT_DIR"

# 生成CA私钥
echo "01" | sudo tee "$CA_SRL_FILE"
sudo openssl genrsa -des3 -passout pass:"$PASSWORD" -out "$CA_KEY_FILE" 2048

# 生成CA证书，填写配置信息
echo "生成CA证书..."
sudo openssl req -new -x509 -days 3650 -key "$CA_KEY_FILE" -out "$CA_CERT_FILE" -passin pass:"$PASSWORD" -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORGANIZATION/OU=$ORGANIZATIONAL_UNIT/CN=$SERVER/emailAddress=$EMAIL"

# 创建服务器密钥
echo "创建服务器密钥..."
sudo openssl genrsa -des3 -passout pass:"$PASSWORD" -out "$SERVER_KEY_FILE" 2048

# 创建服务器证书签名请求（CSR）
echo "创建服务器证书签名请求（CSR）..."
sudo openssl req -new -key "$SERVER_KEY_FILE" -out "$SERVER_CSR_FILE" -subj "/CN=$SERVER" -passin pass:"$PASSWORD"

# 设置IP条目
# echo subjectAltName = DNS:$HOSTNAME,IP:$IPADDRESS,IP:192.168.111.130,IP:127.0.0.1 > extfile.cnf
# echo extendedKeyUsage = serverAuth >> extfile.cnf 

# 用CSR签名并生成服务器证书
echo "用CSR签名并生成服务器证书..."
# sudo openssl x509 -req -days 3650 -in "$SERVER_CSR_FILE" -CA "$CA_CERT_FILE" -CAkey "$CA_KEY_FILE" -CAcreateserial -out "$SERVER_CERT_FILE" -passin pass:"$PASSWORD" -extfile extfile.cnf
sudo openssl x509 -req -days 3650 -in "$SERVER_CSR_FILE" -CA "$CA_CERT_FILE" -CAkey "$CA_KEY_FILE" -CAcreateserial -out "$SERVER_CERT_FILE" -passin pass:"$PASSWORD"

# 清除服务器密钥的密码
echo "清除服务器密钥的密码..."
sudo openssl rsa -in "$SERVER_KEY_FILE" -out "$SERVER_KEY_FILE" -passin pass:"$PASSWORD"

# 给证书授权
echo "设置证书文件的权限..."
sudo chmod 0600 "$CERT_DIR"/*

echo "证书生成和授权完成。"

```

### 使用cert.sh脚本生成证书

```bash
chmod +x cert.sh
sh cert.sh

#注意脚本中需要修改的地方，passwd,email,ipaddress
# 其中IP地址中，建议把用到的地址都加上。
# IP条目用于限制可连接的IP地址
```

### 修改docker运行文件并添加证书地址

```bash
#方法1
vim /lib/systemd/system/docker.service
ExecStart=/usr/bin/dockerd -H tcp://0.0.0.0:5555 -H unix:///var/run/docker.sock --tlsverify --tlscacert=/etc/docker/cert/ca.pem --tlscert=/etc/docker/cert/server-cert.pem --tlskey=/etc/docker/cert/server-key.pem

#方法2
vim /lib/systemd/system/docker.service
ExecStart=/usr/bin/dockerd -H tcp://0.0.0.0:5555 -H unix:///var/run/docker.sock

vim /etc/docker/daemon.json
{
  "tls": true,
  "tlsverify": true,
  "tlscacert": "/etc/docker/cert/ca.pem",
  "tlscert": "/etc/docker/cert/server-cert.pem",
  "tlskey": "/etc/docker/cert/server-key.pem"
}

#解释
tls：启用 TLS。
tlsverify：要求客户端使用有效的证书进行认证。
tlscacert：指定 CA 证书的路径。
tlscert：指定服务器证书的路径。
tlskey：指定服务器私钥的路径。

```

### 重启docker服务

```bash
systemctl daemon-reload
systemctl restart docker
systemctl status docker
```

### 其他安装Docker的主机进行验证

```bash
【验证不使用证书】
docker -H 192.168.1.235:5555  ps
docker -H 192.168.1.235:5555 --tlsverify ps
报错：could not read CA certificate "/root/.docker/ca.pem": open /root/.docker/ca.pem: no such file or directory
【使用证书验证】
拷贝证书：
cp /etc/docker/cert/*.pem ~/.docker/
成功执行：
docker -H 192.168.1.235:5555 --tlsverify ps
如果不拷贝证书到~/.docker/,可以在命令中指定证书位置：
docker -H 192.168.1.235:5555 --tlsverify --tlscacert=/etc/docker/cert/ca.pem --tlscert=/etc/docker/cert/server-cert.pem --tlskey=/etc/docker/cert/server-key.pem ps


```

> 如果配置了IP条目，需在IP条目填写的IP主机上进行测试

### 脚本验证

```python
'''
Author: 745719408@qq.com 745719408@qq.com
Date: 2023-11-21 09:58:52
LastEditors: 745719408@qq.com 745719408@qq.com
LastEditTime: 2023-11-21 10:24:52
FilePath: \K8S\组件包\脚本\python操作应用\python操作docker\py_tls_docker.py
Description: python连接开了tls的docker认证示例
'''
import docker
import certifi
from docker.tls import TLSConfig

# Docker守护程序的地址和TLS证书的位置
DOCKER_HOST = '192.168.1.235:5555'
CA_CERT = '/root/.docker/ca.pem'
CLIENT_CERT = '/root/.docker/server-cert.pem'
CLIENT_KEY = '/root/.docker/server-key.pem'

# 创建TLS配置
tls_config = TLSConfig(
    client_cert=(CLIENT_CERT, CLIENT_KEY),
    ca_cert=CA_CERT,
    verify=False
)

# 创建一个Docker客户端
client = docker.DockerClient(base_url='https://{}'.format(DOCKER_HOST), tls=tls_config)

# 列出所有容器
containers = client.containers.list(all=True)

# 打印容器信息
for container in containers:
    print(container.id)

```
