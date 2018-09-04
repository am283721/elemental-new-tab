const EDIT_BTN = 0, SAVE_BTN = 1;
const SCAN_TAB = 0, LIBRARY_TAB = 1, UPLOAD_TAB = 2;
const COLUMN = {
  NAME:0,
  URL:1,
  ICON:2,
  EDIT_SAVE:3
}
var bookmarks = [];
var defaultIcon = ''; // Default icon to use when user creates a new bookmark
var editIcon = ''; // Small pencil icon to indicate the current icon is editable when clicked
var nextId = 0;
var modal = document.getElementById('iconModal');
var activeTab = 0;
var selectedIcon = [undefined, undefined]; // First index for scan tab, second for library tab

function onPageLoad(){
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalCancel').addEventListener('click', closeModal);
  document.getElementById('uploadIcon').addEventListener('change', uploadIcon);
  document.getElementById('scanIconBtn').addEventListener('click', getFavIcons);
  document.getElementById('uploadImage').addEventListener('change', uploadImage);
  document.getElementById('restoreButton').addEventListener('click', restoreDefaultImage);
  document.getElementById('newBookmarkBtn').addEventListener('click', newRow);
  var tabLinks = document.getElementsByClassName('tablinks');
  tabLinks[SCAN_TAB].addEventListener('click', function() { changeTab(event, SCAN_TAB) });
  tabLinks[LIBRARY_TAB].addEventListener('click', function() { changeTab(event, LIBRARY_TAB) });
  tabLinks[UPLOAD_TAB].addEventListener('click', function() { changeTab(event, UPLOAD_TAB) });
  tabLinks[activeTab].click();
  var showNamesCheckbox = document.getElementById('showBookmarkNames');
  showNamesCheckbox.onchange = function(){
    chrome.storage.local.set({'showBookmarkNames':showNamesCheckbox.checked });
  }
  loadDataFromStorage();
}

/*
 *     loadDataFromStorage Function
 */
function loadDataFromStorage() {
    chrome.storage.local.get({ 'editImage':'', 'backgroundImage':'', 'sites':[], 
                               'icons':[], 'showBookmarkNames':false }, function(data){
      document.getElementById('bgImgPreview').src = data.backgroundImage;
      bookmarks = data.sites;
      if(bookmarks.length){
        // Each bookmark has an ID. A new bookmark will be the largest existing ID + 1
        nextId = bookmarks[bookmarks.length - 1].id + 1;
        var bookmarktableBody = document.getElementById('bookmarkTableBody');
        for (let i = 0; i < bookmarks.length; i++) {
            let row = buildRow(bookmarks[i].name, bookmarks[i].url, bookmarks[i].imgUrl, bookmarks[i].id);
            bookmarktableBody.appendChild(row);
        }
      }
      editIcon = data.editImage;

      // Find the default icon
      var icons = data.icons;
      for (let i = 0; i < icons.length; i++){
        if(icons[i].name === 'Default'){
          defaultIcon = icons[i].imgUrl;
          break;
        }
      }
      // Load set of predefined icons
      var iconLibraryContainer = document.getElementById('iconLibraryContainer');
      for(let i = 0; i < icons.length; i++){
        let iconElement = document.createElement('img');
        iconElement.className = 'libraryImage';
        iconElement.src = icons[i].imgUrl;
        iconElement.alt = icons[i].name;
        iconElement.onclick = function() { iconClicked(iconElement) };
        iconLibraryContainer.appendChild(iconElement);
      }
      document.getElementById('showBookmarkNames').checked = data.showBookmarkNames;
    });
}

/*
 *    buildRow Function
 */
function buildRow(name, url, iconSrc, rowId) {
  let row = document.createElement('tr');
  row.id = rowId;
  let nameCol = document.createElement('td');
  let urlCol = document.createElement('td');
  let iconCol = document.createElement('td');
  let iconImg = document.createElement('img');
  let editCol = document.createElement('td');
  let deleteCol = document.createElement('td');
  let editBtn = document.createElement('button');
  let saveBtn = document.createElement('button');
  let deleteBtn = document.createElement('button');

  nameCol.innerText = name;
  nameCol.className = 'nameColumn';
  urlCol.title = url;
  url.length > 60 ? urlCol.innerText = url.substring(0,56) + '...' : urlCol.innerText = url;
  urlCol.className = 'urlColumn';
  iconCol.className = 'iconColumn';
  iconImg.src = iconSrc;
  iconImg.className = 'iconImg';
  iconCol.appendChild(iconImg);
  editBtn.innerText = 'Edit';
  editBtn.addEventListener('click', function(){ editRow(row) });
  editCol.appendChild(editBtn);
  saveBtn.innerText = 'Save';
  saveBtn.style = 'display:none;';
  saveBtn.addEventListener('click', function(){ saveRow(row, rowId) });
  editCol.appendChild(saveBtn);
  deleteBtn.innerText = 'Delete';
  deleteBtn.addEventListener('click', function(){ deleteRow(rowId) });
  deleteCol.appendChild(deleteBtn);

  row.appendChild(nameCol);
  row.appendChild(urlCol);
  row.appendChild(iconCol);
  row.appendChild(editCol);
  row.appendChild(deleteCol);

  return row;
}

/*
 *      showIconModal Function
 */
function showIconModal(row){
  let url = row.cells[COLUMN.URL].childNodes[0].value;
  let iconSrc = row.cells[COLUMN.ICON].getElementsByTagName('img')[0].src;
  let modalSaveBtn = document.getElementById('modalSave');
  modalSaveBtn.onclick = function() { saveIcon(row) };

  let scanIconInput = document.getElementById('scanIconInput');
  scanIconInput.value = url;
  let imgElement = document.getElementById('modalIconPreview');
  imgElement.src = iconSrc;
  let imgBackground = document.getElementById('modalIconBackground');
  imgBackground.src = iconSrc;
  modal.style.display = "block";
}

/*
 *      closeModal Function
 */
function closeModal() { 
  setModalMessage('');
  if(selectedIcon[SCAN_TAB]){
    selectedIcon[SCAN_TAB].className = selectedIcon[SCAN_TAB].className.replace(' selectedIcon','');
    selectedIcon[SCAN_TAB] = undefined;
  }
  if(selectedIcon[LIBRARY_TAB]){
    selectedIcon[LIBRARY_TAB].className = selectedIcon[LIBRARY_TAB].className.replace(' selectedIcon','');
    selectedIcon[LIBRARY_TAB] = undefined;
  }
  modal.style.display = "none";
}

/*
 *     uploadIcon Function
 */
function uploadIcon() {
  function onLoad(result){
    document.getElementById('modalIconPreview').src = result;
    document.getElementById('modalIconBackground').src = result;
  }

  var iconInput = document.getElementById('uploadIcon');
  if(iconInput.files.length) {
    var file = iconInput.files[0];
    readFile(file, onLoad, function(){});
  }
}

/*
 *      setModalMessage Function
 */
function setModalMessage(msg){
  let messageDiv = document.getElementById('modalMessage');
  messageDiv.innerText = msg;
}

/*
 *     saveIcon Function
 */
function saveIcon(row) {
  let rowIcon = row.cells[COLUMN.ICON].getElementsByTagName('img')[0];  
  if(activeTab === UPLOAD_TAB){
    let newIconSrc = document.getElementById('modalIconPreview').src;
    rowIcon.src = newIconSrc;
  } else{
    if(selectedIcon[activeTab]){
      rowIcon.src = selectedIcon[activeTab].src;
    } else {
      setModalMessage('No icon selected');
      return;
    }
  }
  closeModal();
}

/*
 *      iconClicked Function
 */
function iconClicked(newIcon){
  newIcon.className += ' selectedIcon';
  if(selectedIcon[activeTab]){
    selectedIcon[activeTab].className = selectedIcon[activeTab].className.replace(' selectedIcon','');
  }
  selectedIcon[activeTab] = newIcon;
  setModalMessage('');
}

/*
 *      toggleEditButtonDisable Function
 */
function toggleEditButtonDisable (isDisabled) {
  var rows = document.getElementById('bookmarkTableBody').rows;
  var currentButtons;
  for(let i = 0; i < rows.length; i++) {
    currentButtons = rows[i].cells[COLUMN.EDIT_SAVE].getElementsByTagName('button');
    currentButtons[EDIT_BTN].disabled = isDisabled;
  }
}

/*
 *     editRow Function
 */
function editRow(currentRow) {
  // Disable all edit buttons while editing a specific row
  toggleEditButtonDisable(true);

  // Hide edit button and show save button
  let buttons = currentRow.cells[COLUMN.EDIT_SAVE].getElementsByTagName('button');
  buttons[EDIT_BTN].style = 'display:none;';
  buttons[SAVE_BTN].style = 'display:block';

  // Convert name cell into input and pre-fill with existing value
  let nameCell = currentRow.cells[COLUMN.NAME];
  let bookmarkName = nameCell.innerText;
  nameCell.innerText = '';
  let nameInput = document.createElement('input');
  nameInput.value = bookmarkName;
  nameCell.appendChild(nameInput);

  // Convert url cell into input and pre-fill with existing value
  let urlCell = currentRow.cells[COLUMN.URL];
  let bookmarkUrl = urlCell.title;
  urlCell.innerText = '';
  let urlInput = document.createElement('input');
  urlInput.value = bookmarkUrl;
  urlCell.appendChild(urlInput);

  let iconOverlay = document.createElement('img');
  iconOverlay.addEventListener('click', function(){ showIconModal(currentRow) });
  iconOverlay.src = editIcon;
  iconOverlay.className = 'iconOverlay';
  currentRow.cells[COLUMN.ICON].appendChild(iconOverlay);
}

/*
 *     saveRow Function
 */
function saveRow(currentRow, bookmarkId) {
  let nameCell = currentRow.cells[COLUMN.NAME];
  let bookmarkName = nameCell.childNodes[0].value;
  nameCell.removeChild(nameCell.childNodes[0]);
  nameCell.innerText = bookmarkName;

  let urlCell = currentRow.cells[COLUMN.URL];
  let bookmarkUrl = urlCell.childNodes[0].value;
  urlCell.removeChild(urlCell.childNodes[0]);
  urlCell.title = bookmarkUrl;
  bookmarkUrl.length > 60 ? urlCell.innerText = bookmarkUrl.substring(0,56) + '...' : urlCell.innerText = bookmarkUrl;

  let icons = currentRow.cells[COLUMN.ICON].getElementsByTagName('img');
  let iconSrc = icons[0].src;
  currentRow.cells[COLUMN.ICON].removeChild(icons[1]);

  let currentBookmark = findBookmark(bookmarkId);
  if (currentBookmark){
    currentBookmark.name = bookmarkName;
    currentBookmark.url = bookmarkUrl;
    currentBookmark.imgUrl = iconSrc;
  }
  else {
    bookmarks.push({ name:bookmarkName, url:bookmarkUrl, imgUrl:iconSrc, id:bookmarkId });
  }
  saveBookmarks();
  toggleEditButtonDisable(false);
  var buttons = currentRow.cells[COLUMN.EDIT_SAVE].getElementsByTagName('button');
  buttons[EDIT_BTN].style = 'display:block;';
  buttons[SAVE_BTN].style = 'display:none';
}

/*
 *     deleteRow Function
 */
function deleteRow(bookmarkId) {
  let bookmarkTableBody = document.getElementById('bookmarkTableBody');
  let rows = bookmarkTableBody.rows;
  for (let i = 0; i < rows.length; i++){
    if(parseInt(rows[i].id) === bookmarkId){
      // If the row to be deleted has an input element in the name field, this indicates
      // that the row is currently being edited and we must re-enable all other edit buttons
      if(rows[i].cells[COLUMN.NAME].getElementsByTagName('input').length){
        toggleEditButtonDisable(false);
      }
      bookmarkTableBody.deleteRow(i);
      break;
    }
  }
  for (let i = 0; i < bookmarks.length; i++){
    if(bookmarks[i].id === bookmarkId){
      bookmarks.splice(i, 1);
    }
  }
  saveBookmarks();
}

/*
 *     newRow Function
 */
function newRow() {
  var bookmarkTableBody = document.getElementById('bookmarkTableBody');
  var newBookmarkRow = buildRow('', '', defaultIcon, nextId);
  nextId++;
  bookmarkTableBody.appendChild(newBookmarkRow);
  editRow(newBookmarkRow);
}

/*
 *     findBookmark Function
 */
function findBookmark (bookmarkId){
  for (let i = 0; i < bookmarks.length; i++){
    if (bookmarks[i].id === bookmarkId){
      return bookmarks[i];
    }
  }
  return 0;
}

/*
 *      setUploadStatus Function
 */
function setUploadStatus(message) {
  var statusEl = document.getElementById("imgUploadStatus");
  statusEl.innerText = message;
}

/*
 *     restoreDefaultImage Function
 */
function restoreDefaultImage() {
  function onRestoreError(){
    setUploadStatus("Restoring default image failed");
  }
  function onXhrGet(status, response){
    function onReaderLoad(result){
      chrome.storage.local.set({ 'backgroundImage' : result}, function() {
        location.reload();
      });
    }
    if(status == 200){
      readFile(response, onReaderLoad, onRestoreError);
    } else { onRestoreError(); }
  }
  var resp = confirm("Restore default background image?\n\nThis cannot be undone...");
  if(!resp){ return; }
  getViaXhr('/images/bg.jpg', 'blob', onXhrGet, onRestoreError);
}

/*
 *     uploadImage Function
 */
function uploadImage() {
  var imageInput = document.getElementById('uploadImage');

  function uploadSucces(result) {
    var previewEl = document.getElementById('bgImgPreview');
    previewEl.src = result;
    chrome.storage.local.set({ "backgroundImage" : result}, function(data) {
      setUploadStatus("Upload complete");
    });
  }

  function uploadError(){
    setUploadStatus("Error occurred while trying to upload image. Please try again.");
  }

  // If user clicks cancel on choose file diaglog, this function will still be
  // called but files variable will be empty... so we check first
  if(imageInput.files.length) {
    var file = imageInput.files[0];
    setUploadStatus("Uploading...");
    readFile(file, uploadSucces, uploadError);
  }
}

/*
 *    saveBookmarks Function
 */
function saveBookmarks(){
  chrome.storage.local.set({
    sites: bookmarks
  }, function() {});
}

/*
 *      changeTab Function
 */
function changeTab(evt, tabIndex) {
  var tabLinks = document.getElementsByClassName('tablinks');
  var tabContent = document.getElementsByClassName('tabcontent');
  tabContent[activeTab].style.display = 'none';
  tabLinks[activeTab].className = tabLinks[activeTab].className.replace(' active', '');
  activeTab = tabIndex;
  tabContent[activeTab].style.display = 'block';
  tabLinks[activeTab].className += ' active';
  setModalMessage('');
}

/*
 *      getFavIcons Function
 */
function getFavIcons(){
  var url = document.getElementById('scanIconInput').value;
  
  function toggleScanButton(){
    var scanSiteBtn = document.getElementById('scanIconBtn');
    scanSiteBtn.disabled = !scanSiteBtn.disabled;
  }
  
  function setScanMessage(msg){
    messageDiv = document.getElementById('scanMessage');
    messageDiv.innerText = msg;
  }
  
  function callback(icons, msg){
    var scanResultsContainer = document.getElementById('scanResultsContainer');
    for (let i = 0; i < icons.length; i++){
      let iconElement = document.createElement('img');
      iconElement.className = 'scanIcon';
      iconElement.src = icons[i];
      iconElement.alt = 'icon' + i;
      iconElement.onclick = function() { iconClicked(iconElement) };
      scanResultsContainer.appendChild(iconElement);
    }
    setScanMessage(msg);
    toggleScanButton();
  }
  document.getElementById('scanResultsContainer').innerHTML = '';
  setScanMessage('Scanning site for icons. Please wait.');
  toggleScanButton();
  scanSiteForFavIcon(url, callback);
}

/*
 *      getViaXhr Function
 */
function getViaXhr(url, responseType, onLoad, onError){
  var request = new XMLHttpRequest();
  request.responseType = responseType;
  request.open('GET', url, true);
  request.addEventListener("error", onError);
  request.addEventListener("load", function(){ onLoad(request.status, request.response) });
  request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  request.send();
}

/*
 *      readFile Function
 */
function readFile(file, onLoad, onError){
  var reader  = new FileReader();
  reader.addEventListener("error", onError);
  reader.addEventListener("load", function(){ onLoad(reader.result) });
  reader.readAsDataURL(file);
}

window.onclick = function(event) {
  if (event.target == modal) {
      closeModal();
  }
}

document.addEventListener('DOMContentLoaded', onPageLoad);
