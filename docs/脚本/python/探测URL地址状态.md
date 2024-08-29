## 探测URL地址状态

> 基于request请求，探测URL地址在一定时间内的可用性，并打印出当前时间、状态码和响应时间

## 完整脚本如下

```python
'''
Author: llody 745719408@qq.com
Date: 2024-08-23 17:04:16
LastEditors: llody 745719408@qq.com
LastEditTime: 2024-08-29 10:40:19
FilePath: \K8S\组件包\脚本\python操作应用\探测地址状态.py
Description: 这个脚本用于探测URL状态码和响应时间。它会每隔3秒钟请求一次指定的URL，并打印出当前时间、状态码和响应时间（如果可用）。
'''
import requests
import time
from datetime import datetime

# 指定要请求的URL
url = "https://doc.llody.top/"

def get_status_code_and_response_time(url):
    try:
        start_time = time.time()  # 记录开始时间
        response = requests.head(url, timeout=5)  # 使用HEAD请求以减少数据传输
        end_time = time.time()  # 记录结束时间
        response_time = (end_time - start_time) * 1000  # 转换为毫秒
        return response.status_code, response_time
    except requests.RequestException as e:
        return f"Error: {e}", None

def main():
    while True:
        # 获取当前时间
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        # 获取URL的状态码和响应时间
        status_code, response_time = get_status_code_and_response_time(url)
        # 打印时间、状态码和响应时间
        if response_time is not None:
            print(f"{current_time} - Status Code: {status_code}, Response Time: {response_time:.2f} ms")
        else:
            print(f"{current_time} - Status Code: {status_code}")  # 出现错误时只打印状态码
        # 等待3秒钟
        time.sleep(3)

if __name__ == "__main__":
    main()


```

## 使用方法

```bash
python3 code_url_status.py
```
