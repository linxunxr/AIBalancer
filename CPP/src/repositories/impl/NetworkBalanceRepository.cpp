#include "NetworkBalanceRepository.h"
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QTimer>

NetworkBalanceRepository::NetworkBalanceRepository(QObject* parent)
    : m_networkManager(new QNetworkAccessManager(parent)) {
}

NetworkBalanceRepository::~NetworkBalanceRepository() {
    if (m_networkManager) {
        m_networkManager->deleteLater();
    }
}

QFuture<BalanceInfo> NetworkBalanceRepository::fetchBalance(const QString& apiKey) {
    if (m_offlineMode) {
        // 离线模式：返回空数据或缓存数据
        QPromise<BalanceInfo> promise;
        promise.addResult(BalanceInfo{});
        return promise.future();
    }

    QPromise<BalanceInfo> promise;
    QFuture<BalanceInfo> future = promise.future();

    QNetworkRequest request = createRequest(apiKey);
    QNetworkReply* reply = m_networkManager->get(request);

    emit requestStarted();

    // 使用 C++20 lambda 捕获
    connect(reply, &QNetworkReply::finished, this, [this, reply, promise = std::move(promise)]() mutable {
        BalanceInfo result;

        if (reply->error() == QNetworkReply::NoError) {
            QByteArray data = reply->readAll();
            result = parseResponse(data);
        } else {
            emit errorOccurred(reply->errorString());
            result.clear();
        }

        emit requestFinished();
        promise.addResult(result);
        reply->deleteLater();
    });

    connect(reply, &QNetworkReply::errorOccurred, this, [this, reply](QNetworkReply::NetworkError error) {
        Q_UNUSED(error);
        emit errorOccurred(QString("网络错误: %1").arg(reply->errorString()));
        reply->deleteLater();
    });

    return future;
}

bool NetworkBalanceRepository::saveBalanceRecord(const QString& accountId, const BalanceInfo& info) {
    // 网络仓储不负责保存到数据库
    // 需要注入 DatabaseBalanceRepository 来处理
    Q_UNUSED(accountId);
    Q_UNUSED(info);
    return false;
}

QVector<BalanceInfo> NetworkBalanceRepository::getBalanceHistory(
    const QString& accountId,
    const QDateTime& since,
    int limit) const {
    // 网络仓储不存储历史数据
    Q_UNUSED(accountId);
    Q_UNUSED(since);
    Q_UNUSED(limit);
    return {};
}

BalanceInfo NetworkBalanceRepository::getLatestBalance(const QString& accountId) const {
    // 网络仓储不存储数据
    Q_UNUSED(accountId);
    return {};
}

bool NetworkBalanceRepository::cleanupOldData(int daysToKeep) {
    // 网络仓储不管理数据
    Q_UNUSED(daysToKeep);
    return false;
}

void NetworkBalanceRepository::setApiEndpoint(const QString& endpoint) {
    QMutexLocker locker(&m_mutex);
    m_apiEndpoint = endpoint;
}

void NetworkBalanceRepository::setTimeout(int timeoutMs) {
    QMutexLocker locker(&m_mutex);
    m_timeoutMs = timeoutMs;
}

QNetworkRequest NetworkBalanceRepository::createRequest(const QString& apiKey) const {
    QMutexLocker locker(&m_mutex);

    QUrl url(m_apiEndpoint + "/billing/balance");
    QNetworkRequest request(url);

    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
    request.setRawHeader("Authorization", QString("Bearer %1").arg(apiKey).toUtf8());
    request.setRawHeader("User-Agent", "AIBalanceManager/1.0");
    request.setTransferTimeout(m_timeoutMs);

    return request;
}

BalanceInfo NetworkBalanceRepository::parseResponse(const QByteArray& data) const {
    QJsonDocument doc = QJsonDocument::fromJson(data);
    if (doc.isNull() || !doc.isObject()) {
        emit errorOccurred("无效的 JSON 响应");
        return {};
    }

    QJsonObject obj = doc.object();
    BalanceInfo info;

    // 根据 DeepSeek 实际 API 响应结构调整字段名
    // 可能的字段名：total_balance, totalBalance, balance, amount 等
    info.totalBalance = obj.value("total_balance").toDouble(
                       obj.value("totalBalance").toDouble(
                       obj.value("balance").toDouble()));
    info.usedBalance = obj.value("used_balance").toDouble(
                     obj.value("usedBalance").toDouble());
    info.remainingBalance = obj.value("remaining_balance").toDouble(
                          obj.value("remainingBalance").toDouble());
    info.currency = obj.value("currency").toString("USD");
    info.lastUpdated = QDateTime::currentDateTime();
    info.rawData = obj;

    return info;
}
