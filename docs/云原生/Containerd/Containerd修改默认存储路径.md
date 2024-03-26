## 查看containerd默认配置

```
containerd config default
```

> containerd的默认配置文件为/etc/containerd/config.toml，可通过命令：
> containerd config default ##查看默认配置

## 如果没有/etc/containerd可自行创建

```
mkdir /etc/containerd
```

## containerd目录默认路径修改

```
containerd config default > /etc/containerd/config.toml

#备份一份源文件避免出错
cp /etc/containerd/config.toml /etc/containerd/config.toml_bak
```

## 停止containerd服务

```
systemctl  stop containerd.service
systemctl  status containerd.service
```

## 创建迁移目录

```
mkdir -p /lgdata/docker/containerd/
```

## 修改config.toml中的root的路径为你想迁移的路径

```
root = "/lgdata/docker/containerd/containerd/"
```

## 剪切默认路径下的所有到需要修改的路径下

> 【这点很重要，和docker一样，如果只是修改路径，原已经启动的镜像是无法运行的。】

```
mv /var/lib/containerd /lgdata/docker/containerd/
```

## 确认路径下的目录文件是否有数据

### 剪切前

```
[root@k8s-work1 ~]# ls -lah /var/lib/containerd/
total 48K
drwx--x--x  12 root root 4.0K Nov 14 18:49 .
drwxr-xr-x. 59 root root 4.0K Nov 14 18:49 ..
drwxr-xr-x   4 root root 4.0K Nov 14 18:47 io.containerd.content.v1.content
drwxr-xr-x   4 root root 4.0K Nov 14 18:49 io.containerd.grpc.v1.cri
drwx------   2 root root 4.0K Nov 14 18:47 io.containerd.grpc.v1.introspection
drwx--x--x   2 root root 4.0K Nov  7 17:51 io.containerd.metadata.v1.bolt
drwx--x--x   2 root root 4.0K Nov  7 17:51 io.containerd.runtime.v1.linux
drwx--x--x   3 root root 4.0K Nov 14 18:49 io.containerd.runtime.v2.task
drwx------   2 root root 4.0K Nov  7 17:51 io.containerd.snapshotter.v1.btrfs
drwx------   3 root root 4.0K Nov  7 17:51 io.containerd.snapshotter.v1.native
drwx------   3 root root 4.0K Nov 14 18:47 io.containerd.snapshotter.v1.overlayfs
drwx------   2 root root 4.0K Nov 16 10:07 tmpmounts
```

### 剪切后

```
[root@k8s-work1 ~]# ls /lgdata/docker/containerd/containerd/
io.containerd.content.v1.content     io.containerd.metadata.v1.bolt  io.containerd.snapshotter.v1.btrfs      tmpmounts
io.containerd.grpc.v1.cri            io.containerd.runtime.v1.linux  io.containerd.snapshotter.v1.native
io.containerd.grpc.v1.introspection  io.containerd.runtime.v2.task   io.containerd.snapshotter.v1.overlayfs
```

## 重启containerd服务

```
systemctl  daemon-reload 
systemctl  restart containerd.service
systemctl  status containerd.service
```

## 控制节点已正常运行

```
[root@k8s-master1 traefik2.8]# kubectl get nodes
NAME          STATUS   ROLES                  AGE   VERSION
k8s-master1   Ready    control-plane,master   39h   v1.20.15
k8s-master2   Ready    control-plane,master   39h   v1.20.15
k8s-master3   Ready    control-plane,master   39h   v1.20.15
k8s-work1     Ready    <none>                 39h   v1.20.15
```
