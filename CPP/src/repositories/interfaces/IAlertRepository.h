#ifndef IALERTREPOSITORY_H
#define IALERTREPOSITORY_H

#include "../models/AlertRule.h"
#include <QVector>
#include <QString>

/**
 * @brief 告警规则仓储接口
 */
class IAlertRepository {
public:
    virtual ~IAlertRepository() = default;

    /**
     * @brief 添加告警规则
     * @param rule 告警规则
     * @return 添加是否成功
     */
    virtual bool addAlertRule(const AlertRule& rule) = 0;

    /**
     * @brief 更新告警规则
     * @param rule 告警规则
     * @return 更新是否成功
     */
    virtual bool updateAlertRule(const AlertRule& rule) = 0;

    /**
     * @brief 删除告警规则
     * @param ruleId 规则 ID
     * @return 删除是否成功
     */
    virtual bool removeAlertRule(const QString& ruleId) = 0;

    /**
     * @brief 获取账户的所有告警规则
     * @param accountId 账户 ID
     * @return 告警规则列表
     */
    virtual QVector<AlertRule> getAlertRules(const QString& accountId) const = 0;

    /**
     * @brief 获取所有告警规则
     * @return 告警规则列表
     */
    virtual QVector<AlertRule> getAllAlertRules() const = 0;

    /**
     * @brief 检查余额并触发告警
     * @param accountId 账户 ID
     * @param balance 当前余额
     * @return 触发的告警规则列表
     */
    virtual QVector<AlertRule> checkAlerts(const QString& accountId, double balance) = 0;

    /**
     * @brief 启用/禁用告警规则
     * @param ruleId 规则 ID
     * @param enabled 是否启用
     * @return 设置是否成功
     */
    virtual bool setAlertEnabled(const QString& ruleId, bool enabled) = 0;

    /**
     * @brief 记录告警触发日志
     * @param ruleId 规则 ID
     * @param message 告警消息
     * @return 记录是否成功
     */
    virtual bool logAlertTrigger(const QString& ruleId, const QString& message) = 0;

    /**
     * @brief 获取告警触发历史
     * @param accountId 账户 ID（可选）
     * @param limit 返回数量限制
     * @return 告警历史列表
     */
    virtual QVector<QString> getAlertHistory(const QString& accountId = QString(), int limit = 50) const = 0;
};

#endif // IALERTREPOSITORY_H
