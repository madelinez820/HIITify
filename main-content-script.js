
/** ============================================================================================================*/
/*  Descriptions of variables stored in local / session storage (note that all variables must be STRINGS)
local storage:
- wiLength = how long (sec) each workout interval is (set from user input)
- wiBPM = how fast (BPM) the music is during each workout interval (set from user input)
- riLength = how long (sec) each rest interval is (set from user input)
- riBPM = how fast (BPM) the music is during each rest interval (set from user input)
- twLength = the total time (min) of the entire workout (set from user input)
- accessToken = the current token that can be used to query info from the Spotify API (set from Spotify OAuth)

session storage:
- currentWorkoutRemainingTime = how long (sec) the workout has to go
- isWorkoutOngoing = "true" if it's going and the counter is going down, "false" if it is paused / ended
- currentSongID = id of currently playing song, "" if there is no currently playing song (queried from Spotify API) 
- currentSongOriginalBPM BPM of currently playing song, "0" if there is no currently playing song (queried from Spotify API)
- currentIntervalType = "rest" / "work"
- currentIntervalRemainingTime = how long (sec) the interval has to go

/** ============================================================================================================*/


window.addEventListener ("load", loadButtons, false);
makeWorkoutDiv();
dragElement(document.getElementById("chooseWorkoutDiv"));
var workoutTimer;

/** ============================================================================================================*/
/*  BPM Calculation Code
/** ============================================================================================================*/

/**
 * Given a BPM, it calculates the percentage increase / decrease in speed (where 
 * original BPM = 100%) using the song's stored original BPM
 * @param bpm 
 */
function bpmToPercentageSpeed(bpm){
	return 100 * bpm / sessionStorage.getItem("currentSongOriginalBPM");
}
/**
 * changes the currently playing song to the specified BPM
 * @param speedPercentage: 100 for normal speed, < 100 for slower, >100 for faster 
 */
function changeCurrentSongToSpeed(speedPercentage){ 
	var speed_button = document.getElementById("speed-extension-input");
	speed_button.value = speedPercentage.toString();
	var setSpeedEvent = new Event ('changeSpeed');
	speed_button.dispatchEvent(setSpeedEvent);
}

/** ============================================================================================================*/
/*  Timer Code
/** ============================================================================================================*/

/**
 * Counts down the entire workout (assuming twLength is in minutes)
 * @param {*} duration  - seconds
 * some use cases / functionality we tested: 
 *  - wiLength / riLength are both 0, or 1 of them is 0
 *  - riLength / wiLength is < 3
 *  - pause / play when there is 1 second left in the interval
 *  - pause / play when there is 1 second left in the workout
 *  - wiLength / riLength are different #s
 */
function startTimer(duration, fromPause) {
	fromPause = fromPause || false;  
	var display_total_time = document.getElementById("total_time_remaining");
	var intervalTimeRemainingText = document.getElementById("interval_time_remaining");
	var intervalTypeText = document.getElementById("interval_type_label");
	var total_time = parseInt(localStorage.getItem("twLength") * 60); 
	
	var timer = duration, minutes, seconds;
	window.sessionStorage.setItem("currentWorkoutRemainingTime",duration);
	window.sessionStorage.setItem("isWorkoutOngoing", true); 
	if (!fromPause){
		update_clock(); // called once before so we don't initially pause a second
	}

	workoutTimer = setInterval(update_clock, 1000);

	function update_clock() {
		// changes the total time remaining display
        minutes = parseInt(timer / 60, 10)
		seconds = parseInt(timer % 60, 10);
        minutes = minutes < 10 ? "0" + minutes : minutes;
		seconds = seconds < 10 ? "0" + seconds : seconds;
		if (timer > total_time) {// total time remaining display shouldn't count down in the 3 second rest added to the beginning of the workout
			display_total_time.textContent = minutes + ":00";
		} else{
			display_total_time.textContent = minutes + ":" + seconds;
		}

		//edge case where both workout and rest interval length are 0 (the user really shouldn't input this in lol)
		if ((localStorage.getItem("wiLength") == "0") && (localStorage.getItem("riLength") == "0")){	
			timer = timer - 1;
			return;
		}

		// changes the interval time remaining display
		var currentIntervalRemainingTime =  sessionStorage.getItem("currentIntervalRemainingTime");
		intervalTimeRemainingText.innerHTML = currentIntervalRemainingTime;
		intervalTypeText.innerHTML = sessionStorage.getItem("currentIntervalType");

		//add audio and visual cues to signal last 3 seconds / start of an interval
		if (parseInt(currentIntervalRemainingTime, 10) <= 3){
			console.log("RED");
			intervalTimeRemainingText.style.color = "#fff";
		}
		if ((currentIntervalRemainingTime == localStorage.getItem("wiLength") && sessionStorage.getItem("currentIntervalType") == "work") || 
			(currentIntervalRemainingTime == localStorage.getItem("riLength") && sessionStorage.getItem("currentIntervalType") == "rest") ){
			console.log("GREEN");
			intervalTimeRemainingText.style.color = "#fff";
		}

		//updating countdowns 
		sessionStorage.setItem("currentWorkoutRemainingTime",timer);
		var previousIntervalTimeLeft = parseInt(sessionStorage.getItem("currentIntervalRemainingTime"), 10);
		var updatedIntervalTimeLeft = previousIntervalTimeLeft - 1;
		sessionStorage.setItem("currentIntervalRemainingTime", updatedIntervalTimeLeft);

		//edge case where either workout or rest interval is 0 seconds
		if ((localStorage.getItem("wiLength") == "0") || (localStorage.getItem("riLength") == "0")){	
			if (updatedIntervalTimeLeft == 0){
				if (localStorage.getItem("wiLength") == "0"){
					sessionStorage.setItem("currentIntervalRemainingTime", localStorage.getItem("riLength")); 
				} else{
					sessionStorage.setItem("currentIntervalRemainingTime", localStorage.getItem("wiLength")); 
					sessionStorage.setItem("currentIntervalType", "work")
				}
			}
		}
		else{
			// changing interval if necessary
			if (sessionStorage.getItem("currentIntervalRemainingTime") == "0"){	
				if (sessionStorage.getItem("currentIntervalType") === "rest") { 
					sessionStorage.setItem("currentIntervalRemainingTime", localStorage.getItem("wiLength")); 
					sessionStorage.setItem("currentIntervalType", "work")
				} else{ 
					sessionStorage.setItem("currentIntervalRemainingTime", localStorage.getItem("riLength")); 
					sessionStorage.setItem("currentIntervalType", "rest")
				}
			}
		}
		if (--timer < 0) { // when time runs out, stop workout
			//TODO maybe trigger the beep manually here, congrats yadda yadda
			console.log("GREEN");
			cleanUpWorkoutVariables();
			ToggleStartStopWorkout();
        }
    }
}
/** ============================================================================================================*/
/*  Button Click Code
/** ============================================================================================================*/

/** Triggered when you click the Start! button on the chooseWorkoutDiv. 
 *  wi_length, wi_bpm, ri_length, ri_bpm, tw_length are values from the user inputted fields in chooseWorkoutDiv
 */
function startWorkout(){
	//TODO all input fields should accept only positive  / 0 ints only (eg: 01 messes things up)?
	console.log("Starting Workout");

	var wi_length = document.getElementById("wi_length").value;
	var wi_bpm = document.getElementById("wi_bpm").value;
	var ri_length = document.getElementById("ri_length").value;
	var ri_bpm = document.getElementById("ri_bpm").value;
	var tw_length = document.getElementById("tw_length").value;
	console.log(wi_length, wi_bpm, ri_length, ri_bpm, tw_length)
	localStorage.setItem("wiLength", wi_length);
	localStorage.setItem("wiBPM", wi_bpm);
	localStorage.setItem("riLength", ri_length);
	localStorage.setItem("riBPM", ri_bpm);
	localStorage.setItem("twLength", tw_length);
	//TODO fix bug: 01, decimals etc. makes things go wrong

	//TODO fix bug:
	//there's a race condition here - by the time getSongBPM() updates "currentSongOriginalBPM" in sessionStorage
	//with the current song's BPM, sessionStorage.getItem("currentSongOriginalBPM") already is called
	//with the previous song's BPM, setting the playback speed to the previous song's desired one
	//instead of the current one's desired one
	
	getSongBPM();
	ToggleStartStopWorkout();

	// simulate a rest interval of 3 seconds so the user doesn't start the workout interval immediately
	sessionStorage.setItem("currentIntervalType", "rest");
	sessionStorage.setItem("currentIntervalRemainingTime", 3);
	
	var interval_length_with_three = tw_length * 60 + 3;

	startTimer(interval_length_with_three); //TODO add first 3 seconds

	if (sessionStorage.getItem("currentSongOriginalBPM") != null && sessionStorage.getItem("currentSongOriginalBPM") != "0" && sessionStorage.getItem("currentSongOriginalBPM") != undefined ){
		//in case there is no current song playing or something goes wrong and currentSongOriginalBPM is never set, now speed stays at 100 instead of going to 0.
		changeCurrentSongToSpeed(bpmToPercentageSpeed(wi_bpm)); 
	}

  }

/**
 * resets the current song's speed to its original speed using the API
 */
function  resetSpeed(){
	changeCurrentSongToSpeed(100);
	console.log('resetSpeed');
}

/**
 * pauses and continues the HIIT countdown (doesn't affect the song play)
 */
function  playPause(){
	var p = document.getElementById("play_pause_button");
	if (window.sessionStorage.getItem("isWorkoutOngoing")=== "true"){ // workout / timer currently going
		p.innerHTML = "Play";
		window.sessionStorage.setItem("isWorkoutOngoing", false);
		clearInterval(workoutTimer);

	} else{ //workout / timer currently paused
		window.sessionStorage.setItem("isWorkoutOngoing", true);
		p.innerHTML = "Pause";
		startTimer(parseInt(window.sessionStorage.getItem("currentWorkoutRemainingTime")-1), true);

	}

}

/**
 * Ends the HIIT workout
 */
function endWorkout(){
	ToggleStartStopWorkout();
	cleanUpWorkoutVariables();
}

/**
 * This should be called whenever you want all variables related to workout state to be restored to default
 * eg: at the end of a workout, perhaps when the page is refreshed to ensure the song is at normal 100 speed
 */
function cleanUpWorkoutVariables(){
	changeCurrentSongToSpeed(100);
	clearInterval(workoutTimer);
	sessionStorage.removeItem("currentIntervalType");
	sessionStorage.removeItem("currentIntervalRemainingTime");
	sessionStorage.removeItem("currentWorkoutRemainingTime");
	sessionStorage.removeItem("isWorkoutOngoing");
}

/** ============================================================================================================*/
/*  UI elements appearing and disappearing
/** ============================================================================================================*/

/**
 * Makes the chooseWorkoutDiv appear and disappear
 */
function ToggleWorkoutDiv() {
    var x = document.getElementById("chooseWorkoutDiv");
    if (x.style.display === "none") {
      x.style.display = "block";
    } else {
      x.style.display = "none";
	}
}
/**
 * Toggles between the settings elements and the workout elements
 * settings elements = input fields for work interval length (sec), rest interval BPM, etc.
 * workout elements = play/pause button, timer countdown etc.
 */
function ToggleStartStopWorkout() {
	var settingsElements = ["workout_title", "wi_length_label", "wi_length", "wi_bpm_label", "wi_bpm", 
		"ri_length_label", "ri_length", "ri_bpm_label", "ri_bpm", "tw_length_label", "tw_length", "start_button","cancel_button",
		 "br1", "br2", "br3", "br4", "br5", "br6", "br7", "br8", "br9", "br10"];
	var workoutElements = ["hiitify_title","total_time_remaining","interval_time_remaining","interval_type_label",
	"reset_speed_button","play_pause_button","end_workout_button", "speed-extension-input"];
	for (i = 0; i < settingsElements.length; i++){
		var x = document.getElementById(settingsElements[i]);
		if (x.style.display === "none"){
			if (x.nodeName == "BUTTON"){ // default styling for buttons isn't block apparently
				x.style.display = "";
			}
			else if (x.nodeName != "BR"){ // super jank but apparently <br>s shouldn't be displayed again after they are shown once or else they create extra unwanted space
				x.style.display = "block";
			}

		  } else {
			x.style.display = "none";
		}
	}
	for (i = 0; i < workoutElements.length; i++){
		var x = document.getElementById(workoutElements[i]);
		if (x.style.display === "none") {
			x.style.display = "block";
		  } else {
			x.style.display = "none";
		}
	}
}
/** ============================================================================================================*/
/*  UI element code
/** ============================================================================================================*/
function loadButtons (evt) {
    var jsInitChecktimer = setInterval (add_Hiitify_Button, 111);
	var jsInitChecktimer1 = setInterval (add_Auth_Button, 111);
	// var jsInitChecktimer2 = setInterval (reset_Speed, 111);

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
		
	// // TODO this doesn't work (I think it's calling speed-extension-input and trying to use speed-extension-input's changeSpeed event before it is attached to speed-extension-input :()
	// // it's supposed to set the speed back to normal as soon as the page is refreshed / loaded 
	// function reset_Speed () {
	// 	if ( document.getElementById('speed-extension-input') != null) {
	// 		clearInterval (jsInitChecktimer2);
	// 		changeCurrentSongToSpeed(100);			
	// 	}
    // }
}

/**
 * Creates the Hiitify button
 */
function makeHittifyButton(){
    var b = document.createElement('button');
    b.innerHTML = 'HIITify!';
	b.addEventListener("click", ToggleWorkoutDiv);
    return b;
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
			//making the div appear in front of the other page elements
			chooseWorkoutDiv.style.position="absolute";
			chooseWorkoutDiv.style.zIndex="100";

			// A0. workout div's title
			var title = document.createElement('H2');
			title.innerHTML = "Choose Your Workout";
			title.id="workout_title";
			chooseWorkoutDiv.appendChild(title)
			
			// A1. Work Interval Length
			var wi_length_label = document.createElement("label");
			wi_length_label.setAttribute("for","wi_length_input");
			wi_length_label.innerHTML = "Work Interval Length (sec): ";
			wi_length_label.id = "wi_length_label";
			chooseWorkoutDiv.appendChild(wi_length_label);
			var br1 = document.createElement('br');
			br1.id ="br1";
			chooseWorkoutDiv.appendChild(br1);
			var wi_length_input = document.createElement("input");
			wi_length_input.className = "_2f8ed265fb69fb70c0c9afef329ae0b6-scss";
			wi_length_input.id="wi_length";
			wi_length_input.type = "number";
			wi_length_input.value= (localStorage.getItem("wiLength") == undefined) ? "30" : localStorage.getItem("wiLength");
			chooseWorkoutDiv.appendChild(wi_length_input);
			var br2 = document.createElement('br');
			br2.id ="br2";
			chooseWorkoutDiv.appendChild(br2);
			
			// A2. Work Interval BPM
			var wi_bpm_label = document.createElement("label");
			wi_bpm_label.setAttribute("for","wi_length_input");
			wi_bpm_label.innerHTML = "Work Interval BPM: ";
			wi_bpm_label.id = "wi_bpm_label";
			chooseWorkoutDiv.appendChild(wi_bpm_label);
			var br3 = document.createElement('br');
			br3.id ="br3";
			chooseWorkoutDiv.appendChild(br3);
			var wi_bpm_input = document.createElement("input");
			wi_bpm_input.className = "_2f8ed265fb69fb70c0c9afef329ae0b6-scss";
			wi_bpm_input.id="wi_bpm";
			wi_bpm_input.type = "number";
			wi_bpm_input.value= (localStorage.getItem("wiBPM") == undefined) ? "160" : localStorage.getItem("wiBPM");
			chooseWorkoutDiv.appendChild(wi_bpm_input);
			var br4 = document.createElement('br');
			br4.id ="br4";
			chooseWorkoutDiv.appendChild(br4);
			
			// A3. Rest Interval Length
			var ri_length_label = document.createElement("label");
			ri_length_label.setAttribute("for","wi_length_input");
			ri_length_label.innerHTML = "Rest Interval Length (sec): ";
			ri_length_label.id = "ri_length_label";
			chooseWorkoutDiv.appendChild(ri_length_label);
			var br5 = document.createElement('br');
			br5.id ="br5";
			chooseWorkoutDiv.appendChild(br5);
			var ri_length_input = document.createElement("input");
			ri_length_input.className = "_2f8ed265fb69fb70c0c9afef329ae0b6-scss";
			ri_length_input.id="ri_length";
			ri_length_input.type = "number";
			ri_length_input.value= (localStorage.getItem("riLength") == undefined) ? "10" : localStorage.getItem("riLength");
			chooseWorkoutDiv.appendChild(ri_length_input);
			var br6 = document.createElement('br');
			br6.id ="br6";
			chooseWorkoutDiv.appendChild(br6);
			
			// A4. Rest Interval BPM
			var ri_bpm_label = document.createElement("label");
			ri_bpm_label.setAttribute("for","wi_length");
			ri_bpm_label.innerHTML = "Rest Interval BPM: ";
			ri_bpm_label.id = "ri_bpm_label";
			chooseWorkoutDiv.appendChild(ri_bpm_label);
			var br7 = document.createElement('br');
			br7.id ="br7";
			chooseWorkoutDiv.appendChild(br7);
			var ri_bpm_input = document.createElement("input");
			ri_bpm_input.className = "_2f8ed265fb69fb70c0c9afef329ae0b6-scss";
			ri_bpm_input.id="ri_bpm";
			ri_bpm_input.type = "number";
			ri_bpm_input.value = "115";
			ri_bpm_input.value= (localStorage.getItem("riBPM") == undefined) ? "100" : localStorage.getItem("riBPM");
			chooseWorkoutDiv.appendChild(ri_bpm_input);
			var br8 = document.createElement('br');
			br8.id ="br8";
			chooseWorkoutDiv.appendChild(br8);
			
			// A5. Total Workout Length
			var tw_length_label = document.createElement("label");
			tw_length_label.setAttribute("for","wi_length_input");
			tw_length_label.innerHTML = "Total Workout Length (min): ";
			tw_length_label.id = "tw_length_label";
			chooseWorkoutDiv.appendChild(tw_length_label);
			var br9 = document.createElement('br');
			br9.id ="br9";
			chooseWorkoutDiv.appendChild(br9);
			var tw_length_input = document.createElement("input");
			tw_length_input.className = "_2f8ed265fb69fb70c0c9afef329ae0b6-scss";
			tw_length_input.id="tw_length";
			tw_length_input.type = "number";
			tw_length_input.value= (localStorage.getItem("twLength") == undefined) ? "10" : localStorage.getItem("twLength");
			chooseWorkoutDiv.appendChild(tw_length_input);
			var br10 = document.createElement('br');
			br10.id ="br10";
			chooseWorkoutDiv.appendChild(br10);
			
			// A6. Workout Start Button and cancel button
			var start_button = document.createElement("button");
			start_button.innerHTML = "Start!";
			start_button.id = "start_button";
			chooseWorkoutDiv.appendChild(start_button); 
			start_button.addEventListener("click", startWorkout);
			var cancel_button = document.createElement("button");
			cancel_button.innerHTML = "cancel";
			cancel_button.id = "cancel_button";
			chooseWorkoutDiv.appendChild(cancel_button); 
			cancel_button.addEventListener("click", ToggleWorkoutDiv);

			// B0. workout div's title
			var hiitify_title = document.createElement('H2');
			hiitify_title.innerHTML = "HIITify";
			hiitify_title.id="hiitify_title";
			hiitify_title.style.display = "none";
			chooseWorkoutDiv.appendChild(hiitify_title)

			//B1. total time remaining - could be a countdown or maybe a bar with % done?
			var total_time_remaining = document.createElement('p');
			total_time_remaining.id = "total_time_remaining";
			total_time_remaining.style.display = "none";
			chooseWorkoutDiv.appendChild(total_time_remaining);

			//B2. interval time remaining
			var interval_time_remaining = document.createElement('H1');
			interval_time_remaining.id = "interval_time_remaining";
			interval_time_remaining.style.display = "none"
			chooseWorkoutDiv.appendChild(interval_time_remaining);

			//B3. interval type
			var interval_type_label = document.createElement('H2');
			interval_type_label.id = "interval_type_label";
			interval_type_label.style.display = "none";
			chooseWorkoutDiv.appendChild(interval_type_label);
			
			//B4. reset speed button
			var reset_speed_button = document.createElement('button');
			reset_speed_button.innerHTML = 'Reset Speed';
			reset_speed_button.id = 'reset_speed_button';
			reset_speed_button.addEventListener("click", resetSpeed);
			reset_speed_button.style.display = "none";
			chooseWorkoutDiv.appendChild(reset_speed_button);

			//B5. play pause button
			var play_pause_button = document.createElement('button');
			play_pause_button.innerHTML = 'Pause'; //TODO try to instead get it to look like spotify play pause
			play_pause_button.id = 'play_pause_button';
			play_pause_button.addEventListener("click", playPause);
			play_pause_button.style.display = "none";
			chooseWorkoutDiv.appendChild(play_pause_button);

			//B6. stop button
			var end_workout_button = document.createElement('button');
			end_workout_button.innerHTML = 'End Workout';
			end_workout_button.id = 'end_workout_button';
			end_workout_button.addEventListener("click", endWorkout);
			end_workout_button.style.display = "none";
			chooseWorkoutDiv.appendChild(end_workout_button);


      document.body.appendChild(chooseWorkoutDiv);
      
      return chooseWorkoutDiv;
}
/** ============================================================================================================*/
/*  Spotify API Call Code
/** ============================================================================================================*/
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

/**
 * Returns the BPM of the currently playing song from the Spotify API
 */
function getSongBPM (){
	getCurrentSong(localStorage.getItem("accessToken"))
	.then(id => {
		console.log("THIS IS SONG ID: " + id);
		if (id === ""){//if no song is playing
			return "";
		}
		return makeXHR('GET', "	https://api.spotify.com/v1/audio-analysis/" + id, localStorage.getItem("accessToken"))
	})
	.then(data => {
		if (data === ""){
			currentSongBPM = 0;
			console.log("BPM is 0 (no song playing)");
			return;
		}
		let parsedData = JSON.parse(data)
		currentSongBPM = parsedData.track.tempo
		console.log("THIS IS THE BPM: " +  currentSongBPM);	
		sessionStorage.setItem("currentSongOriginalBPM", currentSongBPM);
	});
}

/**
 * Gets the currently playing song's ID. If there is no currently playing song, it returns an empty string ("").
 * @param token 
 */
function getCurrentSong(token) {
	return makeXHR('GET', 'https://api.spotify.com/v1/me/player/currently-playing', token)
	.then((data) => {
		if (data === ""){// no song curently playing
			return "";
		}
		let parsedData = JSON.parse(data)
		let songId = parsedData.item.id;
		sessionStorage.setItem("currentSongID", songId);
		return songId;
	  })
}

/** ============================================================================================================*/
/*  Saving Access Token Code
/** ============================================================================================================*/

//TODO https://developer.spotify.com/documentation/ios/guides/token-swap-and-refresh/ -> tokenRefreshURL - should we try to refresh the token
// automatically for the user? eg: we can save it here in localStorage like we did for the access_token (refresh is data.refresh_token when 
// we use chrome.storage.sync in eventPage.js) and then when we make a bad call due to an expired token, we can catch that call and 
// get a new token and redo the call?


/**
 * saves the access token so we can use it.
 */   
chrome.storage.onChanged.addListener(function(changes, area) {
    if (area == "sync" && "accessToken" in changes) {
        chrome.storage.sync.get(['accessToken'], function(items) {
			var token = items["accessToken"];
			if (localStorage.getItem("accessToken") != token && token != null && token != undefined){
				localStorage.setItem("accessToken", token);
			}
			return true;
		});
	}
});

/** ============================================================================================================*/
/*  Code to make (chooseWorkoutDiv) draggable
/** ============================================================================================================*/

/**
 * code to make the chooseWorkoutDiv draggable 
 * we didn't do something like $('#chooseWorkoutDiv').draggable({}); because 
 * it made the div jump at the beginning (because the position is set to be absolute)
 * */
function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
	// otherwise, move the DIV from anywhere inside the DIV:
	elmnt.onmousedown = dragMouseDown;
  }
  function dragMouseDown(e) {
	//NOTE: do this for other elements we add that you don't want draggable
	//no dragging in input fields or buttons (or else you can't type anything or release buttons without clicking it), 
	if ((e.target.tagName === "INPUT") || (e.target.tagName === "BUTTON")){ 
		return;
	}
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }
  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
/** ============================================================================================================*/