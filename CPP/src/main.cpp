#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QIcon>
#include <QStandardPaths>
#include <QDir>

// Core - Dependency Injection
#include "core/di/ServiceLocator.h"

// Repositories
#include "repositories/impl/NetworkBalanceRepository.h"
#include "repositories/impl/DatabaseBalanceRepository.h"
#include "repositories/impl/DatabaseAccountRepository.h"
#include "repositories/impl/DatabaseAlertRepository.h"

// ViewModels
#include "viewmodels/DashboardViewModel.h"
#include "viewmodels/BalanceViewModel.h"
#include "viewmodels/AccountListViewModel.h"
#include "viewmodels/AlertViewModel.h"

// 注册 QML 类型
void registerQmlTypes() {
    // 注册 ViewModel 类型，使 QML 可以创建实例
    qmlRegisterType<DashboardViewModel>("AIBalance", 1, 0, "DashboardViewModel");
    qmlRegisterType<BalanceViewModel>("AIBalance", 1, 0, "BalanceViewModel");
    qmlRegisterType<AccountListViewModel>("AIBalance", 1, 0, "AccountListViewModel");
    qmlRegisterType<AlertViewModel>("AIBalance", 1, 0, "AlertViewModel");
}

// 初始化依赖注入容器
void initializeServiceLocator(QObject* parent) {
    QString appDataPath = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation);
    QString dbPath = appDataPath + "/balance_manager.db";

    // 创建并注册网络余额仓储
    auto networkRepo = std::make_shared<NetworkBalanceRepository>(parent);
    networkRepo->setApiEndpoint("https://api.deepseek.com");
    networkRepo->setTimeout(5000);
    ServiceLocator::registerSingleton<IBalanceRepository>(networkRepo);

    // 创建并注册数据库仓储
    auto dbBalanceRepo = std::make_shared<DatabaseBalanceRepository>(parent);
    dbBalanceRepo->initialize(dbPath);
    ServiceLocator::registerSingleton<DatabaseBalanceRepository>(dbBalanceRepo);

    auto dbAccountRepo = std::make_shared<DatabaseAccountRepository>(parent);
    dbAccountRepo->initialize(dbPath);
    ServiceLocator::registerSingleton<IAccountRepository>(dbAccountRepo);

    auto dbAlertRepo = std::make_shared<DatabaseAlertRepository>(parent);
    dbAlertRepo->initialize(dbPath);
    ServiceLocator::registerSingleton<IAlertRepository>(dbAlertRepo);
}

// 初始化 ViewModels 并注入到 QML 上下文
void initializeViewModels(QQmlContext* context) {
    // 获取已注册的仓储
    auto balanceRepo = ServiceLocator::getShared<IBalanceRepository>();
    auto accountRepo = ServiceLocator::getShared<IAccountRepository>();
    auto alertRepo = ServiceLocator::getShared<IAlertRepository>();

    // 创建 BalanceViewModel
    auto* balanceViewModel = new BalanceViewModel(balanceRepo, context);

    // 创建 DashboardViewModel
    auto* dashboardViewModel = new DashboardViewModel(context);
    dashboardViewModel->setBalanceViewModel(balanceViewModel);

    // 创建 AccountListViewModel
    auto* accountListViewModel = new AccountListViewModel(accountRepo, context);
    accountListViewModel->loadAccounts();

    // 创建 AlertViewModel
    auto* alertViewModel = new AlertViewModel(alertRepo, context);

    // 注入到 QML 上下文
    context->setContextProperty("balanceViewModel", balanceViewModel);
    context->setContextProperty("dashboardViewModel", dashboardViewModel);
    context->setContextProperty("accountListViewModel", accountListViewModel);
    context->setContextProperty("alertViewModel", alertViewModel);
}

// 设置应用程序目录结构
void setupApplicationDirectories() {
    // 确保应用数据目录存在
    QString appDataPath = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation);
    QDir().mkpath(appDataPath);

    // 确保缓存目录存在
    QString cachePath = QStandardPaths::writableLocation(QStandardPaths::CacheLocation);
    QDir().mkpath(cachePath);

    // 确保日志目录存在
    QString logPath = appDataPath + "/logs";
    QDir().mkpath(logPath);
}

int main(int argc, char *argv[]) {
    QGuiApplication app(argc, argv);

    // 设置应用程序信息
    app.setApplicationName("AIBalanceManager");
    app.setOrganizationName("AIBalance");
    app.setOrganizationDomain("aibalance.com");
    app.setApplicationVersion("1.0.0");

    // 设置应用图标（如果有）
    // app.setWindowIcon(QIcon(":/resources/app_icon.png"));

    // 初始化应用目录
    setupApplicationDirectories();

    // 注册 QML 类型
    registerQmlTypes();

    QQmlApplicationEngine engine;

    // 初始化依赖注入
    initializeServiceLocator(&engine);

    // 初始化 ViewModels
    initializeViewModels(engine.rootContext());

    // 设置 QML 导入路径
    engine.addImportPath("qrc:/");

    // 加载主 QML 文件
    const QUrl url(QStringLiteral("qrc:/main.qml"));

    QObject::connect(&engine, &QQmlApplicationEngine::objectCreated,
                     &app, [url](QObject *obj, const QUrl &objUrl) {
        if (!obj && url == objUrl)
            QCoreApplication::exit(-1);
    }, Qt::QueuedConnection);

    engine.load(url);

    if (engine.rootObjects().isEmpty())
        return -1;

    return app.exec();
}
