import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

Rectangle {
    id: balanceCard
    property double totalBalance: 0.0
    property double usedBalance: 0.0
    property double remainingBalance: 0.0
    property string currency: "USD"
    property date lastUpdated: new Date()
    property bool isLoading: false
    property string errorMessage: ""
    signal clicked

    radius: 10
    color: "#f8f9fa"
    width: 300
    border.color: "#dee2e6"
    border.width: 1

    MouseArea {
        anchors.fill: parent
        onClicked: balanceCard.clicked()
    }

    ColumnLayout {
        anchors.fill: parent
        anchors.leftMargin: 8
        anchors.rightMargin: 8
        anchors.topMargin: 16
        anchors.bottomMargin: 16
        spacing: 8

        Item {
            Layout.fillHeight: true
        }

        Text {
            text: "总余额"
            font.pixelSize: 16
            color: "#6c757d"
            Layout.alignment: Qt.AlignHCenter
        }

        Text {
            text: (currency === "CNY" ? "¥" : "$") + totalBalance.toFixed(2)
            font.pixelSize: 36
            font.bold: true
            color: totalBalance < 10 ? "#dc3545" : "#28a745"
            Layout.alignment: Qt.AlignHCenter
            horizontalAlignment: Text.AlignHCenter
        }

        Text {
            text: "最后更新: " + Qt.formatDateTime(lastUpdated, "yyyy-MM-dd hh:mm:ss")
            font.pixelSize: 12
            color: "#6c757d"
            Layout.alignment: Qt.AlignHCenter
            visible: !isLoading && errorMessage === ""
        }

        Text {
            text: errorMessage
            font.pixelSize: 14
            color: "#dc3545"
            Layout.alignment: Qt.AlignHCenter
            visible: errorMessage !== ""
        }

        Item {
            Layout.fillHeight: true
        }
    }
}
