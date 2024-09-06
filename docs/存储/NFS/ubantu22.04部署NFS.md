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

### class.yaml

```bash
vim nfs/class.yaml
```

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: managed-nfs-storage
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: fuseim.pri/ifs
parameters:
  archiveOnDelete: "true"
```

### rbac.yaml

```bash
vim nfs/rbac.yaml
```

```yaml
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: nfs-client-provisioner-runner
rules:
- apiGroups: [""]
  resources: ["persistentvolumes"]
  verbs: ["get", "list", "watch", "create", "delete"]
- apiGroups: [""]
  resources: ["persistentvolumeclaims"]
  verbs: ["get", "list", "watch", "update"]
- apiGroups: [""]
  resources: ["endpoints"]
  verbs: ["get", "list", "watch", "create", "update", "patch"]
- apiGroups: ["storage.k8s.io"]
  resources: ["storageclasses"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["events"]
  verbs: ["create", "update", "patch"]
---
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: run-nfs-client-provisioner
subjects:
- kind: ServiceAccount
  name: nfs-client-provisioner
  namespace: default
roleRef:
  kind: ClusterRole
  name: nfs-client-provisioner-runner
  apiGroup: rbac.authorization.k8s.io
---
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: leader-locking-nfs-client-provisioner
rules:
- apiGroups: [""]
  resources: ["endpoints"]
  verbs: ["get", "list", "watch", "create", "update", "patch"]
---
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: leader-locking-nfs-client-provisioner
subjects:
- kind: ServiceAccount
  name: nfs-client-provisioner
  # replace with namespace where provisioner is deployed
  namespace: default
roleRef:
  kind: Role
  name: leader-locking-nfs-client-provisioner
  apiGroup: rbac.authorization.k8s.io
```

### deployment.yaml

```bash
vim nfs/deployment.yaml
```

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: nfs-client-provisioner
---
kind: Deployment
apiVersion: apps/v1
metadata:
  name: nfs-client-provisioner
spec:
  replicas: 1
  strategy:
    type: Recreate
  selector:
    matchLabels:
      app: nfs-client-provisioner
  template:
    metadata:
      labels:
        app: nfs-client-provisioner
    spec:
      serviceAccount: nfs-client-provisioner
      containers:
        - name: nfs-client-provisioner
          #image: quay.io/vbouchaud/nfs-client-provisioner:v3.2.2  #nfs镜像
          image: docker.llody.cn/easzlab/nfs-subdir-external-provisioner:v4.0.2  #不使用官方镜像的原因是K8S的1.20即以上版本禁用了selfLink
          volumeMounts:
            - name: nfs-client-root
              mountPath: /persistentvolumes
          env:
            - name: PROVISIONER_NAME
              value: fuseim.pri/ifs
            - name: NFS_SERVER
              value: 192.168.174.19  # nfs的IP地址
            - name: NFS_PATH
              value: /data/nfs/k8s  # NFS存储路径
      volumes:
        - name: nfs-client-root
          nfs:
            server: 192.168.174.19  # nfs的IP地址
            path: /data/nfs/k8s    # NFS存储路径

```

### 部署

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
