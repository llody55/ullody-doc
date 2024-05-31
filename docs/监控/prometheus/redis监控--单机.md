## redis监控

### docker-compose启动redis_exporter

```yaml
vim redis.yaml
```

```yaml
version: '3.3'
services:
redis_exporter:
    image: oliver006/redis_exporter
    container_name: redis_exporter
    restart: always
    environment:
       REDIS_ADDR: "192.168.1.225:6379"
       REDIS_PASSWORD: 123456
    ports:
       - "9121:9121"
```

### 修改Prometheus的配置

```yaml
- job_name: 'redis_exporter'
    static_configs:
      - targets: ['192.168.1.225:9121']
        labels:
          instance: 本地测试
```

### redis告警规则

```yaml
- name: redis
  rules:
  - alert: RedisDown
    expr: redis_up == 0
    for: 0m
    labels:
      severity: critical
    annotations:
      summary: "Redis Down,实例：{{ $labels.instance }}"
      description: "Redis实例 is down"
  - alert: RedisMissingBackup
    expr: time() - redis_rdb_last_save_timestamp_seconds > 60 * 60 * 24
    for: 0m
    labels:
      severity: critical
    annotations:
      summary: "Redis 备份丢失,实例：{{ $labels.instance }}"
      description: "Redis 24小时未备份"
  - alert: RedisOutofConfiguredMaxmemory
    expr: redis_memory_used_bytes / redis_memory_max_bytes * 100 > 90
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "Redis超出配置的最大内存,实例：{{ $labels.instance }}"
      description: "Redis内存使用超过配置最大内存的90%"
  - alert: RedisTooManyConnections
    expr: redis_connected_clients > 100
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: 'Redis 连接数过多,实例：{{ $labels.instance }}'
      description: "Redis当前连接数为：{{ $value }}"
  - alert: RedisNotEnoughConnections
    expr: redis_connected_clients < 1
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: 'Redis 没有足够的连接,实例：{{ $labels.instance }}'
      description: "Redis当前连接数为：{{ $value }}"
  - alert: RedisRejectedConnections
    expr: increase(redis_rejected_connections_total[1m]) > 0
    for: 0m
    labels:
      severity: critical
    annotations:
      summary: 'Redis 有拒绝链接,实例：{{ $labels.instance }}'
      description: "与Redis 的某些连接被拒绝：{{ $value }}"
```

### grafana面板

> 模版ID：11835
