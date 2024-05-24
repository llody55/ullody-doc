## mysql监控

### 创建专属账户

```sql

create user exporter@'%' identified by 'llody1NJE2024!';
GRANT PROCESS, REPLICATION CLIENT, SELECT ON *.* TO 'exporter'@'%' with grant option;

flush privileges;

select * from mysql.user where user='exporter'\G;

```

### 创建mysql客户端文件

```bash

mkdir/opt/mysql

vim/opt/mysql/.my.cnf

```

```bash

[client]

user=exporter

password=llody1NJE2024!

host=192.168.1.216

port=33066

```

### docker-compose启动MySQL Exporter

```bash

vim mysqld.yaml

```

```yaml

version: '3'

services:

  mysql_exporter:

    image: prom/mysqld-exporter:latest

    container_name: mysql_exporter

    ports:

      - "9104:9104"

    command:

      - --collect.info_schema.tables

      - --collect.info_schema.innodb_tablespaces

      - --collect.info_schema.innodb_metrics

      - --collect.global_status

      - --collect.global_variables

      - --collect.slave_status

      - --collect.info_schema.processlist

      - --collect.perf_schema.tablelocks

      - --collect.perf_schema.eventsstatements

      - --collect.perf_schema.eventsstatementssum

      - --collect.perf_schema.eventswaits

      - --collect.auto_increment.columns

      - --collect.binlog_size

      - --collect.perf_schema.tableiowaits

      - --collect.perf_schema.indexiowaits

      - --collect.info_schema.userstats

      - --collect.info_schema.clientstats

      - --collect.info_schema.tablestats

      - --collect.info_schema.schemastats

      - --collect.perf_schema.file_events

      - --collect.perf_schema.file_instances

      - --collect.perf_schema.replication_group_member_stats

      - --collect.perf_schema.replication_applier_status_by_worker

      - --collect.slave_hosts

      - --collect.info_schema.innodb_cmp

      - --collect.info_schema.innodb_cmpmem

      - --collect.info_schema.query_response_time

      - --collect.engine_tokudb_status

      - --collect.engine_innodb_status

    environment:

      - DATA_SOURCE_NAME=

    volumes:

      - /opt/mysql/.my.cnf:/home/.my.cnf:ro

    restart: always


```

### 修改Prometheus的配置

```yaml

 - job_name: mysql_exporter

    honor_timestamps: true

    scrape_interval: 15s

    scrape_timeout: 10s

    metrics_path: /metrics

    scheme: http

    follow_redirects: true

    static_configs:

      - targets: ['192.168.1.218:9104']

        labels:

          account: 技术部

          job: mysql_exporter

          project: 本地测试

```

### mysql告警规则

```yaml
groups:
- name: MySQL-监控状态
  rules:
#mysql状态检测
  - alert: MySQL 存活状态
    expr: mysql_up == 0
    for: 10s
    labels:
      severity: warning
    annotations:
      summary: "{{ $labels.instance }} Mysql服务 !!!"
      description: "{{ $labels.instance }} Mysql服务不可用  请检查!"

#mysql主从IO线程停止时触发告警
  - alert: MySQL Slave IO Thread Status
    expr: mysql_slave_status_slave_io_running == 0
    for: 5s
    labels:
      severity: warning
    annotations:
      summary: "{{ $labels.instance }} Mysql从节点IO线程"
      description: "Mysql主从IO线程故障，请检测!"

#mysql主从sql线程停止时触发告警
  - alert: MySQL Slave SQL Thread Status 
    expr: mysql_slave_status_slave_sql_running == 0
    for: 5s 
    labels:
      severity: error
    annotations: 
      summary: "{{$labels.instance}}: MySQL Slave SQL Thread has stop !!!"
      description: "检测MySQL主从SQL线程运行状态"
  
#mysql主从延时状态告警
  - alert: MySQL Slave Delay Status 
    expr: mysql_slave_status_sql_delay == 30
    for: 5s 
    labels:
      severity: warning
    annotations: 
      summary: "{{$labels.instance}}: MySQL 主从延迟超过 30s !!!"
      description: "检测MySQL主从延时状态"
  
#mysql连接数告警
  - alert: Mysql_Too_Many_Connections
    expr: rate(mysql_global_status_threads_connected[5m]) > 200
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "{{$labels.instance}}: 连接数过多"
      description: "{{$labels.instance}}: 连接数过多，请处理 ,(current value is: {{ $value }})！"  
 
 #mysql慢查询有点多告警
  - alert: Mysql_Too_Many_slow_queries
    expr: rate(mysql_global_status_slow_queries[5m]) > 3
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "{{$labels.instance}}: 慢查询有点多，请检查处理！"
      description: "{{$labels.instance}}: Mysql slow_queries is more than 3 per second ,(current value is: {{ $value }})"

#mysql磁盘空间告警
  - alert: Mysql_Disk_Usage
    expr: mysql_global_variables_datadir_size_bytes > 1000000000
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "{{$labels.instance}}: 磁盘空间不足"
      description: "{{$labels.instance}}: Mysql磁盘空间不足，请处理！"
```

### grafana模板

> 模板ID：7362

![1716538395928](https://static.llody.top/ullody-doc/images/1716538395928.png)

### 告警通知

![1716539503507](https://static.llody.top/ullody-doc/images/1716539503507.png)

### 恢复通知

![1716539522223](https://static.llody.top/ullody-doc/images/1716539522223.png)

### 结语

> 后续完善集群版监控。
