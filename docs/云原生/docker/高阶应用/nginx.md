## 构建 - NGINX - 基础镜像

### 创建基础配置文件 -- `nginx.conf`

```bash
vim nginx.conf

user  nginx;
worker_processes  1;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;


events {
    worker_connections  4096;
}


http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    server_tokens   off;
    sendfile        on;
    tcp_nopush      on;

    keepalive_timeout  65;

    include /etc/nginx/conf.d/*.conf;
}

```

### 创建Dockerfile

```bash
FROM nginx:1.22.0

LABEL maintainer llody

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 构建镜像

```bash
docker buildx build -t llody/nginx:v1.22.0  --platform=linux/arm64,linux/amd64 -o type=registry .
```
