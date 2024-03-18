## 在Linux环境中, 常用的解压缩命令示例


### **gzip** ：

* 命令形式：`gzip filename`
* 用于创建 `.gz`格式的压缩文件。它是GNU zip的缩写，广泛用于Unix和Linux系统。
* 解压命令：`gunzip filename.gz` 或 `gzip -d filename.gz`

### **bzip2** ：

* 命令形式：`bzip2 filename`
* 用于创建 `.bz2`格式的压缩文件，提供比gzip更高的压缩比。
* 解压命令：`bunzip2 filename.bz2` 或 `bzip2 -d filename.bz2`

### **xz** ：

* 命令形式：`xz filename`
* 用于创建 `.xz`格式的压缩文件，提供高压缩比率，是xz压缩工具的一部分。
* 解压命令：`unxz filename.xz` 或 `xz -d filename.xz`

### **tar** ：

* 命令形式：`tar cvf archive_name.tar dirname/`
* 用于打包多个文件和目录到一个归档文件中，但本身不进行压缩。经常与gzip、bzip2和xz结合使用进行压缩。
* 解压命令：`tar xvf archive_name.tar`

### **zip/unzip** ：

* 压缩命令：`zip -r archive_name.zip dirname/`
* 生成 `.zip`格式的压缩文件，兼容性好，适用于多种操作系统。
* 解压命令：`unzip archive_name.zip`

### **7z (7-Zip)** ：

* 压缩命令：`7z a archive_name.7z dirname/`
* 7-Zip是一个开源的文件压缩程序，支持多种压缩格式。`.7z`格式提供了高压缩比。
* 解压命令：`7z x archive_name.7z`
