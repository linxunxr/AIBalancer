import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

Page {
    id: dashboard

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 20
        spacing: 20

        Text {
            text: "仪表盘"
            font.pixelSize: 24
            font.bold: true
            Layout.alignment: Qt.AlignHCenter
        }

        // 余额卡片占位
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 200
            radius: 10
            color: "#f8f9fa"
            border.color: "#dee2e6"
            border.width: 1

            Text {
                anchors.centerIn: parent
                text: "余额信息将在此显示"
                font.pixelSize: 16
                color: "#6c757d"
            }
        }

        // 账户列表占位
        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true
            radius: 10
            color: "#ffffff"
            border.color: "#e0e0e0"
            border.width: 1

            Text {
                anchors.centerIn: parent
                text: "账户列表将在此显示"
                font.pixelSize: 16
                color: "#6c757d"
            }
        }
    }
}
