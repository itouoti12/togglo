//api関係の操作をbackground実行
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.contentScriptQuery == "getBoardInfo"){
            console.log('execute getBoardInfo')

            var boardId = request.boardid;
            var prefix = request.prefix;
            var preUrl = 'https://trello.com/1/boards/';
            var url = preUrl + boardId + prefix;

            fetch(url)
                .then(response => {
                    response.json()
                        .then(boardInfo => {
                            sendResponse({
                                id: boardInfo.id,
                                name: boardInfo.name
                            });
                        })
                });
            return true;
        }
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
                    "pid": request.pid,
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
        if (request.contentScriptQuery == "getMyTogglInfo") {
            console.log('execute get toggl my info')

            var headers = request.headers;
            var url = "https://api.track.toggl.com/api/v8/me";
            fetch(url, { headers })
                .then(response => {
                    response.json()
                        .then(res => {
                            sendResponse({ id: res.data["id"], wid: res.data["default_wid"] });
                        })
                });
            return true;
        }
        if (request.contentScriptQuery == "getTogglProjects") {
            console.log('execute get toggl project list')

            var headers = request.headers;
            var url = "https://www.toggl.com/api/v8/workspaces/" + request.wid + "/projects";
            fetch(url, { headers })
                .then(response => {
                    response.json()
                        .then(res => {
                            var projectList = [];
                            if (Array.isArray(res)) {
                                res.forEach(project => {
                                    projectList.push({
                                        id: project.id,
                                        name: project.name,
                                        wid: project.wid
                                    });
                                })
                            };
                            sendResponse(projectList);
                        })
                });
            return true;
        }
        if (request.contentScriptQuery == "createTogglProject") {
            console.log('execute createTogglProject')

            var json =
            {
                "project": {
                    "name": request.projectName,
                    "is_private": false
                }
            };
            const body = JSON.stringify(json);
            var headers = request.headers;
            var method = 'POST';
            var url = "https://api.track.toggl.com/api/v8/projects";

            fetch(url, { method, headers, body })
                .then(response => {
                    response.json()
                        .then(res => {
                            sendResponse({
                                id: res.data["id"],
                                wid: res.data["wid"],
                                name: res.data["named"],
                            });
                        })
                });
            return true;
        }
    }
);
