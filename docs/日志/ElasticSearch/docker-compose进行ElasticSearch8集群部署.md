## 环境规划

| 主机IP          | 系统               | ES版本               | CPU架构 | 用户名  | 密码         |
| --------------- | ------------------ | -------------------- | ------- | ------- | ------------ |
| 192.168.174.18  | Ubuntu 22.04.4 LTS | elasticsearch:8.10.4 | ARM64   | elastic | llodyi4TMmZD |
| 192.168.174.218 | Ubuntu 22.04.4 LTS | elasticsearch:8.10.4 | ARM64   |         |              |
| 192.168.174.112 | Ubuntu 22.04.4 LTS | elasticsearch:8.10.4 | ARM64   |         |              |

## 概念：

> node节点：master、data、client
> 默认情况下，ES集群节点都是混合节点，即在elasticsearch.yml中默认node.master: true和node.data: true
>
> master节点数量至少保证3个，不然主节点宕机时，可能无法选举出master节点
> shard切片数量：与data数据节点数量成正比，但不宜超过data节点数量，索引一旦创建，shard值不可改变
>
> replicas副本数量：其值越大搜索效率越高，但写入性能越低（一条数据写入操作需要做（1+replicas）遍）具体值与集群data节点数量相关，不宜超过【data节点数-1】
>
> master - 主节点：
> master节点数量至少保证3个
> 主要功能：维护元数据，管理集群节点状态；不负责数据写入和查询。
> 配置要点：内存可以相对小一些，但是机器一定要稳定，最好是独占的机器。
> elasticsearch.yml配置如下 :
> node.roles: ["master"]
>
> data - 数据节点：
> 主要功能：负责数据的写入与查询，压力大。
> 配置要点：大内存，最好是独占的机器。
> elasticsearch.yml 配置如下:
> node.roles: ["data"]
>
> client - 客户端节点：
> 主要功能：负责任务分发和结果汇聚，分担数据节点压力。
> 配置要点：大内存，最好是独占的机器
> elasticsearch.yml配置如下 :
> node.roles: ["ingest"]
>
> mixed- 混合节点：
> 既是主节点，又是数据节点，服务器数量不充足的情况下，也只能考虑这种节点配置
> elasticsearch.yml 配置如下:
> node.roles: ["master", "data"]

## ES集群部署

### 创建持久化目录(所有节点)

```bash
mkdir -p  /data/es/{data,conf,logs,plugins}
```

### 创建**elasticsearch.yml**配置文件详解

```yaml
#集群名称 所有节点名称一致
cluster.name: es-clusters

#当前该节点的名称，每个节点不能重复es-node-1,es-node-2,es-node-3
node.name: es-node-1

# 当前该节点的角色
node.roles: ["master", "data"]

#设置为公开访问
network.host: 0.0.0.0

#设置其它节点和该节点交互的本机器的ip地址,三台各自为
network.publish_host: 192.168.174.18

# 设置映射端口
http.port: 9200

# 内部节点之间沟通端口
transport.port: 9300

# 支持跨域访问
http.host: 0.0.0.0
http.cors.enabled: true
http.cors.allow-origin: "*"
http.cors.allow-headers: Authorization

#开启xpack安全认证
xpack.security.enabled: true
xpack.security.transport.ssl.enabled: true
xpack.security.transport.ssl.keystore.type: PKCS12
xpack.security.transport.ssl.verification_mode: certificate
xpack.security.transport.ssl.keystore.path: elastic-certificates.p12
xpack.security.transport.ssl.truststore.path: elastic-certificates.p12
xpack.security.transport.ssl.truststore.type: PKCS12
xpack.security.transport.ssl.keystore.password: llodyi4TMmZD
xpack.security.transport.ssl.truststore.password: llodyi4TMmZD

# HTTP 层的 SSL 配置
xpack.security.http.ssl:
  enabled: true
  keystore.path: elastic-certificates.p12
  keystore.password: llodyi4TMmZD
  truststore.path: elastic-certificates.p12
  truststore.password: llodyi4TMmZD

#配置集群的主机地址
discovery.seed_hosts: ["192.168.174.18", "192.168.174.218", "192.168.174.112"]
#初始主节点，使用一组初始的符合主条件的节点引导集群
cluster.initial_master_nodes: ["es-node-1", "es-node-2","es-node-3"]
#节点等待响应的时间，默认值是30秒,增加这个值，从一定程度上会减少误判导致脑裂
#discovery.zen.ping_timeout: 30s

#配置集群最少主节点数目，通常为 (可成为主节点的主机数目 / 2) + 1
#discovery.zen.minimum_master_nodes: 2
#配置集群最少正常工作节点数
#gateway.recover_after_nodes: 2

#禁用交换内存，提升效率
bootstrap.memory_lock: true
```

> 需要修改的地方：
>
> * node.name  节点名称，不能重复
> * node.roles 节点角色，执行决定
> * network.publish_host 当前节点的主机IP，需要用于与其他节点通信，尽量不使用容器IP,因为跨节点无法通信。
> * xpack.security.transport.ssl.keystore.password  keystore密码，在创建elastic-certificates.p12加密文件时设置。
> * xpack.security.transport.ssl.truststore.password truststore密码，在创建elastic-certificates.p12加密文件时设置。

#### es-node-1

```bash
vim /data/es/conf/elasticsearch.yml
```

```yaml
#集群名称 所有节点名称一致
cluster.name: es-clusters

#当前该节点的名称，每个节点不能重复es-node-1,es-node-2,es-node-3
node.name: es-node-1

# 当前该节点的角色
node.roles: ["master", "data"]

#设置为公开访问
network.host: 0.0.0.0

#设置其它节点和该节点交互的本机器的ip地址,三台各自为
network.publish_host: 192.168.174.18

# 设置映射端口
http.port: 9200

# 内部节点之间沟通端口
transport.port: 9300

# 支持跨域访问
http.host: 0.0.0.0
http.cors.enabled: true
http.cors.allow-origin: "*"
http.cors.allow-headers: Authorization

#开启xpack安全认证
xpack.security.enabled: true
# 启用xpack.security才能创建注册令牌
xpack.security.enrollment.enabled: true
# 启用xpack.security.transport.ssl才能使用xpack.security
xpack.security.transport.ssl.enabled: true
xpack.security.transport.ssl.keystore.type: PKCS12
xpack.security.transport.ssl.verification_mode: certificate
xpack.security.transport.ssl.keystore.path: elastic-certificates.p12
xpack.security.transport.ssl.truststore.path: elastic-certificates.p12
xpack.security.transport.ssl.truststore.type: PKCS12
xpack.security.transport.ssl.keystore.password: llodyi4TMmZD
xpack.security.transport.ssl.truststore.password: llodyi4TMmZD

# HTTP 层的 SSL 配置
xpack.security.http.ssl:
  enabled: true
  keystore.path: elastic-certificates.p12
  keystore.password: llodyi4TMmZD
  truststore.path: elastic-certificates.p12
  truststore.password: llodyi4TMmZD

#配置集群的主机地址
discovery.seed_hosts: ["192.168.174.18", "192.168.174.218", "192.168.174.112"]
#初始主节点，使用一组初始的符合主条件的节点引导集群
cluster.initial_master_nodes: ["es-node-1", "es-node-2","es-node-3"]
#节点等待响应的时间，默认值是30秒,增加这个值，从一定程度上会减少误判导致脑裂
#discovery.zen.ping_timeout: 30s

#配置集群最少主节点数目，通常为 (可成为主节点的主机数目 / 2) + 1
#discovery.zen.minimum_master_nodes: 2
#配置集群最少正常工作节点数
#gateway.recover_after_nodes: 2

#禁用交换内存，提升效率
bootstrap.memory_lock: true
```

#### es-node-2

```bash
vim /data/es/conf/elasticsearch.yml
```

```yaml
#集群名称 所有节点名称一致
cluster.name: es-clusters

#当前该节点的名称，每个节点不能重复es-node-1,es-node-2,es-node-3
node.name: es-node-2

# 当前该节点的角色
node.roles: ["master", "data"]

#设置为公开访问
network.host: 0.0.0.0

#设置其它节点和该节点交互的本机器的ip地址,三台各自为
network.publish_host: 192.168.174.218

# 设置映射端口
http.port: 9200

# 内部节点之间沟通端口
transport.port: 9300

# 支持跨域访问
http.host: 0.0.0.0
http.cors.enabled: true
http.cors.allow-origin: "*"
http.cors.allow-headers: Authorization

#开启xpack安全认证
xpack.security.enabled: true
# 启用xpack.security才能创建注册令牌
xpack.security.enrollment.enabled: true
# 启用xpack.security.transport.ssl才能使用xpack.security
xpack.security.transport.ssl.enabled: true
xpack.security.transport.ssl.keystore.type: PKCS12
xpack.security.transport.ssl.verification_mode: certificate
xpack.security.transport.ssl.keystore.path: elastic-certificates.p12
xpack.security.transport.ssl.truststore.path: elastic-certificates.p12
xpack.security.transport.ssl.truststore.type: PKCS12
xpack.security.transport.ssl.keystore.password: llodyi4TMmZD
xpack.security.transport.ssl.truststore.password: llodyi4TMmZD

# HTTP 层的 SSL 配置
xpack.security.http.ssl:
  enabled: true
  keystore.path: elastic-certificates.p12
  keystore.password: llodyi4TMmZD
  truststore.path: elastic-certificates.p12
  truststore.password: llodyi4TMmZD

#配置集群的主机地址
discovery.seed_hosts: ["192.168.174.18", "192.168.174.218", "192.168.174.112"]
#初始主节点，使用一组初始的符合主条件的节点引导集群
cluster.initial_master_nodes: ["es-node-1", "es-node-2","es-node-3"]
#节点等待响应的时间，默认值是30秒,增加这个值，从一定程度上会减少误判导致脑裂
#discovery.zen.ping_timeout: 30s

#配置集群最少主节点数目，通常为 (可成为主节点的主机数目 / 2) + 1
#discovery.zen.minimum_master_nodes: 2
#配置集群最少正常工作节点数
#gateway.recover_after_nodes: 2

#禁用交换内存，提升效率
bootstrap.memory_lock: true
```

#### es-node-3

```bash
vim /data/es/conf/elasticsearch.yml
```

```yaml
#集群名称 所有节点名称一致
cluster.name: es-clusters

#当前该节点的名称，每个节点不能重复es-node-1,es-node-2,es-node-3
node.name: es-node-3

# 当前该节点的角色
node.roles: ["master", "data"]

#设置为公开访问
network.host: 0.0.0.0

#设置其它节点和该节点交互的本机器的ip地址,三台各自为
network.publish_host: 192.168.174.112

# 设置映射端口
http.port: 9200

# 内部节点之间沟通端口
transport.port: 9300

# 支持跨域访问
http.host: 0.0.0.0
http.cors.enabled: true
http.cors.allow-origin: "*"
http.cors.allow-headers: Authorization

#开启xpack安全认证
xpack.security.enabled: true
# 启用xpack.security才能创建注册令牌
xpack.security.enrollment.enabled: true
# 启用xpack.security.transport.ssl才能使用xpack.security
xpack.security.transport.ssl.enabled: true
xpack.security.transport.ssl.keystore.type: PKCS12
xpack.security.transport.ssl.verification_mode: certificate
xpack.security.transport.ssl.keystore.path: elastic-certificates.p12
xpack.security.transport.ssl.truststore.path: elastic-certificates.p12
xpack.security.transport.ssl.truststore.type: PKCS12
xpack.security.transport.ssl.keystore.password: llodyi4TMmZD
xpack.security.transport.ssl.truststore.password: llodyi4TMmZD

# HTTP 层的 SSL 配置
xpack.security.http.ssl:
  enabled: true
  keystore.path: elastic-certificates.p12
  keystore.password: llodyi4TMmZD
  truststore.path: elastic-certificates.p12
  truststore.password: llodyi4TMmZD

#配置集群的主机地址
discovery.seed_hosts: ["192.168.174.18", "192.168.174.218", "192.168.174.112"]
#初始主节点，使用一组初始的符合主条件的节点引导集群
cluster.initial_master_nodes: ["es-node-1", "es-node-2","es-node-3"]
#节点等待响应的时间，默认值是30秒,增加这个值，从一定程度上会减少误判导致脑裂
#discovery.zen.ping_timeout: 30s

#配置集群最少主节点数目，通常为 (可成为主节点的主机数目 / 2) + 1
#discovery.zen.minimum_master_nodes: 2
#配置集群最少正常工作节点数
#gateway.recover_after_nodes: 2

#禁用交换内存，提升效率
bootstrap.memory_lock: true
```

### 服务器优化/配置(所有节点)

```bash
#提高进程及资源使用限制上线
vim /etc/security/limits.conf

* soft nofile 65536
* hard nofile 65536
* soft nproc 32000
* hard nproc 32000
* hard memlock unlimited
* soft memlock unlimited

vim /etc/systemd/system.conf

DefaultLimitNOFILE=65536
DefaultLimitNPROC=32000
DefaultLimitMEMLOCK=infinity

#重载配置文件
systemctl daemon-reload
systemctl daemon-reexec 

#修改虚拟内存最大映射数
vim /etc/sysctl.conf

#添加参数
vm.max_map_count = 262144

#重新加载/etc/sysctl.conf配置
sysctl -p

```

### 创建证书elastic-certificates.p12文件

```bash
# 首先运行ES示例
root@rabbitmq-1-18:~# docker run -itd --name es-node-1  elasticsearch:8.10.4  /bin/bash
# 进入node1容器
root@rabbitmq-1-18:~# docker exec -it es-node-1 /bin/bash
# 生成CA文件，并输出到/tmp目录下
elasticsearch@f18f0742da3a:~$ /usr/share/elasticsearch/bin/elasticsearch-certutil ca --out /tmp/elastic-stack-ca.p12
This tool assists you in the generation of X.509 certificates and certificate
signing requests for use with SSL/TLS in the Elastic stack.

The 'ca' mode generates a new 'certificate authority'
This will create a new X.509 certificate and private key that can be used
to sign certificate when running in 'cert' mode.

Use the 'ca-dn' option if you wish to configure the 'distinguished name'
of the certificate authority

By default the 'ca' mode produces a single PKCS#12 output file which holds:
    * The CA certificate
    * The CA's private key

If you elect to generate PEM format certificates (the -pem option), then the output will
be a zip file containing individual files for the CA certificate and private key

# 输入密码，例如：123456
Enter password for elastic-stack-ca.p12 : 
# 指定/tmp目录的ca文件，生成证书文件到/tmp目录下，这里指定了可以使用证书的节点，如果有新增节点，需要重新生成并同步到其他节点。
elasticsearch@f18f0742da3a:~$ /usr/share/elasticsearch/bin/elasticsearch-certutil cert --ca /tmp/elastic-stack-ca.p12 --dns es-node-1,es-node-2,es-node-3 --ip 192.168.174.18,192.168.174.218,192.168.174.112 --out /tmp/elastic-certificates.p12
This tool assists you in the generation of X.509 certificates and certificate
signing requests for use with SSL/TLS in the Elastic stack.

The 'cert' mode generates X.509 certificate and private keys.
    * By default, this generates a single certificate and key for use
       on a single instance.
    * The '-multiple' option will prompt you to enter details for multiple
       instances and will generate a certificate and key for each one
    * The '-in' option allows for the certificate generation to be automated by describing
       the details of each instance in a YAML file

    * An instance is any piece of the Elastic Stack that requires an SSL certificate.
      Depending on your configuration, Elasticsearch, Logstash, Kibana, and Beats
      may all require a certificate and private key.
    * The minimum required value for each instance is a name. This can simply be the
      hostname, which will be used as the Common Name of the certificate. A full
      distinguished name may also be used.
    * A filename value may be required for each instance. This is necessary when the
      name would result in an invalid file or directory name. The name provided here
      is used as the directory name (within the zip) and the prefix for the key and
      certificate files. The filename is required if you are prompted and the name
      is not displayed in the prompt.
    * IP addresses and DNS names are optional. Multiple values can be specified as a
      comma separated string. If no IP addresses or DNS names are provided, you may
      disable hostname verification in your SSL configuration.


    * All certificates generated by this tool will be signed by a certificate authority (CA)
      unless the --self-signed command line option is specified.
      The tool can automatically generate a new CA for you, or you can provide your own with
      the --ca or --ca-cert command line options.


By default the 'cert' mode produces a single PKCS#12 output file which holds:
    * The instance certificate
    * The private key for the instance certificate
    * The CA certificate

If you specify any of the following options:
    * -pem (PEM formatted output)
    * -multiple (generate multiple certificates)
    * -in (generate certificates from an input file)
then the output will be be a zip file containing individual certificate/key files

# 输入CA的密码
Enter password for CA (/tmp/elastic-stack-ca.p12) : 
# 输入证书文件的密码
Enter password for elastic-certificates.p12 : 

Certificates written to /tmp/elastic-certificates.p12

This file should be properly secured as it contains the private key for 
your instance.
This file is a self contained file and can be copied and used 'as is'
For each Elastic product that you wish to configure, you should copy
this '.p12' file to the relevant configuration directory
and then follow the SSL configuration instructions in the product guide.

For client applications, you may only need to copy the CA certificate and
configure the client to trust this certificate.
# 生成后的证书与CA文件
elasticsearch@f18f0742da3a:~$ ls /tmp/
elastic-certificates.p12  elasticsearch-13473260200918243729  elasticsearch-641831696962769774   elasticsearch-9157611881811365698
elastic-stack-ca.p12      elasticsearch-18321848440285978544  elasticsearch-8563172779946024729  hsperfdata_elasticsearch
elasticsearch@f18f0742da3a:~$ exit
exit
# 将证书拷贝出来，准备分发到其他节点
root@rabbitmq-1-18:~# docker cp es-node-1:/tmp/elastic-certificates.p12 .
Successfully copied 5.63kB to /root/.
# 清理es-node-1容器
root@rabbitmq-1-18:~# docker rm -f es-node-1

```

### 拷贝加密文件到conf下(分发到所有节点)

```bash
cp elastic-certificates.p12 /lgdata/es/conf/
```

### 数据目录授权

```bash
# 数据目录授权
chown -R 1000:1000 /data/es/data
chown -R 1000:1000 /data/es/logs
chown -R 1000:1000 /data/es/plugins
chmod -R 755 /data/es/data/
chmod -R 755 /data/es/logs/
chmod -R 755 /data/es/plugins/
# 加密文件授权
chown 1000:1000 /data/es/conf/elastic-certificates.p12
chmod 600 /data/es/conf/elastic-certificates.p12

```

### 关闭swap内存

```bash
swapoff -a
sed -i '/swap/s/^/#/' /etc/fstab
```

### 启动ElasticSearch集群

#### es-node-1

```bash
# 创建运维目录
mkdir /root/shell
# 创建es-node-1文件
vim /root/shell/es-node-1.yml
```

```yaml
version: '3'

services:
  es-node-1:
    image: elasticsearch:8.10.4
    container_name: es-node-1
    restart: always
    ports:
      - "9200:9200"
      - "9300:9300"
    environment:
      - ES_JAVA_OPTS=-Xms16g -Xmx16g
      - bootstrap.memory_lock=true
    user: "1000:1000"
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - /data/es/conf/elasticsearch.yml:/usr/share/elasticsearch/config/elasticsearch.yml
      - /data/es/data/:/usr/share/elasticsearch/data
      - /data/es/logs/:/usr/share/elasticsearch/logs
      - /data/es/plugins/:/usr/share/elasticsearch/plugins
      - /data/es/conf/elastic-certificates.p12:/usr/share/elasticsearch/config/elastic-certificates.p12

```

```bash
# es-node-1节点启动
docker-compose -p es -f shell/es-node-1.yml up -d
```

#### es-node-2

```bash
# 创建运维目录
mkdir /root/shell
# 创建ees-node-2文件
vim /root/shell/es-node-2.yml
```

```yaml
version: '3'

services:
  es-node-2:
    image: elasticsearch:8.10.4
    container_name: es-node-2
    restart: always
    ports:
      - "9200:9200"
      - "9300:9300"
    environment:
      - ES_JAVA_OPTS=-Xms16g -Xmx16g
      - bootstrap.memory_lock=true
    user: "1000:1000"
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - /data/es/conf/elasticsearch.yml:/usr/share/elasticsearch/config/elasticsearch.yml
      - /data/es/data/:/usr/share/elasticsearch/data
      - /data/es/logs/:/usr/share/elasticsearch/logs
      - /data/es/plugins/:/usr/share/elasticsearch/plugins
      - /data/es/conf/elastic-certificates.p12:/usr/share/elasticsearch/config/elastic-certificates.p12

```

```bash
# es-node-2节点启动
docker-compose -p es -f shell/es-node-2.yml up -d
```

#### es-node-3

```bash
# 创建运维目录
mkdir /root/shell
# 创建es-node-3文件
vim /root/shell/es-node-3.yml
```

```yaml
version: '3'

services:
  es-node-3:
    image: elasticsearch:8.10.4
    container_name: es-node-3
    restart: always
    ports:
      - "9200:9200"
      - "9300:9300"
    environment:
      - ES_JAVA_OPTS=-Xms16g -Xmx16g
      - bootstrap.memory_lock=true
    user: "1000:1000"
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - /data/es/conf/elasticsearch.yml:/usr/share/elasticsearch/config/elasticsearch.yml
      - /data/es/data/:/usr/share/elasticsearch/data
      - /data/es/logs/:/usr/share/elasticsearch/logs
      - /data/es/plugins/:/usr/share/elasticsearch/plugins
      - /data/es/conf/elastic-certificates.p12:/usr/share/elasticsearch/config/elastic-certificates.p12

```

```bash
# es-node-3节点启动
docker-compose -p es -f shell/es-node-3.yml up -d
```

### 设置密码

```bash
#进入其中一台进行设置
root@rabbitmq-1-18:~# docker exec -it es-node-1 /bin/bash
elasticsearch@f6c8c56bf477:~$ /usr/share/elasticsearch/bin/elasticsearch-setup-passwords interactive -u https://192.168.174.18:9200
06:37:08.153 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="keystore.password" message="[keystore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
06:37:08.159 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="truststore.password" message="[truststore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
06:37:08.165 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="keystore.password" message="[keystore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
06:37:08.166 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="truststore.password" message="[truststore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
06:37:08.810 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="keystore.password" message="[keystore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
06:37:08.811 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="truststore.password" message="[truststore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
06:37:08.813 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="keystore.password" message="[keystore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
06:37:08.813 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="truststore.password" message="[truststore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
******************************************************************************
Note: The 'elasticsearch-setup-passwords' tool has been deprecated. This       command will be removed in a future release.
******************************************************************************

Initiating the setup of passwords for reserved users elastic,apm_system,kibana,kibana_system,logstash_system,beats_system,remote_monitoring_user.
You will be prompted to enter passwords as the process progresses.
Please confirm that you would like to continue [y/N]y

# 填入需要设置的密码
Enter password for [elastic]: 
Reenter password for [elastic]: 
Enter password for [apm_system]: 
Reenter password for [apm_system]: 
Enter password for [kibana_system]: 
Reenter password for [kibana_system]: 
Enter password for [logstash_system]: 
Reenter password for [logstash_system]: 
Enter password for [beats_system]: 
Reenter password for [beats_system]: 
Enter password for [remote_monitoring_user]: 
Reenter password for [remote_monitoring_user]: 
06:37:55.614 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="keystore.password" message="[keystore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
06:37:55.614 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="truststore.password" message="[truststore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
06:37:55.616 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="keystore.password" message="[keystore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
06:37:55.616 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="truststore.password" message="[truststore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
Changed password for user [apm_system]
06:37:57.101 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="keystore.password" message="[keystore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
06:37:57.101 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="truststore.password" message="[truststore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
06:37:57.103 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="keystore.password" message="[keystore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
06:37:57.103 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="truststore.password" message="[truststore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
Changed password for user [kibana_system]
06:37:57.290 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="keystore.password" message="[keystore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
06:37:57.290 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="truststore.password" message="[truststore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
06:37:57.292 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="keystore.password" message="[keystore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
06:37:57.292 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="truststore.password" message="[truststore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
Changed password for user [kibana]
06:37:57.468 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="keystore.password" message="[keystore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
06:37:57.468 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="truststore.password" message="[truststore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
06:37:57.470 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="keystore.password" message="[keystore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
06:37:57.470 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="truststore.password" message="[truststore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
Changed password for user [logstash_system]
06:37:57.647 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="keystore.password" message="[keystore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
06:37:57.647 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="truststore.password" message="[truststore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
06:37:57.648 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="keystore.password" message="[keystore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
06:37:57.649 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="truststore.password" message="[truststore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
Changed password for user [beats_system]
06:37:57.824 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="keystore.password" message="[keystore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
06:37:57.824 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="truststore.password" message="[truststore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
06:37:57.825 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="keystore.password" message="[keystore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
06:37:57.826 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="truststore.password" message="[truststore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
Changed password for user [remote_monitoring_user]
06:37:57.999 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="keystore.password" message="[keystore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
06:37:57.999 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="truststore.password" message="[truststore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
06:37:58.000 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="keystore.password" message="[keystore.password] setting was deprecated in Elasticsearch and will be removed in a future release."
06:37:58.001 [main] WARN  org.elasticsearch.deprecation.common.settings.Settings - data_stream.dataset="deprecation.elasticsearch" data_stream.namespace="default" data_stream.type="logs" elasticsearch.event.category="settings" event.code="truststore.password" message="[truststore.password] setting was deprecated in Elasticsearch and will be removed in a future 
Changed password for user [elastic]

#自定义设置密码
./bin/elasticsearch-setup-passwords interactive
#生成密码
./bin/elasticsearch-setup-passwords auto
```

### 查看状态

```bash
# 集群节点
root@rabbitmq-1-18:~# curl -k  -u elastic:llodyi4TMmZD https://192.168.174.18:9200/_cat/nodes?v   
ip              heap.percent ram.percent cpu load_1m load_5m load_15m node.role master name
192.168.174.112            6          44   0    0.00    0.00     0.00 dm        -      es-node-3
192.168.174.18             4          47   0    0.13    0.08     0.03 dm        *      es-node-1
192.168.174.218            6          44   0    0.00    0.00     0.00 dm        -      es-node-2

# 集群状态
root@rabbitmq-1-18:~# curl -k -u elastic:llodyi4TMmZD https://192.168.174.18:9200/_cat/health?v
epoch      timestamp cluster     status node.total node.data shards pri relo init unassign pending_tasks max_task_wait_time active_shards_percent
1722842322 07:18:42  es-clusters green           3         3      2   1    0    0        0             0                  -                100.0%
```

> Elasticsearch 集群已经成功搭建并且正在正常运行。具体来看：
>
> * **Cluster Status** : `green` 表示集群的状态良好，所有主分片和副本分片都正常分配。
> * **Node Total** : 你的集群中有 3 个节点。
> * **Node Data** : 3 个节点都被标记为数据节点。
> * **Shards** : 总共有 2 个分片，其中 1 个是主分片，没有副本分片 (`relo`, `init`, `unassign` 都是 0)。
> * **Active Shards Percent** : 100.0% 表示所有的分片都已经处于活动状态。

## 部署可视化kibana工具

### 为Kibana生成注册令牌

```bash
root@rabbitmq-1-18:~# curl -X POST "https://192.168.174.18:9200/_security/service/elastic/kibana/credential/token" -u elastic:llodyi4TMmZD -k -H 'Content-Type: application/json'
{"created":true,"token":{"name":"token_F0mBIZEBK8qkrUMde71A","value":"AAEAAWVsYXN0aWMva2liYW5hL3Rva2VuX0YwbUJJWkVCSzhxa3JVTWRlNzFBOlhyWloxQnUtUlVLOXNUWEtuUDNyeXc"}}
```

> 替换IP地址和你的elastic密码信息。

### 创建kibana.yaml文件

```bash
mkdir /lgdata/kibana/
chown 1000 -R /lgdata/kibana/
```

```bash
vim /lgdata/kibana/kibana.yaml
```

```yaml

server.name: kibana
server.host: "0.0.0.0"
server.port: 5601
elasticsearch.hosts: [ "https://192.168.174.18:9200" ]
elasticsearch.requestTimeout: 60000
monitoring.ui.container.elasticsearch.enabled: true
monitoring.ui.ccs.enabled: false
i18n.locale: "zh-CN"
elasticsearch.serviceAccountToken: "AAEAAWVsYXN0aWMva2liYW5hL3Rva2VuX0YwbUJJWkVCSzhxa3JVTWRlNzFBOlhyWloxQnUtUlVLOXNUWEtuUDNyeXc"
elasticsearch.ssl.verificationMode: "none"  # 添加此行以禁用 SSL 验证
xpack.reporting.encryptionKey: "a_random_string"
xpack.security.encryptionKey: "something_at_least_32_characters"

```

### 运行kibana

```bash
docker run -d --restart=always --name kibana -p5601:5601 -v /lgdata/kibana/kibana.yaml:/usr/share/kibana/config/kibana.yml kibana:8.10.4
```

### 访问验证

> 登录kibana http://192.168.174.18:5601，用户名为elasic，密码为之前设置密码。

#### 登录

![1722845600983](https://static.llody.top/ullody-doc/images/1722845600983.png)

#### 集群状态

![1722846240030](https://static.llody.top/ullody-doc/images/1722846240030.png)

#### 部分接口

```bash
#查看集群节点
http://192.168.174.18:9200/_cat/nodes?v
#节点磁盘分配情况
http://192.168.174.18:9200/_cat/allocation?v
#查看ES集群的整体情况
http://192.168.174.18:9200/_cat/health?v
#查看ES集群的索引情况
http://192.168.174.18:9200/_cat/indices?v
#输入ES账户密码

```
