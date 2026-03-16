#include "MockBalanceRepository.h"
#include <QThread>
#include <QtConcurrent>

MockBalanceRepository::MockBalanceRepository(QObject* parent)
    : IBalanceRepository() {
    Q_UNUSED(parent);
}

QFuture<BalanceInfo> MockBalanceRepository::fetchBalance(const QString& apiKey) {
    Q_UNUSED(apiKey);

    m_fetchCalled = true;
    m_fetchCallCount++;

    if (m_mockDelayMs > 0) {
        QThread::msleep(m_mockDelayMs);
    }

    if (m_mockError.isEmpty()) {
        return QtConcurrent::run([this]() {
            return m_mockBalance;
        });
    } else {
        return QtConcurrent::run([this]() {
            QThread::msleep(m_mockDelayMs);
            throw std::runtime_error(m_mockError.toStdString());
            return BalanceInfo{};
        });
    }
}

bool MockBalanceRepository::saveBalanceRecord(const QString& accountId, const BalanceInfo& info) {
    Q_UNUSED(accountId);

    m_saveCalled = true;
    m_saveCallCount++;
    m_savedBalances.append(info);

    return m_mockError.isEmpty();
}

QVector<BalanceInfo> MockBalanceRepository::getBalanceHistory(
    const QString& accountId,
    const QDateTime& since,
    int limit) const {
    Q_UNUSED(accountId);
    Q_UNUSED(since);

    if (limit < m_mockBalances.size()) {
        return m_mockBalances.mid(0, limit);
    }

    return m_mockBalances;
}

BalanceInfo MockBalanceRepository::getLatestBalance(const QString& accountId) const {
    Q_UNUSED(accountId);

    if (m_mockBalances.isEmpty()) {
        return {};
    }

    return m_mockBalances.first();
}

bool MockBalanceRepository::cleanupOldData(int daysToKeep) {
    Q_UNUSED(daysToKeep);
    return true;
}

void MockBalanceRepository::setApiEndpoint(const QString& endpoint) {
    Q_UNUSED(endpoint);
    // Mock 不实际设置端点
}

void MockBalanceRepository::setTimeout(int timeoutMs) {
    Q_UNUSED(timeoutMs);
    // Mock 不实际设置超时
}

void MockBalanceRepository::setMockBalance(const BalanceInfo& balance) {
    m_mockBalance = balance;
}

void MockBalanceRepository::setMockBalanceList(const QVector<BalanceInfo>& balances) {
    m_mockBalances = balances;
}

void MockBalanceRepository::setMockError(const QString& error) {
    m_mockError = error;
}

void MockBalanceRepository::setMockFetchDelay(int delayMs) {
    m_mockDelayMs = delayMs;
}

void MockBalanceRepository::clearHistory() {
    m_savedBalances.clear();
    m_mockBalances.clear();
}
