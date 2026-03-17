#ifndef LOGGING_H
#define LOGGING_H

#include <QtGlobal>

/**
 * @brief 初始化全局日志系统
 *
 * - 将 Qt 日志重定向到应用数据目录下的 logs/aibalance.log
 * - 日志格式：时间 | 级别 | 分类 | 消息
 */
void initializeLogging();

#endif // LOGGING_H

