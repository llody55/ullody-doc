## jq简介

> jq可以对json数据进行分片、过滤、映射和转换，和sed、awk、grep等命令一样，都可以让你轻松地把玩文本。它能轻松地把你拥有的数据转换成你期望的格式，而且需要写的程序通常也比你期望的更加简短。
>
> jq是用C编写，没有运行时依赖，所以几乎可以运行在任何系统上。预编译的二进制文件可以直接在Linux、OS X和windows系统上运行，当然在linux和OS X系统你需要赋与其可执行权限；在linux系统中也可以直接用yum安装。
>
> 在知道jq命令之前，我在linux系统中极少直接去命令去处理json数据，除非只是简单地从中过滤某个字符串，那就用grep结合正则表达式来解决。所以，掌握了jq命令，则可以让linux命令和shell脚本在处理json数据时变得得心应手。

## 安装jq

### 基于Debian的系统

```bash
sudo apt-get update
sudo apt-get install jq
```

### 对于CentOS，需要启用EPEL仓库

```bash
安装EPEL源：
yum install epel-release -y
安装完EPEL源后，可以查看下jq包是否存在：
yum list jq
安装jq：
yum install jq
```

## 基本用法

### 创建一个json.txt文件

```bash
cat json.txt 
[{"name":"站长工具","url":"http://tool.chinaz.com","address":{"city":"厦门","country":"中国"},"arrayBrowser":[{"name":"Google","url":"http://www.google.com"},{"name":"Baidu","url":"http://www.baidu.com"}]},{"name":"站长之家","url":"http://tool.zzhome.com","address":{"city":"大连","country":"中国"},"arrayBrowser":[{"name":"360","url":"http://www.so.com"},{"name":"bing","url":"http://www.bing.com"}]}]

```

> 最简单的jq程序是表达式"."，它不改变输入，但可以将其优美地输出，便于阅读和理解。

### 管道线 |jq支持管道线

> |，它如同linux命令中的管道线——把前面命令的输出当作是后面命令的输入。如下命令把.[0]作为{…}的输入，进而访问嵌套的属性，如.name和.address.city。观察如下几个命令，通过改变|前后的输入和输出来达到不同的效果

```bash
cat json.txt | jq '.[0] | {name:.name,city:.address.city}'

{
  "name": "站长工具",
  "city": "厦门"
}

cat json.txt | jq '.[0] | {name:.arrayBrowser[1].name,city:.address.city}'

{
  "name": "Baidu",
  "city": "厦门"
}

cat json.txt | jq ".[] | {name:.arrayBrowser[1].name,city:.address.city}"

{
  "name": "Baidu",
  "city": "厦门"
}
{
  "name": "bing",
  "city": "大连"
}

```

### 数组[] 如果希望把jq的输出当作一个数组

```bash
cat json.txt | jq "[.[] | {name:.arrayBrowser[1].name,city:.address.city}]"
[
  {
    "name": "Baidu",
    "city": "厦门"
  },
  {
    "name": "bing",
    "city": "大连"
  }
]

```

### 自定义key在{}中，冒号前面的名字是映射的名称，你可以任意修改

```bash
cat json.txt | jq "[.[] | {name_001:.arrayBrowser[1].name,city_002:.address.city}]"

[
  {
    "name_001": "Baidu",
    "city_002": "厦门"
  },
  {
    "name_001": "bing",
    "city_002": "大连"
  }
]
```
