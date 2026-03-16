#ifndef MOCKBALANCEREPOSITORY_H
#define MOCKBALANCEREPOSITORY_H

#include "../../repositories/interfaces/IBalanceRepository.h"
#include <QObject>
#include <memory>

/**
 * @brief Mock 余额仓储实现
 *
 * 用于单元测试，可以预设返回值和模拟错误
 */
class MockBalanceRepository : public IBalanceRepository {
public:
    explicit MockBalanceRepository(QObject* parent = nullptr);
    ~MockBalanceRepository() override = default;

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

    // Mock 方法
    void setMockBalance(const BalanceInfo& balance);
    void setMockBalanceList(const QVector<BalanceInfo>& balances);
    void setMockError(const QString& error);
    void setMockFetchDelay(int delayMs);
    void clearHistory();

    bool wasFetchCalled() const { return m_fetchCalled; }
    bool wasSaveCalled() const { return m_saveCalled; }
    int fetchCallCount() const { return m_fetchCallCount; }
    int saveCallCount() const { return m_saveCallCount; }

    void resetCallCounters() {
        m_fetchCalled = false;
        m_saveCalled = false;
        m_fetchCallCount = 0;
        m_saveCallCount = 0;
    }

private:
    BalanceInfo m_mockBalance;
    QVector<BalanceInfo> m_mockBalances;
    QString m_mockError;
    int m_mockDelayMs{0};

    bool m_fetchCalled{false};
    bool m_saveCalled{false};
    int m_fetchCallCount{0};
    int m_saveCallCount{0};

    mutable QVector<BalanceInfo> m_savedBalances;
};

#endif // MOCKBALANCEREPOSITORY_H
