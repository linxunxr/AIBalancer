#include "DashboardViewModel.h"
#include <QDateTime>

DashboardViewModel::DashboardViewModel(QObject* parent)
    : QObject(parent) {
}

void DashboardViewModel::setBalanceViewModel(BalanceViewModel* balanceVM) {
    // 断开旧连接
    if (m_balanceViewModel) {
        disconnect(m_balanceViewModel, nullptr, this, nullptr);
    }

    m_balanceViewModel = balanceVM;

    // 连接新 ViewModel
    if (m_balanceViewModel) {
        connect(m_balanceViewModel, &BalanceViewModel::balanceRefreshed,
                this, &DashboardViewModel::onBalanceRefreshed);
        connect(m_balanceViewModel, &BalanceViewModel::refreshFailed,
                this, &DashboardViewModel::onRefreshFailed);
        connect(m_balanceViewModel, &BalanceViewModel::isLoadingChanged,
                this, &DashboardViewModel::isLoadingChanged);
    }
}

void DashboardViewModel::refreshAll() {
    setLoading(true);
    setStatusMessage("正在刷新数据...");

    // TODO: 刷新账户列表、告警状态等

    if (m_balanceViewModel) {
        m_balanceViewModel->refreshBalance();
    }
}

void DashboardViewModel::setLoading(bool loading) {
    if (m_isLoading != loading) {
        m_isLoading = loading;
        emit isLoadingChanged();

        if (!loading) {
            m_lastRefresh = QDateTime::currentDateTime();
            emit lastRefreshChanged();
            emit dataRefreshed();
        }
    }
}

void DashboardViewModel::setStatusMessage(const QString& message) {
    if (m_statusMessage != message) {
        m_statusMessage = message;
        emit statusMessageChanged();
    }
}

void DashboardViewModel::onBalanceRefreshed(const BalanceInfo& info) {
    m_totalBalance = info.totalBalance;
    m_totalUsed = info.usedBalance;

    emit totalBalanceChanged();
    emit totalUsedChanged();

    setStatusMessage("数据已更新");
}

void DashboardViewModel::onRefreshFailed(const QString& error) {
    setStatusMessage(QString("刷新失败: %1").arg(error));
}
