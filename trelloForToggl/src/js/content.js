const forEach = Array.prototype.forEach;

window.onload = async function () {

    Push.Permission.request();

    // board id
    let boardId = this.document.URL.split("/")[4];
    // get board name
    let boardInfo = await getBoardInfo(boardId);
    // get default workspace id
    let togglInfo = await myTogglInfo();
    // get workspace projects
    let togglProjects = await getTogglProjects(togglInfo.wid);

    let projectId = await getProjectId();
    if (!projectId) {
        // convert boardname and projects name -> get projects id
        let togglTargetProject = togglProjects.find(prj => prj.name === boardInfo.name);
        if (togglTargetProject) {
            console.log('projects is exist.')
            projectId = togglTargetProject.id;
        } else {
            console.log('projects is not exist.because make projects.')
            // if projects is not exist. make projects
            let createProject = await createTogglProject(boardInfo.name);
            projectId = createProject.id;
        }
    } else {
        console.log('projectId option settings is using.')
    }

    //operation user
    let membersByApi = await getMemberList(boardId);

    let membersByScreen=[];
    do {
        console.log('ユーザ名の取得中...')
        await new Promise(resolve => setTimeout(resolve, 500)) // 0.5秒待つ
        membersByScreen = this.document.getElementsByClassName('js-open-header-member-menu');
    } while (membersByScreen.length === 0);


    let userNameByScreen;
    forEach.call(membersByScreen, function (member) {
        userNameByScreen = member.title.match(/\((.+)\)/)[1];
    });
    let userInfo = {};
    membersByApi.forEach((memberByApi) => {
        if (userNameByScreen === memberByApi.username) {
            userInfo = memberByApi;
        }
    })

    // init lane
    let lanesByApi = await getLaneList(boardId);

    // current toggl status
    let currentToggl = await togglCurrent();

    // init card
    let cardListByApi = await getCards(boardId);
    let initCardList = convertCards(lanesByApi, cardListByApi, currentToggl);

    // init sectionName
    let sectionNames = await getSectionNames();

    //setting observer
    const laneObserver = this.getObserver(initCardList, userInfo, lanesByApi, boardId, sectionNames, projectId);
    

    let observeTargetLaneList=[];
    do {
        console.log('レーンの取得中...')
        await new Promise(resolve => setTimeout(resolve, 500)) // 0.5秒待つ
        observeTargetLaneList = this.document.getElementsByClassName('list-cards u-fancy-scrollbar u-clearfix js-list-cards js-sortable ui-sortable');
    } while (observeTargetLaneList.length === 0);

    forEach.call(observeTargetLaneList, function (lane) {
        const config = {
            childList: true,
            attributes: true,
            subtree: true
        };

        laneObserver.observe(lane, config);
    });
};

function getObserver(initCardList, userInfo, laneList, boardId, sectionNames, projectId) {

    return new MutationObserver((mutations) => {

        mutations.forEach((mutation) => {

            let isMoving = document.getElementsByClassName('list-card placeholder').length;
            if (isMoving) {
                return;
            } else {

                let cards = document.querySelectorAll('a.list-card');

                if (initCardList.length < cards.length) {

                    let target = mutation.target;

                    if (target.tagName !== "A" || !target.href) {
                        return;
                    }
                    console.log('カード追加')

                    //一度仮でカードを追加する
                    let uriMatch = target.getAttribute('href').match(/^\/c\/(.+)\/.+/);
                    let position = target.parentNode.parentNode.querySelector('h2').textContent;
                    let newCard = { id: uriMatch[1], position: position, prePosition: "", togglId: "", member: [] }
                    initCardList.push(newCard);

                    //非同期であとからカードリストの正式な状態を更新する
                    updateInitCards(boardId, laneList)
                         .then((updateCardList) => initCardList = updateCardList);

                } else if (initCardList.length > cards.length) {

                    //配列の数が減っていれば削除
                    //一度仮でカードリストから削除する
                    initCardList.pop();
                    //非同期であとからカードリストの正式な状態を更新する
                    updateInitCards(boardId, laneList)
                         .then((updateCardList) => initCardList = updateCardList);

                } else {
                    const target = mutation.target;

                    // div[list-card-members js-list-card-members]がメンバーの操作 
                    if (target.tagName === "DIV" && target.getAttribute('class') === "list-card-members js-list-card-members" && target.parentNode) {

                        let memberIds = Array.from(target.childNodes).map(node => node.getAttribute('data-idmem'));
                        let cardId = target.parentNode.parentNode.getAttribute('href').match(/^\/c\/(.+)\/.+/)[1];
                        let position = target.parentNode.parentNode.parentNode.parentNode.querySelector('h2').textContent;


                        //動かす前のカードの情報を取得
                        let preCard = initCardList.filter((initCard) => initCard.id === cardId)[0];

                        if (position !== sectionNames.workingSection) {
                            //一度仮でカードを更新する
                            preCard.members = memberIds;
                            //非同期であとからカードリストの正式な状態を更新する
                            updateInitCards(boardId, laneList)
                                 .then((updateCardList) => initCardList = updateCardList);
                            return;
                        }

                        if (memberIds.indexOf(userInfo.id) === -1 && preCard.members.indexOf(userInfo.id) !== -1) {
                            console.log('card action toggl stop')
                            // delete me of member
                            togglCurrent().then(res => {
                                if (res && preCard.name === res.description) {
                                    togglStop(res.id).then(res => {
                                        let message = 'task Retire...';
                                        const endDuration = `finish time: ${res} second`
                                        push(message, endDuration);
                                    });
                                }
                            })
                        } else if (memberIds.indexOf(userInfo.id) !== -1 && preCard.members.indexOf(userInfo.id) === -1) {
                            console.log('card action toggl start')
                            // add me of member
                            togglStart(preCard, projectId)
                                .then(res => {
                                    const startStr = `start time: ${res.startDate}`
                                    push('toggl start!', startStr);
                                })
                        }

                        //一度仮でカードを更新する
                        preCard.members = memberIds;
                        //非同期であとからカードリストの正式な状態を更新する
                        updateInitCards(boardId, laneList)
                            .then((updateCardList) => initCardList = updateCardList);
                        return;
                    }

                    //カードの名前変更
                    if (target.tagName === "SPAN" && target.getAttribute('class') === "list-card-title js-card-name") {
                        //カードのhrefが存在しない場合
                        const card = target.parentNode.parentNode;
                        if (!card.href) {
                            return;
                        }

                        let cardId = getCardId(card);
                        //非同期であとからカードリストの正式な状態を更新する
                        updateInitCards(boardId, laneList)
                            .then((updateCardList) => {
                                initCardList = updateCardList;
                                //動かす前のカードの情報を取得
                                let preCard = initCardList.filter((initCard) => initCard.id === cardId)[0];
                                if (preCard.position === sectionNames.workingSection && preCard.members.indexOf(userInfo.id) === 0) {
                                    togglCurrent().then(res => {
                                        if (res && preCard.name !== res.description) {
                                            console.log('計測中のカードを再計測開始')
                                            togglStart(preCard, projectId)
                                                .then(res => {
                                                    const startStr = `start time: ${res.startDate}`
                                                    push('toggl restart!', startStr);
                                                })
                                        }
                                    })
                                }
                            });
                        return;
                    }

                    //ラベルの状態変更
                    if (target.tagName === "DIV" && target.getAttribute('class') === "list-card-labels js-card-labels") {
                        console.log('ラベルの状態変更')
                        const cardId = getCardId(target.parentNode.parentNode);
                        //非同期であとからカードリストの正式な状態を更新する
                        updateInitCards(boardId, laneList)
                            .then((updateCardList) => {
                                initCardList = updateCardList
                                //動かす前のカードの情報を取得
                                let preCard = initCardList.filter((initCard) => initCard.id === cardId)[0];
                                if (preCard.position === sectionNames.workingSection && preCard.members.indexOf(userInfo.id) === 0) {
                                    togglCurrent().then(res => {
                                        if (res && JSON.stringify(preCard.labels) !== JSON.stringify(res.tags)) {
                                            console.log('計測中のカードを再計測開始')
                                            togglStart(preCard, projectId)
                                                .then(res => {
                                                    const startStr = `start time: ${res.startDate}`
                                                    push('toggl restart!', startStr);
                                                })
                                        }
                                    })
                                }
                            });
                        return;
                    }

                    // cardじゃないときはスルー
                    if (target.tagName !== "A" || !target.href || !target.parentNode) {
                        return;
                    }

                    //動かしたカードの現在情報を取得
                    let cardId = getCardId(target);
                    let position = target.parentNode.parentNode.querySelector('h2').textContent;

                    //動かす前のカードの情報を取得
                    let preCard = initCardList.filter((initCard) => initCard.id === cardId)[0];

                    //動きがない場合はスルー
                    if (preCard.position === position) {
                        return;
                    }

                    //自分のカードか判定
                    if (preCard.members.indexOf(userInfo.id) === -1) {
                        //一度仮でカードを更新する
                        preCard.position = position;
                        //非同期であとからカードリストの正式な状態を更新する
                        updateInitCards(boardId, laneList)
                             .then((updateCardList) => initCardList = updateCardList);
                        return;
                    }


                    // TODO -> DOING ...toggl start
                    // TODO以外 -> DOING ...toggl start
                    if (position === sectionNames.workingSection) {
                        console.log('card action toggl start')

                        togglStart(preCard, projectId)
                            .then(res => {
                                const startStr = `start time: ${res.startDate}`
                                push('toggl start!', startStr);
                            })
                    }

                    // DOING -> DONE ...toggl stop (finish)
                    // DOING -> DONE以外 ...toggl stop (retire)
                    if (preCard.position === sectionNames.workingSection) {
                        console.log('card action toggl stop')

                        togglCurrent().then(res => {
                            if (res && preCard.name === res.description) {
                                togglStop(res.id).then(res => {
                                    let message = '';
                                    if (position === sectionNames.completedSection) {
                                        message = 'task finish!';
                                    } else {
                                        message = 'task Retire...';
                                    }
                                    const endDuration = `finish time: ${res} second`
                                    push(message, endDuration);
                                });
                            }
                        })
                    }

                    //update initCardList
                    //一度仮でカードを更新する
                    preCard.position = position;
                    //非同期であとからカードリストの正式な状態を更新する
                    updateInitCards(boardId, laneList)
                         .then((updateCardList) => initCardList = updateCardList);
                }
            }
        });
    });

}

/**
 * カード(aタグ)からIDを抽出する
 */
function getCardId(target){
    return target.getAttribute('href').match(/^\/c\/(.+)\/.+/)[1];
}

function push(message, message2) {
    if (Push.Permission.has()) {
        Push.create('togglo', {
            body: message + '\n' + message2,
            icon: 'src/icon/togglo-16.png',
            timeout: 3000, // 通知が消えるタイミング
            vibrate: [100, 100, 100], // モバイル端末でのバイブレーション秒数
            onClick: function () {
                // 通知がクリックされた場合の設定
                this.close();
            }
        });
    }
}

/**
 * initCardListの状態を非同期で最新にする
 * @param {*} boardId 
 * @param {*} laneList 
 */
async function updateInitCards(boardId, laneList) {
    //API callが早すぎるとTrelloの更新が間に合わないのでsleepを入れる
    const _sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    await _sleep(200);
    const cardListByApi = await getCards(boardId);
    let updatedCardList = convertCards(laneList, cardListByApi);
    return updatedCardList;
}

/**
 * return json
 * [{
 *   id:"",
 *   name:"",
 *   position:"",
 *   prePosition:"",
 *   togglId:"",
 *   members:[],
 *   labels:[]
 * }]
 */
function convertCards(lanesByApi, cardListByApi, currentToggl) {
    let convertCards = [];
    cardListByApi.forEach((card) => {
        let position = "";
        let togglId = "";
        lanesByApi.forEach((lane) => {
            if (card.listId === lane.id) {
                position = lane.name;
                if (currentToggl && card.name === currentToggl.description) {
                    togglId = currentToggl.id;
                }
            }
        })
        let labels = [];
        card.labels.forEach(label => {
            labels.push(label.name);
        })
        convertCards.push({ id: card.id, position: position, prePosition: "", togglId: "", members: card.members, labels, name: card.name });
    });
    return convertCards;
}

/**
 * return json
 * {
 *   id:"",
 *   name:""
 * }
 */
async function getBoardInfo(boardId) {
    var userPrefix = await getTrelloPrefix();
    var getBoardInfoSetting = { contentScriptQuery: "getBoardInfo", boardid: boardId, prefix: userPrefix };
    const result = await backgroundFetch(getBoardInfoSetting);
    return result;
}

/**
 * return json
 * [{
 *   id:"",
 *   username:"",
 *   fullName:""
 * }]
 */
async function getMemberList(boardId) {
    var userPrefix = await getTrelloPrefix();
    var getLaneListSetting = { contentScriptQuery: "getMemberList", boardid: boardId, prefix: userPrefix };
    const result = await backgroundFetch(getLaneListSetting);
    return result;
}

/**
 * return json
 * [{
 *   id:"",
 *   name:""
 * }]
 */
async function getLaneList(boardId) {
    var userPrefix = await getTrelloPrefix();
    var getLaneListSetting = { contentScriptQuery: "getLaneList", boardid: boardId, prefix: userPrefix };
    const result = await backgroundFetch(getLaneListSetting);
    return result;
}

/**
 * return json
 * [{
 *   id:"",
 *   name:"",
 *   listId:"",
 *   members:[]
 *   labels:[]
 * }]
 */
async function getCards(boardId) {
    var userPrefix = await getTrelloPrefix();
    var getLaneListSetting = { contentScriptQuery: "getCards", boardid: boardId, prefix: userPrefix };
    const result = await backgroundFetch(getLaneListSetting);
    return result;
}

async function togglStart(card, pid) {
    var items = await getSyncStorageTogglData();
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(items.togglToken + ":api_token")
    };
    var togglStartSetting = { contentScriptQuery: "togglTimerStart", description: card.name, headers: headers, labels: card.labels, pid:pid };
    const result = await backgroundFetch(togglStartSetting);
    return result;
}

async function togglStop(togglId) {
    // toggl
    var items = await getSyncStorageTogglData();
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(items.togglToken + ":api_token")
    };
    var togglStopSetting = { contentScriptQuery: "togglTimerStop", headers: headers, togglId };
    const result = await backgroundFetch(togglStopSetting);
    return result;
}

/**
 * {
 *   id:"",
 *   duration: 0,
 *   start: "",
 *   description?:"",
 *   tags:[]
 * }
 */
async function togglCurrent() {
    // togglConf
    var items = await getSyncStorageTogglData();
    const headers = {
        'Authorization': 'Basic ' + btoa(items.togglToken + ":api_token")
    };
    var togglStatusCheckSetting = { contentScriptQuery: "togglTimerCurrent", headers: headers };
    const result = await backgroundFetch(togglStatusCheckSetting);
    return result;
}

/**
 * {
 *  "id": 5412019,
 *  "wid": 3972388,
 * }
 */
async function myTogglInfo() {
    // togglConf
    var items = await getSyncStorageTogglData();
    const headers = {
        'Authorization': 'Basic ' + btoa(items.togglToken + ":api_token")
    };
    var myTogglInfoSetting = { contentScriptQuery: "getMyTogglInfo", headers: headers };
    const result = await backgroundFetch(myTogglInfoSetting);
    return result;
}

/**
 * [{
 *  "id": 5412019,
 *  "name": "project name",
 *  "wid": 11122,
 * }]
 */
async function getTogglProjects(wid) {
    // toggl
    var items = await getSyncStorageTogglData();
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(items.togglToken + ":api_token")
    };
    var togglProjectsSetting = { contentScriptQuery: "getTogglProjects", headers: headers, wid };
    const result = await backgroundFetch(togglProjectsSetting);
    return result;
}

/**
 * {
 *  "id": 5412019,
 *  "name": "project name",
 *  "wid": 11122,
 * }
 */
async function createTogglProject(boardName) {
    var items = await getSyncStorageTogglData();
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(items.togglToken + ":api_token")
    };
    var createTogglProjectSetting = { contentScriptQuery: "createTogglProject", headers: headers, projectName: boardName};
    const result = await backgroundFetch(createTogglProjectSetting);
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

async function getSectionNames() {
    const sectionNames = await getSyncStorageSectionData();
    return sectionNames;
}

function getSyncStorageSectionData() {
    return new Promise(function (resolve) {
        chrome.storage.sync.get(["waitingSection", "workingSection", "completedSection"],
            function (items) {
                resolve(items);
            });
    });
}

async function getTrelloPrefix() {
    var trelloConf = await getSyncStorageTrelloData();
    return '?key=' + trelloConf.trelloKey + '&token=' + trelloConf.trelloToken;
}

function getSyncStorageTrelloData() {
    return new Promise(function (resolve) {
        chrome.storage.sync.get(["trelloKey", "trelloToken"],
            function (items) {
                resolve(items);
            });
    });
}

function getSyncStorageTogglData() {
    return new Promise(function (resolve) {
        chrome.storage.sync.get(["togglToken"],
            function (items) {
                resolve(items);
            });
    });
}

async function getProjectId() {
    const result = await getSyncStorageTogglProjectId();
    return parseInt(result.togglProjectId);
}

function getSyncStorageTogglProjectId() {
    return new Promise(function (resolve) {
        chrome.storage.sync.get(["togglProjectId"],
            function (items) {
                resolve(items);
            });
    });
}