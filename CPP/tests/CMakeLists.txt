# ============================================================================
# 单元测试配置
# ============================================================================

# 启用测试
enable_testing()

# 查找测试源文件（如果存在）
file(GLOB_RECURSE TEST_SOURCES
    "${CMAKE_CURRENT_SOURCE_DIR}/**/*.cpp"
)

if(TEST_SOURCES)
    # 创建测试可执行文件
    add_executable(unit_tests ${TEST_SOURCES})

    # 链接 Qt Test 库和主项目库
    target_link_libraries(unit_tests
        PRIVATE
        Qt6::Core
        Qt6::Test
        Qt6::Sql
        Qt6::Concurrent
    )

    # 设置包含目录
    target_include_directories(unit_tests
        PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}
        ${CMAKE_CURRENT_SOURCE_DIR}/../src
        ${CMAKE_CURRENT_SOURCE_DIR}/../src/core
        ${CMAKE_CURRENT_SOURCE_DIR}/../src/core/di
        ${CMAKE_CURRENT_SOURCE_DIR}/../src/viewmodels
        ${CMAKE_CURRENT_SOURCE_DIR}/../src/models
        ${CMAKE_CURRENT_SOURCE_DIR}/../src/repositories
        ${CMAKE_CURRENT_SOURCE_DIR}/../src/repositories/interfaces
        ${CMAKE_CURRENT_SOURCE_DIR}/../src/repositories/impl
    )

    # 自动添加测试
    add_test(NAME UnitTests COMMAND unit_tests)

    message(STATUS "Unit tests configured successfully")
else()
    message(STATUS "No test sources found, skipping unit tests")
endif()
