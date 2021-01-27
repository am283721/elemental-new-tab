import Modal from "./modal.js";
import { getById, loadImageFromUrl, readFile } from "./utils.js";

export default class BackgroundModal extends Modal {

    constructor(...args) {
        super(...args);
        getById('uploadImageInput').addEventListener('change', () => this.uploadImageInputChange());
        getById('imageFromUrlInput').addEventListener('keypress', (event) => {
            this.setMessage('');

            if (event.key === 'Enter') {
                this.save();
            }
        });
    }

    save() {
        let activeTabs = this.el.getElementsByClassName('activeTab');
        this.setMessage('');

        if (activeTabs.length) {
            if (activeTabs[0].id === 'backgroundFromComputerTabBtn') {
                let imageInput = getById('uploadImageInput');

                if (!imageInput.files.length) {
                    this.setMessage('No file selected...');
                }
                else {
                    this.disableSaveButton();
                    this.uploadBackgroundImage(imageInput.files[0]);
                }
            } else {
                let url = getById('imageFromUrlInput').value;

                if (!url || !url.length) {
                    this.setMessage('No url specified...');
                }
                else {
                    this.disableSaveButton();
                    this.loadBackgroundImgFromUrl(url);
                }
            }
        }
    }

    uploadImageInputChange() {
        let imageInput = getById('uploadImageInput');
        if (imageInput.files.length) {
            this.setMessage('');
        }
    }

    async uploadBackgroundImage(file) {
        readFile(file)
            .then(result => {
                this.enableSaveButton();
                this.hide();

                let event = new CustomEvent("backgroundchange", { "detail": result });
                document.dispatchEvent(event);
            })
            .catch(() => {
                this.enableSaveButton()
                this.setMessage('Error occurred while trying to upload image. Please try again.');
            });
    }

    loadBackgroundImgFromUrl(url) {
        this.showLoadingMessage();

        loadImageFromUrl(url)
            .then(result => {
                this.hide();

                let event = new CustomEvent("backgroundchange", { "detail": result });
                document.dispatchEvent(event);
            })
            .catch(() => {
                this.setMessage('Loading image from URL failed. Make sure URL points to an image file.');
            })
            .finally(() => {
                this.enableSaveButton();
                this.hideLoadingMessage();
            });
    }

    showLoadingMessage() {
        getById('loadingUrlMessage').style.display = 'block';
    }

    hideLoadingMessage() {
        getById('loadingUrlMessage').style.display = 'none';
    }
}