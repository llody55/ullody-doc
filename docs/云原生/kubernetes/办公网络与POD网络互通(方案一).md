## 办公网络与K8S的pod网络通信

> 机群内是微服务应用，研发团队需要将本地服务注册到到和K8S机群中测试环境同一个注册中心中，并能通过PODIP与内部业务进行通信

### K8S机群情况

| 节点  | 节点IP        | POD CIDR网络  | POD节点网段   | 角色   | 调度       |
| ----- | ------------- | ------------- | ------------- | ------ | ---------- |
| node1 | 192.168.1.227 | 10.244.0.0/16 | 10.244.166..0 | master | 不参与调度 |
| node2 | 192.168.1.228 | 10.244.0.0/16 | 10.244.104.0  | worker | 可调度     |
| node3 | 192.168.1.229 | 10.244.0.0/16 | 10.244.135.0  | worker | 可调度     |
| node4 | 192.168.1.226 | 10.244.0.0/16 | 10.244.3.0    | worker | 可调度     |

### 网络基本情况

| 网络类型 | IP段           |
| -------- | -------------- |
| 办公网络 | 192.168.1.0/24 |
| pod 网段 | 10.244.0.0/16  |

### 前提条件

#### **启用 IP 转发**

> 允许节点转发流量可能需要编辑 `/etc/sysctl.conf` 文件来启用 IP 转发

```bash
net.ipv4.ip_forward=1
```

```bash
[root@node4 ~]# sysctl -a |grep ip_forward
net.ipv4.ip_forward = 1
net.ipv4.ip_forward_update_priority = 1
net.ipv4.ip_forward_use_pmtu = 0
sysctl: reading key "net.ipv6.conf.all.stable_secret"
sysctl: reading key "net.ipv6.conf.cali00be98a2648.stable_secret"
sysctl: reading key "net.ipv6.conf.cali0f8e674b714.stable_secret"
sysctl: reading key "net.ipv6.conf.cali12b2249112d.stable_secret"
sysctl: reading key "net.ipv6.conf.cali14518e71771.stable_secret"
sysctl: reading key "net.ipv6.conf.cali3285e8b27f0.stable_secret"
sysctl: reading key "net.ipv6.conf.cali3497a257c56.stable_secret"
sysctl: reading key "net.ipv6.conf.cali45099a004a4.stable_secret"
sysctl: reading key "net.ipv6.conf.cali4ed1b45548d.stable_secret"
sysctl: reading key "net.ipv6.conf.cali7389afe1a2c.stable_secret"
sysctl: reading key "net.ipv6.conf.calic7886557082.stable_secret"
sysctl: reading key "net.ipv6.conf.calicbf43448401.stable_secret"
sysctl: reading key "net.ipv6.conf.calif9564171d6f.stable_secret"
sysctl: reading key "net.ipv6.conf.default.stable_secret"
sysctl: reading key "net.ipv6.conf.docker0.stable_secret"
sysctl: reading key "net.ipv6.conf.eth0.stable_secret"
sysctl: reading key "net.ipv6.conf.flannel/1.stable_secret"
sysctl: reading key "net.ipv6.conf.lo.stable_secret"
sysctl: reading key "net.ipv6.conf.tun0.stable_secret"
sysctl: reading key "net.ipv6.conf.tunl0.stable_secret"
```

### **iptables 规则**

> 需要在每个微服务调度的节点上应用规则以允许流量从本地网络转发到 Pod 网络，反之亦然。以下是相应的 `iptables` 规则

```bash
[root@node4 ~]# iptables -A FORWARD -s 192.168.1.0/24 -d 10.244.0.0/16 -j ACCEPT
[root@node4 ~]# iptables -A FORWARD -d 192.168.1.0/24 -s 10.244.0.0/16 -j ACCEPT
[root@node4 ~]# iptables -t nat -A POSTROUTING -s 10.244.0.0/16 -d 192.168.1.0/24 -j MASQUERADE
[root@node4 ~]# iptables -t nat -nL --line | grep 192.168.1
8    MASQUERADE  all  --  10.244.0.0/16        192.168.1.0/24  
1    KUBE-MARK-MASQ  all  --  192.168.1.227        0.0.0.0/0            /* traefik/traefik:tcpep */
1    KUBE-MARK-MASQ  all  --  192.168.1.227        0.0.0.0/0            /* traefik/traefik:web */
1    KUBE-MARK-MASQ  all  --  192.168.1.227        0.0.0.0/0            /* default/kubernetes:https */
1    KUBE-MARK-MASQ  all  --  192.168.1.227        0.0.0.0/0            /* traefik/traefik:udpep */
1    KUBE-MARK-MASQ  all  --  192.168.1.227        0.0.0.0/0            /* traefik/traefik:admin */
1    KUBE-MARK-MASQ  all  --  192.168.1.227        0.0.0.0/0            /* traefik/traefik:websecure */
```

> 这里我只加了node4做测试，实际应用需要在微服务调度的所有节点上进行添加。或者加亲和性，将所有微服务POD调度到指定的节点上。

### 路由器配置

#### 配置静态路由

> 因为是测试node4我只配置了node4的网段。

![路由](https://static.llody.top/ullody-doc/images/路由.png)

> 注意状态为 `可达` 表示路由器配置成功了，实际这里需要配置微服务所有调度节点的所在网段。
>
> 注意，这个路由器与K8S节点在同一段的，既 192.168.1.0段，其中192.168.1.226为node4节点IP

### 终端测试

![ping](https://static.llody.top/ullody-doc/images/ping.png)
