## docker在线升级

### 说明

> 从docker 18.09.9升级到docker 20.10.7

### 查看当前版本

```bash
[root@llody-dev ~]#docker version
Client:
 Version:           18.09.9
 API version:       1.39
 Go version:        go1.11.13
 Git commit:        039a7df9ba
 Built:             Wed Sep  4 16:51:21 2019
 OS/Arch:           linux/amd64
 Experimental:      false

Server: Docker Engine - Community
 Engine:
  Version:          18.09.9
  API version:      1.39 (minimum version 1.12)
  Go version:       go1.11.13
  Git commit:       039a7df
  Built:            Wed Sep  4 16:22:32 2019
  OS/Arch:          linux/amd64
```

### 备份

> 这里的备份是指备份你修改优化过的所有docker配置，比如docker.service中，你优化的参数，更改了持久化路径等。
>
> 当然你也可以备份你认为需要备份的内容。

```bash
cp /usr/lib/systemd/system/docker.service . 
```

### 升级docker

```bash
# 设置源
yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo

# 重载缓存
yum makecache fast

# 查看当前源的docker版本
yum list docker-ce --showduplicates | sort -r

# 安装你要升级的版本
yum install -y docker-ce-20.10.7 docker-ce-cli-20.10.7 containerd.io
```

### 恢复配置

> 升级docker会导致配置被重置，需要手动进行恢复。

### 重启docker

> 重载配置文件饼重启docker服务
