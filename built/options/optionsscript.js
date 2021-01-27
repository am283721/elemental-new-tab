(function () {
    'use strict';

    function getById(id) { return document.getElementById(id); }

    function showElement(el) { el.style.display = 'block'; }

    function hideElement(el) { el.style.display = 'none'; }

    function loadImageFromUrl(url) {
        return getViaXhr(url, 'blob')
            .then((response) => {
                if (response.type.indexOf('image') === -1) {
                    throw new Error('Data loaded is not an image. Make sure URL points to an image file.');
                }

                return readFile(response);
            });
    }

    function getViaXhr(url, responseType) {
        return new Promise((resolve, reject) => {
            let request = new XMLHttpRequest();
            request.responseType = responseType;
            request.open('GET', url, true);

            request.onload = function () {
                if (this.status >= 200 && this.status < 300) {
                    resolve(this.response);
                } else {
                    reject({
                        status: this.status,
                        statusText: this.statusText
                    });
                }
            };

            request.onerror = function () {
                reject({
                    status: this.status,
                    statusText: this.statusText
                });
            };

            request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            request.send();
        });
    }

    function readFile(file) {
        return new Promise(function (resolve, reject) {
            let reader = new FileReader();

            reader.onload = function () {
                resolve(reader.result);
            };

            reader.onerror = function () {
                reject(reader.error);
            };

            reader.readAsDataURL(file);
        });
    }

    var dragSrcEl = null,
        draggingId = null;

    function handleDragStart(e) {
        dragSrcEl = this;
        e.dataTransfer.effectAllowed = 'move';
        this.classList.add('dragging');
        e.dataTransfer.setData('text/plain', e.target.id);
        e.dataTransfer.setDragImage(this, 45, 45);
        document.getElementById('editBookmarkMenu').style.display = 'none';
    }

    function handleDragOver(e) {
        if (e.preventDefault) { e.preventDefault(); }
    }

    function handleDragEnter(e) {
        if (dragSrcEl !== this && this.tagName !== 'button') {
            var insertOrder;
            var targetId = parseInt(this.id);
            e.dataTransfer.dropEffect = 'move';
            if ((draggingId || dragSrcEl.id) > targetId) {
                insertOrder = 'beforebegin';
                draggingId = targetId - 0.5;
            } else {
                insertOrder = 'afterend';
                draggingId = targetId + 0.5;
            }
            this.insertAdjacentElement(insertOrder, dragSrcEl);
        }
        return false;
    }

    function handleDragLeave() { return false; }

    function handleDrop(e) { if (e.stopPropagation) { e.stopPropagation(); } }

    function handleDragEnd() {
        dragSrcEl.classList.remove('dragging');
        updateSortingIds();
        draggingId = null;

        let event = new CustomEvent("dragend");
        document.dispatchEvent(event);
    }

    function addDnDHandlers(elem) {
        elem.setAttribute('draggable', true);
        elem.addEventListener('dragstart', handleDragStart);
        elem.addEventListener('dragenter', handleDragEnter);
        elem.addEventListener('dragover', handleDragOver);
        elem.addEventListener('dragleave', handleDragLeave);
        elem.addEventListener('drop', handleDrop);
        elem.addEventListener('dragend', handleDragEnd);
    }

    function updateSortingIds() {
        let bookmarks = document.getElementById('bookmarkList').getElementsByClassName('draggableIcon');
        for (let i = 0; i < bookmarks.length; i++) {
            bookmarks[i].id = i;
        }
    }

    function makeSortable(elements) {
        updateSortingIds();

        if (Array.isArray(elements)) {
            elements.forEach(addDnDHandlers);
        } else {
            addDnDHandlers(elements);
        }
    }

    class Modal {
        constructor(el) {
            this.el = el;
            this.addEventListeners();
        }

        addEventListeners() {
            this.el.querySelector('.modalClose').addEventListener('click', () => this.hide());
            this.el.querySelector('.modalCancel').addEventListener('click', () => this.hide());
            this.el.querySelector('.modalSave').addEventListener('click', () => this.save());

            let tabs = this.el.getElementsByClassName('tablinks');

            for (let tab of tabs) {
                tab.addEventListener('click', () => this.changeTab(tab));
            }
        }

        save() { }

        hide() {
            this.setMessage('');
            hideElement(this.el);
        }

        show() {
            showElement(this.el);
            this.el.querySelector('.modalSave').focus();
        }

        setMessage(msg = '') {
            this.el.querySelector('.modalMessage').innerText = msg;
        }

        changeTab(tab) {
            let activeTabs = this.el.getElementsByClassName('activeTab');

            if (activeTabs.length) {
                hideElement(getById('' + activeTabs[0].getAttribute('data-content')));
                activeTabs[0].classList.remove('activeTab');
            }

            showElement(getById('' + tab.getAttribute('data-content')));
            tab.classList.add('activeTab');
            this.setMessage('');
        }

        disableSaveButton() {
            this.el.querySelector('.modalSave').disabled = true;
        }

        enableSaveButton() {
            this.el.querySelector('.modalSave').disabled = false;
        }

        removeChildren(parentElement) {
            while (parentElement.lastChild) {
                parentElement.removeChild(parentElement.lastChild);
            }
        }
    }

    class BackgroundModal extends Modal {

        constructor(...args) {
            super(...args);
            getById('uploadImageInput').addEventListener('change', () => this.uploadImageInputChange());
            getById('imageFromUrlInput').addEventListener('keypress', (event) => {
                this.setMessage('');

                if (event.key === 'Enter') {
                    this.save();
                }
            });
        }

        save() {
            let activeTabs = this.el.getElementsByClassName('activeTab');
            this.setMessage('');

            if (activeTabs.length) {
                if (activeTabs[0].id === 'backgroundFromComputerTabBtn') {
                    let imageInput = getById('uploadImageInput');

                    if (!imageInput.files.length) {
                        this.setMessage('No file selected...');
                    }
                    else {
                        this.disableSaveButton();
                        this.uploadBackgroundImage(imageInput.files[0]);
                    }
                } else {
                    let url = getById('imageFromUrlInput').value;

                    if (!url || !url.length) {
                        this.setMessage('No url specified...');
                    }
                    else {
                        this.disableSaveButton();
                        this.loadBackgroundImgFromUrl(url);
                    }
                }
            }
        }

        uploadImageInputChange() {
            let imageInput = getById('uploadImageInput');
            if (imageInput.files.length) {
                this.setMessage('');
            }
        }

        async uploadBackgroundImage(file) {
            readFile(file)
                .then(result => {
                    this.enableSaveButton();
                    this.hide();

                    let event = new CustomEvent("backgroundchange", { "detail": result });
                    document.dispatchEvent(event);
                })
                .catch(() => {
                    this.enableSaveButton();
                    this.setMessage('Error occurred while trying to upload image. Please try again.');
                });
        }

        loadBackgroundImgFromUrl(url) {
            this.showLoadingMessage();

            loadImageFromUrl(url)
                .then(result => {
                    this.hide();

                    let event = new CustomEvent("backgroundchange", { "detail": result });
                    document.dispatchEvent(event);
                })
                .catch(() => {
                    this.setMessage('Loading image from URL failed. Make sure URL points to an image file.');
                })
                .finally(() => {
                    this.enableSaveButton();
                    this.hideLoadingMessage();
                });
        }

        showLoadingMessage() {
            getById('loadingUrlMessage').style.display = 'block';
        }

        hideLoadingMessage() {
            getById('loadingUrlMessage').style.display = 'none';
        }
    }

    class IconModal extends Modal {
        constructor(...args) {
            super(...args);

            this.selectedIcon = null;

            getById('uploadIconInput').addEventListener('change', () => this.uploadIcon());
            getById('scanIconBtn').addEventListener('click', () => this.getFavIcons());
            getById('searchIconInput').addEventListener('input', event => this.filterIconLibrary(event.target.value.toLowerCase()));
        }

        show() {
            super.show();
            let src = getById('editIconPreview').src;

            // TODO: Try to truncate to base URL of site
            getById('scanIconInput').value = getById('editUrlInput').value;
            getById('modalIconPreview').src = src;
            getById('modalIconBackground').src = src;
            getById('libraryTabBtn').click();
        }

        changeTab(tab) {
            super.changeTab(tab);
            this.deselectIcon();
        }

        getFavIcons() {
            let url = getById('scanIconInput').value;
            let scanResultsContainer = getById('scanResultsContainer');

            function toggleScanButton() {
                let scanSiteBtn = getById('scanIconBtn');
                scanSiteBtn.disabled = !scanSiteBtn.disabled;
            }

            function setScanMessage(msg) {
                let messageDiv = getById('scanMessage');
                messageDiv.innerText = msg;
            }


            scanResultsContainer.innerHTML = '';
            setScanMessage('Scanning site for icons. Please wait.');
            toggleScanButton();

            this.scanSiteForFavIcon(url)
                .then(icons => {
                    for (let i = 0; i < icons.length; i++) {
                        let iconElement = document.createElement('img');
                        iconElement.className = 'scannedIcon';
                        iconElement.src = icons[i];
                        iconElement.alt = 'icon' + i;
                        iconElement.onclick = () => this.iconClicked(iconElement);
                        scanResultsContainer.appendChild(iconElement);
                    }

                    setScanMessage('Done');
                })
                .catch(e => setScanMessage(e))
                .finally(() => {
                    toggleScanButton();
                });
        }

        scanSiteForFavIcon(siteUrl) {
            const isImage = new RegExp(/\.(gif|jpe?g|tiff|png|ico|svg)$/i);
            const isAbsoluteUrl = new RegExp('^(?:[a-z]+:)?//', 'i');

            async function getSiteHead(siteUrl) {
                if (!siteUrl || !siteUrl.length) {
                    throw new Error('Url not specified');
                }
                // TODO: Twitter was returning null response. Changing response type from 
                // 'document' to 'text' worked but requires additional processing of response
                let site = await getViaXhr(siteUrl, 'document').catch((e) => { throw new Error('Error retrieving data from remote site.'); });

                return site.head;
            }

            function linkIsIcon(linkEl) {
                return (linkEl.rel.indexOf('icon') !== -1 || linkEl.href.indexOf('favicon') !== -1) && isImage.test(linkEl.href);
            }

            function formatIconUrl(href) {
                if (isAbsoluteUrl.test(href)) {
                    return href;
                } else {
                    return siteUrl + href;
                }
            }

            function findIconsInHead(headData) {
                let links = headData.getElementsByTagName('link');
                let returnedIcons = [];

                for (let link of links) {
                    if (linkIsIcon(link)) {
                        returnedIcons.push(formatIconUrl(link.href));
                    }
                }

                if (!returnedIcons.length) {
                    throw new Error('No icons found');
                }

                return returnedIcons;
            }

            async function loadIconImages(iconUrls) {
                let promises = [];

                for (let iconUrl of iconUrls) {
                    promises.push(new Promise((resolve) => {
                        loadImageFromUrl(iconUrl)
                            .then(resolve)
                            .catch(() => resolve(null));
                    }));
                }

                let images = await Promise.all(promises);

                return images.filter(image => !!image);
            }

            return getSiteHead(siteUrl)
                .then(findIconsInHead)
                .then(loadIconImages);
        }

        uploadIcon() {
            let iconInput = getById('uploadIconInput');

            if (iconInput.files.length) {
                let file = iconInput.files[0];
                readFile(file)
                    .then(result => {
                        getById('modalIconPreview').src = result;
                        getById('modalIconBackground').src = result;
                    })
                    .catch(() => {
                        this.setMessage('Failed to upload icon. Please try again');
                    });
            }
        }

        save() {
            if (getById('uploadTabBtn').classList.contains('activeTab')) {
                this.selectedIcon = getById('modalIconPreview');
            }

            if (!this.selectedIcon) {
                this.setMessage('No icon selected');
                return;
            }

            getById('editIconPreview').src = this.selectedIcon.src;
            this.closeIconModal();
        }

        iconClicked(newIcon) {
            newIcon.classList.add('selectedIcon');

            if (this.selectedIcon) {
                this.selectedIcon.classList.remove('selectedIcon');
            }

            this.selectedIcon = newIcon;
            this.setMessage('');
        }

        deselectIcon() {
            if (this.selectedIcon) {
                this.selectedIcon.classList.remove('selectedIcon');
                this.selectedIcon = undefined;
            }
        }

        filterIconLibrary(filter) {
            let icons = getById('iconLibraryContainer').children;

            for (let icon of icons) {
                this.toggleIcon(icon, icon.alt.toLowerCase().indexOf(filter) !== - 1);
            }
        }

        toggleIcon(el, toShow) {
            if (toShow) { showElement(el); }
            else { hideElement(el); }
        }

        closeIconModal() {
            this.setMessage('');
            this.deselectIcon();
            getById('searchIconInput').value = '';
            this.removeChildren(getById('scanResultsContainer'));
            this.filterIconLibrary('');
            this.hide();
        }
    }

    class BookmarkModal extends Modal {

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

    let defaultIconUrl = '';
    let successTimer = null;
    let newBackgroundModal, iconModal, bookmarkModal, currentBookmark;

    async function onPageLoad() {
      newBackgroundModal = new BackgroundModal(getById('newBackgroundModal'));
      iconModal = new IconModal(getById('iconModal'));
      bookmarkModal = new BookmarkModal(getById('bookmarkModal'));

      checkPermissions();
      await loadDataFromStorage();
      addEventListeners();

      getById('newBookmarkBtn').classList.add(getBookmarkShapeCls());
      getById('modalIconPreview').classList.add(getBookmarkShapeCls());
    }

    function newListener(elementID, event, func) {
      getById(elementID).addEventListener(event, func);
    }

    function addEventListeners() {
      newListener('newBackgroundButton', 'click', () => newBackgroundModal.show());
      newListener('importBookmarkBtn', 'click', () => bookmarkModal.show());
      newListener('editIconBtn', 'click', () => iconModal.show());
      newListener('deleteBookmarkBtn', 'click', deleteBookmark);
      newListener('cancelEditBookmarkBtn', 'click', hideEditBookmarkMenu);
      newListener('saveBookmarkBtn', 'click', saveBookmark);
      newListener('newBookmarkBtn', 'click', function () { showEditBookmarkMenu(this, true); });
      newListener('restoreButton', 'click', restoreDefaultImage);
      document.addEventListener('dragend', () => saveBookmarks());
      document.addEventListener('backgroundchange', (ev) => onBackgroundChange(ev));

      let dropdowns = document.getElementsByClassName('setting-select');

      for (let dropdown of dropdowns) {
        newListener(dropdown.id, 'change', dropdownChange);
      }

      document.addEventListener('click', function (event) {
        if (event.target.closest('#editBookmarkMenu, .draggableIcon, #newBookmarkBtn, #iconModal, #bookmarkModal, #newBackgroundModal')) {
          return;
        }
        hideEditBookmarkMenu();
      });
    }

    function dropdownChange() {
      chrome.storage.local.set({ [this.getAttribute('data-setting')]: this.value });
      showSuccessAlert();

      if (this.id === 'backgroundPositionSelect') {
        getById('bgPreviewContainer').style.backgroundPositionY = this.value;
      }
      else if (this.id === 'backgroundSizeSelect') {
        getById('bgPreviewContainer').style.backgroundSize = this.value;
      }
      else if (this.id === 'bookmarkShapeSelect') {
        let previousCls = this.value === 'circle' ? 'icon-square' : 'icon-circle';
        let newCls = `icon-${this.value}`;
        let icons = document.getElementsByClassName(previousCls);

        while (icons.length) {
          icons[0].classList.add(newCls);
          icons[0].classList.remove(previousCls);
        }
      }
    }

    /*
    *     checkPermissions Function - Scanning a remote site for icons requires additional
    *     permissions. If we have them, show the scan button, if not show the get permissions
    *     button to prompt the user
    */
    function checkPermissions() {
      let scanDiv = getById('scanDiv');
      let urlPermissionDiv = getById('urlPermissionDiv');
      let getPermissionBtn = getById('getUrlPermission');

      chrome.permissions.contains({ origins: ['<all_urls>'] }, function (hasPermission) {
        if (hasPermission) { hideElement(urlPermissionDiv); }
        else {
          hideElement(scanDiv);
          getPermissionBtn.addEventListener('click', function () {
            chrome.permissions.request({ origins: ['<all_urls>'] }, function (granted) {
              if (granted) {
                showElement(scanDiv);
                hideElement(urlPermissionDiv);
              }
            });
          });
        }
      });
    }

    function loadDataFromStorage() {
      return new Promise((resolve) => {
        chrome.storage.local.get({
          editImage: '',
          backgroundImage: '',
          sites: [],
          icons: [],
          showBookmarkNames: 'hover',
          bookmarkPosition: 'middle',
          bookmarkShape: 'circle',
          backgroundPosition: 'top'
        }, function (data) {
          setBackgroundImage(data.backgroundImage, data.backgroundPosition, data.backgroundSize);
          setOptions(data);
          addBookmarks(data.sites);
          setIcons(data.icons);
          resolve();
        });
      });
    }

    function onBackgroundChange(event) {
      setBackgroundImage(event.detail);

      chrome.storage.local.set({ 'backgroundImage': event.detail }, () => {
        if (chrome.runtime.lastError) {
          this.setUploadStatus('Failed to save image file to local storage.');
        }
        else {
          showSuccessAlert();
        }
      });
    }

    function setBackgroundImage(imgSrc, position = getById('backgroundPositionSelect').value, size = getById('backgroundSizeSelect').value) {
      let windowWidth = window.innerWidth;
      let windowHeight = window.innerHeight;
      let ratio = windowHeight / (windowWidth || 1);
      let container = getById('bgPreviewContainer');
      container.style.width = '350px';
      container.style.height = Math.round(350 * ratio) + 'px';
      container.style.backgroundImage = `url(${imgSrc})`;
      container.style.backgroundPositionX = 'center';
      container.style.backgroundPositionY = position;
      container.style.backgroundSize = size;
      container.style.backgroundRepeat = 'no-repeat';
    }

    function setOptions(data) {
      let showBookmarkNamesOptions = getById('showBookmarkNamesSelect').children;
      let bookmarkPositionOptions = getById('bookmarkPositionSelect').children;
      let backgroundPositionOptions = getById('backgroundPositionSelect').children;
      let bookmarkShapeOptions = getById('bookmarkShapeSelect').children;

      updateSelectEl(showBookmarkNamesOptions, data.showBookmarkNames);
      updateSelectEl(bookmarkPositionOptions, data.bookmarkPosition);
      updateSelectEl(backgroundPositionOptions, data.backgroundPosition);
      updateSelectEl(bookmarkShapeOptions, data.bookmarkShape);
    }

    function updateSelectEl(el, val) {
      for (let option of el) {
        if (option.value === val) {
          option.setAttribute('selected', 'selected');
        }
        else {
          option.removeAttribute('selected');
        }
      }
    }

    function addBookmarks(sites) {
      let bookmarkList = getById('bookmarkList');
      let newBookmarkBtn = getById('newBookmarkBtn');
      let bookmarkShapeCls = getBookmarkShapeCls();

      if (sites.length) {
        let bookmarkArray = [];
        for (let site of sites) {
          let iconImg = document.createElement('img');
          iconImg.src = site.imgUrl;
          iconImg.title = site.name;
          iconImg.name = site.name;
          iconImg.className = `bookmarkIcon draggableIcon ${bookmarkShapeCls}`;
          iconImg.addEventListener('click', function () { showEditBookmarkMenu(this); });
          bookmarkList.insertBefore(iconImg, newBookmarkBtn);
          bookmarkArray.push(iconImg);
        }
        makeSortable(bookmarkArray);
      }
    }

    function setIcons(icons) {
      let iconLibraryContainer = getById('iconLibraryContainer');
      defaultIconUrl = icons.find((icon) => icon.name === 'Default');
      defaultIconUrl = defaultIconUrl && defaultIconUrl.imgUrl || '';

      for (let icon of icons) {
        let iconElement = document.createElement('img');
        iconElement.className = 'libraryImage';
        iconElement.src = icon.imgUrl;
        iconElement.alt = icon.name;
        iconElement.onclick = () => iconModal.iconClicked(iconElement);
        iconLibraryContainer.appendChild(iconElement);
      }
    }

    function saveBookmark() {
      if (!currentBookmark) {
        let newBookmark = document.createElement('img');
        newBookmark.className = `bookmarkIcon draggableIcon ${getBookmarkShapeCls()}`;
        newBookmark.addEventListener('click', function () { showEditBookmarkMenu(this); });
        getById('bookmarkList').insertBefore(newBookmark, getById('newBookmarkBtn'));
        updateSortingIds();
        makeSortable(newBookmark);
        currentBookmark = newBookmark;
      }
      currentBookmark.src = getById('editIconPreview').src;
      currentBookmark.name = getById('editNameInput').value;
      currentBookmark.title = getById('editUrlInput').value;
      saveBookmarks();
      hideEditBookmarkMenu();
      currentBookmark = null;
    }

    function deleteBookmark() {
      if (currentBookmark) {
        currentBookmark.remove();
      }
      saveBookmarks();
      currentBookmark = null;
      hideEditBookmarkMenu();
    }

    function showEditBookmarkMenu(element, isNewBookmark) {
      if (isNewBookmark) {
        currentBookmark = null;
        getById('editNameInput').value = '';
        getById('editUrlInput').value = '';
        getById('editIconPreview').src = defaultIconUrl;
        showElement(getById('importBookmarkBtn'));
        hideElement(getById('deleteBookmarkBtn'));
      } else {
        currentBookmark = element;
        getById('editNameInput').value = element.name;
        getById('editUrlInput').value = element.title;
        getById('editIconPreview').src = element.src;
        hideElement(getById('importBookmarkBtn'));
        showElement(getById('deleteBookmarkBtn'));
      }

      let iconLocation = getElementLocation(element);
      let menu = getById('editBookmarkMenu');
      let menuHeading = getById('editMenuHeading');
      menuHeading.innerText = isNewBookmark ? 'New Bookmark' : 'Edit Bookmark';
      showElement(menu);

      // Show edit menu to the right of icon
      if (iconLocation.right + menu.offsetWidth < window.innerWidth) {
        menu.style.left = iconLocation.right - 15 + 'px';
      } else {
        // Show edit menu to the left of icon
        if (iconLocation.left - menu.offsetWidth > 0) {
          menu.style.left = iconLocation.left + 15 - menu.offsetWidth + 'px';
        } else {
          // Window width too small, show edit menu in center
          menu.style.left = (window.innerWidth / 2) - (menu.offsetWidth / 2) + 'px';
        }
      }
      menu.style.top = iconLocation.top - menu.offsetHeight - 5 + 'px';
    }

    function getElementLocation(el) {
      let rect = el.getBoundingClientRect();
      let scrollTop = window.pageYOffset || document.documentElement.scrollLeft;

      return {
        top: rect.top + scrollTop, bottom: rect.bottom + scrollTop,
        left: rect.left, right: rect.right
      };
    }

    function getBookmarkShapeCls() {
      return `icon-${getById('bookmarkShapeSelect').value}`;
    }

    function hideEditBookmarkMenu() {
      hideElement(getById('editBookmarkMenu'));
    }

    function getBookmarkElements() {
      return getById('bookmarkList').getElementsByClassName('draggableIcon');
    }

    function setUploadStatus(message) {
      let statusEl = getById('imgUploadStatus');
      statusEl.innerText = message;
    }

    function restoreDefaultImage() {
      let resp = confirm('Restore default background image?\n\nThis cannot be undone...');

      if (!resp) { return; }

      loadImageFromUrl('/images/bg.jpg')
        .then(result => {
          setBackgroundImage(result);
          chrome.storage.local.set({ 'backgroundImage': result }, () => {
            if (chrome.runtime.lastError) {
              setUploadStatus('Failed to save image file to local storage.');
            }
            else {
              setUploadStatus('');
              showSuccessAlert();
            }
          });
        })
        .catch(() => setUploadStatus('Restoring default image failed'));
    }

    function saveBookmarks() {
      let bookmarks = getBookmarkElements();
      let bookmarkArray = [];
      for (let i = 0; i < bookmarks.length; i++) {
        bookmarkArray.push({
          name: bookmarks[i].name, url: bookmarks[i].title,
          imgUrl: bookmarks[i].src, id: bookmarks[i].id
        });
      }
      chrome.storage.local.set({
        sites: bookmarkArray
      }, function () { });
      showSuccessAlert();
    }

    function showSuccessAlert() {
      if (successTimer) {
        clearTimeout(successTimer);
      }

      getById('successMsg').style.opacity = 1;

      successTimer = setTimeout(() => {
        getById('successMsg').style.opacity = 0;
        successTimer = null;
      }, 2500);
    }

    document.addEventListener('DOMContentLoaded', onPageLoad);

}());
