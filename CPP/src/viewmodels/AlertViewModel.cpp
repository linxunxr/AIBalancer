#include "AlertViewModel.h"
#include <QVariant>

AlertViewModel::AlertViewModel(
    std::shared_ptr<IAlertRepository> alertRepo,
    QObject* parent)
    : QObject(parent)
    , m_alertRepo(std::move(alertRepo)) {

}

void AlertViewModel::setAccountId(const QString& accountId) {
    if (m_accountId != accountId) {
        m_accountId = accountId;
        if (!accountId.isEmpty()) {
            loadAlertRules();
        }
    }
}

void AlertViewModel::loadAlertRules() {
    if (m_accountId.isEmpty()) {
        setError("请先选择账户");
        return;
    }

    setLoading(true);

    QVector<AlertRule> rules = m_alertRepo->getAlertRules(m_accountId);

    m_alertRules = rules;
    updateAlertRulesList();
    setLoading(false);
}

void AlertViewModel::addAlertRule(int alertType, double threshold, int notificationMethod) {
    if (m_accountId.isEmpty()) {
        setError("请先选择账户");
        return;
    }

    AlertRule rule = AlertRule::create(m_accountId, static_cast<AlertType>(alertType), threshold);
    rule.method = static_cast<NotificationMethod>(notificationMethod);

    if (!m_alertRepo->addAlertRule(rule)) {
        setError("添加告警规则失败");
        return;
    }

    m_alertRules.append(rule);
    updateAlertRulesList();
    emit ruleAdded(rule.id);
    clearError();
}

void AlertViewModel::removeAlertRule(const QString& ruleId) {
    if (ruleId.isEmpty()) {
        setError("规则 ID 不能为空");
        return;
    }

    if (!m_alertRepo->removeAlertRule(ruleId)) {
        setError("删除告警规则失败");
        return;
    }

    for (int i = 0; i < m_alertRules.size(); ++i) {
        if (m_alertRules[i].id == ruleId) {
            m_alertRules.removeAt(i);
            break;
        }
    }

    updateAlertRulesList();
    emit ruleRemoved(ruleId);
    clearError();
}

void AlertViewModel::setAlertEnabled(const QString& ruleId, bool enabled) {
    if (ruleId.isEmpty()) {
        return;
    }

    if (!m_alertRepo->setAlertEnabled(ruleId, enabled)) {
        setError("更新告警规则状态失败");
        return;
    }

    for (auto& rule : m_alertRules) {
        if (rule.id == ruleId) {
            rule.isEnabled = enabled;
            break;
        }
    }

    updateAlertRulesList();
    clearError();
}

void AlertViewModel::clearError() {
    setError(QString());
}

void AlertViewModel::setLoading(bool loading) {
    if (m_isLoading != loading) {
        m_isLoading = loading;
        emit isLoadingChanged();
    }
}

void AlertViewModel::setError(const QString& error) {
    if (m_errorMessage != error) {
        m_errorMessage = error;
        emit errorMessageChanged();
    }
}

QVariantList AlertViewModel::alertRules() const {
    QVariantList list;
    for (int i = 0; i < m_alertRules.size(); ++i) {
        const auto& rule = m_alertRules[i];
        QVariantMap ruleMap;
        ruleMap["id"] = rule.id;
        ruleMap["type"] = static_cast<int>(rule.alertType);
        ruleMap["typeName"] = rule.typeName();
        ruleMap["threshold"] = rule.threshold;
        ruleMap["method"] = static_cast<int>(rule.method);
        ruleMap["isEnabled"] = rule.isEnabled;
        ruleMap["customMessage"] = rule.customMessage;
        ruleMap["webhookUrl"] = rule.webhookUrl;
        ruleMap["triggerCount"] = rule.triggerCount;
        list.append(ruleMap);
    }
    return list;
}

void AlertViewModel::updateAlertRulesList() {
    emit alertRulesChanged();
}

void AlertViewModel::onAlertTriggered(const QString& accountId, double balance, double threshold) {
    Q_UNUSED(accountId);
    Q_UNUSED(balance);
    Q_UNUSED(threshold);
    // TODO: 处理告警触发
}
