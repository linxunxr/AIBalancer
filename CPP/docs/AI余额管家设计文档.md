# DeepSeek余额监测工具 - 完整规格设计方案

## 一、项目概述

### 1.1 项目背景
随着DeepSeek等AI服务的广泛应用，开发者和管理者需要实时监控API使用情况和账户余额，以避免服务中断。本项目旨在开发一款基于QT/QML的桌面应用程序，专门用于监测DeepSeek API账户余额，并提供直观的可视化界面和提醒功能。

### 1.2 项目目标
- 实现DeepSeek API余额的实时监测和可视化展示
- 提供余额阈值告警功能
- 支持多账户管理
- 通过GitHub实现自动化分发和版本更新

### 1.3 参考资源
根据搜索结果，我们获得了以下关键参考信息：
- DeepSeek官方提供了"查询余额"API接口[3][5]
- 已有浏览器插件实现（deepseek-monitor）可作为功能参考[2]
- DeepSeek V4 API定价和配置指南[1]

## 二、功能需求规格

### 2.1 核心功能
| 功能模块 | 详细描述 | 优先级 |
|---------|---------|-------|
| **账户管理** | 添加、编辑、删除DeepSeek API账户 | P0 |
| **余额查询** | 实时查询账户余额，支持手动和自动刷新 | P0 |
| **余额显示** | 可视化展示当前余额、已使用额度、剩余额度 | P0 |
| **阈值告警** | 设置余额阈值，触发告警通知 | P1 |
| **历史记录** | 记录余额变化历史，生成使用趋势图 | P1 |
| **多账户切换** | 同时管理多个DeepSeek账户 | P1 |
| **导出功能** | 导出余额报告（CSV/PDF格式） | P2 |

### 2.2 性能需求
- 余额查询响应时间：< 3秒
- 界面刷新频率：可配置（默认30分钟）
- 内存占用：< 50MB
- 启动时间：< 5秒

## 三、技术架构设计

### 3.1 技术栈选择
| 技术领域 | 选择方案 | 理由 |
|---------|---------|------|
| **UI框架** | QT 6.5 + QML | 跨平台、现代化界面、声明式编程 |
| **后端语言** | C++ 20 | 与QT原生集成、高性能、现代化特性（Coroutines/Ranges/Concepts） |
| **网络请求** | QtNetwork + RESTful API | 支持HTTPS、异步请求 |
| **数据存储** | SQLite + QSettings | 轻量级、跨平台 |
| **构建系统** | CMake | 现代化、跨平台构建 |
| **版本控制** | Git + GitHub | 代码托管、协作开发 |

### 3.2 系统架构
```
┌─────────────────────────────────────────────────────┐
│                    Presentation Layer                │
│  QML Components: Dashboard, Settings, Alerts, About │
└─────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────┐
│                     Business Layer                   │
│  ├─ AccountManager (账户管理)                       │
│  ├─ BalanceFetcher (余额获取)                       │
│  ├─ AlertEngine (告警引擎)                          │
│  └─ DataExporter (数据导出)                         │
└─────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────┐
│                      Data Layer                      │
│  ├─ SQLite Database (历史数据)                      │
│  └─ QSettings (配置文件)                            │
└─────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────┐
│                  External Integration                │
│              DeepSeek Balance API [3][5]            │
└─────────────────────────────────────────────────────┘
```

### 3.3 模块详细设计

#### 3.3.1 DeepSeek API集成模块
```cpp
class DeepSeekBalanceFetcher : public QObject {
    Q_OBJECT
public:
    explicit DeepSeekBalanceFetcher(QObject *parent = nullptr);
  
    // API配置
    struct ApiConfig {
        QString apiKey;
        QString endpoint;  // 默认: https://api.deepseek.com
        int timeoutMs;     // 默认: 5000
    };
  
    // 余额信息
    struct BalanceInfo {
        double totalBalance;     // 总余额
        double usedBalance;      // 已使用额度
        double remainingBalance; // 剩余额度
        QDateTime lastUpdated;   // 最后更新时间
        QString currency;        // 货币单位
        QJsonObject rawData;     // 原始API响应
    };
  
    // 主要方法
    Q_INVOKABLE void fetchBalance(const QString &apiKey);
    Q_INVOKABLE BalanceInfo getCachedBalance() const;
  
signals:
    void balanceUpdated(const BalanceInfo &info);
    void errorOccurred(const QString &errorMessage);
  
private slots:
    void onNetworkReplyFinished();
};
```

#### 3.3.2 API调用实现
根据DeepSeek API文档，余额查询API接口为：
- **API端点**: `GET https://api.deepseek.com/billing/balance`
- **认证方式**: Bearer Token (API Key)
- **请求头**: 
  ```
  Authorization: Bearer {api_key}
  Content-Type: application/json
  ```
- **响应格式**: JSON (示例参考官方文档[3][5])

## 四、用户界面设计

### 4.1 界面布局设计
```
┌─────────────────────────────────────────────────────┐
│  DeepSeek余额监测 v1.0.0                      — □ × │
├─────────────────────────────────────────────────────┤
│  [仪表盘] [账户管理] [告警设置] [历史记录] [关于]   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────────────────────────────┐     │
│  │  当前余额: $156.78                        │     │
│  │  已使用: $43.22                           │     │
│  │  剩余额度: $113.56                        │     │
│  │  最后更新: 2024-01-15 14:30:25            │     │
│  └────────────────────────────────────────────┘     │
│                                                      │
│  ┌────────────────────────────────────────────┐     │
│  │  账户列表                                ▼ │     │
│  │  ● 默认账户 (last@example.com)           │     │
│  │  ○ 备用账户 (backup@example.com)         │     │
│  │  + 添加新账户                            │     │
│  └────────────────────────────────────────────┘     │
│                                                      │
│  [立即刷新]  [自动刷新: 30分钟]  [导出报告]        │
└─────────────────────────────────────────────────────┘
```

### 4.2 QML组件设计

#### 4.2.1 主仪表盘组件
```qml
// Dashboard.qml
import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

Page {
    id: dashboard
  
    ColumnLayout {
        anchors.fill: parent
        spacing: 20
      
        // 余额卡片
        BalanceCard {
            id: balanceCard
            Layout.fillWidth: true
            Layout.preferredHeight: 200
            currentBalance: balanceFetcher.currentBalance
            lastUpdated: balanceFetcher.lastUpdated
        }
      
        // 账户列表
        AccountListView {
            id: accountList
            Layout.fillWidth: true
            Layout.preferredHeight: 150
            model: accountManager.accounts
            onAccountSelected: balanceFetcher.fetchBalance(apiKey)
        }
      
        // 控制按钮组
        RowLayout {
            Layout.fillWidth: true
          
            Button {
                text: "立即刷新"
                onClicked: balanceFetcher.refreshAll()
            }
          
            ComboBox {
                model: ["关闭", "5分钟", "15分钟", "30分钟", "1小时"]
                currentIndex: 3
                onCurrentIndexChanged: settings.autoRefreshInterval = index
            }
          
            Button {
                text: "导出报告"
                onClicked: exporter.exportToCSV()
            }
        }
    }
}
```

#### 4.2.2 余额卡片组件
```qml
// BalanceCard.qml
Rectangle {
    property double currentBalance: 0.0
    property date lastUpdated: new Date()
  
    radius: 10
    color: "#f8f9fa"
    border.color: "#dee2e6"
    border.width: 1
  
    ColumnLayout {
        anchors.centerIn: parent
        spacing: 10
      
        Text {
            text: "当前余额"
            font.pixelSize: 16
            color: "#6c757d"
        }
      
        Text {
            text: "$" + currentBalance.toFixed(2)
            font.pixelSize: 36
            font.bold: true
            color: currentBalance < 10 ? "#dc3545" : "#28a745"
        }
      
        Text {
            text: "最后更新: " + Qt.formatDateTime(lastUpdated, "yyyy-MM-dd hh:mm:ss")
            font.pixelSize: 12
            color: "#6c757d"
        }
    }
}
```

## 五、数据存储方案

### 5.1 数据库设计
```sql
-- accounts表 - 存储账户信息
CREATE TABLE accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_name TEXT NOT NULL,
    api_key_encrypted TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
);

-- balance_history表 - 存储余额历史
CREATE TABLE balance_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    balance REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- alerts表 - 存储告警配置
CREATE TABLE alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    threshold REAL NOT NULL,
    notification_method TEXT, -- 'popup', 'email', 'both'
    is_enabled BOOLEAN DEFAULT 1,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);
```

### 5.2 配置存储
使用QSettings存储应用程序配置：
```cpp
class AppSettings : public QObject {
    Q_OBJECT
public:
    Q_PROPERTY(int autoRefreshInterval READ autoRefreshInterval WRITE setAutoRefreshInterval)
    Q_PROPERTY(bool startWithSystem READ startWithSystem WRITE setStartWithSystem)
    Q_PROPERTY(QString theme READ theme WRITE setTheme)
  
    // 单例模式
    static AppSettings* instance();
  
private:
    QSettings m_settings;
};
```

## 六、API集成详细规范

### 6.1 DeepSeek余额查询API
根据官方文档[3][5]，API调用规范如下：

#### 6.1.1 请求示例
```cpp
QNetworkRequest createBalanceRequest(const QString &apiKey) {
    QUrl url("https://api.deepseek.com/billing/balance");
    QNetworkRequest request(url);
  
    // 设置请求头
    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
    request.setRawHeader("Authorization", QString("Bearer %1").arg(apiKey).toUtf8());
    request.setRawHeader("User-Agent", "DeepSeek-Balance-Monitor/1.0");
  
    // 设置超时
    request.setAttribute(QNetworkRequest::Http2AllowedAttribute, true);
    request.setAttribute(QNetworkRequest::CacheLoadControlAttribute, 
                        QNetworkRequest::AlwaysNetwork);
  
    return request;
}
```

#### 6.1.2 响应处理
```cpp
void DeepSeekBalanceFetcher::parseBalanceResponse(const QByteArray &data) {
    QJsonDocument doc = QJsonDocument::fromJson(data);
    if (doc.isNull()) {
        emit errorOccurred("Invalid JSON response");
        return;
    }
  
    QJsonObject obj = doc.object();
    BalanceInfo info;
  
    // 解析余额信息（根据实际API响应结构调整）
    info.totalBalance = obj.value("total_balance").toDouble();
    info.usedBalance = obj.value("used_balance").toDouble();
    info.remainingBalance = obj.value("remaining_balance").toDouble();
    info.currency = obj.value("currency").toString("USD");
    info.lastUpdated = QDateTime::currentDateTime();
    info.rawData = obj;
  
    // 缓存并通知更新
    m_cachedBalance = info;
    emit balanceUpdated(info);
  
    // 保存到历史记录
    saveBalanceToHistory(info);
}
```

### 6.2 错误处理机制
```cpp
class ApiErrorHandler {
public:
    enum ErrorType {
        NetworkError,
        AuthenticationError,
        RateLimitError,
        InvalidResponse,
        UnknownError
    };
  
    static QString getErrorMessage(ErrorType type, const QNetworkReply *reply = nullptr) {
        switch (type) {
        case NetworkError:
            return QString("网络连接失败: %1").arg(reply ? reply->errorString() : "未知错误");
        case AuthenticationError:
            return "API密钥无效或已过期";
        case RateLimitError:
            return "API调用频率超限，请稍后重试";
        case InvalidResponse:
            return "服务器返回了无效的响应";
        default:
            return "未知错误";
        }
    }
  
    static bool shouldRetry(ErrorType type) {
        return type == NetworkError || type == RateLimitError;
    }
};
```

## 七、安全设计

### 7.1 API密钥安全存储
```cpp
class SecureStorage {
public:
    // 使用系统密钥链或加密存储
    static bool storeApiKey(const QString &accountId, const QString &apiKey) {
        // Windows: Credential Manager
        // macOS: Keychain
        // Linux: libsecret或GNOME Keyring
      
        QByteArray encrypted = encryptData(apiKey.toUtf8());
        QSettings settings;
        settings.setValue(QString("keys/%1").arg(accountId), encrypted);
        return true;
    }
  
    static QString retrieveApiKey(const QString &accountId) {
        QSettings settings;
        QByteArray encrypted = settings.value(QString("keys/%1").arg(accountId)).toByteArray();
        return QString::fromUtf8(decryptData(encrypted));
    }
  
private:
    static QByteArray encryptData(const QByteArray &data);
    static QByteArray decryptData(const QByteArray &encrypted);
};
```

### 7.2 网络通信安全
- 强制使用HTTPS
- 证书验证
- 防止中间人攻击

## 八、开发里程碑

### 8.1 第一阶段：核心功能（2周）
- [ ] 项目初始化与基础框架搭建
- [ ] DeepSeek API集成测试
- [ ] 基本UI界面开发
- [ ] 余额查询功能实现

### 8.2 第二阶段：完善功能（2周）
- [ ] 多账户管理功能
- [ ] 余额历史记录
- [ ] 基础告警功能
- [ ] 数据持久化存储

### 8.3 第三阶段：优化体验（1周）
- [ ] 界面美化与主题支持
- [ ] 自动更新机制
- [ ] 性能优化
- [ ] 单元测试

### 8.4 第四阶段：发布准备（1周）
- [ ] 跨平台打包
- [ ] 文档编写
- [ ] GitHub Actions CI/CD配置
- [ ] 正式发布

## 九、测试策略

### 9.1 单元测试
```cpp
// 测试余额解析功能
TEST(DeepSeekBalanceFetcherTest, ParseValidResponse) {
    DeepSeekBalanceFetcher fetcher;
    QString json = R"({
        "total_balance": 100.0,
        "used_balance": 30.0,
        "remaining_balance": 70.0,
        "currency": "USD"
    })";
  
    BalanceInfo info = fetcher.parseBalanceResponse(json.toUtf8());
    EXPECT_DOUBLE_EQ(info.totalBalance, 100.0);
    EXPECT_DOUBLE_EQ(info.remainingBalance, 70.0);
    EXPECT_EQ(info.currency, "USD");
}
```

### 9.2 集成测试
- API连接测试
- 数据库操作测试
- 界面交互测试
- 跨平台兼容性测试

### 9.3 性能测试
- 内存泄漏测试
- 响应时间测试
- 并发请求测试

## 十、部署与分发

### 10.1 GitHub仓库配置
```
deepseek-balance-monitor/
├── .github/workflows/          # CI/CD配置文件
├── src/                        # 源代码
│   ├── core/                   # 核心逻辑
│   ├── ui/                     # QML界面文件
│   ├── api/                    # API集成
│   └── tests/                  # 测试代码
├── docs/                       # 文档
├── scripts/                    # 构建脚本
├── assets/                     # 资源文件
├── CMakeLists.txt
└── README.md
```

### 10.2 自动化构建配置
```yaml
# .github/workflows/build.yml
name: Build and Release

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  build-multi-platform:
    strategy:
      matrix:
        platform: [windows-latest, ubuntu-latest, macos-latest]
      
    runs-on: ${{ matrix.platform }}
  
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Setup Qt
      uses: jurplel/install-qt-action@v3
      with:
        version: '6.5.0'
      
    - name: Configure and Build
      run: |
        mkdir build && cd build
        cmake -DCMAKE_BUILD_TYPE=Release ..
        cmake --build . --config Release
      
    - name: Package Application
      run: |
        # 平台特定的打包逻辑
        bash scripts/package-${{ matrix.platform }}.sh
      
    - name: Upload Artifact
      uses: actions/upload-artifact@v3
      with:
        name: deepseek-monitor-${{ matrix.platform }}
        path: build/dist/
```

### 10.3 版本更新机制
```cpp
class UpdateManager : public QObject {
    Q_OBJECT
public:
    void checkForUpdates() {
        QNetworkRequest request(QUrl("https://api.github.com/repos/username/deepseek-balance-monitor/releases/latest"));
        // 发送请求检查最新版本
    }
  
    void performUpdate(const QString &downloadUrl) {
        // 下载更新包
        // 验证签名
        // 替换可执行文件
        // 重启应用
    }
};
```

## 十一、技术风险评估与应对

| 风险点 | 影响程度 | 应对策略 |
|-------|---------|---------|
| DeepSeek API变更 | 高 | 抽象API接口层，提供配置化适配 |
| API密钥安全 | 高 | 使用系统密钥链，客户端加密 |
| 跨平台兼容性 | 中 | 使用QT跨平台特性，充分测试 |
| 用户数据丢失 | 中 | 定期备份，提供数据导出 |
| 网络连接问题 | 中 | 实现重试机制，离线模式 |

## 十二、后续扩展规划

### 12.1 短期扩展（未来3个月）
1. 支持更多AI服务提供商（OpenAI、Anthropic等）
2. 增加使用统计图表
3. 实现云端配置同步

### 12.2 长期规划（6-12个月）
1. 移动端应用开发
2. 团队协作功能
3. API调用分析和优化建议
4. 插件系统支持

## 十三、总结

本规格设计方案提供了完整的DeepSeek余额监测工具开发蓝图，涵盖从需求分析到部署发布的全流程。关键要点包括：

1. **技术选型合理**：QT/QML + C++的组合确保跨平台能力和性能
2. **安全设计完善**：API密钥加密存储，网络通信安全
3. **用户体验优化**：直观的界面设计，实时更新提醒
4. **可扩展架构**：模块化设计便于添加新功能和服务支持
5. **自动化运维**：GitHub Actions实现CI/CD，简化发布流程

建议按照开发里程碑分阶段实施，首先完成核心的余额查询功能，然后逐步完善其他特性。在整个开发过程中，应持续参考DeepSeek官方API文档[3][5]，确保与API的兼容性。

此方案为DeepSeek余额监测工具提供了完整的技术实现路径，可作为项目开发的详细指导文档。