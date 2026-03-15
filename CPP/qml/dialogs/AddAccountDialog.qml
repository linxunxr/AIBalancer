import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

Dialog {
    id: root
    property var accountListViewModel: null
    property bool isEditing: false

    title: isEditing ? "编辑账户" : "添加新账户"
    modal: true
    standardButtons: Dialog.Ok | Dialog.Cancel
    closePolicy: Popup.NoAutoClose

    onAccepted: {
        if (nameField.text.length === 0) {
            nameField.focus = true
            return
        }

        if (isEditing) {
            // 编辑模式
            accountListViewModel.updateAccount(
                accountIdField.text,
                nameField.text,
                emailField.text
            )
        } else {
            // 添加模式
            accountListViewModel.addAccount(
                nameField.text,
                emailField.text,
                apiKeyField.text
            )
        }

        if (accountListViewModel.hasError) {
            // 显示错误
            errorLabel.text = accountListViewModel.errorMessage
            errorLabel.visible = true
            closePolicy = Popup.NoAutoClose
        } else {
            resetForm()
            close()
        }
    }

    onRejected: {
        resetForm()
        errorLabel.visible = false
    }

    function resetForm() {
        accountIdField.text = ""
        nameField.text = ""
        emailField.text = ""
        apiKeyField.text = ""
        nameField.focus = false
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

        // 账户名称
        ColumnLayout {
            spacing: 5

            Label {
                text: "账户名称 *"
                font.bold: true
            }

            TextField {
                id: nameField
                placeholderText: "例如: DeepSeek 主账户"
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
                placeholderText: "例如: user@example.com"
                Layout.fillWidth: true
                validator: RegExpValidator {
                    regExp: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
                }
            }
        }

        // API Key（仅添加模式）
        ColumnLayout {
            spacing: 5
            visible: !isEditing

            Label {
                text: "API Key *"
                font.bold: true
            }

            RowLayout {
                spacing: 5
                Layout.fillWidth: true

                TextField {
                    id: apiKeyField
                    placeholderText: "sk-..."
                    echoMode: TextInput.Password
                    Layout.fillWidth: true

                    onTextChanged: errorLabel.visible = false
                }

                Button {
                    id: showPasswordBtn
                    text: "显示"
                    flat: true

                    onClicked: {
                        if (apiKeyField.echoMode === TextInput.Password) {
                            apiKeyField.echoMode = TextInput.Normal
                            showPasswordBtn.text = "隐藏"
                        } else {
                            apiKeyField.echoMode = TextInput.Password
                            showPasswordBtn.text = "显示"
                        }
                    }
                }
            }

            Label {
                text: "API Key 仅在添加时需要，编辑后无法修改"
                font.pixelSize: 11
                color: "#6c757d"
                visible: !isEditing
                wrapMode: Text.Wrap
                Layout.fillWidth: true
            }
        }

        // 提示信息
        Label {
            text: "* 标记为必填项"
            font.pixelSize: 11
            color: "#6c757d"
        }

        Item { Layout.fillHeight: true }
    }
}
