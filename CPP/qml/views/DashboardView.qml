import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

Page {
    id: dashboard
    property: var dashboardViewModel
    property: var balanceViewModel
    property: var accountListViewModel

    padding: 20

    Binding {
        target: accountListViewModel
        property: "accountId"
        value: ""
    }

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
                Layout.fillWidth: true
                Layout.preferredHeight: 200

                Binding {
                    target: balanceCard
                    property: "totalBalance"
                    value: balanceViewModel ? balanceViewModel.totalBalance : 0
                }

                Binding {
                    target: balanceCard
                    property: "usedBalance"
                    value: balanceViewModel ? balanceViewModel.usedBalance : 0
                }

                Binding {
                    target: balanceCard
                    property: "remainingBalance"
                    value: balanceViewModel ? balanceViewModel.remainingBalance : 0
                }

                Binding {
                    target: balanceCard
                    property: "currency"
                    value: balanceViewModel ? balanceViewModel.currency : "USD"
                }

                Binding {
                    target: balanceCard
                    property: "lastUpdated"
                    value: balanceViewModel ? balanceViewModel.lastUpdated : new Date()
                }

                Binding {
                    target: balanceCard
                    property: "isLoading"
                    value: balanceViewModel ? balanceViewModel.isLoading : false
                }

                Binding {
                    target: balanceCard
                    property: "errorMessage"
                    value: balanceViewModel ? balanceViewModel.errorMessage : ""
                }

                onClicked: refresh() {
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
