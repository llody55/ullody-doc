## 麒麟V10离线安装containerd

### 软件包

> 准备软件包如下：
>
> * containerd-1.6.10-linux-arm64.tar.gz
> * cni-plugins-linux-arm64-v1.1.1.tgz
> * runc
> * nerdctl

### containerd安装

#### 解压

```bash
mkdir -p /opt/containerd

tar xf containerd-1.6.10-linux-arm64.tar.gz -C /opt/containerd  --strip-components=1

cp /opt/containerd/* /usr/local/bin/
```

#### 创建containerd目录

```bash
mkdir -p /etc/containerd
touch /etc/containerd/config.toml
```

#### 初始化配置

```bash
containerd config default > /etc/containerd/config.toml
```

#### 开启资源隔离

```bash
sudo sed -i "s#SystemdCgroup = false#SystemdCgroup = true#g" /etc/containerd/config.toml
```

#### 修改pause镜像地址

```bash
sed -i 's#sandbox_image = "registry.k8s.io/pause:3.6"#sandbox_image = "registry.aliyuncs.com/google_containers/pause:3.8"#g' /etc/containerd/config.toml
```

#### 创建 -- containerd.service

```bash
vim /etc/systemd/system/containerd.service
```

```bash
[Unit]
Description=containerd container runtime
Documentation=https://containerd.io
After=network.target local-fs.target

[Service]
ExecStartPre=-/sbin/modprobe overlay
ExecStart=/usr/local/bin/containerd

Type=notify
Delegate=yes
KillMode=process
Restart=always
RestartSec=5
LimitNPROC=infinity
LimitCORE=infinity
LimitNOFILE=1048576
TasksMax=infinity
OOMScoreAdjust=-999

[Install]
WantedBy=multi-user.target
```

### CNI安装

#### 创建cni目录

```bash
mkdir -p /opt/cni/bin
```

#### 解压

```bash
tar Cxzvf /opt/cni/bin cni-plugins-linux-arm64-v1.1.1.tgz
```

#### 组件授权

```bash
# 给runc组件授权
chmod +x runc
# 拷贝到containerd安装目录
cp runc /usr/local/bin/
# 给终端工具授权
chmod +x nerdctl
# 拷贝终端工具到执行目录
cp nerdctl /usr/local/bin/
```

#### 创建 -- crictl.yaml

```bash
vim /etc/crictl.yaml
```

```bash
runtime-endpoint: unix:///run/containerd/containerd.sock
```

#### 运行

```bash
sudo systemctl daemon-reload
sudo systemctl enable containerd
sudo systemctl start containerd
```

#### 测试

```bash
nerdctl run -d -p 8080:80 --name nginx llody/nginx:v1.23.4
```
