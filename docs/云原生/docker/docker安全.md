## docker安全配置优化

### 限制容器之间的网络流量:服务配置

> 默认情况下，同一主机上的容器之间允许所有网络通信。 如果不需要，请限制所有容器间的通信。 将需要相互通信的特定容器链接在一起。默认情况下，同一主机上所有容器之间都启用了不受限制的网络流量。 因此，每个容器都有可能读取同一主机上整个容器网络上的所有数据包。 这可能会导致意外和不必要的信息泄露给其他容器。 因此，限制容器间的通信。

#### 优化建议

在守护程序模式下运行docker并传递'--icc = false'作为参数。 例如，

```
/usr/bin/dockerd --icc=false
```

若使用systemctl管理docker服务则需要编辑

```
/usr/lib/systemd/system/docker.service
```

文件中的ExecStart参数添加 --icc=false选项 然后重启docker服务

```
systemctl daemon-reload
systemctl restart docker
```

> 操作时建议做好记录或备份

### 不要在容器上挂载敏感的主机系统目录:服务配置

> 不允许将以下敏感的主机系统目录作为容器卷挂载，尤其是在读写模式下。
>
> ```bash
> /boot
> /dev
> /etc
> /lib
> /proc
> /sys
> /usr
> ```
>
> 如果敏感目录以读写模式挂载，则可以对那些敏感目录中的文件进行更改。 这些更改可能会降低安全隐患或不必要的更改，这些更改可能会使Docker主机处于受损状态。如果您是k8s或其他容器编排软件编排的容器，请依照相应的安全策略配置或忽略。

### 将容器的根文件系统挂载为只读:服务配置

> 容器的根文件系统应被视为“黄金映像”，并且应避免对根文件系统的任何写操作。 您应该显式定义用于写入的容器卷。您不应该在容器中写入数据。 属于容器的数据量应明确定义和管理。 在管理员控制他们希望开发人员在何处写入文件和错误的许多情况下，这很有用。

#### 优化建议

> 添加“ --read-only”标志，以允许将容器的根文件系统挂载为只读。 可以将其与卷结合使用，以强制容器的过程仅写入要保留的位置。 您应该按以下方式运行容器：

```bash
docker run --interactive --tty --read-only --volume <writable-volume> <Container Image Name or ID> <Command>
```

### 设置容器用户

> 防止提权攻击的一种简单方法是将容器的用户设置为非特权用户。如果容器被入侵，攻击者将没有足够的权限对容器发起攻击。有多种方法可以为容器设置用户

* 运行容器时使用 -u标志

  ```bash
  docker run -u 1001 nobody
  ```
* 在 Docker 守护程序中启用用户命名空间支持 (  --userns-remap=default)
* 在构建镜像时 Dockerfile 中使用  USER指令

  ```bash
  FROM ubuntu:latest
  RUN apt-get -y update
  RUN groupadd -r john && useradd -r -g john john
  USER john
  ```

> 但是，重要的是要注意，如果容器内存在本地权限升级，则此假设不成立。
