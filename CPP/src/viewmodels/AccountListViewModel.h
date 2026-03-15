#ifndef ACCOUNTLISTVIEWMODEL_H
#define ACCOUNTLISTVIEWMODEL_H

#include <QObject>
#include "AccountViewModel.h"
#include <QQmlPropertyMap>
#include <QVariantList>
#include "../models/Account.h"
#include "../repositories/interfaces/IAccountRepository.h"
#include <memory>

/**
 * @brief 账户列表 ViewModel
 *
 * 职责：
 * - 管理账户列表
 * - 提供账户操作（添加、删除、切换）
 * - 暴露 Q_PROPERTY 供 QML 绑定
 */
class AccountListViewModel : public QObject {
    Q_OBJECT

    // Q_PROPERTY for data binding
    Q_PROPERTY(QVariantList accounts READ accounts NOTIFY accountsChanged)
    Q_PROPERTY(int accountCount READ accountCount NOTIFY accountsChanged)
    Q_PROPERTY(QString activeAccountId READ activeAccountId NOTIFY activeAccountIdChanged)
    Q_PROPERTY(bool isLoading READ isLoading NOTIFY isLoadingChanged)
    Q_PROPERTY(QString errorMessage READ errorMessage NOTIFY errorMessageChanged)
    Q_PROPERTY(bool hasError READ hasError NOTIFY errorMessageChanged)

public:
    explicit AccountListViewModel(
        std::shared_ptr<IAccountRepository> accountRepo,
        QObject* parent = nullptr);
    ~AccountListViewModel() = default;

    // Property getters
    QVariantList accounts() const { return m_accounts; }
    int accountCount() const { return m_accountModels.size(); }
    QString activeAccountId() const { return m_activeAccountId; }
    bool isLoading() const { return m_isLoading; }
    QString errorMessage() const { return m_errorMessage; }
    bool hasError() const { return !m_errorMessage.isEmpty(); }

    /**
     * @brief 加载账户列表
     */
    Q_INVOKABLE void loadAccounts();

    /**
     * @brief 添加新账户
     */
    Q_INVOKABLE void addAccount(const QString& name, const QString& email, const QString& apiKey);

    /**
     * @brief 更新账户
     */
    Q_INVOKABLE void updateAccount(const QString& accountId, const QString& name, const QString& email);

    /**
     * @brief 删除账户
     */
    Q_INVOKABLE void removeAccount(const QString& accountId);

    /**
     * @brief 设置活动账户
     */
    Q_INVOKABLE void setActiveAccount(const QString& accountId);

    /**
     * @brief 获取账户 ViewModel
     */
    Q_INVOKABLE AccountViewModel* getAccountViewModel(const QString& accountId) const;

    /**
     * @brief 清除错误消息
     */
    Q_INVOKABLE void clearError();

signals:
    void accountsChanged();
    void activeAccountIdChanged();
    void isLoadingChanged();
    void errorMessageChanged();

    void accountAdded(const QString& accountId);
    void accountRemoved(const QString& accountId);
    void accountUpdated(const QString& accountId);

private slots:
    void onAccountAdded(const Account& account);
    void onAccountRemoved(const QString& accountId);
    void onActiveAccountChanged(const Account& account);

private:
    void setLoading(bool loading);
    void setError(const QString& error);
    void updateAccountsList();
    AccountViewModel* findAccountViewModel(const QString& accountId) const;

    QVector<AccountViewModel*> m_accountModels;
    QVariantList m_accounts;
    QString m_activeAccountId;
    bool m_isLoading{false};
    QString m_errorMessage;

    std::shared_ptr<IAccountRepository> m_accountRepo;
};

#endif // ACCOUNTLISTVIEWMODEL_H
