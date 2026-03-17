#include "Logging.h"

#include <QCoreApplication>
#include <QDir>
#include <QFile>
#include <QDateTime>
#include <QTextStream>
#include <QMutex>

namespace {

QFile& logFile()
{
    static QFile file;
    static bool initialized = false;

    if (!initialized) {
        initialized = true;

        // 日志统一放在程序目录下的 logs 子目录，避免写入 C 盘用户 AppData
        const QString appDirPath = QCoreApplication::applicationDirPath();
        const QString logDirPath = appDirPath + "/logs";
        QDir().mkpath(logDirPath);
        const QString logPath = logDirPath + "/aibalance.log";

        file.setFileName(logPath);
        if (!file.open(QIODevice::Append | QIODevice::Text)) {
            // 打开失败时保持文件处于未打开状态，后续 messageHandler 会直接返回
        }
    }

    return file;
}

void messageHandler(QtMsgType type, const QMessageLogContext& context, const QString& msg)
{
    static QMutex mutex;
    QMutexLocker locker(&mutex);

    QFile& file = logFile();
    if (!file.isOpen()) {
        return;
    }

    QTextStream out(&file);

    const QString time = QDateTime::currentDateTime().toString("yyyy-MM-dd HH:mm:ss.zzz");

    QString level;
    switch (type) {
    case QtDebugMsg:
        level = "DEBUG";
        break;
    case QtInfoMsg:
        level = "INFO";
        break;
    case QtWarningMsg:
        level = "WARN";
        break;
    case QtCriticalMsg:
        level = "ERROR";
        break;
    case QtFatalMsg:
        level = "FATAL";
        break;
    }

    QString category = QString::fromLatin1(context.category ? context.category : "default");

    out << time << " | " << level << " | " << category << " | " << msg << '\n';
    out.flush();

    if (type == QtFatalMsg) {
        abort();
    }
}

} // namespace

void initializeLogging()
{
    qInstallMessageHandler(messageHandler);
    qInfo("Logging initialized");
}

