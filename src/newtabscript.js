"use strict";

chrome.storage.local.get({
    'backgroundImage': '', 'sites': [], 'showBookmarkNames': 'hover',
    'bookmarkPosition': 'middle'
}, function (data) {
    // Set background image
    document.body.style.backgroundImage = "url('" + data.backgroundImage + "')";

    document.getElementById('optionsBtn').addEventListener('click', function () {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('options.html'));
        }
    });

    // Load bookmarks
    var bookmarkContainer = document.getElementById('linksContainer');
    for (let i = 0; i < data.sites.length; i++) {
        let newImage = new Image();
        let imgUrl = data.sites[i].url;
        let linkText = data.sites[i].name;
        newImage.src = data.sites[i].imgUrl;
        newImage.id = 'link-' + i;
        newImage.className = 'linkImg';
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
    var showNames = data.showBookmarkNames;
    if (showNames !== 'hover') {
        var elements = document.querySelectorAll('.linkText');
        var nameOpacity = showNames === 'never' ? 0 : 1;
        for (let i = 0; i < elements.length; i++) {
            elements[i].style.opacity = nameOpacity;
        }
    }

    var bookmarkPosition = data.bookmarkPosition;
    if (bookmarkPosition === 'top') {
        bookmarkContainer.style.marginTop = '50px';
    } else if (bookmarkPosition === 'middle') {
        bookmarkContainer.style.marginTop = '45vh';//((window.innerHeight / 2) - 80) + 'px';
    } else {
        bookmarkContainer.style.position = 'absolute';
        bookmarkContainer.style.bottom = '10px';
    }
});