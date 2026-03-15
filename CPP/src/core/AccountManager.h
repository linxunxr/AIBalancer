#ifndef ACCOUNTMANAGER_H
#define ACCOUNTMANAGER_H

#include <QObject>
#include <QString>
#include <QVector>

struct AccountInfo {
    QString id;
    QString name;
    QString email;
    QString apiKey;
    bool isActive{true};
    qint64 createdAt{0};
};

class AccountManager : public QObject {
    Q_OBJECT

public:
    explicit AccountManager(QObject *parent = nullptr);
    ~AccountManager() = default;

    // 添加账户
    Q_INVOKABLE bool addAccount(const QString &name, const QString &email, const QString &apiKey);

    // 删除账户
    Q_INVOKABLE bool removeAccount(const QString &accountId);

    // 获取所有账户
    Q_INVOKABLE QVector<AccountInfo> getAccounts() const;

    // 获取活动账户
    Q_INVOKABLE AccountInfo getActiveAccount() const;

    // 设置活动账户
    Q_INVOKABLE bool setActiveAccount(const QString &accountId);

signals:
    void accountAdded(const AccountInfo &account);
    void accountRemoved(const QString &accountId);
    void activeAccountChanged(const AccountInfo &account);

private:
    QVector<AccountInfo> m_accounts;
    QString m_activeAccountId;
};

#endif // ACCOUNTMANAGER_H
