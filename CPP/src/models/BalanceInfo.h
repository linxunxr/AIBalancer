#ifndef BALANCEINFO_H
#define BALANCEINFO_H

#include <QObject>
#include <QDateTime>
#include <QJsonObject>

/**
 * @brief 余额信息数据模型
 *
 * 纯数据结构，不包含业务逻辑
 */
struct BalanceInfo {
    double totalBalance{0.0};       // 总余额
    double usedBalance{0.0};        // 已使用额度
    double remainingBalance{0.0};    // 剩余额度
    double dailyLimit{0.0};         // 日限额
    QString currency{"USD"};         // 货币单位
    QDateTime lastUpdated;           // 最后更新时间
    QJsonObject rawData;             // 原始 API 响应数据

    // 检查余额数据是否有效
    bool isValid() const {
        return totalBalance > 0.0 || usedBalance > 0.0;
    }

    // 计算使用率（百分比）
    double usageRate() const {
        if (totalBalance <= 0.0) return 0.0;
        return (usedBalance / totalBalance) * 100.0;
    }

    // 是否余额不足（低于 10%）
    bool isLowBalance() const {
        if (totalBalance <= 0.0) return false;
        return remainingBalance < (totalBalance * 0.1);
    }

    // 重置为空状态
    void clear() {
        totalBalance = 0.0;
        usedBalance = 0.0;
        remainingBalance = 0.0;
        dailyLimit = 0.0;
        currency = "USD";
        lastUpdated = QDateTime();
        rawData = QJsonObject();
    }
};

Q_DECLARE_METATYPE(BalanceInfo)

#endif // BALANCEINFO_H
