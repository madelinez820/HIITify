window.addEventListener ("load", myMain, false);
makeWorkoutDiv();
// var port = chrome.runtime.connect({name: "knockknock"});

var access_token = "";
var refresh_token = ""; //TODO save later


function myMain (evt) {
    var jsInitChecktimer = setInterval (add_Hiitify_Button, 111);
    var jsInitChecktimer1 = setInterval (add_Auth_Button, 111);

    //loading the hiitify button when things load
    function add_Hiitify_Button () {
        if ( document.getElementsByClassName('now-playing-bar__right').length > 0) {
            clearInterval (jsInitChecktimer);

            var hiitify_button = makeHittifyButton()
            document.getElementsByClassName('now-playing-bar__right')[0].appendChild (hiitify_button);
        }
	}

        //loading the auth button when things load
        function add_Auth_Button () {
          if ( document.getElementsByClassName('now-playing-bar__left').length > 0) {
              clearInterval (jsInitChecktimer1);
  
              var auth_button = makeAuthButton()
              document.getElementsByClassName('now-playing-bar__left')[0].appendChild (auth_button);
        }
    }
}

/**
 * Creates the Hiitify button
 */
function makeHittifyButton(){
    var b = document.createElement('button');
    b.innerHTML = 'HIITify!';
	// b.addEventListener("click", ToggleWorkoutStartForm);
	b.addEventListener("click", temp);
    return b;
}

function temp (){
	console.log("TEMP");
	getCurrentSong(access_token)
	.then(data => {console.log(data + "THIS IS DATA")});
	// chrome.runtime.sendMessage({action: "temp"}, (response) => {
	// 	console.log(response + "THIS IS RESPONSE"); //  this is undefined
	//   });
	// port.postMessage({joke: "Knock knock"});

}

/** Creates the authentication button */
function makeAuthButton(){
  var b = document.createElement("button");
  b.id =  "authBtn";
  b.innerHTML = 'Auth Button';
  b.addEventListener("click", handler);
  return b;
}

function handler(){
  chrome.extension.sendMessage({
    action: 'launchOauth'
  })
}

/**
 * Creates the chooseWorkoutDiv
 */
function makeWorkoutDiv(){
			//creating the div body
			var chooseWorkoutDiv = document.createElement("div");
			chooseWorkoutDiv.style.top = "50%";
			chooseWorkoutDiv.style.left = "50%"; 
			chooseWorkoutDiv.style.transform =  "translate(-50%,-50%)";
			chooseWorkoutDiv.style.textAlign ="center";
			chooseWorkoutDiv.className = "_3cf7cb92e8b34cd675db241406113852-scss";
			chooseWorkoutDiv.style.display="none"; 
			chooseWorkoutDiv.id = "chooseWorkoutDiv";

			// workout div's title
			var title = document.createElement('H2');
			title.innerHTML = "Choose Your Workout";
			chooseWorkoutDiv.appendChild(title)
			
			// 1. Work Interval Length
			var wi_length_label = document.createElement("label");
			wi_length_label.setAttribute("for","wi_length_input");
			wi_length_label.innerHTML = "Work Interval Length (sec): ";
			chooseWorkoutDiv.appendChild(wi_length_label);
			chooseWorkoutDiv.appendChild(document.createElement('br'));
			var wi_length_input = document.createElement("input");
			wi_length_input.className = "_2f8ed265fb69fb70c0c9afef329ae0b6-scss";
			wi_length_input.id="wi_length";
			wi_length_input.type = "number";
			wi_length_input.value="30";
			chooseWorkoutDiv.appendChild(wi_length_input);
			chooseWorkoutDiv.appendChild(document.createElement('br'));
			
			// 2. Work Interval BPM
			var wi_bpm_label = document.createElement("label");
			wi_bpm_label.setAttribute("for","wi_length_input");
			wi_bpm_label.innerHTML = "Work Interval BPM: ";
			chooseWorkoutDiv.appendChild(wi_bpm_label);
			chooseWorkoutDiv.appendChild(document.createElement('br'));
			var wi_bpm_input = document.createElement("input");
			wi_bpm_input.className = "_2f8ed265fb69fb70c0c9afef329ae0b6-scss";
			wi_bpm_input.id="wi_bpm";
			wi_bpm_input.type = "number";
			wi_bpm_input.value="160";
			chooseWorkoutDiv.appendChild(wi_bpm_input);
			chooseWorkoutDiv.appendChild(document.createElement('br'));
			
			// 3. Rest Interval Length
			var ri_length_label = document.createElement("label");
			ri_length_label.setAttribute("for","wi_length_input");
			ri_length_label.innerHTML = "Rest Interval Length (sec): ";
			chooseWorkoutDiv.appendChild(ri_length_label);
			chooseWorkoutDiv.appendChild(document.createElement('br'));
			var ri_length_input = document.createElement("input");
			ri_length_input.className = "_2f8ed265fb69fb70c0c9afef329ae0b6-scss";
			ri_length_input.id="ri_length";
			ri_length_input.type = "number";
			ri_length_input.value = "10";
			chooseWorkoutDiv.appendChild(ri_length_input);
			chooseWorkoutDiv.appendChild(document.createElement('br'));
			
			// 4. Rest Interval BPM
			var ri_bpm_label = document.createElement("label");
			ri_bpm_label.setAttribute("for","wi_length");
			ri_bpm_label.innerHTML = "Rest Interval BPM: ";
			chooseWorkoutDiv.appendChild(ri_bpm_label);
			chooseWorkoutDiv.appendChild(document.createElement('br'));
			var ri_bpm_input = document.createElement("input");
			ri_bpm_input.className = "_2f8ed265fb69fb70c0c9afef329ae0b6-scss";
			ri_bpm_input.id="ri_bpm";
			ri_bpm_input.type = "number";
			ri_bpm_input.value = "115";
			chooseWorkoutDiv.appendChild(ri_bpm_input);
			chooseWorkoutDiv.appendChild(document.createElement('br'));
			
			// 5. Total Workout Length
			var tw_length_label = document.createElement("label");
			tw_length_label.setAttribute("for","wi_length_input");
			tw_length_label.innerHTML = "Total Workout Length (min): ";
			chooseWorkoutDiv.appendChild(tw_length_label);
			chooseWorkoutDiv.appendChild(document.createElement('br'));
			var tw_length_input = document.createElement("input");
			tw_length_input.className = "_2f8ed265fb69fb70c0c9afef329ae0b6-scss";
			tw_length_input.id="tw_length";
			tw_length_input.type = "number";
			tw_length_input.value = "10";
			chooseWorkoutDiv.appendChild(tw_length_input);
			chooseWorkoutDiv.appendChild(document.createElement('br'));
			
			// 6. Workout Start Button and cancel button
			var start_button = document.createElement("input");
			start_button.type = "submit";
			start_button.value = "Start!";
			chooseWorkoutDiv.appendChild(start_button); 
			start_button.addEventListener("click", startWorkout);
			var cancel_button = document.createElement("input");
			cancel_button.type = "submit";
			cancel_button.value = "cancel";
			chooseWorkoutDiv.appendChild(cancel_button); 
			cancel_button.addEventListener("click", ToggleWorkoutStartForm);
		
			// making the div appear in front of the other page elements
			chooseWorkoutDiv.style.position="absolute";
			chooseWorkoutDiv.style.zIndex="100";
      document.body.appendChild(chooseWorkoutDiv);
      
      return chooseWorkoutDiv;
}

/**
 * Makes the chooseWorkoutDiv appear and disappear
 */
function ToggleWorkoutStartForm() {
    var x = document.getElementById("chooseWorkoutDiv");
    if (x.style.display === "none") {
      x.style.display = "block";
    } else {
      x.style.display = "none";
	}
}

/** Triggered when you click the Start! button on the chooseWorkoutDiv. 
 *  wi_length, wi_bpm, ri_length, ri_bpm, tw_length are values from the user inputted fields in chooseWorkoutDiv
 */
function startWorkout(){
  var wi_length = document.getElementById("wi_length").value;
  var wi_bpm = document.getElementById("wi_bpm").value;
  var ri_length = document.getElementById("ri_length").value;
  var ri_bpm = document.getElementById("ri_bpm").value;
  var tw_length = document.getElementById("tw_length").value;
  console.log(wi_length, wi_bpm, ri_length, ri_bpm, tw_length)
  ToggleWorkoutStartForm(); // makes the form disappear
}

function makeXHR(method, url, token) {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Authorization', 'Bearer ' + token)
    xhr.onload = function(){
      if (xhr.status >= 200 && xhr.status < 300){
        return resolve(xhr.response);
      } else {
        reject(
          Error(
            JSON.stringify(
              {
                status: xhr.status,
                statusTextInElse: xhr.statusText
              }
            )
          )
        )
      }
    }
    xhr.onerror = function(){
      reject(
        Error(
          JSON.stringify(
            {
              status: xhr.status,
              statusTextInElse: xhr.statusText
            }
          )
        )
      )
    }
    xhr.send()
  })
}

function getCurrentSong(token) {
	var test = makeXHR('GET', 'https://api.spotify.com/v1/me/player/currently-playing', token);
	console.log("rest of first api call " + test);
	return test;
}

function getCurrentSongBPM(token) {
	return getCurrentSong(token)
	.then(currentSongID => {
		console.log("FIRST MEOW");
		console.log(currentSongID.map(data => JSON.parse(data)));
		return makeXHR('GET', "	https://api.spotify.com/v1/audio-analysis/".concat(currentSongID), token)
	.then(currentSongInfo =>
		{
			let parsedSongInfo = currentSongInfo.map(songInfo => JSON.parse(songInfo));
			console.log("MEOOOOOOOOOW")
			console.log(parsedSongInfo);
			console.log("END OF MEOOOOOOOOOW")
		})
	})
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
	  if (access_token === "" || request.token != null){
		access_token = request.token;
	  }
	// if (request.action === 'temp'){
	// 	console.log('we got here')
	// 	getCurrentSongBPM(request.token)
	// 	sendResponse('WE GOT THE MESSAGE ');
	// 	return true;
	// }
	return true;

//   }
// );

// port.onMessage.addListener(function(msg) {
// 	if (msg.question == "Who's there?")
// 	  port.postMessage({answer: "Madame"});
// 	else if (msg.question == "Madame who?")
// 	  port.postMessage({answer: "Madame... Bovary"});
  });