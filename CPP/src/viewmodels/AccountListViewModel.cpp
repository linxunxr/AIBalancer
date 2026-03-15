#include "AccountListViewModel.h"
#include "../repositories/impl/DatabaseAccountRepository.h"
#include <QVariant>

AccountListViewModel::AccountListViewModel(
    std::shared_ptr<IAccountRepository> accountRepo,
    QObject* parent)
    : QObject(parent)
    , m_accountRepo(std::move(accountRepo)) {

    // 连接账户仓储信号
    auto* dbRepo = dynamic_cast<DatabaseAccountRepository*>(m_accountRepo.get());
    if (dbRepo) {
        connect(dbRepo, &DatabaseAccountRepository::accountAdded,
                this, &AccountListViewModel::onAccountAdded);
        connect(dbRepo, &DatabaseAccountRepository::accountRemoved,
                this, &AccountListViewModel::onAccountRemoved);
        connect(dbRepo, &DatabaseAccountRepository::activeAccountChanged,
                this, &AccountListViewModel::onActiveAccountChanged);
    }
}

void AccountListViewModel::loadAccounts() {
    clearError();
    setLoading(true);

    // 加载所有账户
    QVector<Account> accounts = m_accountRepo->getAllAccounts();

    // 清理旧的 ViewModel
    for (auto* vm : m_accountModels) {
        vm->deleteLater();
    }
    m_accountModels.clear();

    // 创建新的 ViewModel
    for (const auto& account : accounts) {
        auto* accountVM = new AccountViewModel(account, this);
        m_accountModels.append(accountVM);
    }

    // 加载活动账户
    Account activeAccount = m_accountRepo->getActiveAccount();
    if (activeAccount.isValid()) {
        m_activeAccountId = activeAccount.id;
        emit activeAccountIdChanged();
    }

    updateAccountsList();
    setLoading(false);
}

void AccountListViewModel::addAccount(const QString& name, const QString& email, const QString& apiKey) {
    if (name.isEmpty()) {
        setError("账户名称不能为空");
        return;
    }

    Account account = Account::create(name, email);

    if (!m_accountRepo->addAccount(account)) {
        setError("添加账户失败");
        return;
    }

    // 保存 API Key
    if (!apiKey.isEmpty()) {
        m_accountRepo->saveApiKey(account.id, apiKey);
    }

    clearError();
}

void AccountListViewModel::updateAccount(const QString& accountId, const QString& name, const QString& email) {
    auto* vm = findAccountViewModel(accountId);
    if (!vm) {
        setError("账户不存在");
        return;
    }

    Account account = vm->account();
    account.name = name;
    account.email = email;

    if (!m_accountRepo->updateAccount(account)) {
        setError("更新账户失败");
        return;
    }

    clearError();
}

void AccountListViewModel::removeAccount(const QString& accountId) {
    if (accountId.isEmpty()) {
        setError("账户 ID 不能为空");
        return;
    }

    if (!m_accountRepo->removeAccount(accountId)) {
        setError("删除账户失败");
        return;
    }

    clearError();
}

void AccountListViewModel::setActiveAccount(const QString& accountId) {
    if (accountId.isEmpty()) {
        return;
    }

    if (!m_accountRepo->setActiveAccount(accountId)) {
        setError("设置活动账户失败");
        return;
    }

    clearError();
}

AccountViewModel* AccountListViewModel::getAccountViewModel(const QString& accountId) const {
    return findAccountViewModel(accountId);
}

void AccountListViewModel::clearError() {
    setError(QString());
}

void AccountListViewModel::setLoading(bool loading) {
    if (m_isLoading != loading) {
        m_isLoading = loading;
        emit isLoadingChanged();
    }
}

void AccountListViewModel::setError(const QString& error) {
    if (m_errorMessage != error) {
        m_errorMessage = error;
        emit errorMessageChanged();
    }
}

void AccountListViewModel::updateAccountsList() {
    m_accounts.clear();

    for (auto* vm : m_accountModels) {
        QVariantMap accountMap;
        accountMap["id"] = vm->id();
        accountMap["name"] = vm->name();
        accountMap["email"] = vm->email();
        accountMap["isActive"] = vm->isActive();
        accountMap["viewModel"] = QVariant::fromValue(vm);
        m_accounts.append(QVariant(accountMap));
    }

    emit accountsChanged();
}

AccountViewModel* AccountListViewModel::findAccountViewModel(const QString& accountId) const {
    for (auto* vm : m_accountModels) {
        if (vm->id() == accountId) {
            return vm;
        }
    }
    return nullptr;
}

void AccountListViewModel::onAccountAdded(const Account& account) {
    auto* accountVM = new AccountViewModel(account, this);
    m_accountModels.append(accountVM);

    updateAccountsList();
    emit accountAdded(account.id);
}

void AccountListViewModel::onAccountRemoved(const QString& accountId) {
    auto* vm = findAccountViewModel(accountId);
    if (vm) {
        m_accountModels.removeOne(vm);
        vm->deleteLater();
    }

    updateAccountsList();
    emit accountRemoved(accountId);
}

void AccountListViewModel::onActiveAccountChanged(const Account& account) {
    if (m_activeAccountId != account.id) {
        m_activeAccountId = account.id;
        emit activeAccountIdChanged();
    }
}
