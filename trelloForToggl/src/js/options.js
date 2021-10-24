// Saves options to chrome.storage
function save_options() {
    var waitingSection = document.querySelector('[name="waiting"]').value;
    var workingSection = document.querySelector('[name="working"]').value;
    var completedSection = document.querySelector('[name="completed"]').value;
    var trelloKey = document.querySelector('[name="trello-key"]').value;
    var trelloToken = document.querySelector('[name="trello-token"]').value;
    var togglToken = document.querySelector('[name="toggl-token"]').value;
    var togglProjectId = document.querySelector('[name="toggl-projectid"]').value;

    chrome.storage.sync.set({
        "waitingSection": waitingSection ? waitingSection : "",
        "workingSection": workingSection ? workingSection : "",
        "completedSection": completedSection ? completedSection : "",
        "trelloKey": trelloKey ? trelloKey : "",
        "trelloToken": trelloToken ? trelloToken : "",
        "togglToken": togglToken ? togglToken : "",
        "togglProjectId": togglProjectId ? togglProjectId : ""
    }, function () {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function () {
            status.textContent = '';
        }, 750);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    // Use default value color = 'red' and likesColor = true.
    chrome.storage.sync.get([
        "waitingSection",
        "workingSection",
        "completedSection",
        "trelloKey",
        "trelloToken",
        "togglToken",
        "togglProjectId"
    ], function (items) {
        document.querySelector('[name="waiting"]').value = items.waitingSection ? items.waitingSection : "";
        document.querySelector('[name="working"]').value = items.workingSection ? items.workingSection : "";
        document.querySelector('[name="completed"]').value = items.completedSection ? items.completedSection : "";
        document.querySelector('[name="trello-key"]').value = items.trelloKey ? items.trelloKey : "";
        document.querySelector('[name="trello-token"]').value = items.trelloToken ? items.trelloToken : "";
        document.querySelector('[name="toggl-token"]').value = items.togglToken ? items.togglToken : "";
        document.querySelector('[name="toggl-projectid"]').value = items.togglProjectId ? items.togglProjectId : "";
    });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('[name="save"]').addEventListener('click', save_options);