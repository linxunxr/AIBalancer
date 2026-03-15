#include "AccountViewModel.h"

AccountViewModel::AccountViewModel(const Account& account, QObject* parent)
    : QObject(parent)
    , m_account(account) {
}

AccountViewModel::AccountViewModel(QObject* parent)
    : QObject(parent) {
    m_account = Account::create("", "");
}

void AccountViewModel::setName(const QString& name) {
    if (m_account.name != name) {
        m_account.name = name;
        emit nameChanged();
    }
}

void AccountViewModel::setEmail(const QString& email) {
    if (m_account.email != email) {
        m_account.email = email;
        emit emailChanged();
    }
}

void AccountViewModel::setDescription(const QString& description) {
    if (m_account.description != description) {
        m_account.description = description;
        emit descriptionChanged();
    }
}

void AccountViewModel::setIsActive(bool isActive) {
    if (m_account.isActive != isActive) {
        m_account.isActive = isActive;
        emit isActiveChanged();
    }
}

void AccountViewModel::setLastSyncTime(const QDateTime& time) {
    if (m_account.lastSyncTime != time) {
        m_account.lastSyncTime = time;
        emit lastSyncTimeChanged();
    }
}

void AccountViewModel::updateAccount(const Account& account) {
    if (m_account.id != account.id || account.id.isEmpty()) {
        return;
    }

    m_account = account;
    emit nameChanged();
    emit emailChanged();
    emit descriptionChanged();
    emit isActiveChanged();
    emit lastSyncTimeChanged();
    emit accountUpdated(m_account);
}

bool AccountViewModel::isValid() const {
    return m_account.isValid();
}
