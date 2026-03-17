# AIBalanceManager 运行指南

## 项目概述

AIBalanceManager 是一个使用 Qt 6/QML 和 C++20 开发的 AI 余额管理应用程序，采用 MVVM 架构。

## 环境要求

### 必需工具

- **CMake**: 3.20 或更高版本
- **C++ 编译器**:
  - Visual Studio 2019/2022 (MSVC)
  - 或 MinGW (GCC 10+)
- **Qt 6**: 6.8.0 或更高版本

### 推荐版本

- Qt 6.10.1 (MSVC 2022 64-bit)
- Visual Studio 2022

---

## 1. 配置项目

### 1.1 使用 MSVC (推荐)

```bash
# 打开 "x64 Native Tools Command Prompt for VS 2022"
cd D:/100work/003Project/003AIBalancer/AIBalancer/CPP

# 创建并进入构建目录
mkdir build
cd build

# 配置 CMake (默认使用 MSVC)
cmake .. -G "Visual Studio 17 2022" -A x64

# 或者指定 Qt 路径
cmake .. -G "Visual Studio 17 2022" -A x64 ^
  -DCMAKE_PREFIX_PATH="D:/200software/262QT/6.10.1/msvc2022_64"
```

### 1.2 使用 MinGW

```bash
# 确保 MinGW 编译器在 PATH 中
cd D:/100work/003Project/003AIBalancer/AIBalancer/CPP

# 创建并进入构建目录
mkdir build-mingw
cd build-mingw

# 配置 CMake
cmake .. -G "MinGW Makefiles" ^
  -DCMAKE_PREFIX_PATH="D:/200software/262QT/6.10.1/mingw_64"
```

### 1.3 常用配置选项

```bash
# Debug 构建
cmake .. -G "Visual Studio 17 2022" -A x64 ^
  -DCMAKE_BUILD_TYPE=Debug

# Release 构建
cmake .. -G "Visual Studio 17 2022" -A x64 ^
  -DCMAKE_BUILD_TYPE=Release

# 指定 Qt 路径
cmake .. -DCMAKE_PREFIX_PATH="你的Qt路径"
```

---

## 2. 构建项目

### 2.1 MSVC 构建

```bash
cd build

# Debug 构建
cmake --build . --config Debug

# Release 构建
cmake --build . --config Release

# 或使用 Visual Studio 打开解决方案
start AIBalanceManager.sln
```

### 2.2 MinGW 构建

```bash
cd build-mingw

# 构建
mingw32-make

# 或
cmake --build .
```

---

## 3. 运行应用程序

### 3.1 直接运行

```bash
cd build/bin
./AIBalanceManager.exe

# Windows
AIBalanceManager.exe
```

### 3.2 从 Visual Studio 运行

1. 打开 `build/AIBalanceManager.sln`
2. 选择 `Debug` 或 `Release` 配置
3. 设置启动项目为 `AIBalanceManager`
4. 按 `F5` 运行

### 3.3 Qt 依赖处理

项目已配置 `windeployqt` 自动复制 Qt DLL，但如需手动处理：

```bash
# 设置 Qt 路径
set QT_PATH=D:/200software/262QT/6.10.1/msvc2022_64

# 复制 Qt DLL
%QT_PATH%/bin/windeployqt.exe build/bin/AIBalanceManager.exe
```

---

## 4. 运行测试

### 4.1 查看测试状态

```bash
cd build

# 列出所有测试
ctest --show-only

# 详细显示测试信息
ctest -N
```

### 4.2 运行所有测试

```bash
cd build

# 运行测试 (MSVC)
ctest --config Debug --verbose

# 或使用构建命令
cmake --build . --target test

# 运行特定测试
ctest --config Debug -R UnitTests -V
```

### 4.3 运行单个测试可执行文件

```bash
cd build/bin

# 直接运行测试
./unit_tests.exe
```

---

## 5. 常见问题

### 5.1 Qt 版本不匹配

**问题**: 检测到 Qt 是 mingw 版本，但编译器是 MSVC

**解决**:
```bash
# 安装并使用 MSVC 版本的 Qt
cmake .. -G "Visual Studio 17 2022" -A x64 ^
  -DCMAKE_PREFIX_PATH="D:/Qt/6.10.1/msvc2022_64"
```

### 5.2 找不到 Qt

**问题**: `Could NOT find Qt6`

**解决**:
```bash
# 方式1: 设置环境变量
set CMAKE_PREFIX_PATH=D:/Qt/6.10.1/msvc2022_64

# 方式2: 通过命令行参数
cmake .. -DCMAKE_PREFIX_PATH="D:/Qt/6.10.1/msvc2022_64"
```

### 5.3 数据库初始化失败

应用程序会在以下位置创建数据库：
- `AppData/Local/AIBalance/AIBalanceManager/balance_manager.db`

确保该目录有写入权限。

### 5.4 API 端点配置

默认 API 端点：`https://api.deepseek.com`

可在代码中修改：
```cpp
networkRepo->setApiEndpoint("你的API端点");
networkRepo->setTimeout(5000); // 超时时间(毫秒)
```

---

## 6. 项目结构

```
CPP/
├── CMakeLists.txt          # 主构建配置
├── src/
│   ├── main.cpp            # 程序入口
│   ├── core/di/            # 依赖注入
│   ├── models/             # 数据模型
│   ├── repositories/       # 数据访问层
│   └── viewmodels/         # MVVM ViewModel
├── qml/
│   ├── main.qml            # 主QML界面
│   ├── components/         # QML组件
│   └── views/              # QML视图
├── resources/
│   └── qml.qrc             # QML资源文件
└── tests/
    ├── CMakeLists.txt      # 测试构建配置
    ├── unit/               # 单元测试
    └── mocks/              # 模拟对象
```

---

## 7. 开发建议

### 7.1 代码风格

- 使用 C++20 特性
- 遵循 Qt 命名约定
- 使用 Qt 智能指针 (`QSharedPointer`, `QScopedPointer`)

### 7.2 调试配置

在 CMakeLists.txt 中可以调整：
```bash
# 详细输出
add_compile_options(/std:c++20 /permissive- /W4 /DEBUG)

# 或设置 CMAKE_BUILD_TYPE=Debug
```

### 7.3 添加新测试

1. 在 `tests/unit/` 下创建测试文件
2. 使用 Qt Test 框架编写测试
3. CMake 会自动发现并添加测试

---

## 快速开始

```bash
# 1. 配置
mkdir build && cd build
cmake .. -G "Visual Studio 17 2022" -A x64

# 2. 构建
cmake --build . --config Debug

# 3. 运行
cd bin
AIBalanceManager.exe
```

---

## 许可证

Copyright © 2025 AIBalance
