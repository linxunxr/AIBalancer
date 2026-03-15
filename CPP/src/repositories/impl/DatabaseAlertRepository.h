#ifndef DATABASEALERTREPOSITORY_H
#define DATABASEALERTREPOSITORY_H

#include "../interfaces/IAlertRepository.h"
#include "DatabaseRepository.h"
#include <QMutex>

/**
 * @brief 数据库告警仓储实现
 *
 * 负责：
 * - 保存告警规则到 SQLite
 * - 查询和检查告警
 * - 记录告警历史
 */
class DatabaseAlertRepository : public DatabaseRepository, public IAlertRepository {
    Q_OBJECT
public:
    explicit DatabaseAlertRepository(QObject* parent = nullptr);
    ~DatabaseAlertRepository() override;

    // IAlertRepository 接口实现
    bool addAlertRule(const AlertRule& rule) override;
    bool updateAlertRule(const AlertRule& rule) override;
    bool removeAlertRule(const QString& ruleId) override;
    QVector<AlertRule> getAlertRules(const QString& accountId) const override;
    QVector<AlertRule> getAllAlertRules() const override;
    QVector<AlertRule> checkAlerts(const QString& accountId, double balance) override;
    bool setAlertEnabled(const QString& ruleId, bool enabled) override;
    bool logAlertTrigger(const QString& ruleId, const QString& message) override;
    QVector<QString> getAlertHistory(const QString& accountId, int limit) const override;

signals:
    void alertTriggered(const QString& accountId, double balance, double threshold);

private:
    bool createTables() override;

    AlertRule queryToAlertRule(QSqlQuery& query) const;

    mutable QMutex m_mutex;
};

#endif // DATABASEALERTREPOSITORY_H
