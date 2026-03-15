#include "DatabaseRepository.h"
#include <QSqlError>
#include <QSqlQuery>
#include <QStandardPaths>
#include <QDir>
#include <QDateTime>

DatabaseRepository::DatabaseRepository(const QString& connectionName, QObject* parent)
    : QObject(parent) {
    m_database = QSqlDatabase::addDatabase("QSQLITE", connectionName);
}

DatabaseRepository::~DatabaseRepository() {
    if (m_database.isOpen()) {
        m_database.close();
    }
}

bool DatabaseRepository::initialize(const QString& dbPath) {
    QMutexLocker locker(&m_mutex);

    if (m_initialized) {
        return true;
    }

    QString actualPath = dbPath;
    if (actualPath.isEmpty()) {
        QString appDataPath = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation);
        QDir().mkpath(appDataPath);
        actualPath = appDataPath + "/balance_manager.db";
    }

    m_database.setDatabaseName(actualPath);

    if (!m_database.open()) {
        emitError(QString("无法打开数据库: %1").arg(m_database.lastError().text()));
        return false;
    }

    if (!createTables()) {
        return false;
    }

    m_initialized = true;
    return true;
}

void DatabaseRepository::close() {
    QMutexLocker locker(&m_mutex);
    if (m_database.isOpen()) {
        m_database.close();
    }
    m_initialized = false;
}

bool DatabaseRepository::beginTransaction() {
    if (!m_database.isOpen()) return false;
    return m_database.transaction();
}

bool DatabaseRepository::commitTransaction() {
    if (!m_database.isOpen()) return false;
    return m_database.commit();
}

bool DatabaseRepository::rollbackTransaction() {
    if (!m_database.isOpen()) return false;
    return m_database.rollback();
}

QSqlDatabase DatabaseRepository::database() const {
    return m_database;
}

bool DatabaseRepository::isOpen() const {
    QMutexLocker locker(&m_mutex);
    return m_database.isOpen();
}

void DatabaseRepository::emitError(const QString& message) const {
    emit const_cast<DatabaseRepository*>(this)->errorOccurred(message);
}
