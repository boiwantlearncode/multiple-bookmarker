/*

DEVELOPER REFERENCE
- bookmarkFolders: BookmarkTreeNodeType[]
    - relevant properties
        - id
        - type
        - title
        - url (only if not folder)

Workflow:
(1) about:debugging
(2) To view logs, click 'inspect' beside the extension

Submission:
(1) Update manifest.json version
(2) Zip the 4 files & folders inside main directory, not the directory itself

*/

window.onload = function() {
    setTimeout(() => {
        document.querySelector("#searchbar").addEventListener("input", renderSearch);
        document.querySelector("#searchbar").addEventListener("keydown", preventResetTextCursor);
        document.querySelector("#searchbar").focus();
    }, 150);
};

window.addEventListener("keydown", (e) => {
    switch (e.key) {
        case "Enter":
            console.log("Enter");
            createBookmark(selectedFolder);
            break;
        case "ArrowUp":
            moveSelected("UP");
            console.log("Arrow up");
            break;
        case "ArrowDown":
            moveSelected("DOWN");
            console.log("Arrow down");
            break;
    }
});

var highlightedURLs = [];
var bookmarkFolders = [];
var activeTabURL = "";
var searchValue;
var selectedFolder;
var selectedFolderIndex = 0;

function preventResetTextCursor(e) {
    switch (e.key) {
        case "ArrowUp":
            e.preventDefault();
            break;
        case "ArrowDown":
            e.preventDefault();
            break;
    }
}

function moveSelected(direction) {
    // Get bookmarkFolders displayed. Get current selectedFolder index.
    var DOMfolders = document.querySelectorAll('.row');
    switch (direction) {
        case "UP":
            if (selectedFolderIndex > 0) {
                DOMfolders[selectedFolderIndex].classList.remove("selected");
                DOMfolders[--selectedFolderIndex].classList.add("selected");
            }
            break;
        case "DOWN":
            if (selectedFolderIndex < DOMfolders.length - 1) {
                DOMfolders[selectedFolderIndex].classList.remove("selected");
                DOMfolders[++selectedFolderIndex].classList.add("selected");
            }
            break;
        case "RESET":
            DOMfolders[selectedFolderIndex].classList.remove("selected");
            DOMfolders[0].classList.add("selected");
            selectedFolderIndex = 0;
            break;
    }
    selectedFolder = DOMfolders[selectedFolderIndex];
}

async function renderSearch(e) {
    var search = {
        name: "search",
        value: e.target.value
    };

    console.log("renderSearch function called.")
    await getBookmarkFolders(e.target.value);
    // console.log(bookmarkFolders);

    await browser.tabs.query({currentWindow: true, highlighted: true}).then(getHighlightedTabs, onError);
    // console.log(highlightedURLs);
    
    // DOM
    var body = document.querySelector("body");
    var childrenBookmarks;
    console.log(body.childNodes);

    // Clear previous search results
    while (body.lastChild.id !== "searchbar") {
        body.removeChild(body.lastChild);
    }

    while (body.firstChild.id !== "searchbar") {
        body.removeChild(body.firstChild);
    }

    
    for (let i = 0; i < bookmarkFolders.length; i++) {
        // Gets active tab URL
        await browser.tabs.query({currentWindow: true, active: true}).then((tabs) => {
            activeTabURL = tabs[0].url;
        }, console.error);
        console.log(`Active tab url: ${activeTabURL}`);
        
        // Gets children of folder that is a bookmark
        childrenBookmarks = await getChildrenBookmarks(bookmarkFolders[i].id);
        
        body.insertAdjacentHTML(
            "beforeend",
            `
                <div class='row ${
                    selectedFolderIndex == i ?
                    'selected' : ''
                }' id='${bookmarkFolders[i].id}'>
                    <img src="/icons/folder.svg"/>
                    <p title='${bookmarkFolders[i].title}' class='${
                        isUrlInArrayOfBookmarks(activeTabURL, childrenBookmarks) ?
                        'already-bookmarked' : ''
                    }'>
                        ${bookmarkFolders[i].title}
                    </p>
                </div>
            `
        );
        
        folder = document.querySelector('#' + CSS.escape(bookmarkFolders[i].id));
        folder.id = bookmarkFolders[i].id;
    }
    
    // document.querySelector("#searchbar").addEventListener("input", renderSearch);
    document.querySelectorAll('.row').forEach((folder, index) => {
        // For KEYPRESS = ENTER
        if (index == 0) {
            selectedFolder = folder;
            selectedFolderIndex = 0;
        }
        folder.addEventListener('click', evtCreateBookmark)
    });
    moveSelected("RESET");
    
}

function getHighlightedTabs(tabs) {
    highlightedURLs = [];
    for (const tab of tabs) {
      highlightedURLs.push(tab);
    }
}

function onError(error) {
    console.error(error);
}

async function getBookmarkFolders(query) {
    await browser.bookmarks.search({}).then((result) => {
        bookmarkFolders = result.filter(node => (node.type == "folder" && node.title != "tags" && node.title != "Mobile Bookmarks" && node.title.toLowerCase().includes(query.toLowerCase())));
    }, onError);
}

async function getChildrenBookmarks(folderId) {
    var array;

    await browser.bookmarks.getChildren(folderId).then(result => {
        array = result.filter(node => (node.type == "bookmark"));
    }, onError);

    return array
}

function isUrlInArrayOfBookmarks(url, folder) {
    return folder.some(bookmark => bookmark.url == url)
}

async function evtCreateBookmark(evt) {
    createBookmark(evt.currentTarget)
}

async function createBookmark(selectedFolder) {
    parentId = selectedFolder.id;
    selectedFolder.querySelector('p').classList.add("already-bookmarked");
    var childrenBookmarks;
    console.log("createBookmark called");

    // Gets children of folder that is a bookmark
    childrenBookmarks = await getChildrenBookmarks(parentId);

    for (let i = 0; i < highlightedURLs.length; i++) {
        // Checks for duplicate and will continue to next element
        duplicateExists = isUrlInArrayOfBookmarks(highlightedURLs[i].url, childrenBookmarks)
        if (duplicateExists) {
            console.log("There is a duplicate.");
            continue
        }

        // Bookmark creation
        browser.bookmarks.create({
            title: highlightedURLs[i].title,
            url: highlightedURLs[i].url,
            parentId: parentId
        });
        console.log("Bookmarked!");
    }
}

async function main() {
    await getBookmarkFolders("");
    // console.log(bookmarkFolders);

    await browser.tabs.query({currentWindow: true, highlighted: true}).then(getHighlightedTabs, onError);
    // console.log(highlightedURLs);
    
    // DOM
    var body = document.querySelector("body");
    var childrenBookmarks;

    for (let i = 0; i < bookmarkFolders.length; i++) {
        // Gets active tab URL
        await browser.tabs.query({currentWindow: true, active: true}).then((tabs) => {
            activeTabURL = tabs[0].url;
        }, console.error);
        console.log(`Active tab url: ${activeTabURL}`);

        // Gets children of folder that is a bookmark
        childrenBookmarks = await getChildrenBookmarks(bookmarkFolders[i].id);

        body.insertAdjacentHTML(
            "beforeend",
            `
                <div class='row ${
                    selectedFolderIndex == i ?
                    'selected' : ''
                }' id='${bookmarkFolders[i].id}'>
                    <img src="/icons/folder.svg"/>
                    <p title='${bookmarkFolders[i].title}' class='${
                        isUrlInArrayOfBookmarks(activeTabURL, childrenBookmarks) ?
                        'already-bookmarked' : ''
                    }'>
                        ${bookmarkFolders[i].title}
                    </p>
                </div>
            `
        );

        folder = document.querySelector('#' + CSS.escape(bookmarkFolders[i].id));
        folder.id = bookmarkFolders[i].id;
    }
    console.log("Main called");

    // document.querySelectorAll('.row').forEach(folder => folder.addEventListener('click', evtCreateBookmark));
    document.querySelectorAll('.row').forEach((folder, index) => {
        // For KEYPRESS = ENTER
        if (index == 0) {
            selectedFolder = folder;
            selectedFolderIndex = 0;
        }
        folder.addEventListener('click', evtCreateBookmark)
    });
}

main();


