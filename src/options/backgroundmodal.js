class BackgroundModal extends Modal {

    constructor(...args) {
        super(...args);
        $('uploadImageInput').addEventListener('change', () => this.uploadImageInputChange());
        $('imageFromUrlInput').addEventListener('keypress', (event) => {
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
                let imageInput = $('uploadImageInput');

                if (!imageInput.files.length) {
                    this.setMessage('No file selected...');
                }
                else {
                    this.disableSaveButton();
                    this.uploadBackgroundImage(imageInput.files[0]);
                }
            } else {
                let url = $('imageFromUrlInput').value;

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
        let imageInput = $('uploadImageInput');
        if (imageInput.files.length) {
            this.setMessage('');
        }
    }

    uploadBackgroundImage(file) {

        let uploadSuccess = (result) => {
            setBackgroundImage(result);

            chrome.storage.local.set({ 'backgroundImage': result }, () => {
                this.enableSaveButton();

                if (chrome.runtime.lastError) {
                    this.setMessage('Failed to save image file to local storage.');
                }
                else {
                    this.hide();
                    showSuccessAlert();
                }
            });
        }

        let uploadError = () => {
            this.enableSaveButton()
            this.setMessage('Error occurred while trying to upload image. Please try again.');
        }

        readFile(file, uploadSuccess, uploadError);
    }

    loadBackgroundImgFromUrl(url) {
        let onError = () => {
            this.enableSaveButton();
            $('loadingUrlMessage').style.display = 'none';
            this.setMessage('Loading image from URL failed. Make sure URL points to an image file.');
        }

        let onXhrGet = (status, response) => {
            let onReaderLoad = (result) => {
                setBackgroundImage(result);

                chrome.storage.local.set({ 'backgroundImage': result }, () => {
                    this.enableSaveButton();
                    this.hideLoadingMessage();

                    if (chrome.runtime.lastError) {
                        this.setMessage('Failed to save image file to local storage.');
                    }
                    else {
                        this.setMessage('');
                        this.hide();
                        showSuccessAlert();
                    }
                });
            }

            if (status == 200) {
                if (response.type.indexOf('image') === -1) {
                    this.setMessage('Data loaded is not an image. Make sure URL points to an image file.');
                } else {
                    readFile(response, onReaderLoad, onError);
                }
            } else { onError(); }
        }

        this.showLoadingMessage();
        getViaXhr(url, 'blob', onXhrGet, onError);
    }

    showLoadingMessage() {
        $('loadingUrlMessage').style.display = 'block';
    }

    hideLoadingMessage() {
        $('loadingUrlMessage').style.display = 'none';
    }
}