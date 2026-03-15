import QtQuick 2.15
import QtQuick.Controls 2.15

Rectangle {
    id: balanceCard
    property double currentBalance: 0.0
    property date lastUpdated: new Date()

    radius: 10
    color: "#f8f9fa"
    border.color: "#dee2e6"
    border.width: 1

    Column {
        anchors.centerIn: parent
        spacing: 10

        Text {
            text: "当前余额"
            font.pixelSize: 16
            color: "#6c757d"
            anchors.horizontalCenter: parent.horizontalCenter
        }

        Text {
            text: "$" + currentBalance.toFixed(2)
            font.pixelSize: 36
            font.bold: true
            color: currentBalance < 10 ? "#dc3545" : "#28a745"
            anchors.horizontalCenter: parent.horizontalCenter
        }

        Text {
            text: "最后更新: " + Qt.formatDateTime(lastUpdated, "yyyy-MM-dd hh:mm:ss")
            font.pixelSize: 12
            color: "#6c757d"
            anchors.horizontalCenter: parent.horizontalCenter
        }
    }
}
