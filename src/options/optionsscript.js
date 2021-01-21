'use strict';

let defaultIconUrl = '';
let successTimer = null;
let newBackgroundModal, iconModal, bookmarkModal, currentBookmark;

function $(id) { return document.getElementById(id); }
function showElement(el) { el.style.display = 'block'; }
function hideElement(el) { el.style.display = 'none'; }

function onPageLoad() {
  newBackgroundModal = new BackgroundModal($('newBackgroundModal'));
  iconModal = new IconModal($('iconModal'));
  bookmarkModal = new BookmarkModal($('bookmarkModal'));

  checkPermissions();
  loadDataFromStorage();
  addEventListeners();
}

function newListener(elementID, event, func) {
  $(elementID).addEventListener(event, func);
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
      iconImg.addEventListener('click', function () { showEditBookmarkMenu(this) });
      bookmarkList.insertBefore(iconImg, newBookmarkBtn);
      bookmarkArray.push(iconImg);
    }
    makeSortable(bookmarkArray);
  }
}

function setIcons(icons) {
  let iconLibraryContainer = $('iconLibraryContainer');
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
    newBookmark.className = 'draggableIcon';
    newBookmark.addEventListener('click', function () { showEditBookmarkMenu(this); });
    $('bookmarkList').insertBefore(newBookmark, $('newBookmarkBtn'));
    updateIds();
    makeSortable(newBookmark);
    currentBookmark = newBookmark;
  }
  currentBookmark.src = $('editIconPreview').src;
  currentBookmark.name = $('editNameInput').value;
  currentBookmark.title = $('editUrlInput').value;
  saveBookmarks();
  hideEditBookmarkMenu();
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
  hideEditBookmarkMenu();
}

function showEditBookmarkMenu(element, isNewBookmark) {
  if (isNewBookmark) {
    currentBookmark = null;
    $('editNameInput').value = '';
    $('editUrlInput').value = '';
    $('editIconPreview').src = defaultIconUrl;
    showElement($('importBookmarkBtn'));
    hideElement($('deleteBookmarkBtn'));
  } else {
    currentBookmark = element;
    $('editNameInput').value = element.name;
    $('editUrlInput').value = element.title;
    $('editIconPreview').src = element.src;
    hideElement($('importBookmarkBtn'));
    showElement($('deleteBookmarkBtn'));
  }

  let iconLocation = getElementLocation(element);
  let menu = $('editBookmarkMenu');
  let menuHeading = $('editMenuHeading');
  menuHeading.innerText = isNewBookmark ? 'New Bookmark' : 'Edit Bookmark';
  showElement(menu);

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

function getElementLocation(el) {
  let rect = el.getBoundingClientRect();
  let scrollTop = window.pageYOffset || document.documentElement.scrollLeft;

  return {
    top: rect.top + scrollTop, bottom: rect.bottom + scrollTop,
    left: rect.left, right: rect.right
  };
}

function hideEditBookmarkMenu() {
  hideElement($('editBookmarkMenu'));
}

function getBookmarkElements() {
  return $('bookmarkList').getElementsByClassName('draggableIcon');
}

function setUploadStatus(message) {
  let statusEl = $('imgUploadStatus');
  statusEl.innerText = message;
}

function restoreDefaultImage() {
  function onRestoreError() {
    setUploadStatus('Restoring default image failed');
  }
  function onXhrGet(status, response) {
    function onReaderLoad(result) {
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
    }

    if (status == 200) {
      readFile(response, onReaderLoad, onRestoreError);
    } else { onRestoreError(); }
  }
  let resp = confirm('Restore default background image?\n\nThis cannot be undone...');
  if (!resp) { return; }
  getViaXhr('/images/bg.jpg', 'blob', onXhrGet, onRestoreError);
}

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
  showSuccessAlert();
}

function showSuccessAlert() {
  if (successTimer) {
    clearTimeout(successTimer);
  }

  $('successMsg').style.opacity = 1;

  successTimer = setTimeout(() => {
    $('successMsg').style.opacity = 0;
    successTimer = null;
  }, 2500);
}

function getViaXhr(url, responseType, onLoad, onError) {
  let request = new XMLHttpRequest();
  request.responseType = responseType;
  request.open('GET', url, true);
  request.addEventListener('error', onError);
  request.addEventListener('load', function () { onLoad(request.status, request.response) });
  request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  request.send();
}

function readFile(file, onLoad, onError) {
  let reader = new FileReader();
  reader.addEventListener('error', onError);
  reader.addEventListener('load', function () { onLoad(reader.result) });
  reader.readAsDataURL(file);
}

document.addEventListener('DOMContentLoaded', onPageLoad);
