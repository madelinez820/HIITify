/* 
 The problem: the video/audio element is hidden and only referenced in spotify's encapsulated code
 
 1. The code main part of the code is written in a template literal string with back quotes ``
 	- This allows a multilined string with double quotes and single quotes without breaking the string variable
 	
 2. This string named code is injected into the top of the html dom as a script element when the page loads
 	- It loads before spotify's scripts and can pre-append the browser's code of document.createElement before it's used
 	- Whenever spotify's scripts execute document.createElement('video') a reference to the element created is stored in VideoElementsMade
 		- document.createElement('video') used to be an audio element until spotify started supporting videos and now it's randomly either
 3. The timeout is just an added assurance that the playbackspeed input element is created and that the speed is changed to the stored speed from previous sessions
*/
/* ======== Start of code string literal ======== */
var code = `
	var base = document.createElement; /* A backup reference to the browser's original document.createElement */
	var VideoElementsMade = []; /* Array of video/audio elements made by spotify's scripts */
	
	/* Replacing the DOM's original reference to the browser's createElement function */
	document.createElement = function(message) {
		/* base.apply is calling the backup reference of createElement with the arguments sent to our function and assigning it to our variable named element */
		var element = base.apply(this, arguments); 
		
		/* we check the first argument sent to us Examp. document.createElement('video') would have message = 'video' */
		/* ignores the many document.createElement('div'), document.createElement('nav'), ect... */
		if(message == 'video' || message == 'audio'){ /* Checking if spotify scripts are making a video or audio element */
			VideoElementsMade.push(element); /* Add a reference to the element in our array. Arrays hold references not copies by default in javascript. */
		}
		return element /* return the element and complete the loop so the page is allowed to be made */
	};
	
	/* When the page is loaded completely... */
	window.onload = function() {
		function getStoredSpeed(){ /* Gets stored speed between refreshes*/
			return localStorage.getItem('speed');
		}
		var lastSpeed = getStoredSpeed() || 1.0; /* if stored speed is null make lastSpeed 1.0 */
	
		function setStoredSpeed(value){ /* Sets variable in the site's cookie along-side spotify's stuff */
			localStorage.setItem('speed',value);
		}

		/* Building our playback speed input element */
		var input = document.createElement('input');
		input.type = 'number';
		input.id = 'speed-extension-input';
		input.style = 'background-color: #08080859;'
			+ 'border: #823333;'
			+ 'width: 45px;'
			+ 'margin: 5px;';
		input.value = lastSpeed * 100;
		input.oninput = function(e){ /* What happens when we change the number in our input box element */
			validateAndChangeSpeed();  /* We call our function */
		};
		

		//Creating the Choose Your Workout Div ===================================================================
			// adding button that makes workout div appear and disappear
			var hiitify_button= document.createElement('button');
			hiitify_button.innerHTML = 'HIITify!';
			hiitify_button.addEventListener("click", ToggleWorkoutStartForm);
		
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

			function ToggleWorkoutStartForm() {
				var x = document.getElementById("chooseWorkoutDiv");
				if (x.style.display === "none") {
				  x.style.display = "block";
				} else {
				  x.style.display = "none";
				}
			  }
		//End of Creating the Choose Your Workout Div ===================================================================


	  
	  function startWorkout(){
		var wi_length = document.getElementById("wi_length").value;
		var wi_bpm = document.getElementById("wi_bpm").value;
		var ri_length = document.getElementById("ri_length").value;
		var ri_bpm = document.getElementById("ri_bpm").value;
		var tw_length = document.getElementById("tw_length").value;
		console.log(wi_length, wi_bpm, ri_length, ri_bpm, tw_length)
		ToggleWorkoutStartForm(); // makes the form disappear
	  }
	  //===================================================================
		
		function validateAndChangeSpeed(value){ 
			var val = parseFloat( value || (input.value / 100)); /* val must be in format 0.0625 - 16.0 https://stackoverflow.com/a/32320020 */
			if(!isNaN(val)){ /* check if val is a number */
				changeSpeed(val);
			}
		}
		
		function changeSpeed(val) {
			for(var i = 0; i < VideoElementsMade.length; i++){ /* change speed for all elements found (i havent seen this be more than 1 but you never know) */
				VideoElementsMade[i].playbackRate = val; /* set the playback rate here */
				if(val != lastSpeed){ /* update the lastSpeed if the speed actually changed */
					lastSpeed = val;
					setStoredSpeed(val);
				}
			}
		}
		
		function timeout() { /* This function is called by itself over and over */

			if(document.getElementById('speed-extension-input') == null) /* check if our input element doesnt exist */
			{
				try {
					document.getElementsByClassName('now-playing-bar__right')[0].appendChild (hiitify_button); /* make our input exist on page */
					// document.getElementsByClassName('now-playing-bar__right')[0].appendChild (input); /* make our input exist on page */
				}catch{
					setTimeout(timeout, 100);/*now-playing-bar__right doesnt exist yet so lets try again in 100ms*/
					return;
				}
			}
			setTimeout(function () { /* setTimeout is a delayed call(500 milliseconds) to the code below */
				try {
					validateAndChangeSpeed(lastSpeed); /* this is in a try/catch because if an error happens timeout wouldnt be called again. */
				}catch{
					
				}
				timeout(); /* call timeout again which starts the loop and eventually it will come back here */
			}, 500); /* 500ms */
		}
		
		timeout(); /* starts the loop to check and create our inputbox and to set the playback speed without having to mess with input box(by refreshing and having it load from cookie) */
		/* sometimes playbackRate is set back to 1.0 by spotify's code so timeout just ensures it goes the speed the user desires */
	};`; 
/* ======== End of code string literal ======== */
var script = document.createElement('script'); /* Create our dummy script to be inserted with our code variable  */
script.textContent = code; /* insert our code as the contents of the script */
document.body.appendChild(script); /* make our script exist on the page as, hopefully, the first script to execute. */
(document.head||document.documentElement).appendChild(script); /* appends script again(not good practice) as close to top as possible */
script.remove(); /* idk why i do this */
