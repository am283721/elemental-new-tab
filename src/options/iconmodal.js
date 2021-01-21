
class IconModal extends Modal {
    constructor(...args) {
        super(...args);

        this.selectedIcon = null;

        $('uploadIconInput').addEventListener('change', () => this.uploadIcon());
        $('scanIconBtn').addEventListener('click', () => this.getFavIcons());
        $('searchIconInput').addEventListener('input', event => this.filterIconLibrary(event.target.value.toLowerCase()));
    }

    show() {
        super.show();
        let src = $('editIconPreview').src;

        $('scanIconInput').value = $('editUrlInput').value;
        $('modalIconPreview').src = src;
        $('modalIconBackground').src = src;
        $('libraryTabBtn').click();
    }

    changeTab(tab) {
        super.changeTab(tab);
        this.deselectIcon();
    }

    getFavIcons() {
        let url = $('scanIconInput').value;

        function toggleScanButton() {
            let scanSiteBtn = $('scanIconBtn');
            scanSiteBtn.disabled = !scanSiteBtn.disabled;
        }

        function setScanMessage(msg) {
            let messageDiv = $('scanMessage');
            messageDiv.innerText = msg;
        }

        let callback = (icons, msg) => {
            let scanResultsContainer = $('scanResultsContainer');

            for (let i = 0; i < icons.length; i++) {
                let iconElement = document.createElement('img');
                iconElement.className = 'scanIcon';
                iconElement.src = icons[i];
                iconElement.alt = 'icon' + i;
                iconElement.onclick = () => this.iconClicked(iconElement);
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

    uploadIcon() {
        let onError = () => {
            this.setMessage('Failed to upload icon. Please try again');
        }

        let onLoad = (result) => {
            $('modalIconPreview').src = result;
            $('modalIconBackground').src = result;
        }

        let iconInput = $('uploadIconInput');

        if (iconInput.files.length) {
            let file = iconInput.files[0];
            readFile(file, onLoad, onError);
        }
    }

    save() {
        if ($('uploadTabBtn').classList.contains('activeTab')) {
            this.selectedIcon = $('modalIconPreview');
        }

        if (!this.selectedIcon) {
            this.setMessage('No icon selected');
            return;
        }

        $('editIconPreview').src = this.selectedIcon.src;
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
        let icons = $('iconLibraryContainer').children;

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
        $('searchIconInput').value = '';
        this.removeChildren($('scanResultsContainer'));
        this.filterIconLibrary('');
        this.hide();
    }
}