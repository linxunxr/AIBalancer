#ifndef DATASTORAGE_H
#define DATASTORAGE_H

#include <QObject>
#include <QSqlDatabase>
#include <QString>
#include <QVector>
#include "core/BalanceFetcher.h"

class DataStorage : public QObject {
    Q_OBJECT

public:
    explicit DataStorage(QObject *parent = nullptr);
    ~DataStorage();

    // 初始化数据库
    bool initialize(const QString &databasePath = QString());

    // 保存余额历史记录
    bool saveBalanceRecord(const QString &accountId, const BalanceInfo &info);

    // 获取余额历史记录
    QVector<BalanceInfo> getBalanceHistory(const QString &accountId,
                                          const QDateTime &since = QDateTime(),
                                          int limit = 100) const;

    // 清理旧数据
    bool cleanupOldData(int daysToKeep = 90);

signals:
    void databaseInitialized(bool success);
    void recordSaved(bool success);
    void errorOccurred(const QString &errorMessage);

private:
    QSqlDatabase m_database;
    bool createTables();
};

#endif // DATASTORAGE_H
