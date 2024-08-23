## 创建持久化目录

```bash
mkdir -p /data/redis/{conf,data}
```

## 创建配置文件

```bash
vim /data/redis/conf/redis.conf
```

```bash
bind 0.0.0.0
port 6379
requirepass you_redis_password
timeout 600
protected-mode no
maxclients 1000000
maxmemory 1932735283
maxmemory-policy volatile-lru
```

## dockers方式

### 运行容器

```bash
docker run -p 6379:6379 --name redis -v /data/redis/conf/redis.conf:/etc/redis/redis.conf  -v  /data/redis/data:/data -d redis:6.2  redis-server /etc/redis/redis.conf --appendonly yes
```

## docker-compose方式

### 编写redis.yml

```bash
vim shell/redis.yml
```

```bash
version: '3'

services:
  redis:
    image: redis:6.2
    command: redis-server /etc/redis/redis.conf --appendonly yes
    container_name: redis
    privileged: true
    restart: always
    volumes:
      - /data/redis/data:/data
      - /data/redis/conf:/etc/redis/
```

### 启动

```bash
docker-compose -p redis -f shell/redis.yml up -d
```

## K8S方式

```bash
vim shell/redis-state.yml
```

```bash
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  generation: 13
  labels:
    app: redis-server
  name: redis-server
  namespace: default
spec:
  podManagementPolicy: OrderedReady
  replicas: 1
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      app: redis-server
  serviceName: redis-server
  template:
    metadata:
      labels:
        app: redis-server
    spec:
      containers:
        - command:
            - redis-server
            - /usr/local/etc/redis/redis.conf
          env:
            - name: POD_IP
              valueFrom:
                fieldRef:
                  apiVersion: v1
                  fieldPath: status.podIP
          image: redis:6.2
          imagePullPolicy: IfNotPresent
          name: redis-server
          ports:
            - containerPort: 6379
              name: redis
              protocol: TCP
          resources:
            limits:
              cpu: '1'
              memory: 4Gi
            requests:
              cpu: '200m'
              memory: 1048Mi
          securityContext:
            runAsUser: 999
          terminationMessagePath: /dev/termination-log
          terminationMessagePolicy: File
          volumeMounts:
            - mountPath: /usr/local/etc/redis/redis.conf
              name: conf
              subPath: redis.conf
            - name: redis-pvc
              mountPath: /data
      dnsPolicy: ClusterFirst
      initContainers:
        - args:
            - '-c'
            - echo 65535 > /proc/sys/net/core/somaxconn
          command:
            - /bin/sh
          image: swr.cn-southwest-2.myhuaweicloud.com/llody/busybox:1.36.1 
          imagePullPolicy: IfNotPresent
          name: sysctl
          resources: {}
          securityContext:
            privileged: true
          terminationMessagePath: /dev/termination-log
          terminationMessagePolicy: File
      restartPolicy: Always
      schedulerName: default-scheduler
      securityContext: {}
      terminationGracePeriodSeconds: 1800
      volumes:
        - configMap:
            defaultMode: 420
            name: redis-server
          name: conf
        - name: redis-pvc
          persistentVolumeClaim:
            claimName: redis-pvc
  updateStrategy:
    rollingUpdate:
      partition: 0
    type: RollingUpdate
---
apiVersion: v1
kind: Service
metadata:
  name: redis-server
  namespace: default
spec:
  clusterIP: None
  ports:
    - port: 6379
      protocol: TCP
      targetPort: 6379
  selector:
    app: redis-server
  sessionAffinity: None
  type: ClusterIP
---
apiVersion: v1
kind: Service
metadata:
  name: redis-cluster
  namespace: default
spec:
  ports:
    - port: 6379
      protocol: TCP
      targetPort: 6379
      nodePort: 31548
  selector:
    app: redis-server
  type: NodePort
---
apiVersion: v1
data:
  redis.conf: |
    bind 0.0.0.0
    port 6379
    appendonly yes
    requirepass you_redis_password
    maxclients 1000000
    maxmemory 1932735283
    maxmemory-policy volatile-lru
    dir /data
    protected-mode no
    rdbcompression yes
kind: ConfigMap
metadata:
  labels:
    app.kubernetes.io/instance: prod-redis-server
    app.kubernetes.io/managed-by: llody
    app.kubernetes.io/name: redis-server
    app.kubernetes.io/version: '5'
  name: redis-server
  namespace: default
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  # pvc名称
  name: redis-pvc
spec:
  # 读写权限
  accessModes:
    - ReadWriteOnce
  # 使用的存储类
  storageClassName: managed-nfs-storage
  # 定义容量
  resources:
    requests:
      storage: 5Gi
```
