#ifndef IACCOUNTREPOSITORY_H
#define IACCOUNTREPOSITORY_H

#include "../models/Account.h"
#include <QVector>
#include <QString>

/**
 * @brief 账户数据仓储接口
 */
class IAccountRepository {
public:
    virtual ~IAccountRepository() = default;

    /**
     * @brief 添加新账户
     * @param account 账户信息
     * @return 添加是否成功
     */
    virtual bool addAccount(const Account& account) = 0;

    /**
     * @brief 更新账户信息
     * @param account 账户信息
     * @return 更新是否成功
     */
    virtual bool updateAccount(const Account& account) = 0;

    /**
     * @brief 删除账户
     * @param accountId 账户 ID
     * @return 删除是否成功
     */
    virtual bool removeAccount(const QString& accountId) = 0;

    /**
     * @brief 根据 ID 获取账户
     * @param accountId 账户 ID
     * @return 账户信息（不存在时返回无效账户）
     */
    virtual Account getAccount(const QString& accountId) const = 0;

    /**
     * @brief 获取所有账户
     * @return 账户列表
     */
    virtual QVector<Account> getAllAccounts() const = 0;

    /**
     * @brief 获取所有激活的账户
     * @return 激活账户列表
     */
    virtual QVector<Account> getActiveAccounts() const = 0;

    /**
     * @brief 设置活动账户
     * @param accountId 账户 ID
     * @return 设置是否成功
     */
    virtual bool setActiveAccount(const QString& accountId) = 0;

    /**
     * @brief 获取当前活动账户
     * @return 活动账户信息
     */
    virtual Account getActiveAccount() const = 0;

    /**
     * @brief 保存 API 密钥（加密存储）
     * @param accountId 账户 ID
     * @param apiKey API 密钥
     * @return 保存是否成功
     */
    virtual bool saveApiKey(const QString& accountId, const QString& apiKey) = 0;

    /**
     * @brief 获取 API 密钥（解密）
     * @param accountId 账户 ID
     * @return API 密钥
     */
    virtual QString getApiKey(const QString& accountId) const = 0;

    /**
     * @brief 删除 API 密钥
     * @param accountId 账户 ID
     * @return 删除是否成功
     */
    virtual bool removeApiKey(const QString& accountId) = 0;
};

#endif // IACCOUNTREPOSITORY_H
