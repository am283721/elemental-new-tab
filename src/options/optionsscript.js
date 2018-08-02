const EDIT_BTN_INDEX = 0;
const SAVE_BTN_INDEX = 1;
const CELLS = {
  NAME:0,
  URL:1,
  ICON:2,
  EDIT_SAVE:3
}
var bookmarks = [];
var icons = [];
var defaultIcon = '';
var editIcon = '';
var nextId = 0;
var modal = document.getElementById('iconModal');

/*
 *     loadOptions Function
 */
function loadOptions() {
    // Fetch settings and data
    chrome.storage.local.get({ 'editImage':'', 'backgroundImage':'', 'sites':[], 'icons':[], 'showBookmarkNames':false }, function(data){
      // Load bg image to preview div
      var bgImgPreview = document.getElementById('bgImgPreview');
      bgImgPreview.src = data.backgroundImage;

      // Load bookmarks into settings table
      bookmarks = data.sites;
      if(bookmarks.length){
        nextId = bookmarks[bookmarks.length - 1].id + 1;
        var bookmarktableBody = document.getElementById('bookmarkTableBody');
        for (let i = 0; i < bookmarks.length; i++) {
            let row = buildRow(bookmarks[i].name, bookmarks[i].url, bookmarks[i].imgUrl, bookmarks[i].id);
            bookmarktableBody.appendChild(row);
        }
      }

      editIcon = data.editImage;

      // Find the default icon
      icons = data.icons;
      for (let i = 0; i < icons.length; i++){
        if(icons[i].name === 'Default'){
          defaultIcon = icons[i].imgUrl;
          break;
        }
      }

      // Setup icon modal
      var modalClose = document.getElementById('modalClose');
      modalClose.onclick = function() { modal.style.display = "none"; };
      var modalCancel = document.getElementById('modalCancel');
      modalCancel.onclick = function() { modal.style.display = "none"; }
      var tabLinks = document.getElementsByClassName('tablinks');
      tabLinks[0].onclick = function() { changeTab(event, 'library') };
      tabLinks[1].onclick = function() { changeTab(event, 'upload') };
      tabLinks[0].click();
      var iconLibraryContainer = document.getElementById('iconLibraryContainer');
      for(let i = 0; i < icons.length; i++){
        let iconElement = document.createElement('img');
        iconElement.className = 'libraryImage';
        iconElement.src = icons[i].imgUrl;
        iconElement.alt = icons[i].name;
        iconElement.onclick = function() { iconLibraryClicked(iconElement) };
        iconLibraryContainer.appendChild(iconElement);
      }
  
      // Set checkbox to show bookmark names in UI and add listener
      var showBookmarkNames = data.showBookmarkNames;
      var showNamesCheckbox = document.getElementById('showBookmarkNames');
      showNamesCheckbox.checked = showBookmarkNames;
      showNamesCheckbox.onchange = function(){
        chrome.storage.local.set({'showBookmarkNames':showNamesCheckbox.checked });
      }
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

  urlCol.innerText = url;
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
  let iconSrc = row.cells[CELLS.ICON].getElementsByTagName('img')[0].src;
  let modalSaveBtn = document.getElementById('modalSave');
  modalSaveBtn.onclick = function() { saveIcon(row) };

  let imgElement = document.getElementById('modalIconPreview');
  imgElement.src = iconSrc;
  let imgBackground = document.getElementById('modalIconBackground');
  imgBackground.src = iconSrc;
  modal.style.display = "block";
}

/*
 *     uploadIcon Function
 */
function uploadIcon() {
  if(iconInput.files.length) {
    let imgElement = document.getElementById('modalIconPreview');
    let imgBackground = document.getElementById('modalIconBackground');
    var file = iconInput.files[0];

    if(FileReader && file) {
      var reader  = new FileReader();
      reader.addEventListener("load", function () {
        imgElement.src = reader.result;
        imgBackground.src = reader.result;
      }, false);

      reader.readAsDataURL(file);
    }
  }
}

/*
 *     saveIcon Function
 */
function saveIcon(row) {
  let rowIcon = row.cells[CELLS.ICON].getElementsByTagName('img')[0];
  let tabLinks = document.getElementsByClassName('tablinks');
  if(tabLinks[0].className.indexOf('active') !== -1){
    let iconList = document.getElementById('iconLibraryContainer').getElementsByTagName('img');
    for(let i = 0; i < iconList.length; i++){
      if(iconList[i].className.indexOf('selected') !== -1){
        rowIcon.src = iconList[i].src;
      }
    }
  }
  else {
    let newIconSrc = document.getElementById('modalIconPreview').src;
    rowIcon.src = newIconSrc;
  }

  deselectIcons();
  modal.style.display = "none";
}

/*
 *      iconLibraryClicked Function
 */
function iconLibraryClicked(iconElement){
  
  iconElement.className += ' selectedIcon';
}

function deselectIcons(){
  var iconList = document.getElementById('iconLibraryContainer').getElementsByTagName('img');
  for(let i = 0; i < iconList.length; i++){
    iconList[i].className = iconList[i].className.replace(' selectedIcon', '');
  }
}

/*
 *      toggleEditButtonDisable Function
 */
function toggleEditButtonDisable (isDisabled) {
  var rows = document.getElementById('bookmarkTableBody').rows;
  var currentButtons;
  for(let i = 0; i < rows.length; i++) {
    currentButtons = rows[i].cells[CELLS.EDIT_SAVE].getElementsByTagName('button');
    currentButtons[EDIT_BTN_INDEX].disabled = isDisabled;
  }
}

/*
 *     editRow Function
 */
function editRow(currentRow) {

  // Disable all edit buttons while editing a specific row
  toggleEditButtonDisable(true);

  // Hide edit button and show save button
  let buttons = currentRow.cells[CELLS.EDIT_SAVE].getElementsByTagName('button');
  buttons[EDIT_BTN_INDEX].style = 'display:none;';
  buttons[SAVE_BTN_INDEX].style = 'display:block';

  // Convert name cell into input and pre-fill with existing value
  let nameCell = currentRow.cells[CELLS.NAME];
  let bookmarkName = nameCell.innerText;
  nameCell.innerText = '';
  let nameInput = document.createElement('input');
  nameInput.value = bookmarkName;
  nameCell.appendChild(nameInput);

  // Convert url cell into input and pre-fill with existing value
  let urlCell = currentRow.cells[CELLS.URL];
  let bookmarkUrl = urlCell.innerText;
  urlCell.innerText = '';
  let urlInput = document.createElement('input');
  urlInput.value = bookmarkUrl;
  urlCell.appendChild(urlInput);

  let iconElement = currentRow.cells[CELLS.ICON].getElementsByTagName('img')[0];
  let iconOverlay = document.createElement('img');
  iconOverlay.addEventListener('click', function(){ showIconModal(currentRow) });
  iconOverlay.src = editIcon;
  iconOverlay.className = 'iconOverlay';
  currentRow.cells[CELLS.ICON].appendChild(iconOverlay);
}

/*
 *     saveRow Function
 */
function saveRow(currentRow, bookmarkId) {
  let nameCell = currentRow.cells[CELLS.NAME];
  let bookmarkName = nameCell.childNodes[0].value;
  nameCell.removeChild(nameCell.childNodes[0]);
  nameCell.innerText = bookmarkName;

  let urlCell = currentRow.cells[CELLS.URL];
  let bookmarkUrl = urlCell.childNodes[0].value;
  urlCell.removeChild(urlCell.childNodes[0]);
  urlCell.innerText = bookmarkUrl;

  let icons = currentRow.cells[CELLS.ICON].getElementsByTagName('img');
  let iconSrc = icons[0].src;
  currentRow.cells[CELLS.ICON].removeChild(icons[1]);

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

  // Enable all edit buttons upon saving row
  toggleEditButtonDisable(false);

  // Show edit button and hide save button
  var buttons = currentRow.cells[CELLS.EDIT_SAVE].getElementsByTagName('button');
  buttons[EDIT_BTN_INDEX].style = 'display:block;';
  buttons[SAVE_BTN_INDEX].style = 'display:none';

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
      if(rows[i].cells[CELLS.NAME].getElementsByTagName('input').length){
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
 *     restoreDefaultImage Function
 */
function restoreDefaultImage() {
  var resp = confirm("Restore default background image?\n\nThis cannot be undone...");
  if(!resp){
    return;
  }
  var bgImgUrl = '/images/bg.jpg';
  var request = new XMLHttpRequest();
  request.open('GET', bgImgUrl, true);
  request.responseType = 'blob';
  request.addEventListener('load', function() {
      var reader  = new FileReader();
      reader.addEventListener("load", function () {
          chrome.storage.local.set({ 'backgroundImage' : reader.result}, function() {
            location.reload();
          });
      }, false);

      reader.readAsDataURL(request.response);
  });
  request.send();
}

/*
 *     uploadImage Function
 */
function uploadImage() {
  
  function setUploadStatus(message) {
    var statusEl = document.getElementById("imgUploadStatus");
    statusEl.innerText = message;
  }
  // If user clicks cancel on choose file diaglog, this function will be
  // called but files variable will be empty... so we check first
  if(imageInput.files.length) {
    var previewEl = document.getElementById('bgImgPreview');
    var file = imageInput.files[0];

    if(FileReader && file) {
      var reader  = new FileReader();
      reader.addEventListener("load", function () {
        previewEl.src = reader.result;
        chrome.storage.local.set({ "backgroundImage" : reader.result}, function(data) {
          setUploadStatus("Upload complete");
        });
      }, false);

      setUploadStatus("Uploading...");
      reader.readAsDataURL(file);
    }
    else {
      setUploadStatus("Error occurred while trying to upload image. Please try again.");
    }
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
function changeTab(evt, tabName) {
  var tabLinks = document.getElementsByClassName('tablinks');
  var tabContent = document.getElementsByClassName('tabcontent');
  const LIBRARY = 0;
  const UPLOAD = 1;

  if(tabName === 'library'){
    tabContent[UPLOAD].style.display = 'none';
    tabLinks[UPLOAD].className = tabLinks[UPLOAD].className.replace(' active', '');
    tabContent[LIBRARY].style.display = 'block';
    tabLinks[LIBRARY].className += ' active';
  }
  else {
    tabContent[LIBRARY].style.display = 'none';
    tabLinks[LIBRARY].className = tabLinks[UPLOAD].className.replace(' active', '');
    tabContent[UPLOAD].style.display = 'block';
    tabLinks[UPLOAD].className += ' active';
  }
}

window.onclick = function(event) {
  if (event.target == modal) {
      modal.style.display = "none";
  }
}

var restoreBtn = document.getElementById('restoreButton');
restoreBtn.addEventListener('click', restoreDefaultImage);

var imageInput = document.getElementById('uploadImage');
imageInput.addEventListener('change', uploadImage);

var newBookmarkBtn = document.getElementById('newBookmarkBtn');
newBookmarkBtn.addEventListener('click', newRow);

var iconInput = document.getElementById('uploadIcon');
iconInput.addEventListener('change', uploadIcon);

document.addEventListener('DOMContentLoaded', loadOptions);
