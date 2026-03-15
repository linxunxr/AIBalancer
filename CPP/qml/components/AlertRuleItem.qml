import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

Rectangle {
    id: root
    property string ruleId: ""
    property string typeName: ""
    property real threshold: 0
    property bool isEnabled: true
    property int triggerCount: 0

    signal toggleEnabled(bool enabled)

    radius: 6
    color: "#ffffff"
    border.color: "#e0e0e0"
    border.width: 1

    RowLayout {
        anchors.fill: parent
        anchors.leftMargin: 16
        anchors.rightMargin: 16
        spacing: 16

        // 开关
        Switch {
            id: enableSwitch
            checked: isEnabled
            LayoutLayout.alignment: Qt.AlignVCenter

            onCheckedChanged: root.toggleEnabled(checked)
        }

        // 规则类型和阈值
        ColumnLayout {
            spacing: 4
            Layout.fillWidth: true

            Text {
                text: typeName
                font.pixelSize: 14
                font.bold: true
                color: "#2c3e50"
            }

            Text {
                text: "当余额低于 $" + threshold.toFixed(2) + " 时触发"
                font.pixelSize: 12
                color: "#6c757d"
            }
        }

        // 触发次数
        ColumnLayout {
            spacing: 4
            Layout.alignment: Qt.AlignVCenter

            Text {
                text: "触发次数"
                font.pixelSize: 12
                color: "#6c757d"
                horizontalAlignment: Text.AlignHCenter
            }

            Text {
                text: triggerCount.toString()
                font.pixelSize: 20
                font.bold: true
                color: triggerCount > 0 ? "#dc3545" : "#495057"
                horizontalAlignment: Text.AlignHCenter
            }
        }

        // 删除按钮
        Button {
            width: 40
            height: 4040
            text: "×"
            flat: true
            font.pixelSize: 24
            Layout.alignment: Qt.AlignVCenter

            background: Rectangle {
                color: parent.hovered ? "#fee" : "transparent"
                radius: 4
            }

            onClicked: console.log("Delete rule:", ruleId)
        }
    }
}
