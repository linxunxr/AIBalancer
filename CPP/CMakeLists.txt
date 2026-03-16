cmake_minimum_required(VERSION 3.20)
project(AIBalanceManager VERSION 1.0.0 LANGUAGES CXX)

# ============================================================================
# C++20 标准配置
# ============================================================================
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Qt 自动处理
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_AUTOUIC ON)

# ============================================================================
# 查找 Qt 6 组件
# ============================================================================
# 常见 Qt 安装路径（用于提示）
set(POSSIBLE_QT_PATHS
    "D:/200software/262QT/6.10.1/mingw_64"
    "C:/Qt/6.10.0/mingw_64"
    "D:/Qt/6.10.0/mingw_64"
    "C:/Qt/6.8.0/msvc2019_64"
    "C:/Qt/6.7.0/msvc2019_64"
    "C:/Qt/6.6.0/msvc2019_64"
    "C:/Qt/6.5.3/msvc2019_64"
    "C:/Qt/6.5.0/msvc2019_64"
    "D:/Qt/6.8.0/msvc2019_64"
    "D:/Qt/6.7.0/msvc2019_64"
    "D:/Qt/6.6.0/msvc2019_64"
    "D:/Qt/6.5.3/msvc2019_64"
    "D:/Qt/6.5.0/msvc2019_64"
)

# 如果 CMAKE_PREFIX_PATH 未设置，尝试自动检测
if(NOT DEFINED CMAKE_PREFIX_PATH)
    foreach(path ${POSSIBLE_QT_PATHS})
        if(EXISTS "${path}")
            set(CMAKE_PREFIX_PATH ${path} CACHE PATH "Qt installation path" FORCE)
            message(STATUS "自动检测到 Qt 安装路径: ${path}")
            break()
        endif()
    endforeach()
endif()

# 查找 Qt 6
find_package(Qt6 REQUIRED COMPONENTS
    Core
    Quick
    Qml
    Network
    Sql
    Widgets
    Test
    Concurrent
)

# 检查是否找到 Qt
if(NOT Qt6_FOUND)
    message(FATAL_ERROR "未找到 Qt 6！请设置 CMAKE_PREFIX_PATH 环境变量或通过 -DCMAKE_PREFIX_PATH=<Qt路径> 指定")
endif()

# ============================================================================
# C++20 编译器特定选项
# ============================================================================
if(MSVC)
    # MSVC 2019+ 支持 C++20
    add_compile_options(/std:c++20 /permissive- /W4)
    # 禁用特定警告（可选）
    add_compile_options(/wd4100)  # 未引用的形参
elseif(CMAKE_CXX_COMPILER_ID MATCHES "GNU")
    # GCC 10+ 支持 C++20
    add_compile_options(-std=c++20 -Wall -Wextra)
elseif(CMAKE_CXX_COMPILER_ID MATCHES "Clang")
    # Clang 12+ 支持 C++20
    add_compile_options(-std=c++20 -Wall -Wextra)
endif()

# ============================================================================
# 项目目录结构
# ============================================================================
set(SRC_DIR ${CMAKE_CURRENT_SOURCE_DIR}/src)
set(QML_DIR ${CMAKE_CURRENT_SOURCE_DIR}/qml)
set(RESOURCES_DIR ${CMAKE_CURRENT_SOURCE_DIR}/resources)

# ============================================================================
# 源文件
# ============================================================================
# 使用精确的文件列表避免 Windows Glob 的 .h.h 重复问题
set(SOURCES
    ${SRC_DIR}/main.cpp
    ${SRC_DIR}/viewmodels/BalanceViewModel.cpp
    ${SRC_DIR}/viewmodels/DashboardViewModel.cpp
    ${SRC_DIR}/viewmodels/AccountViewModel.cpp
    ${SRC_DIR}/viewmodels/AccountListViewModel.cpp
    ${SRC_DIR}/viewmodels/AlertViewModel.cpp
    ${SRC_DIR}/repositories/impl/DatabaseRepository.cpp
    ${SRC_DIR}/repositories/impl/DatabaseBalanceRepository.cpp
    ${SRC_DIR}/repositories/impl/DatabaseAccountRepository.cpp
    ${SRC_DIR}/repositories/impl/DatabaseAlertRepository.cpp
    ${SRC_DIR}/repositories/impl/NetworkBalanceRepository.cpp
)

set(HEADERS
    ${SRC_DIR}/core/di/ServiceLocator.h
    ${SRC_DIR}/viewmodels/BalanceViewModel.h
    ${SRC_DIR}/viewmodels/DashboardViewModel.h
    ${SRC_DIR}/viewmodels/AccountViewModel.h
    ${SRC_DIR}/viewmodels/AccountListViewModel.h
    ${SRC_DIR}/viewmodels/AlertViewModel.h
    ${SRC_DIR}/models/Account.h
    ${SRC_DIR}/models/BalanceInfo.h
    ${SRC_DIR}/models/AlertRule.h
    ${SRC_DIR}/repositories/interfaces/IBalanceRepository.h
    ${SRC_DIR}/repositories/interfaces/IAccountRepository.h
    ${SRC_DIR}/repositories/interfaces/IAlertRepository.h
    ${SRC_DIR}/repositories/impl/DatabaseRepository.h
    ${SRC_DIR}/repositories/impl/DatabaseBalanceRepository.h
    ${SRC_DIR}/repositories/impl/DatabaseAccountRepository.h
    ${SRC_DIR}/repositories/impl/DatabaseAlertRepository.h
    ${SRC_DIR}/repositories/impl/NetworkBalanceRepository.h
)

# QML 资源文件
set(QML_RESOURCES
    ${RESOURCES_DIR}/qml.qrc
)

# ============================================================================
# 创建可执行文件
# ============================================================================
add_executable(${PROJECT_NAME}
    ${SOURCES}
    ${HEADERS}
    ${QML_RESOURCES}
)

# ============================================================================
# 链接 Qt 库
# ============================================================================
target_link_libraries(${PROJECT_NAME} PRIVATE
    Qt6::Core
    Qt6::Quick
    Qt6::Qml
    Qt6::Network
    Qt6::Sql
    Qt6::Widgets
    Qt6::Test
    Qt6::Concurrent
)

# ============================================================================
# 设置包含目录
# ============================================================================
target_include_directories(${PROJECT_NAME} PRIVATE
    ${SRC_DIR}
    ${SRC_DIR}/core
    ${SRC_DIR}/core/di
    ${SRC_DIR}/viewmodels
    ${SRC_DIR}/models
    ${SRC_DIR}/repositories
    ${SRC_DIR}/repositories/interfaces
    ${SRC_DIR}/repositories/impl
)

# ============================================================================
# 设置输出目录
# ============================================================================
set_target_properties(${PROJECT_NAME} PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin
    MACOSX_BUNDLE TRUE
)

# ============================================================================
# Windows 特定配置
# ============================================================================
if(WIN32)
    set_target_properties(${PROJECT_NAME} PROPERTIES
        WIN32_EXECUTABLE TRUE
    )

    # 使用 windeployqt 复制 Qt DLL 和 QML 模块
    find_program(QT_DEPLOY_TOOL windeployqt HINTS "${Qt6_DIR}/../../../bin")
    if(QT_DEPLOY_TOOL)
        add_custom_command(TARGET ${PROJECT_NAME} POST_BUILD
            COMMAND ${QT_DEPLOY_TOOL} --qmldir "${CMAKE_CURRENT_SOURCE_DIR}/qml" "$<TARGET_FILE:${PROJECT_NAME}>"
            COMMENT "Deploying Qt libraries and QML modules"
        )
    endif()
endif()

# ============================================================================
# macOS Bundle 设置
# ============================================================================
if(APPLE)
    set_target_properties(${PROJECT_NAME} PROPERTIES
        MACOSX_BUNDLE_GUI_IDENTIFIER "com.aibalance.manager"
        MACOSX_BUNDLE_BUNDLE_VERSION ${PROJECT_VERSION}
        MACOSX_BUNDLE_SHORT_VERSION_STRING ${PROJECT_VERSION_MAJOR}.${PROJECT_VERSION_MINOR}
        MACOSX_BUNDLE_ICON_FILE "AppIcon"
    )
endif()

# ============================================================================
# Linux 特定配置
# ============================================================================
if(UNIX AND NOT APPLE)
    # 安装 .desktop 文件和图标（待实现）
endif()

# ============================================================================
# 单元测试配置
# ============================================================================
# enable_testing()
# add_subdirectory(tests)

# ============================================================================
# 安装规则
# ============================================================================
install(TARGETS ${PROJECT_NAME}
    RUNTIME DESTINATION bin
    BUNDLE DESTINATION .
)

# ============================================================================
# 调试配置
# ============================================================================
message(STATUS "========================================")
message(STATUS "Project: ${PROJECT_NAME}")
message(STATUS "Version: ${PROJECT_VERSION}")
message(STATUS "C++ Standard: ${CMAKE_CXX_STANDARD}")
message(STATUS "Build Type: ${CMAKE_BUILD_TYPE}")
message(STATUS "Qt6 Version: ${Qt6_VERSION}")
message(STATUS "Qt6 Prefix: ${Qt6_DIR}")
message(STATUS "Output Directory: ${CMAKE_BINARY_DIR}/bin")
message(STATUS "========================================")
