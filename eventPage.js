var $SPOTIFY_CLIENT_ID = '7d47ddc489c441b3ace386f1542fac57'
var $SPOTIFY_CLIENT_SECRET = 'fffe965056d146f8900cdc4da7890df0'
var $CHROME_TOKEN = 'noecanhkicbhgccjpjfedhopkmhecmok'

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

          chrome.storage.sync.set({'accessToken': access_token}, function() {
            console.log('Access token saved');
          });
          return data
        })
        .catch(err => console.error(err))
    }) //launch web auth flow

  } //if statment
})// extension event listener

function getAccessToken(){
  return access_token;
}
