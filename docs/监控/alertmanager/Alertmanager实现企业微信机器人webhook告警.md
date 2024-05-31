## 简介

> 因为没有管理员权限，所以只能采用webhook的方式进行告警通知。

## 微信创建一个 -- 小助理

### 创建小助理

![微信机器人](https://static.llody.top/ullody-doc/images/WXrobot1.png "微信机器人")

### 将小助理发布到群聊

### docker部署weixin-robot

```bash
docker run \
    -e PORT=6000 \
    -e KEY=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=XXXXXXXXX  \
    -itd \
    --name weixin-robot \
    --restart=always \
    -p 6000:6000  \
    llody/weixin-robot:v1-amd64
```

> KEY在机器人处获取。

### 修改Alertmanager配置

```bash
vim alertmanager.yml
```

```yaml
global:
  resolve_timeout: 5m 
templates:
  - '/etc/alertmanager/template/*.tmpl'
route:
  group_by: ['alertname','instance']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 1h
  receiver: 'team-X-webhook'
  routes:
  - match:
      team: 'team-X'
    receiver: 'team-X-webhook'
receivers:
  - name: 'team-X-webhook'
    webhook_configs:
      - url: 'http://192.168.1.225:6000/alertinfo'
        send_resolved: true
  
  
  

```

### 重启Alertmanager服务

### 告警通知

![告警通知](https://raw.githubusercontent.com/llody55/weixin_robot/main/docs/1.png "告警通知")

### 恢复通知

![恢复通知](https://raw.githubusercontent.com/llody55/weixin_robot/main/docs/2.png "恢复通知")
