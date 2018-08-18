function scanSiteForFavIcon(url, callback){
  function getSiteHead(url) {
    function onLoad(status, response){
      // TODO: Twitter was returning null response. Changing response type from 
      // 'document' to 'text' worked but requires additional processing of response
      if(status == 200 && response){
        findIcons(response.head);
      } else{
        callback([],'Error retrieving data from remote site.');
      }
    }
    function onError(){
        callback([],'Error retrieving data from remote site.');
    }
    getViaXhr(url, 'document', onLoad, onError);
  }

  function findIcons(headData){
    var links = headData.getElementsByTagName('link');
    var isAbsoluteUrl = new RegExp('^(?:[a-z]+:)?//', 'i');
    var isImage = new RegExp(/\.(gif|jpe?g|tiff|png|ico)$/i);
    var returnedIcons = [];

    for(let i = 0; i < links.length; i++){
      let rel = links[i].rel;
      let href = links[i].href;
      if((rel.indexOf('icon') != -1 || href.indexOf('favicon') != -1) && isImage.test(href)){
        if(isAbsoluteUrl.test(href)){
          returnedIcons.push(href);
        } else{
          returnedIcons.push(url + href);
        }
      }
    }
    if (returnedIcons.length){
      getImageFromUrl(returnedIcons, 0);
    } else{
      callback(returnedIcons, 'No icons found');
    }
  }

  // Recursive function to asynchronously retrieve icon image data from remote site
  function getImageFromUrl (icons, index){
    // Base case: return the array with a success message
    if (index == icons.length){
      callback(icons, 'Done');
    } else{
      function onLoad(status, response){
        function onFileRead(result){
          icons[index] = result;
          getImageFromUrl(icons, index + 1);
        }
        if(status == 200){
          readFile(response, onFileRead, function(){ onError(icons, index) });
        } else{ onError(icons, index); }
      }
      function onError(icons, index){
        icons.splice(index, 1);
        getImageFromUrl(icons, index);
      }
      getViaXhr(icons[index], 'blob', onLoad, function(){ onError(icons, index); });
    }
  }

  if(url && url.length){
    getSiteHead(url);
  } else{
    callback([],'Url not specified');
  }
}