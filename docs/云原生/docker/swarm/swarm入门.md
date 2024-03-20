## Docker swarm集群管理

### 简介

> Docker Swarm 提供了一个管理 Docker 节点的平台，让你可以将多台 Docker 运行的机器组成一个集群。Swarm 使用 Docker API，这意味着任何现有的 Docker 工具都可以使用 Swarm。它的主要功能包括集群管理、容器编排、服务发现和负载均衡等。

### 特性

> * **容器编排** ：自动地部署、扩展和管理容器。
> * **服务发现** ：Swarm 集群中的节点可以自动发现彼此。
> * **负载均衡** ：可以在容器之间自动分配任务和负载。
> * **容错与可靠性** ：容器和服务可以在集群内的任何节点上重新启动，以提高可用性。
> * **安全通信** ：Swarm 集群中的通信是加密的，提供了安全保障。

### 初始化 Swarm 集群

> [!NOTE]
>
> 选择一台 Docker 已安装的机器作为 Swarm 的管理节点。使用以下命令初始化 Swarm 集群

```
docker swarm init --advertise-addr <MANAGER-IP>
```

> 这里 `<MANAGER-IP>` 是管理节点的 IP 地址。执行这个命令后，你将看到加入 Swarm 集群的指令，包括一个加入集群的 token。
>
> 初始化节点一般为leader主节点。

### 增加节点

> 加入集群的节点也需要先安装docker
>
> 在已经初始化的机器上执行：# docker swarm join-token manager

```
docker swarm join \
    --token SWMTKN-1-3by2djvsu8cyzo8pzzqrrsmoiszlcmj1ymsyzrqu0e5m4myar6-3ypif5p1vyzv7j7h362ah1kbj \
    192.168.52.36:2377
```

> 将结果复制到各个节点机器上执行即可。

#### 查看集群节点

```
[root@node_t_36 zyx_p]# docker node ls
ID                            HOSTNAME            STATUS              AVAILABILITY        MANAGER STATUS
5i800ms4daxhfk4z02wux52bl     node_t_37           Ready               Active              Reachable
kcd9oc41643o24fpmdi0j25s4     node_t_38           Ready               Active              Reachable
sacj1t4flf4e275d2fwfho6q3 *   node_t_36           Ready               Active              Leader
```

> * 节点MANAGER STATUS列说明：
>
> 显示节点是属于manager或者worker,没有值 表示不参与群管理的工作节点。
>
> * Leader 意味着该节点是使得群的所有群管理和编排决策的主要管理器节点。
> * Reachable 意味着节点是管理者节点正在参与Raft共识。如果领导节点不可用，则该节点有资格被选为新领导者。
> * Unavailable 意味着节点是不能与其他管理器通信的管理器。如果管理器节点不可用，您应该将新的管理器节点加入群集，或者将工作器节点升级为管理器。
> * 节点AVAILABILITY列说明：
>
> 显示调度程序是否可以将任务分配给节点
>
> * Active 意味着调度程序可以将任务分配给节点。
> * Pause 意味着调度程序不会将新任务分配给节点，但现有任务仍在运行。
> * Drain 意味着调度程序不会向节点分配新任务。调度程序关闭所有现有任务并在可用节点上调度它们。

### 删除节点

> docker swarm集群已经有容器服务，删除节点node_t_37 的时候，需要先将该节点的服务迁移到其他节点,确保容器服务正常

```
[root@node_t_37 ~]#docker node  update --availability drain node_t_37 将节点停用,该节点上的容器会迁移到其他节点
[root@node_t_37 ~]#docker ps  检查容器迁移情况，当node_t_37的容器都迁移完后，停止docker服务
[root@node_t_37 ~]#systemctl stop docker.service 停止docker服务（删除节点前，需先停该节点的docker服务）

登录到node_t_36上，将节点node_t_37降级成worker,然后删除。只能删除worker基本的节点。
[root@node_t_36 zyx_p]# docker node demote node_t_37  降级
[root@node_t_36 zyx_p]# docker node rm node_t_37   删除
删除后的集群：
[root@node_t_36 zyx_p]# docker node ls
ID                            HOSTNAME            STATUS              AVAILABILITY        MANAGER STATUS
kcd9oc41643o24fpmdi0j25s4     node_t_38           Ready               Active              Reachable
sacj1t4flf4e275d2fwfho6q3 *   node_t_36           Ready               Active              Leader
```

### 创建 Overlay 网络

```
docker network create -d overlay app-overlay
```

### 部署服务

```
docker service create --name my-web --publish 80:80 --replicas 3 --network app-overlay llody/nginx:1.20.0
```

> 这个命令创建了一个名为 `my-web` 的服务，运行三个 nginx 容器实例，绑定到每个工作节点的 80 端口，并且它们都连接到之前创建的 `app-overlay` 网络。

### 扩缩容

```
docker service scale my-web=5
```

> 扩容或者缩容都只需要改变my-web副本值即可。

### 滚动更新

```
docker service update --image nginx:1.23.4 my-web
```

> 此命令会把my-web服务的镜像从nginx:1.20.0更新到1.23.4版本

#### 更加细颗粒度的更新

> 为了细粒度地控制更新过程，Swarm 提供了一些有用的选项：
>
> * `--update-parallelism`: 同时更新的任务数量。默认情况下，这个值是 1，意味着一次更新一个容器。
> * `--update-delay`: 更新批次之间的延迟时间。这个设置确保了不会立即更新所有的容器，而是根据设定的间隔逐步更新。
> * `--update-failure-action`: 当更新失败时的动作。默认为 `pause`，表示当更新失败时暂停更新，允许你检查问题并决定是否继续。
> * `--update-order`: 控制更新的顺序。默认为 `stop-first`，即先停止旧容器再启动新容器。另一个选项是 `start-first`，先启动新容器，然后再停止旧容器。

```
# 每次更新 2 个容器，每批次之间等待 10 秒
docker service update --image nginx:1.23.4 --update-parallelism 2 --update-delay 10s my-web
```

### 查看更新状态

```
docker service ps my-web
```

### 回滚更新

```
docker service update --rollback my-web
```

### 常用命令

- docker swarm 命令用于管理 Swarm 群集

| 命令                    | 描述                     |
| ----------------------- | ------------------------ |
| docker swarm init       | 初始化一个 swarm 群集    |
| docker swarm join       | 加入群集作为节点或管理器 |
| docker swarm join-token | 管理用于加入群集的令牌   |
| docker swarm leave      | 离开 swarm 群集          |
| docker swarm unlock     | 解锁 swarm 群集          |
| docker swarm unlock-key | 管理解锁钥匙             |
| docker swarm update     | 更新 swarm 群集          |

* docker node 命令用于管理 Swarm 群集中的机器节点

| 命令                | 描述                                             |
| ------------------- | ------------------------------------------------ |
| docker node demote  | 从 swarm 群集管理器中降级一个或多个节点          |
| docker node inspect | 显示一个或多个节点的详细信息                     |
| docker node ls      | 列出 swarm 群集中的节点                          |
| docker node promote | 将一个或多个节点推入到群集管理器中               |
| docker node ps      | 列出在一个或多个节点上运行的任务，默认为当前节点 |
| docker node rm      | 从 swarm 群集删除一个或多个节点                  |
| docker node update  | 更新一个节点                                     |

* docker service 命令用于管理服务

| 命令                    | 描述                         |
| ----------------------- | ---------------------------- |
| docker service create   | 创建服务                     |
| docker service inspect  | 显示一个或多个服务的详细信息 |
| docker service logs     | 获取服务的日志               |
| docker service ls       | 列出服务                     |
| docker service rm       | 删除一个或多个服务           |
| docker service scale    | 设置服务的实例数量           |
| docker service update   | 更新服务                     |
| docker service rollback | 恢复服务至update之前的配置   |
