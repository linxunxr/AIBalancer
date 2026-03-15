#include "DatabaseAlertRepository.h"
#include <QSqlQuery>
#include <QDateTime>

DatabaseAlertRepository::DatabaseAlertRepository(QObject* parent)
    : DatabaseRepository("AlertRepository") {
    Q_UNUSED(parent);
}

DatabaseAlertRepository::~DatabaseAlertRepository() {
    close();
}

bool DatabaseAlertRepository::createTables() {
    QSqlQuery query(database());

    // 创建告警规则表
    QString createAlertRulesTable = R"(
        CREATE TABLE IF NOT EXISTS alert_rules (
            id TEXT PRIMARY KEY,
            account_id TEXT NOT NULL,
            alert_type INTEGER NOT NULL,
            threshold REAL NOT NULL,
            notification_method INTEGER DEFAULT 0,
            is_enabled INTEGER DEFAULT 1,
            custom_message TEXT,
            webhook_url TEXT,
            created_at INTEGER DEFAULT (strftime('%s', 'now')),
            last_triggered INTEGER,
            trigger_count INTEGER DEFAULT 0,
            FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
        )
    )";

    if (!query.exec(createAlertRulesTable)) {
        emitError(QString("创建告警规则表失败: %1").arg(query.lastError().text()));
        return false;
    }

    // 创建告警历史表
    QString createAlertHistoryTable = R"(
        CREATE TABLE IF NOT EXISTS alert_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rule_id TEXT NOT NULL,
            account_id TEXT,
            message TEXT,
            triggered_at INTEGER DEFAULT (strftime('%s', 'now')),
            FOREIGN KEY (rule_id) REFERENCES alert_rules(id) ON DELETE CASCADE
        )
    )";

    if (!query.exec(createAlertHistoryTable)) {
        emitError(QString("创建告警历史表失败: %1").arg(query.lastError().text()));
        return false;
    }

    return true;
}

bool DatabaseAlertRepository::addAlertRule(const AlertRule& rule) {
    if (!isOpen() || !rule.isValid()) {
        return false;
    }

    bool success = executeQuery(R"(
        INSERT INTO alert_rules (id, account_id, alert_type, threshold, notification_method,
                                    is_enabled, custom_message, webhook_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    )", rule.id, rule.accountId, static_cast<int>(rule.alertType), rule.threshold,
       static_cast<int>(rule.method), rule.isEnabled ? 1 : 0,
       rule.customMessage, rule.webhookUrl);

    return success;
}

bool DatabaseAlertRepository::updateAlertRule(const AlertRule& rule) {
    if (!isOpen() || rule.id.isEmpty()) {
        return false;
    }

    bool success = executeQuery(R"(
        UPDATE alert_rules
        SET alert_type = ?, threshold = ?, notification_method = ?,
            is_enabled = ?, custom_message = ?, webhook_url = ?
        WHERE id = ?
    )", static_cast<int>(rule.alertType), rule.threshold, static_cast<int>(rule.method),
       rule.isEnabled ? 1 : 0, rule.customMessage, rule.webhookUrl, rule.id);

    return success;
}

bool DatabaseAlertRepository::removeAlertRule(const QString& ruleId) {
    if (!isOpen() || ruleId.isEmpty()) {
        return false;
    }

    bool success = executeQuery("DELETE FROM alert_rules WHERE id = ?", ruleId);
    return success;
}

QVector<AlertRule> DatabaseAlertRepository::getAlertRules(const QString& accountId) const {
    QMutexLocker locker(&m_mutex);

    QVector<AlertRule> rules;

    if (!isOpen() || accountId.isEmpty()) {
        return rules;
    }

    QSqlQuery* query = executeQueryWithResult(R"(
        SELECT * FROM alert_rules
        WHERE account_id = ?
        ORDER BY created_at DESC
    )", accountId);

    if (!query) {
        return rules;
    }

    while (query->next()) {
        rules.append(queryToAlertRule(*query));
    }
    delete query;

    return rules;
}

QVector<AlertRule> DatabaseAlertRepository::getAllAlertRules() const {
    QMutexLocker locker(&m_mutex);

    QVector<AlertRule> rules;

    if (!isOpen()) {
        return rules;
    }

    QSqlQuery query(database());
    if (query.exec("SELECT * FROM alert_rules ORDER BY created_at DESC")) {
        while (query.next()) {
            rules.append(queryToAlertRule(query));
        }
    }

    return rules;
}

QVector<AlertRule> DatabaseAlertRepository::checkAlerts(const QString& accountId, double balance) {
    QMutexLocker locker(&m_mutex);

    QVector<AlertRule> triggeredRules;
    QVector<AlertRule> rules = getAlertRules(accountId);

    QDateTime now = QDateTime::currentDateTime();

    for (auto& rule : rules) {
        if (rule.shouldTrigger(balance)) {
            // 触发告警
            triggeredRules.append(rule);

            // 更新触发统计
            executeQuery(R"(
                UPDATE alert_rules
                SET last_triggered = ?, trigger_count = trigger_count + 1
                WHERE id = ?
            )", now.toSecsSinceEpoch(), rule.id);

            // 记录告警
            QString message = QString("%1: 当前余额 %.2f 低于阈值 %.2f")
                                .arg(rule.typeName())
                                .arg(balance)
                                .arg(rule.threshold);
            logAlertTrigger(rule.id, message);

            // 发送信号
            emit alertTriggered(accountId, balance, rule.threshold);
        }
    }

    return triggeredRules;
}

bool DatabaseAlertRepository::setAlertEnabled(const QString& ruleId, bool enabled) {
    if (!isOpen() || ruleId.isEmpty()) {
        return false;
    }

    bool success = executeQuery(
        "UPDATE alert_rules SET is_enabled = ? WHERE id = ?",
        enabled ? 1 : 0, ruleId
    );

    return success;
}

bool DatabaseAlertRepository::logAlertTrigger(const QString& ruleId, const QString& message) {
    if (!isOpen() || ruleId.isEmpty()) {
        return false;
    }

    bool success = executeQuery(R"(
        INSERT INTO alert_history (rule_id, message)
        VALUES (?, ?)
    )", ruleId, message);

    return success;
}

QVector<QString> DatabaseAlertRepository::getAlertHistory(const QString& accountId, int limit) const {
    QMutexLocker locker(&m_mutex);

    QVector<QString> history;

    if (!isOpen()) {
        return history;
    }

    QString sql = "SELECT message, triggered_at FROM alert_history";
    if (!accountId.isEmpty()) {
        sql += " WHERE account_id = ?";
    }

    sql += " ORDER BY triggered_at DESC";

    if (limit > 0) {
        sql += QString(" LIMIT %1").arg(limit);
    }

    QSqlQuery query(database());
    query.prepare(sql);

    if (!accountId.isEmpty()) {
        query.addBindValue(accountId);
    }

    if (query.exec()) {
        while (query.next()) {
            QString message = query.value(0).toString();
            qint64 timestamp = query.value(1).toLongLong();
            QDateTime time = QDateTime::fromSecsSinceEpoch(timestamp);
            history.append(QString("[%1] %2")
                                  .arg(time.toString("yyyy-MM-dd hh:mm:ss"))
                                  .arg(message));
        }
    }

    return history;
}

AlertRule DatabaseAlertRepository::queryToAlertRule(QSqlQuery& query) const {
    AlertRule rule;
    rule.id = query.value("id").toString();
    rule.accountId = query.value("account_id").toString();
    rule.alertType = static_cast<AlertType>(query.value("alert_type").toInt());
    rule.threshold = query.value("threshold").toDouble();
    rule.method = static_cast<NotificationMethod>(query.value("notification_method").toInt());
    rule.isEnabled = query.value("is_enabled").toInt() == 1;
    rule.customMessage = query.value("custom_message").toString();
    rule.webhookUrl = query.value("webhook_url").toString();
    rule.createdAt = QDateTime::fromSecsSinceEpoch(query.value("created_at").toLongLong());
    rule.lastTriggered = QDateTime::fromSecsSinceEpoch(query.value("last_triggered").toLongLong());
    rule.triggerCount = query.value("trigger_count").toInt();
    return rule;
}
