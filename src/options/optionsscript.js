"use strict";

var defaultIconUrl = '', currentBookmark, selectedIcon, selectedBookmark;
const MAX_TITLE_LENGTH = 70;

function $(id) { return document.getElementById(id); }

function show(el) { el.style.display = 'block'; }

function hide(el) { el.style.display = 'none'; }

function toggle(el, toShow) {
  if (toShow) { show(el); }
  else { hide(el); }
}

function onPageLoad() {
  addEventListeners();
  checkPermissions();
  loadDataFromStorage();
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
  var tabs = document.getElementsByClassName('tablinks');
  for (let i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function () { changeTab(this); });
  }
  document.addEventListener('click', function (event) {
    if (event.target.closest('#editBookmarkMenu, .draggableIcon, #newBookmarkBtn, #optionsModal')) {
      return;
    }
    hideEditMenu();
  });
  var radioButtons = document.querySelectorAll('input[type=radio]');
  for (let i = 0; i < radioButtons.length; i++) {
    newListener(radioButtons[i].id, 'change', function () { radioButtonClicked(radioButtons[i]); });
  }
}

// Called when user changes the settings in the 'Show Bookmark Names' section or the 
// 'Bookmark Position' section. The radio button name is set to the corresponding key
// stored in chrome storage
function radioButtonClicked(btn) {
  chrome.storage.local.set({ [btn.name]: btn.value });
}


/*
 *     checkPermissions Function - Scanning a remote site for icons requires additional
 *     permissions. If we have them, show the scan button, if not show the get permissions
 *     button to prompt the user
 */
function checkPermissions() {
  var scanDiv = $('scanDiv');
  var urlPermissionDiv = $('urlPermissionDiv');
  var getPermissionBtn = $('getUrlPermission');
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

/*
 *     loadDataFromStorage Function
 */
function loadDataFromStorage() {
  chrome.storage.local.get({
    'editImage': '', 'backgroundImage': '', 'sites': [],
    'icons': [], 'showBookmarkNames': 'hover', 'bookmarkPosition': 'middle'
  }, function (data) {
    setBackgroundImage(data.backgroundImage);
    var bookmarkList = $('bookmarkList');
    var newBookmarkBtn = $('newBookmarkBtn');
    if (data.sites.length) {
      var bookmarkArray = [];
      for (let i = 0; i < data.sites.length; i++) {
        let iconImg = document.createElement('img');
        iconImg.src = data.sites[i].imgUrl;
        iconImg.id = data.sites[i].id;
        iconImg.title = data.sites[i].url;
        iconImg.name = data.sites[i].name;
        iconImg.className = 'draggableIcon';
        iconImg.addEventListener('click', function () { showEditMenu(this) });
        bookmarkList.insertBefore(iconImg, newBookmarkBtn);
        bookmarkArray.push(iconImg);
      }
      makeSortable(bookmarkArray);
    }

    // Find the default icon
    var icons = data.icons;
    for (let i = 0; i < icons.length; i++) {
      if (icons[i].name === 'Default') {
        defaultIconUrl = icons[i].imgUrl;
        break;
      }
    }
    // Load set of predefined icons
    var iconLibraryContainer = $('iconLibraryContainer');
    for (let i = 0; i < icons.length; i++) {
      let iconElement = document.createElement('img');
      iconElement.className = 'libraryImage';
      iconElement.src = icons[i].imgUrl;
      iconElement.alt = icons[i].name;
      iconElement.onclick = function () { iconClicked(iconElement) };
      iconLibraryContainer.appendChild(iconElement);
    }
    // Select the correct radio buttons
    var showBookmarkNamesOptions = $('bookmarkNameButtons').getElementsByTagName('input');
    var showBookmarkNames = data.showBookmarkNames;
    switch (showBookmarkNames) {
      case 'never':
        showBookmarkNamesOptions[0].checked = true;
        break;
      case 'always':
        showBookmarkNamesOptions[2].checked = true;
        break;
      default: // hover
        showBookmarkNamesOptions[1].checked = true;
    }

    var bookmarkPositionOptions = $('bookmarkPositionButtons').getElementsByTagName('input');
    var bookmarkPosition = data.bookmarkPosition;
    switch (bookmarkPosition) {
      case 'top':
        bookmarkPositionOptions[0].checked = true;
        break;
      case 'bottom':
        bookmarkPositionOptions[2].checked = true;
        break;
      default: // middle
        bookmarkPositionOptions[1].checked = true;
    }
  });
}

function setBackgroundImage(imgSrc) {
  var windowWidth = window.innerWidth;
  var windowHeight = window.innerHeight;
  var ratio = windowHeight / windowWidth;
  var container = $('bgPreviewContainer');
  var imgElement = $('bgImgPreview');
  imgElement.src = imgSrc;
  container.style.width = '350px';
  container.style.height = 350 * ratio + 'px';
  if (windowWidth > windowHeight) {
    imgElement.style.width = '100%';
    imgElement.style.height = 'auto';
  } else {
    imgElement.style.width = 'auto';
    imgElement.style.height = '100%';
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
  var bookmarks = $('bookmarkList').getElementsByClassName('draggableIcon');
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
  var rect = el.getBoundingClientRect();
  var scrollTop = window.pageYOffset || document.documentElement.scrollLeft;
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
  var iconLocation = getElementLocation(element);
  var menu = $('editBookmarkMenu');
  var menuHeading = $('editMenuHeading');
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
  var recentBookmarks = chrome.bookmarks.getRecent(10, function (recentBookmarks) { 
    appendChromeBookmarks (recentBookmarks, $('recentBookmarksList')); 
  });

  var topSites = chrome.topSites.get(function (topSites) { 
    appendChromeBookmarks (topSites, $('topSitesList')); 
  });

  var bookmarkTreeNodes = chrome.bookmarks.getTree(
    function (bookmarkTreeNodes) {
      if (bookmarkTreeNodes.length) {
        $('chromeBookmarks').append(getTreeNodes(bookmarkTreeNodes[0].children, true));
      }
    });
}

function getTreeNodes(bookmarkNodes, isFirstNode) {
  var list = document.createElement('ul');
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
  var li = document.createElement(bookmarkNode.title ? 'li' : 'div');

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
  var bookmarks = $('chromeBookmarks').getElementsByTagName('li');
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
  var showContent, hideContent;
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
  var icons = $('iconLibraryContainer').children;
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

function removeChildren (parentElement) {
  while(parentElement.lastChild) {
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

  var iconInput = $('uploadIcon');
  if (iconInput.files.length) {
    var file = iconInput.files[0];
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
  var statusEl = $("imgUploadStatus");
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
  var resp = confirm("Restore default background image?\n\nThis cannot be undone...");
  if (!resp) { return; }
  getViaXhr('/images/bg.jpg', 'blob', onXhrGet, onRestoreError);
}

/*
 *     uploadImage Function
 */
function uploadImage() {
  var imageInput = $('uploadImage');

  function uploadSucces(result) {
    var previewEl = $('bgImgPreview');
    setBackgroundImage(result);
    chrome.storage.local.set({ "backgroundImage": result }, function (data) {
      setUploadStatus("Upload complete");
    });
  }

  function uploadError() {
    setUploadStatus("Error occurred while trying to upload image. Please try again.");
  }

  // If user clicks cancel on choose file diaglog, this function will still be
  // called but files variable will be empty... so we check first
  if (imageInput.files.length) {
    var file = imageInput.files[0];
    setUploadStatus("Uploading...");
    readFile(file, uploadSucces, uploadError);
  }
}

/*
 *    saveBookmarks Function
 */
function saveBookmarks() {
  var bookmarks = getBookmarkElements();
  var bookmarkArray = [];
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
  var activeTabs = document.getElementsByClassName('activeTab');
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
  var url = $('scanIconInput').value;

  function toggleScanButton() {
    var scanSiteBtn = $('scanIconBtn');
    scanSiteBtn.disabled = !scanSiteBtn.disabled;
  }

  function setScanMessage(msg) {
    var messageDiv = $('scanMessage');
    messageDiv.innerText = msg;
  }

  function callback(icons, msg) {
    var scanResultsContainer = $('scanResultsContainer');
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
  var request = new XMLHttpRequest();
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
  var reader = new FileReader();
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
