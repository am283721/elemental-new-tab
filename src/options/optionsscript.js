"use strict";

let defaultIconUrl = '', currentBookmark, selectedIcon, selectedBookmark;
const MAX_TITLE_LENGTH = 70;

function $(id) { return document.getElementById(id); }

function show(el) { el.style.display = 'block'; }

function hide(el) { el.style.display = 'none'; }

function toggle(el, toShow) {
  if (toShow) { show(el); }
  else { hide(el); }
}

function onPageLoad() {
  checkPermissions();
  loadDataFromStorage();
  addEventListeners();
}

function newListener(elementID, event, func) {
  $(elementID).addEventListener(event, func);
}

function addEventListeners() {
  newListener('modalClose', 'click', closeModal);
  newListener('modalCancelBtn', 'click', closeModal);
  newListener('uploadIcon', 'change', uploadIcon);
  newListener('scanIconBtn', 'click', getFavIcons);
  newListener('uploadImage', 'change', uploadImage);
  newListener('importBookmarkBtn', 'click', function () { showModal(this); });
  newListener('deleteBookmarkBtn', 'click', deleteBookmark);
  newListener('cancelEditBookmarkBtn', 'click', hideEditMenu);
  newListener('saveBookmarkBtn', 'click', saveBookmark);
  newListener('editIconBtn', 'click', function () { showModal(this); });
  newListener('newBookmarkBtn', 'click', function () { showEditMenu(this, true); });
  newListener('iconModalSaveBtn', 'click', saveIcon);
  newListener('bookmarkModalSaveBtn', 'click', importBookmark);
  newListener('searchIconInput', 'input', function () { filterLibrary(this.value.toLowerCase()); });
  newListener('searchBookmarksInput', 'input', function () { filterBookmarks(this.value.toLowerCase()); });
  let tabs = document.getElementsByClassName('tablinks');

  for (let tab of tabs) {
    tab.addEventListener('click', () => changeTab(tab));
  }

  let dropdowns = document.getElementsByClassName('setting-select');

  for (let dropdown of dropdowns) {
    newListener(dropdown.id, 'change', dropdownChange);
  }

  document.addEventListener('click', function (event) {
    if (event.target.closest('#editBookmarkMenu, .draggableIcon, #newBookmarkBtn, #optionsModal')) {
      return;
    }
    hideEditMenu();
  });
}

function dropdownChange() {
  chrome.storage.local.set({ [this.getAttribute('data-setting')]: this.value });

  if (this.id === 'backgroundPositionSelect') {
    $('bgPreviewContainer').style.backgroundPositionY = this.value;
  }
  else if (this.id === 'backgroundSizeSelect') {
    $('bgPreviewContainer').style.backgroundSize = this.value;
  }
}

/*
*     checkPermissions Function - Scanning a remote site for icons requires additional
*     permissions. If we have them, show the scan button, if not show the get permissions
*     button to prompt the user
*/
function checkPermissions() {
  let scanDiv = $('scanDiv');
  let urlPermissionDiv = $('urlPermissionDiv');
  let getPermissionBtn = $('getUrlPermission');
  chrome.permissions.contains({ origins: ['<all_urls>'] }, function (hasPermission) {
    if (hasPermission) { hide(urlPermissionDiv); }
    else {
      hide(scanDiv);
      getPermissionBtn.addEventListener('click', function () {
        chrome.permissions.request({ origins: ['<all_urls>'] }, function (granted) {
          if (granted) {
            show(scanDiv);
            hide(urlPermissionDiv);
          }
        });
      });
    }
  });
}

function loadDataFromStorage() {
  chrome.storage.local.get({
    editImage: '', backgroundImage: '', sites: [],
    icons: [], showBookmarkNames: 'hover', bookmarkPosition: 'middle', backgroundPosition: 'top'
  }, function (data) {
    setBackgroundImage(data.backgroundImage, data.backgroundPosition, data.backgroundSize);
    setOptions(data);
    addBookmarks(data.sites);
    setIcons(data.icons);
  });
}

function setBackgroundImage(imgSrc, position = $('backgroundPositionSelect').value, size = $('backgroundSizeSelect').value) {
  let windowWidth = window.innerWidth;
  let windowHeight = window.innerHeight;
  let ratio = windowHeight / (windowWidth || 1);
  let container = $('bgPreviewContainer');
  container.style.width = '350px';
  container.style.height = Math.round(350 * ratio) + 'px';
  container.style.backgroundImage = `url(${imgSrc})`;
  container.style.backgroundPositionX = 'center';
  container.style.backgroundPositionY = position;
  container.style.backgroundSize = size;
  container.style.backgroundRepeat = 'no-repeat';
}

function setOptions(data) {
  let showBookmarkNamesOptions = $('showBookmarkNamesSelect').children;
  let bookmarkPositionOptions = $('bookmarkPositionSelect').children;
  let backgroundPositionOptions = $('backgroundPositionSelect').children;

  updateSelectEl(showBookmarkNamesOptions, data.showBookmarkNames);
  updateSelectEl(bookmarkPositionOptions, data.bookmarkPosition);
  updateSelectEl(backgroundPositionOptions, data.backgroundPosition);
}

function addBookmarks(sites) {
  let bookmarkList = $('bookmarkList');
  let newBookmarkBtn = $('newBookmarkBtn');
  if (sites.length) {
    let bookmarkArray = [];
    for (let site of sites) {
      let iconImg = document.createElement('img');
      iconImg.src = site.imgUrl;
      iconImg.id = site.id;
      iconImg.title = site.url;
      iconImg.name = site.name;
      iconImg.className = 'draggableIcon';
      iconImg.addEventListener('click', function () { showEditMenu(this) });
      bookmarkList.insertBefore(iconImg, newBookmarkBtn);
      bookmarkArray.push(iconImg);
    }
    makeSortable(bookmarkArray);
  }
}

function setIcons(icons) {
  // Find the default icon
  defaultIconUrl = icons.find((icon) => icon.name === 'Default') || '';

  // Load set of predefined icons
  let iconLibraryContainer = $('iconLibraryContainer');

  for (let icon of icons) {
    let iconElement = document.createElement('img');
    iconElement.className = 'libraryImage';
    iconElement.src = icon.imgUrl;
    iconElement.alt = icon.name;
    iconElement.onclick = function () { iconClicked(iconElement) };
    iconLibraryContainer.appendChild(iconElement);
  }
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

function saveBookmark() {
  // New Bookmark
  if (!currentBookmark) {
    let newBookmark = document.createElement('img');
    newBookmark.className = 'draggableIcon';
    newBookmark.addEventListener('click', function () { showEditMenu(this); });
    $('bookmarkList').insertBefore(newBookmark, $('newBookmarkBtn'));
    updateIds();
    makeSortable(newBookmark);
    currentBookmark = newBookmark;
  }
  currentBookmark.src = $('editIconPreview').src;
  currentBookmark.name = $('editNameInput').value;
  currentBookmark.title = $('editUrlInput').value;
  saveBookmarks();
  hideEditMenu();
  currentBookmark = null;
}

function updateIds() {
  let bookmarks = $('bookmarkList').getElementsByClassName('draggableIcon');
  for (let i = 0; i < bookmarks.length; i++) {
    bookmarks[i].id = i;
  }
}

function deleteBookmark() {
  if (currentBookmark) {
    currentBookmark.remove();
  }
  saveBookmarks();
  currentBookmark = null;
  hideEditMenu();
}

function getElementLocation(el) {
  let rect = el.getBoundingClientRect();
  let scrollTop = window.pageYOffset || document.documentElement.scrollLeft;
  return {
    top: rect.top + scrollTop, bottom: rect.bottom + scrollTop,
    left: rect.left, right: rect.right
  };
}

function showEditMenu(element, isNewBookmark) {
  if (isNewBookmark) {
    currentBookmark = null;
    $('editNameInput').value = '';
    $('editUrlInput').value = '';
    $('editIconPreview').src = defaultIconUrl;
    show($('importBookmarkBtn'));
    hide($('deleteBookmarkBtn'));
  } else {
    currentBookmark = element;
    $('editNameInput').value = element.name;
    $('editUrlInput').value = element.title;
    $('editIconPreview').src = element.src;
    hide($('importBookmarkBtn'));
    show($('deleteBookmarkBtn'));
  }
  let iconLocation = getElementLocation(element);
  let menu = $('editBookmarkMenu');
  let menuHeading = $('editMenuHeading');
  menuHeading.innerText = isNewBookmark ? 'New Bookmark' : 'Edit Bookmark';
  show(menu);

  // Show edit menu to the right of icon
  if (iconLocation.right + menu.offsetWidth < window.innerWidth) {
    menu.style.left = iconLocation.right - 15 + 'px'
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

function hideEditMenu() {
  hide($('editBookmarkMenu'));
}

function appendChromeBookmarks(bookmarks, targetEl) {
  for (let i = 0; i < bookmarks.length; i++) {
    let item = document.createElement('li');
    item.textContent = bookmarks[i].title.length > MAX_TITLE_LENGTH ? bookmarks[i].title.substr(0, MAX_TITLE_LENGTH) + '...' : bookmarks[i].title;
    item.title = bookmarks[i].url;
    item.setAttribute('data-bookmarkname', bookmarks[i].title);
    item.classList.add('bookmarkUrl');
    item.onclick = function () { chromeBookmarkClicked(this); }
    targetEl.appendChild(item);
  }
}

function getBookmarksFromChrome() {
  let recentBookmarks = chrome.bookmarks.getRecent(10, function (recentBookmarks) {
    appendChromeBookmarks(recentBookmarks, $('recentBookmarksList'));
  });

  let topSites = chrome.topSites.get(function (topSites) {
    appendChromeBookmarks(topSites, $('topSitesList'));
  });

  let bookmarkTreeNodes = chrome.bookmarks.getTree(
    function (bookmarkTreeNodes) {
      if (bookmarkTreeNodes.length) {
        $('chromeBookmarks').append(getTreeNodes(bookmarkTreeNodes[0].children, true));
      }
    });
}

function getTreeNodes(bookmarkNodes, isFirstNode) {
  let list = document.createElement('ul');
  if (isFirstNode) {
    list.classList.add('firstBookmarkNode');
  } else {
    list.classList.add('collapse');
  }
  for (let i = 0; i < bookmarkNodes.length; i++) {
    list.append(getNode(bookmarkNodes[i]));
  }
  return list;
}

function getNode(bookmarkNode) {
  let li = document.createElement(bookmarkNode.title ? 'li' : 'div');

  // Highest level in tree contains no title, only list of child folders
  if (bookmarkNode.title) {
    let name = bookmarkNode.title.length > MAX_TITLE_LENGTH ? bookmarkNode.title.substr(0, MAX_TITLE_LENGTH) + '...' : bookmarkNode.title;
    li.textContent = name;
    // If url attribute exists, it's a bookmark, otherwise it's a folder
    if (bookmarkNode.url) {
      li.setAttribute('title', bookmarkNode.url);
      li.setAttribute('data-bookmarkname', bookmarkNode.title);
      li.classList.add('bookmarkUrl');
      li.onclick = function () { chromeBookmarkClicked(this); }
    } else {
      li.classList.add('collapseHeading');
      li.onclick = function (evt) {
        if (evt.target.firstElementChild && evt.target === evt.currentTarget) {
          evt.target.firstElementChild.classList.toggle('show');
          return true;
        }
      };

    }
  }

  if (bookmarkNode.children && bookmarkNode.children.length > 0) {
    li.append(getTreeNodes(bookmarkNode.children));
  }
  return li;
}

function filterBookmarks(filter) {
  let bookmarks = $('chromeBookmarks').getElementsByTagName('li');
  for (let i = 0; i < bookmarks.length; i++) {
    // Skip folders
    if (!bookmarks[i].title.length) {
      continue;
    }
    if (bookmarks[i].title.toLowerCase().indexOf(filter) != -1 ||
      bookmarks[i].getAttribute('data-bookmarkname').toLowerCase().indexOf(filter) != -1) {
      bookmarks[i].parentElement.classList.add('show');
      show(bookmarks[i]);
    } else {
      hide(bookmarks[i]);
    }

  }
}

function importBookmark() {
  if (selectedBookmark) {
    $('editNameInput').value = selectedBookmark.getAttribute('data-bookmarkname');
    $('editUrlInput').value = selectedBookmark.title;
    closeModal();
  } else {
    setModalMessage('No bookmark selected');
  }
}

/*
*      showModal Function
*/
function showModal(btnClicked) {
  let showContent, hideContent;
  // Edit Icon Modal
  if (btnClicked.name === 'icon') {
    $('scanIconInput').value = $('editUrlInput').value;
    let src = $('editIconPreview').src;
    $('modalIconPreview').src = src;
    $('modalIconBackground').src = src;
    showContent = document.getElementsByClassName('iconModalContent');
    hideContent = document.getElementsByClassName('bookmarkModalContent');
    $('libraryTabBtn').click();
  } else { // Import Bookmark Modal
    getBookmarksFromChrome();
    showContent = document.getElementsByClassName('bookmarkModalContent');
    hideContent = document.getElementsByClassName('iconModalContent');
    $('topSitesTabBtn').click();
  }

  for (let i = 0; i < showContent.length; i++) { show(showContent[i]); }
  for (let i = 0; i < hideContent.length; i++) { hide(hideContent[i]); }
  show($('optionsModal'));
}

function filterLibrary(filter) {
  let icons = $('iconLibraryContainer').children;
  for (let i = 0; i < icons.length; i++) {
    toggle(icons[i], icons[i].alt.toLowerCase().indexOf(filter) !== - 1);
  }
}


/*
*      closeModal Function
*/
function closeModal() {
  setModalMessage('');
  if (selectedIcon) {
    selectedIcon.classList.remove('selectedIcon');
    selectedIcon = undefined;
  }
  $('searchIconInput').value = '';
  removeChildren($('scanResultsContainer'));
  filterLibrary('');
  if (selectedBookmark) {
    selectedBookmark.classList.remove('selectedChromeBookmark');
    selectedBookmark = undefined;
  }
  removeChildren($('topSitesList'));
  removeChildren($('chromeBookmarks'));
  $('searchBookmarksInput').value = '';
  removeChildren($('recentBookmarksList'));
  hide($('optionsModal'));
}

function removeChildren(parentElement) {
  while (parentElement.lastChild) {
    parentElement.removeChild(parentElement.lastChild);
  }
}

/*
*     uploadIcon Function
*/
function uploadIcon() {
  function onLoad(result) {
    $('modalIconPreview').src = result;
    $('modalIconBackground').src = result;
  }

  let iconInput = $('uploadIcon');
  if (iconInput.files.length) {
    let file = iconInput.files[0];
    readFile(file, onLoad, function () { });
  }
}

/*
*      setModalMessage Function
*/
function setModalMessage(msg) {
  $('modalMessage').innerText = msg;
}

/*
*     saveIcon Function
*/
function saveIcon() {
  if ($('uploadTabBtn').classList.contains('activeTab')) {
    selectedIcon = $('modalIconPreview');
  }
  if (!selectedIcon) {
    setModalMessage('No icon selected');
    return;
  }
  $('editIconPreview').src = selectedIcon.src;
  closeModal();
}

function chromeBookmarkClicked(newBookmark) {
  if (newBookmark === selectedBookmark) {
    return;
  }
  newBookmark.classList.add('selectedChromeBookmark');
  if (selectedBookmark) {
    selectedBookmark.classList.remove('selectedChromeBookmark');
  }
  selectedBookmark = newBookmark;
  setModalMessage('');
}

/*
*      iconClicked Function
*/
function iconClicked(newIcon) {
  newIcon.classList.add('selectedIcon');
  if (selectedIcon) {
    selectedIcon.classList.remove('selectedIcon');
  }
  selectedIcon = newIcon;
  setModalMessage('');
}

function getBookmarkElements() {
  return $('bookmarkList').getElementsByClassName('draggableIcon');
}

/*
*      setUploadStatus Function
*/
function setUploadStatus(message) {
  let statusEl = $("imgUploadStatus");
  statusEl.innerText = message;
}

/*
*     restoreDefaultImage Function
*/
function restoreDefaultImage() {
  function onRestoreError() {
    setUploadStatus("Restoring default image failed");
  }
  function onXhrGet(status, response) {
    function onReaderLoad(result) {
      chrome.storage.local.set({ 'backgroundImage': result }, function () {
        location.reload();
      });
    }
    if (status == 200) {
      readFile(response, onReaderLoad, onRestoreError);
    } else { onRestoreError(); }
  }
  let resp = confirm("Restore default background image?\n\nThis cannot be undone...");
  if (!resp) { return; }
  getViaXhr('/images/bg.jpg', 'blob', onXhrGet, onRestoreError);
}

/*
*     uploadImage Function
*/
function uploadImage() {
  let imageInput = $('uploadImage');

  function uploadSucces(result) {
    setBackgroundImage(result);
    chrome.storage.local.set({ "backgroundImage": result }, () => setUploadStatus("Upload complete"));
  }

  function uploadError() {
    setUploadStatus("Error occurred while trying to upload image. Please try again.");
  }

  // If user clicks cancel on choose file diaglog, this function will still be
  // called but files variable will be empty... so we check first
  if (imageInput.files.length) {
    let file = imageInput.files[0];
    setUploadStatus("Uploading...");
    readFile(file, uploadSucces, uploadError);
  }
}

/*
*    saveBookmarks Function
*/
function saveBookmarks() {
  let bookmarks = getBookmarkElements();
  let bookmarkArray = [];
  for (let i = 0; i < bookmarks.length; i++) {
    bookmarkArray.push({
      name: bookmarks[i].name, url: bookmarks[i].title,
      imgUrl: bookmarks[i].src, id: bookmarks[i].id
    })
  }
  chrome.storage.local.set({
    sites: bookmarkArray
  }, function () { });
}

/*
*      changeTab Function
*/
function changeTab(tab) {
  let activeTabs = document.getElementsByClassName('activeTab');
  if (activeTabs.length) {
    hide($(activeTabs[0].getAttribute('data-content')));
    activeTabs[0].classList.remove('activeTab');
  }
  show($(tab.getAttribute('data-content')));
  tab.classList.add('activeTab');
  if (selectedIcon) {
    selectedIcon.classList.remove('selectedIcon');
    selectedIcon = undefined;
  }
  if (selectedBookmark) {
    selectedBookmark.classList.remove('selectedChromeBookmark');
    selectedBookmark = undefined;
  }
  setModalMessage('');
}

/*
*      getFavIcons Function
*/
function getFavIcons() {
  let url = $('scanIconInput').value;

  function toggleScanButton() {
    let scanSiteBtn = $('scanIconBtn');
    scanSiteBtn.disabled = !scanSiteBtn.disabled;
  }

  function setScanMessage(msg) {
    let messageDiv = $('scanMessage');
    messageDiv.innerText = msg;
  }

  function callback(icons, msg) {
    let scanResultsContainer = $('scanResultsContainer');
    for (let i = 0; i < icons.length; i++) {
      let iconElement = document.createElement('img');
      iconElement.className = 'scanIcon';
      iconElement.src = icons[i];
      iconElement.alt = 'icon' + i;
      iconElement.onclick = function () { iconClicked(iconElement) };
      scanResultsContainer.appendChild(iconElement);
    }
    setScanMessage(msg);
    toggleScanButton();
  }
  $('scanResultsContainer').innerHTML = '';
  setScanMessage('Scanning site for icons. Please wait.');
  toggleScanButton();
  scanSiteForFavIcon(url, callback);
}

/*
*      getViaXhr Function
*/
function getViaXhr(url, responseType, onLoad, onError) {
  let request = new XMLHttpRequest();
  request.responseType = responseType;
  request.open('GET', url, true);
  request.addEventListener("error", onError);
  request.addEventListener("load", function () { onLoad(request.status, request.response) });
  request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  request.send();
}

/*
*      readFile Function
*/
function readFile(file, onLoad, onError) {
  let reader = new FileReader();
  reader.addEventListener("error", onError);
  reader.addEventListener("load", function () { onLoad(reader.result) });
  reader.readAsDataURL(file);
}

window.onclick = function (event) {
  if (event.target == $('optionsModal')) {
    closeModal();
  }
}

document.addEventListener('DOMContentLoaded', onPageLoad);
