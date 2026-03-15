#ifndef ALERTVIEWMODEL_H
#define ALERTVIEWMODEL_H

#include <QObject>
#include "../models/AlertRule.h"
#include "../repositories/interfaces/IAlertRepository.h"
#include <QVariantList>
#include <memory>

class AlertViewModel : public QObject {
    Q_OBJECT
    // Q_PROPERTY for data binding
    Q_PROPERTY(QVariantList alertRules READ alertRules NOTIFY alertRulesChanged)
    Q_PROPERTY(int ruleCount READ ruleCount NOTIFY alertRulesChanged)
    Q_PROPERTY(bool isLoading READ isLoading NOTIFY isLoadingChanged)
    Q_PROPERTY(QString errorMessage READ errorMessage NOTIFY errorMessageChanged)
    Q_PROPERTY(bool hasError READ hasError NOTIFY errorMessageChanged)

public:
    explicit AlertViewModel(
        std::shared_ptr<IAlertRepository> alertRepo,
        QObject* parent = nullptr);
    ~AlertViewModel() override = default;

    // Property getters
    QVariantList alertRules() const;
    int ruleCount() const { return m_alertRules.size(); }
    bool isLoading() const { return m_isLoading; }
    QString errorMessage() const { return m_errorMessage; }
    bool hasError() const { return !m_errorMessage.isEmpty(); }

    /**
     * @brief 设置账户 ID
     */
    Q_INVOKABLE void setAccountId(const QString& accountId);

    // 加载告警规则
    Q_INVOKABLE void loadAlertRules();

    /**
     * @brief 添加告警规则
     */
    Q_INVOKABLE void addAlertRule(int alertType, double threshold, int notificationMethod);

    /**
     * @brief 删除告警规则
     */
    Q_INVOKABLE void removeAlertRule(const QString& ruleId);

    /**
     * @brief 启用/禁用告警规则
     */
    Q_INVOKABLE void setAlertEnabled(const QString& ruleId, bool enabled);

    /**
     * @brief 清除错误消息
     */
    Q_INVOKABLE void clearError();

signals:
    void alertRulesChanged();
    void isLoadingChanged();
    void errorMessageChanged();

    void alertTriggered(const QString& accountId, double balance, double threshold);
    void ruleAdded(const QString& ruleId);
    void ruleRemoved(const QString& ruleId);

private slots:
    void onAlertTriggered(const QString& accountId, double balance, double threshold);

private:
    void setLoading(bool loading);
    void setError(const QString& error);
    void updateAlertRulesList();

    QString m_accountId;
    QVector<AlertRule> m_alertRules;
    bool m_isLoading{false};
    QString m_errorMessage;

    std::shared_ptr<IAlertRepository> m_alertRepo;
};

#endif // ALERTVIEWMODEL_H
