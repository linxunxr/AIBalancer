import QtQuick 6.0
import QtQuick.Controls 6.0
import QtQuick.Layouts 6.0
import AIBalance 1.0

import "views"
import "components"
import "dialogs"

ApplicationWindow {
    id: mainWindow
    visible: true
    width: 1024
    height: 768
    title: "AI余额管家 v" + Qt.application.version

    color: "#f5f5f5"

    // 全局字体配置
    font.family: "Microsoft YaHei UI"
    font.pixelSize: 14

    ColumnLayout {
        anchors.fill: parent
        spacing: 0

        // 顶部导航栏
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 50
            color: "#ffffff"
            border.color: "#e0e0e0"
            border.width: 1

            RowLayout {
                anchors.fill: parent
                anchors.leftMargin: 20
                anchors.rightMargin: 20
                spacing: 20

                // Logo 区域
                RowLayout {
                    spacing: 10

                    Rectangle {
                        width: 32
                        height: 32
                        radius: 6
                        color: "#3498db"

                        Text {
                            anchors.centerIn: parent
                            text: "AI"
                            color: "white"
                            font.pixelSize: 14
                            font.bold: true
                        }
                    }

                    Text {
                        text: "余额管家"
                        font.pixelSize: 18
                        font.bold: true
                        color: "#2c3e50"
                    }
                }

                Item { Layout.fillWidth: true }

                // 导航按钮
                Repeater {
                    model: ["仪表盘", "账户管理", "告警设置", "关于"]

                    delegate: Button {
                        id: navButton
                        text: modelData
                        flat: true

                        background: Rectangle {
                            color: navButton.hovered ? "#f0f0f0" : "transparent"
                            radius: 4
                        }

                        contentItem: Text {
                            text: navButton.text
                            font.pixelSize: 14
                            color: navButton.pressed ? "#3498db" :
                                   navButton.hovered ? "#2c3e50" : "#6c757d"
                            verticalAlignment: Text.AlignVCenter
                            horizontalAlignment: Text.AlignHCenter
                        }
                    }
                }
            }
        }

        // 主内容区域
        StackLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            currentIndex: 0

            DashboardView {
                dashboardViewModel: dashboardViewModel
                balanceViewModel: balanceViewModel
                accountListViewModel: accountListViewModel
            }

            AccountManagementView {
                accountListViewModel: accountListViewModel
            }

            AlertSettingsView {
                alertViewModel: alertViewModel
            }

            AboutView {}
        }
    }
}
