"use strict";

import { loadImageFromUrl } from "./modules/utils.js";

chrome.runtime.onInstalled.addListener(async function (details) {

    const siteList =
        [
            { name: 'Facebook', url: 'https://www.facebook.com/', imgUrl: 'facebook.jpg', id: 0 },
            { name: 'YouTube', url: 'https://www.youtube.com/', imgUrl: 'youtube.jpg', id: 2 },
            { name: 'Instagram', url: 'https://instagram.com/', imgUrl: 'instagram.jpg', id: 3 },
            { name: 'Twitter', url: 'https://twitter.com/', imgUrl: 'twitter.jpg', id: 4 }
        ];
    const iconList =
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
    const backgroundImageUrl = formatUrl('bg.jpg');
    const editImageUrl = formatUrl('edit.jpg');

    if (details.reason === 'install') {
        let sites = await readImageArray(siteList);
        let icons = await readImageArray(iconList);
        let backgroundImage = await loadImageFromUrl(backgroundImageUrl);
        let editImage = await loadImageFromUrl(editImageUrl);

        saveAllSettings(sites, icons, backgroundImage, editImage);
    }
    else if (details.reason === 'update') {
        let icons = await readImageArray(iconList);

        saveSetting({ 'icons': icons }, function () {
            /* TODO Show some sort of message on chrome.runtime.lastError */
            chrome.runtime.openOptionsPage(function () {
                alert('Elemental New Tab has been updated. Thank you for your continued support!');
            })
        });
    }

    async function readImageArray(images) {
        let loadedImages = [];

        for (let img of images) {
            await loadImageFromUrl(formatUrl(img.imgUrl))
                .then(result => { loadedImages.push({ name: img.name, imgUrl: result }); })
                .catch(() => { });
        }

        return loadedImages;
    }

    function saveAllSettings(sites, icons, backgroundImage, editImage) {
        chrome.storage.local.set({
            sites,
            icons,
            backgroundImage,
            editImage,
            showBookmarkNames: 'hover',
            bookmarkPosition: 'middle',
            backgroundPosition: 'center'
        }, function () {/* TODO Show some sort of message on chrome.runtime.lastError */ });
    }

    function saveSetting(setting, callback) {
        chrome.storage.local.set(setting, callback);
    }

    function formatUrl(url) {
        return `../images/${url}`;
    }
});