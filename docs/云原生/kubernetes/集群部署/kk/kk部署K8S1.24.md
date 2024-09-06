## 鲲鹏920(ARM64) K8S1.24.9 ubantu22.04移植指南

### 整体服务器清单

| 主机名      | IP地址        | 系统               | 架构  | **内核版本** | CPU         |
| ----------- | ------------- | ------------------ | ----- | ------------------ | ----------- |
| k8s-master1 | 192.168.1.212 | Ubuntu 22.04.4 LTS | ARM64 | 5.15.0-118-generic | Kunpeng-920 |
| k8s-master2 | 192.168.1.141 | Ubuntu 22.04.4 LTS | ARM64 | 5.15.0-118-generic | Kunpeng-920 |
| k8s-master3 | 192.168.1.126 | Ubuntu 22.04.4 LTS | ARM64 | 5.15.0-118-generic | Kunpeng-920 |
| k8s-work1   | 192.168.1.19  | Ubuntu 22.04.4 LTS | ARM64 | 5.15.0-118-generic | Kunpeng-920 |

### 系统初始化(**所有节点**)

#### 修改主机名

```bash
hostnamectl set-hostname k8s-master1
hostnamectl set-hostname k8s-master2
hostnamectl set-hostname k8s-master3
hostnamectl set-hostname k8s-work1
```

#### 配置hosts映射

```bash
cat >> /etc/hosts << EOF
192.168.1.212 k8s-master1
192.168.1.141 k8s-master2
192.168.1.126 k8s-master3
192.168.1.19  k8s-work1
EOF

```

#### 服务器优化/配置

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
```

#### 关闭防火墙

```
systemctl stop ufw
systemctl disable ufw
systemctl status ufw
```

#### 关闭交换分区(为了保证 kubelet 正常工作，必须禁用交换分区)

```bash
swapoff -a
sed -i '/swap/s/^/#/' /etc/fstab
```

#### 更换国内源

```bash
sed -i 's/ports.ubuntu.com/mirrors.ustc.edu.cn/g' /etc/apt/sources.list
apt update
```

#### 配置 时间同步

```bash
timedatectl set-timezone Asia/Shanghai
apt install ntp -y
systemctl enable --now ntp

# 手动同步时间
ntpdate time1.aliyun.com

# 设置24小时制
echo "LC_TIME=en_DK.UTF-8" > /etc/default/locale

# 需要重启24小时制时间方可生效
```

#### 开启IPV4转发

```bash
# 检查br_netfilter 模块是否已加载
lsmod | grep br_netfilter

# 加载br_netfilter 模块
modprobe br_netfilter

# 设置sysctl 参数
cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF

# 应用 sysctl 参数而不重新启动
sysctl --system
```

#### 开启br_netfilter和overlay模块被加载

```bash
cat <<EOF | tee /etc/modules-load.d/containerd.conf
overlay
br_netfilter
EOF
# 通过运行以下指令确认br_netfilter和overlay模块被加载
lsmod | grep br_netfilter
lsmod | grep overlay
```

#### 开启ipvs

```bash
apt install ipset ipvsadm -y
#不开启ipvs将会使用iptables，但是效率低，所以官网推荐需要开通ipvs内核
cat > /etc/modules-load.d/ipvs.modules <<EOF
#!/bin/bash
ipvs_modules="ip_vs ip_vs_lc ip_vs_wlc ip_vs_rr ip_vs_wrr ip_vs_lblc ip_vs_lblcr ip_vs_dh ip_vs_sh ip_vs_fo ip_vs_nq ip_vs_sed ip_vs_ftp nf_conntrack"
for kernel_module in \${ipvs_modules}; do
 /sbin/modinfo -F filename \${kernel_module} > /dev/null 2>&1
 if [ $? -eq 0 ]; then
 /sbin/modprobe \${kernel_module}
 fi
done
EOF

chmod 755 /etc/modules-load.d/ipvs.modules && bash /etc/modules-load.d/ipvs.modules && lsmod | grep ip_vs


```

### 使用**kubekey**方式部署(**Master节点**)

#### 支持的环境

##### [Linux 发行版](https://github.com/kubesphere/kubekey/blob/master/README_zh-CN.md)

* **Ubuntu** *16.04, 18.04, 20.04, 22.04*
* **Debian** *Bullseye, Buster, Stretch*
* **CentOS/RHEL** *7*
* **AlmaLinux** *9.0*
* **SUSE Linux Enterprise Server** *15*

> 建议使用 Linux Kernel 版本: `4.15 or later` 可以通过命令 `uname -srm` 查看 Linux Kernel 版本。

##### [Kubernetes 版本](https://github.com/kubesphere/kubekey/blob/master/README_zh-CN.md)

* **v1.19** :   *v1.19.15*
* **v1.20** :   *v1.20.10*
* **v1.21** :   *v1.21.14*
* **v1.22** :   *v1.22.15*
* **v1.23** :   *v1.23.10* (default)
* **v1.24** :   *v1.24.7*
* **v1.25** :   *v1.25.3*

##### 官方文档

> https://github.com/kubesphere/kubekey/blob/v3.0.7/README_zh-CN.md

#### 使用 KubeKey 创建 Kubernetes 集群

##### 设置区域

```bash
export KKZONE=cn
```

##### 下载 KubeKey

```bash
# 在线下载
curl -sfL https://get-kk.kubesphere.io | VERSION=v3.0.7 sh -

# 安装安装
tar xf kubekey-v3.0.7-linux-arm64.tar.gz && chmod +x kk && mv kk /usr/bin/
# 查看版本
root@k8s-master1:~# ./kk version
kk version: &version.Info{Major:"3", Minor:"0", GitVersion:"v3.0.7-dirty", GitCommit:"e755baf67198d565689d7207378174f429b508ba", GitTreeState:"dirty", BuildDate:"2023-01-18T01:59:52Z", GoVersion:"go1.19.2", Compiler:"gc", Platform:"linux/arm64"}
```

##### 查看支持的K8S版本

```bash
root@k8s-master1:~# ./kk version --show-supported-k8s | tail -l
v1.24.7
v1.24.8
v1.24.9
v1.25.0
v1.25.1
v1.25.2
v1.25.3
v1.25.4
v1.25.5
v1.26.0
```

##### 生成配置文件模版

```bash
./kk create config --with-kubernetes v1.24.9
```

##### 配置文件模板如下

```bash

apiVersion: kubekey.kubesphere.io/v1alpha2
kind: Cluster
metadata:
  name: sample
spec:
  hosts:
  - {name: k8s-master1, address: 192.168.1.212, internalAddress: 192.168.1.212, user: root, password: "123456" , arch: arm64}
  - {name: k8s-master2, address: 192.168.1.141, internalAddress: 192.168.1.141, user: root, password: "123456" , arch: arm64}
  - {name: k8s-master3, address: 192.168.1.126, internalAddress: 192.168.1.126, user: root, password: "123456" , arch: arm64}
  - {name: k8s-work1, address: 192.168.1.19, internalAddress: 192.168.1.19, user: root, password: "123456" , arch: arm64}
  roleGroups:
    etcd:
    - k8s-master1
    - k8s-master2
    - k8s-master3
    control-plane: 
    - k8s-master1
    - k8s-master2
    - k8s-master3
    worker:
    - k8s-work1

  controlPlaneEndpoint:
    ## Internal loadbalancer for apiservers 
    # internalLoadbalancer: haproxy

    domain: lb.kubesphere.local
    address: "192.168.1.212"
    port: 6443
  kubernetes:
    version: v1.24.9
    clusterName: cluster.local
    autoRenewCerts: true
    containerManager: containerd
  etcd:
    type: kubekey
  network:
    plugin: calico
    kubePodsCIDR: 10.233.64.0/18
    kubeServiceCIDR: 10.234.0.0/18
    ## multus support. https://github.com/k8snetworkplumbingwg/multus-cni
    multusCNI:
      enabled: false
  registry:
    privateRegistry: ""
    namespaceOverride: ""
    registryMirrors: []
    insecureRegistries: []
  addons: []



```

> 配置文件选项参考：https://github.com/kubesphere/kubekey/blob/v3.0.7/docs/config-example.md

##### 安装依赖

```bash
apt install curl socat conntrack ebtables ipset ipvsadm -y
```

##### 执行安装

```bash
root@k8s-master1:~# ./kk create cluster -f config-sample.yaml 


 _   __      _          _   __   
| | / /     | |        | | / /   
| |/ / _   _| |__   ___| |/ /  ___ _   _ 
|    \| | | | '_ \ / _ \    \ / _ \ | | |
| |\  \ |_| | |_) |  __/ |\  \  __/ |_| |
\_| \_/\__,_|_.__/ \___\_| \_/\___|\__, |
                                    __/ |
                                   |___/

14:04:16 CST [GreetingsModule] Greetings
14:04:17 CST message: [k8s-work1]
Greetings, KubeKey!
14:04:17 CST message: [k8s-master1]
Greetings, KubeKey!
14:04:18 CST message: [k8s-master2]
Greetings, KubeKey!
14:04:19 CST message: [k8s-master3]
Greetings, KubeKey!
14:04:19 CST success: [k8s-work1]
14:04:19 CST success: [k8s-master1]
14:04:19 CST success: [k8s-master2]
14:04:19 CST success: [k8s-master3]
14:04:19 CST [NodePreCheckModule] A pre-check on nodes
14:04:19 CST success: [k8s-master1]
14:04:19 CST success: [k8s-work1]
14:04:19 CST success: [k8s-master3]
14:04:19 CST success: [k8s-master2]
14:04:19 CST [ConfirmModule] Display confirmation form
+-------------+------+------+---------+----------+-------+-------+---------+-----------+--------+--------+------------+------------+-------------+------------------+--------------+
| name        | sudo | curl | openssl | ebtables | socat | ipset | ipvsadm | conntrack | chrony | docker | containerd | nfs client | ceph client | glusterfs client | time         |
+-------------+------+------+---------+----------+-------+-------+---------+-----------+--------+--------+------------+------------+-------------+------------------+--------------+
| k8s-master1 | y    | y    | y       | y        | y     | y     | y       | y         |        |        | v1.6.4     | y          |             |                  | CST 14:04:19 |
| k8s-master2 | y    | y    | y       | y        | y     | y     | y       | y         |        |        | v1.6.4     | y          |             |                  | CST 14:04:19 |
| k8s-master3 | y    | y    | y       | y        | y     | y     | y       | y         |        |        | v1.6.4     | y          |             |                  | CST 14:04:19 |
| k8s-work1   | y    | y    | y       | y        | y     | y     | y       | y         |        |        | v1.6.4     | y          |             |                  | CST 14:04:19 |
+-------------+------+------+---------+----------+-------+-------+---------+-----------+--------+--------+------------+------------+-------------+------------------+--------------+

This is a simple check of your environment.
Before installation, ensure that your machines meet all requirements specified at
https://github.com/kubesphere/kubekey#requirements-and-recommendations

Continue this installation? [yes/no]: yes
14:04:24 CST success: [LocalHost]
14:04:24 CST [NodeBinariesModule] Download installation binaries
14:04:24 CST message: [localhost]
downloading arm64 kubeadm v1.24.9 ...
14:04:24 CST message: [localhost]
kubeadm is existed
14:04:24 CST message: [localhost]
downloading arm64 kubelet v1.24.9 ...
14:04:25 CST message: [localhost]
kubelet is existed
14:04:25 CST message: [localhost]
downloading arm64 kubectl v1.24.9 ...
14:04:25 CST message: [localhost]
kubectl is existed
14:04:25 CST message: [localhost]
downloading arm64 helm v3.9.0 ...
14:04:25 CST message: [localhost]
helm is existed
14:04:25 CST message: [localhost]
downloading arm64 kubecni v0.9.1 ...
14:04:26 CST message: [localhost]
kubecni is existed
14:04:26 CST message: [localhost]
downloading arm64 crictl v1.24.0 ...
14:04:26 CST message: [localhost]
crictl is existed
14:04:26 CST message: [localhost]
downloading arm64 etcd v3.4.13 ...
14:04:26 CST message: [localhost]
etcd is existed
14:04:26 CST message: [localhost]
downloading arm64 containerd 1.6.4 ...
14:04:26 CST message: [localhost]
containerd is existed
14:04:26 CST message: [localhost]
downloading arm64 runc v1.1.1 ...
14:04:26 CST message: [localhost]
runc is existed
14:04:26 CST success: [LocalHost]
14:04:26 CST [ConfigureOSModule] Get OS release
14:04:26 CST success: [k8s-master1]
14:04:26 CST success: [k8s-master3]
14:04:26 CST success: [k8s-master2]
14:04:26 CST success: [k8s-work1]
14:04:26 CST [ConfigureOSModule] Prepare to init OS
14:04:26 CST success: [k8s-work1]
14:04:26 CST success: [k8s-master3]
14:04:26 CST success: [k8s-master2]
14:04:26 CST success: [k8s-master1]
14:04:26 CST [ConfigureOSModule] Generate init os script
14:04:26 CST success: [k8s-master1]
14:04:26 CST success: [k8s-master2]
14:04:26 CST success: [k8s-master3]
14:04:26 CST success: [k8s-work1]
14:04:26 CST [ConfigureOSModule] Exec init os script
14:04:28 CST stdout: [k8s-master1]
net.ipv4.ip_forward = 1
vm.swappiness = 1
net.ipv4.tcp_max_tw_buckets = 5000
net.core.somaxconn = 1024
net.ipv4.tcp_max_syn_backlog = 1024
net.bridge.bridge-nf-call-arptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.ip_local_reserved_ports = 30000-32767
vm.max_map_count = 262144
fs.inotify.max_user_instances = 524288
kernel.pid_max = 65535
14:04:28 CST stdout: [k8s-work1]
net.ipv4.ip_forward = 1
vm.swappiness = 1
net.ipv4.tcp_max_tw_buckets = 5000
net.core.somaxconn = 1024
net.ipv4.tcp_max_syn_backlog = 1024
net.bridge.bridge-nf-call-arptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.ip_local_reserved_ports = 30000-32767
vm.max_map_count = 262144
fs.inotify.max_user_instances = 524288
kernel.pid_max = 65535
14:04:28 CST stdout: [k8s-master2]
net.ipv4.ip_forward = 1
vm.swappiness = 1
net.ipv4.tcp_max_tw_buckets = 5000
net.core.somaxconn = 1024
net.ipv4.tcp_max_syn_backlog = 1024
net.bridge.bridge-nf-call-arptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.ip_local_reserved_ports = 30000-32767
vm.max_map_count = 262144
fs.inotify.max_user_instances = 524288
kernel.pid_max = 65535
14:04:28 CST stdout: [k8s-master3]
net.ipv4.ip_forward = 1
vm.swappiness = 1
net.ipv4.tcp_max_tw_buckets = 5000
net.core.somaxconn = 1024
net.ipv4.tcp_max_syn_backlog = 1024
net.bridge.bridge-nf-call-arptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.ip_local_reserved_ports = 30000-32767
vm.max_map_count = 262144
fs.inotify.max_user_instances = 524288
kernel.pid_max = 65535
14:04:28 CST success: [k8s-master1]
14:04:28 CST success: [k8s-work1]
14:04:28 CST success: [k8s-master2]
14:04:28 CST success: [k8s-master3]
14:04:28 CST [ConfigureOSModule] configure the ntp server for each node
14:04:28 CST skipped: [k8s-work1]
14:04:28 CST skipped: [k8s-master3]
14:04:28 CST skipped: [k8s-master2]
14:04:28 CST skipped: [k8s-master1]
14:04:28 CST [KubernetesStatusModule] Get kubernetes cluster status
14:04:28 CST success: [k8s-master1]
14:04:28 CST success: [k8s-master2]
14:04:28 CST success: [k8s-master3]
14:04:28 CST [InstallContainerModule] Sync containerd binaries
14:04:28 CST skipped: [k8s-master3]
14:04:28 CST skipped: [k8s-master2]
14:04:28 CST skipped: [k8s-master1]
14:04:28 CST skipped: [k8s-work1]
14:04:28 CST [InstallContainerModule] Sync crictl binaries
14:04:28 CST skipped: [k8s-master1]
14:04:28 CST skipped: [k8s-work1]
14:04:28 CST skipped: [k8s-master3]
14:04:28 CST skipped: [k8s-master2]
14:04:28 CST [InstallContainerModule] Generate containerd service
14:04:28 CST skipped: [k8s-work1]
14:04:28 CST skipped: [k8s-master1]
14:04:28 CST skipped: [k8s-master3]
14:04:28 CST skipped: [k8s-master2]
14:04:28 CST [InstallContainerModule] Generate containerd config
14:04:28 CST skipped: [k8s-master3]
14:04:28 CST skipped: [k8s-master1]
14:04:28 CST skipped: [k8s-work1]
14:04:28 CST skipped: [k8s-master2]
14:04:28 CST [InstallContainerModule] Generate crictl config
14:04:28 CST skipped: [k8s-master3]
14:04:28 CST skipped: [k8s-work1]
14:04:28 CST skipped: [k8s-master1]
14:04:28 CST skipped: [k8s-master2]
14:04:28 CST [InstallContainerModule] Enable containerd
14:04:28 CST skipped: [k8s-master3]
14:04:28 CST skipped: [k8s-work1]
14:04:28 CST skipped: [k8s-master1]
14:04:28 CST skipped: [k8s-master2]
14:04:28 CST [PullModule] Start to pull images on all nodes
14:04:28 CST message: [k8s-master3]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/pause:3.7
14:04:28 CST message: [k8s-master1]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/pause:3.7
14:04:28 CST message: [k8s-master2]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/pause:3.7
14:04:28 CST message: [k8s-work1]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/pause:3.7
14:04:29 CST message: [k8s-master1]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/kube-apiserver:v1.24.9
14:04:29 CST message: [k8s-work1]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/kube-proxy:v1.24.9
14:04:29 CST message: [k8s-master2]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/kube-apiserver:v1.24.9
14:04:29 CST message: [k8s-master3]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/kube-apiserver:v1.24.9
14:04:29 CST message: [k8s-master2]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/kube-controller-manager:v1.24.9
14:04:29 CST message: [k8s-work1]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/coredns:1.8.6
14:04:29 CST message: [k8s-master1]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/kube-controller-manager:v1.24.9
14:04:29 CST message: [k8s-master3]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/kube-controller-manager:v1.24.9
14:04:30 CST message: [k8s-work1]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/k8s-dns-node-cache:1.15.12
14:04:30 CST message: [k8s-master2]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/kube-scheduler:v1.24.9
14:04:30 CST message: [k8s-master1]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/kube-scheduler:v1.24.9
14:04:30 CST message: [k8s-master3]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/kube-scheduler:v1.24.9
14:04:30 CST message: [k8s-work1]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/kube-controllers:v3.23.2
14:04:30 CST message: [k8s-master1]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/kube-proxy:v1.24.9
14:04:30 CST message: [k8s-master2]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/kube-proxy:v1.24.9
14:04:31 CST message: [k8s-master3]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/kube-proxy:v1.24.9
14:04:31 CST message: [k8s-work1]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/cni:v3.23.2
14:04:31 CST message: [k8s-master2]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/coredns:1.8.6
14:04:31 CST message: [k8s-master1]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/coredns:1.8.6
14:04:31 CST message: [k8s-master3]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/coredns:1.8.6
14:04:31 CST message: [k8s-work1]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/node:v3.23.2
14:04:31 CST message: [k8s-master2]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/k8s-dns-node-cache:1.15.12
14:04:31 CST message: [k8s-master1]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/k8s-dns-node-cache:1.15.12
14:04:32 CST message: [k8s-master3]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/k8s-dns-node-cache:1.15.12
14:04:32 CST message: [k8s-master2]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/kube-controllers:v3.23.2
14:04:32 CST message: [k8s-work1]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/pod2daemon-flexvol:v3.23.2
14:04:32 CST message: [k8s-master3]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/kube-controllers:v3.23.2
14:04:32 CST message: [k8s-master1]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/kube-controllers:v3.23.2
14:04:32 CST message: [k8s-master2]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/cni:v3.23.2
14:04:32 CST message: [k8s-master1]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/cni:v3.23.2
14:04:33 CST message: [k8s-master3]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/cni:v3.23.2
14:04:33 CST message: [k8s-master2]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/node:v3.23.2
14:04:33 CST message: [k8s-master1]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/node:v3.23.2
14:04:33 CST message: [k8s-master3]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/node:v3.23.2
14:04:33 CST message: [k8s-master2]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/pod2daemon-flexvol:v3.23.2
14:04:34 CST message: [k8s-master3]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/pod2daemon-flexvol:v3.23.2
14:04:34 CST message: [k8s-master1]
downloading image: registry.cn-beijing.aliyuncs.com/kubesphereio/pod2daemon-flexvol:v3.23.2
14:04:34 CST success: [k8s-work1]
14:04:34 CST success: [k8s-master2]
14:04:34 CST success: [k8s-master3]
14:04:34 CST success: [k8s-master1]
14:04:34 CST [ETCDPreCheckModule] Get etcd status
14:04:34 CST success: [k8s-master1]
14:04:34 CST success: [k8s-master2]
14:04:34 CST success: [k8s-master3]
14:04:34 CST [CertsModule] Fetch etcd certs
14:04:34 CST success: [k8s-master1]
14:04:34 CST skipped: [k8s-master2]
14:04:34 CST skipped: [k8s-master3]
14:04:34 CST [CertsModule] Generate etcd Certs
[certs] Using existing ca certificate authority
[certs] Using existing admin-k8s-master1 certificate and key on disk
[certs] Using existing member-k8s-master1 certificate and key on disk
[certs] Using existing node-k8s-master1 certificate and key on disk
[certs] Using existing admin-k8s-master2 certificate and key on disk
[certs] Using existing member-k8s-master2 certificate and key on disk
[certs] Using existing node-k8s-master2 certificate and key on disk
[certs] Using existing admin-k8s-master3 certificate and key on disk
[certs] Using existing member-k8s-master3 certificate and key on disk
[certs] Using existing node-k8s-master3 certificate and key on disk
14:04:34 CST success: [LocalHost]
14:04:34 CST [CertsModule] Synchronize certs file
14:04:36 CST success: [k8s-master1]
14:04:36 CST success: [k8s-master3]
14:04:36 CST success: [k8s-master2]
14:04:36 CST [CertsModule] Synchronize certs file to master
14:04:36 CST skipped: [k8s-master3]
14:04:36 CST skipped: [k8s-master1]
14:04:36 CST skipped: [k8s-master2]
14:04:36 CST [InstallETCDBinaryModule] Install etcd using binary
14:04:37 CST success: [k8s-master1]
14:04:37 CST success: [k8s-master3]
14:04:37 CST success: [k8s-master2]
14:04:37 CST [InstallETCDBinaryModule] Generate etcd service
14:04:37 CST success: [k8s-master2]
14:04:37 CST success: [k8s-master3]
14:04:37 CST success: [k8s-master1]
14:04:37 CST [InstallETCDBinaryModule] Generate access address
14:04:37 CST skipped: [k8s-master3]
14:04:37 CST skipped: [k8s-master2]
14:04:37 CST success: [k8s-master1]
14:04:37 CST [ETCDConfigureModule] Health check on exist etcd
14:04:37 CST skipped: [k8s-master3]
14:04:37 CST skipped: [k8s-master1]
14:04:37 CST skipped: [k8s-master2]
14:04:37 CST [ETCDConfigureModule] Generate etcd.env config on new etcd
14:04:37 CST success: [k8s-master1]
14:04:37 CST success: [k8s-master2]
14:04:37 CST success: [k8s-master3]
14:04:37 CST [ETCDConfigureModule] Refresh etcd.env config on all etcd
14:04:37 CST success: [k8s-master1]
14:04:37 CST success: [k8s-master2]
14:04:37 CST success: [k8s-master3]
14:04:37 CST [ETCDConfigureModule] Restart etcd
14:04:41 CST stdout: [k8s-master3]
Created symlink /etc/systemd/system/multi-user.target.wants/etcd.service → /etc/systemd/system/etcd.service.
14:04:41 CST stdout: [k8s-master2]
Created symlink /etc/systemd/system/multi-user.target.wants/etcd.service → /etc/systemd/system/etcd.service.
14:04:41 CST success: [k8s-master1]
14:04:41 CST success: [k8s-master3]
14:04:41 CST success: [k8s-master2]
14:04:41 CST [ETCDConfigureModule] Health check on all etcd
14:04:41 CST success: [k8s-master1]
14:04:41 CST success: [k8s-master2]
14:04:41 CST success: [k8s-master3]
14:04:41 CST [ETCDConfigureModule] Refresh etcd.env config to exist mode on all etcd
14:04:41 CST success: [k8s-master1]
14:04:41 CST success: [k8s-master2]
14:04:41 CST success: [k8s-master3]
14:04:41 CST [ETCDConfigureModule] Health check on all etcd
14:04:42 CST success: [k8s-master1]
14:04:42 CST success: [k8s-master3]
14:04:42 CST success: [k8s-master2]
14:04:42 CST [ETCDBackupModule] Backup etcd data regularly
14:04:42 CST success: [k8s-master1]
14:04:42 CST success: [k8s-master2]
14:04:42 CST success: [k8s-master3]
14:04:42 CST [ETCDBackupModule] Generate backup ETCD service
14:04:42 CST success: [k8s-master3]
14:04:42 CST success: [k8s-master2]
14:04:42 CST success: [k8s-master1]
14:04:42 CST [ETCDBackupModule] Generate backup ETCD timer
14:04:42 CST success: [k8s-master1]
14:04:42 CST success: [k8s-master2]
14:04:42 CST success: [k8s-master3]
14:04:42 CST [ETCDBackupModule] Enable backup etcd service
14:04:42 CST success: [k8s-master2]
14:04:42 CST success: [k8s-master3]
14:04:42 CST success: [k8s-master1]
14:04:42 CST [InstallKubeBinariesModule] Synchronize kubernetes binaries
14:04:49 CST success: [k8s-master1]
14:04:49 CST success: [k8s-master3]
14:04:49 CST success: [k8s-master2]
14:04:49 CST success: [k8s-work1]
14:04:49 CST [InstallKubeBinariesModule] Synchronize kubelet
14:04:49 CST success: [k8s-master3]
14:04:49 CST success: [k8s-work1]
14:04:49 CST success: [k8s-master2]
14:04:49 CST success: [k8s-master1]
14:04:49 CST [InstallKubeBinariesModule] Generate kubelet service
14:04:49 CST success: [k8s-master3]
14:04:49 CST success: [k8s-master1]
14:04:49 CST success: [k8s-master2]
14:04:49 CST success: [k8s-work1]
14:04:49 CST [InstallKubeBinariesModule] Enable kubelet service
14:04:50 CST success: [k8s-master2]
14:04:50 CST success: [k8s-master3]
14:04:50 CST success: [k8s-master1]
14:04:50 CST success: [k8s-work1]
14:04:50 CST [InstallKubeBinariesModule] Generate kubelet env
14:04:50 CST success: [k8s-master3]
14:04:50 CST success: [k8s-master1]
14:04:50 CST success: [k8s-master2]
14:04:50 CST success: [k8s-work1]
14:04:50 CST [InitKubernetesModule] Generate kubeadm config
14:04:50 CST skipped: [k8s-master3]
14:04:50 CST skipped: [k8s-master2]
14:04:50 CST success: [k8s-master1]
14:04:50 CST [InitKubernetesModule] Init cluster using kubeadm
14:05:03 CST stdout: [k8s-master1]
W0815 14:04:50.618361   25187 common.go:84] your configuration file uses a deprecated API spec: "kubeadm.k8s.io/v1beta2". Please use 'kubeadm config migrate --old-config old.yaml --new-config new.yaml', which will write the new, similar spec using a newer API version.
W0815 14:04:50.619774   25187 common.go:84] your configuration file uses a deprecated API spec: "kubeadm.k8s.io/v1beta2". Please use 'kubeadm config migrate --old-config old.yaml --new-config new.yaml', which will write the new, similar spec using a newer API version.
W0815 14:04:50.623136   25187 utils.go:69] The recommended value for "clusterDNS" in "KubeletConfiguration" is: [10.234.0.10]; the provided value is: [169.254.25.10]
[init] Using Kubernetes version: v1.24.9
[preflight] Running pre-flight checks
        [WARNING SystemVerification]: missing optional cgroups: blkio
[preflight] Pulling images required for setting up a Kubernetes cluster
[preflight] This might take a minute or two, depending on the speed of your internet connection
[preflight] You can also perform this action in beforehand using 'kubeadm config images pull'
[certs] Using certificateDir folder "/etc/kubernetes/pki"
[certs] Generating "ca" certificate and key
[certs] Generating "apiserver" certificate and key
[certs] apiserver serving cert is signed for DNS names [k8s-master1 k8s-master1.cluster.local k8s-master2 k8s-master2.cluster.local k8s-master3 k8s-master3.cluster.local k8s-work1 k8s-work1.cluster.local kubernetes kubernetes.default kubernetes.default.svc kubernetes.default.svc.cluster.local lb.kubesphere.local localhost] and IPs [10.234.0.1 192.168.1.212 127.0.0.1 192.168.1.141 192.168.1.126 192.168.1.19]
[certs] Generating "apiserver-kubelet-client" certificate and key
[certs] Generating "front-proxy-ca" certificate and key
[certs] Generating "front-proxy-client" certificate and key
[certs] External etcd mode: Skipping etcd/ca certificate authority generation
[certs] External etcd mode: Skipping etcd/server certificate generation
[certs] External etcd mode: Skipping etcd/peer certificate generation
[certs] External etcd mode: Skipping etcd/healthcheck-client certificate generation
[certs] External etcd mode: Skipping apiserver-etcd-client certificate generation
[certs] Generating "sa" key and public key
[kubeconfig] Using kubeconfig folder "/etc/kubernetes"
[kubeconfig] Writing "admin.conf" kubeconfig file
[kubeconfig] Writing "kubelet.conf" kubeconfig file
[kubeconfig] Writing "controller-manager.conf" kubeconfig file
[kubeconfig] Writing "scheduler.conf" kubeconfig file
[kubelet-start] Writing kubelet environment file with flags to file "/var/lib/kubelet/kubeadm-flags.env"
[kubelet-start] Writing kubelet configuration to file "/var/lib/kubelet/config.yaml"
[kubelet-start] Starting the kubelet
[control-plane] Using manifest folder "/etc/kubernetes/manifests"
[control-plane] Creating static Pod manifest for "kube-apiserver"
[control-plane] Creating static Pod manifest for "kube-controller-manager"
[control-plane] Creating static Pod manifest for "kube-scheduler"
[wait-control-plane] Waiting for the kubelet to boot up the control plane as static Pods from directory "/etc/kubernetes/manifests". This can take up to 4m0s
[apiclient] All control plane components are healthy after 8.005982 seconds
[upload-config] Storing the configuration used in ConfigMap "kubeadm-config" in the "kube-system" Namespace
[kubelet] Creating a ConfigMap "kubelet-config" in namespace kube-system with the configuration for the kubelets in the cluster
[upload-certs] Skipping phase. Please see --upload-certs
[mark-control-plane] Marking the node k8s-master1 as control-plane by adding the labels: [node-role.kubernetes.io/control-plane node.kubernetes.io/exclude-from-external-load-balancers]
[mark-control-plane] Marking the node k8s-master1 as control-plane by adding the taints [node-role.kubernetes.io/master:NoSchedule node-role.kubernetes.io/control-plane:NoSchedule]
[bootstrap-token] Using token: 25zv7h.9fjn1y1saobe3poz
[bootstrap-token] Configuring bootstrap tokens, cluster-info ConfigMap, RBAC Roles
[bootstrap-token] Configured RBAC rules to allow Node Bootstrap tokens to get nodes
[bootstrap-token] Configured RBAC rules to allow Node Bootstrap tokens to post CSRs in order for nodes to get long term certificate credentials
[bootstrap-token] Configured RBAC rules to allow the csrapprover controller automatically approve CSRs from a Node Bootstrap Token
[bootstrap-token] Configured RBAC rules to allow certificate rotation for all node client certificates in the cluster
[bootstrap-token] Creating the "cluster-info" ConfigMap in the "kube-public" namespace
[kubelet-finalize] Updating "/etc/kubernetes/kubelet.conf" to point to a rotatable kubelet client certificate and key
[addons] Applied essential addon: CoreDNS
[addons] Applied essential addon: kube-proxy

Your Kubernetes control-plane has initialized successfully!

To start using your cluster, you need to run the following as a regular user:

  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config

Alternatively, if you are the root user, you can run:

  export KUBECONFIG=/etc/kubernetes/admin.conf

You should now deploy a pod network to the cluster.
Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
  https://kubernetes.io/docs/concepts/cluster-administration/addons/

You can now join any number of control-plane nodes by copying certificate authorities
and service account keys on each node and then running the following as root:

  kubeadm join lb.kubesphere.local:6443 --token 25zv7h.9fjn1y1saobe3poz \
        --discovery-token-ca-cert-hash sha256:2eb407b72177e0c4cfadaafe193da3e3ceb4a0ce1a12d7162968afd784d17000 \
        --control-plane 

Then you can join any number of worker nodes by running the following on each as root:

kubeadm join lb.kubesphere.local:6443 --token 25zv7h.9fjn1y1saobe3poz \
        --discovery-token-ca-cert-hash sha256:2eb407b72177e0c4cfadaafe193da3e3ceb4a0ce1a12d7162968afd784d17000
14:05:03 CST skipped: [k8s-master3]
14:05:03 CST skipped: [k8s-master2]
14:05:03 CST success: [k8s-master1]
14:05:03 CST [InitKubernetesModule] Copy admin.conf to ~/.kube/config
14:05:03 CST skipped: [k8s-master3]
14:05:03 CST skipped: [k8s-master2]
14:05:03 CST success: [k8s-master1]
14:05:03 CST [InitKubernetesModule] Remove master taint
14:05:03 CST skipped: [k8s-master3]
14:05:03 CST skipped: [k8s-master1]
14:05:03 CST skipped: [k8s-master2]
14:05:03 CST [InitKubernetesModule] Add worker label
14:05:03 CST skipped: [k8s-master3]
14:05:03 CST skipped: [k8s-master1]
14:05:03 CST skipped: [k8s-master2]
14:05:03 CST [ClusterDNSModule] Generate coredns service
14:05:04 CST skipped: [k8s-master3]
14:05:04 CST skipped: [k8s-master2]
14:05:04 CST success: [k8s-master1]
14:05:04 CST [ClusterDNSModule] Override coredns service
14:05:04 CST stdout: [k8s-master1]
service "kube-dns" deleted
14:05:05 CST stdout: [k8s-master1]
service/coredns created
Warning: resource clusterroles/system:coredns is missing the kubectl.kubernetes.io/last-applied-configuration annotation which is required by kubectl apply. kubectl apply should only be used on resources created declaratively by either kubectl create --save-config or kubectl apply. The missing annotation will be patched automatically.
clusterrole.rbac.authorization.k8s.io/system:coredns configured
14:05:05 CST skipped: [k8s-master3]
14:05:05 CST skipped: [k8s-master2]
14:05:05 CST success: [k8s-master1]
14:05:05 CST [ClusterDNSModule] Generate nodelocaldns
14:05:05 CST skipped: [k8s-master3]
14:05:05 CST skipped: [k8s-master2]
14:05:05 CST success: [k8s-master1]
14:05:05 CST [ClusterDNSModule] Deploy nodelocaldns
14:05:05 CST stdout: [k8s-master1]
serviceaccount/nodelocaldns created
daemonset.apps/nodelocaldns created
14:05:05 CST skipped: [k8s-master3]
14:05:05 CST skipped: [k8s-master2]
14:05:05 CST success: [k8s-master1]
14:05:05 CST [ClusterDNSModule] Generate nodelocaldns configmap
14:05:05 CST skipped: [k8s-master3]
14:05:05 CST skipped: [k8s-master2]
14:05:05 CST success: [k8s-master1]
14:05:05 CST [ClusterDNSModule] Apply nodelocaldns configmap
14:05:05 CST stdout: [k8s-master1]
configmap/nodelocaldns created
14:05:05 CST skipped: [k8s-master3]
14:05:05 CST skipped: [k8s-master2]
14:05:05 CST success: [k8s-master1]
14:05:05 CST [KubernetesStatusModule] Get kubernetes cluster status
14:05:05 CST stdout: [k8s-master1]
v1.24.9
14:05:06 CST stdout: [k8s-master1]
k8s-master1   v1.24.9   [map[address:192.168.1.212 type:InternalIP] map[address:k8s-master1 type:Hostname]]
14:05:11 CST stdout: [k8s-master1]
I0815 14:05:08.942603   26108 version.go:255] remote version is much newer: v1.31.0; falling back to: stable-1.24
[upload-certs] Storing the certificates in Secret "kubeadm-certs" in the "kube-system" Namespace
[upload-certs] Using certificate key:
dae88af67ecd00665d5115428d05aaee62e5334b2f237942c357acbfda5485b4
14:05:11 CST stdout: [k8s-master1]
secret/kubeadm-certs patched
14:05:11 CST stdout: [k8s-master1]
secret/kubeadm-certs patched
14:05:11 CST stdout: [k8s-master1]
secret/kubeadm-certs patched
14:05:11 CST stdout: [k8s-master1]
ufk2gq.dasfb858grzyejdo
14:05:11 CST success: [k8s-master1]
14:05:11 CST success: [k8s-master2]
14:05:11 CST success: [k8s-master3]
14:05:11 CST [JoinNodesModule] Generate kubeadm config
14:05:12 CST skipped: [k8s-master1]
14:05:12 CST success: [k8s-master2]
14:05:12 CST success: [k8s-master3]
14:05:12 CST success: [k8s-work1]
14:05:12 CST [JoinNodesModule] Join control-plane node
14:05:34 CST stdout: [k8s-master3]
W0815 14:05:12.163240   19258 common.go:84] your configuration file uses a deprecated API spec: "kubeadm.k8s.io/v1beta2". Please use 'kubeadm config migrate --old-config old.yaml --new-config new.yaml', which will write the new, similar spec using a newer API version.
[preflight] Running pre-flight checks
        [WARNING SystemVerification]: missing optional cgroups: blkio
[preflight] Reading configuration from the cluster...
[preflight] FYI: You can look at this config file with 'kubectl -n kube-system get cm kubeadm-config -o yaml'
W0815 14:05:18.279531   19258 utils.go:69] The recommended value for "clusterDNS" in "KubeletConfiguration" is: [10.234.0.10]; the provided value is: [169.254.25.10]
[preflight] Running pre-flight checks before initializing the new control plane instance
[preflight] Pulling images required for setting up a Kubernetes cluster
[preflight] This might take a minute or two, depending on the speed of your internet connection
[preflight] You can also perform this action in beforehand using 'kubeadm config images pull'
[download-certs] Downloading the certificates in Secret "kubeadm-certs" in the "kube-system" Namespace
[certs] Using certificateDir folder "/etc/kubernetes/pki"
[certs] Generating "front-proxy-client" certificate and key
[certs] Generating "apiserver" certificate and key
[certs] apiserver serving cert is signed for DNS names [k8s-master1 k8s-master1.cluster.local k8s-master2 k8s-master2.cluster.local k8s-master3 k8s-master3.cluster.local k8s-work1 k8s-work1.cluster.local kubernetes kubernetes.default kubernetes.default.svc kubernetes.default.svc.cluster.local lb.kubesphere.local localhost] and IPs [10.234.0.1 192.168.1.126 127.0.0.1 192.168.1.212 192.168.1.141 192.168.1.19]
[certs] Generating "apiserver-kubelet-client" certificate and key
[certs] Valid certificates and keys now exist in "/etc/kubernetes/pki"
[certs] Using the existing "sa" key
[kubeconfig] Generating kubeconfig files
[kubeconfig] Using kubeconfig folder "/etc/kubernetes"
[kubeconfig] Writing "admin.conf" kubeconfig file
[kubeconfig] Writing "controller-manager.conf" kubeconfig file
[kubeconfig] Writing "scheduler.conf" kubeconfig file
[control-plane] Using manifest folder "/etc/kubernetes/manifests"
[control-plane] Creating static Pod manifest for "kube-apiserver"
[control-plane] Creating static Pod manifest for "kube-controller-manager"
[control-plane] Creating static Pod manifest for "kube-scheduler"
[check-etcd] Skipping etcd check in external mode
[kubelet-start] Writing kubelet configuration to file "/var/lib/kubelet/config.yaml"
[kubelet-start] Writing kubelet environment file with flags to file "/var/lib/kubelet/kubeadm-flags.env"
[kubelet-start] Starting the kubelet
[kubelet-start] Waiting for the kubelet to perform the TLS Bootstrap...
[control-plane-join] Using external etcd - no local stacked instance added
The 'update-status' phase is deprecated and will be removed in a future release. Currently it performs no operation
[mark-control-plane] Marking the node k8s-master3 as control-plane by adding the labels: [node-role.kubernetes.io/control-plane node.kubernetes.io/exclude-from-external-load-balancers]
[mark-control-plane] Marking the node k8s-master3 as control-plane by adding the taints [node-role.kubernetes.io/master:NoSchedule node-role.kubernetes.io/control-plane:NoSchedule]

This node has joined the cluster and a new control plane instance was created:

* Certificate signing request was sent to apiserver and approval was received.
* The Kubelet was informed of the new secure connection details.
* Control plane label and taint were applied to the new node.
* The Kubernetes control plane instances scaled up.


To start administering your cluster from this node, you need to run the following as a regular user:

        mkdir -p $HOME/.kube
        sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
        sudo chown $(id -u):$(id -g) $HOME/.kube/config

Run 'kubectl get nodes' to see this node join the cluster.
14:05:35 CST stdout: [k8s-master2]
W0815 14:05:12.162729   19323 common.go:84] your configuration file uses a deprecated API spec: "kubeadm.k8s.io/v1beta2". Please use 'kubeadm config migrate --old-config old.yaml --new-config new.yaml', which will write the new, similar spec using a newer API version.
[preflight] Running pre-flight checks
        [WARNING SystemVerification]: missing optional cgroups: blkio
[preflight] Reading configuration from the cluster...
[preflight] FYI: You can look at this config file with 'kubectl -n kube-system get cm kubeadm-config -o yaml'
W0815 14:05:18.282268   19323 utils.go:69] The recommended value for "clusterDNS" in "KubeletConfiguration" is: [10.234.0.10]; the provided value is: [169.254.25.10]
[preflight] Running pre-flight checks before initializing the new control plane instance
[preflight] Pulling images required for setting up a Kubernetes cluster
[preflight] This might take a minute or two, depending on the speed of your internet connection
[preflight] You can also perform this action in beforehand using 'kubeadm config images pull'
[download-certs] Downloading the certificates in Secret "kubeadm-certs" in the "kube-system" Namespace
[certs] Using certificateDir folder "/etc/kubernetes/pki"
[certs] Generating "front-proxy-client" certificate and key
[certs] Generating "apiserver" certificate and key
[certs] apiserver serving cert is signed for DNS names [k8s-master1 k8s-master1.cluster.local k8s-master2 k8s-master2.cluster.local k8s-master3 k8s-master3.cluster.local k8s-work1 k8s-work1.cluster.local kubernetes kubernetes.default kubernetes.default.svc kubernetes.default.svc.cluster.local lb.kubesphere.local localhost] and IPs [10.234.0.1 192.168.1.141 127.0.0.1 192.168.1.212 192.168.1.126 192.168.1.19]
[certs] Generating "apiserver-kubelet-client" certificate and key
[certs] Valid certificates and keys now exist in "/etc/kubernetes/pki"
[certs] Using the existing "sa" key
[kubeconfig] Generating kubeconfig files
[kubeconfig] Using kubeconfig folder "/etc/kubernetes"
[kubeconfig] Writing "admin.conf" kubeconfig file
[kubeconfig] Writing "controller-manager.conf" kubeconfig file
[kubeconfig] Writing "scheduler.conf" kubeconfig file
[control-plane] Using manifest folder "/etc/kubernetes/manifests"
[control-plane] Creating static Pod manifest for "kube-apiserver"
[control-plane] Creating static Pod manifest for "kube-controller-manager"
[control-plane] Creating static Pod manifest for "kube-scheduler"
[check-etcd] Skipping etcd check in external mode
[kubelet-start] Writing kubelet configuration to file "/var/lib/kubelet/config.yaml"
[kubelet-start] Writing kubelet environment file with flags to file "/var/lib/kubelet/kubeadm-flags.env"
[kubelet-start] Starting the kubelet
[kubelet-start] Waiting for the kubelet to perform the TLS Bootstrap...
[control-plane-join] Using external etcd - no local stacked instance added
The 'update-status' phase is deprecated and will be removed in a future release. Currently it performs no operation
[mark-control-plane] Marking the node k8s-master2 as control-plane by adding the labels: [node-role.kubernetes.io/control-plane node.kubernetes.io/exclude-from-external-load-balancers]
[mark-control-plane] Marking the node k8s-master2 as control-plane by adding the taints [node-role.kubernetes.io/master:NoSchedule node-role.kubernetes.io/control-plane:NoSchedule]

This node has joined the cluster and a new control plane instance was created:

* Certificate signing request was sent to apiserver and approval was received.
* The Kubelet was informed of the new secure connection details.
* Control plane label and taint were applied to the new node.
* The Kubernetes control plane instances scaled up.


To start administering your cluster from this node, you need to run the following as a regular user:

        mkdir -p $HOME/.kube
        sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
        sudo chown $(id -u):$(id -g) $HOME/.kube/config

Run 'kubectl get nodes' to see this node join the cluster.
14:05:35 CST skipped: [k8s-master1]
14:05:35 CST success: [k8s-master3]
14:05:35 CST success: [k8s-master2]
14:05:35 CST [JoinNodesModule] Join worker node
14:05:49 CST stdout: [k8s-work1]
W0815 14:05:35.593466   18028 common.go:84] your configuration file uses a deprecated API spec: "kubeadm.k8s.io/v1beta2". Please use 'kubeadm config migrate --old-config old.yaml --new-config new.yaml', which will write the new, similar spec using a newer API version.
[preflight] Running pre-flight checks
        [WARNING SystemVerification]: missing optional cgroups: blkio
[preflight] Reading configuration from the cluster...
[preflight] FYI: You can look at this config file with 'kubectl -n kube-system get cm kubeadm-config -o yaml'
W0815 14:05:35.792022   18028 utils.go:69] The recommended value for "clusterDNS" in "KubeletConfiguration" is: [10.234.0.10]; the provided value is: [169.254.25.10]
[kubelet-start] Writing kubelet configuration to file "/var/lib/kubelet/config.yaml"
[kubelet-start] Writing kubelet environment file with flags to file "/var/lib/kubelet/kubeadm-flags.env"
[kubelet-start] Starting the kubelet
[kubelet-start] Waiting for the kubelet to perform the TLS Bootstrap...

This node has joined the cluster:
* Certificate signing request was sent to apiserver and a response was received.
* The Kubelet was informed of the new secure connection details.

Run 'kubectl get nodes' on the control-plane to see this node join the cluster.
14:05:49 CST success: [k8s-work1]
14:05:49 CST [JoinNodesModule] Copy admin.conf to ~/.kube/config
14:05:49 CST skipped: [k8s-master1]
14:05:49 CST success: [k8s-master2]
14:05:49 CST success: [k8s-master3]
14:05:49 CST [JoinNodesModule] Remove master taint
14:05:49 CST skipped: [k8s-master1]
14:05:49 CST skipped: [k8s-master3]
14:05:49 CST skipped: [k8s-master2]
14:05:49 CST [JoinNodesModule] Add worker label to master
14:05:49 CST skipped: [k8s-master3]
14:05:49 CST skipped: [k8s-master1]
14:05:49 CST skipped: [k8s-master2]
14:05:49 CST [JoinNodesModule] Synchronize kube config to worker
14:05:49 CST success: [k8s-work1]
14:05:49 CST [JoinNodesModule] Add worker label to worker
14:05:50 CST stdout: [k8s-work1]
node/k8s-work1 labeled
14:05:50 CST success: [k8s-work1]
14:05:50 CST [DeployNetworkPluginModule] Generate calico
14:05:50 CST skipped: [k8s-master3]
14:05:50 CST skipped: [k8s-master2]
14:05:50 CST success: [k8s-master1]
14:05:50 CST [DeployNetworkPluginModule] Deploy calico
14:05:50 CST stdout: [k8s-master1]
configmap/calico-config created
customresourcedefinition.apiextensions.k8s.io/bgpconfigurations.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/bgppeers.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/blockaffinities.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/caliconodestatuses.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/clusterinformations.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/felixconfigurations.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/globalnetworkpolicies.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/globalnetworksets.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/hostendpoints.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/ipamblocks.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/ipamconfigs.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/ipamhandles.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/ippools.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/ipreservations.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/kubecontrollersconfigurations.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/networkpolicies.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/networksets.crd.projectcalico.org created
clusterrole.rbac.authorization.k8s.io/calico-kube-controllers created
clusterrolebinding.rbac.authorization.k8s.io/calico-kube-controllers created
clusterrole.rbac.authorization.k8s.io/calico-node created
clusterrolebinding.rbac.authorization.k8s.io/calico-node created
daemonset.apps/calico-node created
serviceaccount/calico-node created
deployment.apps/calico-kube-controllers created
serviceaccount/calico-kube-controllers created
poddisruptionbudget.policy/calico-kube-controllers created
14:05:50 CST skipped: [k8s-master3]
14:05:50 CST skipped: [k8s-master2]
14:05:50 CST success: [k8s-master1]
14:05:50 CST [ConfigureKubernetesModule] Configure kubernetes
14:05:50 CST success: [k8s-work1]
14:05:50 CST success: [k8s-master2]
14:05:50 CST success: [k8s-master1]
14:05:50 CST success: [k8s-master3]
14:05:50 CST [ChownModule] Chown user $HOME/.kube dir
14:05:50 CST success: [k8s-master2]
14:05:50 CST success: [k8s-master1]
14:05:50 CST success: [k8s-master3]
14:05:50 CST success: [k8s-work1]
14:05:50 CST [AutoRenewCertsModule] Generate k8s certs renew script
14:05:50 CST success: [k8s-master2]
14:05:50 CST success: [k8s-master1]
14:05:50 CST success: [k8s-master3]
14:05:50 CST [AutoRenewCertsModule] Generate k8s certs renew service
14:05:51 CST success: [k8s-master2]
14:05:51 CST success: [k8s-master1]
14:05:51 CST success: [k8s-master3]
14:05:51 CST [AutoRenewCertsModule] Generate k8s certs renew timer
14:05:51 CST success: [k8s-master1]
14:05:51 CST success: [k8s-master2]
14:05:51 CST success: [k8s-master3]
14:05:51 CST [AutoRenewCertsModule] Enable k8s certs renew service
14:05:51 CST success: [k8s-master2]
14:05:51 CST success: [k8s-master3]
14:05:51 CST success: [k8s-master1]
14:05:51 CST [SaveKubeConfigModule] Save kube config as a configmap
14:05:51 CST success: [LocalHost]
14:05:51 CST [AddonsModule] Install addons
14:05:51 CST success: [LocalHost]
14:05:51 CST Pipeline[CreateClusterPipeline] execute successfully
Installation is complete.

Please check the result using the command:

        kubectl get pod -A

root@k8s-master1:~# kubectl get pod -A
NAMESPACE     NAME                                      READY   STATUS                            RESTARTS   AGE
kube-system   calico-kube-controllers-f9f9bbcc9-qxw57   0/1     Pending                           0          11s
kube-system   calico-node-452rj                         0/1     Running                           0          11s
kube-system   calico-node-75g6s                         0/1     Init:CreateContainerConfigError   0          11s
kube-system   calico-node-8cjvw                         0/1     Running                           0          11s
kube-system   calico-node-tfdzk                         0/1     Running                           0          11s
kube-system   coredns-f657fccfd-8vpvg                   0/1     Pending                           0          45s
kube-system   coredns-f657fccfd-97prb                   0/1     Pending                           0          45s
kube-system   kube-apiserver-k8s-master1                1/1     Running                           0          57s
kube-system   kube-apiserver-k8s-master2                1/1     Running                           0          20s
kube-system   kube-apiserver-k8s-master3                1/1     Running                           0          22s
kube-system   kube-controller-manager-k8s-master1       1/1     Running                           0          60s
kube-system   kube-controller-manager-k8s-master2       1/1     Running                           0          21s
kube-system   kube-proxy-bpnpz                          1/1     Running                           0          28s
kube-system   kube-proxy-cxxn4                          1/1     Running                           0          27s
kube-system   kube-proxy-gkjtb                          1/1     Running                           0          45s
kube-system   kube-proxy-v2tdw                          0/1     CreateContainerConfigError        0          12s
kube-system   kube-scheduler-k8s-master1                1/1     Running                           0          60s
kube-system   kube-scheduler-k8s-master2                1/1     Running                           0          23s
kube-system   nodelocaldns-5tglw                        1/1     Running                           0          45s
kube-system   nodelocaldns-qdgqq                        1/1     Running                           0          27s
kube-system   nodelocaldns-tr5zj                        1/1     Running                           0          28s
kube-system   nodelocaldns-wrp6d                        1/1     Running                           0          12s
root@k8s-master1:~# kubectl get pod -A
NAMESPACE     NAME                                      READY   STATUS              RESTARTS   AGE
kube-system   calico-kube-controllers-f9f9bbcc9-qxw57   0/1     ContainerCreating   0          30s
kube-system   calico-node-452rj                         0/1     Running             0          30s
kube-system   calico-node-75g6s                         0/1     Running             0          30s
kube-system   calico-node-8cjvw                         0/1     Running             0          30s
kube-system   calico-node-tfdzk                         0/1     Running             0          30s
kube-system   coredns-f657fccfd-8vpvg                   1/1     Running             0          64s
kube-system   coredns-f657fccfd-97prb                   1/1     Running             0          64s
kube-system   kube-apiserver-k8s-master1                1/1     Running             0          76s
kube-system   kube-apiserver-k8s-master2                1/1     Running             0          39s
kube-system   kube-apiserver-k8s-master3                1/1     Running             0          41s
kube-system   kube-controller-manager-k8s-master1       1/1     Running             0          79s
kube-system   kube-controller-manager-k8s-master2       1/1     Running             0          40s
kube-system   kube-proxy-bpnpz                          1/1     Running             0          47s
kube-system   kube-proxy-cxxn4                          1/1     Running             0          46s
kube-system   kube-proxy-gkjtb                          1/1     Running             0          64s
kube-system   kube-proxy-v2tdw                          1/1     Running             0          31s
kube-system   kube-scheduler-k8s-master1                1/1     Running             0          79s
kube-system   kube-scheduler-k8s-master2                1/1     Running             0          42s
kube-system   nodelocaldns-5tglw                        1/1     Running             0          64s
kube-system   nodelocaldns-qdgqq                        1/1     Running             0          46s
kube-system   nodelocaldns-tr5zj                        1/1     Running             0          47s
kube-system   nodelocaldns-wrp6d                        1/1     Running             0          31s
root@k8s-master1:~# kubectl get nodes
NAME          STATUS   ROLES           AGE   VERSION
k8s-master1   Ready    control-plane   89s   v1.24.9
k8s-master2   Ready    control-plane   54s   v1.24.9
k8s-master3   Ready    control-plane   55s   v1.24.9
k8s-work1     Ready    worker          39s   v1.24.9
root@k8s-master1:~# kubectl get cs   
Warning: v1 ComponentStatus is deprecated in v1.19+
NAME                 STATUS    MESSAGE             ERROR
controller-manager   Healthy   ok  
scheduler            Healthy   ok  
etcd-0               Healthy   {"health":"true"}   
etcd-1               Healthy   {"health":"true"}   
etcd-2               Healthy   {"health":"true"}   
root@k8s-master1:~# 
```

##### 验证集群已正确安装

```bash
root@k8s-master1:~# kubectl get cs   
Warning: v1 ComponentStatus is deprecated in v1.19+
NAME                 STATUS    MESSAGE             ERROR
controller-manager   Healthy   ok  
scheduler            Healthy   ok  
etcd-0               Healthy   {"health":"true"}   
etcd-1               Healthy   {"health":"true"}   
etcd-2               Healthy   {"health":"true"}   
root@k8s-master1:~# kubectl get nodes -owide
NAME          STATUS   ROLES           AGE     VERSION   INTERNAL-IP       EXTERNAL-IP   OS-IMAGE             KERNEL-VERSION       CONTAINER-RUNTIME
k8s-master1   Ready    control-plane   6m44s   v1.24.9   192.168.1.212   <none>        Ubuntu 22.04.4 LTS   5.15.0-118-generic   containerd://1.6.4
k8s-master2   Ready    control-plane   6m9s    v1.24.9   192.168.1.141   <none>        Ubuntu 22.04.4 LTS   5.15.0-118-generic   containerd://1.6.4
k8s-master3   Ready    control-plane   6m10s   v1.24.9   192.168.1.126   <none>        Ubuntu 22.04.4 LTS   5.15.0-118-generic   containerd://1.6.4
k8s-work1     Ready    worker          5m54s   v1.24.9   192.168.1.19    <none>        Ubuntu 22.04.4 LTS   5.15.0-118-generic   containerd://1.6.4
root@k8s-master1:~# kubectl get pods -A  | sort -k 8
NAMESPACE     NAME                                      READY   STATUS    RESTARTS   AGE
kube-system   calico-kube-controllers-f9f9bbcc9-qxw57   1/1     Running   0          28m
kube-system   calico-node-452rj                         1/1     Running   0          28m
kube-system   calico-node-75g6s                         1/1     Running   0          28m
kube-system   calico-node-8cjvw                         1/1     Running   0          28m
kube-system   calico-node-tfdzk                         1/1     Running   0          28m
kube-system   coredns-f657fccfd-8vpvg                   1/1     Running   0          29m
kube-system   coredns-f657fccfd-97prb                   1/1     Running   0          29m
kube-system   kube-apiserver-k8s-master1                1/1     Running   0          29m
kube-system   kube-apiserver-k8s-master2                1/1     Running   0          29m
kube-system   kube-apiserver-k8s-master3                1/1     Running   0          29m
kube-system   kube-controller-manager-k8s-master1       1/1     Running   0          29m
kube-system   kube-controller-manager-k8s-master2       1/1     Running   0          29m
kube-system   kube-controller-manager-k8s-master3       1/1     Running   0          27m
kube-system   kube-proxy-bpnpz                          1/1     Running   0          29m
kube-system   kube-proxy-cxxn4                          1/1     Running   0          29m
kube-system   kube-proxy-gkjtb                          1/1     Running   0          29m
kube-system   kube-proxy-v2tdw                          1/1     Running   0          28m
kube-system   kube-scheduler-k8s-master1                1/1     Running   0          29m
kube-system   kube-scheduler-k8s-master2                1/1     Running   0          29m
kube-system   kube-scheduler-k8s-master3                1/1     Running   0          28m
kube-system   nodelocaldns-5tglw                        1/1     Running   0          29m
kube-system   nodelocaldns-qdgqq                        1/1     Running   0          29m
kube-system   nodelocaldns-tr5zj                        1/1     Running   0          29m
kube-system   nodelocaldns-wrp6d                        1/1     Running   0          28m
```

##### 让两个master节点参与调度

```bash
root@k8s-master1:~# kubectl taint nodes k8s-master3 node-role.kubernetes.io/master:NoSchedule-
node/k8s-master3 untainted
root@k8s-master1:~# kubectl taint nodes k8s-master2 node-role.kubernetes.io/master:NoSchedule-
node/k8s-master2 untainted
root@k8s-master1:~/traefik# kubectl taint nodes k8s-master3 node-role.kubernetes.io/control-plane:NoSchedule- 
node/k8s-master3 untainted
root@k8s-master1:~/traefik# kubectl taint nodes k8s-master2 node-role.kubernetes.io/control-plane:NoSchedule-
node/k8s-master2 untainted
```

##### 测试集群网络

###### POD1

```bash
root@k8s-master1:~# kubectl run -it busybox1 --rm  --image=docker.llody.cn/llody/busybox-tools:v20240409 --restart=Never --port=5201  /bin/sh
If you don't see a command prompt, try pressing enter.
/ # ifconfig
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1480
        inet 10.233.69.2  netmask 255.255.255.255  broadcast 0.0.0.0
        inet6 fe80::d08a:a2ff:fe36:fa56  prefixlen 64  scopeid 0x20<link>
        ether d2:8a:a2:36:fa:56  txqueuelen 0  (Ethernet)
        RX packets 5  bytes 446 (446.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 9  bytes 726 (726.0 B)
        TX errors 0  dropped 1 overruns 0  carrier 0  collisions 0

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 0  bytes 0 (0.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

/ # iperf3 -s
-----------------------------------------------------------
Server listening on 5201 (test #1)
-----------------------------------------------------------
Accepted connection from 10.233.69.3, port 33662
[  5] local 10.233.69.2 port 5201 connected to 10.233.69.3 port 33672
[ ID] Interval           Transfer     Bitrate
[  5]   0.00-1.00   sec  2.31 GBytes  19.8 Gbits/sec    
[  5]   1.00-2.00   sec  2.37 GBytes  20.3 Gbits/sec    
[  5]   2.00-3.00   sec  2.28 GBytes  19.6 Gbits/sec    
[  5]   3.00-4.00   sec  2.27 GBytes  19.5 Gbits/sec    
[  5]   4.00-5.00   sec  2.29 GBytes  19.7 Gbits/sec    
[  5]   5.00-6.00   sec  2.34 GBytes  20.1 Gbits/sec    
[  5]   6.00-7.00   sec  2.34 GBytes  20.1 Gbits/sec    
[  5]   7.00-8.00   sec  2.35 GBytes  20.2 Gbits/sec    
[  5]   8.00-9.00   sec  2.41 GBytes  20.7 Gbits/sec    
[  5]   9.00-10.00  sec  2.42 GBytes  20.8 Gbits/sec    
- - - - - - - - - - - - - - - - - - - - - - - - -
[ ID] Interval           Transfer     Bitrate
[  5]   0.00-10.00  sec  23.4 GBytes  20.1 Gbits/sec                  receiver
-----------------------------------------------------------
Server listening on 5201 (test #2)
-----------------------------------------------------------
^Ciperf3: interrupt - the server has terminated
/ # 
```

###### POD2

```bash
root@k8s-master2:~# kubectl run -it busybox2 --rm  --image=docker.llody.cn/llody/busybox-tools:v20240409 --restart=Never /bin/sh
If you don't see a command prompt, try pressing enter.
/ # ifconfig
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1480
        inet 10.233.69.3  netmask 255.255.255.255  broadcast 0.0.0.0
        inet6 fe80::5814:f7ff:fe8c:67bd  prefixlen 64  scopeid 0x20<link>
        ether 5a:14:f7:8c:67:bd  txqueuelen 0  (Ethernet)
        RX packets 5  bytes 446 (446.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 6  bytes 516 (516.0 B)
        TX errors 0  dropped 1 overruns 0  carrier 0  collisions 0

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 0  bytes 0 (0.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

/ # iperf3 -c 10.233.69.2
Connecting to host 10.233.69.2, port 5201
[  5] local 10.233.69.3 port 33672 connected to 10.233.69.2 port 5201
[ ID] Interval           Transfer     Bitrate         Retr  Cwnd
[  5]   0.00-1.00   sec  2.31 GBytes  19.8 Gbits/sec    0    377 KBytes   
[  5]   1.00-2.00   sec  2.37 GBytes  20.3 Gbits/sec    0    615 KBytes   
[  5]   2.00-3.00   sec  2.28 GBytes  19.6 Gbits/sec    0    615 KBytes   
[  5]   3.00-4.00   sec  2.24 GBytes  19.2 Gbits/sec    0    615 KBytes   
[  5]   4.00-5.00   sec  2.28 GBytes  19.6 Gbits/sec    0    615 KBytes   
[  5]   5.00-6.00   sec  2.30 GBytes  19.7 Gbits/sec    0    615 KBytes   
[  5]   6.00-7.00   sec  2.29 GBytes  19.7 Gbits/sec    0    615 KBytes   
[  5]   7.00-8.00   sec  2.30 GBytes  19.8 Gbits/sec    0    647 KBytes   
[  5]   8.00-9.00   sec  2.29 GBytes  19.6 Gbits/sec    0    647 KBytes   
[  5]   9.00-10.00  sec  2.36 GBytes  20.3 Gbits/sec    0    647 KBytes   
- - - - - - - - - - - - - - - - - - - - - - - - -
[ ID] Interval           Transfer     Bitrate         Retr
[  5]   0.00-10.00  sec  23.4 GBytes  20.1 Gbits/sec    0             sender
[  5]   0.00-10.00  sec  23.4 GBytes  20.1 Gbits/sec                  receiver

iperf Done.
/ # uname -a
Linux busybox2 5.15.0-118-generic #128-Ubuntu SMP Fri Jul 5 09:30:28 UTC 2024 aarch64 Linux
/ # 
```

##### 设置自动补全

```bash
# 安装 bash-completion
apt-get install bash-completion
# 重新加载kubectl
source /usr/share/bash-completion/bash_completion;source <(kubectl completion bash)
```

##### **待测试项**

> [!WARNING]
>
> 本次实验并未**测试**节点新增与删除，如有道友测试完成，可与我联系补充。

###### 扩容master

> 建议使用kubeadm,不建议使用kk扩容etcd。

###### 扩容work

```bash
./kk add nodes -f config-sample.yaml
```

> 将新节点的信息添加到集群配置文件，然后应用更改

###### 删除节点

```bash
./kk delete node <nodeName> -f config-sample.yaml
```

> 通过以下命令删除节点，nodename指需要删除的节点名。

###### 删除集群

```bash
./kk delete cluster -f config-sample.yaml
```

###### 集群升级

```bash
./kk upgrade --with-kubernetes 指定kubernetes目标版本  -f config-sample.yaml
```

### Containerd修改默认存储路径(可选但建议)

#### 创建迁移目录

```bash
root@k8s-work1:~# mkdir -p /data/docker
```

#### 停止containerd服务

```bash
root@k8s-work1:~# systemctl  stop containerd.service
root@k8s-work1:~# systemctl  status containerd.service
```

> 可以看到待迁移的节点已经停止运行了：
>
> root@k8s-master1:~# kubectl get nodes
> NAME          STATUS     ROLES           AGE    VERSION
> k8s-master1   Ready      control-plane   119m   v1.24.9
> k8s-master2   Ready      control-plane   119m   v1.24.9
> k8s-master3   Ready      control-plane   119m   v1.24.9
> k8s-work1     NotReady   worker          118m   v1.24.9

#### 修改config.toml中的root的路径为你想迁移的路径

```bash
root@k8s-work1:~# vim /etc/containerd/config.toml
```

```bash
#root = "/var/lib/containerd"
root = "/data/docker/containerd/"
```

#### 将原目录移动到指定目录下

```bash
root@k8s-work1:~# mv /var/lib/containerd /data/docker/
```

##### 确认路径下的目录文件是否有数据

```bash
root@k8s-work1:~# ls -lah /data/docker/containerd/
total 44K
drwx--x--x 11 root root 4.0K Aug 15 14:05 .
drwxr-xr-x  3 root root 4.0K Aug 15 16:08 ..
drwxr-xr-x  4 root root 4.0K Aug 15 13:41 io.containerd.content.v1.content
drwxr-xr-x  4 root root 4.0K Aug 15 14:05 io.containerd.grpc.v1.cri
drwx--x--x  2 root root 4.0K Aug 15 13:41 io.containerd.metadata.v1.bolt
drwx--x--x  2 root root 4.0K Aug 15 13:41 io.containerd.runtime.v1.linux
drwx--x--x  3 root root 4.0K Aug 15 14:05 io.containerd.runtime.v2.task
drwx------  2 root root 4.0K Aug 15 13:41 io.containerd.snapshotter.v1.btrfs
drwx------  3 root root 4.0K Aug 15 13:41 io.containerd.snapshotter.v1.native
drwx------  3 root root 4.0K Aug 15 13:41 io.containerd.snapshotter.v1.overlayfs
drwx------  2 root root 4.0K Aug 15 15:10 tmpmounts
```

#### 重启containerd服务

```bash
root@k8s-work1:~# systemctl daemon-reload 
root@k8s-work1:~# systemctl restart containerd.service 
root@k8s-work1:~# systemctl status containerd.service 
● containerd.service - containerd container runtime
     Loaded: loaded (/etc/systemd/system/containerd.service; enabled; vendor preset: enabled)
     Active: active (running) since Thu 2024-08-15 16:11:51 CST; 6s ago
       Docs: https://containerd.io
    Process: 61581 ExecStartPre=/sbin/modprobe overlay (code=exited, status=0/SUCCESS)
   Main PID: 61582 (containerd)
      Tasks: 74
     Memory: 70.3M
        CPU: 230ms
     CGroup: /system.slice/containerd.service
             ├─18290 /usr/bin/containerd-shim-runc-v2 -namespace k8s.io -id bf9c3f40c1e369f1b040b1a2a3016c746ae8c9f352a0d918aacac56f95502fae -address /run/conta>
             ├─18330 /usr/bin/containerd-shim-runc-v2 -namespace k8s.io -id a5f9a47f1893855e05db33223b0913f03f9abda3089a15dfc0cb5363647fe342 -address /run/conta>
             ├─18370 /usr/bin/containerd-shim-runc-v2 -namespace k8s.io -id b1308f16147331a5f3bad552e724699139b27547e181170b3e12d75504d28065 -address /run/conta>
             ├─19504 /usr/bin/containerd-shim-runc-v2 -namespace k8s.io -id ca226602879114cfee84993781fd060ebfc4e60b1e9f6ee3470209b4484bd4a8 -address /run/conta>
             └─61582 /usr/bin/containerd

Aug 15 16:11:51 k8s-work1 containerd[61582]: time="2024-08-15T16:11:51.796150234+08:00" level=info msg="Start subscribing containerd event"
Aug 15 16:11:51 k8s-work1 containerd[61582]: time="2024-08-15T16:11:51.796257375+08:00" level=info msg="Start recovering state"
Aug 15 16:11:51 k8s-work1 containerd[61582]: time="2024-08-15T16:11:51.796332115+08:00" level=info msg=serving... address=/run/containerd/containerd.sock.ttrpc
Aug 15 16:11:51 k8s-work1 containerd[61582]: time="2024-08-15T16:11:51.796417096+08:00" level=info msg=serving... address=/run/containerd/containerd.sock
Aug 15 16:11:51 k8s-work1 containerd[61582]: time="2024-08-15T16:11:51.796497707+08:00" level=info msg="containerd successfully booted in 0.044131s"
Aug 15 16:11:51 k8s-work1 systemd[1]: Started containerd container runtime.
Aug 15 16:11:51 k8s-work1 containerd[61582]: time="2024-08-15T16:11:51.861338548+08:00" level=info msg="Start event monitor"
Aug 15 16:11:51 k8s-work1 containerd[61582]: time="2024-08-15T16:11:51.861395888+08:00" level=info msg="Start snapshots syncer"
Aug 15 16:11:51 k8s-work1 containerd[61582]: time="2024-08-15T16:11:51.861416928+08:00" level=info msg="Start cni network conf syncer for default"
Aug 15 16:11:51 k8s-work1 containerd[61582]: time="2024-08-15T16:11:51.861429198+08:00" level=info msg="Start streaming server"
```

#### 查看集群节点是否恢复

```bash
root@k8s-master1:~# kubectl get nodes
NAME          STATUS   ROLES           AGE    VERSION
k8s-master1   Ready    control-plane   128m   v1.24.9
k8s-master2   Ready    control-plane   128m   v1.24.9
k8s-master3   Ready    control-plane   128m   v1.24.9
k8s-work1     Ready    worker          127m   v1.24.9
```

> 其余节点如果要修改，重复此流程。

### Containerd配置镜像加速

#### 配置多个加速地址

```bash
vim /etc/containerd/config.toml
```

```bash
[plugins."io.containerd.grpc.v1.cri".registry]
      [plugins."io.containerd.grpc.v1.cri".registry.mirrors]
        [plugins."io.containerd.grpc.v1.cri".registry.mirrors."docker.io"]
          endpoint = ["https://registry-1.docker.io","https://docker.llody.cn"]
```

### 总结

> 1、本次部署还算顺利失败了一次，重新来过就好了。
>
> 2、经过测试发现同一个应用，在国产化系统下内存占用增加了。
>
> 3、后续会完善应用部署在国产化系统上的部署与应用，**如有帮助，欢迎关注。**
