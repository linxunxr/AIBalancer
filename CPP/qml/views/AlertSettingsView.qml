import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "../components"
import "../dialogs"

Page {
    id: alertSettings
    property var alertViewModel

    padding: 20

    // 添加告警对话框
    AddAlertDialog {
        id: addAlertDialog
        alertViewModel: alertViewModel
        visible: false
    }

    ColumnLayout {
        anchors.fill: parent
        spacing: 20

        // 标题
        RowLayout {
            spacing: 8

            Text {
                text: "告警设置"
                font.pixelSize: 28
                font.bold: true
                color: "#2c3e50"
            }

            Text {
                text: "(" + (alertViewModel ? alertViewModel.ruleCount : 0) + ")"
                font.pixelSize: 16
                color: "#6c757d"
                visible: alertViewModel && alertViewModel.ruleCount > 0 ? true : false
            }

            Item { Layout.fillWidth: true }

            Button {
                text: "添加规则"
                highlighted: true

                onClicked: {
                    addAlertDialog.open()
                }
            }
        }

        // 告警规则列表
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
                spacing: 10

                Repeater {
                    model: alertViewModel && alertViewModel.alertRules.length > 0 ? alertViewModel.alertRules : []
                    visible: (alertViewModel && alertViewModel.alertRules.length > 0) ? true : false

                    delegate: AlertRuleItem {
                        Layout.fillWidth: true
                        Layout.preferredHeight: 60

                        ruleId: modelData.id
                        typeName: modelData.typeName
                        threshold: modelData.threshold || 0
                        isEnabled: modelData.isEnabled !== undefined ? modelData.isEnabled : true
                        triggerCount: modelData.triggerCount

                        onToggleEnabled: function(enabled) {
                            if (alertViewModel) {
                                alertViewModel.setAlertEnabled(modelData.id, enabled)
                            }
                        }
                    }
                }

                // 空状态提示
                Item {
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    visible: !alertViewModel || alertViewModel.alertRules.length === 0

                    ColumnLayout {
                        anchors.centerIn: parent
                        spacing: 10

                        Text {
                            text: "还没有设置告警规则"
                            font.pixelSize: 16
                            color: "#6c757d"
                            Layout.alignment: Qt.AlignHCenter
                        }

                        Button {
                            text: "点击添加第一条规则"
                            highlighted: true
                            Layout.alignment: Qt.AlignHCenter

                            onClicked: {
                                addAlertDialog.open()
                            }
                        }
                    }
                }
            }
        }
    }
}
