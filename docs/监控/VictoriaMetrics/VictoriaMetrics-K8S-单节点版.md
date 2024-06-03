## 前情提要

> * 已经部署了一套prom+grafana 、可以参考 [Docker-compose部署Prometheus+AlertManager实现邮件告警](https://doc.llody.top/?#/%E7%9B%91%E6%8E%A7/prometheus/Docker-compose%E9%83%A8%E7%BD%B2Prometheus+AlertManager%E5%AE%9E%E7%8E%B0%E9%82%AE%E4%BB%B6%E5%91%8A%E8%AD%A6 "Docker-compose部署Prometheus+AlertManager实现邮件告警")
> * 服务都在monitor-sa命名空间下

## 创建VM持久化目录

```bash
[root@node2 ~]# mkdir /data/victoria-metrics
```

## 部署victoria-metrics

```yaml
# vm-grafana.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: victoria-metrics
  namespace: monitor-sa
spec:
  selector:
    matchLabels:
      app: victoria-metrics
  template:
    metadata:
      labels:
        app: victoria-metrics
    spec:
      volumes:
        - name: storage
          persistentVolumeClaim:
            claimName: victoria-metrics-data
      containers:
        - name: vm
          image: victoriametrics/victoria-metrics:v1.76.1
          imagePullPolicy: IfNotPresent
          args:
            - -storageDataPath=/var/lib/victoria-metrics-data
            - -retentionPeriod=1w
          ports:
            - containerPort: 8428
              name: http
          volumeMounts:
            - mountPath: /var/lib/victoria-metrics-data
              name: storage
---
apiVersion: v1
kind: Service
metadata:
  name: victoria-metrics
  namespace: monitor-sa
spec:
  type: NodePort
  ports:
    - port: 8428
  selector:
    app: victoria-metrics
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: victoria-metrics-data
spec:
  accessModes:
    - ReadWriteOnce
  capacity:
    storage: 20Gi
  storageClassName: managed-nfs-storage
  local:
    path: /data/victoria-metrics
  persistentVolumeReclaimPolicy: Retain
  nodeAffinity:
    required:
      nodeSelectorTerms:
        - matchExpressions:
            - key: kubernetes.io/hostname
              operator: In
              values:
                - node2
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: victoria-metrics-data
  namespace: monitor-sa
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
  storageClassName: managed-nfs-storage
```

> * -storageDataPath    # 参数指定了数据存储目录，然后同样将该目录进行了持久化
> * -retentionPeriod      # 参数可以用来配置数据的保持周期

```bash
[root@node1 ~/VictoriaMetrics]#kubectl apply -f victoria-metrics.yaml 
deployment.apps/victoria-metrics created
service/victoria-metrics created
persistentvolume/victoria-metrics-data created
persistentvolumeclaim/victoria-metrics-data created
[root@node1 ~/VictoriaMetrics]#kubectl get pods victoria-metrics-7b5b5d4b65-hpgfn  -n monitor-sa 
NAME                                READY   STATUS    RESTARTS   AGE
victoria-metrics-7b5b5d4b65-hpgfn   1/1     Running   0          32m
[root@node1 ~/VictoriaMetrics]#kubectl get svc victoria-metrics  -n monitor-sa 
NAME               TYPE       CLUSTER-IP   EXTERNAL-IP   PORT(S)          AGE
victoria-metrics   NodePort   10.1.14.10   <none>        8428:32707/TCP   32m
[root@node1 ~/VictoriaMetrics]#kubectl logs -f victoria-metrics-7b5b5d4b65-hpgfn  -n monitor-sa 
2024-05-09T02:36:14.033Z        info    VictoriaMetrics/lib/logger/flag.go:12   build version: victoria-metrics-20220412-134346-tags-v1.76.1-0-gf8de318bf
2024-05-09T02:36:14.034Z        info    VictoriaMetrics/lib/logger/flag.go:13   command line flags
2024-05-09T02:36:14.034Z        info    VictoriaMetrics/lib/logger/flag.go:20   flag "retentionPeriod"="1w"
2024-05-09T02:36:14.034Z        info    VictoriaMetrics/lib/logger/flag.go:20   flag "storageDataPath"="/var/lib/victoria-metrics-data"
2024-05-09T02:36:14.034Z        info    VictoriaMetrics/app/victoria-metrics/main.go:52 starting VictoriaMetrics at ":8428"...
```

## 配置Prometheus远程写入victoria-metrics

> 修改Prometheus的ConfigMap配置接入vm服务接口

```yaml
global:
  scrape_interval: 15s
  scrape_timeout: 10s
  evaluation_interval: 1m
remote_write:    # 远程写入到远程 VM 存储
    - url: http://victoria-metrics:8428/api/v1/write
scrape_configs:
- job_name: 'kubernetes-node'
  kubernetes_sd_configs:
  - role: node
  relabel_configs:
  - source_labels: [__address__]
    regex: '(.*):10250'
    replacement: '${1}:9100'
    target_label: __address__
    action: replace
  - action: labelmap
    regex: __meta_kubernetes_node_label_(.+)
```

```bash
# 重载Prometheus
[root@node1 ~/VictoriaMetrics]#curl -X POST "http://192.168.1.227:32456/-/reload"

# 如下日志表示接入成功
ts=2024-05-09T02:43:34.287Z caller=main.go:1214 level=info msg="Completed loading of configuration file" filename=/etc/prometheus/prometheus.yml totalDuration=135.29191ms db_storage=1.12µs remote_storage=210.02µs web_handler=917ns query_engine=2.002µs scrape=882.428µs scrape_sd=2.624557ms notify=73.689µs notify_sd=17.687µs rules=128.732642ms tracing=16.193µs

ts=2024-05-09T02:43:40.234Z caller=dedupe.go:112 component=remote level=info remote_name=8c696e url=http://victoria-metrics:8428/api/v1/write msg="Done replaying WAL" duration=9.618680452s

# victoria-metrics服务日志中会输出加载日志如下
[root@node1 ~/VictoriaMetrics]#kubectl logs -f victoria-metrics-7b5b5d4b65-hpgfn  -n monitor-sa 
2024-05-09T02:36:14.033Z        info    VictoriaMetrics/lib/logger/flag.go:12   build version: victoria-metrics-20220412-134346-tags-v1.76.1-0-gf8de318bf
2024-05-09T02:36:14.034Z        info    VictoriaMetrics/lib/logger/flag.go:13   command line flags
2024-05-09T02:36:14.034Z        info    VictoriaMetrics/lib/logger/flag.go:20   flag "retentionPeriod"="1w"
2024-05-09T02:36:14.034Z        info    VictoriaMetrics/lib/logger/flag.go:20   flag "storageDataPath"="/var/lib/victoria-metrics-data"
2024-05-09T02:36:14.034Z        info    VictoriaMetrics/app/victoria-metrics/main.go:52 starting VictoriaMetrics at ":8428"...
2024-05-09T02:36:14.034Z        info    VictoriaMetrics/app/vmstorage/main.go:97        opening storage at "/var/lib/victoria-metrics-data" with -retentionPeriod=1w
2024-05-09T02:36:14.035Z        info    VictoriaMetrics/lib/memory/memory.go:42 limiting caches to 27808100352 bytes, leaving 18538733568 bytes to the OS according to -memory.allowedPercent=60
2024-05-09T02:36:14.035Z        info    VictoriaMetrics/lib/storage/storage.go:995      loading MetricName->TSID cache from "/var/lib/victoria-metrics-data/cache/metricName_tsid"...
2024-05-09T02:36:14.058Z        info    VictoriaMetrics/lib/storage/storage.go:1000     loaded MetricName->TSID cache from "/var/lib/victoria-metrics-data/cache/metricName_tsid" in 0.023 seconds; entriesCount: 0; sizeBytes: 0
2024-05-09T02:36:14.058Z        info    VictoriaMetrics/lib/storage/storage.go:995      loading MetricID->TSID cache from "/var/lib/victoria-metrics-data/cache/metricID_tsid"...
2024-05-09T02:36:14.065Z        info    VictoriaMetrics/lib/storage/storage.go:1000     loaded MetricID->TSID cache from "/var/lib/victoria-metrics-data/cache/metricID_tsid" in 0.006 seconds; entriesCount: 0; sizeBytes: 0
2024-05-09T02:36:14.065Z        info    VictoriaMetrics/lib/storage/storage.go:995      loading MetricID->MetricName cache from "/var/lib/victoria-metrics-data/cache/metricID_metricName"...
2024-05-09T02:36:14.072Z        info    VictoriaMetrics/lib/storage/storage.go:1000     loaded MetricID->MetricName cache from "/var/lib/victoria-metrics-data/cache/metricID_metricName" in 0.007 seconds; entriesCount: 0; sizeBytes: 0
2024-05-09T02:36:14.072Z        info    VictoriaMetrics/lib/storage/storage.go:844      loading curr_hour_metric_ids from "/var/lib/victoria-metrics-data/cache/curr_hour_metric_ids"...
2024-05-09T02:36:14.072Z        info    VictoriaMetrics/lib/storage/storage.go:847      nothing to load from "/var/lib/victoria-metrics-data/cache/curr_hour_metric_ids"
2024-05-09T02:36:14.072Z        info    VictoriaMetrics/lib/storage/storage.go:844      loading prev_hour_metric_ids from "/var/lib/victoria-metrics-data/cache/prev_hour_metric_ids"...
2024-05-09T02:36:14.072Z        info    VictoriaMetrics/lib/storage/storage.go:847      nothing to load from "/var/lib/victoria-metrics-data/cache/prev_hour_metric_ids"
2024-05-09T02:36:14.072Z        info    VictoriaMetrics/lib/storage/storage.go:800      loading next_day_metric_ids from "/var/lib/victoria-metrics-data/cache/next_day_metric_ids"...
2024-05-09T02:36:14.072Z        info    VictoriaMetrics/lib/storage/storage.go:803      nothing to load from "/var/lib/victoria-metrics-data/cache/next_day_metric_ids"
2024-05-09T02:36:14.079Z        info    VictoriaMetrics/lib/mergeset/table.go:257       opening table "/var/lib/victoria-metrics-data/indexdb/17CDB17AC9CA8989"...
2024-05-09T02:36:14.083Z        info    VictoriaMetrics/lib/mergeset/table.go:292       table "/var/lib/victoria-metrics-data/indexdb/17CDB17AC9CA8989" has been opened in 0.004 seconds; partsCount: 0; blocksCount: 0, itemsCount: 0; sizeBytes: 0
2024-05-09T02:36:14.084Z        info    VictoriaMetrics/lib/mergeset/table.go:257       opening table "/var/lib/victoria-metrics-data/indexdb/17CDB17AC9CA8988"...
2024-05-09T02:36:14.092Z        info    VictoriaMetrics/lib/mergeset/table.go:292       table "/var/lib/victoria-metrics-data/indexdb/17CDB17AC9CA8988" has been opened in 0.008 seconds; partsCount: 0; blocksCount: 0, itemsCount: 0; sizeBytes: 0
2024-05-09T02:36:14.102Z        info    VictoriaMetrics/app/vmstorage/main.go:113       successfully opened storage "/var/lib/victoria-metrics-data" in 0.068 seconds; partsCount: 0; blocksCount: 0; rowsCount: 0; sizeBytes: 0
2024-05-09T02:36:14.103Z        info    VictoriaMetrics/app/vmselect/promql/rollup_result_cache.go:111  loading rollupResult cache from "/var/lib/victoria-metrics-data/cache/rollupResult"...
2024-05-09T02:36:14.105Z        info    VictoriaMetrics/app/vmselect/promql/rollup_result_cache.go:137  loaded rollupResult cache from "/var/lib/victoria-metrics-data/cache/rollupResult" in 0.002 seconds; entriesCount: 0, sizeBytes: 0
2024-05-09T02:36:14.106Z        info    VictoriaMetrics/app/victoria-metrics/main.go:61 started VictoriaMetrics in 0.072 seconds
2024-05-09T02:36:14.106Z        info    VictoriaMetrics/lib/httpserver/httpserver.go:91 starting http server at http://127.0.0.1:8428/
2024-05-09T02:36:14.106Z        info    VictoriaMetrics/lib/httpserver/httpserver.go:92 pprof handlers are exposed at http://127.0.0.1:8428/debug/pprof/
2024-05-09T02:43:40.257Z        info    VictoriaMetrics/lib/storage/partition.go:206    creating a partition "2024_05" with smallPartsPath="/var/lib/victoria-metrics-data/data/small/2024_05", bigPartsPath="/var/lib/victoria-metrics-data/data/big/2024_05"
2024-05-09T02:43:40.262Z        info    VictoriaMetrics/lib/storage/partition.go:222    partition "2024_05" has been created
2024-05-09T02:53:46.293Z        warn    VictoriaMetrics/lib/httpserver/httpserver.go:340        remoteAddr: "10.244.104.162:49372", X-Forwarded-For: "10.244.166.128, 10.244.166.128"; requestURI: /api/v1/status/buildinfo; unsupported path requested: "/api/v1/status/buildinfo"
2024-05-09T02:53:46.397Z        info    VictoriaMetrics/app/vmselect/querystats/querystats.go:68        enabled query stats tracking at `/api/v1/status/top_queries` with -search.queryStats.lastQueriesCount=20000, -search.queryStats.minQueryDuration=1ms
```

## 将Grafana 中的数据源地址修改成 VM 的地址

![1715224881951](https://static.llody.top/ullody-doc/images/1715224881951.png)

## 修改完成后重新访问dashboard

![1715225002437](https://static.llody.top/ullody-doc/images/1715225002437.png)

> 到这里单节点victoria-metrics就部署配置完成了，主要是依赖现有Prometheus当做节点，将数据上报给victoria-metrics的方案。Prometheus保存一周的临时数据，victoria-metrics依托于远程
>
> 存储，可以保留更长时间的监控信息，便于回放监控记录。
