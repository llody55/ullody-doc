## 麒麟V10离线安装Docker

### 系统信息

```bash
[root@node1 ~]# cat /etc/os-release 
NAME="Kylin Linux Advanced Server"
VERSION="V10 (Tercel)"
ID="kylin"
VERSION_ID="V10"
PRETTY_NAME="Kylin Linux Advanced Server V10 (Tercel)"
ANSI_COLOR="0;31"

[root@node1 ~]# uname -a
Linux node1 4.19.90-23.15.v2101.ky10.aarch64 #1 SMP Wed Sep 1 16:42:05 CST 2021 aarch64 aarch64 aarch64 GNU/Linux
```

### 上传离线包

> wget https://download.docker.com/linux/static/stable/aarch64/docker-20.10.7.tgz

### 解压

```bash
tar xf docker-20.10.7.tgz
mv docker/* /usr/bin/
```

### 创建 -- containerd.service

```bash
vim  /usr/lib/systemd/system/containerd.service
```

```bash

[Unit]
Description=containerd container runtime
Documentation=https://containerd.io
After=network.target local-fs.target

[Service]
ExecStartPre=-/sbin/modprobe overlay
ExecStart=/usr/bin/containerd

Type=notify
Delegate=yes
KillMode=process
Restart=always
RestartSec=5
# Having non-zero Limit*s causes performance problems due to accounting overhead
# in the kernel. We recommend using cgroups to do container-local accounting.
LimitNPROC=infinity
LimitCORE=infinity
LimitNOFILE=infinity
# Comment TasksMax if your systemd version does not supports it.
# Only systemd 226 and above support this version.
TasksMax=infinity
OOMScoreAdjust=-999

[Install]
WantedBy=multi-user.target


```

### 创建 -- docker.service

```bash
vim /usr/lib/systemd/system/docker.service
```

```bash

[Unit]
Description=Docker Application Container Engine
Documentation=https://docs.docker.com
After=network-online.target docker.socket firewalld.service containerd.service
Wants=network-online.target
Requires=docker.socket containerd.service

[Service]
Type=notify
# the default is not to use systemd for cgroups because the delegate issues still
# exists and systemd currently does not support the cgroup feature set required
# for containers run by docker
ExecStart=/usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock
ExecReload=/bin/kill -s HUP $MAINPID
TimeoutStartSec=0
RestartSec=2
Restart=always

# Note that StartLimit* options were moved from "Service" to "Unit" in systemd 229.
# Both the old, and new location are accepted by systemd 229 and up, so using the old location
# to make them work for either version of systemd.
StartLimitBurst=3

# Note that StartLimitInterval was renamed to StartLimitIntervalSec in systemd 230.
# Both the old, and new name are accepted by systemd 230 and up, so using the old name to make
# this option work for either version of systemd.
StartLimitInterval=60s

# Having non-zero Limit*s causes performance problems due to accounting overhead
# in the kernel. We recommend using cgroups to do container-local accounting.
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity

# Comment TasksMax if your systemd version does not support it.
# Only systemd 226 and above support this option.
TasksMax=infinity

# set delegate yes so that systemd does not reset the cgroups of docker containers
Delegate=yes

# kill only the docker process, not all processes in the cgroup
KillMode=process
OOMScoreAdjust=-500

[Install]
WantedBy=multi-user.target
```

### 创建 -- docker.socket

```bash
vim /usr/lib/systemd/system/docker.socket
```

```bash
[Unit]
Description=Docker Socket for the API

[Socket]
# If /var/run is not implemented as a symlink to /run, you may need to
# specify ListenStream=/var/run/docker.sock instead.
ListenStream=/run/docker.sock
SocketMode=0660
SocketUser=root
SocketGroup=docker

[Install]
WantedBy=sockets.target
```

### 创建docker组

```bash
groupadd docker
```

### 创建优化配置

```bash
[root@node1 ~]# mkdir /etc/docker
[root@node1 ~]# cat /etc/docker/daemon.json 
{
    "graph": "/data/docker",
    "storage-driver": "overlay2",
    "exec-opts": [
        "native.cgroupdriver=systemd"
    ],
    "bip":"10.0.2.1/24",
    "registry-mirrors": [ "https://634d89d616c44a3ba03355e7da4b998a.mirror.swr.myhuaweicloud.com" ]
}
```

> bip可选配置。

### 启动服务

```bash
# 启动Docker并设置开机启动
sudo systemctl daemon-reload
sudo systemctl start containerd.service
sudo systemctl enable containerd.service 
sudo systemctl enable docker
sudo systemctl start docker
```

### 测试

```bash
docker run -it --rm llody/busybox-tools:v20230428 /bin/sh
```
