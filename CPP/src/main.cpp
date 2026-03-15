#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QIcon>
#include <QQuickStyleFormatProperty>

int main(int argc, char *argv[]) {
    QGuiApplication app(argc, argv);

    // 设置应用程序信息
    app.setApplicationName("AIBalanceManager");
    app.setOrganizationName("AIBalance");
    app.setOrganizationDomain("aibalance.com");
    app.setApplicationVersion("1.0.0");

    QQmlApplicationEngine engine;

    // 注册类型（后续添加）

    // 设置 QML 导入路径
    engine.addImportPath("qrc:/qml");

    // 加载主 QML 文件
    const QUrl url(QStringLiteral("qrc:/qml/main.qml"));

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
