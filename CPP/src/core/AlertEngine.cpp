#include "AlertEngine.h"
#include <QUuid>

AlertEngine::AlertEngine(QObject *parent)
    : QObject(parent) {
}

bool AlertEngine::addAlertRule(const QString &accountId, double threshold, const QString &method) {
    if (accountId.isEmpty() || threshold < 0) {
        return false;
    }

    AlertRule rule;
    rule.id = QUuid::createUuid().toString(QUuid::WithoutBraces);
    rule.accountId = accountId;
    rule.threshold = threshold;
    rule.notificationMethod = method;
    rule.isEnabled = true;

    m_alertRules.append(rule);
    emit alertRuleAdded(rule);

    return true;
}

bool AlertEngine::removeAlertRule(const QString &ruleId) {
    auto it = std::find_if(m_alertRules.begin(), m_alertRules.end(),
                          [&ruleId](const AlertRule &rule) {
                              return rule.id == ruleId;
                          });

    if (it != m_alertRules.end()) {
        m_alertRules.erase(it);
        emit alertRuleRemoved(ruleId);
        return true;
    }

    return false;
}

void AlertEngine::checkBalance(const QString &accountId, double balance) {
    for (const auto &rule : m_alertRules) {
        if (rule.isEnabled && rule.accountId == accountId) {
            if (balance <= rule.threshold) {
                emit alertTriggered(accountId, balance, rule.threshold);
            }
        }
    }
}

QVector<AlertRule> AlertEngine::getAlertRules() const {
    return m_alertRules;
}
