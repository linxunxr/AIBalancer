#ifndef ACCOUNT_H
#define ACCOUNT_H

#include <QString>
#include <QDateTime>
#include <QUuid>

/**
 * @brief 账户数据模型
 *
 * 纯数据结构，不包含业务逻辑
 */
struct Account {
    QString id;                      // 账户唯一标识
    QString name;                    // 账户显示名称
    QString email;                    // 关联邮箱
    QString description;               // 账户描述
    bool isActive{true};             // 是否激活
    QDateTime createdAt;              // 创建时间
    QDateTime lastSyncTime;           // 最后同步时间

    // 工厂方法：创建新账户
    static Account create(const QString& name, const QString& email = QString()) {
        Account account;
        account.id = QUuid::createUuid().toString(QUuid::WithoutBraces);
        account.name = name;
        account.email = email;
        account.isActive = true;
        account.createdAt = QDateTime::currentDateTime();
        return account;
    }

    // 验证账户数据有效性
    bool isValid() const {
        return !id.isEmpty() && !name.isEmpty();
    }
};

Q_DECLARE_METATYPE(Account)

#endif // ACCOUNT_H
