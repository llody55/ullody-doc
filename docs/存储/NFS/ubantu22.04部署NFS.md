## 安装nfs服务

```bash
apt update
apt install nfs-kernel-server
```

## 创建存储目录

```bash
mkdir -p /data/nfs/k8s
```

## 修改配置文件

```bash
vim /etc/exports
/data/nfs/k8s *(rw,no_root_squash,no_all_squash,sync)
```

## 重动服务

```bash
systemctl start nfs-kernel-server
systemctl enable nfs-kernel-server
```

## 服务端测试

```bash
# 应用导出配置
root@k8s-work1:~# exportfs -ra
exportfs: /etc/exports [1]: Neither 'subtree_check' or 'no_subtree_check' specified for export "*:/lgdata/nfs/k8s".
  Assuming default behaviour ('no_subtree_check').
  NOTE: this default has changed since nfs-utils version 1.0.x

# 检查 NFS 导出的状态
root@k8s-work1:~# exportfs -v
/data/nfs/k8s
                <world>(sync,wdelay,hide,no_subtree_check,sec=sys,rw,secure,no_root_squash,no_all_squash)

root@k8s-work1:~# showmount -e 192.168.174.19
Export list for 192.168.174.19:
/data/nfs/k8s *
```

## 客户端安装

```bash
apt install nfs-common -y
```

## 客户端测试

```bash
root@k8s-master1:~# showmount -e 192.168.174.19
Export list for 192.168.174.19:
/data/nfs/k8s *
```

## K8S部署

编写

```bash
root@k8s-master1:~# kubectl apply -f nfs/class.yaml 
storageclass.storage.k8s.io/managed-nfs-storage created
root@k8s-master1:~# kubectl apply -f nfs/rbac.yaml 
clusterrole.rbac.authorization.k8s.io/nfs-client-provisioner-runner created
clusterrolebinding.rbac.authorization.k8s.io/run-nfs-client-provisioner created
role.rbac.authorization.k8s.io/leader-locking-nfs-client-provisioner created
rolebinding.rbac.authorization.k8s.io/leader-locking-nfs-client-provisioner created
root@k8s-master1:~# kubectl apply -f nfs/deployment.yaml 
serviceaccount/nfs-client-provisioner created
deployment.apps/nfs-client-provisioner created
```
