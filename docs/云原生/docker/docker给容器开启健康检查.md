## 开启健康检查 -- healthcheck

> docker 部署的容器，运行状态已经UP了，但是还没有正常提供服务，连接显示失败，如何知道容器部署的服务已经正常运行了呢？
>
> healthcheck 为此而生，主要是对自定义的容器进行探测监控。
>
> 官方文档：[https://docs.docker.com/reference/dockerfile/#healthcheck](https://docs.docker.com/reference/dockerfile/#healthcheck)

## 两种形式

### 1、使用Dockerfile

```bash
# 命令格式
HEALTHCHECK [选项] CMD 命令

# 示例命令
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1

# 示例Dockerfile
FROM nginx
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
HEALTHCHECK --interval=30s --timeout=5s \
  CMD curl -fs http://localhost:8080/ || exit 1
# 每30秒探测一次，每次探测超过5秒没响应则表示失败。
```


> `[选项]`是可选的，比如设置超时时间 `--timeout=5s`，间隔时间 `--interval=30s`，开始检查前的等待时间 `--start-period=10s`，以及尝试的次数 `--retries=3`。
>
> `CMD`后面跟的是用于检查健康的命令。
>
> 这里，如果在三次尝试中，`curl`命令因为不能访问 `http://localhost:8080/`而失败（服务器不响应或返回4xx和5xx错误），容器会被标记为不健康。

### 2、使用docker run命令

```
docker run -itd --name nginx --health-cmd="curl -f http://localhost || exit 1; echo healthy" --health-interval=30s --health-timeout=5s --health-retries=3 --health-start-period=5s llody/nginx:v1.22.0

# 实践示例
docker run -itd --name nginx -p 30080:30080  --health-cmd="curl -f http://localhost:30080/healthz || exit 1; echo healthy" --health-interval=30s --health-timeout=30s --health-retries=3 --health-start-period=5s -v /opt/test/:/etc/nginx/conf.d/  llody/nginx:v1.22.0
```

> 说明：
>
> * --health-cmd: 探测地址，要确定可以通过这个地址探测到某个端口或者某个接口，例如：`curl -f http://localhost:9086/healthz`
> * --health-interval:  间隔多少时间探测一次
> * --health-timeout: 探测一次的最长响应等待时间，超过则表示探测失败
> * --health-retries: 总共探测多少次
> * --health-start-period: 启动多久开始探测

## 注意

* 健康检查命令需要能够在容器内运行。例如，如果使用 `curl`作为健康检查命令，需要确保 `curl`在容器内是可用的。
* 健康检查一旦有一次探测成功，就会标记容器的健康状态。
* 健康检查探测失败，只会标记容器，不会重启容器，如果要让检查失败的容器重启，需要配合自动重启策略实现，例如配置：`--restart on-failure`
* 健康检查并不会自动修复不健康的容器。它只提供了一种机制来识别容器是否运行正常。你需要根据健康检查的结果来决定是否需要采取进一步的行动。
