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
        document.querySelector("#searchbar").focus();
    }, 150);
};

var highlightedURLs = [];
var bookmarkFolders = [];
var activeTabURL = "";
var searchValue;

async function renderSearch(e) {
    // console.log("Input!")

    var search = {
        name: "search",
        value: e.target.value
    };
    await browser.storage.local.set({ search });

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

    console.log(body.childNodes);
    console.log(bookmarkFolders);
    
    for (let i = 0; i < bookmarkFolders.length; i++) {
        // Gets active tab URL
        await browser.tabs.query({currentWindow: true, active: true}).then((tabs) => {
            activeTabURL = tabs[0].url;
        }, console.error);
        console.log(`Active tab url: ${activeTabURL}`);

        // Gets children of folder that is a bookmark
        childrenBookmarks = await getChildrenBookmarks(bookmarkFolders[i].id);

        body.innerHTML += `
            <div class='row' id='${bookmarkFolders[i].id}'>
                <img src="/icons/folder.svg"/>
                <p title='${bookmarkFolders[i].title}' class='${
                    isUrlInArrayOfBookmarks(activeTabURL, childrenBookmarks) ?
                    'already-bookmarked' : ''
                }'>
                    ${bookmarkFolders[i].title}
                </p>
            </div>
        `;

        folder = document.querySelector('#' + CSS.escape(bookmarkFolders[i].id));
        folder.id = bookmarkFolders[i].id;
    }

    // ! Have to reimplement event listener as innerHTML removes existing event listeners under the affected element or its descendents
    document.querySelector("#searchbar").addEventListener("input", renderSearch);
    document.querySelectorAll('.row').forEach(folder => folder.addEventListener('click', createBookmark))

    browser.storage.local.get("search").then((item) => {
        console.log(item.search.value)
        searchValue = item.search.value;
        document.querySelector("#searchbar").value = searchValue;
        document.querySelector("#searchbar").focus();
    }, onError);

    
}

function getHighlightedTabs(tabs) {
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

async function createBookmark(evt) {
    parentId = evt.currentTarget.id;
    var childrenBookmarks;

    console.log(parentId);

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

        body.innerHTML += `
            <div class='row' id='${bookmarkFolders[i].id}'>
                <img src="/icons/folder.svg"/>
                <p title='${bookmarkFolders[i].title}' class='${
                    isUrlInArrayOfBookmarks(activeTabURL, childrenBookmarks) ?
                    'already-bookmarked' : ''
                }'>
                    ${bookmarkFolders[i].title}
                </p>
            </div>
        `;

        folder = document.querySelector('#' + CSS.escape(bookmarkFolders[i].id));
        folder.id = bookmarkFolders[i].id;
    }

    document.querySelectorAll('.row').forEach(folder => folder.addEventListener('click', createBookmark))
}

main();


