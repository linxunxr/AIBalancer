#include <QtTest/QtTest>
#include "../../viewmodels/BalanceViewModel.h"
#include "../mocks/MockBalanceRepository.h"
#include <memory>

class BalanceViewModelTest : public QObject {
    Q_OBJECT

private slots:
    void initTestCase() {
        // 每个测试前执行
    }

    void cleanupTestCase() {
        // 每个测试后执行
    }

    void test_initialization() {
        auto mockRepo = std::make_shared<MockBalanceRepository>();
        BalanceViewModel viewModel(mockRepo, nullptr);

        QCOMPARE(viewModel.totalBalance(), 0.0);
        QCOMPARE(viewModel.usedBalance(), 0.0);
        QCOMPARE(viewModel.remainingBalance(), 0.0);
        QCOMPARE(viewModel.usageRate(), 0.0);
        QCOMPARE(viewModel.currency(), QString("USD"));
        QVERIFY(!viewModel.isLoading());
        QVERIFY(!viewModel.hasError());
    }

    void test_refreshSuccess() {
        auto mockRepo = std::make_shared<MockBalanceRepository>();
        BalanceViewModel viewModel(mockRepo, nullptr);

        // 设置 Mock 返回值
        BalanceInfo mockBalance;
        mockBalance.totalBalance = 100.0;
        mockBalance.usedBalance = 30.0;
        mockBalance.remainingBalance = 70.0;
        mockBalance.currency = "USD";
        mockRepo->setMockBalance(mockBalance);

        // 设置测试用 API Key
        viewModel.refreshWithApiKey("sk-test-key");

        QSignalSpy refreshSpy(&viewModel, &BalanceViewModel::balanceRefreshed);
        QSignalSpy loadingSpy(&viewModel, &BalanceViewModel::isLoadingChanged);

        QVERIFY(refreshSpy.wait(1000));
        QVERIFY(loadingSpy.count() > 0);

        QCOMPARE(viewModel.totalBalance(), 100.0);
        QCOMPARE(viewModel.usedBalance(), 30.0);
        QCOMPARE(viewModel.remainingBalance(), 70.0);
        QCOMPARE(viewModel.usageRate(), 30.0);
        QCOMPARE(viewModel.currency(), QString("USD"));
    }

    void test_refreshWithApiError() {
        auto mockRepo = std::make_shared<MockBalanceRepository>();
        BalanceViewModel viewModel(mockRepo, nullptr);

        // 设置 Mock 错误
        mockRepo->setMockError("Network error");

        viewModel.refreshWithApiKey("sk-test-key");

        QSignalSpy errorSpy(&viewModel, &BalanceViewModel::errorMessageChanged);

        QVERIFY(errorSpy.wait(1000));

        QVERIFY(viewModel.hasError());
        QCOMPARE(viewModel.errorMessage(), QString("Network error"));
    }

    void test_clearError() {
        auto mockRepo = std::make_shared<MockBalanceRepository>();
        BalanceViewModel viewModel(mockRepo, nullptr);

        // 设置错误状态
        mockRepo->setMockError("Test error");
        viewModel.refreshWithApiKey("sk-test-key");

        QSignalSpy errorSpy(&viewModel, &BalanceViewModel::errorMessageChanged);
        QVERIFY(errorSpy.wait(1000));

        QVERIFY(viewModel.hasError());

        // 清除错误
        viewModel.clearError();

        QVERIFY(!viewModel.hasError());
        QCOMPARE(viewModel.errorMessage(), QString(""));
    }

    void test_multipleRefresh() {
        auto mockRepo = std::make_shared<MockBalanceRepository>();
        BalanceViewModel viewModel(mockRepo, nullptr);

        BalanceInfo mockBalance1{100.0, 30.0, 70.0, "USD"};
        BalanceInfo mockBalance2{150.0, 50.0, 100.0, "USD"};

        // 第一次刷新
        mockRepo->setMockBalance(mockBalance1);
        viewModel.refreshWithApiKey("sk-test-key");
        QSignalSpy spy1(&viewModel, &BalanceViewModel::balanceRefreshed);
        QVERIFY(spy1.wait(1000));
        QCOMPARE(viewModel.totalBalance(), 100.0);

        // 第二次刷新
        mockRepo->setMockBalance(mockBalance2);
        viewModel.refreshWithApiKey("sk-test-key");
        QSignalSpy spy2(&viewModel, &BalanceViewModel::balanceRefreshed);
        QVERIFY(spy2.wait(1000));
        QCOMPARE(viewModel.totalBalance(), 150.0);
    }
};

QTEST_MAIN(BalanceViewModelTest)
#include "BalanceViewModelTest.moc"
