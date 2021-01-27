function getById(id) { return document.getElementById(id); }

function showElement(el) { el.style.display = 'block'; }

function hideElement(el) { el.style.display = 'none'; }

function loadImageFromUrl(url) {
    return getViaXhr(url, 'blob')
        .then((response) => {
            if (response.type.indexOf('image') === -1) {
                throw new Error('Data loaded is not an image. Make sure URL points to an image file.');
            }

            return readFile(response);
        });
}

function getViaXhr(url, responseType) {
    return new Promise((resolve, reject) => {
        let request = new XMLHttpRequest();
        request.responseType = responseType;
        request.open('GET', url, true);

        request.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                resolve(this.response);
            } else {
                reject({
                    status: this.status,
                    statusText: this.statusText
                });
            }
        };

        request.onerror = function () {
            reject({
                status: this.status,
                statusText: this.statusText
            });
        };

        request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        request.send();
    });
}

function readFile(file) {
    return new Promise(function (resolve, reject) {
        let reader = new FileReader();

        reader.onload = function () {
            resolve(reader.result);
        }

        reader.onerror = function () {
            reject(reader.error);
        }

        reader.readAsDataURL(file);
    });
}



// function getDefaultTileIcon(url) {
//   function onLoad(status, response) {
//     function onFileRead(result) {
//       getById('editIconPreview').src = result;
//     }

//     if (status == 200 && response) {
//       readFile(response, onFileRead, function () { console.log(arguments); })

//       // callback(response);
//     } else {
//       console.log(arguments);
//       // callback(false);
//     }
//   }
//   function onError() {
//     console.log(arguments);
//     // callback(false);
//   }
//   getViaXhr(url + 'favicon.ico', 'blob', onLoad, onError);
// }



export { getById, showElement, hideElement, loadImageFromUrl, getViaXhr, readFile };