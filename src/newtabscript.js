"use strict";

chrome.storage.local.get({
    backgroundImage: '', sites: [], showBookmarkNames: 'hover',
    bookmarkPosition: 'middle', bookmarkShape: 'circle', backgroundPosition: 'center', backgroundSize: 'cover'
}, function (data) {
    // Set background image
    document.body.style.backgroundImage = "url('" + data.backgroundImage + "')";
    document.body.style.backgroundPosition = data.backgroundPosition;
    document.body.style.backgroundSize = data.backgroundSize;

    document.getElementById('optionsBtn').addEventListener('click', function () {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('options.html'));
        }
    });

    // Load bookmarks
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

    // Update behavior of bookmark names depending on user settings
    // Default behavior is show names on hover
    let showNames = data.showBookmarkNames;
    if (showNames !== 'hover') {
        let elements = document.querySelectorAll('.linkText');
        let nameOpacity = showNames === 'never' ? 0 : 1;
        for (let i = 0; i < elements.length; i++) {
            elements[i].style.opacity = nameOpacity;
        }
    }

    let bookmarkPosition = data.bookmarkPosition;
    if (bookmarkPosition === 'top') {
        bookmarkContainer.style.paddingTop = '50px';
    } else if (bookmarkPosition === 'middle') {
        bookmarkContainer.style.paddingTop = '45vh';
    } else {
        bookmarkContainer.style.position = 'absolute';
        bookmarkContainer.style.bottom = '10px';
    }
});