import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

Rectangle {
    id: root
    property var accountListViewModel: null

    radius: 10
    color: "#ffffff"
    border.color: "#e0e0e0"
    border.width: 1

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 16
        spacing: 12

        RowLayout {
            spacing: 8

            Text {
                text: "账户概览"
                font.pixelSize: 18
                font.bold: true
                color: "#2c3e50"
            }

            Text {
                text: "(" + (accountListViewModel ? accountListViewModel.accountCount : 0) + ")"
                font.pixelSize: 14
                color: "#6c757d"
            }

            Item { Layout.fillWidth: true }

            Button {
                text: "管理"
                flat: true
            }
        }

        // 账户列表（简化版）
        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true
            radius: 8
            color: "#f8f9fa"
            border.color: "#e9ecef"
            border.width: 1

            ColumnLayout {
                anchors.centerIn: parent
                spacing: 8

                Text {
                    text: "总账户数: " + (accountListViewModel ? accountListViewModel.accountCount : 0)
                    font.pixelSize: 14
                    color: "#495057"
                    Layout.alignment: Qt.AlignHCenter
                    visible: accountListViewModel && accountListViewModel.accountCount > 0
                }

                // TODO: 显示活动账户和余额概览
                    RowLayout {
                        spacing: 20
                        Layout.alignment: Qt.AlignHCenter

                        ColumnLayout {
                            spacing: 4
                            Text {
                                text: "活跃账户"
                                font.pixelSize: 12
                                color: "#6c757d"
                            }
                            Text {
                                text: (accountListViewModel && accountListViewModel.activeAccountId) ?
                                    accountListViewModel.activeAccountId.substring(0, 8) + "..." :
                                    "无"
                                font.pixelSize: 16
                                font.bold: true
                                color: "#2c3e50"
                            }
                        }

                        ColumnLayout {
                            spacing: 4
                            Text {
                                text: "上次同步"
                                font.pixelSize: 12
                                color: "#6c757d"
                            }
                            Text {
                                text: "今天"
                                font.pixelSize: 14
                                color: "#495057"
                            }
                        }
                    }

                Text {
                    text: "暂无账户"
                    font.pixelSize: 14
                    color: "#6c757d"
                    Layout.alignment: Qt.AlignHCenter
                    visible: !accountListViewModel || accountListViewModel.accountCount <= 0
                }
            }
        }
    }
}
