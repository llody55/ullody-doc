# Jenkins 入门教程

## 什么是 Jenkins？

>
> [Jenkins](https://www.jenkins.io/)是一个用 Java 编写的持续开源集成项目。在与 Oracle 发生争执后，它从 Hudson Project 分叉而来。自分叉以来，Jenkins 已发展成为不仅仅是一个持续集成解决方案的项目。
>
> Jenkins 不再只是一个 持续集成 工具。相反，它是一个持续集成和持续交付工具。您可以使用 Jenkins 以及各种免费提供的社区插件和原生 Jenkins 工作流来编排应用程序部署。
>
> [Jenkins 还通过Jenkins X](https://jenkins-x.io/)支持 GitOps 工作流。它可以帮助您加速 Kubernetes 上的持续交付流水线。


## Jenkins 适用场景

以下是我在使用 Jenkins 的经验中总结的主要 Jenkins 用例。

1. **持续集成：** 借助 Jenkins 管道，我们可以实现应用程序和基础设施即代码的 CI。
2. **持续交付：** 您可以使用 Jenkins 管道设置明确定义且自动化的应用程序交付工作流程 CD。
3. **自动化和临时任务** ：使用 Jenkins 作业和管道，您可以自动化基础设施组件并执行临时基础设施任务（备份、远程执行等）。

## Jenkins 架构

> 下图展示了Jenkins的整体架构

![Jenkins架构](https://static.llody.top/ullody-doc/images/jenkins_2024-05-28_16_33_48.png "Jenkins架构")

### Jenkins Master（服务器）

> Jenkins 的服务器或主节点保存所有关键配置。Jenkins 主服务器就像一个控制服务器，负责协调管道中定义的所有工作流程。例如，调度作业、监控作业等。

#### Jenkins Jobs

> Jenkins的流水线管道看起来像这样。

```yaml
pipeline {
    agent any

    stages {
        stage('Hello') {
            steps {
                echo 'Hello World'
            }
        }
        stage('作业') {
            steps {
                echo '相关命令'
            }
        }
    }
}

```

> 有多种作业类型可用于支持您的持续集成和持续交付工作流程。

#### Jenkins 插件

> 插件是社区开发的模块，您可以将其安装在 Jenkins 服务器上。它可以帮助您实现 Jenkins 本身没有的更多功能。
>
> 例如：您想在Jenkins中构建出docker镜像，就可以安装Docker插件，然后实现自己的逻辑就可以将应用打包成Docker镜像并推送到镜像仓库中。
>
> 您也可以下载插件文件并将其复制到 `/var/lib/jenkins`文件夹下的plugins目录进行安装。

#### Jenkins 安全

Jenkins 具有以下类型的主要身份验证方法。

1. **Jenkins 自己的用户数据库：** 由 Jenkins 自己的数据库维护的用户集。当我们说数据库时，它都是平面配置文件（XML 文件）。
2. **LDAP 集成** ：- 使用企业 LDAP 配置进行 Jenkins 身份验证。
3. **SAML 单点登录 (SSO)** ：支持使用 Okta、AzureAD、Auth0 等提供商进行单点登录，例如：**gitlab**。

> 通过基于 Jenkins 矩阵的安全性，您可以进一步为用户分配角色，以确定他们在 Jenkins 上拥有什么权限。

#### Jenkins 凭证

当您设置 Jenkins 管道时，有时需要使用机密连接到云帐户、服务器、数据库或 API 端点。

在 Jenkins 中，您可以将不同类型的秘密保存为凭证。

1. 秘密文本
2. 用户名密码
3. SSH 密钥

> 所有凭证均由 Jenkins 加密（AES）。机密存储在 `$JENKINS_HOME/secrets/`目录中。保护此目录并将其从 Jenkins 备份中排除非常重要。

#### Jenkins 节点/云

> 您可以配置多个代理节点（Linux/Windows）或云（[docker](https://doc.llody.top/?#/%E4%BA%91%E5%8E%9F%E7%94%9F/docker/docker)，kubernetes）来执行 Jenkins 作业。

#### Jenkins 全局设置（配置系统）

>
> 在 Jenkins 全局配置下，您拥有所有已安装插件的配置和原生 Jenkins 全局配置。
>
> 此外，您还可以在此部分下配置全局环境变量。例如，您可以将工具（Nexus、Sonarqube 等）URL 存储为全局环境变量并在管道中使用它们。这样，更容易进行 URL 更改，这些更改会反映在所有 Jenkins 作业中。

#### Jenkins 日志

> 提供所有 Jenkins 服务器操作的日志信息，包括作业日志、插件日志、webhook 日志等。

#### 注意

> [!Warnung]
>
> 上述组件的所有配置都作为配置文件（XML 文件）存在于 Jenkins 主节点数据目录中。



### Jenkins Slave

#### Jenkins Agent代理

> Jenkins agent是实际执行作业中提到的所有步骤的工作节点。创建 Jenkins 作业时，必须为其分配一个代理。每个代理都有一个标签作为唯一标识符。
>
> 当您从主服务器触发 Jenkins 作业时，实际执行发生在作业中配置的代理节点上。
>
> 您可以在没有 Jenkins 代理的情况下在 Jenkins 服务器中运行作业。在这种情况下，主节点充当代理。但是，建议的方法是针对不同的作业要求设置 Jenkins 主代理，这样您就不会因为作业所需的任何系统范围的配置更改而破坏 Jenkins 服务器。
>
> 您可以将任意数量的 Jenkins 代理附加到主服务器，并使用 Windows、Linux 服务器甚至容器的组合作为构建代理。
>
> 此外，您还可以根据用例限制作业在特定代理上运行。例如，如果您有一个采用 Java 8 配置的代理，则可以为需要 Java 8 环境的作业分配此代理。
>
> 使用代理没有单一的标准。您可以根据项目需求设置工作流程和策略。


#### Jenkins 主代理连接

>
> 你可以通过两种方式连接 Jenkins 主服务器和代理服务器
>
> 1. **使用 SSH 方法：** 使用 ssh 协议连接到代理。连接由 Jenkins 主服务器发起。主服务器和代理服务器之间应通过端口 22 建立连接。
> 2. **使用 JNLP 方法：** 使用 Java JNLP 协议（[Java 网络启动协议](https://docs.oracle.com/javase/tutorial/deployment/deploymentInDepth/jnlp.html)）。在此方法中，Java 代理从具有 Jenkins 主节点详细信息的代理启动。为此，主节点防火墙应允许在指定的 JNLP 端口上进行连接。通常分配的端口为 50000。此值是可配置的。
>
> Jenkins 代理有两种类型
>
> 1. **代理节点：** 这些是将配置为**静态代理**的服务器（Windows/Linux） 。这些代理将始终处于运行状态并保持与 Jenkins 服务器的连接。组织使用自定义脚本在不使用时关闭和重新启动代理。通常在晚上和周末。
> 2. **代理云： Jenkins 云代理是一种具有****动态代理**的概念。这意味着，每当您触发一项作业时，代理都会根据需要部署为 VM/容器，并在作业完成后删除。当您拥有庞大的 Jenkins 生态系统和持续构建时，这种方法可以节省基础设施成本。

---



> 下图显示了不同类型的代理和连接类型的高级视图

![视图](https://static.llody.top/ullody-doc/images/jenkins_agent_2024-05-28_17_21_51.png "视图")

### Jenkins数据

> 所有 Jenkins 数据都存储在 **/var/lib/jenkins/** 文件夹位置。
>
> 数据包括所有作业配置文件、插件配置、机密、节点信息等。与其他工具相比，它使 Jenkins 迁移非常容易。
>
> 如果您查看 **/var/lib/jenkins/** ，您会发现大多数配置都是 xml 格式的。
>
> **每天备份 Jenkins 数据**文件夹至关重要。出于某种原因，如果您的 Jenkins 服务器数据损坏，您可以使用数据备份恢复整个 Jenkins。
>
> 理想情况下，在生产中部署 Jenkins 时，**会将一个专用的额外卷连接**到保存所有 Jenkins 数据的 Jenkins 服务器。

## 结论

> 我个人喜欢 Jenkins，因为它有强大的社区支持、丰富的官方和社区文档。
>
> 缺点也非常明显，有点重，没法做到轻量和优雅。
>
> 后面我也会根据自己的实践经验补充在**云原生**环境的Jenkins教程。
