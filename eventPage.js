var $SPOTIFY_CLIENT_ID = 'your own client id'
var $SPOTIFY_CLIENT_SECRET = 'your own client secret'
var $CHROME_TOKEN = 'your own chrome token'

chrome.runtime.onInstalled.addListener(function(){
  chrome.storage.local.set({status: 0}, function(innerObj){
    chrome.storage.local.get(['status'], function(storageObj){
      console.log('intial status is ', storageObj)
    })
  })
})
const redirectUri = 'https://' + $CHROME_TOKEN + '.chromiumapp.org/success'

function makeXhrPostRequest(code, grantType, refreshToken){
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://accounts.spotify.com/api/token', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
    xhr.onload = function(){
      if (xhr.status >= 200 && xhr.status < 300){
          return resolve(xhr.response);
      } else {
        reject(Error(JSON.stringify({
          status: xhr.status,
          statusTextInElse: xhr.statusText
        })
        ))
      }
    }
    xhr.onerror = function(){
      reject(Error({
        status: xhr.status,
        statusText: xhr.statusText
      }))
    }

     let requestBody = (refreshToken) ? 'grant_type=' + grantType 
     + '&refresh_token=' + refreshToken 
     + '&client_id=' + $SPOTIFY_CLIENT_ID
     + '&client_secret=' + $SPOTIFY_CLIENT_SECRET : 'grant_type=' + grantType 
     + '&code=' + code 
     + '&redirect_uri=' + redirectUri
     + '&client_id=' +  $SPOTIFY_CLIENT_ID 
     + '&client_secret=' + $SPOTIFY_CLIENT_SECRET
    xhr.send(requestBody)
  })
}

chrome.extension.onMessage.addListener(function(request, sender, sendResponse){
    console.log("the request: " + request);
  if (request.action === 'launchOauth'){
    chrome.identity.launchWebAuthFlow({
      url: 'https://accounts.spotify.com/authorize'
      + '?client_id=' + $SPOTIFY_CLIENT_ID
      + '&response_type=code' 
      + '&redirect_uri=https://' + $CHROME_TOKEN + '.chromiumapp.org/success'
      + '&scope=user-read-currently-playing'
      ,
      interactive: true
    },
    function(redirectUrl) {
      let code = redirectUrl.slice(redirectUrl.indexOf('=') + 1)

      makeXhrPostRequest(code, 'authorization_code')
        .then(data => {
          data = JSON.parse(data)
          access_token = data.access_token;
          chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab){
            if (
              changeInfo.status === 'complete' && tab.url.indexOf('spotify') > -1
            || changeInfo.status === 'complete' && tab.url.indexOf('spotify') > -1 && tab.url.indexOf('user') > -1 && tab.url.indexOf('playlists') === -1
          ) {
              chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
                  chrome.tabs.sendMessage(tabs[0].id, {token: data.access_token}, function(response) {
                    console.log('response is ', response)
                  });
              })
            }
            // return true;// tried this but didn't seem to help bug of error in eventPage.js the message not sending 
            //(eg: sometimes redirectUrl in line 61 is not defined)
          })
          return data
        })
        .catch(err => console.error(err))
    }) //launch web auth flow

  } //if statment
})// extension event listener

function getAccessToken(){
  return access_token;
}
