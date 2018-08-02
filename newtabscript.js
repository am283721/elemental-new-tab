chrome.storage.local.get({ 'backgroundImage':'', 'sites':[], 'showBookmarkNames':false }, function(data){
    // Set background image
    document.body.style.backgroundImage = "url('" + data.backgroundImage + "')";
   
    // Load bookmarks
    for (let i = 0; i < data.sites.length; i++) {
        let newImage = new Image();
        let imgUrl = data.sites[i].url;
        let linkText = data.sites[i].name;
        newImage.src = data.sites[i].imgUrl;
        newImage.id = 'link-' + i;
        let newDiv = document.createElement('div');
        newDiv.className = 'link';
        newDiv.addEventListener('click', () =>
            chrome.tabs.update({ url: imgUrl })
        );
        let newSpan = document.createElement('span');
        newSpan.innerText = linkText;
        newSpan.className = 'linkText';
        let linksContainer = document.getElementById('linksContainer');
        linksContainer.appendChild(newDiv);
        newDiv.appendChild(newImage);
        newDiv.appendChild(newSpan);
    }

    if(data.showBookmarkNames) {
        var elements = document.querySelectorAll('.linkText');
        for(let i = 0; i < elements.length; i++){
            elements[i].style.opacity = 1
        }
    }
});