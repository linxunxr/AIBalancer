#ifndef SERVICELOCATOR_H
#define SERVICELOCATOR_H

#include <typeindex>
#include <unordered_map>
#include <memory>
#include <stdexcept>
#include <functional>

/**
 * @brief 简单的依赖注入容器（Service Locator 模式）
 *
 * 使用示例：
 * @code
 * // 注册服务（单例）
 * ServiceLocator::registerSingleton<IBalanceRepository, NetworkBalanceRepository>();
 *
 * // 获取服务
 * auto balanceRepo = ServiceLocator::get<IBalanceRepository>();
 * @endcode
 */
class ServiceLocator {
public:
    ServiceLocator() = delete;
    ~ServiceLocator() = delete;
    ServiceLocator(const ServiceLocator&) = delete;
    ServiceLocator& operator=(const ServiceLocator&) = delete;

    /**
     * @brief 注册单例服务（自动创建实例）
     * @tparam Interface 服务接口类型
     * @tparam Implementation 实现类型
     */
    template<typename Interface, typename Implementation, typename... Args>
    static void registerSingleton(Args&&... args) {
        auto instance = std::make_shared<Implementation>(std::forward<Args>(args)...);
        s_singletons[typeid(Interface)] = instance;
        s_destructors[typeid(Interface)] = [instance]() mutable { instance.reset(); };
    }

    /**
     * @brief 注册单例服务（使用已创建的实例）
     * @tparam Interface 服务接口类型
     * @param instance 已创建的实例
     */
    template<typename Interface>
    static void registerSingleton(std::shared_ptr<Interface> instance) {
        s_singletons[typeid(Interface)] = instance;
        s_destructors[typeid(Interface)] = [instance]() mutable { instance.reset(); };
    }

    /**
     * @brief 注册工厂函数（延迟创建）
     * @tparam Interface 服务接口类型
     * @param Factory 创建函数
     */
    template<typename Interface>
    static void registerFactory(std::function<std::shared_ptr<Interface>()> factory) {
        s_factories[typeid(Interface)] = [factory]() -> std::shared_ptr<void> {
            return factory();
        };
    }

    /**
     * @brief 获取已注册的服务
     * @tparam Interface 服务接口类型
     * @return 服务实例的指针
     * @throws std::runtime_error 如果服务未注册
     */
    template<typename Interface>
    static Interface* get() {
        // 首先检查单例
        auto it = s_singletons.find(typeid(Interface));
        if (it != s_singletons.end()) {
            return static_cast<Interface*>(it->second.get());
        }

        // 检查工厂
        auto factoryIt = s_factories.find(typeid(Interface));
        if (factoryIt != s_factories.end()) {
            auto instance = factoryIt->second();
            s_singletons[typeid(Interface)] = instance;
            return static_cast<Interface*>(instance.get());
        }

        throw std::runtime_error("Service not registered: " + std::string(typeid(Interface).name()));
    }

    /**
     * @brief 获取共享指针版本
     */
    template<typename Interface>
    static std::shared_ptr<Interface> getShared() {
        auto it = s_singletons.find(typeid(Interface));
        if (it != s_singletons.end()) {
            return std::static_pointer_cast<Interface>(it->second);
        }

        auto factoryIt = s_factories.find(typeid(Interface));
        if (factoryIt != s_factories.end()) {
            auto instance = factoryIt->second();
            s_singletons[typeid(Interface)] = instance;
            return std::static_pointer_cast<Interface>(instance);
        }

        throw std::runtime_error("Service not registered: " + std::string(typeid(Interface).name()));
    }

    /**
     * @brief 检查服务是否已注册
     */
    template<typename Interface>
    static bool isRegistered() {
        return s_singletons.contains(typeid(Interface)) ||
               s_factories.contains(typeid(Interface));
    }

    /**
     * @brief 清除所有注册的服务
     */
    static void clear() {
        for (auto& [_, destructor] : s_destructors) {
            destructor();
        }
        s_singletons.clear();
        s_factories.clear();
        s_destructors.clear();
    }

private:
    static inline std::unordered_map<std::type_index, std::shared_ptr<void>> s_singletons;
    static inline std::unordered_map<std::type_index, std::function<std::shared_ptr<void>()>> s_factories;
    static inline std::unordered_map<std::type_index, std::function<void()>> s_destructors;
};

#endif // SERVICELOCATOR_H
