#ifndef DATABASEREPOSITORY_H
#define DATABASEREPOSITORY_H

#include <QSqlDatabase>
#include <QSqlQuery>
#include <QSqlError>
#include <QMutex>
#include <QObject>
#include <memory>
#include <optional>

class DatabaseRepository : public QObject {
    Q_OBJECT

public:
    explicit DatabaseRepository(const QString& connectionName = "default", QObject* parent = nullptr);
    virtual ~DatabaseRepository();

    bool initialize(const QString& dbPath);
    void close();
    bool beginTransaction();
    bool commitTransaction();
    bool rollbackTransaction();
    QSqlDatabase database() const;
    bool isOpen() const;

protected:
    virtual bool createTables() = 0;

    template<typename... Args>
    bool executeQuery(const QString& sql, Args&&... args) const {
        QSqlQuery query(database());
        query.prepare(sql);

        (query.addBindValue(std::forward<Args>(args)), ...);

        if (!query.exec()) {
            emitError(query.lastError().text());
            return false;
        }

        return true;
    }

    template<typename... Args>
    QSqlQuery* executeQueryWithResult(const QString& sql, Args&&... args) const {
        QSqlQuery* query = new QSqlQuery(database());
        query->prepare(sql);

        (query->addBindValue(std::forward<Args>(args)), ...);

        if (!query->exec()) {
            emitError(query->lastError().text());
            delete query;
            return nullptr;
        }

        return query;
    }

    void emitError(const QString& message) const;

signals:
    void errorOccurred(const QString& errorMessage);

private:
    QSqlDatabase m_database;
    mutable QMutex m_mutex;
    bool m_initialized{false};
};

#endif
