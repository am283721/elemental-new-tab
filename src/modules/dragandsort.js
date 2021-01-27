
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
    elem.addEventListener('dragenter', handleDragEnter)
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

export { makeSortable, updateSortingIds };