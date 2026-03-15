import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

Page {
    id: settings

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 20
        spacing: 20

        Text {
            text: "设置"
            font.pixelSize: 24
            font.bold: true
            Layout.alignment: Qt.AlignHCenter
        }

        // 设置项占位
        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true
            radius: 10
            color: "#ffffff"
            border.color: "#e0e0e0"
            border.width: 1

            Text {
                anchors.centerIn: parent
                text: "设置选项将在此显示"
                font.pixelSize: 16
                color: "#6c757d"
            }
        }
    }
}
