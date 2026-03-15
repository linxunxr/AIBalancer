#ifndef BALANCEVIEWMODEL_H
#define BALANCEVIEWMODEL_H

#include <QObject>
#include "../models/BalanceInfo.h"
#include "../repositories/interfaces/IBalanceRepository.h"
#include <QFutureWatcher>
#include <memory>

/**
 * @brief 余额 ViewModel
 *
 * 职责：
 * - 连接 View 和 BalanceRepository
 * - 暴露 Q_PROPERTY 供 QML 绑定
 * - 处理余额查询逻辑和状态
 */
class BalanceViewModel : public QObject {
    Q_OBJECT

    // Q_PROPERTY for data binding
    Q_PROPERTY(double totalBalance READ totalBalance NOTIFY totalBalanceChanged)
    Q_PROPERTY(double usedBalance READ usedBalance NOTIFY usedBalanceChanged)
    Q_PROPERTY(double remainingBalance READ remainingBalance NOTIFY remainingBalanceChanged)
    Q_PROPERTY(double usageRate READ usageRate NOTIFY usageRateChanged)
    Q_PROPERTY(QString currency READ currency NOTIFY currencyChanged)
    Q_PROPERTY(QDateTime lastUpdated READ lastUpdated NOTIFY lastUpdatedChanged)
    Q_PROPERTY(bool isLoading READ isLoading NOTIFY isLoadingChanged)
    Q_PROPERTY(QString errorMessage READ errorMessage NOTIFY errorMessageChanged)
    Q_PROPERTY(bool hasError READ hasError NOTIFY errorMessageChanged)
    Q_PROPERTY(bool isLowBalance READ isLowBalance NOTIFY isLowBalanceChanged)

public:
    explicit BalanceViewModel(
        std::shared_ptr<IBalanceRepository> balanceRepo,
        QObject* parent = nullptr);
    ~BalanceViewModel() = default;

    // Property getters
    double totalBalance() const { return m_balance.totalBalance; }
    double usedBalance() const { return m_balance.usedBalance; }
    double remainingBalance() const { return m_balance.remainingBalance; }
    double usageRate() const { return m_balance.usageRate(); }
    QString currency() const { return m_balance.currency; }
    QDateTime lastUpdated() const { return m_balance.lastUpdated; }
    bool isLoading() const { return m_isLoading; }
    QString errorMessage() const { return m_errorMessage; }
    bool hasError() const { return !m_errorMessage.isEmpty(); }
    bool isLowBalance() const { return m_balance.isLowBalance(); }

    /**
     * @brief 设置当前账户 ID
     */
    Q_INVOKABLE void setAccountId(const QString& accountId);

    /**
     * @brief 刷新余额
     */
    Q_INVOKABLE void refreshBalance();

    /**
     * @brief 使用指定 API Key 刷新
     */
    Q_INVOKABLE void refreshWithApiKey(const QString& apiKey);

    /**
     * @brief 清除错误消息
     */
    Q_INVOKABLE void clearError();

signals:
    void totalBalanceChanged();
    void usedBalanceChanged();
    void remainingBalanceChanged();
    void usageRateChanged();
    void currencyChanged();
    void lastUpdatedChanged();
    void isLoadingChanged();
    void errorMessageChanged();
    void isLowBalanceChanged();

    void balanceRefreshed(const BalanceInfo& info);
    void refreshFailed(const QString& error);

private slots:
    void onBalanceFetchFinished();

private:
    void setLoading(bool loading);
    void setError(const QString& error);
    void updateBalance(const BalanceInfo& info);
    void emitAllBalanceChanged();

    BalanceInfo m_balance;
    bool m_isLoading{false};
    QString m_errorMessage;
    QString m_accountId;

    std::shared_ptr<IBalanceRepository> m_balanceRepo;
    QFutureWatcher<BalanceInfo>* m_watcher{nullptr};
};

#endif // BALANCEVIEWMODEL_H
