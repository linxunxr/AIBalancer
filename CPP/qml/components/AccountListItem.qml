import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

Rectangle {
    id: root
    property string accountId: ""
    property string name: ""
    property string email: ""
    property bool isActive: false
    property var viewModel: null

    signal clicked()
    signal editRequested()
    signal deleteRequested()

    radius: 8
    color: mouseArea.containsMouse || mouseArea.pressed ? "#f0f8ff" : "#ffffff"
    border.width: isActive ? 2 : 1
    border.color: isActive ? "#3498db" : "#e0e0e0"

    Behavior on color { ColorAnimation { duration: 150 } }

    RowLayout {
        anchors.verticalCenter: parent.verticalCenter
        anchors.left: parent.left
        anchors.leftMargin: 16
        spacing: 12

        // 活动指示器
        Rectangle {
            width: 10
            height: 10
            radius: 5
            color: isActive ? "#3498db" : "#e0e0e0"
            Layout.alignment: Qt.AlignVCenter
            visible: isActive
        }

        ColumnLayout {
            spacing: 4

            Text {
                text: name
                font.pixelSize: 16
                font.bold: true
                color: "#2c3e50"
            }

            Text {
                text: email
                font.pixelSize: 12
                color: "#6c757d"
                visible: email.length > 0
            }
        }

        Item { Layout.fillWidth: true }

        // 操作按钮
        RowLayout {
            spacing: 8
            Layout.alignment: Qt.AlignVCenter

            Button {
                text: "编辑"
                flat: true

                background: Rectangle {
                    color: parent.hovered ? "#f0f0f0" : "transparent"
                    radius: 4
                }

                onClicked: root.editRequested()
            }

            Button {
                text: "删除"
                flat: true

                background: Rectangle {
                    color: parent.hovered ? "#fee" : "transparent"
                    radius: 4
                }

                onClicked: root.deleteRequested()
            }
        }
    }

    MouseArea {
        id: mouseArea
        anchors.fill: parent
        hoverEnabled: true

        onClicked: root.clicked()
    }
}
