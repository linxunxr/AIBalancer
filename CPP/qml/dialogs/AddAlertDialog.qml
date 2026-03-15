import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

Dialog {
    id: root
    property string accountId: ""
    property var alertViewModel: null

    title: "添加告警规则"
    modal: true
    standardButtons: Dialog.Ok | Dialog.Cancel
    closePolicy: Popup.NoAutoClose

    onAccepted: {
        if (thresholdField.value <= 0) {
            errorLabel.text = "阈值必须大于 0"
            errorLabel.visible = true
            thresholdField.focus = true
            return
        }

        // 获取告警类型和方法
        var alertType = alertTypeCombo.model[alertTypeCombo.currentIndex].value
        var notificationMethod = methodCombo.model[methodCombo.currentIndex].value

        alertViewModel.addAlertRule(alertType, thresholdField.value, notificationMethod)

        if (alertViewModel.hasError) {
            errorLabel.text = alertViewModel.errorMessage
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
        alertTypeCombo.currentIndex = 0
        thresholdField.value = 10.0
        methodCombo.currentIndex = 0
        errorLabel.visible = false
    }

    // 告警类型模型
    ListModel {
        id: alertTypeModel
        ListElement { text: "余额不足"; value: 0 }
        ListElement { text: "日限额"; value: 1 }
    }

    // 通知方式模型
    ListModel {
        id: methodModel
        ListElement { text: "弹窗"; value: 0 }
        ListElement { text: "系统通知"; value: 1 }
        ListElement { text: "邮件"; value: 2 }
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

        // 告警类型
        ColumnLayout {
            spacing: 5

            Label {
                text: "告警类型 *"
                font.bold: true
            }

            ComboBox {
                id: alertTypeCombo
                model: alertTypeModel
                textRole: "text"
                Layout.fillWidth: true
            }
        }

        // 阈值
        ColumnLayout {
            spacing: 5

            Label {
                text: "触发阈值 ($) *"
                font.bold: true
            }

            SpinBox {
                id: thresholdField
                from: 0.01
                to: 10000.0
                step: 1.0
                decimals: 2
                value: 10.0
                Layout.fillWidth: true

                onValueChanged: errorLabel.visible = false
            }
        }

        // 通知方式
        ColumnLayout {
            spacing: 5

            Label {
                text: "通知方式"
                font.bold: true
            }

            ComboBox {
                id: methodCombo
                model: methodModel
                textRole: "text"
                Layout.fillWidth: true
            }
        }

        // 说明
        Label {
            text: {
                var type = alertTypeModel[alertTypeCombo.currentIndex].text
                var method = methodModel[methodCombo.currentIndex].text
                return "当 %1 时，通过 %2 发送通知".arg(type).arg(method)
            }
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
