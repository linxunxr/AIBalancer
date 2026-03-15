#ifndef ALERTENGINE_H
#define ALERTENGINE_H

#include <QObject>
#include <QString>
#include <QVector>

struct AlertRule {
    QString id;
    QString accountId;
    double threshold{0.0};
    QString notificationMethod{"popup"}; // popup, email, both
    bool isEnabled{true};
};

class AlertEngine : public QObject {
    Q_OBJECT

public:
    explicit AlertEngine(QObject *parent = nullptr);
    ~AlertEngine() = default;

    // 添加告警规则
    Q_INVOKABLE bool addAlertRule(const QString &accountId, double threshold, const QString &method);

    // 移除告警规则
    Q_INVOKABLE bool removeAlertRule(const QString &ruleId);

    // 检查余额并触发告警
    Q_INVOKABLE void checkBalance(const QString &accountId, double balance);

    // 获取所有告警规则
    Q_INVOKABLE QVector<AlertRule> getAlertRules() const;

signals:
    void alertTriggered(const QString &accountId, double balance, double threshold);
    void alertRuleAdded(const AlertRule &rule);
    void alertRuleRemoved(const QString &ruleId);

private:
    QVector<AlertRule> m_alertRules;
};

#endif // ALERTENGINE_H
