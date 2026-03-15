#include "BalanceFetcher.h"
#include <QNetworkAccessManager>
#include <QNetworkRequest>
#include <QNetworkReply>
#include <QJsonDocument>

BalanceFetcher::BalanceFetcher(QObject *parent)
    : QObject(parent) {
}

void BalanceFetcher::fetchBalance(const QString &apiKey) {
    if (apiKey.isEmpty()) {
        emit errorOccurred("API Key 不能为空");
        return;
    }

    // TODO: 实现实际的 API 调用
    // 这里使用模拟数据作为演示

    BalanceInfo info;
    info.totalBalance = 156.78;
    info.usedBalance = 43.22;
    info.remainingBalance = 113.56;
    info.currency = "USD";
    info.lastUpdated = QDateTime::currentDateTime();

    m_cachedBalance = info;
    emit balanceUpdated(info);
}

BalanceInfo BalanceFetcher::getCachedBalance() const {
    return m_cachedBalance;
}
