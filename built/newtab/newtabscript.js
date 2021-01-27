(function () {
    'use strict';

    chrome.storage.local.get({
        backgroundImage: '',
        sites: [],
        showBookmarkNames: 'hover',
        bookmarkPosition: 'middle',
        bookmarkShape: 'circle',
        backgroundPosition: 'center',
        backgroundSize: 'cover'
    }, initPage);

    function initPage(data) {
        setBackground(data);
        activateOptionsBtn();
        addBookmarkIcons(data);
    }

    function setBackground(data) {
        document.body.style.backgroundImage = "url('" + data.backgroundImage + "')";
        document.body.style.backgroundPosition = data.backgroundPosition;
        document.body.style.backgroundSize = data.backgroundSize;
    }

    function activateOptionsBtn() {
        document.getElementById('optionsBtn').addEventListener('click', function () {
            if (chrome.runtime.openOptionsPage) {
                chrome.runtime.openOptionsPage();
            } else {
                window.open(chrome.runtime.getURL('options.html'));
            }
        });
    }

    function addBookmarkIcons(data) {
        let bookmarkContainer = document.getElementById('linksContainer');
        let bookmarkClass = `icon-${data.bookmarkShape}`;

        for (let i = 0; i < data.sites.length; i++) {
            let newImage = new Image();
            let imgUrl = data.sites[i].url;
            let linkText = data.sites[i].name;
            newImage.src = data.sites[i].imgUrl;
            newImage.id = 'link-' + i;
            newImage.className = `link-icon ${bookmarkClass}`;
            let newDiv = document.createElement('div');
            newDiv.className = 'link';
            newDiv.addEventListener('click', () =>
                chrome.tabs.update({ url: imgUrl })
            );
            let newSpan = document.createElement('span');
            newSpan.innerText = linkText;
            newSpan.className = 'linkText';
            bookmarkContainer.appendChild(newDiv);
            newDiv.appendChild(newImage);
            newDiv.appendChild(newSpan);
        }

        updateBookmarkLabelBehavior(data.showBookmarkNames);
        updateBookmarkPosition(data.bookmarkPosition, bookmarkContainer);
    }

    function updateBookmarkLabelBehavior(showNames) {
        // Default behavior is show names on hover
        if (showNames !== 'hover') {
            let elements = document.querySelectorAll('.linkText');
            let nameOpacity = showNames === 'never' ? 0 : 1;

            for (let el of elements) {
                el.style.opacity = nameOpacity;
            }
        }
    }

    function updateBookmarkPosition(bookmarkPosition, bookmarkContainer) {
        if (bookmarkPosition === 'top') {
            bookmarkContainer.style.paddingTop = '50px';
        } else if (bookmarkPosition === 'middle') {
            bookmarkContainer.style.paddingTop = '45vh';
        } else {
            bookmarkContainer.style.position = 'absolute';
            bookmarkContainer.style.bottom = '10px';
        }
    }

}());
