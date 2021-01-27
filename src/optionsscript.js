import { getById, showElement, hideElement, loadImageFromUrl } from "./modules/utils.js";
import { makeSortable, updateSortingIds } from "./modules/dragandsort.js";
import BackgroundModal from "./modules/backgroundmodal.js";
import IconModal from "./modules/iconmodal.js";
import BookmarkModal from "./modules/bookmarkmodal.js";

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
      iconImg.addEventListener('click', function () { showEditBookmarkMenu(this) });
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

  getById('successMsg').style.opacity = 1;

  successTimer = setTimeout(() => {
    getById('successMsg').style.opacity = 0;
    successTimer = null;
  }, 2500);
}

document.addEventListener('DOMContentLoaded', onPageLoad);
