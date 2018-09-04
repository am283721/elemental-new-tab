chrome.runtime.onInstalled.addListener(function(details) {
    // On fresh install, load default images and settings
    if(details.reason == 'install'){
        var sites =
        [
            { name: 'Facebook', url:'https://www.facebook.com/', imgUrl:'facebook.jpg', id:0 },
            { name: 'Reddit', url:'https://www.reddit.com/', imgUrl:'reddit.jpg', id:1 },
            { name: 'YouTube', url:'https://www.youtube.com/', imgUrl:'youtube.jpg', id:2 },
            { name: 'Inbox', url:'https://inbox.google.com/', imgUrl:'inbox.jpg', id:3 },
            { name: 'News', url:'https://news.google.com/', imgUrl:'news.jpg', id:4 }
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

        function readImage(url, callback){
            function onError(){ callback(''); }
            function onXhrGet(status, response){
                function onReaderLoad(result){ callback(result); }
                if(status == 200){
                    readFile(response, onReaderLoad, onError);
                } else { onError(); }
            }
            getViaXhr(url, 'blob', onXhrGet);
        }

        // Recursive function to process an array of images. Objects in array
        // must contain an 'imgUrl' variable containing the name of the image
        function readImageArray(images, currentIndex, endCallback) {
            if(currentIndex === images.length){
                endCallback();
            } else{
                let imgUrl = '/images/' + images[currentIndex].imgUrl;
                readImage(imgUrl, function(result){
                    if(result.length){
                        images[currentIndex].imgUrl = result;
                        readImageArray(images, currentIndex + 1, endCallback);
                    } else{
                        images.splice(currentIndex, 1);
                        readImageArray(images, currentIndex, endCallback);
                    }
                });
            }
        }

        function getViaXhr(url, responseType, onLoad, onError){
            var request = new XMLHttpRequest();
            request.responseType = responseType;
            request.open('GET', url, true);
            request.addEventListener("error", onError);
            request.addEventListener("load", function(){ onLoad(request.status, request.response) });
            request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            request.send();
        }

        function readFile(file, onLoad, onError){
            var reader  = new FileReader();
            reader.addEventListener("error", onError);
            reader.addEventListener("load", function(){ onLoad(reader.result) });
            reader.readAsDataURL(file);
        }

        function saveSettings(){
            chrome.storage.local.set({ 'sites':sites, 'icons':icons, 'backgroundImage':backgroundImage, 'editImage':editImage, 'showBookmarkNames':false }, function(){});
        }

        // Potentially convoluted series of asychronous calls to load data and save it in chrome storage
        readImageArray(sites, 0, function(){ // Load sites
            readImageArray(icons, 0, function(){ // Load icons
                readImage(backgroundImage, function(result){ // Load background image
                    backgroundImage = result;
                    readImage(editImage, function(result){ // Load edit image then save settings
                        editImage = result;
                        saveSettings();
                    });
                })
            })
        });
    };
  });