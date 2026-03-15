#ifndef IBALANCEREPOSITORY_H
#define IBALANCEREPOSITORY_H

#include "../models/BalanceInfo.h"
#include <QString>
#include <QVector>
#include <QDateTime>
#include <QFuture>

/**
 * @brief 余额数据仓储接口
 *
 * 使用 Repository 模式抽象数据访问，支持：
 * - 网络获取（从 DeepSeek API）
 * - 缓存读取（从本地数据库）
 * - 离线模式支持
 */
class IBalanceRepository {
public:
    virtual ~IBalanceRepository() = default;

    /**
     * @brief 从 API 获取余额数据（异步）
     * @param apiKey API 密钥
     * @return 异步返回 BalanceInfo
     */
    virtual QFuture<BalanceInfo> fetchBalance(const QString& apiKey) = 0;

    /**
     * @brief 保存余额记录到数据库
     * @param accountId 账户 ID
     * @param info 余额信息
     * @return 保存是否成功
     */
    virtual bool saveBalanceRecord(const QString& accountId, const BalanceInfo& info) = 0;

    /**
     * @brief 获取余额历史记录
     * @param accountId 账户 ID
     * @param since 起始时间（可选）
     * @param limit 返回数量限制
     * @return 历史记录列表
     */
    virtual QVector<BalanceInfo> getBalanceHistory(
        const QString& accountId,
        const QDateTime& since = QDateTime(),
        int limit = 100
    ) const = 0;

    /**
     * @brief 获取最新余额记录
     * @param accountId 账户 ID
     * @return 最新余额信息
     */
    virtual BalanceInfo getLatestBalance(const QString& accountId) const = 0;

    /**
     * @brief 清理旧的历史数据
     * @param daysToKeep 保留天数
     * @return 清理是否成功
     */
    virtual bool cleanupOldData(int daysToKeep = 90) = 0;

    /**
     * @brief 设置 API 端点
     */
    virtual void setApiEndpoint(const QString& endpoint) = 0;

    /**
     * @brief 设置超时时间
     */
    virtual void setTimeout(int timeoutMs) = 0;
};

#endif // IBALANCEREPOSITORY_H
