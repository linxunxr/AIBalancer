#ifndef DASHBOARDVIEWMODEL_H
#define DASHBOARDVIEWMODEL_H

#include <QObject>
#include "BalanceViewModel.h"
#include <QVector>
#include "../models/Account.h"

/**
 * @brief 仪表盘 ViewModel
 *
 * 职责：
 * - 管理仪表盘状态
 * - 协调多个子 ViewModel
 * - 提供总览数据
 */
class DashboardViewModel : public QObject {
    Q_OBJECT

    // Q_PROPERTY for data binding
    Q_PROPERTY(int accountCount READ accountCount NOTIFY accountCountChanged)
    Q_PROPERTY(double totalBalance READ totalBalance NOTIFY totalBalanceChanged)
    Q_PROPERTY(double totalUsed READ totalUsed NOTIFY totalUsedChanged)
    Q_PROPERTY(bool isLoading READ isLoading NOTIFY isLoadingChanged)
    Q_PROPERTY(QString statusMessage READ statusMessage NOTIFY statusMessageChanged)
    Q_PROPERTY(QDateTime lastRefresh READ lastRefresh NOTIFY lastRefreshChanged)

public:
    explicit DashboardViewModel(QObject* parent = nullptr);
    ~DashboardViewModel() = default;

    // Property getters
    int accountCount() const { return m_accountCount; }
    double totalBalance() const { return m_totalBalance; }
    double totalUsed() const { return m_totalUsed; }
    bool isLoading() const { return m_isLoading; }
    QString statusMessage() const { return m_statusMessage; }
    QDateTime lastRefresh() const { return m_lastRefresh; }

    /**
     * @brief 设置当前余额 ViewModel
     */
    void setBalanceViewModel(BalanceViewModel* balanceVM);

    /**
     * @brief 刷新所有数据
     */
    Q_INVOKABLE void refreshAll();

    /**
     * @brief 设置加载状态
     */
    Q_INVOKABLE void setLoading(bool loading);

    /**
     * @brief 设置状态消息
     */
    Q_INVOKABLE void setStatusMessage(const QString& message);

signals:
    void accountCountChanged();
    void totalBalanceChanged();
    void totalUsedChanged();
    void isLoadingChanged();
    void statusMessageChanged();
    void lastRefreshChanged();

    void dataRefreshed();

private slots:
    void onBalanceRefreshed(const BalanceInfo& info);
    void onRefreshFailed(const QString& error);

private:
    int m_accountCount{0};
    double m_totalBalance{0.0};
    double m_totalUsed{0.0};
    bool m_isLoading{false};
    QString m_statusMessage;
    QDateTime m_lastRefresh;

    BalanceViewModel* m_balanceViewModel{nullptr};
};

#endif // DASHBOARDVIEWMODEL_H
