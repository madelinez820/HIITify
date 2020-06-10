
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
makeDraggable(document.getElementById("workoutDiv"));
var workoutTimer;
var playPauseMusicButton;
var themeGreen = "rgb(29, 185, 91)";
var themeRed = "#f94e4e"; 

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
 * Given a speed (100 is normal, <100 is slower, >100 is fast), it calculates the BPM using the song's stored original BPM
 * @param bpm 
 */
function percentageSpeedToBPM(speed){
	return speed * sessionStorage.getItem("currentSongOriginalBPM") / 100;
}

/**
 * changes the currently playing song to the specified BPM
 * @param speedPercentage: 100 for normal speed, < 100 for slower, >100 for faster 
 */
function changeCurrentSongToSpeed(speedPercentage){ 
	var speed_button = document.getElementById("speed-extension-input");
	speed_button.value = speedPercentage.toString();

	// TODO change if speedPercentage > 200 (the hardcoded upper limit on the slider), set the progress bar to have a max of speedPercentage and make that the current BPM
	if (speedPercentage > 200){
		speed_button.max = speedPercentage;
		speed_button.value = speedPercentage;
	}else{
		speed_button.max = "200";
	}
	//manually updates (changing speed-extension-input's value via js doesn't trigger its onput automatically)
	var setSpeedEvent = new Event ('changeSpeed'); 
	speed_button.dispatchEvent(setSpeedEvent);
	var setTextEvent =  new Event ('input'); //speed-extension-input's input event is set to updateTextCurrentSpeed
	speed_button.dispatchEvent(setTextEvent);
	
}

/** ============================================================================================================*/
/*  Timer Code
/** ============================================================================================================*/

/**
 * Counts down the entire workout (assuming twLength is in minutes)
 * @param {*} duration  - seconds
 * some use cases / functionality we tested (keeping in mind expected BPM / text colors / audio): 
 *  - wiLength / riLength are both 0, or 1 of them is 0
 *  - riLength / wiLength is < 3
 *  - pause / play when there is 1 second left in the interval
 *  - pause / play when there is 1 second left in the workout
 *  - wiLength / riLength are different #s
 *  - running through the entire workout and starting the workout again
 *  - stop in the middle and refresh page
 *  - song is not playing when you press start workout
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

		// changes the interval time remaining display and interval label text
		var currentIntervalRemainingTime =  sessionStorage.getItem("currentIntervalRemainingTime");
		intervalTimeRemainingText.innerHTML = currentIntervalRemainingTime;
		intervalTypeText.innerHTML = (sessionStorage.getItem("currentIntervalType") == "work" ) ? "WORKOUT!": "REST";

		//add audio and visual cues to signal last 3 seconds / start of an interval
		intervalTypeText.style.color = (sessionStorage.getItem("currentIntervalType") == "work" ) ? themeGreen : themeRed; //neon green if work interval, neon red if rest interval
		if (timer <= 3 && timer > 0){ //red on last 3 seconds of the workout
			display_total_time.style.color = themeRed;
			beep("last");
		}
		if ((currentIntervalRemainingTime == localStorage.getItem("wiLength") && sessionStorage.getItem("currentIntervalType") == "work") ||  // sets text green and beeps
			(currentIntervalRemainingTime == localStorage.getItem("riLength") && sessionStorage.getItem("currentIntervalType") == "rest") ){
			intervalTimeRemainingText.style.color = themeGreen; 
			beep("first");
			// changes BPM on interval change
			if (sessionStorage.getItem("currentIntervalType") == "work"){
				updateBPM(localStorage.getItem("wiBPM"));
			}
			else{
				updateBPM(localStorage.getItem("riBPM"));
			}
		}
		else if (parseInt(currentIntervalRemainingTime, 10) <= 3){ // sets text red and beeps
			intervalTimeRemainingText.style.color = themeRed; 
			beep("last");

		}
		else {
			intervalTimeRemainingText.style.color = "";
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
					sessionStorage.setItem("currentIntervalType", "work");
				} else{ 
					sessionStorage.setItem("currentIntervalRemainingTime", localStorage.getItem("riLength")); 
					sessionStorage.setItem("currentIntervalType", "rest");

				}
			}			
		}
		if (--timer < 0) { // when time runs out, stop workout
			//TODO maybe congrats yadda yadda
			beep("first");
			display_total_time.style.color = "";
			cleanUpWorkoutVariables();
			ToggleStartStopWorkout();
        }
    }
}

/**
 * Plays a beep to indicate either one of the last 3 seconds of an interval or the start of an interval
 */
function beep(i){
	if (beep_switch_input.checked == false){ // only beeps if beep toggle switch is on
		return;
	} 
	if (i == "last"){
		var snd = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");  
		snd.play();
	}
	else{
		var gosnd = new Audio("data:audio/wav;base64,UklGRrDAAABXQVZFZm10IBAAAAABAAIAgD4AAAD6AAAEABAAZGF0YYzAAAD//wAAAAAAAAAAAAAAAAEAAAABAAEAAQAAAP//AQABAAAAAAABAP//AQABAAAAAQD//wEAAAAAAP7/AAABAP//AgABAAEAAQAAAAIA/////wAAAQD//wAAAQABAAAAAAAAAP////////////8BAAAAAQAAAAIAAAAAAAAAAAABAP//AAAAAAAAAAD/////AgAAAAAAAQABAAAA/////wIA/v8BAAAAAQAAAP//AAAAAAEAAQAAAP//AQAAAP///v///wAA/v//////AQD//wAAAAABAP//AQD//wAA//8AAAEA//8AAP//AAAAAAAA/////wIA/////wEAAAD//wAAAAABAAAAAAAAAAAAAQAAAP//AAAAAAEA//8BAAEA//8BAAAAAgABAAEAAAABAAEAAAACAAAA//8AAAAAAAAAAAEAAAD//wEAAAAAAAAA//8BAAAAAAD//wEAAAD//wAA//8AAP////8AAAEAAAAAAP//AQAAAAEA//8AAAAAAQAAAAAAAQAAAAAA////////AAAAAP/////+//////8BAP////8BAP/////+/wAAAQAAAAEAAAD/////AgABAP//AQD//wAA//8AAP/////+/wEAAQD//wAA//8BAAEA//8AAAEA/v///wAAAgAAAAAAAAAAAAEAAQD/////AAAAAAAAAAAAAAEAAQAAAAAA//8AAAAA//8AAAAA//8AAAEA//8BAP//AAABAAIAAQABAAAA//8AAAEAAgAAAAAAAQD//wAAAAAAAAEAAAAAAAAAAQABAAEAAAABAP7/AQABAP//AAD/////AAAAAP/////+/wEAAAAAAP//AQABAP////8AAAAAAQABAAEAAAD/////AQD//wAA//8BAAEA//8CAAAAAQABAAIAAQD//wAAAQAAAAAA///+/wEAAAAAAAEA//8BAAAAAAAAAAEA//8BAAEAAQD//wAAAAAAAAAAAgD//wEAAAAAAP//AQAAAAAAAAD//wAA//8AAAAAAAD+/wAAAAD/////AAAAAP//AAABAP//AAD//wEAAAAAAAAAAgD/////AQD+////AQACAP//AAAAAP//AAAAAAAAAAAAAAEA//8AAAAAAQD//wAAAAD/////AQAAAAAAAAD//wAAAgD//wAA//////////8AAAAAAQAAAAAA//8AAP7//v////////////////8BAAAA//8BAAAA//8AAP//AQAAAAAA//8AAAEAAQABAAAAAQABAAAAAAAAAAEAAAAAAAAAAQAAAAAA/////wEA//8CAAAA//8AAAEAAAABAAAAAAABAAEAAQAAAAAAAAAAAAEAAAAAAAEAAAD/////AgD+/wEA//8AAP//////////AAAAAP//AAAAAP//AAAAAAAA//8BAAAA//8AAAAAAAAAAAAA//8AAAAAAAAAAAEA/////wAAAAAAAAEA////////AAAAAAIAAAACAP////8AAAAAAAD+/wAAAQAAAP////8AAAAAAAAAAAIAAAABAAAAAQABAAAA/////wIAAQD///////8BAAAAAAABAAAA///+//////8CAAAAAQAAAAAAAAAAAAAA//8BAAAAAAAAAAIAAQABAP//AQABAAEAAAAAAAAA//8BAAEAAAABAP//AQAAAAAAAQAAAAAAAAAAAP//AAAAAAAAAgD//wEA//8AAAAAAAABAAEAAAAAAP7///8BAP//AQD/////AAABAAIAAgAAAAAAAAD//wAAAAABAAAAAQD//wEAAQD//wAAAAAAAAEAAQAAAP//AAD//////v8AAP//AQABAAAA//8AAAAAAQABAAIAAAAAAP////8AAAAAAgABAP//AAAAAAAAAAACAP//AAAAAAIAAAD//wAAAAABAAAA//8AAAAAAAAAAP///////wAA/////wAA/////wIAAAABAAAAAAABAAAAAAABAAEAAAABAAEAAQD+/wAAAAD//wEA//8BAP//AQD//wAAAAAAAAAAAAAAAP////8BAAEA/////wAA//8AAAEAAAAAAAAAAAAAAP//AQAAAAEAAAD/////AQABAP//AQABAAEAAQABAAAA/////wEA//8AAP//AQACAP////8BAP//AQD//wAA//8BAP/////+/wAAAgACAAEAAQAAAAAAAAABAP//AQABAP//AAABAP////8AAP//AAD//wAAAQABAAAA////////AQD///////8BAAEAAAAAAAEAAAAAAAAAAAAAAAEAAAD//wAAAQD//wAA//8BAP7/AQD//wAA/////wAAAAD//wEAAAAAAAEAAAD//wEAAQAAAAAA//8BAAEAAAAAAP//AAAAAAAAAgABAAAA/v8AAAAAAAABAAAAAAABAAAAAAAAAAEAAAD//wAAAQAAAAAAAAD/////AQAAAAAAAAABAAAAAAABAP////8AAAEAAQAAAP7/AAD//wAAAAAAAAAAAAD//wEA//8AAAEAAQD//wAAAQAAAAAAAAAAAAAAAQABAAAAAQABAAAAAAABAP////8AAAEAAQAAAAEAAgD//wAAAAABAAEAAAAAAAEA/////wIAAQABAAAAAQD//wAAAQABAP///v8AAAIA//8CAAAAAAABAAAA//8AAAAA//8AAP///v8BAP//AAD//wAAAAABAAAAAAABAAEAAAD//wAAAQABAAAAAAD//wAA/////wIA//////7//v8BAAAAAAAAAAAAAAABAAAA/v//////AQAAAP7/AAABAP//AQD//wAAAQD/////AAABAAEAAQD//wAAAAAAAAEAAQD/////AAD//wIAAQABAAEAAAAAAAEAAAAAAAAAAQAAAAEAAQAAAAEA///+/wEAAQAAAAEAAAACAP////8AAAAA//8AAAAA//////7////8//3/DwAQABwBHAFPAE8A2fvc+/fv9u9m4mbihdeG11XTUtO20bbRwdbA1vHi7+Km7qfuqgOrA9oY2BjxKfIpyzHJMbY3tTcWNhY2+yr9KlQeVB4lBicGguyD7ALWBNaWypbK48DiwJfBlMFozGjMld+U34Pvg+9ECUMJjSGPIXI0cjRcPF486D/mPxE5Ezn/KAEpYRpiGjUBNgHM58znVNJU0gPIBMhUwFXA+ML7woPPhM9u3G7cVvRX9C4OLw6vJa8lIDIiMr49wT1aP1k/rjavNtAr0yvTFdQVO/w8/E7jTeMR1RDV0sXSxQPAAsCUxJTEF80WzaTgouBG+UX58xLyEpgimCIPNQ016z7pPpc+lz79M/0zCygLKAoRCxFM903399733n/RftHXw9jD+7/7v6DGoMZa0FnQGuUa5Tj+Of6lF6QXtSa3Js03yzesP60/Nz04Pfs1+TUGJAUkNww3DGTyZvIg4iHiLc4rzl7CXsKTwJLAIsUixdHTzdOr6azpMgMzAzUUMhSKKokq9DnyOfM/8z8sPi4+LzMwM9wf3x9QB08HBPYH9uDd3d1Iy0jLPcE+wWHBYcEtxy/H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//8AAAAA/v///wAA/v8AAAEAAQD//wEAAAABAP7/AAAAAAEAAQD//wAAAAABAP////8CAAEAAAD//wAAAAAAAP//AAAAAAAAAQD//wAAAAABAAAAAAABAP//AAAAAAEA//8BAAAA//8AAP//AAD//wEA//8AAP//AAAAAAEAAQAAAAEAAQABAP////8AAAEA////////AQABAAAA//8AAAEAAQD//wAAAQAAAAAAAAD//wEAAAABAP//AQAAAAEAAAD//wAAAAAAAAAA////////AQAAAAAA////////AQAAAAAAAAABAAEAAAAAAP////8AAAAA//8AAAEAAAAAAAAA//8BAP////8BAAEA//8AAP//AAABAAEA/v8AAAAAAAABAAEA/////wEAAQABAAAAAQD/////AQD//wAAAAAAAAEAAQABAAIAAAAAAAEAAQD//wEAAAAAAAEAAAAAAAEAAAD//wAAAQAAAP7/AAAAAP////8AAAAAAAABAAAA/v8BAP7///8BAAEA//8BAAEAAAD//wAA//8AAP////8CAP//AQAAAAAAAAD/////AAD//wAAAAACAAAAAAD+/////v8AAAIAAAACAAAA//8BAAAA/v////7/AAABAAAA//8CAAAAAQAAAAEA/v8AAP//AAD+/wAAAAAAAAEAAQAAAAEA/////wAA//8BAAEA//8AAAAAAAAAAP////8BAAAAAAABAAAAAAAAAP///////wEAAQD//wEAAgABAAAA//8AAAAA//8BAAAA//8AAAEAAQAAAAAAAQAAAAAAAQD///7/AAD///////8CAAIA//8AAAAAAAAAAAAAAAD//wEAAAD//wAAAQD//wEAAQD//wAAAAABAAIA//8BAAEAAAABAAAAAQABAAEA////////AAD//wAAAQAAAAEAAAD/////AAABAAAAAAABAP//AAACAAIA/////wEAAQD//wAAAQD//wAAAAABAAAAAQABAAEAAQABAAEA//8BAAIAAAD//wAA//8AAAEAAAD//wAAAAAAAAIAAAAAAAAA//8AAP////8AAP//AAABAP//AAD//wAA/////wAAAAAAAAIAAAD//wAAAAD//wAAAQABAAAAAAD//wEA//8BAAAAAgD//wEA//8BAAAAAAD//wAA///+////AAACAAAA/v8AAAAAAAAAAAEAAAAAAAIAAQAAAP//AAAAAAAA//8BAAAA////////AAD//wAA/////wEAAAAAAP//AAAAAAAA///+/wEA//8BAAAA/////wEAAQABAAEA/v8AAAEAAAAAAAAAAAD//wEAAAD+////AAAAAP//AQD///7/AAACAAEAAQABAAAAAAD+//7/AQAAAAIAAQABAAAAAQAAAAAAAAAAAAEAAAD//wEA///+/wAAAQAAAAIAAQABAP////8BAP//AQAAAP//AAD//wAA//8AAP//AAAAAAAAAQAAAAAA/v//////AQD+/wAAAAAAAAAAAQD/////AAD///7/AAABAAEAAAABAAAAAAABAP//AAABAAAAAAAAAAAAAAAAAAAAAQD//wEA//8AAAAA//8AAAAAAAD//wIA//8BAAEAAAABAAEAAAABAAAAAQABAAAAAAABAAAAAAABAAEAAAD//wAAAQAAAAAA/v8AAP////8BAP///v8CAP//AAABAAEA/////wIA//8AAAAA//8BAAAAAQAAAAAA//8AAAAA/v8BAAAAAAD/////AAAAAAEAAQABAAEA//8AAP//AAD/////AAD//wEAAQACAP//AAAAAAIAAQACAAAAAQAAAP//AQD//wAAAAD//wAAAgAAAAEA//8AAP7///8BAP7/AAAAAP//AQABAP//AAAAAAEA//8AAAEAAAAAAAEAAAAAAAIAAAABAP///v8AAAAAAQD//wAAAAD//wAA//8BAP7///8AAP7/AAAAAP//AAAAAAAA//8AAP////8AAP////8AAAAAAQABAAEAAQAAAP//////////AAABAP////8BAAAAAAABAAAA//8AAAEAAQABAAAAAAACAP///////wEA//8AAP//AAAAAP//AgAAAP////8AAP//AQAAAAAAAgAAAAEA//8AAAAAAAAAAP//AAACAAAAAAD//wAAAQAAAAAAAQABAP//AAD///7/AAAAAAAA/////wAA//8AAP//AAAAAP//AQAAAP//AQD+/wAAAAAAAAEAAAABAAAAAQABAAAAAAABAAEA/v8BAAAA//8BAP7///8AAAIAAAD+/wEAAAABAP//AQABAAAA///+//////8AAAEAAAD/////AAABAAEA//8AAAAAAAD//wEAAAAAAAEA//8BAAAAAAAAAAEAAAAAAP//AAABAP//AAAAAP//AQABAAAAAAAAAP////8AAAAA/v8BAAEA//8AAAEAAgAAAAAA//8AAAAAAAD//wEAAAD/////AAAAAAAAAgD//wAAAQD//wAA//8BAAAA/////wAAAQD//wAA//8BAAEAAAD/////AQD//wAAAAD//wAAAAABAAEAAAABAP//AQD//wAAAAD/////AgAAAAAAAQACAAEA////////AAAAAAAAAAABAAEAAAABAAEAAQAAAP////8AAP//AAABAAAAAQD//wAAAAAAAAAAAAABAAEA//8AAAIA//8BAAAAAAAAAAEAAQAAAAEA//8AAAEAAAABAP///v/+/////////wAAAQD//wEAAQABAAAA/v///wEAAQAAAAEAAAD//wAAAAD/////AAAAAAAA//8AAAEA//8AAAAA///+////AQABAP//AAD//wEA//8CAAEAAAAAAAEAAQAAAAAAAAD///7///8BAAAAAQACAAAAAAD//wAA//8BAAAAAQAAAP///////wAA//8AAAEA//8AAAEAAAAAAP/////+/wEAAAD//wAAAQAAAP//AAD//wEAAQACAAIAAAABAAAAAQABAAAAAQAAAAAAAAAAAAAAAAABAP///////wAAAAAAAP//AQAAAAAA//8AAP//AAAAAAEAAQAAAAAAAAABAAEAAAAAAAAAAQD//////////wAAAAD//wAAAQAAAP///v//////AQAAAAEAAAAAAAAAAQAAAAAAAAACAAEAAAABAAAA//8BAP////8AAAAAAQABAAAAAAD//wAA//8AAP//AQD+/wEA//8AAAEA/////wAAAQAAAAAA////////AAABAP//AAABAAAAAAABAAAA//8AAAAAAAD/////AAD+/wEA//8BAAAAAQAAAAAA//8BAP//AAABAP7/AAABAAAA//8BAP///////wAA/////wIAAAABAAEA/////wAAAAD//wAA/////wAA/////wAAAAAAAAAAAAAAAAAAAgAAAAAAAAD//wEAAAACAAAAAQAAAAEA//8BAAAA////////AAAAAAAAAQD//wAAAAAAAAAA//8BAAAAAQAAAAIAAAAAAAAAAAAAAP//AQD+/wAAAAAAAAAAAAD//wAAAQABAAAAAAD//wAAAQABAAAAAAD/////AQAAAAEAAQD/////AQAAAAAAAQAAAAAAAQD/////AgABAAEAAQAAAP7/AAABAAAAAQAAAAEAAQAAAAAAAAD//wEA/v8BAAAAAAAAAAEAAAAAAAEAAAAAAAAA//8AAAAAAAAAAP//AAD//wAA/////wEA//8AAAAAAAABAAAAAAAAAAEA/v8AAAEAAAABAAAA//8AAAEAAQD//wAAAAABAAAA/v8BAAAA///+/wAAAAAAAAAAAQABAAAAAAAAAP////8BAAEAAAABAAEA/v8AAAIA/v8AAAEA/////wAAAAD//wAA/////wAAAAD//wAAAAD+/wAA//8AAAIAAAD//wAAAAABAP//AQABAAAAAQD///////8AAP//AAD//wEA/////wAAAAAAAP////8AAAEA////////AQABAAEAAAABAAAA/////wEAAgD//wEAAAABAAAAAAAAAAAAAAACAAEAAQD//wAAAAABAAAAAAAAAAEAAAAAAAAAAAABAAAA/////wAAAAAAAAAAAQAAAAEAAQAAAAAAAAABAAEAAAABAP7/AQAAAAEAAAD/////AAAAAAEAAgAAAP//AQD///////8AAP//AQD+/wAAAQD+/wEAAAD//wAAAQABAP////8AAAAAAQAAAAAAAAD//wEAAQAAAAAAAQD///////8BAAAAAAAAAP//AQAAAAEA//8AAAAA//////////8BAAAAAAAAAP////8AAAAAAQAAAP//AAD+/wAA/v8AAAAAAAAAAAAA//8BAAEA/v8BAAAAAAAAAP////8AAAEAAAABAAEA//8AAP//AAABAAEAAAABAAEAAAACAAAAAAAAAAAA/////wAAAAD/////AQABAAAA//8BAAAAAQAAAAAAAAD//wAAAAACAP///////wAAAAABAAAAAAAAAP//AAAAAAEAAQAAAAEA//////////8AAAAAAQAAAAAAAAABAA==");
		gosnd.play();
	}
}
/** ============================================================================================================*/
/*  Button Click Code
/** ============================================================================================================*/

/** Triggered when you click the Start! button on the workoutDiv. 
 *  wi_length, wi_bpm, ri_length, ri_bpm, tw_length are values from the user inputted fields in workoutDiv
 */
function startWorkout(){
	var wi_length = parseInt(document.getElementById("wi_length").value, 10);
	var wi_bpm = parseInt(document.getElementById("wi_bpm").value, 10);
	var ri_length = parseInt(document.getElementById("ri_length").value, 10);
	var ri_bpm = parseInt(document.getElementById("ri_bpm").value, 10);
	var tw_length = parseInt(document.getElementById("tw_length").value, 10);
	localStorage.setItem("wiLength", wi_length);
	localStorage.setItem("wiBPM", wi_bpm);
	localStorage.setItem("riLength", ri_length);
	localStorage.setItem("riBPM", ri_bpm);
	localStorage.setItem("twLength", tw_length);

	ToggleStartStopWorkout();

	// simulate a rest interval of 3 seconds so the user doesn't start the workout interval immediately
	sessionStorage.setItem("currentIntervalType", "rest");
	sessionStorage.setItem("currentIntervalRemainingTime", 3);
	
	var interval_length_with_three = tw_length * 60 + 3;

	startTimer(interval_length_with_three); 

	getAndUpdateBPM(wi_bpm);
  }

/**
 * resets the current song's speed to its original speed using the API
 */
function resetSpeed(){
	changeCurrentSongToSpeed(100);
}

/**
 * sets the current song's speed to be what it should be given the inputted BPM for the current interval
 */
function hiitifySpeed(){
	if (sessionStorage.getItem("currentIntervalType") == "work"){
		updateBPM(localStorage.getItem("wiBPM"));
	} else{
		updateBPM(localStorage.getItem("riBPM"));
	}

}

function getAndUpdateBPM(new_bpm) {
	getSongBPM().then((sondBPM) => {
		updateBPM(new_bpm)
	})
}

function updateBPM(new_bpm) {
	if (sessionStorage.getItem("currentSongOriginalBPM") != null && sessionStorage.getItem("currentSongOriginalBPM") != "0" && sessionStorage.getItem("currentSongOriginalBPM") != undefined ){
		//in case there is no current song playing or something goes wrong and currentSongOriginalBPM is never set, now speed stays at 100 instead of going to 0.
		changeCurrentSongToSpeed(bpmToPercentageSpeed(new_bpm)); 
	};
	return;
}

/**
 * pauses and continues the HIIT countdown (doesn't affect the song play)
 */
function  playPause(){
	var pl = document.getElementById("play_img");
	var pa1 = document.getElementById("pause_img_1");
	var pa2 = document.getElementById("pause_img_2");
	if (window.sessionStorage.getItem("isWorkoutOngoing")=== "true"){ // workout / timer currently going
		//changes the icon on the playpause button
		pl.style.display="inline";
		pa1.style.display="none";
		pa2.style.display="none";

		//changes tooltip
		play_pause_button_span.innerHTML = "Start Timer";
		window.sessionStorage.setItem("isWorkoutOngoing", false);
		clearInterval(workoutTimer);

	} else{ //workout / timer currently paused
		window.sessionStorage.setItem("isWorkoutOngoing", true);
		pa1.style.display="inline";
		pa2.style.display="inline";
		pl.style.display="none";

		play_pause_button_span.innerHTML = "Pause Timer";
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
	resetSpeed();
	clearInterval(workoutTimer);
	sessionStorage.removeItem("currentIntervalType");
	sessionStorage.removeItem("currentIntervalRemainingTime");
	sessionStorage.removeItem("currentWorkoutRemainingTime");
	sessionStorage.removeItem("isWorkoutOngoing");
	document.getElementById("beep_switch_input").checked = true;
	var pl = document.getElementById("play_img");
	var pa1 = document.getElementById("pause_img_1");
	var pa2 = document.getElementById("pause_img_2");
	pa1.style.display="inline";
	pa2.style.display="inline";
	pl.style.display="none";
}

/** ============================================================================================================*/
/*  UI elements appearing and disappearing
/** ============================================================================================================*/

/**
 * Makes the workoutDiv appear and disappear
 */
function ToggleWorkoutDiv() {
    var x = document.getElementById("workoutDiv");
    if (x.style.display === "none") {
	  auth_handler()
	  x.style.display = "block";
    } else {
      x.style.display = "none";
	}
}

function auth_handler(){
	let promise = chrome.extension.sendMessage({
		action: 'launchOauth'
	});
	return promise;
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
	var workoutElements = ["hiitify_title","total_time_remaining","interval_time_remaining","interval_type_label","hiitify_speed_button",
	"reset_speed_button","play_pause_button","end_workout_button", "speed-extension-input", "speed_text_label", "play_pause_stop_wrapper"]; 

	for (i = 0; i < settingsElements.length; i++){
		var x = document.getElementById(settingsElements[i]);
		if (x.style.display === "none"){
			if (x.nodeName == "BUTTON"){ // default styling for buttons isn't block apparently
				x.style.display = "inline";
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
			if (x.nodeName == "BUTTON"){ // default styling for buttons isn't block apparently
				x.style.display = "inline";
			}else{
				x.style.display = "block";
			}
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
	var jsInitChecktimer2 = setInterval (add_Update_Speed_Text_Listener, 111);
	var jsInitChecktimer3 = setInterval(add_Song_Change_Listener);
	var jsInitChecktimer4 = setInterval(add_PlayPause_Music_Button_Listener);

    //loading the hiitify button when things load
    function add_Hiitify_Button () {
        if ( document.getElementsByClassName('now-playing-bar__right').length > 0) {
            clearInterval (jsInitChecktimer);
            var hiitify_button = makeHittifyButton()
            document.getElementsByClassName('now-playing-bar__right')[0].appendChild (hiitify_button);
        }
	}
		
	function add_Update_Speed_Text_Listener () {
		if ( document.getElementById('speed-extension-input') != null) {
			clearInterval (jsInitChecktimer2);
			var speed_extension_input = document.getElementById('speed-extension-input');
			speed_extension_input.oninput = updateTextCurrentSpeed;
			speed_extension_input.style.width = '100%';	 
		}
	}
	
	function add_Song_Change_Listener(){
		if (document.querySelectorAll('[data-testid="nowplaying-track-link"]').length > 0){
			clearInterval (jsInitChecktimer3);
			// changes BPM on song change - we are assuming that for each playlist, it doesn't have
			// 2 songs of the exact same title but differnet BPM (which seems like a reasonable assumption)
			var songTitleA = document.querySelectorAll('[data-testid="nowplaying-track-link"]')[0];
			var observer = new MutationObserver(function(mutations) {
				if (sessionStorage.getItem("currentIntervalType") != null){ // only should fire if a workout is in progress
					var newDesiredBPM = (sessionStorage.getItem("currentIntervalType") == "work") ? localStorage.getItem("wiBPM") : localStorage.getItem("riBPM");
					getAndUpdateBPM(newDesiredBPM);
				}
			});
			// configuration of the observer:
			var config = { attributes: true, childList: true, characterData: true };
			// pass in the target node, as well as the observer options
			observer.observe(songTitleA, config);
		}
	}

	function add_PlayPause_Music_Button_Listener(){
		// console.log((document.querySelectorAll("button[data-testid~= 'control-button-play']").length > 0))
		// console.log(document.querySelectorAll("button[data-testid~= 'control-button-pause']").length > 0);
		if ((document.querySelectorAll("button[data-testid~= 'control-button-play']").length > 0) || (document.querySelectorAll("button[data-testid~= 'control-button-pause']").length > 0)){ // music play/pause button exists
			clearInterval (jsInitChecktimer4);
			playPauseMusicButton = (document.querySelectorAll("button[data-testid~= 'control-button-play']").length > 0) ? document.querySelectorAll("button[data-testid~= 'control-button-play']")[0] : document.querySelectorAll("button[data-testid~= 'control-button-pause']")[0];

			var playPauseMusicObserver = new MutationObserver(function(mutations) {
				if (playPauseMusicButton.title == "Pause") { // went from pause to play
					if (sessionStorage.getItem("currentIntervalType") != null) {
						var newDesiredBPM = (sessionStorage.getItem("currentIntervalType") == "work") ? localStorage.getItem("wiBPM") : localStorage.getItem("riBPM");
						getAndUpdateBPM(newDesiredBPM);
						console.log("play pause music button clicked");
					}
				}

			});
			// configuration of the observer:
			var config = { attributes: true, childList: true, characterData: true,  attributeFilter: ['title']};
			// pass in the target node, as well as the observer options
			playPauseMusicObserver.observe(playPauseMusicButton, config);
		}
	}
}

/**
 * Creates the Hiitify button
 */
function makeHittifyButton(){
    var b = document.createElement('button');
	b.innerHTML = 'HIITify!';
	b.className = "auth-button spacing-horizontal";
	b.addEventListener("click", ToggleWorkoutDiv);
    return b;
}

/**
 * Only positive whole numbers can be entered into the input text boxes
 * @param event 
 */
function OnlyNums (event){
	return(event.charCode == 8 || event.charCode == 0 || event.charCode == 13) ? null : event.charCode >= 48 && event.charCode <= 57;
}

/**
 * Updates the speed percentage text and the BPM text to match the current speed when the speed is changed
 * @param event 
 */
function updateTextCurrentSpeed(event) {
	var x = document.getElementById("speed-extension-input");
	var s= document.getElementById("speed_text_label");
	if (sessionStorage.getItem("currentSongOriginalBPM") != null){ // if token was expired or no song is playing, there is no way to calculate BPM so we leave it out
		s.innerHTML = parseInt(percentageSpeedToBPM(x.value)) + " BPM | " + parseInt(x.value) / 100 + "x speed";
	} else{
		s.innerHTML =  parseInt(x.value) / 100 + "x speed";
	}
}
  
/**
 * Creates the workoutDiv
 */
function makeWorkoutDiv(){
	//creating the div body
	var workoutDiv = document.createElement("div");
	workoutDiv.style.top = "50%";
	workoutDiv.style.left = "50%"; 
	workoutDiv.style.transform =  "translate(-50%,-50%)";
	workoutDiv.style.textAlign ="center";
	workoutDiv.className = "_3cf7cb92e8b34cd675db241406113852-scss";
	workoutDiv.style.display="none"; 
	workoutDiv.id = "workoutDiv";
	//making the div appear in front of the other page elements
	workoutDiv.style.position="absolute";
	workoutDiv.style.zIndex=100;

	// A0. workout div's title
	var title = document.createElement('H2');
	title.innerHTML = "Choose Your Workout";
	title.className = "_2e77de28f0b30f1b6e8d479009f45e0e-scss hiitify_title";
	title.id="workout_title";
	workoutDiv.appendChild(title)
	
	//wrapper div for input fields for wi_length, ri_length, etc.
	var input_wrapper = document.createElement("div");
	input_wrapper.className = "wrapper-div-spacing";
	// A1. Work Interval Length
	var wi_length_label = document.createElement("label");
	wi_length_label.setAttribute("for","wi_length_input");
	wi_length_label.innerHTML = "Work Interval Length (sec): ";
	wi_length_label.id = "wi_length_label";
	input_wrapper.appendChild(wi_length_label);
	var br1 = document.createElement('br');
	br1.id ="br1";
	input_wrapper.appendChild(br1);
	var wi_length_input = document.createElement("input");
	wi_length_input.className = "_2f8ed265fb69fb70c0c9afef329ae0b6-scss";
	wi_length_input.id="wi_length";
	wi_length_input.onkeypress = OnlyNums;
	wi_length_input.value= (localStorage.getItem("wiLength") == undefined) ? "30" : localStorage.getItem("wiLength");
	input_wrapper.appendChild(wi_length_input);
	var br2 = document.createElement('br');
	br2.id ="br2";
	input_wrapper.appendChild(br2);
	
	// A2. Work Interval BPM
	var wi_bpm_label = document.createElement("label");
	wi_bpm_label.setAttribute("for","wi_length_input");
	wi_bpm_label.innerHTML = "Work Interval BPM: ";
	wi_bpm_label.id = "wi_bpm_label";
	input_wrapper.appendChild(wi_bpm_label);
	var br3 = document.createElement('br');
	br3.id ="br3";
	input_wrapper.appendChild(br3);
	var wi_bpm_input = document.createElement("input");
	wi_bpm_input.className = "_2f8ed265fb69fb70c0c9afef329ae0b6-scss";
	wi_bpm_input.id="wi_bpm";
	wi_bpm_input.onkeypress = OnlyNums;
	wi_bpm_input.value= (localStorage.getItem("wiBPM") == undefined) ? "160" : localStorage.getItem("wiBPM");
	input_wrapper.appendChild(wi_bpm_input);
	var br4 = document.createElement('br');
	br4.id ="br4";
	input_wrapper.appendChild(br4);
	
	// A3. Rest Interval Length
	var ri_length_label = document.createElement("label");
	ri_length_label.setAttribute("for","wi_length_input");
	ri_length_label.innerHTML = "Rest Interval Length (sec): ";
	ri_length_label.id = "ri_length_label";
	input_wrapper.appendChild(ri_length_label);
	var br5 = document.createElement('br');
	br5.id ="br5";
	input_wrapper.appendChild(br5);
	var ri_length_input = document.createElement("input");
	ri_length_input.className = "_2f8ed265fb69fb70c0c9afef329ae0b6-scss";
	ri_length_input.id="ri_length";
	ri_length_input.onkeypress = OnlyNums;
	ri_length_input.value= (localStorage.getItem("riLength") == undefined) ? "10" : localStorage.getItem("riLength");
	input_wrapper.appendChild(ri_length_input);
	var br6 = document.createElement('br');
	br6.id ="br6";
	input_wrapper.appendChild(br6);
	
	// A4. Rest Interval BPM
	var ri_bpm_label = document.createElement("label");
	ri_bpm_label.setAttribute("for","wi_length");
	ri_bpm_label.innerHTML = "Rest Interval BPM: ";
	ri_bpm_label.id = "ri_bpm_label";
	input_wrapper.appendChild(ri_bpm_label);
	var br7 = document.createElement('br');
	br7.id ="br7";
	input_wrapper.appendChild(br7);
	var ri_bpm_input = document.createElement("input");
	ri_bpm_input.className = "_2f8ed265fb69fb70c0c9afef329ae0b6-scss";
	ri_bpm_input.id="ri_bpm";
	ri_bpm_input.onkeypress = OnlyNums;
	ri_bpm_input.value = "115";
	ri_bpm_input.value= (localStorage.getItem("riBPM") == undefined) ? "100" : localStorage.getItem("riBPM");
	input_wrapper.appendChild(ri_bpm_input);
	var br8 = document.createElement('br');
	br8.id ="br8";
	input_wrapper.appendChild(br8);
	
	// A5. Total Workout Length
	var tw_length_label = document.createElement("label");
	tw_length_label.setAttribute("for","wi_length_input");
	tw_length_label.innerHTML = "Total Workout Length (min): ";
	tw_length_label.id = "tw_length_label";
	input_wrapper.appendChild(tw_length_label);
	var br9 = document.createElement('br');
	br9.id ="br9";
	input_wrapper.appendChild(br9);
	var tw_length_input = document.createElement("input");
	tw_length_input.className = "_2f8ed265fb69fb70c0c9afef329ae0b6-scss";
	tw_length_input.id="tw_length";
	tw_length_input.onkeypress = OnlyNums;
	tw_length_input.value= (localStorage.getItem("twLength") == undefined) ? "10" : localStorage.getItem("twLength");
	input_wrapper.appendChild(tw_length_input);
	var br10 = document.createElement('br');
	br10.id ="br10";
	input_wrapper.appendChild(br10);
	workoutDiv.appendChild(input_wrapper);

	//wrapper div for title, both timer countdown, and interval type text
	var timer_wrapper = document.createElement("div");
	timer_wrapper.className = "wrapper-div-spacing";
	// B0. workout div's title
	var hiitify_title = document.createElement('H2');
	hiitify_title.className = "_2e77de28f0b30f1b6e8d479009f45e0e-scss hiitify_title"
	hiitify_title.innerHTML = "HIITify";
	hiitify_title.id="hiitify_title";
	hiitify_title.style.display = "none";
	timer_wrapper.appendChild(hiitify_title)
	//B1. total time remaining - could be a countdown or maybe a bar with % done?
	var total_time_remaining = document.createElement('p');
	total_time_remaining.id = "total_time_remaining";
	total_time_remaining.style.display = "none";
	timer_wrapper.appendChild(total_time_remaining);
	//B2. interval time remaining
	var interval_time_remaining = document.createElement('div');
	interval_time_remaining.id = "interval_time_remaining";
	interval_time_remaining.style.display = "none"
	timer_wrapper.appendChild(interval_time_remaining);
	//B3. interval type
	var interval_type_label = document.createElement('H2');
	interval_type_label.id = "interval_type_label";
	interval_type_label.style.display = "none";
	timer_wrapper.appendChild(interval_type_label);
	workoutDiv.appendChild(timer_wrapper);

	//wrapper div for play/pause and stop buttons
	var play_pause_stop_wrapper = document.createElement("div");
	play_pause_stop_wrapper.className = "wrapper-div-spacing extra-spacing";
	play_pause_stop_wrapper.id = "play_pause_stop_wrapper";
	play_pause_stop_wrapper.style.display = "none";
	workoutDiv.appendChild(play_pause_stop_wrapper);
	//B6. play pause button
	var play_pause_button = document.createElement('button');
	play_pause_button.className = 'btn-play spacing-horizontal tooltip_parent';
	play_pause_button.id = 'play_pause_button';
	play_pause_button.addEventListener("click", playPause);
	play_pause_button.style.display = "none";
	play_pause_stop_wrapper.appendChild(play_pause_button);
	//B6a. play pause button tooltip
	var play_pause_button_span = document.createElement("span");
	play_pause_button_span.className = "tooltip_span";
	play_pause_button_span.id = "play_pause_button_span";
	play_pause_button_span.innerHTML = "Pause Timer";
	play_pause_button.appendChild(play_pause_button_span);

	//B6b. play graphic 
	var svg = document.createElementNS("http://www.w3.org/2000/svg",'svg');
	svg.setAttributeNS(null,"height", "28");
	svg.setAttributeNS(null,"width","28");
	svg.setAttributeNS(null,"role","img");
	svg.setAttributeNS(null,"viewBox","0 0 24 24");
	play_pause_button.appendChild(svg);
	var triangle_polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
	triangle_polygon.id = "play_img";
	triangle_polygon.setAttribute("points","21.57 14 5.98 5 5.98 23 21.57 14");
  	triangle_polygon.style.fill="white";
	svg.appendChild(triangle_polygon);
	//B6c. pause graphic
	triangle_polygon.style.display="none";
	var rect1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
	rect1.id = "pause_img_1";
    rect1.setAttributeNS(null,"x","5")
    rect1.setAttributeNS(null,"y","5")
    rect1.setAttributeNS(null,"width","4")
    rect1.setAttributeNS(null,"height","18")
    rect1.style.fill="white";
    svg.appendChild(rect1);
	var rect2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
	rect2.id = "pause_img_2";
    rect2.setAttributeNS(null,"x","15")
    rect2.setAttributeNS(null,"y","5")
    rect2.setAttributeNS(null,"width","4")
    rect2.setAttributeNS(null,"height","18")
    rect2.style.fill="white";
	svg.appendChild(rect2);
	//B7. stop button
	var end_workout_button = document.createElement('button');
	end_workout_button.className = "btn-stop spacing-horizontal tooltip_parent";
	end_workout_button.id = 'end_workout_button';
	end_workout_button.addEventListener("click", endWorkout);
	end_workout_button.style.display = "none";
	play_pause_stop_wrapper.appendChild(end_workout_button);
	//B7a. stop button tooltip
	var stop_button_span = document.createElement("span");
	stop_button_span.className = "tooltip_span";
	stop_button_span.innerHTML = "Stop Workout";
	end_workout_button.appendChild(stop_button_span);
	//B7a. stop graphic
	var stop_svg = document.createElementNS("http://www.w3.org/2000/svg",'svg');
	stop_svg.setAttributeNS(null,"height", "28");
	stop_svg.setAttributeNS(null,"width","28");
	stop_svg.setAttributeNS(null,"role","img");
	stop_svg.setAttributeNS(null,"viewBox","0 0 24 24");
	end_workout_button.appendChild(stop_svg);
	var square = document.createElementNS("http://www.w3.org/2000/svg", "rect");
	square.id = "stop_square_img";
    square.setAttributeNS(null,"x","3");
    square.setAttributeNS(null,"rx","2");
	square.setAttributeNS(null,"y","5");
    square.setAttributeNS(null,"width","18");
	square.setAttributeNS(null,"height","18");
	square.setAttributeNS(null,"stroke-width","3");
    square.style.fill="rgb(40,40,40)";
	square.style.stroke="rgb(29, 185, 91)";
	//making the svg turn red when you hover over the button
	end_workout_button.onmouseover = function() {mouseOver()};
	end_workout_button.onmouseout = function() {mouseOut()};
	function mouseOver() {
		square.style.stroke="#f94e4e";
	}
	function mouseOut() {
		square.style.stroke="rgb(29, 185, 91)";
	}
	stop_svg.appendChild(square);

	//wrapper div for toggle switch and label
	var beep_wrapper = document.createElement("div");
	beep_wrapper.id = "beep_wrapper";
	beep_wrapper.className = "wrapper-div-spacing";
	beep_wrapper.textAlign = "center";
	workoutDiv.appendChild(beep_wrapper);
	//B9. beep toggle label
	var beep_switch_label = document.createElement("label");
	beep_switch_label.id = "beep_switch_label";
	beep_switch_label.innerHTML = "Beeping Sounds:"
	beep_wrapper.appendChild(beep_switch_label);
	//B10. beep toggle switch
	var beep_switch_label = document.createElement("label");
	beep_switch_label.className ="switch beep_toggle spacing-horizontal";
	var beep_switch_input = document.createElement("input");
	beep_switch_input.id = "beep_switch_input";
	beep_switch_input.className = " beep_toggle spacing-horizontal"
	beep_switch_input.checked = "true";
	beep_switch_label.appendChild(beep_switch_input);
	beep_switch_input.type = "checkbox";
	var beep_switch_span = document.createElement("span");
	beep_switch_label.appendChild(beep_switch_span);
	beep_switch_span.className ="slider round beep_toggle";
	beep_wrapper.appendChild(beep_switch_label);


	// wrapper div for hiittify speed button and reset speed button
	var speed_button_wrapper = document.createElement("div");
	speed_button_wrapper.className = "wrapper-div-spacing";
	workoutDiv.appendChild(speed_button_wrapper);
	//B4. hiitify speed button
	var hiitify_speed_button = document.createElement('button');
	hiitify_speed_button.innerHTML = 'HIITify Speed';
	hiitify_speed_button.className = "btn-gray spacing-horizontal"; 
	hiitify_speed_button.id = 'hiitify_speed_button';
	hiitify_speed_button.addEventListener("click", hiitifySpeed);
	hiitify_speed_button.style.display = "none";
	speed_button_wrapper.appendChild(hiitify_speed_button);
	//B5. reset speed button
	var reset_speed_button = document.createElement('button');
	reset_speed_button.innerHTML = 'Reset Speed';
	reset_speed_button.className = "btn-gray spacing-horizontal"; 
	reset_speed_button.id = 'reset_speed_button';
	reset_speed_button.addEventListener("click", resetSpeed);
	reset_speed_button.style.display = "none";
	speed_button_wrapper.appendChild(reset_speed_button);

	//B8. bpm and speed percentage text
	var speed_text_label = document.createElement('p');
	speed_text_label.id = "speed_text_label";
	speed_text_label.innerHTML = "BPM | 1x speed";
	speed_text_label.style.display = "none";
	workoutDiv.appendChild(speed_text_label);

	// A6. wrapper div for Workout Start Button and cancel button
	var start_cancel_wrapper = document.createElement("div");
	start_cancel_wrapper.className = "wrapper-div-spacing";
	workoutDiv.append(start_cancel_wrapper);
	var start_button = document.createElement("button");
	start_button.innerHTML = "Start!";
	start_button.className = "btn-green spacing-horizontal";
	start_button.id = "start_button";
	start_cancel_wrapper.appendChild(start_button); 
	start_button.addEventListener("click", startWorkout);
	var cancel_button = document.createElement("button");
	cancel_button.innerHTML = "cancel";
	cancel_button.className = "cancel-button spacing-horizontal"; 
	cancel_button.id = "cancel_button";
	start_cancel_wrapper.appendChild(cancel_button); 
	cancel_button.addEventListener("click", ToggleWorkoutDiv);


    document.body.appendChild(workoutDiv);
      
    return workoutDiv;
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
function getSongBPM(){
	let promise = getCurrentSong(localStorage.getItem("accessToken"))
	.then(id => {
		console.log("THIS IS THE SONG ID: " + id);
		if (id === ""){ //if no song is playing
			return "";
		}
		return makeXHR('GET', "	https://api.spotify.com/v1/audio-analysis/" + id, localStorage.getItem("accessToken"))
	})
	.then(data => {
		if (data === ""){
			currentSongBPM = 0; // maybe dangerous
			console.log("BPM is 0 (no song playing)");
			return;
		}
		let parsedData = JSON.parse(data)
		currentSongBPM = parsedData.track.tempo
		console.log("THIS IS THE BPM: " +  currentSongBPM);	
		sessionStorage.setItem("currentSongOriginalBPM", currentSongBPM);
	});
	return promise;
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
/*  Code to make (workoutDiv) draggable
/** ============================================================================================================*/

/**
 * code to make the workoutDiv draggable - modified from here: https://stackoverflow.com/questions/53247852/javascript-moveable-divs-with-javascript
 * we didn't do something like $('#workoutDiv').draggable({}); because 
 * it made the div jump at the beginning (because the position is set to be absolute)
 * */
function makeDraggable(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    elmnt.onmousedown = dragMouseDown;
  function dragMouseDown(e) {
	//no dragging in input fields or buttons (or else you can't type anything or release buttons without clicking it), 
	if ((e.target.tagName === "INPUT") || (e.target.tagName === "BUTTON")){ 
		return;
	}
	//no dragging on the beeping sounds toggle switch either (svg / polygon / rect check is needed bc those have className but don't have an .includes() function, which throws an error)
	if (e.target.className != null && e.target.nodeName != "svg" && e.target.nodeName != "polygon" && e.target.nodeName != "rect" && e.target.className.includes("beep_toggle")){
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