
window.onload = function () {

    var status = document.getElementById('timerstatus');

    togglCurrent()
        .then(data => {
            if (data) {

                var description = data["description"];
                if (!description) {
                    description = "no task neme";
                }
                var durationTime = Date.now() + data["duration"] / 1000;

                var startDate = new Date(data["start"]);
                var startDateFormatted = startDate.getFullYear()
                    + '/' + ('0' + (startDate.getMonth() + 1)).slice(-2)
                    + '/' + ('0' + startDate.getDate()).slice(-2)
                    + ' ' + ('0' + startDate.getHours()).slice(-2)
                    + ':' + ('0' + startDate.getMinutes()).slice(-2)
                    + ':' + ('0' + startDate.getSeconds()).slice(-2);

                var table = '<table class=".workingtable" border="1">' +
                    '<thead><tr><td>task Name</td><td>start</td><td>duration</td></tr></thead >' +
                    '<tbody><tr><td>' + description + '</td><td>' + startDateFormatted + '</td><td>' + durationTime + '</td></tr></tbody>' +
                    '</table >';

                status.innerHTML = table;
            } else {
                status.innerHTML = '<span class=".notwork">not working...</span>';
            }
        }).catch(err => { console.debug(err) });

}

async function togglCurrent() {
    // togglConf
    var items = await getSyncStorageTogglData();
    const headers = {
        'Authorization': 'Basic ' + btoa(items.togglToken + ":api_token")
    };
    var togglStatusCheckSetting = { contentScriptQuery: "togglTimerCurrent", headers: headers};
    const result = await backgroundFetch(togglStatusCheckSetting);
    return result;
}

function backgroundFetch(settings) {

    return new Promise(function (resolve) {
        chrome.runtime.sendMessage(
            settings,
            response => {
                resolve(response);
            });
    })
}

function getSyncStorageTogglData() {
    return new Promise(function (resolve) {
        chrome.storage.sync.get(["togglToken"],
            function (items) {
                resolve(items);
            });
    });
}