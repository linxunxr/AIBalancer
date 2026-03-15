#ifndef DEEPSEEKAPICLIENT_H
#define DEEPSEEKAPICLIENT_H

#include <QObject>
#include <QNetworkAccessManager>
#include <QNetworkReply>
#include "BalanceFetcher.h"

class DeepSeekApiClient : public QObject {
    Q_OBJECT

public:
    explicit DeepSeekApiClient(QObject *parent = nullptr);
    ~DeepSeekApiClient() = default;

    // 发送余额查询请求
    Q_INVOKABLE void queryBalance(const QString &apiKey);

    // 设置 API 端点
    void setApiEndpoint(const QString &endpoint);

    // 设置超时时间（毫秒）
    void setTimeout(int timeoutMs);

signals:
    void balanceReceived(const BalanceInfo &info);
    void requestFailed(const QString &errorMessage);

private slots:
    void onNetworkReplyFinished();

private:
    QNetworkAccessManager *m_networkManager;
    QString m_apiEndpoint{"https://api.deepseek.com"};
    int m_timeoutMs{5000'};

    QNetworkRequest createBalanceRequest(const QString &apiKey);
    BalanceInfo parseBalanceResponse(const QByteArray &data);
};

#endif // DEEPSEEKAPICLIENT_H
