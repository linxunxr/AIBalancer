#ifndef ALERTRULE_H
#define ALERTRULE_H

#include <QString>
#include <QDateTime>
#include <QUuid>

/**
 * @brief 告警规则枚举
 */
enum class AlertType {
    LowBalance,      // 余额不足告警
    DailyLimit,      // 日限额告警
    SyncFailed,      // 同步失败告警
    ApiError         // API 错误告警
};

/**
 * @brief 告警方式枚举
 */
enum class NotificationMethod {
    Popup,          // 弹窗通知
    System,         // 系统通知
    Email,          // 邮件通知
    Webhook         // Webhook 通知
};

/**
 * @brief 告警规则数据模型
 */
struct AlertRule {
    QString id;                      // 规则唯一标识
    QString accountId;                // 关联账户 ID
    AlertType alertType;              // 告警类型
    double threshold;                // 阈值
    NotificationMethod method;         // 通知方式
    bool isEnabled{true};            // 是否启用
    QString customMessage;            // 自定义消息
    QString webhookUrl;              // Webhook URL
    QDateTime createdAt;              // 创建时间
    QDateTime lastTriggered;          // 最后触发时间
    int triggerCount{0};            // 触发次数

    // 工厂方法：创建新规则
    static AlertRule create(const QString& accountId, AlertType type, double threshold) {
        AlertRule rule;
        rule.id = QUuid::createUuid().toString(QUuid::WithoutBraces);
        rule.accountId = accountId;
        rule.alertType = type;
        rule.threshold = threshold;
        rule.isEnabled = true;
        rule.createdAt = QDateTime::currentDateTime();
        return rule;
    }

    // 检查规则有效性
    bool isValid() const {
        return !id.isEmpty() && !accountId.isEmpty() && threshold > 0;
    }

    // 是否应该触发告警
    bool shouldTrigger(double currentValue) const {
        if (!isEnabled) return false;

        switch (alertType) {
            case AlertType::LowBalance:
            case AlertType::DailyLimit:
                return currentValue <= threshold;
            default:
                return false;
        }
    }

    // 获取告警类型名称
    QString typeName() const {
        switch (alertType) {
            case AlertType::LowBalance: return "余额不足";
            case AlertType::DailyLimit: return "日限额";
            case AlertType::SyncFailed: return "同步失败";
            case AlertType::ApiError: return "API错误";
            default: return "未知";
        }
    }
};

Q_DECLARE_METATYPE(AlertRule)

#endif // ALERTRULE_H
