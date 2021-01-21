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
            hideElement($('' + activeTabs[0].getAttribute('data-content')));
            activeTabs[0].classList.remove('activeTab');
        }

        showElement($('' + tab.getAttribute('data-content')));
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