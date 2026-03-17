import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

Dialog {
    id: root
    property string accountId: ""
    property string accountName: ""
    property string accountEmail: ""
    property var accountListViewModel: null

    title: "编辑账户"
    modal: true
    standardButtons: Dialog.Ok | Dialog.Cancel
    closePolicy: Popup.NoAutoClose

    width: 480
    height: implicitHeight

    // 居中显示在父窗口中
    x: (parent.width - width) / 2
    y: (parent.height - height) / 2

    // 如果没有传入，自动使用根上下文的全局实例
    Component.onCompleted: {
        if (!accountListViewModel && typeof accountListViewModel !== 'undefined') {
            accountListViewModel = accountListViewModel
        }
        accountIdField.text = accountId
        nameField.text = accountName
        emailField.text = accountEmail
    }

    // 打开前确保 viewModel 已设置
    function openWithViewModel(viewModel, id, name, email) {
        if (viewModel) {
            accountListViewModel = viewModel
        } else if (!accountListViewModel && typeof accountListViewModel !== 'undefined') {
            // 回退到根上下文的全局实例
            accountListViewModel = accountListViewModel
        }
        accountId = id
        accountName = name
        accountEmail = email
        accountIdField.text = accountId
        nameField.text = accountName
        emailField.text = accountEmail
        open()
    }

    onAccepted: {
        if (!accountListViewModel) {
            errorLabel.text = "视图模型未初始化"
            errorLabel.visible = true
            return
        }

        if (nameField.text.length === 0) {
            nameField.focus = true
            return
        }

        accountListViewModel.updateAccount(
            accountIdField.text,
            nameField.text,
            emailField.text
        )

        if (accountListViewModel.hasError) {
            errorLabel.text = accountListViewModel.errorMessage
            errorLabel.visible = true
            closePolicy = Popup.NoAutoClose
        } else {
            close()
        }
    }

    onRejected: {
        errorLabel.visible = false
    }

    ColumnLayout {
        spacing: 20
        width: 400

        // 错误提示
        Label {
            id: errorLabel
            visible: false
            color: "#dc3545"
            wrapMode: Text.Wrap
            Layout.fillWidth: true
        }

        // 账户 ID（只读）
        ColumnLayout {
            spacing: 5

            Label {
                text: "账户 ID"
                font.bold: true
            }

            TextField {
                id: accountIdField
                readOnly: true
                Layout.fillWidth: true
                color: "#6c757d"
            }
        }

        // 账户名称
        ColumnLayout {
            spacing: 5

            Label {
                text: "账户名称 *"
                font.bold: true
            }

            TextField {
                id: nameField
                placeholderText: "例如：DeepSeek 主账户"
                Layout.fillWidth: true

                onTextChanged: errorLabel.visible = false
            }
        }

        // 邮箱（可选）
        ColumnLayout {
            spacing: 5

            Label {
                text: "关联邮箱"
                font.bold: true
            }

            TextField {
                id: emailField
                placeholderText: "例如：user@example.com"
                Layout.fillWidth: true
                validator: RegularExpressionValidator {
                    regularExpression: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
                }
            }
        }

        // 提示信息
        Label {
            text: "编辑账户时无法修改 API Key，如需更换请删除后重新添加"
            font.pixelSize: 11
            color: "#6c757d"
            wrapMode: Text.Wrap
            Layout.fillWidth: true
        }

        Label {
            text: "* 标记为必填项"
            font.pixelSize: 11
            color: "#6c757d"
        }

        Item { Layout.fillHeight: true }
    }
}
