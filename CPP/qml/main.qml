import QtQuick 2.15
import QtQuick.Controls 2.15

ApplicationWindow {
    id: mainWindow
    visible: true
    width: 800
    height: 600
    title: "AI余额管家 v" + Qt.application.version

    Column {
        anchors.centerIn: parent
        spacing: 20

        Text {
            id: titleText
            text: "AI余额管家"
            anchors.horizontalCenter: parent.horizontalCenter
            font.pixelSize: 32
            font.bold: true
            color: "#2c3e50"
        }

        Text {
            id: statusText
            text: "C++20 + Qt 6.10 + QML"
            anchors.horizontalCenter: parent.horizontalCenter
            font.pixelSize: 16
            color: "#7f8c8d"
        }

        Rectangle {
            width: 200
            height: 60
            radius: 8
            color: "#3498db"
            anchors.horizontalCenter: parent.horizontalCenter

            Text {
                text: "项目已启动"
                anchors.centerIn: parent
                color: "white"
                font: statusText.font
                font.bold: true
            }

            MouseArea {
                anchors.fill: parent
                onClicked: {
                    statusText.text = "点击时间: " + new Date().toLocaleTimeString()
                }
            }
        }
    }
}
