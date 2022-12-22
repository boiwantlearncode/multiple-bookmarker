var highlightedURLs = [];
var bookmarkFolders = [];

function getHighlightedTabs(tabs) {
    for (const tab of tabs) {
      highlightedURLs.push(tab);
    }
}

function onError(error) {
    console.error(error);
}

async function getBookmarkFolders() {
    await browser.bookmarks.search({}).then((result) => {
        bookmarkFolders = result.filter(node => (node.type == "folder" && node.title != "tags" && node.title != "Mobile Bookmarks"));
    }, onError);
}

async function createBookmark(evt) {
    parentId = evt.currentTarget.id;
    var childrenBookmarks;

    console.log(parentId);
    await browser.bookmarks.getChildren(parentId).then(result => {
        childrenBookmarks = result.filter(node => (node.type == "bookmark"));
    }, onError);
    console.log(childrenBookmarks);


    for (let i = 0; i < highlightedURLs.length; i++) {
        // Checks for duplicate and will continue to next element
        duplicateExists = childrenBookmarks.some(bookmark => bookmark.url == highlightedURLs[i].url);
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
    await getBookmarkFolders();
    // console.log(bookmarkFolders);

    await browser.tabs.query({currentWindow: true, highlighted: true}).then(getHighlightedTabs, onError);
    // console.log(highlightedURLs);
    
    // DOM
    var body = document.querySelector("body");

    for (let i = 0; i < bookmarkFolders.length; i++) {
        body.innerHTML += `
            <div class='row' id='${bookmarkFolders[i].id}'>
                <img src="/icons/folder.svg"/>
                <p>${bookmarkFolders[i].title}</p>
            </div>
        `;
        folder = document.querySelector('#' + CSS.escape(bookmarkFolders[i].id));
        folder.id = bookmarkFolders[i].id;
    }

    document.querySelectorAll('.row').forEach(folder => folder.addEventListener('click', createBookmark))
}

main();


