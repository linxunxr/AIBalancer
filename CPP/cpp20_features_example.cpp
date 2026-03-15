// ============================================================================
// C++20 特性示例 - AI余额管家项目
// ============================================================================
// 本文件展示 C++20 核心特性在本项目中的应用场景
// ============================================================================

#include <iostream>
#include <format>
#include <ranges>
#include <concepts>
#include <coroutine>
#include <algorithm>
#include <vector>
#include <string>
#include <chrono>
#include <compare>

using namespace std::chrono_literals;

// ============================================================================
// 1. Concepts - 类型约束
// ============================================================================
// 应用场景：验证 API Key、账户名等字符串类型

template<typename T>
concept StringLike = requires(T t) {
    { t.size() } -> std::convertible_to<std::size_t>;
    { t.length() } -> std::convertible_to<std::size_t>;
    { t.data() } -> std::convertible_to<const char*>;
};

template<typename T>
concept Numeric = std::integral<T> || std::floating_point<T>;

// API Key 验证函数
template<StringLikeLike T>
bool validateApiKey(const T& apiKey) {
    // DeepSeek API Key 通常以 sk- 开头，长度约 48-50 字符
    std::string_view key(apiKey.data(), apiKey.size());

    static_assert(sizeof(key) > 0, "API Key 不能为空");

    if (key.size() < 20 || key.size() > 100) {
        return false;
    }

    // 检查是否以 sk- 开头
    return key.substr(0, 3) == "sk-";
}

// ============================================================================
// 2. std::format - 字符串格式化
// ============================================================================
// 应用场景：格式化余额显示、日志消息、通知内容

struct BalanceInfo {
    double totalBalance;
    double usedBalance;
    double remainingBalance;
    std::string currency = "USD";
    std::chrono::system_clock::time_point lastUpdated;
};

std::string formatBalanceDisplay(const BalanceInfo& info) {
    // C++20 的 std::format 提供更简洁的格式化
    return std::format(
        "余额信息:\n"
        "  总余额: {:.2f} {}\n"
        "  已使用: {:.2f} {}\n"
        "  剩余额度: {:.2f} {}",
        info.totalBalance, info.currency,
        info.usedBalance, info.currency,
        info.remainingBalance, info.currency
    );
}

// ============================================================================
// 3. 三路比较运算符 (Spaceship Operator)
// ============================================================================
// 应用场景：余额比较、时间排序、告警阈值判断

struct AccountRecord {
    std::string accountName;
    double balance;
    std::chrono::system_clock::time_point timestamp;

    // 自动生成所有比较运算符（==, !=, <, <=, >, >=）
    auto operator<=>(const AccountRecord&) const = default;
};

// ============================================================================
// 4. Ranges - 范围视图
// ============================================================================
// 应用场景：过滤低余额账户、排序历史记录、数据聚合

struct AlertThreshold {
    double threshold;
    std::string message;
};

std::vector<std::string> checkLowBalanceAlerts(
    const std::vector<AccountRecord>& accounts,
    double warningThreshold
) {
    // 使用 Ranges 简化数据处理
    auto lowBalanceAccounts = accounts
        | std::views::filter([warningThreshold](const auto& acc) {
            return acc.balance < warningThreshold;
        })
        | std::views::transform([](const auto& acc) {
            return std::format("账户 {} 余额过低: {:.2f}", acc.accountName, acc.balance);
        });

    return std::vector<std::string>(lowBalanceAccounts.begin(), lowBalanceAccounts.end());
}

// 计算平均余额
double calculateAverageBalance(const std::vector<AccountRecord>& accounts) {
    if (accounts.empty()) return 0.0;

    auto balanceSum = accounts
        | std::views::transform(&AccountRecord::balance)
        | std::views::common;  // 转换为普通范围以便使用 std::accumulate

    return std::accumulate(balanceSum.begin(), balanceSum.end(), 0.0) / accounts.size();
}

// ============================================================================
// 5. std::span - 数组视图
// ============================================================================
// 应用场景：安全地传递余额历史数据数组

void processBalanceHistory(std::span<const double> history) {
    // span 提供数组大小和访问，无复制开销
    std::cout << "处理 " << history.size() << " 条历史记录\n";

    if (!history.empty()) {
        double first = history.front();
        double last = history.back();
        double trend = last - first;

        std::cout << std::format("趋势: {:+.2f}\n", trend);
    }
}

// ============================================================================
// 6. constexpr 增强和 std::is_constant_evaluated
// ============================================================================
// 应用场景：编译时计算配置常量

constexpr int API_TIMEOUT_MS = 5000;
constexpr int MAX_ACCOUNT_COUNT = 100;
constexpr double DEFAULT_WARNING_THRESHOLD = 10.0;

constexpr int getConfiguredTimeout() {
    if (std::is_constant_evaluated()) {
        // 编译时返回默认值
        return API_TIMEOUT_MS;
    } else {
        // 运行时可以从配置文件读取
        return API_TIMEOUT_MS;
    }
}

// ============================================================================
// 7. std::array 的 constexpr 增强
// ============================================================================
// 应用场景：预定义的 API 端点列表

constexpr std::array<const char*, 3> API_ENDPOINTS = {
    "https://api.deepseek.com",
    "https://api.deepseek.com/v1",
    "https://api.deepseek.com/billing"
};

// ============================================================================
// 8. 协程 (Coroutines) - 与 Qt 结合
// ============================================================================
// 应用场景：异步 API 请求、网络超时处理

// 简化的协程任务类型（实际项目中需要更完善的实现）
template<typename T>
struct Task {
    struct promise_type {
        T value;
        Task get_return_object() { return {std::coroutine_handle<promise_type>::from_promise(*this)}; }
        std::suspend_never initial_suspend() { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }
        void return_value(T v) { value = v; }
        void unhandled_exception() { std::terminate(); }
    };

    std::coroutine_handle<promise_type> handle;
    T get() { return handle.promise().value; }
};

// 模拟异步余额查询（需要实际 Qt 网络集成）
Task<BalanceInfo> fetchBalanceAsync(std::string_view apiKey) {
    // 在实际实现中，这里会使用 Qt 的 QNetworkReply 和协程 awaiter
    co_return BalanceInfo{
        .totalBalance = 156.78,
        .usedBalance = 43.22,
        .remainingBalance = 113.56,
        .currency = "USD",
        .lastUpdated = std::chrono::system_clock::now()
    };
}

// ============================================================================
// 9. std::jthread - 自动 Join 的线程
// ============================================================================
// 应用场景：后台线程定期刷新余额

void startBalanceRefreshThread() {
    std::jthread refreshThread([](std::stop_token stop) {
        while (!stop.stop_requested()) {
            std::cout << "刷新余额数据...\n";
            std::this_thread::sleep_for(30min);
        }
    });

    // refreshThread 析构时会自动 join，无需手动管理
}

// ============================================================================
// 10. std::string_view 相关改进
// ============================================================================
// 应用场景：高效处理 API 返回的 JSON 数据

bool containsApiKey(std::string_view response) {
    // 使用 starts_with / ends_with
    return response.contains("\"api_key\"") ||
           response.contains("\"apiKey\"");
}

// ============================================================================
// 主函数 - 演示所有特性
// ============================================================================
int main() {
    std::cout << "=== C++20 特性演示 ===\n\n";

    // 1. Concepts 演示
    std::cout << "1. Concepts 验证 API Key:\n";
    std::cout << "   \"sk-test123456789\" -> "
              << (validateApiKey("sk-test123456789") ? "有效" : "无效") << "\n";
    std::cout << "   \"invalid-key\" -> "
              << (validateApiKey("invalid-key") ? "有效" : "无效") << "\n\n";

    // 2. std::format �演示
    std::cout << "2. std::format 格式化余额显示:\n";
    BalanceInfo info{
        .totalBalance = 156.78,
        .usedBalance = 43.22,
        .remainingBalance = 113.56,
        .currency = "USD",
        .lastUpdated = std::chrono::system_clock::now()
    };
    std::cout << formatBalanceDisplay(info) << "\n\n";

    // 3. 三路比较演示
    std::cout << "3. 三路比较运算符:\n";
    AccountRecord a{"账户A", 100.0, std::chrono::system_clock::now()};
    AccountRecord b{"账户B", 150.0, std::chrono::system_clock::now()};
    std::cout << "   账户A vs 账户B: "
              << (a <=> b < 0 ? "账户A < 账户B" : "账户A >= 账户B") << "\n\n";

    // 4. Ranges 演示
    std::cout << "4. Ranges 过滤低余额账户:\n";
    std::vector<AccountRecord> accounts{
        {"账户1", 150.0, std::chrono::system_clock::now()},
        {"账户2", 5.50, std::chrono::system_clock::now()},
        {"账户3", 8.75, std::chrono::system_clock::now()},
        {"账户4", 200.0, std::chrono::system_clock::now()}
    };
    auto alerts = checkLowBalanceAlerts(accounts, 10.0);
    for (const auto& alert : alerts) {
        std::cout << "   " << alert << "\n";
    }
    std::cout << "   平均余额: " << calculateAverageBalance(accounts) << "\n\n";

    // 5. std::span 演示
    std::cout << "5. std::span 处理历史数据:\n";
    std::vector<double> history = {150.0, 145.5, 140.2, 135.8, 130.0};
    processBalanceHistory(history);
    std::cout << "\n";

    // 6. constexpr 演示
    std::cout << "6. constexpr 配置:\n";
    std::cout << "   API 超时: " << getConfiguredTimeout() << "ms\n";
    std::cout << "   默认告警阈值: " << DEFAULT_WARNING_THRESHOLD << "\n\n";

    // 7. API 端点列表
    std::cout << "7. constexpr API 端点:\n";
    for (const auto& endpoint : API_ENDPOINTS) {
        std::cout << "   - " << endpoint << "\n";
    }
    std::cout << "\n";

    // 8. 协程演示
    std::cout << "8. 协程异步查询:\n";
    auto task = fetchBalanceAsync("sk-test");
    std::cout << formatBalanceDisplay(task.get()) << "\n";

    // 9. string_view 演示
    std::cout << "9. std::string_view 查找:\n";
    std::string response = R"({"api_key": "sk-test", "balance": 100.0})";
    std::cout << "   响应包含 API Key: "
              << (containsApiKey(response) ? "是" : "否") << "\n";

    std::cout << "\n=== 演示完成 ===\n";
    return 0;
}
