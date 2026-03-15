#include "DatabaseAccountRepository.h"
#include <QSqlQuery>
#include <QCryptographicHash>
#include <QByteArray>
#include <QSettings>

DatabaseAccountRepository::DatabaseAccountRepository(QObject* parent)
    : DatabaseRepository("AccountRepository") {
    Q_UNUSED(parent);
}

DatabaseAccountRepository::~DatabaseAccountRepository() {
    close();
}

bool DatabaseAccountRepository::createTables() {
    QSqlQuery query(database());

    // 创建账户账户
    QString createAccountsTable = R"(
        CREATE TABLE IF NOT EXISTS accounts (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT,
            description TEXT,
            is_active INTEGER DEFAULT 1,
            created_at INTEGER DEFAULT (strftime('%s', 'now')),
            last_sync_time INTEGER
        )
    )";

    if (!query.exec(createAccountsTable)) {
        emitError(QString("创建账户表失败: %1").arg(query.lastError().text()));
        return false;
    }

    // 创建配置表（存储当前活动账户)
    QString createConfigTable = R"(
        CREATE TABLE IF NOT EXISTS app_config (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    )";

    if (!query.exec(createConfigTable)) {
        emitError(QString("创建配置表失败: %1").arg(query.lastError().text()));
        return false;
    }

    return true;
}

bool DatabaseAccountRepository::addAccount(const Account& account) {
    if (!isOpen() || !account.isValid()) {
        return false;
    }

    bool success = executeQuery(R"(
        INSERT INTO accounts (id, name, email, description, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    )", account.id, account.name, account.email, account.description,
       account.isActive ? 1 : 0, account.createdAt.toSecsSinceEpoch());

    if (success) {
        emit accountAdded(account);
    }

    return success;
}

bool DatabaseAccountRepository::updateAccount(const Account& account) {
    if (!isOpen() || account.id.isEmpty()) {
        return false;
    }

    bool success = executeQuery(R"(
        UPDATE accounts
        SET name = ?, email = ?, description = ?, is_active = ?, last_sync_time = ?
        WHERE id = ?
    )", account.name, account.email, account.description,
       account.isActive ? 1 : 0, account.lastSyncTime.toSecsSinceEpoch(),
       account.id);

    return success;
}

bool DatabaseAccountRepository::removeAccount(const QString& accountId) {
    if (!isOpen() || accountId.isEmpty()) {
        return false;
    }

    bool success = executeQuery("DELETE FROM accounts WHERE id = ?", accountId);

    if (success) {
        // 删除关联的 API Key
        removeApiKey(accountId);

        // 如果删除的是活动账户，清空活动账户
        QMutexLocker locker(&m_mutex);
        if (m_activeAccountId == accountId) {
            m_activeAccountId.clear();
        }

        emit accountRemoved(accountId);
    }

    return success;
}

Account DatabaseAccountRepository::getAccount(const QString& accountId) const {
    if (!isOpen() || accountId.isEmpty()) {
        return {};
    }

    QSqlQuery* query = executeQueryWithResult("SELECT * FROM accounts WHERE id = ?", accountId);
    if (!query) {
        return {};
    }

    Account result;
    if (query->next()) {
        result = queryToAccount(*query);
    }
    delete query;

    return result;
}

QVector<Account> DatabaseAccountRepository::getAllAccounts() const {
    return getAccountsWithActiveFilter(false);
}

QVector<Account> DatabaseAccountRepository::getActiveAccounts() const {
    return getAccountsWithActiveFilter(true);
}

QVector<Account> DatabaseAccountRepository::getAccountsWithActiveFilter(bool activeOnly) const {
    QVector<Account> accounts;

    if (!isOpen()) {
        return accounts;
    }

    QString sql = "SELECT * FROM accounts";
    if (activeOnly) {
        sql += " WHERE is_active = 1";
    }
    sql += " ORDER BY created_at DESC";

    QSqlQuery query(database());
    if (query.exec(sql)) {
        while (query.next()) {
            accounts.append(queryToAccount(query));
        }
    }

    return accounts;
}

bool DatabaseAccountRepository::setActiveAccount(const QString& accountId) {
    if (!isOpen() || accountId.isEmpty()) {
        return false;
    }

    // 确保账户存在
    auto account = getAccount(accountId);
    if (!account.isValid()) {
        return false;
    }

    // 保存到配置表
    bool success = executeQuery(
        "INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)",
        "active_account_id", accountId
    );

    if (success) {
        QMutexLocker locker(&m_mutex);
        m_activeAccountId = accountId;
        emit activeAccountChanged(account);
    }

    return success;
}

Account DatabaseAccountRepository::getActiveAccount() const {
    if (!isOpen()) {
        return {};
    }

    QSqlQuery* query = executeQueryWithResult(
        "SELECT value FROM app_config WHERE key = ?",
        "active_account_id"
    );

    if (!query) {
        return {};
    }

    Account result;
    if (query->next()) {
        QString accountId = query->value(0).toString();
        result = getAccount(accountId);
    }
    delete query;

    return result;
}

bool DatabaseAccountRepository::saveApiKey(const QString& accountId, const QString& apiKey) {
    if (!isOpen() || accountId.isEmpty() || apiKey.isEmpty()) {
        return false;
    }

    // 简单加密（实际应使用系统密钥链）
    QByteArray encrypted = encryptApiKey(apiKey);

    bool success = executeQuery(
        "INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)",
        QString("api_key_%1").arg(accountId),
        QString::fromUtf8(encrypted.toBase64())
    );

    return success;
}

QString DatabaseAccountRepository::getApiKey(const QString& accountId) const {
    if (!isOpen() || accountId.isEmpty()) {
        return {};
    }

    QSqlQuery* query = executeQueryWithResult(
        "SELECT value FROM app_config WHERE key = ?",
        QString("api_key_%1").arg(accountId)
    );

    if (!query) {
        return {};
    }

    QString result;
    if (query->next()) {
        QString encrypted = query->value(0).toString();
        QByteArray data = QByteArray::fromBase64(encrypted.toUtf8());
        result = decryptApiKey(data);
    }
    delete query;

    return result;
}

bool DatabaseAccountRepository::removeApiKey(const QString& accountId) {
    if (!isOpen() || accountId.isEmpty()) {
        return false;
    }

    bool success = executeQuery(
        "DELETE FROM app_config WHERE key = ?",
        QString("api_key_%1").arg(accountId)
    );

    return success;
}

Account DatabaseAccountRepository::queryToAccount(QSqlQuery& query) const {
    Account account;
    account.id = query.value("id").toString();
    account.name = query.value("name").toString();
    account.email = query.value("email").toString();
    account.description = query.value("description").toString();
    account.isActive = query.value("is_active").toInt() == 1;
    account.createdAt = QDateTime::fromSecsSinceEpoch(query.value("created_at").toLongLong());
    account.lastSyncTime = QDateTime::fromSecsSinceEpoch(query.value("last_sync_time").toLongLong());
    return account;
}

QByteArray DatabaseAccountRepository::encryptApiKey(const QString& apiKey) {
    // TODO: 使用系统密钥链或更安全的加密
    // 这里使用简单的 XOR 加密作为示例
    QByteArray data = apiKey.toUtf8();
    QByteArray key = "AIBalanceManagerSecret";
    for (int i = 0; i < data.size(); ++i) {
        data[i] = data[i] ^ key[i % key.size()];
    }
    return data;
}

QString DatabaseAccountRepository::decryptApiKey(const QByteArray& encrypted) const {
    QByteArray data = encrypted;
    QByteArray key = "AIBalanceManagerSecret";
    for (int i = 0; i < data.size(); ++i) {
        data[i] = data[i] ^ key[i % key.size()];
    }
    return QString::fromUtf8(data);
}
