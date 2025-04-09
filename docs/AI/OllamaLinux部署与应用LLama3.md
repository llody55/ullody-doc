## Ollama Linux部署与应用LLama 3

### Linux下Ollama的安装与配置

#### 简介

> Ollama提供了一种简单的安装方法，只需一行命令即可完成安装，但是对于想要更深入了解和自定义安装的用户，同时也提供了手动安装的步骤。

#### 系统要求

> 在开始部署之前，请确保您的系统满足以下基本要求：
>
> 硬件配置： - 处理器：建议8核以上 - 内存：最低16GB，建议32GB - 存储空间：至少预留50GB可用空间 - 操作系统：支持Linux、MacOS或Windows - 软件要求：已安装最新版本的Ollama - 网络连接：需要稳定的网络环境用于下载模型

#### 一键安装

```bash
curl -fsSL https://ollama.com/install.sh | sh
#也许需要相应的权限才能安装，可以使用命令
sudo curl -fsSL https://ollama.com/install.sh | sh
```

#### 手动安装

```bash
# 下载Ollama二进制文件
sudo curl -L https://ollama.com/download/ollama-linux-amd64 -o /usr/bin/ollama
sudo chmod +x /usr/bin/ollama
# 有可能是其它目录，可以查看服务对应的目录, 例如我机器的目录在/usr/local/bin
sudo curl -L https://ollama.com/download/ollama-linux-amd64 -o /usr/local/bin/ollama
sudo chmod +x /usr/local/bin/ollama

# 创建Ollama用户
sudo useradd -r -s /bin/false -m -d /usr/share/ollama ollama

```

#### 将Ollama设置为启动服务

##### 创建服务文件  -- /etc/systemd/system/ollama.service

```bash
[Unit]
Description=Ollama Service
After=network-online.target

[Service]
ExecStart=/usr/local/bin/ollama serve
User=ollama
Group=ollama
Restart=always
RestartSec=3

Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_MODELS=/data/app/models/ollama"

[Install]
WantedBy=default.target
```

##### 模型目录授权

```bash
chown -R ollama:ollama  /data/app/models/ollama
```

##### 重载配置并启动

```bash
systemctl daemon-reload
systemctl start ollama

```

#### Docker安装ollama

```bash
docker run -d --name ollama -v /home/docker/ollama:/root/.ollama -p 11434:11434 ollama/ollama

# /root/.ollama : 模型默认存储路径，需要持久化。
```

#### 更新Ollama

> 随着Ollama的不断更新和改进，定期更新您的Ollama安装是非常重要的。更新Ollama的过程与安装类似，可以通过运行安装脚本或直接下载最新的二进制文件来完成：

##### 一键更新

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

##### 手动更新

```bash
sudo curl -L https://ollama.com/download/ollama-linux-amd64 -o /usr/local/bin/ollama
sudo chmod +x /usr/local/bin/ollama
```

#### 卸载Ollama

如果决定不再使用Ollama，可以通过以下步骤将其完全从系统中移除：

（1）停止并禁用服务：

```text
sudo systemctl stop ollama
sudo systemctl disable ollama
```

（2）删除服务文件和Ollama二进制文件：

```text
sudo rm /etc/systemd/system/ollama.service 
sudo rm $(which ollama)
```

（3）清理Ollama用户和组：

```text
sudo rm -r /usr/share/ollama
sudo userdel ollama
sudo groupdel ollama
```

通过以上步骤，不仅能够在Linux平台上成功安装和配置Ollama，还能够灵活地进行更新和卸载。

### Ollama下载模型

#### 下载llama3

```bash
ollama pull llama3:8b
```

#### Ollama的模型库

> 模型库地址：https://ollama.com/search

#### 相关命令

```bash
# 查看当前已经下载的模型列表
ollama list

# 下载模型(去选择你喜欢的模型吧)
ollama pull Mistral

# 修改监听端口(默认监听在127.0.0.1，为了能被外部访问到，需要修改)
$env:ollama_host = "0.0.0.0:11434"

# 开启服务
ollama serve
```

### 验证可用

```bash
curl http://192.168.1.55:11434/api/chat -d '{
  "model": "llama3:8b",
  "messages": [
    { "role": "user", "content": "why is the sky blue?" }
  ]
}'
```

### **部署 Open-webui（可选）**

```bash
docker run -d -p 8080:8080 -e OLLAMA_BASE_URL=http://你服务器的ip地址:11434 -v /home/docker/open-webui:/app/backend/data --name open-webui --restart always swr.cn-southwest-2.myhuaweicloud.com/llody/open-webui/open-webui:main
```
