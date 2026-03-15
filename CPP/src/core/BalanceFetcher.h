#ifndef BALANCEFETCHER_H
#define BALANCEFETCHER_H

#include <QObject>
#include <QString>
#include <QDateTime>
#include <QJsonObject>

struct BalanceInfo {
    double totalBalance{0.0};
    double usedBalance{0.0};
    double remainingBalance{0.0};
    QString currency{"USD"};
    QDateTime lastUpdated;
    QJsonObject rawData;

    bool isValid() const {
        return totalBalance > 0 || usedBalance > 0;
    }
};

class BalanceFetcher : public QObject {
    Q_OBJECT
    Q_PROPERTY(double currentBalance READ currentBalance NOTIFY balanceUpdated)

public:
    explicit BalanceFetcher(QObject *parent = nullptr);
    ~BalanceFetcher() = default;

    // 获取当前余额
    Q_INVOKABLE void fetchBalance(const QString &apiKey);

    // 获取缓存的余额信息
    BalanceInfo getCachedBalance() const;

    double currentBalance() const { return m_cachedBalance.totalBalance; }

signals:
    void balanceUpdated(const BalanceInfo &info);
    void errorOccurred(const QString &errorMessage);

private:
    BalanceInfo m_cachedBalance;
};

#endif // BALANCEFETCHER_H
