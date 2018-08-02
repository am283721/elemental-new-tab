chrome.runtime.onInstalled.addListener(function(details) {
    // On fresh install, load default images and settings
    if(details.reason == 'install'){
        var sites =
        [
            { name: 'Facebook', url:'https://www.facebook.com/', imgUrl:'facebook.jpg', id:0 },
            { name: 'Reddit', url:'https://www.reddit.com/', imgUrl:'reddit.jpg', id:1 },
            { name: 'YouTube', url:'https://www.youtube.com/', imgUrl:'youtube.jpg', id:2 },
            { name: 'Inbox', url:'https://inbox.google.com/', imgUrl:'inbox.jpg', id:3 },
            { name: 'News', url:'https://news.google.com/', imgUrl:'news.jpg', id:4 },
            { name: 'Robinhood', url:'https://robinhood.com/', imgUrl:'robinhood.jpg', id:5 },
            { name: 'Duolingo', url:'https://www.duolingo.com/', imgUrl:'duolingo.jpg', id:6 },
            { name: 'Photos', url:'https://photos.google.com/', imgUrl:'photos.jpg', id:7 }
        ];

        var icons = 
        [
            { name: 'Default', imgUrl: 'default.jpg' },
            { name: 'Facebook', imgUrl: 'facebook.jpg' },
            { name: 'Reddit', imgUrl: 'reddit.jpg' },
            { name: 'YouTube', imgUrl: 'youtube.jpg' },
            { name: 'Inbox', imgUrl: 'inbox.jpg' },
            { name: 'Translate', imgUrl: 'translate.jpg' },
            { name: 'Robinhood', imgUrl: 'robinhood.jpg' },
            { name: 'Duolingo', imgUrl: 'duolingo.jpg' },
            { name: 'Photos', imgUrl: 'photos.jpg' },
            { name: 'Amazon', imgUrl: 'amazon.jpg' },
            { name: 'Gmail', imgUrl: 'gmail.jpg' },
            { name: 'Instagram', imgUrl: 'instagram.jpg' },
            { name: 'Maps', imgUrl: 'maps.jpg' },
            { name: 'Netflix', imgUrl: 'netflix.jpg' },
            { name: 'News', imgUrl: 'news.jpg' },
            { name: 'Spotify', imgUrl: 'spotify.jpg' },
            { name: 'Twitter', imgUrl: 'twitter.jpg' },
            { name: 'Vimeo', imgUrl: 'vimeo.jpg' },
            { name: 'Wikipedia', imgUrl: 'wikipedia.jpg' },
            { name: 'Yahoo', imgUrl: 'yahoo.jpg' },
            { name: 'YouTube', imgUrl: 'youtube.jpg' }
        ];

        var backgroundImage = '/images/bg.jpg';
        var editImage = '/images/edit.jpg';

        // TODO: Combine the following 2 or 4 methods into one. I was feeling lazy
        // Also maybe add logic so that images contained in both the bookmarks and
        // the icons list aren't read twice.
        // Recursive function to read each bookmark image url and replace with blob file
        function readBookmarkImages(currentBookmark) {
            if(currentBookmark === sites.length){
                readIconImages(0);
            } else {
                let imgUrl = '/images/' + sites[currentBookmark].imgUrl;
                let request = new XMLHttpRequest();
                request.open('GET', imgUrl, true);
                request.responseType = 'blob';
                request.addEventListener('load', function() {
                    let reader  = new FileReader();
                    reader.addEventListener("load", function () {
                        sites[currentBookmark].imgUrl = reader.result;
                        readBookmarkImages(currentBookmark + 1);
                    }, false);
                
                    reader.readAsDataURL(request.response);
                });
                request.send();
            }
        }

        // Recursive function to read each icon and replace with blob file
        function readIconImages(currentIcon) {
            if(currentIcon === icons.length){
                readBackgroundImage();
            } else {
                let imgUrl = '/images/' + icons[currentIcon].imgUrl;
                let request = new XMLHttpRequest();
                request.open('GET', imgUrl, true);
                request.responseType = 'blob';
                request.addEventListener('load', function() {
                    let reader  = new FileReader();
                    reader.addEventListener("load", function () {
                        icons[currentIcon].imgUrl = reader.result;
                        readIconImages(currentIcon + 1);
                    }, false);
                
                    reader.readAsDataURL(request.response);
                });
                request.send();
            }
        }

        function readBackgroundImage(){
            let bgImgUrl = backgroundImage;
            let request = new XMLHttpRequest();
            request.open('GET', bgImgUrl, true);
            request.responseType = 'blob';
            request.addEventListener('load', function() {
                let reader  = new FileReader();
                reader.addEventListener("load", function () {
                    backgroundImage = reader.result;
                    readEditImage();
                }, false);
            
                reader.readAsDataURL(request.response);
            });
            request.send();
        }

        function readEditImage(){
            let editImgUrl = editImage;
            let request = new XMLHttpRequest();
            request.open('GET', editImgUrl, true);
            request.responseType = 'blob';
            request.addEventListener('load', function() {
                let reader  = new FileReader();
                reader.addEventListener("load", function () {
                    editImage = reader.result;
                    saveSettings();
                }, false);
            
                reader.readAsDataURL(request.response);
            });
            request.send();
        }

        function saveSettings(){
            chrome.storage.local.set({ 'sites':sites, 'icons':icons, 'backgroundImage':backgroundImage, 'editImage':editImage, 'showBookmarkNames':false }, function(){});
        }

        readBookmarkImages(0);
    };
  });
