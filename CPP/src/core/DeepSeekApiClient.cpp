#include "DeepSeekApiClient.h"
#include <QJsonDocument>
#include <QJsonObject>

DeepSeekApiClient::DeepSeekApiClient(QObject *parent)
    : QObject(parent)
    , m_networkManager(new QNetworkAccessManager(this)) {
}

void DeepSeekApiClient::queryBalance(const QString &apiKey) {
    QNetworkRequest request = createBalanceRequest(apiKey);
    QNetworkReply *reply = m_networkManager->get(request);

    connect(reply, &QNetworkReply::finished, this, &DeepSeekApiClient::onNetworkReplyFinished);
    connect(reply, &QNetworkReply::errorOccurred, this, [this, reply](QNetworkReply::NetworkError error) {
        emit requestFailed(QString("网络错误: %1").arg(reply->errorString()));
        reply->deleteLater();
    });
}

void DeepSeekApiClient::setApiEndpoint(const QString &endpoint) {
    m_apiEndpoint = endpoint;
}

void DeepSeekApiClient::setTimeout(int timeoutMs) {
    m_timeoutMs = timeoutMs;
}

QNetworkRequest DeepSeekApiClient::createBalanceRequest(const QString &apiKey) {
    QUrl url(m_apiEndpoint + "/billing/balance");
    QNetworkRequest request(url);

    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
    request.setRawHeader("Authorization", QString("Bearer %1").arg(apiKey).toUtf8());
    request.setRawHeader("User-Agent", "DeepSeek-Balance-Monitor/1.0");

    return request;
}

void DeepSeekApiClient::onNetworkReplyFinished() {
    QNetworkReply *reply = qobject_cast<QNetworkReply *>(sender());
    if (!reply) return;

    if (reply->error() == QNetworkReply::NoError) {
        QByteArray data = reply->readAll();
        BalanceInfo info = parseBalanceResponse(data);
        emit balanceReceived(info);
    } else {
        emit requestFailed(QString(reply->errorString()));
    }

    reply->deleteLater();
}

BalanceInfo DeepSeekApiClient::parseBalanceResponse(const QByteArray &data) {
    QJsonDocument doc = QJsonDocument::fromJson(data);
    if (doc.isNull() || !doc.isObject()) {
        return BalanceInfo{};
    }

    QJsonObject obj = doc.object();
    BalanceInfo info;

    // 根据 DeepSeek 实际 API 响应结构调整字段名
    info.totalBalance = obj.value("total_balance").toDouble();
    info.usedBalance = obj.value("used_balance").toDouble();
    info.remainingBalance = obj.value("remaining_balance").toDouble();
    info.currency = obj.value("currency").toString("USD");
    info.lastUpdated = QDateTime::currentDateTime();
    info.rawData = obj;

    return info;
}
