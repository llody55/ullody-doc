## 实验规划

| 主机IP        | 部署组件                                                                           | 说明 |
| ------------- | ---------------------------------------------------------------------------------- | ---- |
| 192.168.1.217 | docker、docker-compose、node-exporter、cadvisor、prometheus、grafana、alertmanager |      |
| 192.168.1.218 | docker、node-exporter、cadvisor                                                    |      |

## 创建相关目录

```bash
mkdir -p /opt/{prometheus,grafana,alertmanager}
mkdir -p /opt/alertmanager/template
chmod -R 777  /opt/grafana
```

> 目录结构如下：

```bash
[root@dev-1 ~]# tree /opt/
/opt/
├── alertmanager
│   ├── alertmanager.yml
│   └── template
│       ├── custom_email_subject.tmpl
│       └── email.tmpl
├── grafana
│   ├── alerting
│   │   └── 1
│   │       └── __default__.tmpl
│   ├── csv
│   ├── grafana.db
│   ├── plugins
│   └── png
└── prometheus
    ├── prometheus.yml
    └── rules.yml
```

## 准备文件

### prometheus

1. prometheus.yml

   ```yaml
   rule_files:
     - /etc/prometheus/rules.yml
   alerting:
     alertmanagers:
     - static_configs:
       - targets: ["alertmanager:9093"]
   global:
     scrape_interval:     60s
     evaluation_interval: 60s

   scrape_configs:
     - job_name: node-exporter
       honor_timestamps: true
       scrape_interval: 15s
       scrape_timeout: 10s
       metrics_path: /metrics
       scheme: http
       follow_redirects: true
       static_configs:
         - targets: ['192.168.1.217:9100','192.168.1.218:9100']
           labels:
             account: 技术部
             job: node_exporter
             project: 本地测试
       relabel_configs:
         - source_labels: [__address__]
           regex: '([^:]+)(:\d+)?'
           replacement: '${1}'
           target_label: instance
         - source_labels: [__address__]
           regex: '([^:]+)(:\d+)?'
           replacement: '${1}'
           target_label: node_ip
         - action: labelmap
           regex: 'cAdvisor_container_info_([^_]+)_name'
           replacement: 'container_${1}'

     - job_name: cadvisor
       honor_timestamps: true
       scrape_interval: 15s
       scrape_timeout: 10s
       metrics_path: /metrics
       scheme: http
       follow_redirects: true
       static_configs:
         - targets: ['192.168.1.217:8080','192.168.1.218:8080']
           labels:
             account: 技术部
             job: cadvisor
             project: 本地测试
   ```

   > #### 需要修改的地方
   >
   > - 部门标签：account
   > - 项目标签：project
   > - 节点1IP：192.168.1.217
   > - 节点2IP：192.168.1.218
   >
2. rules.yml

   ```yaml
   groups:
   - name: 物理节点状态-监控告警
     rules:
         - alert: 物理节点cpu使用率
           expr: 100-avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) by(instance)*100 > 90
           for: 2s
           labels:
             severity: ccritical
           annotations:
             summary: "{{ $labels.instance }}cpu使用率过高"
             description: "{{ $labels.instance }}的cpu使用率超过90%,当前使用率[{{ $value }} %],需要排查处理" 
         - alert: 物理节点内存使用率
           expr: (node_memory_MemTotal_bytes - (node_memory_MemFree_bytes + node_memory_Buffers_bytes + node_memory_Cached_bytes)) / node_memory_MemTotal_bytes * 100 > 90
           for: 2s
           labels:
             severity: critical
           annotations:
             summary: "{{ $labels.instance }}内存使用率过高"
             description: "{{ $labels.instance }}的内存使用率超过90%,当前使用率[{{ $value }} %],需要排查处理"
         - alert: InstanceDown
           expr: up == 0
           for: 2s
           labels:
             severity: critical
           annotations:   
             summary: "{{ $labels.instance }}: 服务器宕机"
             description: "{{ $labels.instance }}: 服务器延时超过2分钟"
         - alert: 物理节点磁盘的IO性能
           expr: 100-(avg(irate(node_disk_io_time_seconds_total[1m])) by(instance)* 100) < 60
           for: 2s
           labels:
             severity: critical
           annotations:
             summary: "{{$labels.mountpoint}} 流入磁盘IO使用率过高！"
             description: "{{$labels.mountpoint }} 流入磁盘IO大于60%(目前使用:{{$value}})"
         - alert: 入网流量带宽
           expr: ((sum(rate (node_network_receive_bytes_total{device!~'tap.*|veth.*|br.*|docker.*|virbr*|lo*'}[5m])) by (instance)) / 100) > 102400
           for: 2s
           labels:
             severity: critical
           annotations:
             summary: "{{$labels.mountpoint}} 流入网络带宽过高！"
             description: "{{$labels.mountpoint }}流入网络带宽持续5分钟高于100M. RX带宽使用率{{$value}}"
         - alert: 出网流量带宽
           expr: ((sum(rate (node_network_transmit_bytes_total{device!~'tap.*|veth.*|br.*|docker.*|virbr*|lo*'}[5m])) by (instance)) / 100) > 102400
           for: 2s
           labels:
             severity: critical
           annotations:
             summary: "{{$labels.mountpoint}} 流出网络带宽过高！"
             description: "{{$labels.mountpoint }}流出网络带宽持续5分钟高于100M. RX带宽使用率{{$value}}"
         - alert: TCP会话
           expr: node_netstat_Tcp_CurrEstab > 1000
           for: 2s
           labels:
             severity: critical
           annotations:
             summary: "{{$labels.mountpoint}} TCP_ESTABLISHED过高！"
             description: "{{$labels.mountpoint }} TCP_ESTABLISHED大于1000%(目前使用:{{$value}}%)"
         - alert: 磁盘容量
           expr: 100-(node_filesystem_free_bytes{fstype=~"ext4|xfs"}/node_filesystem_size_bytes {fstype=~"ext4|xfs"}*100) > 80
           for: 2s
           labels:
             severity: critical
           annotations:
             summary: "{{$labels.mountpoint}} 磁盘分区使用率过高！"
             description: "{{$labels.mountpoint }} 磁盘分区使用大于80%(目前使用:{{$value}}%)"

         - alert: HostClockSkew
           expr: (node_timex_offset_seconds > 0.05 and deriv(node_timex_offset_seconds[5m]) >= 0) or (node_timex_offset_seconds < -0.05 and deriv(node_timex_offset_seconds[5m]) <= 0)
           for: 2m
           labels:
             severity: warning
           annotations:
             summary: "异常时钟偏差，实例 ：{{ $labels.instance }}"
             description: "检测到时钟偏差，时钟不同步。值为：{{ $value }}"

         - alert: HostClockNotSynchronising
           expr: min_over_time(node_timex_sync_status[1m]) == 0 and node_timex_maxerror_seconds >= 16
           for: 2m
           labels:
             severity: warning
           annotations:
             summary: "时钟不同步，实例：{{ $labels.instance }}"
             description: "时钟不同步"
   ```

   > 根据目录结构将rules.yml文件放入prometheus目录下。
   >

### alertmanager

1. alertmanager.yml

   ```bash
   global:
     resolve_timeout: 10m 
     smtp_smarthost: 'smtp.163.com:465'
     smtp_from: '你的163邮箱'
     smtp_auth_username: '你的163邮箱'
     smtp_auth_password: 'password'
     smtp_require_tls: false
     smtp_hello: '163.com'
   templates:
     - '/etc/alertmanager/template/*.tmpl'
   route:
     group_by: ['alertname']
     group_wait: 10s
     group_interval: 10s
     repeat_interval: 10m
     receiver: 'email'
   receivers:
     - name: 'email'
       email_configs:
       - to: '{{ template "email.to" . }}'
         html: '{{ template "email.to.html" . }}'
         send_resolved: true
         headers:
             Subject: '{{ template "custom_email_subject" . }}'

   ```
2. template

   > template是模版目录，下面放的是email模版文件
   >

   * email.tmpl

     ```bash
     {{ define "email.from" }}你的163邮箱{{ end }}
     {{ define "email.to" }}接收者邮箱{{ end }}
     {{ define "email.to.html" }}
     {{- if gt (len .Alerts.Firing) 0 -}}
     {{- range $index, $alert := .Alerts -}}
     {{- if eq $index 0 -}}
     =========<span style="color:red;">告警通知</span>==========<br>
     告警程序: prometheus_alert <br>
     告警级别: <span style="color:red;">{{ .Labels.severity }} </span>级 <br>
     告警类型: <span style="color:red;">{{ .Labels.alertname }}</span> <br>
     {{- end }}
     <br> ===================== <br>
     告警主题: {{ .Annotations.summary }} <br>
     告警详情: {{ .Annotations.description }} <br>
     触发时间: <span style="color:red;">{{ .StartsAt.Local.Format "2006-01-02 15:04:05" }}</span> <br>
     {{ if gt (len $alert.Labels.instance) 0 -}}故障主机: {{ $alert.Labels.instance }}{{- end -}}
     {{- end }}
     {{- end }}

     {{- if gt (len .Alerts.Resolved) 0 -}}
     {{- range $index, $alert := .Alerts -}}
     {{- if eq $index 0 -}}
     =========<span style="color:green;">恢复通知</span>==========<br>
     告警程序: prometheus_alert <br>
     告警级别: <span style="color:green;">{{ .Labels.severity }} </span>级 <br>
     告警类型: <span style="color:green;">{{ .Labels.alertname }}</span> <br>
     {{- end }}
     <br> ===================== <br>
     告警主题: {{ .Annotations.summary }} <br>
     告警详情: {{ .Annotations.description }} <br>
     触发时间: {{ .StartsAt.Local.Format "2006-01-02 15:04:05" }} <br>
     恢复时间: <span style="color:green;">{{ .EndsAt.Local.Format "2006-01-02 15:04:05" }}</span> <br>
     {{ if gt (len $alert.Labels.instance) 0 -}}故障主机: {{ $alert.Labels.instance }}{{- end -}}
     {{ end }}
     {{ end }}
     {{ end }}

     ```
   * custom_email_subject.tmpl

     ```bash
     {{- define "custom_email_subject" -}}
       {{- if .Status -}}
         {{- if eq .Status "firing" -}}
           [告警通知:{{ .Alerts.Firing | len }}] {{ .GroupLabels.alertname }} ({{ .CommonLabels.department }} {{ .CommonLabels.exporter }} {{ .CommonLabels.severity }})
         {{- else -}}
           [恢复通知] {{ .GroupLabels.alertname }} ({{ .CommonLabels.department }} {{ .CommonLabels.exporter }} {{ .CommonLabels.severity }})
         {{- end -}}
       {{- end -}}
       {{- end -}}
     ```

## docker-compose部署监控组件

```bash
vim docker-compose.yaml
```

```yaml
version: '3'
services:
  node-exporter:
    image: prom/node-exporter
    container_name: node-exporter
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.ignored-mount-points=^/(sys|proc|dev|host|etc)($$|/)'
    ports:
      - 9100:9100
    restart: unless-stopped
  
  cadvisor:
    image: google/cadvisor:latest
    container_name: cadvisor
    privileged: true
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:rw
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk/:ro
    environment:
      - TZ=Asia/Shanghai
    ports:
      - 8080:8080
    restart: unless-stopped

  # blackbox-exporter:
  #   image: prom/blackbox-exporter
  #   container_name: blackbox-exporter
  #   volumes:
  #     - /opt/blackbox-exporter/blackbox.yml:/etc/blackbox_exporter/blackbox.yml
  #   command:
  #     - '--config.file=/etc/blackbox_exporter/blackbox.yml'
  #   ports:
  #     - 9115:9115
  #   restart: unless-stopped

  prometheus:
    image: prom/prometheus
    container_name: prometheus
    volumes:
      - /opt/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - /opt/prometheus/rules.yml:/etc/prometheus/rules.yml
      - /opt/prometheus:/etc/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
    environment:
      - TZ=Asia/Shanghai
    logging:
      driver: json-file
      options:
        max-size: "1g"
        max-file: "3"
    ports:
      - 9090:9090
    depends_on:
      - node-exporter
    restart: unless-stopped

  grafana:
    image: grafana/grafana
    container_name: grafana
    volumes:
      - /opt/grafana:/var/lib/grafana
    environment:
      - TZ=Asia/Shanghai
      - GF_SECURITY_ADMIN_PASSWORD=llody123456
    ports:
      - 3000:3000
    logging:
      driver: json-file
      options:
        max-size: "1g"
        max-file: "3"
    depends_on:
      - prometheus
    restart: unless-stopped

  alertmanager:
    image: prom/alertmanager
    container_name: alertmanager
    volumes:
      - /opt/alertmanager:/etc/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
    environment:
      - TZ=Asia/Shanghai
    logging:
      driver: json-file
      options:
        max-size: "1g"
        max-file: "3"
    ports:
      - 9093:9093
    restart: unless-stopped

```

## 启动方式

### 启动命令

```bash
docker-compose -f docker-compose.yaml up -d
```

### 查看启动结果

```bash
[root@dev-1 ~]# docker-compose -f docker-compose.yaml ps
WARN[0000] /root/docker-compose.yaml: `version` is obsolete 
NAME            IMAGE                    COMMAND                   SERVICE         CREATED        STATUS       PORTS
alertmanager    prom/alertmanager        "/bin/alertmanager -…"   alertmanager    5 hours ago    Up 2 hours   0.0.0.0:9093->9093/tcp
cadvisor        google/cadvisor:latest   "/usr/bin/cadvisor -…"   cadvisor        46 hours ago   Up 2 hours   0.0.0.0:8080->8080/tcp
grafana         grafana/grafana          "/run.sh"                 grafana         47 hours ago   Up 2 hours   0.0.0.0:3000->3000/tcp
node-exporter   prom/node-exporter       "/bin/node_exporter …"   node-exporter   47 hours ago   Up 2 hours   0.0.0.0:9100->9100/tcp
prometheus      prom/prometheus          "/bin/prometheus --c…"   prometheus      24 hours ago   Up 2 hours   0.0.0.0:9090->9090/tcp
```

## 添加监控节点

```bash
vim node.yaml
```

```yaml
version: '3'
 
services:
    node-exporter:
      image: prom/node-exporter
      container_name: node-exporter
      volumes:
        - /proc:/host/proc:ro
        - /sys:/host/sys:ro
        - /:/rootfs:ro
      command:
        - '--path.procfs=/host/proc'
        - '--path.sysfs=/host/sys'
        - '--collector.filesystem.ignored-mount-points=^/(sys|proc|dev|host|etc)($$|/)'
      ports:
        - 9100:9100
      restart: unless-stopped
  
    cadvisor:
      image: google/cadvisor:latest
      container_name: cadvisor
      privileged: true
      volumes:
        - /:/rootfs:ro
        - /var/run:/var/run:rw
        - /sys:/sys:ro
        - /var/lib/docker/:/var/lib/docker:ro
        - /dev/disk/:/dev/disk/:ro
      environment:
        - TZ=Asia/Shanghai
      ports:
        - 8080:8080
      restart: unless-stopped
```

### 启动

```bash
docker-compose -f node.yaml up -d
```

```bash
[root@831-2022-dev-2 ~]# docker-compose -f node.yaml ps
WARN[0000] /root/node.yaml: `version` is obsolete   
NAME            IMAGE                    COMMAND                   SERVICE         CREATED        STATUS        PORTS
cadvisor        google/cadvisor:latest   "/usr/bin/cadvisor -…"   cadvisor        25 hours ago   Up 23 hours   0.0.0.0:8080->8080/tcp
node-exporter   prom/node-exporter       "/bin/node_exporter …"   node-exporter   25 hours ago   Up 23 hours   0.0.0.0:9100->9100/tcp
```

## 访问prometheus

> 访问：192.168.1.217:9090

![1716452290720](https://static.llody.top/ullody-doc/images/1716452290720.png)

![1716452335114](https://static.llody.top/ullody-doc/images/1716452335114.png)

## 访问grafana

> 访问：192.168.1.217:3000   账户：admin   密码：llody123456

### 节点监控大屏

![1716457087272](https://static.llody.top/ullody-doc/images/1716457087272.png)

### Docker大屏1

![1716451379398](https://static.llody.top/ullody-doc/images/1716451379398.png)

### Docker大屏2

![1716451516852](https://static.llody.top/ullody-doc/images/1716451516852.png)

## 告警邮件

![1716452443213](https://static.llody.top/ullody-doc/images/1716452443213.png)

## 恢复邮件

![1716452488549](https://static.llody.top/ullody-doc/images/1716452488549.png)

## 结语

> Docker监控的部署环节就完成了，后面将更新基于Docker部署的中间件监控，以及其他告警方式，多项目监控上报同一个prom监控点进行**联邦**监控，K8S监控也会在后续补充，如果感兴趣欢迎关注收藏与转发。
