## 简介

> VictoriaMetrics 是一种快速、经济高效且可扩展的监控解决方案和时间序列数据库。是Prometheus的直接替代品，

## 对比

|                        | Prometheus   | VictoriaMetrics |
| ---------------------- | ------------ | --------------- |
| CPU avg used           | 0.79/3 cores | 0.76/3 cores    |
| Disk usage             | 83.5 GiB     | ✅ 33 GiB       |
| Memory max used        | 8.12/12 GiB  | ✅ 4.5/12 GiB   |
| Read latency 50th      | 70.5ms       | ✅ 4.3ms        |
| Read latency 99th %ile | 7s           | ✅ 3.6s         |

> 将 VictoriaMetrics 替换为 Prometheus 可以 **事半功倍** ！这是减少监控费用可以做的最简单的事情之一。

### Prometheus 没有解决的问题

> * 不支持高可用部署
> * 没法横向扩容
> * 数据采用本地化存储
> * 不支持多租户

### 缺点

> * 图形化做的不好，虽然有vmui，但功能很少
> * 告警功能需要单独配置vmalert，而且vmalert只有api管理和查看，暂时没用图形界面
> * 没有类似Prometheus的WAL日志，突然故障可能会丢失部分数据

## 特点

> * 可以作为Prometheus的长期存储。
> * 它可以用作 Grafana 中 Prometheus 的直接替代品
> * 它实现了类似 PromQL 的查询语言 - [MetricsQL](https://docs.victoriametrics.com/metricsql/)，它在 PromQL 之上提供了改进的功能。
> * 它提供了全局查询视图。多个 Prometheus 实例或任何其他数据源可能会将数据摄取到 VictoriaMetrics 中。稍后可以通过单个查询来查询该数据。
> * [它为数据摄取](https://medium.com/@valyala/high-cardinality-tsdb-benchmarks-victoriametrics-vs-timescaledb-vs-influxdb-13e6ee64dd6b) 和[数据查询](https://medium.com/@valyala/when-size-matters-benchmarking-victoriametrics-vs-timescale-and-influxdb-6035811952d4)提供高性能和良好的垂直和水平可扩展性 。它的[性能比 InfluxDB 和 TimescaleDB 高出 20 倍](https://medium.com/@valyala/measuring-vertical-scalability-for-time-series-databases-in-google-cloud-92550d78d8ae)。
> * 在处理数百万个独特的时间序列（又名高基数）时，它[使用的 RAM 比 InfluxDB 少 10 倍](https://medium.com/@valyala/insert-benchmarks-with-inch-influxdb-vs-victoriametrics-e31a41ae2893) ，[比 Prometheus、Thanos 或 Cortex 少 7 倍。](https://valyala.medium.com/prometheus-vs-victoriametrics-benchmark-on-node-exporter-metrics-4ca29c75590f)
> * 它针对[高流失率](https://docs.victoriametrics.com/faq/#what-is-high-churn-rate)的时间序列进行了优化。
> * 它提供高数据压缩：根据[这些基准测试](https://medium.com/@valyala/when-size-matters-benchmarking-victoriametrics-vs-timescale-and-influxdb-6035811952d4)，与 TimescaleDB 相比，有限存储中可以存储多达 70 倍的数据点，并且与 Prometheus、Thanos 或 Cortex 相比，所需的存储空间减少多达 7 倍。根据[这个基准](https://valyala.medium.com/prometheus-vs-victoriametrics-benchmark-on-node-exporter-metrics-4ca29c75590f)。
> * 它针对高延迟 IO 和低 IOPS 的存储（AWS、Google Cloud、Microsoft Azure 等中的 HDD 和网络存储）进行了优化。请参阅[这些基准测试中的磁盘 IO 图](https://medium.com/@valyala/high-cardinality-tsdb-benchmarks-victoriametrics-vs-timescaledb-vs-influxdb-13e6ee64dd6b)。
> * 单节点 VictoriaMetrics 可以替代使用 Thanos、M3DB、Cortex、InfluxDB 或 TimescaleDB 等竞争解决方案构建的中等大小的集群。
> * `kill -9`由于 [存储架构，](https://medium.com/@valyala/how-victoriametrics-makes-instant-snapshots-for-multi-terabyte-time-series-data-e1f3fb0e0282)它可以保护存储免受非正常关闭（即 OOM、硬件重置或）时的数据损坏。
> * 它支持强大的[流聚合](https://docs.victoriametrics.com/stream-aggregation/)，可以作为[statsd 的](https://github.com/statsd/statsd)替代品。
> * 它支持[指标重新](https://docs.victoriametrics.com/#relabeling)标记。
> * 它可以通过系列限制器处理[高基数问题](https://docs.victoriametrics.com/faq/#what-is-high-cardinality)和 [高流失率](https://docs.victoriametrics.com/faq/#what-is-high-churn-rate)问题。
> * 它有一个开源[集群版本](https://github.com/VictoriaMetrics/VictoriaMetrics/tree/cluster)。
> * 它可以将数据存储在[基于 NFS 的存储](https://en.wikipedia.org/wiki/Network_File_System)上。

## 组件

> [除了单节点 VictoriaMetrics](https://docs.victoriametrics.com/)之外，VictoriaMetrics 生态系统还包含以下组件：
>
> * [vmagent](https://docs.victoriametrics.com/vmagent/) - 轻量级代理，用于通过[基于拉动](https://docs.victoriametrics.com/vmagent/#how-to-collect-metrics-in-prometheus-format) 和[基于推送的](https://docs.victoriametrics.com/vmagent/#how-to-push-data-to-vmagent)协议接收指标，将其转换并发送到已配置的与 Prometheus 兼容的远程存储系统，例如 VictoriaMetrics。
> * [vmalert](https://docs.victoriametrics.com/vmalert/) - 用于处理与 Prometheus 兼容的警报和记录规则的服务。
> * [vmalert-tool](https://docs.victoriametrics.com/vmalert-tool/) - 用于验证警报和记录规则的工具。
> * [vmauth](https://docs.victoriametrics.com/vmauth/) - 针对 VictoriaMetrics 产品优化的授权代理和负载均衡器。
> * [vmgateway](https://docs.victoriametrics.com/vmgateway/) - 具有每个[租户](https://docs.victoriametrics.com/cluster-victoriametrics/#multitenancy)速率限制功能的授权代理。
> * [vmctl](https://docs.victoriametrics.com/vmctl/) - 用于在不同存储系统之间迁移和复制数据以获取指标的工具。
> * [vmbackup](https://docs.victoriametrics.com/vmbackup/)、[vmrestore](https://docs.victoriametrics.com/vmrestore/)和[vmbackupmanager](https://docs.victoriametrics.com/vmbackupmanager/) - 用于为 VictoriaMetrics 数据创建备份和从备份恢复的工具。
> * `vminsert`、`vmselect`和-VictoriaMetrics 集群 `vmstorage`的组件。[](https://docs.victoriametrics.com/cluster-victoriametrics/)
> * [VictoriaLogs](https://docs.victoriametrics.com/victorialogs/) - 用户友好、经济高效的日志数据库。

## 架构

### 单节点版

> helm仓库地址：https://github.com/VictoriaMetrics/helm-charts/tree/master/charts/victoria-metrics-single

### 集群版

> helm仓库地址：https://github.com/VictoriaMetrics/helm-charts/tree/master/charts/victoria-metrics-cluster

## 个人观点

> 就现在这种情况Prometheus依旧不可或缺，主流的方案是把Prometheus当节点，将数据上报给VM做持久化存储。
