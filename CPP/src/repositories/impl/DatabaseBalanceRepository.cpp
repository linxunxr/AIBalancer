#include "DatabaseBalanceRepository.h"
#include <QSqlQuery>
#include <QDateTime>
#include <QtConcurrent>

DatabaseBalanceRepository::DatabaseBalanceRepository(QObject* parent)
    : DatabaseRepository("BalanceRepository") {
    Q_UNUSED(parent);
}

DatabaseBalanceRepository::~DatabaseBalanceRepository() {
    close();
}

QFuture<BalanceInfo> DatabaseBalanceRepository::fetchBalance(const QString& apiKey) {
    // 数据库仓储不处理网络请求
    Q_UNUSED(apiKey);

    return QtConcurrent::run([]() {
        return BalanceInfo{};
    });
}

bool DatabaseBalanceRepository::saveBalanceRecord(const QString& accountId, const BalanceInfo& info) {
    if (!isOpen() || accountId.isEmpty()) {
        return false;
    }

    bool success = executeQuery(R"(
        INSERT INTO balance_history (account_id, total_balance, used_balance,
                                     remaining_balance, currency, recorded_at)
        VALUES (?, ?, ?, ?, ?, ?)
    )", accountId, info.totalBalance, info.usedBalance,
       info.remainingBalance, info.currency, info.lastUpdated.toSecsSinceEpoch());

    return success;
}

QVector<BalanceInfo> DatabaseBalanceRepository::getBalanceHistory(
    const QString& accountId,
    const QDateTime& since,
    int limit) const {
    QVector<BalanceInfo> history;

    if (!isOpen() || accountId.isEmpty()) {
        return history;
    }

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

    QSqlQuery query(database());
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

BalanceInfo DatabaseBalanceRepository::getLatestBalance(const QString& accountId) const {
    if (!isOpen() || accountId.isEmpty()) {
        return {};
    }

    QSqlQuery* query = executeQueryWithResult(R"(
        SELECT total_balance, used_balance, remaining_balance, currency, recorded_at
        FROM balance_history
        WHERE account_id = ?
        ORDER BY recorded_at DESC
        LIMIT 1
    )", accountId);

    if (!query) {
        return {};
    }

    BalanceInfo result;
    if (query->next()) {
        result.totalBalance = query->value(0).toDouble();
        result.usedBalance = query->value(1).toDouble();
        result.remainingBalance = query->value(2).toDouble();
        result.currency = query->value(3).toString();
        result.lastUpdated = QDateTime::fromSecsSinceEpoch(query->value(4).toLongLong());
    }
    delete query;

    return result;
}

bool DatabaseBalanceRepository::cleanupOldData(int daysToKeep) {
    if (!isOpen()) {
        return false;
    }

    qint64 cutoffDate = QDateTime::currentDateTime().addDays(-daysToKeep).toSecsSinceEpoch();

    bool success = executeQuery("DELETE FROM balance_history WHERE recorded_at < ?", cutoffDate);

    return success;
}

void DatabaseBalanceRepository::setApiEndpoint(const QString& endpoint) {
    m_apiEndpoint = endpoint;
}

void DatabaseBalanceRepository::setTimeout(int timeoutMs) {
    m_timeoutMs = timeoutMs;
}

bool DatabaseBalanceRepository::createTables() {
    QSqlQuery query(database());

    // 创建余额历史表
    QString createHistoryTable = R"(
        CREATE TABLE IF NOT EXISTS balance_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id TEXT NOT NULL,
            total_balance REAL NOT NULL,
            used_balance REAL NOT NULL,
            remaining_balance REAL NOT NULL,
            currency TEXT DEFAULT 'USD',
            recorded_at INTEGER DEFAULT (strftime('%s', 'now'))
        )
    )";

    if (!query.exec(createHistoryTable)) {
        emitError(QString("创建余额历史表失败: %1").arg(query.lastError().text()));
        return false;
    }

    // 创建索引
    QString createIndex = R"(
        CREATE INDEX IF NOT EXISTS idx_account_balance_history
        ON balance_history(account_id, recorded_at DESC)
    )";

    if (!query.exec(createIndex)) {
        emitError(QString("创建索引失败: %1").arg(query.lastError().text()));
        return false;
    }

    return true;
}
