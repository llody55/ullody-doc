#### **简介**

**PyArmor** 是一个用于加密和保护 Python 脚本的工具，通过对代码进行混淆（Obfuscation）和加密处理，防止源代码被直接反编译或篡改。它适用于保护商业软件、闭源项目或敏感脚本。

 **核心功能** ：

* **代码混淆** ：重命名变量、函数、类名，使代码难以阅读。
* **加密保护** ：将部分代码转换为加密字节码，运行时动态解密。
* **许可证控制** ：限制脚本运行时间、绑定特定设备或设置过期时间。
* **反调试机制** ：防止逆向工程工具（如调试器）分析代码。

 **适用场景** ：

* 商业软件保护
* 分发闭源 Python 库
* 防止敏感业务逻辑泄露

#### 1.安装python并开启共享库

##### 安装依赖

```bash
sudo yum -y groupinstall "Development tools"
sudo yum -y install zlib-devel bzip2-devel openssl-devel ncurses-devel sqlite-devel readline-devel tk-devel gdbm-devel db4-devel libpcap-devel xz-devel libffi-devel gcc libffi-devel mysql-devel
```

##### **配置和编译**

```bash
# 解压
tar xf Python-3.9.10.tgz
# 进入解压目录
cd Python-3.9.10
# 编译
./configure --enable-shared --prefix=/usr/local/python3 --with-ssl-default-suites=openssl CFLAGS="-O2"
# 当前路径自行替换
export LD_LIBRARY_PATH=/opt/Python-3.9.10:$LD_LIBRARY_PATH
make -j$(nproc)
make altinstall
echo "/usr/local/python3/lib" | tee /etc/ld.so.conf.d/python3.9.conf
ldconfig
ln -s /usr/local/python3/bin/python3.9 /usr/bin/python3
ln -s /usr/local/python3/bin/pip3.9 /usr/bin/pip3
```

#### **2. 安装**

通过 `pip` 安装 PyArmor：

```bash
pip3 install pyarmor -i https://mirrors.aliyun.com/pypi/simple/
```

验证安装：

```bash
# 创建软连接
ln -s /usr/local/python3/bin/pyarmor /usr/bin/pyarmor
# 验证版本
pyarmor --version
```

---

#### **3. 基本使用**

##### **3.1 加密单个脚本**

假设需要加密 `hello.py`：

```bash
# hello.py
print("Hello, World!")
```

 **加密命令** ：

```bash
pyarmor gen hello.py
```

* 输出文件默认保存在 `dist/` 目录。
* 加密后的脚本可通过 Python 直接运行：

  ```bash
  python dist/hello.py
  ```

##### **3.2 加密完整项目**

加密整个项目目录（如 `src/`）：

```bash
pyarmor gen -O dist_proj -r src/
```

* `-O` 指定输出目录。
* `-r` 递归处理子目录。

---

#### **4. 高级功能**

##### **4.1 绑定硬件设备**

将脚本绑定到特定机器的 MAC 地址或硬盘序列号：

```bash
pyarmor gen -b "00:11:22:33:44:55" hello.py
```

##### **4.2 设置过期时间**

限制脚本在指定日期后无法运行：

```bash
# 设置远程服务器时间
pyarmor cfg nts=pool.ntp.org
pyarmor gen -e 2024-12-31 hello.py

```

##### **4.3 生成独立加密包**

加密脚本并打包为独立分发文件：

```bash
pyarmor gen -O dist_pkg --pack hello.py
```

##### **4.4 跨平台加密**

1、指定架构平台

```bash
# 为Linux和Windows的amd64架构生成加密脚本,并设置过期时间
pyarmor g --platform linux.x86_64,windows.x86_64 -O dist_multi  -e 2025-04-10 hello.py

# 或者
pyarmor g --platform linux.x86_64 -O dist_linux  -e 2025-04-10 hello.py 

# Windows需要有win环境
pyarmor g --platform windows.x86_64 -O dist_windows  -e 2025-04-10 hello.py
```

2、与docker集成

```bash
FROM python:3.9-slim
RUN pip install pyarmor
COPY src/ /app
RUN pyarmor gen --platform linux.x86_64 -O /app/dist /app/hello.py
```

##### **4.5 与 PyInstaller 集成**

1. 先用 PyArmor 加密脚本：

   ```bash
   pyarmor gen hello.py
   ```
2. 使用 PyInstaller 打包加密后的脚本：

   ```bash
   # 安装组件
   pip3 install pyinstaller -i https://mirrors.aliyun.com/pypi/simple/
   # 创建软连接
   ln -s /usr/local/python3/bin/pyinstaller /usr/bin/pyinstaller
   # 默认打包
   pyinstaller --onefile dist/hello.py

   # Linux
   cd dist_linux/
   pyinstaller -F hello.py 

   # 在 Windows CMD/PowerShell 操作
   cd dist_windows/
   pyinstaller -F hello.py
   ```

---

#### **5. 配置文件（可选）**

通过 `config.cfg` 定义复杂规则（如排除某些文件）：

```ini
# config.cfg
[options]
recursive = 1
exclude = test/*.py, tmp/
```

应用配置：

```bash
pyarmor gen --config config.cfg -r src/
```

---

#### **6. 注意事项**

* **兼容性** ：
* 支持 Python 2.7 和 3.6+。
* 加密后的脚本需在相同 Python 版本和平台运行。
* **依赖处理** ：
* 加密脚本不会自动打包第三方库，需手动处理依赖。
* **性能影响** ：
* 首次运行时解密可能略微增加启动时间，不影响运行时性能。
* **安全性限制** ：
* 无法完全防止内存抓取或高级逆向工程，但显著提高破解难度。

---
