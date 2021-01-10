"use strict";

chrome.runtime.onInstalled.addListener(function (details) {

    var sites =
        [
            { name: 'Facebook', url: 'https://www.facebook.com/', imgUrl: 'facebook.jpg', id: 0 },
            { name: 'YouTube', url: 'https://www.youtube.com/', imgUrl: 'youtube.jpg', id: 2 },
            { name: 'Instagram', url: 'https://instagram.com/', imgUrl: 'instagram.jpg', id: 3 },
            { name: 'Twitter', url: 'https://twitter.com/', imgUrl: 'twitter.jpg', id: 4 }
        ];
    var icons =
        [
            { name: 'Default', imgUrl: 'default.jpg' },
            { name: 'Facebook social media', imgUrl: 'facebook.jpg' },
            { name: 'Reddit', imgUrl: 'reddit.jpg' },
            { name: 'YouTube video streaming', imgUrl: 'youtube.jpg' },
            { name: 'Inbox mail email e-mail', imgUrl: 'inbox.jpg' },
            { name: 'Translate translation google', imgUrl: 'translate.jpg' },
            { name: 'Robinhood stocks portfolio', imgUrl: 'robinhood.jpg' },
            { name: 'Duolingo language education', imgUrl: 'duolingo.jpg' },
            { name: 'Photos picture video', imgUrl: 'photos.jpg' },
            { name: 'Amazon shopping', imgUrl: 'amazon.jpg' },
            { name: 'Gmail mail email e-mail', imgUrl: 'gmail.jpg' },
            { name: 'Instagram social media', imgUrl: 'instagram.jpg' },
            { name: 'Maps navigation', imgUrl: 'maps.jpg' },
            { name: 'Netflix video movie streaming', imgUrl: 'netflix.jpg' },
            { name: 'News', imgUrl: 'news.jpg' },
            { name: 'Spotify music streaming', imgUrl: 'spotify.jpg' },
            { name: 'Twitter social media', imgUrl: 'twitter.jpg' },
            { name: 'Vimeo video movie streaming', imgUrl: 'vimeo.jpg' },
            { name: 'Wikipedia education', imgUrl: 'wikipedia.jpg' },
            { name: 'Yahoo news stocks', imgUrl: 'yahoo.jpg' },
            { name: 'Accuweather', imgUrl: 'accuweather.jpg' },
            { name: 'amp', imgUrl: 'amp.jpg' },
            { name: 'bank of america', imgUrl: 'bank-of-america.jpg' },
            { name: 'bing search', imgUrl: 'bing.jpg' },
            { name: 'chase bank', imgUrl: 'chase.jpg' },
            { name: 'cnn news', imgUrl: 'cnn.jpg' },
            { name: 'craigslist shopping', imgUrl: 'craigslist.jpg' },
            { name: 'ebay shopping', imgUrl: 'ebay.jpg' },
            { name: 'espn sports news', imgUrl: 'espn.jpg' },
            { name: 'facebook messenger', imgUrl: 'facebook-messenger.jpg' },
            { name: 'fox news', imgUrl: 'fox-news.jpg' },
            { name: 'google search', imgUrl: 'google.jpg' },
            { name: 'hulu video movie streaming', imgUrl: 'hulu.jpg' },
            { name: 'imdb movies film', imgUrl: 'imdb.jpg' },
            { name: 'imgur images photos', imgUrl: 'imgur.jpg' },
            { name: 'indeed jobs careers', imgUrl: 'indeed.jpg' },
            { name: 'linkedin jobs careers social networking', imgUrl: 'linkedin.jpg' },
            { name: 'messages messaging texting', imgUrl: 'messages-2.jpg' },
            { name: 'messages messaging texting', imgUrl: 'messages.jpg' },
            { name: 'office microsoft', imgUrl: 'office.jpg' },
            { name: 'outlook live mail', imgUrl: 'outlook-live.jpg' },
            { name: 'paypal banking', imgUrl: 'paypal.jpg' },
            { name: 'phone call', imgUrl: 'phone-call.jpg' },
            { name: 'pinterest images photos', imgUrl: 'pinterest.jpg' },
            { name: 'skype calling', imgUrl: 'skype.jpg' },
            { name: 'tumblr social media', imgUrl: 'tumblr.jpg' },
            { name: 'walmart shopping', imgUrl: 'walmart.jpg' },
            { name: 'weather underground', imgUrl: 'weather-underground.jpg' },
            { name: 'wells fargo banking', imgUrl: 'wells-fargo.jpg' },
            { name: 'yelp reviews', imgUrl: 'yelp.jpg' },
            { name: 'zillow housing real estate', imgUrl: 'zillow.jpg' }

        ];
    var backgroundImage = '/images/bg.jpg';
    var editImage = '/images/edit.jpg';

    function readImage(url, callback) {
        function onError() { callback(''); }
        function onXhrGet(status, response) {
            function onReaderLoad(result) { callback(result); }
            if (status == 200) {
                readFile(response, onReaderLoad, onError);
            } else { onError(); }
        }
        getViaXhr(url, 'blob', onXhrGet);
    }

    // Recursive function to process an array of images. Objects in array
    // must contain an 'imgUrl' variable containing the name of the image
    function readImageArray(images, currentIndex, endCallback) {
        if (currentIndex === images.length) {
            endCallback();
        } else {
            let imgUrl = '/images/' + images[currentIndex].imgUrl;
            readImage(imgUrl, function (result) {
                if (result.length) {
                    images[currentIndex].imgUrl = result;
                    readImageArray(images, currentIndex + 1, endCallback);
                } else {
                    images.splice(currentIndex, 1);
                    readImageArray(images, currentIndex, endCallback);
                }
            });
        }
    }

    function getViaXhr(url, responseType, onLoad, onError) {
        var request = new XMLHttpRequest();
        request.responseType = responseType;
        request.open('GET', url, true);
        request.addEventListener("error", onError);
        request.addEventListener("load", function () { onLoad(request.status, request.response) });
        request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        request.send();
    }

    function readFile(file, onLoad, onError) {
        var reader = new FileReader();
        reader.addEventListener("error", onError);
        reader.addEventListener("load", function () { onLoad(reader.result) });
        reader.readAsDataURL(file);
    }

    function saveAllSettings() {
        chrome.storage.local.set({
            sites: sites, icons: icons, backgroundImage: backgroundImage,
            editImage: editImage, showBookmarkNames: 'hover',
            bookmarkPosition: 'middle', backgroundPosition: 'center'
        }, function () { });
    }

    function saveSetting(setting, callback) {
        chrome.storage.local.set(setting, callback);
    }

    // On fresh install, load default images and settings
    if (details.reason == 'install') {
        // Potentially convoluted series of asychronous calls to load data and save it in chrome storage
        readImageArray(sites, 0, function () { // Load sites
            readImageArray(icons, 0, function () { // Load icons
                readImage(backgroundImage, function (result) { // Load background image
                    backgroundImage = result;
                    readImage(editImage, function (result) { // Load edit image then save settings
                        editImage = result;
                        saveAllSettings();
                    });
                })
            })
        });
    } else if (details.reason === 'update') {
        readImageArray(icons, 0, function () {
            saveSetting({ 'icons': icons }, function () {
                chrome.runtime.openOptionsPage(function () {
                    alert('Elemental New Tab has been updated. Thank you for your continued support!');
                })
            });
        });
    }
});