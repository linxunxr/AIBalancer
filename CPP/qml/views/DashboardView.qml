import QtQuick 6.0
import QtQuick.Controls 6.0
import QtQuick.Layouts 6.0
import "../components"

Page {
    id: dashboard
    property var dashboardViewModel
    property var balanceViewModel
    property var accountListViewModel

    padding: 20

    ScrollView {
        anchors.fill: parent
        clip: true

        ColumnLayout {
            width: parent.width
            spacing: 20

            // 标题
            Text {
                text: "仪表盘"
                font.pixelSize: 28
                font.bold: true
                color: "#2c3e50"
            }

            // 余额卡片
            BalanceCard {
                id: balanceCard
                Layout.fillWidth: true
                Layout.preferredHeight: 200

                totalBalance: balanceViewModel ? balanceViewModel.totalBalance : 0
                usedBalance: balanceViewModel ? balanceViewModel.usedBalance : 0
                remainingBalance: balanceViewModel ? balanceViewModel.remainingBalance : 0
                currency: balanceViewModel ? balanceViewModel.currency : "USD"
                lastUpdated: balanceViewModel ? balanceViewModel.lastUpdated : new Date()
                isLoading: balanceViewModel ? balanceViewModel.isLoading : false
                errorMessage: balanceViewModel ? balanceViewModel.errorMessage : ""

                onClicked: {
                    if (balanceViewModel) {
                        balanceViewModel.refreshBalance()
                    }
                }
            }

            // 账户概览
            AccountOverviewCard {
                Layout.fillWidth: true
                Layout.preferredHeight: 300

                accountListViewModel: accountListViewModel
            }

            Item { Layout.fillHeight: true }
        }
    }
}
