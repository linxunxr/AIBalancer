#ifndef ACCOUNTVIEWMODEL_H
#define ACCOUNTVIEWMODEL_H

#include <QObject>
#include "../models/Account.h"
#include <memory>

/**
 * @brief 单个账户 ViewModel
 *
 * 职责：
 * - 管理单个账户的状态
 * - 暴露 Q_PROPERTY 供 QML 绑定
 */
class AccountViewModel : public QObject {
    Q_OBJECT

    // Q_PROPERTY for data binding
    Q_PROPERTY(QString id READ id CONSTANT)
    Q_PROPERTY(QString name READ name WRITE setName NOTIFY nameChanged)
    Q_PROPERTY(QString email READ email WRITE setEmail NOTIFY emailChanged)
    Q_PROPERTY(QString description READ description WRITE setDescription NOTIFY descriptionChanged)
    Q_PROPERTY(bool isActive READ isActive WRITE setIsActive NOTIFY isActiveChanged)
    Q_PROPERTY(QDateTime createdAt READ createdAt CONSTANT)
    Q_PROPERTY(QDateTime lastSyncTime READ lastSyncTime NOTIFY lastSyncTimeChanged)

public:
    explicit AccountViewModel(const Account& account, QObject* parent = nullptr);
    explicit AccountViewModel(QObject* parent = nullptr);
    ~AccountViewModel() = default;

    // Property getters
    QString id() const { return m_account.id; }
    QString name() const { return m_account.name; }
    QString email() const { return m_account.email; }
    QString description() const { return m_account.description; }
    bool isActive() const { return m_account.isActive; }
    QDateTime createdAt() const { return m_account.createdAt; }
    QDateTime lastSyncTime() const { return m_account.lastSyncTime; }

    // Property setters
    void setName(const QString& name);
    void setEmail(const QString& email);
    void setDescription(const QString& description);
    void setIsActive(bool isActive);
    void setLastSyncTime(const QDateTime& time);

    // 获取底层 Account 对象
    Account account() const { return m_account; }

    // 更新账户
    Q_INVOKABLE void updateAccount(const Account& account);

    // 验证账户
    Q_INVOKABLE bool isValid() const;

signals:
    void nameChanged();
    void emailChanged();
    void descriptionChanged();
    void isActiveChanged();
    void lastSyncTimeChanged();

    void accountUpdated(const Account& account);

private:
    Account m_account;
};

#endif // ACCOUNTVIEWMODEL_H
