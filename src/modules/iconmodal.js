import Modal from "./modal.js";
import { getViaXhr, readFile, getById, showElement, hideElement, loadImageFromUrl } from "./utils.js";

export default class IconModal extends Modal {
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