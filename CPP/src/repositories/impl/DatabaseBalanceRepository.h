#ifndef DATABASEBALANCEREPOSITORY_H
#define DATABASEBALANCEREPOSITORY_H

#include "../interfaces/IBalanceRepository.h"
#include "DatabaseRepository.h"

/**
 * @brief 数据库余额仓储实现
 *
 * 负责：
 * - 保存余额历史记录到 SQLite
 * - 查询历史数据
 * - 数据清理
 */
class DatabaseBalanceRepository : public IBalanceRepository, public DatabaseRepository {
public:
    explicit DatabaseBalanceRepository(QObject* parent = nullptr);
    ~DatabaseBalanceRepository() override;

    // IBalanceRepository 接口实现
    QFuture<BalanceInfo> fetchBalance(const QString& apiKey) override;
    bool saveBalanceRecord(const QString& accountId, const BalanceInfo& info) override;
    QVector<BalanceInfo> getBalanceHistory(const QString& accountId,
                                         const QDateTime& since,
                                         int limit) const override;
    BalanceInfo getLatestBalance(const QString& accountId) const override;
    bool cleanupOldData(int daysToKeep) override;
    void setApiEndpoint(const QString& endpoint) override;
    void setTimeout(int timeoutMs) override;

private:
    bool createTables() override;

    QString m_apiEndpoint;
    int m_timeoutMs{5000};
};

#endif // DATABASEBALANCEREPOSITORY_H
