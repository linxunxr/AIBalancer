import QtQuick 2.15
import QtQuick.Controls 2.15

Rectangle {
    id: accountList
    property var model: []

    radius: 8
    color: "#ffffff"
    border.color: "#e0e0e0"
    border.width: 1

    ListView {
        id: listView
        anchors.fill: parent
        anchors.margins: 8
        model: accountList.model

        delegate: Rectangle {
            width: listView.width
            height: 50
            radius: 4
            color: mouseArea.containsMouse ? "#f0f0f0" : "#ffffff"

            Row {
                anchors.verticalCenter: parent.verticalCenter
                anchors.left: parent.left
                anchors.leftMargin: 16
                spacing: 10

                Text {
                    text: modelData.name || "Unknown"
                    font.pixelSize: 14
                    font.bold: true
                }

                Text {
                    text: modelData.email || ""
                    font.pixelSize: 12
                    color: "#666666"
                }
            }

            MouseArea {
                id: mouseArea
                anchors.fill: parent
                hoverEnabled: true
                onClicked: console.log("Selected:", modelData.name)
            }
        }

        ScrollBar.vertical: ScrollBar {
            policy: ScrollBar.AsNeeded
        }
    }
}
