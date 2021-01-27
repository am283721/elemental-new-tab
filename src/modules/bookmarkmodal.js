import Modal from "./modal.js";
import { getById } from "./utils.js";

export default class BookmarkModal extends Modal {

    constructor(...args) {
        super(...args);
        this.selectedBookmark = null;
        this.MAX_TITLE_LENGTH = 70;

        getById('searchBookmarksInput').addEventListener('input', event => {
            this.filterBookmarks(event.target.value.toLowerCase());
        });
    }

    show() {
        super.show();
        this.loadBookmarksFromChrome();
        getById('topSitesTabBtn').click();
    }

    hide() {
        this.setMessage('');

        if (this.selectedBookmark) {
            this.selectedBookmark.classList.remove('selectedChromeBookmark');
            this.selectedBookmark = undefined;
        }

        this.removeChildren(getById('topSitesList'));
        this.removeChildren(getById('chromeBookmarks'));
        getById('searchBookmarksInput').value = '';
        this.removeChildren(getById('recentBookmarksList'));
        super.hide();
    }

    save() {
        if (this.selectedBookmark) {
            getById('editNameInput').value = this.selectedBookmark.getAttribute('data-bookmarkname');
            getById('editUrlInput').value = this.selectedBookmark.title;
            this.hide();
        } else {
            this.setMessage('No bookmark selected');
        }
    }

    changeTab(tab) {
        super.changeTab(tab);

        if (this.selectedBookmark) {
            this.selectedBookmark.classList.remove('selectedChromeBookmark');
            this.selectedBookmark = undefined;
        }
    }

    loadBookmarksFromChrome() {
        chrome.bookmarks.getRecent(10, recentBookmarks => {
            this.appendChromeBookmarks(recentBookmarks, getById('recentBookmarksList'));
        });

        chrome.topSites.get(topSites => {
            this.appendChromeBookmarks(topSites, getById('topSitesList'));
        });

        chrome.bookmarks.getTree(bookmarkTreeNodes => {
            if (bookmarkTreeNodes.length) {
                getById('chromeBookmarks').append(this.getTreeNodes(bookmarkTreeNodes[0].children, true));
            }
        });
    }

    appendChromeBookmarks(bookmarks, targetEl) {
        for (let bookmark of bookmarks) {
            let item = document.createElement('li');
            item.textContent = bookmark.title.length > this.MAX_TITLE_LENGTH ? bookmark.title.substr(0, this.MAX_TITLE_LENGTH) + '...' : bookmark.title;
            item.title = bookmark.url;
            item.setAttribute('data-bookmarkname', bookmark.title);
            item.classList.add('bookmarkUrl');
            item.onclick = event => this.chromeBookmarkClicked(event.target);
            targetEl.appendChild(item);
        }
    }

    chromeBookmarkClicked(newBookmark) {
        if (newBookmark === this.selectedBookmark) {
            return;
        }

        newBookmark.classList.add('selectedChromeBookmark');

        if (this.selectedBookmark) {
            this.selectedBookmark.classList.remove('selectedChromeBookmark');
        }

        this.selectedBookmark = newBookmark;
        this.setMessage('');
    }

    filterBookmarks(filter) {
        let bookmarks = getById('chromeBookmarks').getElementsByTagName('li');

        for (let bookmark of bookmarks) {

            // Skip folders
            if (!bookmark.title.length) {
                continue;
            }

            if (bookmark.title.toLowerCase().indexOf(filter) !== -1 ||
                bookmark.getAttribute('data-bookmarkname').toLowerCase().indexOf(filter) !== -1) {
                bookmark.parentElement.classList.add('show');
                bookmark.style.display = 'block';
            } else {
                bookmark.style.display = 'none';
            }
        }
    }

    getTreeNodes(bookmarkNodes, isFirstNode) {
        let list = document.createElement('ul');

        if (isFirstNode) {
            list.classList.add('firstBookmarkNode');
        } else {
            list.classList.add('collapse');
        }

        for (let node of bookmarkNodes) {
            list.append(this.getNode(node));
        }
        return list;
    }

    getNode(bookmarkNode) {
        let li = document.createElement(bookmarkNode.title ? 'li' : 'div');

        // Highest level in tree contains no title, only list of child folders
        if (bookmarkNode.title) {
            let name = bookmarkNode.title.length > this.MAX_TITLE_LENGTH ? bookmarkNode.title.substr(0, this.MAX_TITLE_LENGTH) + '...' : bookmarkNode.title;
            li.textContent = name;

            // If url attribute exists, it's a bookmark, otherwise it's a folder
            if (bookmarkNode.url) {
                li.setAttribute('title', bookmarkNode.url);
                li.setAttribute('data-bookmarkname', bookmarkNode.title);
                li.classList.add('bookmarkUrl');
                li.onclick = event => this.chromeBookmarkClicked(event.target);
            } else {
                li.classList.add('collapseHeading');
                li.onclick = (event) => {
                    if (event.target.firstElementChild && event.target === event.currentTarget) {
                        event.target.firstElementChild.classList.toggle('show');
                        return true;
                    }
                };

            }
        }

        if (bookmarkNode.children && bookmarkNode.children.length > 0) {
            li.append(this.getTreeNodes(bookmarkNode.children));
        }
        return li;
    }
}
