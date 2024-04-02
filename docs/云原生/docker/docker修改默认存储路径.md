## Docker修改默认存储路径

```
创建docker容器存放的路径

# mkdir -p /home/data/docker/lib

停止Docker服务并迁移数据到新目录

# systemctl stop docker.service

mv /var/lib/docker/ /home/data/docker/lib/

vim /usr/lib/systemd/system/docker.service

修改为:ExecStart=/usr/bin/dockerd  -H fd:// --containerd=/run/containerd/containerd.sock --graph /home/data/docker/lib

重启Docker服务
# systemctl daemon-reload 
# systemctl restart docker

查看现在容器存放的目录
# docker info | grep "Dir"

一定要检查容器和镜像是否都在。
```

> 这个操作一般在安装或者初始化的时候就需要做了。
