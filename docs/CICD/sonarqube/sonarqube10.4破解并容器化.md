### 破解sonarqube 10.4数据中心版，并容器化

![破解成功页](https://static.llody.top/ullody-doc/images/1714031341742.png)

### 目录结构

```bash
[root@k8s-node ~/go/sonarqube]#tree  -L 1
.
├── Dockerfile
├── jdk-17.0.10_linux-x64_bin.tar.gz
├── sonar-datacenter
└── start.sh

1 directory, 3 files
```

> * sonar-datacenter： 已经破解过的数据目录
> * Dockerfile: 容器化流程文件
> * start.sh: 自定义的启动脚本

### 构建方法

```bash
[root@k8s-node ~/go/sonarqube]#docker build -t llody/sonarqube-datacenter:v10.4 .
Sending build context to Docker daemon  1.654GB
Step 1/15 : FROM centos:7
7: Pulling from library/centos
2d473b07cdd5: Pull complete 
Digest: sha256:9d4bcbbb213dfd745b58be38b13b996ebb5ac315fe75711bd618426a630e0987
Status: Downloaded newer image for centos:7
 ---> eeb6ee3f44bd
Step 2/15 : LABEL maintainer llody
 ---> Running in 853710f29b2f
Removing intermediate container 853710f29b2f
 ---> abead6155529
Step 3/15 : ADD  jdk-17.0.10_linux-x64_bin.tar.gz /usr/local/java/
 ---> 1e8f38569b30
Step 4/15 : RUN ln -s /usr/local/java/jdk-17.0.10/bin/java /usr/bin/java
 ---> Running in 33338ff62a11
Removing intermediate container 33338ff62a11
 ---> 0017d40875c2
Step 5/15 : COPY sonar-datacenter /usr/local/
 ---> 073d4eff3614
Step 6/15 : COPY start.sh /usr/local/sonarqube-10.4.0.87286/bin/linux-x86-64/
 ---> c3467e3addb8
Step 7/15 : RUN chmod +x /usr/local/sonarqube-10.4.0.87286/bin/linux-x86-64/start.sh
 ---> Running in 5158ebf75fb8
Removing intermediate container 5158ebf75fb8
 ---> d3011830b41b
Step 8/15 : ENV  JAVA_HOME=/usr/local/java/jdk-17.0.10/
 ---> Running in 7f9e61bc323d
Removing intermediate container 7f9e61bc323d
 ---> b0d4fb58bdec
Step 9/15 : ENV  JRE_HOME=${JAVA_HOME}/jre
 ---> Running in afebacd15c60
Removing intermediate container afebacd15c60
 ---> 0c57fa2e34e2
Step 10/15 : ENV  CLASSPATH=.:${JAVA_HOME}/lib:${JRE_HOME}/lib
 ---> Running in 1a3d71afb1ae
Removing intermediate container 1a3d71afb1ae
 ---> 6668c3b9bf98
Step 11/15 : ENV  PATH $PATH:${JAVA_HOME}/bin
 ---> Running in 5cc98759b755
Removing intermediate container 5cc98759b755
 ---> 5b6c9cdaa3ef
Step 12/15 : RUN  useradd es && chown -R es:es /usr/local/sonarqube-10.4.0.87286/*
 ---> Running in 4a161e0ac2df
Removing intermediate container 4a161e0ac2df
 ---> 78a66128a634
Step 13/15 : EXPOSE  9000
 ---> Running in dd892b72a2f9
Removing intermediate container dd892b72a2f9
 ---> 07b733d6f500
Step 14/15 : USER  es
 ---> Running in 343c2012380e
Removing intermediate container 343c2012380e
 ---> 5291b3821bc2
Step 15/15 : ENTRYPOINT ["bash", "/usr/local/sonarqube-10.4.0.87286/bin/linux-x86-64/start.sh"]
 ---> Running in 19937449bd10
Removing intermediate container 19937449bd10
 ---> b7bdf6356f96
Successfully built b7bdf6356f96
Successfully tagged llody/sonarqube-datacenter:v10.4
```

### 测试运行

```bash
[root@k8s-node ~/go/sonarqube]#docker run -e "JAVA_OPTS=-Xms512m -Xmx1024m"  -itd --name sonar -p 9000:9000 llody/sonarqube-datacenter:v10.4
2024.04.25 09:12:57 INFO  app[][o.s.a.AppFileSystem] Cleaning or creating temp directory /usr/local/sonarqube-10.4.0.87286/temp
2024.04.25 09:12:58 INFO  app[][o.s.a.es.EsSettings] Elasticsearch listening on [HTTP: 127.0.0.1:9001, TCP: 127.0.0.1:39553]
2024.04.25 09:12:58 INFO  app[][o.s.a.ProcessLauncherImpl] Launch process[ELASTICSEARCH] from [/usr/local/sonarqube-10.4.0.87286/elasticsearch]: /usr/local/java/jdk-17.0.10/bin/java -Xms4m -Xmx64m -XX:+UseSerialGC -Dcli.name=server -Dcli.script=./bin/elasticsearch -Dcli.libs=lib/tools/server-cli -Des.path.home=/usr/local/sonarqube-10.4.0.87286/elasticsearch -Des.path.conf=/usr/local/sonarqube-10.4.0.87286/temp/conf/es -Des.distribution.type=tar -cp /usr/local/sonarqube-10.4.0.87286/elasticsearch/lib/*:/usr/local/sonarqube-10.4.0.87286/elasticsearch/lib/cli-launcher/* org.elasticsearch.launcher.CliToolLauncher
2024.04.25 09:12:58 INFO  app[][o.s.a.SchedulerImpl] Waiting for Elasticsearch to be up and running
2024.04.25 09:13:14 INFO  app[][o.s.a.SchedulerImpl] Process[es] is up
2024.04.25 09:13:14 INFO  app[][o.s.a.ProcessLauncherImpl] Launch process[WEB_SERVER] from [/usr/local/sonarqube-10.4.0.87286]: /usr/local/java/jdk-17.0.10/bin/java -Djava.awt.headless=true -Dfile.encoding=UTF-8 -Djava.io.tmpdir=/usr/local/sonarqube-10.4.0.87286/temp -XX:-OmitStackTraceInFastThrow --add-opens=java.base/java.util=ALL-UNNAMED --add-opens=java.base/java.lang=ALL-UNNAMED --add-opens=java.base/java.io=ALL-UNNAMED --add-opens=java.rmi/sun.rmi.transport=ALL-UNNAMED --add-exports=java.base/jdk.internal.ref=ALL-UNNAMED --add-opens=java.base/java.nio=ALL-UNNAMED --add-opens=java.base/sun.nio.ch=ALL-UNNAMED --add-opens=java.management/sun.management=ALL-UNNAMED --add-opens=jdk.management/com.sun.management.internal=ALL-UNNAMED -Dcom.redhat.fips=false -Xmx1G -Xms128m -XX:+HeapDumpOnOutOfMemoryError -Dhttp.nonProxyHosts=localhost|127.*|[::1] -cp ./lib/sonar-application-10.4.0.87286.jar:/usr/local/sonarqube-10.4.0.87286/lib/jdbc/h2/h2-2.2.224.jar org.sonar.server.app.WebServer /usr/local/sonarqube-10.4.0.87286/temp/sq-process3779064069840316385properties
WARNING: A terminally deprecated method in java.lang.System has been called
WARNING: System::setSecurityManager has been called by org.sonar.process.PluginSecurityManager (file:/usr/local/sonarqube-10.4.0.87286/lib/sonar-application-10.4.0.87286.jar)
WARNING: Please consider reporting this to the maintainers of org.sonar.process.PluginSecurityManager
WARNING: System::setSecurityManager will be removed in a future release
2024.04.25 09:13:31 INFO  app[][o.s.a.SchedulerImpl] Process[web] is up
2024.04.25 09:13:31 INFO  app[][o.s.a.ProcessLauncherImpl] Launch process[COMPUTE_ENGINE] from [/usr/local/sonarqube-10.4.0.87286]: /usr/local/java/jdk-17.0.10/bin/java -Djava.awt.headless=true -Dfile.encoding=UTF-8 -Djava.io.tmpdir=/usr/local/sonarqube-10.4.0.87286/temp -XX:-OmitStackTraceInFastThrow --add-opens=java.base/java.util=ALL-UNNAMED --add-exports=java.base/jdk.internal.ref=ALL-UNNAMED --add-opens=java.base/java.lang=ALL-UNNAMED --add-opens=java.base/java.nio=ALL-UNNAMED --add-opens=java.base/sun.nio.ch=ALL-UNNAMED --add-opens=java.management/sun.management=ALL-UNNAMED --add-opens=jdk.management/com.sun.management.internal=ALL-UNNAMED -Dcom.redhat.fips=false -Xmx2G -Xms128m -XX:+HeapDumpOnOutOfMemoryError -Dhttp.nonProxyHosts=localhost|127.*|[::1] -cp ./lib/sonar-application-10.4.0.87286.jar:/usr/local/sonarqube-10.4.0.87286/lib/jdbc/h2/h2-2.2.224.jar org.sonar.ce.app.CeServer /usr/local/sonarqube-10.4.0.87286/temp/sq-process3225051846468271689properties
WARNING: A terminally deprecated method in java.lang.System has been called
WARNING: System::setSecurityManager has been called by org.sonar.process.PluginSecurityManager (file:/usr/local/sonarqube-10.4.0.87286/lib/sonar-application-10.4.0.87286.jar)
WARNING: Please consider reporting this to the maintainers of org.sonar.process.PluginSecurityManager
WARNING: System::setSecurityManager will be removed in a future release
2024.04.25 09:13:37 INFO  app[][o.s.a.SchedulerImpl] Process[ce] is up
2024.04.25 09:13:37 INFO  app[][o.s.a.SchedulerImpl] SonarQube is operational
```

> 默认使用ES作为数据库，更改数据库需要重新破解。

### 运行方式

#### docker方式

```docker
docker run -e "JAVA_OPTS=-Xms512m -Xmx1024m"  -itd --name sonar -p 9000:9000 llody/sonarqube-datacenter:v10.4
```

### K8S方式

```yaml
---
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: sonarqube-datacenter-pv-claim
  namespace: default
spec:
  storageClassName: "managed-nfs-storage"
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sonarqube-datacenter
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: sonarqube-datacenter
  template:
    metadata:
      labels:
        app: sonarqube-datacenter
    spec:
      initContainers:
        - name: init-sysctl
          image: busybox
          imagePullPolicy: IfNotPresent
          command: ["sysctl", "-w", "vm.max_map_count=262144"]
          securityContext:
            privileged: true
      containers:
        - name: sonarqube-datacenter
          image: llody/sonarqube-datacenter:v10.4
          env:
            - name: JAVA_OPTS
              value: Xms512m -Xmx2g
          ports:
            - name: port
              containerPort: 9000
          volumeMounts:
          - mountPath: /usr/local/sonarqube-10.4.0.87286/conf
            name: data
            subPath: conf
          - mountPath: /usr/local/sonarqube-10.4.0.87286/data
            name: data
            subPath: data
          - mountPath: /usr/local/sonarqube-10.4.0.87286/extensions
            name: data
            subPath: extensions
          livenessProbe:
            httpGet:
              path: /
              port: 9000
            initialDelaySeconds: 60
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /
              port: 9000
            initialDelaySeconds: 60
            periodSeconds: 30
            failureThreshold: 6
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: sonarqube-datacenter-pv-claim
---
apiVersion: v1
kind: Service
metadata:
  name: sonarqube-datacenter
  namespace: default
spec:
  type: NodePort
  ports:
    - name: http
      port: 9000
      targetPort: 9000
      protocol: TCP
      nodePort: 30011
  selector:
    app: sonarqube-datacenter




```

### 账户密码

> admin/llody

### 说明

> 这个版本具备比较全的语言支持。
