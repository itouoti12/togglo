//api関係の操作をbackground実行
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.contentScriptQuery == "getMemberList") {
            console.log('execute getMemberList')

            var boardId = request.boardid;
            var prefix = request.prefix;
            var preUrl = 'https://trello.com/1/boards/';
            var url = preUrl + boardId + '/members' + prefix;

            fetch(url)
                .then(response => {
                    response.json()
                        .then(memberList => {
                            sendResponse(memberList);
                        })
                });
            return true;
        }
        if (request.contentScriptQuery == "getCards") {
            console.log('execute getCards')

            var boardId = request.boardid;
            var prefix = request.prefix;
            var preUrl = 'https://trello.com/1/boards/';
            var url = preUrl + boardId + '/cards' + prefix;

            fetch(url)
                .then(response => {
                    response.json()
                        .then(res => {
                            var cardList = [];
                            if (Array.isArray(res)) {
                                res.forEach(cardData => {
                                    cardList.push({
                                        id: cardData.shortLink,
                                        name: cardData.name,
                                        listId: cardData.idList,
                                        members: cardData.idMembers,
                                        labels: cardData.labels
                                    });
                                })
                            };
                            sendResponse(cardList);
                        })
                });
            return true;
        }
        if (request.contentScriptQuery == "getLaneList") {
            console.log('execute getLaneList')

            var boardId = request.boardid;
            var prefix = request.prefix;
            var preUrl = 'https://trello.com/1/boards/';
            var url = preUrl + boardId + '/lists' + prefix;

            fetch(url)
                .then(response => {
                    response.json()
                        .then(res => {
                            var laneList = [];
                            if (Array.isArray(res)) {
                                res.forEach(laneData => {
                                    laneList.push({ id: laneData.id, name: laneData.name });
                                })
                            };
                            sendResponse(laneList);
                        })
                });
            return true;
        }
        if (request.contentScriptQuery == "togglTimerStart") {
            console.log('execute togglTimerStart')

            var json =
            {
                "time_entry":
                {
                    "description": request.description,
                    "tags": request.labels,
                    "created_with": "togglo"
                }
            };
            const body = JSON.stringify(json);
            var headers = request.headers;
            var method = 'POST';
            var url = "https://www.toggl.com/api/v8/time_entries/start";

            fetch(url, { method, headers, body })
                .then(response => {
                    response.json()
                        .then(res => {
                            sendResponse({ id: res.data["id"], startDate: res.data["start"] });
                        })
                });
            return true;
        }
        if (request.contentScriptQuery == "togglTimerStop") {
            console.log('execute togglTimerStop')

            var headers = request.headers;
            var method = 'PUT';
            var url = "https://www.toggl.com/api/v8/time_entries/" + request.togglId + "/stop";

            fetch(url, { method, headers })
                .then(response => {
                    response.json()
                        .then(res => {
                            sendResponse(res.data["duration"]);
                        })
                });
            return true;
        }
        if (request.contentScriptQuery == "togglTimerCurrent") {
            console.log('execute togglTimerCurrent')

            var headers = request.headers;
            var url = "https://www.toggl.com/api/v8/time_entries/current";
            fetch(url, { headers })
                .then(response => {
                    response.json()
                        .then(res => {
                            sendResponse(res.data);
                        })
                });
            return true;
        }
    }
);
