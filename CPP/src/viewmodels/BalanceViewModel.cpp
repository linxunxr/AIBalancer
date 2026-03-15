#include "BalanceViewModel.h"
#include <QFuture>

BalanceViewModel::BalanceViewModel(
    std::shared_ptr<IBalanceRepository> balanceRepo,
    QObject* parent)
    : QObject(parent)
    , m_balanceRepo(std::move(balanceRepo)) {

    m_watcher = new QFutureWatcher<BalanceInfo>(this);
    connect(m_watcher, &QFutureWatcher<BalanceInfo>::finished,
            this, &BalanceViewModel::onBalanceFetchFinished);
}

void BalanceViewModel::setAccountId(const QString& accountId) {
    if (m_accountId != accountId) {
        m_accountId = accountId;
    }
}

void BalanceViewModel::refreshBalance() {
    // TODO: 从 AccountRepository 获取 API Key
    clearError();
    setLoading(true);

    // 模拟数据（实际应从数据库获取）
    auto future = m_balanceRepo->fetchBalance("sk-test-key");
    m_watcher->setFuture(future);
}

void BalanceViewModel::refreshWithApiKey(const QString& apiKey) {
    if (apiKey.isEmpty()) {
        setError("API Key 不能为空");
        return;
    }

    clearError();
    setLoading(true);

    auto future = m_balanceRepo->fetchBalance(apiKey);
    m_watcher->setFuture(future);
}

void BalanceViewModel::clearError() {
    setError(QString());
}

void BalanceViewModel::setLoading(bool loading) {
    if (m_isLoading != loading) {
        m_isLoading = loading;
        emit isLoadingChanged();
    }
}

void BalanceViewModel::setError(const QString& error) {
    if (m_errorMessage != error) {
        m_errorMessage = error;
        emit errorMessageChanged();
    }
}

void BalanceViewModel::updateBalance(const BalanceInfo& info) {
    m_balance = info;
    emitAllBalanceChanged();
}

void BalanceViewModel::emitAllBalanceChanged() {
    emit totalBalanceChanged();
    emit usedBalanceChanged();
    emit remainingBalanceChanged();
    emit usageRateChanged();
    emit currencyChanged();
    emit lastUpdatedChanged();
    emit isLowBalanceChanged();
}

void BalanceViewModel::onBalanceFetchFinished() {
    try {
        BalanceInfo info = m_watcher->result();

        if (info.isValid()) {
            updateBalance(info);
            emit balanceRefreshed(info);

            // 保存到数据库
            if (!m_accountId.isEmpty()) {
                m_balanceRepo->saveBalanceRecord(m_accountId, info);
            }
        } else {
            setError("获取到无效的余额数据");
            emit refreshFailed("获取到无效的余额数据");
        }
    } catch (const std::exception& e) {
        QString error = QString("获取余额失败: %1").arg(e.what());
        setError(error);
        emit refreshFailed(error);
    }

    setLoading(false);
}
