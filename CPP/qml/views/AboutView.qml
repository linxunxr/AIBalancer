import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

Page {
    padding: 40

    ColumnLayout {
        anchors.centerIn: parent
        spacing: 20
        width: parent.width - 80

        // Logo
        Rectangle {
            width: 80
            height: 80
            radius: 16
            color: "#3498db"
            Layout.alignment: Qt.AlignHCenter

            Text {
                anchors.centerIn: parent
                text: "AI"
                color: "white"
                font.pixelSize: 36
                font.bold: true
            }
        }

        // 应用名称
        Text {
            text: "AI余额管家"
            font.pixelSize: 32
            font.bold: true
            color: "#2c3e50"
            Layout.alignment: Qt.AlignHCenter
        }

        // 版本
        Text {
            text: "版本 " + Qt.application.version
            font.pixelSize: 16
            color: "#6c757d"
            Layout.alignment: Qt.AlignHCenter
        }

        Item { Layout.preferredHeight: 20 }

        // 描述
        Text {
            text: "一款专业的 DeepSeek API 余额监测工具"
            font.pixelSize: 14
            color: "#495057"
            Layout.alignment: Qt.AlignHCenter
            horizontalAlignment: Text.AlignHCenter
            width: parent.width
            wrapMode: Text.Wrap
        }

        Item { Layout.fillHeight: true }
    }
}
