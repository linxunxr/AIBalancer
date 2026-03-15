#ifndef DATABASEACCOUNTREPOSITORY_H
#define DATABASEACCOUNTREPOSITORY_H

#include "../interfaces/IAccountRepository.h"
#include "DatabaseRepository.h"
#include <QMutex>

/**
 * @brief 数据库账户仓储实现
 *
 * 负责：
 * - 保存账户信息到 SQLite
 * - 加密存储 API Key
 * - 查询和管理账户
 */
class DatabaseAccountRepository : public DatabaseRepository, public IAccountRepository {
    Q_OBJECT
public:
    explicit DatabaseAccountRepository(QObject* parent = nullptr);
    ~DatabaseAccountRepository() override;

    // IAccountRepository 接口实现
    bool addAccount(const Account& account) override;
    bool updateAccount(const Account& account) override;
    bool removeAccount(const QString& accountId) override;
    Account getAccount(const QString& accountId) const override;
    QVector<Account> getAllAccounts() const override;
    QVector<Account> getActiveAccounts() const override;
    bool setActiveAccount(const QString& accountId) override;
    Account getActiveAccount() const override;
    bool saveApiKey(const QString& accountId, const QString& apiKey) override;
    QString getApiKey(const QString& accountId) const override;
    bool removeApiKey(const QString& accountId) override;

signals:
    void accountAdded(const Account& account);
    void accountRemoved(const QString& accountId);
    void activeAccountChanged(const Account& account);

private:
    bool createTables() override;

    Account queryToAccount(QSqlQuery& query) const;
    QVector<Account> getAccountsWithActiveFilter(bool activeOnly) const;
    QByteArray encryptApiKey(const QString& apiKey);
    QString decryptApiKey(const QByteArray& encrypted) const;

    QString m_activeAccountId;
    mutable QMutex m_mutex;
};

#endif // DATABASEACCOUNTREPOSITORY_H
