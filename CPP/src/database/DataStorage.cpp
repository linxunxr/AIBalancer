#include "DataStorage.h"
#include <QSqlQuery>
#include <QSqlError>
#include <QDateTime>
#include <QFile>
#include <QDir>

DataStorage::DataStorage(QObject *parent)
    : QObject(parent) {
}

DataStorage::~DataStorage() {
    if (m_database.isOpen()) {
        m_database.close();
    }
}

bool DataStorage::initialize(const QString &databasePath) {
    if (m_database.isOpen()) {
        m_database.close();
    }

    QString dbPath = databasePath;
    if (dbPath.isEmpty()) {
        QString appDataPath = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation);
        QDir().mkpath(appDataPath);
        dbPath = appDataPath + "/balance_history.db";
    }

    m_database = QSqlDatabase::addDatabase("QSQLITE");
    m_database.setDatabaseName(dbPath);

    if (!m_database.open()) {
        emit errorOccurred(QString("无法打开数据库: %1").arg(m_database.lastError().text()));
        emit databaseInitialized(false);
        return false;
    }

    bool success = createTables();
    emit databaseInitialized(success);
    return success;
}

bool DataStorage::createTables() {
    QSqlQuery query(m_database);

    // 创建账户表
    QString createAccountsTable = R"(
        CREATE TABLE IF NOT EXISTS accounts (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT,
            created_at INTEGER DEFAULT (strftime('%s', 'now')),
            is_active INTEGER DEFAULT 1
        )
    )";

    if (!query.exec(createAccountsTable)) {
        emit errorOccurred(QString("创建账户表失败: %1").arg(query.lastError().text()));
        return false;
    }

    // 创建余额历史表
    QString createHistoryTable = R"(
        CREATE TABLE IF NOT EXISTS balance_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id TEXT NOT NULL,
            total_balance REAL NOT NULL,
            used_balance REAL NOT NULL,
            remaining_balance REAL NOT NULL,
            currency TEXT DEFAULT 'USD',
            recorded_at INTEGER DEFAULT (strftime('%s', 'now')),
            FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
        )
    )";

    if (!query.exec(createHistoryTable)) {
        emit errorOccurred(QString("创建历史表失败: %1").arg(query.lastError().text()));
        return false;
    }

    // 创建索引以提高查询性能
    QString createIndex = R"(
        CREATE INDEX IF NOT EXISTS idx_account_history
        ON balance_history(account_id, recorded_at DESC)
    )";

    if (!query.exec(createIndex)) {
        emit errorOccurred(QString("创建索引失败: %1").arg(query.lastError().text()));
        return false;
    }

    return true;
}

bool DataStorage::saveBalanceRecord(const QString &accountId, const BalanceInfo &info) {
    if (!m_database.isOpen() || accountId.isEmpty()) {
        return false;
    }

    QSqlQuery query(m_database);
    query.prepare(R"(
        INSERT INTO balance_history (account_id, total_balance, used_balance,
                                     remaining_balance, currency, recorded_at)
        VALUES (?, ?, ?, ?, ?, ?)
    )");

    query.addBindValue(accountId);
    query.addBindValue(info.totalBalance);
    query.addBindValue(info.usedBalance);
    query.addBindValue(info.remainingBalance);
    query.addBindValue(info.currency);
    query.addBindValue(info.lastUpdated.toSecsSinceEpoch());

    bool success = query.exec();
    if (!success) {
        emit errorOccurred(QString("保存记录失败: %1").arg(query.lastError().text()));
    }

    emit recordSaved(success);
    return success;
}

QVector<BalanceInfo> DataStorage::getBalanceHistory(const QString &accountId,
                                                    const QDateTime &since,
                                                    int limit) const {
    QVector<BalanceInfo> history;

    if (!m_database.isOpen() || accountId.isEmpty()) {
        return history;
    }

    QSqlQuery query(m_database);

    QString sql = R"(
        SELECT total_balance, used_balance, remaining_balance, currency, recorded_at
        FROM balance_history
        WHERE account_id = ?
    )";

    if (since.isValid()) {
        sql += " AND recorded_at >= ?";
    }

    sql += " ORDER BY recorded_at DESC";

    if (limit > 0) {
        sql += QString(" LIMIT %1").arg(limit);
    }

    query.prepare(sql);
    query.addBindValue(accountId);

    if (since.isValid()) {
        query.addBindValue(since.toSecsSinceEpoch());
    }

    if (query.exec()) {
        while (query.next()) {
            BalanceInfo info;
            info.totalBalance = query.value(0).toDouble();
            info.usedBalance = query.value(1).toDouble();
            info.remainingBalance = query.value(2).toDouble();
            info.currency = query.value(3).toString();
            info.lastUpdated = QDateTime::fromSecsSinceEpoch(query.value(4).toLongLong());
            history.append(info);
        }
    }

    return history;
}

bool DataStorage::cleanupOldData(int daysToKeep) {
    if (!m_database.isOpen()) {
        return false;
    }

    QSqlQuery query(m_database);
    qint64 cutoffDate = QDateTime::currentDateTime().addDays(-daysToKeep).toSecsSinceEpoch();

    query.prepare("DELETE FROM balance_history WHERE recorded_at < ?");
    query.addBindValue(cutoffDate);

    bool success = query.exec();
    if (!success) {
        emit errorOccurred(QString("清理数据失败: %1").arg(query.lastError().text()));
    }

    return success;
}
