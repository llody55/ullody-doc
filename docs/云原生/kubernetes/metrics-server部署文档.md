## K8S1.24.9部署metrics-server

### 简介

> metrics server为Kubernetes自动伸缩提供一个容器资源度量源。metrics-server 从 kubelet 中获取资源指标，并通过 Metrics API 在 Kubernetes API 服务器中公开它们，以供 HPA 和 VPA 使用。

### 集群环境

| 系统               | K8S版本 | CPU架构 | CPU         | metrics-server |
| ------------------ | ------- | ------- | ----------- | -------------- |
| Ubuntu 22.04.4 LTS | v1.24.9 | ARM64   | Kunpeng-920 | v0.5.2         |

### 版本兼容参考

| 版本  | 指标 API 组/版本       | 支持的 Kubernetes 版本 |
| ----- | ---------------------- | ---------------------- |
| 0.6.x | metrics.k8s.io/v1beta1 | *1.19+                 |
| 0.5.x | metrics.k8s.io/v1beta1 | *1.8+                  |
| 0.4.x | metrics.k8s.io/v1beta1 | *1.8+                  |
| 0.3.x | metrics.k8s.io/v1beta1 | 1.8-1.21               |

### 下载yaml文件

```bash
wget https://github.com/kubernetes-sigs/metrics-server/releases/download/v0.5.2/components.yaml -O metrics-server.yaml
```

### 编辑yaml文件

```yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    k8s-app: metrics-server
  name: metrics-server
  namespace: kube-system
spec:
  selector:
    matchLabels:
      k8s-app: metrics-server
  strategy:
    rollingUpdate:
      maxUnavailable: 0
  template:
    metadata:
      labels:
        k8s-app: metrics-server
    spec:
      containers:
      - args:
        - --cert-dir=/tmp
        - --secure-port=4443
        - --kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname
        - --kubelet-use-node-status-port
        - --metric-resolution=15s
        - --kubelet-insecure-tls   # 增加TLS参数
        image: swr.cn-southwest-2.myhuaweicloud.com/llody/metrics-server:v0.5.2   # 更换国内同步镜像
```

### 发布

```bash
root@k8s-master1:~# kubectl apply -f metrics-server-0.5.2.yaml 
serviceaccount/metrics-server created
clusterrole.rbac.authorization.k8s.io/system:aggregated-metrics-reader created
clusterrole.rbac.authorization.k8s.io/system:metrics-server created
rolebinding.rbac.authorization.k8s.io/metrics-server-auth-reader created
clusterrolebinding.rbac.authorization.k8s.io/metrics-server:system:auth-delegator created
clusterrolebinding.rbac.authorization.k8s.io/system:metrics-server created
service/metrics-server created
deployment.apps/metrics-server created
apiservice.apiregistration.k8s.io/v1beta1.metrics.k8s.io created
```

### 测试

```bash
root@k8s-master1:~# kubectl top nodes
NAME          CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%   
k8s-master1   211m         1%     3557Mi          5%  
k8s-master2   310m         1%     33662Mi         55%   
k8s-master3   504m         3%     39358Mi         64%   
k8s-work1     341m         2%     39543Mi         65% 
```
