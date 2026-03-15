#include "AccountManager.h"
#include <QUuid>
#include <QDateTime>

AccountManager::AccountManager(QObject *parent)
    : QObject(parent) {
}

bool AccountManager::addAccount(const QString &name, const QString &email, const QString &apiKey) {
    if (name.isEmpty() || apiKey.isEmpty()) {
        return false;
    }

    AccountInfo account;
    account.id = QUuid::createUuid().toString(QUuid::WithoutBraces);
    account.name = name;
    account.email = email;
    account.apiKey = apiKey;
    account.isActive = true;
    account.createdAt = QDateTime::currentSecsSinceEpoch();

    m_accounts.append(account);

    // 如果是第一个账户，自动设为活动账户
    if (m_accounts.size() == 1) {
        setActiveAccount(account.id);
    }

    emit accountAdded(account);
    return true;
}

bool AccountManager::removeAccount(const QString &accountId) {
    auto it = std::find_if(m_accounts.begin(), m_accounts.end(),
                          [&accountId](const AccountInfo &acc) {
                              return acc.id == accountId;
                          });

    if (it != m_accounts.end()) {
        m_accounts.erase(it);
        emit accountRemoved(accountId);

        // 如果删除的是活动账户，切换到另一个
        if (m_activeAccountId == accountId && !m_accounts.isEmpty()) {
            setActiveAccount(m_accounts.first().id);
        }

        return true;
    }

    return false;
}

QVector<AccountInfo> AccountManager::getAccounts() const {
    return m_accounts;
}

AccountInfo AccountManager::getActiveAccount() const {
    for (const auto &account : m_accounts) {
        if (account.id == m_activeAccountId) {
            return account;
        }
    }
    return AccountInfo{};
}

bool AccountManager::setActiveAccount(const QString &accountId) {
    for (auto &account : m_accounts) {
        if (account.id == accountId) {
            m_activeAccountId = accountId;
            emit activeAccountChanged(account);
            return true;
        }
    }
    return false;
}
