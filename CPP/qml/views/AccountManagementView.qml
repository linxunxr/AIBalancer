import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "../components"
import "../dialogs"

Page {
    id: accountManagement
    property var accountListViewModel

    padding: 20

    // 添加账户对话框
    AddAccountDialog {
        id: addAccountDialog
        accountListViewModel: accountListViewModel
        visible: false
    }

    // 编辑账户对话框
    EditAccountDialog {
        id: editAccountDialog
        accountListViewModel: accountListViewModel
        visible: false
    }

    ColumnLayout {
        anchors.fill: parent
        spacing: 20

        // 标题和操作栏
        RowLayout {
            Layout.fillWidth: true

            Text {
                text: "账户管理"
                font.pixelSize: 28
                font.bold: true
                color: "#2c3e50"
            }

            Item { Layout.fillWidth: true }

            Button {
                text: "添加账户"
                highlighted: true

                onClicked: {
                    addAccountDialog.open()
                }
            }
        }

        // 账户列表
        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true
            radius: 10
            color: "#ffffff"
            border.color: "#e0e0e0"
            border.width: 1

            ColumnLayout {
                anchors.fill: parent
                anchors.margins: 1

                Repeater {
                    model: accountListViewModel ? accountListViewModel.accounts : []
                    visible: (accountListViewModel && accountListViewModel.accounts.length > 0) ? true : false

                    delegate: AccountListItem {
                        Layout.fillWidth: true
                        Layout.preferredHeight: 80

                        accountId: modelData.id
                        name: modelData.name
                        email: modelData.email || ""
                        isActive: modelData.isActive !== undefined ? modelData.isActive : false
                        viewModel: accountListViewModel

                        onClicked: {
                            if (accountListViewModel) {
                                accountListViewModel.setActiveAccount(modelData.id)
                            }
                        }

                        onEditRequested: {
                            editAccountDialog.accountId = modelData.id
                            editAccountDialog.accountName = modelData.name
                            editAccountDialog.accountEmail = modelData.email || ""
                            editAccountDialog.open()
                        }

                        onDeleteRequested: {
                            // TODO: 确认删除对话框
                            accountListViewModel.removeAccount(modelData.id)
                        }
                    }
                }

                // 空状态提示
                Item {
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    visible: !accountListViewModel || accountListViewModel.accounts.length === 0

                    ColumnLayout {
                        anchors.centerIn: parent
                        spacing: 10

                        Text {
                            text: "还没有添加账户"
                            font.pixelSize: 16
                            color: "#6c757d"
                            Layout.alignment: Qt.AlignHCenter
                        }

                        Button {
                            text: "点击添加第一个账户"
                            highlighted: true
                            Layout.alignment: Qt.AlignHCenter

                            onClicked: {
                                addAccountDialog.open()
                            }
                        }
                    }
                }
            }
        }
    }
}
