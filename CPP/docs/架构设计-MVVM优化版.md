# AI余额管家 - MVVM 架构设计文档

## 一、架构概述

### 1.1 为什么选择 MVVM

| 特性       | 当前三层架构                     | MVVM 架构                       |
|----------|----------------------------|-------------------------------|
| **职责分离** | View 与 Business Layer 直接耦合 | View → ViewModel → Model，完全解耦 |
| **数据绑定** | 手动信号槽连接                    | Q_PROPERTY 自动绑定               |
| **可测试性** | 需要模拟 QML 环境                | ViewModel 可独立单元测试             |
| **可复用性** | 业务逻辑与 UI 耦合                | ViewModel 可被多个 View 复用        |
| **状态管理** | 分散在各模块中                    | 集中在 ViewModel                 |

### 1.2 MVVM 组件定义

```
┌─────────────────────────────────────────────────────────────────┐
│                         View (QML)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ Dashboard   │  │  Settings   │  │   Alerts    │       │
│  │    View     │  │    View     │  │    View     │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                        ↓ 数据绑定 (Q_PROPERTY)
┌─────────────────────────────────────────────────────────────────┐
│                      ViewModel Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ Dashboard   │  │  Account    │  │    Alert    │       │
│  │  ViewModel  │  │  ViewModel  │  │  ViewModel  │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                        ↓ 依赖注入
┌─────────────────────────────────────────────────────────────────┐
│                        Model Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │  Account    │  │   Balance   │  │    Alert    │       │
│  │    Model    │  │   Service   │  │   Service   │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
│  ┌─────────────┐  ┌─────────────┐                         │
│  │  Database   │  │  Network    │                         │
│  │ Repository │  │  Repository │                         │
│  └─────────────┘  └─────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Infrastructure                         │
│  • SQLite Database   • QtNetwork   • QSettings            │
│  • Dependency Injection Container                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、架构层次详解

### 2.1 View Layer (QML)

**职责**：
- 仅负责 UI 展示和用户交互
- 通过 Q_PROPERTY 绑定到 ViewModel
- 不包含业务逻辑

**原则**：
- ❌ 不直接访问 Model
- ❌ 不包含数据转换逻辑
- ✅ 只通过属性绑定与 ViewModel 交互
- ✅ 处理 UI 特效、动画、布局

### 2.2 ViewModel Layer

**职责**：
- 连接 View 和 Model
- 暴露 Q_PROPERTY 供 View 绑定
- 处理 UI 状态和逻辑
- 转换数据格式以适应 View

**核心组件**：
| ViewModel | 职责 |
|-----------|------|
| `DashboardViewModel` | 仪表盘状态、总览数据 |
| `AccountViewModel` | 单个账户的详细信息 |
| `AccountListViewModel` | 账户列表管理 |
| `BalanceViewModel` | 余额查询和展示 |
| `AlertViewModel` | 告警规则管理 |
| `SettingsViewModel` | 应用设置 |

### 2.3 Model Layer

**职责**：
- 纯数据结构和业务逻辑
- 不关心 UI 存在
- 可被多个 ViewModel 复用

**核心组件**：
| Model/Service | 职责 |
|-------------|------|
| `Account` | 账户数据结构 |
| `BalanceInfo` | 余额数据结构 |
| `AlertRule` | 告警规则数据结构 |
| `BalanceService` | 余额查询业务逻辑 |
| `AlertService` | 告警检查业务逻辑 |
| `DatabaseRepository` | 数据库操作 |
| `NetworkRepository` | 网络请求 |

### 2.4 Infrastructure Layer

**职责**：
- 提供底层基础设施
- 依赖注入容器
- 日志、加密、配置

---

## 三、核心设计模式

### 3.1 Repository Pattern (仓储模式)

将数据访问逻辑抽象化，Model 层通过接口访问数据：

```cpp
// Repository 接口
class IBalanceRepository {
public:
    virtual ~IBalanceRepository() = default;

    virtual std::future<BalanceInfo> fetchBalance(const QString &apiKey) = 0;
    virtual bool saveBalanceRecord(const QString &accountId, const BalanceInfo &info) = 0;
    virtual QVector<BalanceInfo> getHistory(const QString &accountId) = 0;
};

// 网络实现
class NetworkBalanceRepository : public IBalanceRepository {
public:
    std::future<BalanceInfo> fetchBalance(const QString &apiKey) override {
        // 使用 Qt + C++20 协程
        return asyncFetchFromApi(apiKey);
    }
};

// 数据库实现
class DatabaseBalanceRepository : public IBalanceRepository {
public:
    bool saveBalanceRecord(const QString &accountId, const BalanceInfo &info) override {
        // 保存到 SQLite
        return m_db.saveRecord(accountId, info);
    }
};
```

### 3.2 Dependency Injection (依赖注入)

使用简单的 DI 容器管理依赖关系：

```cpp
// 简化的 DI 容器
class ServiceLocator {
public:
    template<typename Interface, typename Implementation>
    static void registerSingleton() {
        static Implementation instance;
        s_singletons[typeid(Interface)] = &instance;
    }

    template<typename Interface>
    static Interface* get() {
        return static_cast<Interface*>(s_singletons[typeid(Interface)]);
    }

private:
    static inline std::unordered_map<std::type_index, void*> s_singletons;
};

// 注册服务
ServiceLocator::registerSingleton<IBalanceRepository, NetworkBalanceRepository>();
ServiceLocator::registerSingleton<IAlertRepository, DatabaseAlertRepository>();

// 获取服务
auto balanceRepo = ServiceLocator::get<IBalanceRepository>();
```

### 3.3 Observer Pattern with Q_PROPERTY

利用 Qt 的属性系统实现数据绑定：

```cpp
class DashboardViewModel : public QObject {
    Q_OBJECT
    Q_PROPERTY(double totalBalance READ totalBalance NOTIFY totalBalanceChanged)
    Q_PROPERTY(int accountCount READ accountCount NOTIFY accountCountChanged)
    Q_PROPERTY(bool isLoading READ isLoading NOTIFY isLoadingChanged)
    Q_PROPERTY(QString statusMessage READ statusMessage NOTIFY statusMessageChanged)

public:
    double totalBalance() const { return m_totalBalance; }
    int accountCount() const { return m_accountCount; }
    bool isLoading() const { return m_isLoading; }
    QString statusMessage() const { return m_statusMessage; }

signals:
    void totalBalanceChanged();
    void accountCountChanged();
    void isLoadingChanged();
    void statusMessageChanged();

public slots:
    void refreshData();

private:
    double m_totalBalance{0.0};
    int m_accountCount{0};
    bool m_isLoading{false};
    QString m_statusMessage;

    IBalanceRepository* m_balanceRepo;
    IAccountRepository* m_accountRepo;
};
```

---

## 四、数据流设计

### 4.1 余额查询流程

```
┌─────────────┐
│  User       │  点击刷新按钮
│  (QML View)│─────────────┐
└─────────────┘             │
                           ↓
                  ┌─────────────────┐
                  │ DashboardVM    │  refreshBalance()
                  │ .refreshData()  │─────────────┐
                  └─────────────────┘             │
                                                 ↓
                                         ┌─────────────────┐
                                         │ BalanceService  │  业务逻辑
                                         │ .fetch()       │─────────────┐
                                         └─────────────────┘             │
                                                                               ↓
                                                                      ┌─────────────────┐
                                                                      │ NetworkRepo    │  API调用
                                                                      │ .fetch()       │─────────────┐
                                                                      └─────────────────┘             │
                                                                                                    ↓
                                                                                           ┌─────────────────┐
                                                                                           │ DeepSeek API   │  返回JSON
                                                                                           └─────────────────┘
                                                                                                    │
                                                                                                    ↓
                                                                      ┌─────────────────┐  BalanceInfo
                                                                      │ NetworkRepo    │──────────────────┐
                                                                      └─────────────────┘               │
                                                                               ↑                         ↓
                                                                               │                  ┌─────────────────┐
                                                                               │                  │ BalanceService  │  数据处理
┌─────────────┐  更新UI         │                  │ .parse()      │──────────────┐
│  User       │◄─────────────────┘                  (BalanceInfo) │              │
│  (QML View)│───────────────────────────────────────────────────┤              ↓
└─────────────┘  自动绑定      ┌─────────────────┐           │  ┌─────────────────┐
                           │ DashboardVM    │◄──────────┘  │ DatabaseRepo    │  保存历史
                           │ .setBalance()  │               │ .save()        │
                           └─────────────────┘               └─────────────────┘
```

### 4.2 账户管理流程

```
用户操作 → AccountListViewModel → AccountService → AccountRepository
                                              ↓
                                        Database
                                              ↓
ViewModel 发出信号 → View 自动更新
```

---

## 五、具体实现示例

### 5.1 BalanceViewModel 实现

```cpp
#ifndef BALANCEVIEWMODEL_H
#define BALANCEVIEWMODEL_H

#include <QObject>
#include <QDateTime>
#include "../models/BalanceInfo.h"

class IBalanceRepository;
class IAlertRepository;

class BalanceViewModel : public QObject {
    Q_OBJECT

    // Q_PROPERTY for data binding
    Q_PROPERTY(double totalBalance READ totalBalance NOTIFY totalBalanceChanged)
    Q_PROPERTY(double usedBalance READ usedBalance NOTIFY usedBalanceChanged)
    Q_PROPERTY(double remainingBalance READ remainingBalance NOTIFY remainingBalanceChanged)
    Q_PROPERTY(QString currency READ currency NOTIFY currencyChanged)
    Q_PROPERTY(QDateTime lastUpdated READ lastUpdated NOTIFY lastUpdatedChanged)
    Q_PROPERTY(bool isLoading READ isLoading NOTIFY isLoadingChanged)
    Q_PROPERTY(QString errorMessage READ errorMessage NOTIFY errorMessageChanged)
    Q_PROPERTY(bool hasError READ hasError NOTIFY errorMessageChanged)

public:
    explicit BalanceViewModel(IBalanceRepository* balanceRepo,
                           IAlertRepository* alertRepo,
                           QObject* parent = nullptr);
    ~BalanceViewModel() = default;

    // Property getters
    double totalBalance() const { return m_balance.totalBalance; }
    double usedBalance() const { return m_balance.usedBalance; }
    double remainingBalance() const { return m_balance.remainingBalance; }
    QString currency() const { return m_balance.currency; }
    QDateTime lastUpdated() const { return m_balance.lastUpdated; }
    bool isLoading() const { return m_isLoading; }
    QString errorMessage() const { return m_errorMessage; }
    bool hasError() const { return !m_errorMessage.isEmpty(); }

    // Q_INVOKABLE methods for View
    Q_INVOKABLE void refreshBalance(const QString &accountId);
    Q_INVOKABLE void clearError();

signals:
    void totalBalanceChanged();
    void usedBalanceChanged();
    void remainingBalanceChanged();
    void currencyChanged();
    void lastUpdatedChanged();
    void isLoadingChanged();
    void errorMessageChanged();

private:
    void setLoading(bool loading);
    void setError(const QString &error);
    void updateBalance(const BalanceInfo &info);

    BalanceInfo m_balance;
    bool m_isLoading{false};
    QString m_errorMessage;

    IBalanceRepository* m_balanceRepo;
    IAlertRepository* m_alertRepo;
};

#endif // BALANCEVIEWMODEL_H
```

```cpp
// BalanceViewModel.cpp
#include "BalanceViewModel.h"
#include "../repositories/IBalanceRepository.h"
#include "../repositories/IAlertRepository.h"

BalanceViewModel::BalanceViewModel(IBalanceRepository* balanceRepo,
                               IAlertRepository* alertRepo,
                               QObject* parent)
    : QObject(parent)
    , m_balanceRepo(balanceRepo)
    , m_alertRepo(alertRepo) {
}

void BalanceViewModel::refreshBalance(const QString &accountId) {
    clearError();
    setLoading(true);

    // 使用 C++20 协程处理异步请求
    auto future = m_balanceRepo->fetchBalance(accountId);

    // 使用 QFutureWatcher 连接结果
    auto* watcher = new QFutureWatcher<BalanceInfo>(this);
    connect(watcher, &QFutureWatcher<BalanceInfo>::finished, this, [this, watcher, accountId]() {
        try {
            BalanceInfo info = watcher->result();
            updateBalance(info);

            // 检查告警
            if (m_alertRepo) {
                m_alertRepo->checkAlerts(accountId, info.remainingBalance);
            }
        } catch (const std::exception& e) {
            setError(QString("获取余额失败: %1").arg(e.what()));
        }

        setLoading(false);
        watcher->deleteLater();
    });

    watcher->setFuture(future);
}

void BalanceViewModel::setLoading(bool loading) {
    if (m_isLoading != loading) {
        m_isLoading = loading;
        emit isLoadingChanged();
    }
}

void BalanceViewModel::setError(const QString &error) {
    if (m_errorMessage != error) {
        m_errorMessage = error;
        emit errorMessageChanged();
    }
}

void BalanceViewModel::clearError() {
    setError(QString());
}

void BalanceViewModel::updateBalance(const BalanceInfo &info) {
    m_balance = info;
    emit totalBalanceChanged();
    emit usedBalanceChanged();
    emit remainingBalanceChanged();
    emit currencyChanged();
    emit lastUpdatedChanged();
}
```

### 5.2 对应的 QML View

```qml
// BalanceCard.qml
import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

Rectangle {
    id: root
    // 绑定到 ViewModel 的属性
    property var viewModel: null

    required property double totalBalance
    required property double remainingBalance
    required property string currency
    required property date lastUpdated
    required property bool isLoading
    required property string errorMessage

    // 自动绑定 ViewModel 属性
    Binding {
        target: root
        property: "totalBalance"
        value: viewModel ? viewModel.totalBalance : 0
        when: viewModel != null
    }

    Binding {
        target: root
        property: "remainingBalance"
        value: viewModel ? viewModel.remainingBalance : 0
        when: viewModel != null
    }

    Binding {
        target: root
        property: "currency"
        value: viewModel ? viewModel.currency : "USD"
        when: viewModel != null
    }

    Binding {
        target: root
        property: "lastUpdated"
        value: viewModel ? viewModel.lastUpdated : new Date()
        when: viewModel != null
    }

    Binding {
        target: root
        property: "isLoading"
        value: viewModel ? viewModel.isLoading : false
        when: viewModel != null
    }

    Binding {
        target: root
        property: "errorMessage"
        value: viewModel ? viewModel.errorMessage : ""
        when: viewModel != null
    }

    radius: 10
    color: "#f8f9fa"
    border.color: "#dee2e6"
    border.width: 1

    ColumnLayout {
        anchors.centerIn: parent
        spacing: 15

        // 加载指示器
        BusyIndicator {
            id: loadingIndicator
            running: isLoading
            Layout.alignment: Qt.AlignHCenter
            visible: isLoading
        }

        // 错误消息
        Text {
            id: errorText
            text: errorMessage
            color: "#dc3545"
            font.pixelSize: 14
            Layout.alignment: Qt.AlignHCenter
            visible: !isLoading && !errorMessage
        }

        // 余额显示
        ColumnLayout {
            visible: !isLoading
            spacing: 10

            Text {
                text: "当前余额"
                font.pixelSize: 14
                color: "#6c757d"
                Layout.alignment: Qt.AlignHCenter
            }

            Text {
                text: currency + " " + totalBalance.toFixed(2)
                font.pixelSize: 40
                font.bold: true
                color: remainingBalance < 10 ? "#dc3545" : "#28a745"
                Layout.alignment: Qt.AlignHCenter
            }

            Text {
                text: "最后更新: " + Qt.formatDateTime(lastUpdated, "yyyy-MM-dd hh:mm:ss")
                font.pixelSize: 12
                color: "#6c757d"
                Layout.alignment: Qt.AlignHCenter
            }
        }

        // 刷新按钮
        Button {
            text: "刷新"
            Layout.alignment: Qt.AlignHCenter
            enabled: !isLoading

            onClicked: {
                if (viewModel) {
                    viewModel.refreshBalance(/* accountId */);
                }
            }
        }
    }
}
```

---

## 六、项目结构

```
src/
├── main.cpp                          # 应用入口
├── core/
│   └── di/
│       └── ServiceLocator.h           # 依赖注入容器
├── viewmodels/                      # ViewModel 层
│   ├── DashboardViewModel.h/cpp
│   ├── AccountViewModel.h/cpp
│   ├── AccountListViewModel.h/cpp
│   ├── BalanceViewModel.h/cpp
│   ├── AlertViewModel.h/cpp
│   └── SettingsViewModel.h/cpp
├── models/                          # Model 层 (数据结构)
│   ├── Account.h
│   ├── BalanceInfo.h
│   ├── AlertRule.h
│   └── AppSettings.h
├── services/                        # 业务逻辑层
│   ├── BalanceService.h/cpp
│   ├── AccountService.h/cpp
│   ├── AlertService.h/cpp
│   └── ExportService.h/cpp
├── repositories/                    # 数据访问层
│   ├── interfaces/
│   │   ├── IBalanceRepository.h
│   │   ├── IAccountRepository.h
│   │   └── IAlertRepository.h
│   ├── impl/
│   │   ├── DatabaseBalanceRepository.h/cpp
│   │   ├── NetworkBalanceRepository.h/cpp
│   │   └── DatabaseAlertRepository.h/cpp
│   └── DatabaseRepository.h/cpp       # 通用数据库操作
├── infrastructure/                   # 基础设施
│   ├── SecureStorage.h/cpp
│   ├── Logger.h/cpp
│   └── CryptoHelper.h/cpp
└── utils/                           # 工具类
    ├── JsonHelper.h/cpp
    └── DateHelper.h/cpp

qml/
├── main.qml                          # 主窗口
├── views/                           # View 层
│   ├── DashboardView.qml
│   ├── AccountListView.qml
│   ├── SettingsView.qml
│   └── AlertView.qml
└── components/                       # 可复用组件
    ├── BalanceCard.qml
    ├── AccountCard.qml
    └── AlertCard.qml
```

---

## 七、与原有架构对比

### 7.1 数据交互方式对比

**原有架构**：
```qml
// View 直接调用业务对象
Button {
    onClicked: balanceFetcher.fetchBalance(accountManager.activeAccount.apiKey)
}

// 手动连接信号槽
Connections {
    target: balanceFetcher
    function onBalanceUpdated(info) {
        balanceCard.balance = info.totalBalance
        balanceCard.lastUpdated = info.lastUpdated
    }
}
```

**MVVM 架构**：
```qml
// 自动属性绑定，无需手动连接
BalanceCard {
    viewModel: dashboard.balanceViewModel
    // 所有属性自动同步
}

// View 只触发命令
Button {
    onClicked: viewModel.refreshBalance(accountId)
}
```

### 7.2 测试性对比

**原有架构 - 难以测试**：
- 需要模拟 Qt 环境
- View 和逻辑耦合

**MVVM 架构 - 易于测试**：
```cpp
// 单元测试示例
TEST(BalanceViewModelTest, RefreshSuccess) {
    // 创建 Mock Repository
    MockBalanceRepository mockRepo;
    MockAlertRepository mockAlertRepo;

    // 预设 Mock 返回值
    BalanceInfo mockBalance{100.0, 30.0, 70.0, "USD"};
    EXPECT_CALL(mockRepo, fetchBalance(_))
        .WillOnce(Return(mockBalance));

    // 创建 ViewModel
    BalanceViewModel viewModel(&mockRepo, &mockAlertRepo);

    // 调用方法
    viewModel.refreshBalance("test-account");

    // 验证结果
    EXPECT_EQ(viewModel.totalBalance(), 100.0);
    EXPECT_EQ(viewModel.remainingBalance(), 70.0);
}
```

---

## 八、迁移路径

### 8.1 分步迁移策略

**第一阶段：基础设施**
1. 创建 ServiceLocator DI 容器
2. 定义 Repository 接口
3. 实现 Database 和 Network Repository

**第二阶段：ViewModel 层**
1. 创建 BalanceViewModel
2. 创建 AccountViewModel
3. 逐步替换原有 C++ 对象

**第三阶段：View 层**
1. 重构 QML，移除直接业务逻辑
2. 使用 Binding 连接 ViewModel
3. 添加组件测试

**第四阶段：清理**
1. 删除冗余代码
2. 统一代码风格
3. 更新文档

---

## 九、C++20 特性应用

### 9.1 Concepts 约束 Repository

```cpp
template<typename T>
concept Repository = requires(T repo) {
    { repo.fetch("") } -> std::same_as<std::future<BalanceInfo>>;
    { repo.save("", BalanceInfo{}) } -> std::same_as<bool>;
};

template<Repository T>
class BalanceViewModel : public QObject {
    // ...
};
```

### 9.2 Coroutines 处理异步

```cpp
Task<BalanceInfo> BalanceViewModel::refreshBalanceAsync(const QString &accountId) {
    setLoading(true);
    try {
        auto balance = co_await m_balanceRepo->fetchBalance(accountId);
        updateBalance(balance);
        co_await m_balanceRepo->save(accountId, balance);
    } catch (const std::exception& e) {
        setError(e.what());
    }
    setLoading(false);
}
```

### 9.3 Ranges 处理数据

```cpp
auto activeAccounts = m_accounts
    | std::views::filter(&Account::isActive)
    | std::views::transform([](const Account& acc) {
        return AccountViewModel::create(acc);
    });
```

---

## 十、总结

### 10与其他架构选择对比

| 架构             | 适用场景         | 优势       | 劣势              |
|----------------|--------------|----------|-----------------|
| **MVVM**       | 复与其他 UI，需要绑定 | 职责清晰，可测试 | 学习曲线            |
| **MVC**        | Web 端，服务端渲染  | 成熟模式     | Controller 职责复杂 |
| **MVP**        | 传统桌面应用       | View 被动  | 绑定代码多           |
| **Flux/Redux** | 大型状态管理       | 状态可追溯    | 模板代码多           |

### 10.2 推荐方案

**强烈推荐采用 MVVM 架构**，理由：

1. ✅ 与 Qt/QML 属性系统完美契合
2. ✅ C++20 特性（协程、Concepts）提升开发效率
3. ✅ Repository 模式便于扩展（支持离线模式、缓存等）
4. ✅ 依赖注入提高可测试性
5. ✅ 清晰的分层便于团队协作

### 10.3 实施建议

- **渐进式迁移**：不要一次性重写所有代码
- **保留兼容性**：新旧架构可共存一段时间
- **充分测试**：每迁移一个模块都要测试
- **文档更新**：随着架构演进同步更新文档

---

*文档版本: 1.0*
*更新日期: 2026-03-15*
