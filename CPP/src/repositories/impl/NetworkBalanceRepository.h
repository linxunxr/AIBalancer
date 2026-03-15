#ifndef NETWORKBALANCEREPOSITORY_H
#define NETWORKBALANCEREPOSITORY_H

#include "../interfaces/IBalanceRepository.h"
#include <QNetworkAccessManager>
#include <QNetworkReply>
#include <QPromise>
#include <QFuture>
#include <QMutex>

/**
 * @brief 网络余额仓储实现
 *
 * 负责：
 * - 发送 HTTP 请求到 DeepSeek API
 * - 解析 API 响应
 * - 错误处理
 */
class NetworkBalanceRepository : public QObject, public IBalanceRepository {
    Q_OBJECT
public:
    explicit NetworkBalanceRepository(QObject* parent = nullptr);
    ~NetworkBalanceRepository() override;

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

    /**
     * @brief 设置离线模式
     * @param offline 是否离线
     */
    void setOfflineMode(bool offline) { m_offlineMode = offline; }

    /**
     * @brief 是否离线模式
     */
    bool isOfflineMode() const { return m_offlineMode; }

signals:
    void requestStarted();
    void requestFinished();
    void errorOccurred(const QString& errorMessage) const;

private:
    QNetworkRequest createRequest(const QString& apiKey) const;
    BalanceInfo parseResponse(const QByteArray& data) const;

    QNetworkAccessManager* m_networkManager;
    QString m_apiEndpoint{"https://api.deepseek.com"};
    int m_timeoutMs{5000};
    bool m_offlineMode{false};
    mutable QMutex m_mutex;
};

#endif // NETWORKBALANCEREPOSITORY_H
