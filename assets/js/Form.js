/*
  showIntermediateStops = true? Tussen haltes

*/
window.onload=function(){
  $(function(){
    if(window.location.protocol==="https:")
       window.location.protocol="http";
  });
}
// To understand this code, know that a lot of parameters will be given via an object called config, which stores user input.

//file:///Users/Users/Ferni/Desktop/railRunner/index.html#fromPlace=Station+Utrecht+Centraal&fromLatLng=52.088894%2C5.110282&toPlace=Erasmus+Universiteit%2C+Rotterdam&toLatLng=51.916669%2C4.522969&time=16%3A30&date=2018-03-06&arriveBy=false
//file:///Users/Ferni/Desktop/railRunner/index.html#fromPlace=Station+Rotterdam+Alexander&fromLatLng=51.951946%2C4.553609&toPlace=Erasmus+Universiteit%2C+Rotterdam&toLatLng=51.916669%2C4.522969&time=16%3A55&date=2018-03-06&arriveBy=false

var walkSpeed=4;

//Set path to server where request will be made
//var planningserver = 'https://1313.nl/rrrr/plan?';
var planningserver = config.whitelabel_prefix+'/'+config.whitelabel_plan_path+'?';
//Overwrite default string class
//If string is too short to be given as input, extend it with a padding
String.prototype.lpad = function(padString, length) {
    var str = this;
    while (str.length < length)
        str = padString + str;
    return str;
};

//Overwrite jQuery function
jQuery.unparam = function (value) {
    if (value.length > 1 && value.charAt(0) == '#'){
        value = value.substring(1);
    }
    var
    // Object that holds names => values.
    params = {},
    // Get query string pieces (separated by &)
    pieces = value.split('&'),
    // Temporary variables used in loop.
    pair, i, l;

    // Loop through query string pieces and assign params.
    for (i = 0, l = pieces.length; i < l; i++) {
        pair = pieces[i].split('=', 2);
        // Repeated parameters with the same name are overwritten. Parameters
        // with no value get set to boolean true.
        params[decodeURIComponent(pair[0])] = (pair.length == 2 ?
            decodeURIComponent(pair[1].replace(/\+/g, ' ')) : true);
    }
    return params;
};

// Upon startup: initialize forms
$(document).ready(function() {
  switchLocale(); //switch to english
  initializeForms(); //set up time and date
  if(window.location.hash) { //Check if there is previous user input in memory
    restoreFromHash(window.location.hash);//Load the form as last filled by user
  }
});
var currentTime = new Date(); //Get current time

//Geocoder to get travel advice via bag42
var defaultGeocoders = {}; 
defaultGeocoders['bag42'] = function( request, response ) {
  $.ajax({
    url: "http://demo.bag42.plannerstack.org/api/v0/geocode/json",
    dataType: "json",
    data: {
      address : request.term + "*"
    },
    success: function( data ) {
      response( $.map( data.results, function( item ) {
      return {
        label: item.formatted_address,
        value: item.formatted_address,
        latlng: item.geometry.location.lat+','+item.geometry.location.lng
        };
      }));
    }
  });
};


var bliksem_geocoder = function( request, response ) {
    $.ajax({
      url: "https://1313.nl/geocoder/" + request.term + '*',
      dataType: "json",
      success: function( data ) {
        response( $.map( data.features, function( item ) {
        var type = 'map-marker';
        if (item.properties.type.match(/station/i)) {
           type = 'train';
        }
        if (item.properties.type.match(/tram/i)) {
           type = 'subway';
        }
        else if (item.properties.type.match(/metro/i)) {
           type = 'subway';
        }
        else if (item.properties.type.match(/ferry/i)) {
           type = 'ship';
        }
        else if (item.properties.type.match(/bus/i)) {
           type = 'bus';
        }
        else if (item.properties.type == 'STT') {
           type = 'road';
        }
   
        return {
          type : type,
          label: item.properties.search,
          value: item.properties.search,
          latlng: item.geometry.coordinates[1]+','+item.geometry.coordinates[0]
          }
        }));
      }
    });
  };
  
  
  var Geocoder = Geocoder || {};
  Geocoder.geocoder = bliksem_geocoder;

// 
function initializeForms(){
    setupAutoComplete(); //Autocomplete functions for originin/destination
    setupDatetime(); //Date and time; get current first, then listen to user input
    setupSubmit(); // Before actually submitting, check validity input by this function
    //setupModeInputGroup(); //
    //Initialize origin/destination to prevent error return
    if ($( "#planner-options-from" ).val() === ''){
        $( "#planner-options-from-latlng" ).val('');
    }
    if ($( "#planner-options-dest" ).val() === ''){
        $( "#planner-options-dest-latlng" ).val('');
    }
}

//Check all input fields and throw error fields below relevant boxes if invalid input
function validate(){
    var valid = true;

    if ($( "#planner-options-from" ).val() === ''){
        $( "#planner-options-from-latlng" ).val('');
    }
    if ($( "#planner-options-dest" ).val() === ''){
        $( "#planner-options-dest-latlng" ).val('');
    }
    $( "#planner-options-from-error" ).remove();
    if ($( "#planner-options-from" ).val() === ''){
        $( "<div class=\"alert alert-danger\" role=\"alert\" id=\"planner-options-from-error\" for=\"planner-options-from\">"+Locale.startpointEmpty+"</div>").insertAfter("#planner-options-inputgroup-from");
        $( "#planner-options-from" ).attr('aria-invalid',true);
        valid = false;
    }else if ($( "#planner-options-from-latlng" ).val() === ''){
        $( "<div class=\"alert alert-danger\" role=\"alert\" id=\"planner-options-from-error\" for=\"planner-options-from\">"+Locale.noStartpointSelected+"</div>").insertAfter("#planner-options-inputgroup-from");
        $( "#planner-options-from" ).attr('aria-invalid',true);
        valid = false;
    }
    $( "#planner-options-dest-error" ).remove();
    if ($( "#planner-options-dest" ).val() === ''){
        $( "<div class=\"alert alert-danger\" role=\"alert\" id=\"planner-options-dest-error\" for=\"planner-options-dest\">"+Locale.destinationEmpty+"</div>").insertAfter("#planner-options-inputgroup-dest");
        $( "#planner-options-dest" ).attr('aria-invalid',true);
        valid = false;
    }else if ($( "#planner-options-dest-latlng" ).val() === ''){
        $( "<div class=\"alert alert-danger\" role=\"alert\" id=\"planner-options-dest-error\" for=\"planner-options-dest\">"+Locale.noDestinationSelected+"</div>").insertAfter("#planner-options-inputgroup-dest");
        $( "#planner-options-dest" ).attr('aria-invalid',true);
        valid = false;
    }
    if (!valid){return valid;}
    $( "#planner-options-from" ).attr('aria-invalid',false);
    $( "#planner-options-dest" ).attr('aria-invalid',false);
    $( "#planner-options-time-error" ).remove();
    if (!getTime()){
        $( "<div class=\"alert alert-danger\" role=\"alert\" id=\"planner-options-time-error\" for=\"planner-options-time\">"+Locale.noValidTime+"</div>").insertAfter("#planner-options-inputgroup-time");
        valid = false;
        $( "#planner-options-time" ).attr('aria-invalid',true);
    }
    $( "#planner-options-date-error" ).remove();
    if (!getDate()){
        $( "<div class=\"alert alert-danger\" role=\"alert\" id=\"planner-options-date-error\" for=\"planner-options-date\">"+Locale.noValidDate+"</div>").insertAfter("#planner-options-inputgroup-date");
        $( "#planner-options-date" ).attr('aria-invalid',true);
        return false;
    }
    var minDate = $( "#planner-options-date" ).attr('min');
    var maxDate = $( "#planner-options-date" ).attr('max');
    if (getDate() < minDate){
        $( "<div class=\"alert alert-danger\" role=\"alert\" id=\"planner-options-date-error\" for=\"planner-options-date\">"+Locale.dateTooEarly(minDate)+"</div>").insertAfter("#planner-options-inputgroup-date");
        valid = false;
        $( "#planner-options-date" ).attr('aria-invalid',true);
    }else if (getDate() > maxDate){
        $( "<div class=\"alert alert-danger\" role=\"alert\" id=\"planner-options-date-error\" for=\"planner-options-date\">"+Locale.dateTooLate(maxDate)+"</div>").insertAfter("#planner-options-inputgroup-date");
        $( "#planner-options-date" ).attr('aria-invalid',true);
        valid = false;
    }
    if (valid){
        $( "#planner-options-time" ).attr('aria-invalid',false);
        $( "#planner-options-date" ).attr('aria-invalid',false);
    }
    return valid;
}

//Hide option form and show advice containers
function hideForm(){
  $('.plannerpanel.planner-options').removeClass('planner-form').addClass('planner-summary');
  $('#planner-options-form').attr('aria-hidden',true);
  $('#planner-options-form').hide();
  $('#planner-options-desc-row').show();
  $('#planner-options-desc-row').attr('aria-hidden',false);
  $('#planner-options-desc-row').removeClass('hidden');
  $('#planner-advice-container').show();
  $('#planner-advice-container').attr('aria-hidden',false);
  $('#planner-advice-container').removeClass('hidden');
}

//Hide advice containers and show option forms
function showForm(){
  $('.plannerpanel.planner-options').removeClass('planner-summary').addClass('planner-form');
  $('#planner-options-form').attr('aria-hidden',false);
  $('#planner-options-form').show();
  $('#planner-options-desc-row').hide();
  $('#planner-options-desc-row').attr('aria-hidden',true);
  $('#planner-options-desc-row').addClass('hidden');
  $('#planner-advice-container').find('.alert').remove();
  $('#planner-advice-container').hide();
  $('#planner-advice-container').attr('aria-hidden',true);
  $('#planner-advice-container').addClass('hidden');
  $('#planner-options-submit').button('reset');
}

//Put Date in correct format
function getPrettyDate(){
   var date = getDate().split('-');
   date = new Date(date[0],date[1]-1,date[2]);
   return Locale.days[date.getDay()] + ' ' + date.getDate() + ' ' + Locale.months[date.getMonth()];
}

var defaultRequestGenerators = {};

/*
    Whichever request generator will be used is decided by the user in config.requestGenerator.
    Basically, three options given here. First: bliksem...
*/
defaultRequestGenerators['bliksem'] = function (plannerreq){
  var bliksemReq = {};
  if (plannerreq['arriveBy']){
    bliksemReq['arrive'] = true;
  }else{
    bliksemReq['depart'] = true;
  }

  bliksemReq['from-latlng'] = plannerreq['fromLatLng'];
  bliksemReq['to-latlng'] = plannerreq['toLatLng'];
  bliksemReq['date'] = plannerreq['date'] + 'T' + plannerreq['time'];
  bliksemReq['showIntermediateStops'] = true;
  return bliksemReq;
};

// ... second, OTP (This one will be used as default)
defaultRequestGenerators['otp'] = function (plannerreq){
  // TODO: Just use $.extend()
  // ?fromPlace=52.008978039788076%2C4.3608856201171875&toPlace=51.918861649083915%2C4.478302001953125&time=10%3A11am&date=11-06-2014&mode=BICYCLE_PARK%2CWALK%2CTRANSIT&maxWalkDistance=804.672&arriveBy=false&wheelchair=false&showIntermediateStops=false
  var otpReq = {};
  otpReq['arriveBy']              = plannerreq['arriveBy'];
  otpReq['fromPlace']             = plannerreq['fromLatLng'];
  otpReq['toPlace']               = plannerreq['toLatLng'];
  otpReq['date']                  = plannerreq['date'];
  otpReq['time']                  = plannerreq['time'];
  otpReq['showIntermediateStops'] = plannerreq['showIntermediateStops'];
  otpReq['mode']                  = plannerreq['mode'];
  // TODO: Allow these to be set through the UI?
  otpReq['maxWalkDistance']       = 2000;
  return otpReq;
};

/// ...third, (I think a debugging tool), an Mmri-tester
defaultRequestGenerators['mmri-tester'] = function (plannerreq){
  var req = { 'to':{}, 'from':{} };

  req['id']                     = '[CHANGE ME]';
  req['comment']                = '[CHANGE ME]';
  req['timeType']               = plannerreq['arriveBy'] ? 'A' : 'D';
  req['time']                   = plannerreq['date'] + 'T' + plannerreq['time']+ ':00'; // match format '%Y-%m-%dT%H:%M:%S'
  req['from']['latitude']       = parseFloat(plannerreq['fromLatLng'].split(',')[0]);
  req['from']['longitude']      = parseFloat(plannerreq['fromLatLng'].split(',')[1]);
  req['from']['description']    = plannerreq['fromPlace'];
  req['to']['latitude']         = parseFloat(plannerreq['toLatLng'].split(',')[0]);
  req['to']['longitude']        = parseFloat(plannerreq['toLatLng'].split(',')[1]);
  req['to']['description']      = plannerreq['toPlace'];

  return req;
};

//The requestGenerator Variable will be filled with a function that is called based on user choice of generator
var requestGenerator = defaultRequestGenerators[config.requestGenerator];
//console.log(config.requestGenerator)
// Convert date format
function epochtoIS08601date(epoch){
  var d = new Date(epoch);
  var date = String(d.getFullYear())+'-'+String((d.getMonth()+1)).lpad('0',2)+'-'+String(d.getDate()).lpad('0',2);
  return date;
}

// Convert time format
function epochtoIS08601time(epoch){
  var d = new Date(epoch);
  var time = d.getHours().toString().lpad('0',2)+':'+d.getMinutes().toString().lpad('0',2)+':'+d.getSeconds().toString().lpad('0',2);
  return time;
}

//Get earlier travel advice
function earlierAdvice(){
    //Boolean to cancel request if no iternaties available
  if (!itineraries){
     return false;
  }
  while(document.getElementById("planner-advice-list").childNodes[document.getElementById("planner-advice-list").childNodes.length-2].className=='planner-advice-dateheader'){
    document.getElementById("planner-advice-list").childNodes[document.getElementById("planner-advice-list").childNodes.length-2].remove();
  }
  $('#planner-advice-list').find('.planner-advice-itinbutton').last().find('.planner-advice-dateheader').remove();
  if(earlier_itineraries.length>0){
      var startDate = $('#planner-advice-list').find('.planner-advice-dateheader').first().html();
      for (i = 0, l = Math.min(earlier_itineraries.length,3); i < l; i++) {
          itin = earlier_itineraries.pop();
          var prettyStartDate = prettyDateEpoch(itin.startTime); //Make date time readible for user
          if (startDate != prettyStartDate){ 
              $('<div class="planner-advice-dateheader">'+prettyStartDate+'</div>').insertAfter('#planner-advice-earlier');
              startDate = prettyStartDate;
          }
          itinButton(itin,'f').insertAfter($('#planner-advice-list').find('.planner-advice-dateheader').first()); //put interinary in button
          if(document.getElementById("planner-advice-list").childElementCount>11){
                $('#planner-advice-list').find('.planner-advice-itinbutton').last().remove();
                later_itineraries.push(itineraries.pop());
          }
          //itineraries.unshift(itin);
      }
  }
  else{
    $('#planner-advice-earlier').button('loading');// Loading button to signal to user
    
    var minEpoch = 9999999999999;//Lol jst a large number
    $.each( itineraries , function( index, itin ){
        if (itin.endTime < minEpoch){
            minEpoch = itin.endTime; //  Keep track of the earliest iterinary in the list
        }
    });

    var plannerreq = makePlanRequest(); // Just fill the variable with necessary info
    plannerreq.arriveBy = true; //I guess the time given by user should be set to arrive by
    minEpoch -= 60*1000; //Find trips that go one minute before this one
    plannerreq.date = epochtoIS08601date(minEpoch); //Something with converting epochs to time
    plannerreq.time = epochtoIS08601time(minEpoch);// and date

    var url = planningserver + jQuery.param(requestGenerator(plannerreq)); //Construct the API call url here!

    $.get( url, function( data ) { //Get data from url
      if ( !itineraryDataIsValid(data) ){ //Check if API call returned data
          return;
      }



      /****************TESTING*************************************
      *************************************************************/
      var journeys =  JSON.parse(JSON.stringify(data.plan.itineraries));
      var count=0;
      for (var key in journeys){ //For each itinerary, check if better transfer options are possible
          data.plan.itineraries[parseInt(key)+count].runnerField = false;
          var newItin = addBetterItin(journeys[key],0);
          if(newItin!="none"){ //Better itinerary found
            newItin.runnerField = true;
            data.plan.itineraries.splice(parseInt(key)+count, 0, newItin); //Insert new traveladvice
            count++;
          }
      }
      /*************************************************************
      *************************************************************/

      //Get time of iterinary
      var startDate = $('#planner-advice-list').find('.planner-advice-dateheader').first().html();
      $.each( data.plan.itineraries , function( index, itin ){ //loop through the possible itineraries
          var prettyStartDate = prettyDateEpoch(itin.startTime); //Make date time readible for user
          if (startDate != prettyStartDate){ // Not sure why this would happen but may depend on type of API used.
              $('<div class="planner-advice-dateheader">'+prettyStartDate+'</div>').insertAfter('#planner-advice-earlier');
              startDate = prettyStartDate;
          }
          itinButton(itin,'f').insertAfter($('#planner-advice-list').find('.planner-advice-dateheader').first()); //put interinary in button
          
          if(document.getElementById("planner-advice-list").childElementCount>11){
                 
                $('#planner-advice-list').find('.planner-advice-itinbutton').last().remove();
                later_itineraries.push(itineraries.pop());  
          }
      });
      var maxEpoch = 0;
      $.each( itineraries , function( index, itin ){
        if (itin.startTime > maxEpoch){
            maxEpoch = itin.startTime;
        }
      });
      maxEpoch += 120*1000;
      $('#planner-advice-earlier').button('reset');// option to reset interinaries
    });
  }
  while(document.getElementById("planner-advice-list").childNodes[document.getElementById("planner-advice-list").childNodes.length-2].className=='planner-advice-dateheader'){
    document.getElementById("planner-advice-list").childNodes[document.getElementById("planner-advice-list").childNodes.length-2].remove();
  }
  return false;
}

/* Set buttons for iterinary.
function itinButton(itin){
    //Uses number of iternaries to make appropriate number of button
    var _itinButton = $('<button type="button" class="btn btn-default" onclick="renderItinerary('+itineraries.length+',true)"></button>');
    itineraries.push(itin); //Add new iterinary 
    //And some more info to include in button
    _itinButton.append('<b>'+timeFromEpoch(itin.startTime)+'</b>  <span class="glyphicon glyphicon-arrow-right"></span> <b>'+timeFromEpoch(itin.endTime)+'</b>');
    _itinButton.append('<div>'+Locale.amountTransfers(itin.transfers)+'</div>');
    return _itinButton;
}
*/

//Method to check validity of iterninaries depending on different sources.
function itineraryDataIsValid (data) {
  if (data['error'] && data['error'] !== null && data['error'] !== 'null' ) {
    return false;
  }
  if ( !('itineraries' in data.plan) || data.plan.itineraries.length === 0 ) {
    return false;
  }
  return  true;
}

//Getlater traveladvice
function laterAdvice(){
  if (!itineraries){
     return false;
  }
  while(document.getElementById("planner-advice-list").childNodes[1].className=='planner-advice-dateheader' &&
          document.getElementById("planner-advice-list").childNodes[2].className=='planner-advice-dateheader'){
    document.getElementById("planner-advice-list").childNodes[1].remove();
  }
  if(later_itineraries.length>0){
      for (i = 0, l = Math.min(later_itineraries.length,4); i < l; i++) {
          var startDate = $('#planner-advice-list').find('.planner-advice-dateheader').first().html();
          itin = later_itineraries.pop();
          var prettyStartDate = prettyDateEpoch(itin.startTime);
          if (startDate != prettyStartDate){
              $(('<div class="planner-advice-dateheader">'+prettyStartDate+'</div>')).insertAfter($('#planner-advice-list').find('.planner-advice-itinbutton').last());
              itinButton(itin,'l').insertAfter($('#planner-advice-list').find('.planner-advice-dateheader').last());
              startDate = prettyStartDate;
          }else{
              itinButton(itin,'l').insertAfter($('#planner-advice-list').find('.planner-advice-itinbutton').last());
              
          }
          if(document.getElementById("planner-advice-list").childElementCount>11){
                $('#planner-advice-list').find('.planner-advice-itinbutton').first().remove();
                earlier_itineraries.push(itineraries.shift());
              }
          //itineraries.push(itin);
      }
  }
  else{
    $('#planner-advice-later').button('loading');
    var maxEpoch = 0;
    $.each( itineraries , function( index, itin ){
        if (itin.startTime > maxEpoch){
            maxEpoch = itin.startTime;
        }
    });
    maxEpoch += 120*1000;
    var plannerreq = makePlanRequest();
    plannerreq.arriveBy = false;
    plannerreq.date = epochtoIS08601date(maxEpoch);
    plannerreq.time = epochtoIS08601time(maxEpoch);
    var url = planningserver + jQuery.param(requestGenerator(plannerreq));
    $.get( url, function( data ) {
      if (!itineraryDataIsValid(data)){
          return;
      }

      /****************TESTING*************************************
      *************************************************************/
      var journeys =  JSON.parse(JSON.stringify(data.plan.itineraries));
      var count=0;
      for (var key in journeys){ //For each itinerary, check if better transfer options are possible
          data.plan.itineraries[parseInt(key)+count].runnerField = false;
          var newItin = addBetterItin(journeys[key],0);
          if(newItin!="none"){ //Better itinerary found
            newItin.runnerField = true;
            data.plan.itineraries.splice(parseInt(key)+count, 0, newItin); //Insert new traveladvice
            count++;
          }
      }
      /*************************************************************
      *************************************************************/
      
      var startDate = $('#planner-advice-list').find('.planner-advice-dateheader').last().html();
      $.each( data.plan.itineraries , function( index, itin ){
          var prettyStartDate = prettyDateEpoch(itin.startTime);
          if (startDate != prettyStartDate){
              $(('<div class="planner-advice-dateheader">'+prettyStartDate+'</div>')).insertAfter($('#planner-advice-list').find('.planner-advice-itinbutton').last());
              itinButton(itin,'l').insertAfter($('#planner-advice-list').find('.planner-advice-dateheader').last());
              startDate = prettyStartDate;
          }else{
              itinButton(itin,'l').insertAfter($('#planner-advice-list').find('.planner-advice-itinbutton').last());
              
          }
          if(document.getElementById("planner-advice-list").childElementCount>11){
                $('#planner-advice-list').find('.planner-advice-itinbutton').first().remove();
                earlier_itineraries.push(itineraries.shift());
            }
      });
      $('#planner-advice-later').button('reset');
    });
  }

  while(document.getElementById("planner-advice-list").childNodes[1].className=='planner-advice-dateheader' &&
          document.getElementById("planner-advice-list").childNodes[2].className=='planner-advice-dateheader'){
    document.getElementById("planner-advice-list").childNodes[1].remove();
  }
  return false;
}

function prettyDateEpoch(epoch){
  var date = new Date(epoch);
  return Locale.days[date.getDay()] + ' ' + date.getDate() + ' ' + Locale.months[date.getMonth()];
}

function timeFromEpoch(epoch){
  var date = new Date(epoch);
  var minutes = date.getMinutes();
  var hours = date.getHours();
  if (date.getSeconds()>= 30){
      minutes += 1;
  }
  if (minutes >= 60){
      hours += minutes / 60;
      minutes = minutes % 60;
  }
  if (hours >= 24){
      hours = hours % 24;
  }
  return String(hours).lpad('0',2)+':'+String(minutes).lpad('0',2);
}

//Start out with.. zero itineraries
var itineraries = null;

//Create a list of itineraries! Fill columns with advice.
function legItem(leg){
    
    if(leg.shortWalkTime>0){
      var _legItem = $('<li class="list-group-item advice-leg" style="background-color : hsla(0, 100%, 50%, '+leg.shortWalkTime+');"><div></div></li>');
    }else{
      var _legItem = $('<li class="list-group-item advice-leg"><div></div></li>');
    }
    if (leg.mode == 'WALK'){

        if (leg.from.name == leg.to.name){
            return;
        }
        if(leg.shortWalkTime>0){
          _legItem.append('<div class="list-group-item-heading"><h4 class="leg-header"><b>'+Locale.walk+'<span class="grey small" style="font-size: 14px;"> From '+leg.usualWalkTime+' to '+leg.newWalkTime+' seconds ('+Math.round(5*leg.usualWalkTime/leg.newWalkTime)+' km/h)</span></b></h4></div>');
        }
        else{
          _legItem.append('<div class="list-group-item-heading"><h4 class="leg-header"><b>'+Locale.walk+'</b></h4></div>');
        }
    } else if (leg.mode === 'CAR') {
        _legItem.append('<div class="list-group-item-heading"><h4 class="leg-header"><b>'+Locale.CAR+'</b></h4>');
    } else {
        _legItem.append('<div class="list-group-item-heading"><h4 class="leg-header"><b>'+leg.route+'</b> '+leg.headsign.replace(" via ", " "+Locale.via.toLowerCase()+" ")+'<span class="leg-header-agency-name"><small>'+leg.agencyName+'</small></span></h4>');
    }
    var startTime = timeFromEpoch(leg.startTime-(leg.departureDelay ? leg.departureDelay : 0)*1000);
    var delayMin = (leg.departureDelay/60)|0;
    if ((leg.departureDelay%60)>=30){
        delayMin += 1;
    }
    if (delayMin > 0){
        startTime += '<span class="delay"> +'+ delayMin+'</span>';
    }else if (delayMin > 0){
        startTime += '<span class="early"> '+ delayMin+'</span>';
    }else if (leg.departureDelay !== null){
        startTime += '<span class="ontime"> ✓</span>';
    }
    

    var endTime = timeFromEpoch(leg.endTime-(leg.arrivalDelay ? leg.arrivalDelay : 0)*1000);
    delayMin = (leg.arrivalDelay/60)|0;
    if ((leg.arrivalDelay%60)>=30){
        delayMin += 1;
    }
    if (delayMin > 0){
        endTime += '<span class="delay"> +'+ delayMin+'</span>';
    }else if (delayMin > 0){
        endTime += '<span class="early"> '+ delayMin+'</span>';
    }else if (leg.arrivalDelay !== null){
        endTime += '<span class="ontime"> ✓</span>';
    }

    if (leg.from.platformCode && leg.mode == 'RAIL'){
        _legItem.append('<div><b>'+startTime+'</b> '+leg.from.name+' <small class="grey">'+Locale.platformrail+'</small> '+leg.from.platformCode+'</div>');
    }else if (leg.from.platformCode && leg.mode != 'WALK'){
        _legItem.append('<div><b>'+startTime+'</b> '+leg.from.name+' <small class="grey">'+Locale.platform+'</small> '+leg.from.platformCode+'</div>');
    }else{
        _legItem.append('<div><b>'+startTime+'</b> '+leg.from.name+'</div>');
    }
    if (leg.to.platformCode && leg.mode == 'RAIL'){
        _legItem.append('<div><b>'+endTime+'</b> '+leg.to.name+' <small class="grey">'+Locale.platformrail+'</small> '+leg.to.platformCode+'</div>');
    }else if (leg.to.platformCode && leg.mode != 'WALK'){
        _legItem.append('<div><b>'+endTime+'</b> '+leg.to.name+' <small class="grey">'+Locale.platform+'</small> '+leg.to.platformCode+'</div>');
    }else{
        _legItem.append('<div><b>'+endTime+'</b> '+leg.to.name+'</div>');
    }
    return _legItem;
}

// Show list of itineraries. 
function renderItinerary(id,moveto){ //Input: number of itineraries and boolean to check formatting of advice
    $('#planner-leg-list').html(''); //Initialize list
    for (var index in itineraries){
      if(itineraries[index].id==id){ //find correct itinerary to display
        var itin = itineraries[index]; 
      }
    }
    $.each( itin.legs , function( index, leg ){ //Each itinerary has a leg with info. Append this to the list of advices
        $('#planner-leg-list').append(legItem(leg));
    });
    if ( moveto && $(this).width() < 981 ) { //Move window to center on info
        $('#planner-leg-list').ScrollTo({
            duration: 500,
            easing: 'linear'
        });
    }
    $('#planner-advice-list').find('.btn').removeClass('active');
    $(this).addClass('active');
}
var itin_count = 0;
//Somehow there is another itinbutton method? Same as previous, try deleting this part later.
function itinButton(itin,pos){
    itin.id=itin_count;
    if(itin.runnerField==true){
      var _itinButton = $('<button type="button" class="btn btn-default planner-advice-itinbutton greenButton" onclick="renderItinerary('+itin.id+',true)"></button>');
    }else{
      var _itinButton = $('<button type="button" class="btn btn-default planner-advice-itinbutton" onclick="renderItinerary('+itin.id+',true)"></button>');
    }
    itin_count++;
    if(pos=='l'){
      itineraries.push(itin);
    }
    else{
      itineraries.unshift(itin);
    }
    
    _itinButton.append('<b>'+timeFromEpoch(itin.startTime)+'</b>  <span class="glyphicon glyphicon-arrow-right"></span> <b>'+timeFromEpoch(itin.endTime)+'</b>');
    _itinButton.append('<div>'+Locale.amountTransfers(itin.transfers)+'</div>');
    return _itinButton;
}

/**
 * mode input rendering. Removed for now since car/ train option will be deleted.
 

function setupModeInputGroup () {
  if (!config.modes || config.modes.length < 2) {
    console.info('no modes to select:: ', config.modes);
    return;
  }
  var _modeInputGroupEl = modeInputGroupEl();
  // Clear div
  _modeInputGroupEl.html('');
  // Fill div
  var html = '';
  for (var i = 0; i < config.modes.length; i++) {
    html += modeRadioButtonHtml(config.modes[i], config.default_mode);
  }
  _modeInputGroupEl.append(html);
}


function modeInputGroupEl () {
  if (!cached_modeInputGroupEl) {
    cached_modeInputGroupEl = $('#planner-options-inputgroup-mode');
  }
  return cached_modeInputGroupEl;
}var cached_modeInputGroupEl = null;

function modeRadioButtonHtml(mode, selected_mode) {
  return '<label class="btn btn-large">'+
    '<input type="radio" id="'+mode+'" name="mode" autocomplete="off" ' + ( mode === selected_mode?'checked="true"': '' ) + '> '+ Locale[mode]+
  '</label>';
}

function checkedModeId() {
  var checked = modeInputGroupEl().find(':checked'); // find by pseudoclass 
  if (checked) {
    return checked.attr('id');
  }
  return null;
}

function setMode(mode) {
  var toBeChecked = modeInputGroupEl().find('#'+mode);
  // uncheck all
  modeInputGroupEl().find('[type="radio"]').removeAttr('checked');
  // check set mode
  toBeChecked.attr('checked',true);
}

 * mode input rendering END
 */



function planItinerary(plannerreq){
  var url = planningserver + jQuery.param(requestGenerator(plannerreq)); //Make url for API call
  $('#planner-advice-container').prepend('<div class="progress progress-striped active">'+
  '<div class="progress-bar"  role="progressbar" aria-valuenow="100" aria-valuemin="100" aria-valuemax="100" style="width: 100%">'+
  '<span class="sr-only">'+Locale.loading+'</span></div></div>'); //Set loading bar before calling API
  $('#planner-advice-list').html(''); //Initialize the advice lists
  $('#planner-leg-list').html('');//Initialize the leg lists
  $.get( url, function( data ) { //This is the API call.
    $('#planner-leg-list').html(''); //Initialize again? meh
    itineraries = []; //Empty list of iterenaties
    later_itineraries = [];
    earlier_itineraries = [];
    $('#planner-advice-list').html('');//Initialize the advice lists again? por que
    $('.progress.progress-striped.active').remove(); //Remove progress bar
    if (!itineraryDataIsValid(data)){ //Check validity of API call.
        $('#planner-advice-container').prepend('<div class="row alert alert-danger" role="alert">'+Locale.noAdviceFound+'</div>');
        return; //cancel
    }
    $('#planner-advice-container').find('.alert').remove(); //Remove existing alert calls since our request has not been cancelled
    
    /****************TESTING*************************************
      *************************************************************/
      var journeys =  JSON.parse(JSON.stringify(data.plan.itineraries));
      var count=0;
      for (var key in journeys){ //For each itinerary, check if better transfer options are possible
          data.plan.itineraries[parseInt(key)+count].runnerField = false;
          var newItin = addBetterItin(journeys[key],0);
          if(newItin!="none"){ //Better itinerary found
            newItin.runnerField = true;
            data.plan.itineraries.splice(parseInt(key)+count, 0, newItin); //Insert new traveladvice
            count++;
          }
      }
      /*************************************************************
      *************************************************************/
    var startDate = null; //Iintialize startdate
    //Below, give option to get early or late advice


    $('#planner-advice-list').append('<button type="button" class="btn btn-primary" id="planner-advice-earlier" data-loading-text="'+Locale.loading+'" onclick="earlierAdvice()">'+Locale.earlier+'</button>');

    $.each( data.plan.itineraries , function( index, itin ){ //Iterate over itineraries to append dattime info
        var prettyStartDate = prettyDateEpoch(itin.startTime);
        if (startDate != prettyStartDate){
            $('#planner-advice-list').append('<div class="planner-advice-dateheader">'+prettyStartDate+'</div>');
            startDate = prettyStartDate;
        }
        $('#planner-advice-list').append(itinButton(itin,'l'));
    });
    //Option for late advice
    $('#planner-advice-list').append('<button type="button" class="btn btn-primary" id="planner-advice-later" data-loading-text="'+Locale.loading+'" onclick="laterAdvice()">'+Locale.later+'</button>');
    $('#planner-advice-list').find('.planner-advice-itinbutton').first().click();
    $('#planner-options-submit').button('reset');
    //earlierAdvice(); //Set function so they can be called on click
    //laterAdvice(); //^
  });
}

function addBetterItin(itinArray,success){
  if(itinArray.transfers>0){ //Only check itineraries with a transfer
    flag=0;
    var oldEndTime = itinArray.endTime  //Try to beat this arrival time
    var endDestination = itinArray.legs[itinArray.legs.length -1].to.lat+","+itinArray.legs[itinArray.legs.length -1].to.lon; //This is where we will be going eventually

    previousLeg = itinArray.legs[0];//Initialize for first if statement; not really relevant

    for (var idx in itinArray.legs){ 
      leg=itinArray.legs[idx];
      
      if(leg.transitLeg == true && idx>1 && previousLeg.mode=="WALK" && !flag){ //Ignore first transit and find first transfer with a walk beforehand
        console.log("Searching new route from:");
        console.log(leg.from.name + "<--->" +endDestination); //Debugging - See transfer transit suggested

        var plannerreq = {}; //Prepare new API request
        plannerreq.fromLatLng = leg.from.lat+","+leg.from.lon; //From current transfer location
        plannerreq.toLatLng =  endDestination; //To final destination

        var arriveTransfer; //Get earliest arrival time at destination

        if(previousLeg.transitLeg==false){
          arriveTransfer = previousLeg.from.departure; //If previous leg was walking, then take arrival time at transfer from previous transit
        }
        else{
          arriveTransfer = previousLeg.to.arrival; //Else, we must take the arrival time of the previous transit
        }

        plannerreq.time = epochtoIS08601time(arriveTransfer-5*60*1000); //Take 5 minutes from arrival time on transfer
        plannerreq.date = getDate(); //Get date
        plannerreq.arriveBy = false; //Not necessary

        var APIurl = planningserver + jQuery.param(requestGenerator(plannerreq)); //Find way to remember urls maybe?

        $.ajax({
         async: false,
         type: 'GET',
         url: APIurl,
         success: function(data2) {
        
          for (var index in data2.plan.itineraries){ //Get API call

            itin2 = data2.plan.itineraries[index];

            var startTimeNewItin = itin2.legs[0].startTime;
            var previousWalkTime = previousLeg.duration;
            var newEndTime = itin2.legs[itin2.legs.length-1].endTime;
            var newWalkTimeLimit = previousWalkTime/walkSpeed;

            if(startTimeNewItin > (arriveTransfer + newWalkTimeLimit)  && newEndTime < oldEndTime){ //Display for now only if startTime is possible when ignoring walking times and endTime is faster
                console.log("succes!")
                var newJourneyLength = parseInt(idx)+ parseInt(itin2.legs.length); //New number of legs in journey
                itinArray.legs.length = newJourneyLength;  // Reduce or increase this journeys legs
                itinArray.transfers--;
                for (i = idx; i < newJourneyLength; i++) {
                  itinArray.legs[i] = itin2.legs[i-idx]; // Fill new steps from transfer on
                  if(itinArray.legs[i].mode != "WALK"){
                    itinArray.transfers++;
                  }
                }
                previousLeg.shortWalkTime = 1-(startTimeNewItin-arriveTransfer)/(1000*previousWalkTime); //Percentage of time we have to walk faster
                if(previousLeg.shortWalkTime<0){
                    previousLeg.shortWalkTime=0.5;
                }
                previousLeg.usualWalkTime =  previousWalkTime;
                previousLeg.newWalkTime = (startTimeNewItin - arriveTransfer)/1000;
                itinArray.endTime = newEndTime; //New endtime
                oldEndTime = newEndTime;
                flag=1;
              }
            }
          }
        });
      }
      previousLeg = leg; //Remember last leg
    }
    if(flag){ //If found a better journey, continue to opimize!
      return addBetterItin(itinArray,1); //Tell the recursive method that at least one success has been found
    }else{ //Base case
        if(success){
            return itinArray; //No better route found
        }
        else{
            return "none"; //Nothing found
        }
    }
    
  }
  else{
    return "none"; //No transfers to optimize
  }
}

//Extract info from API call and put into plannerreq variable. This will be called on by other methods to get info
function makePlanRequest(){
  var plannerreq = {};
  plannerreq.fromPlace = $('#planner-options-from').val();
  plannerreq.fromLatLng = $('#planner-options-from-latlng').val();
  plannerreq.toPlace = $('#planner-options-dest').val();
  plannerreq.toLatLng = $('#planner-options-dest-latlng').val();
  plannerreq.time = getTime();
  plannerreq.date = getDate();
  plannerreq.arriveBy = false;
  //plannerreq.mode = checkedModeId(); //Omitted for now
  return plannerreq;
}

// Submit our call. This will initiate all necessary methods.
function submit(){
  $('#planner-options-submit').button('loading'); //load button
  hideForm(); //hide the form... 
  $('#planner-options-desc').html(''); //initialize options
  var plannerreq = makePlanRequest(); //get the request info from the form
  var summary = $('<h4></h4>'); //Set iterinary request summary to display to user while waiting for API to execute
  summary.append('<b>'+Locale.from+'</b> '+plannerreq.fromPlace+'</br>');
  summary.append('<b>'+Locale.to+'</b> '+plannerreq.toPlace);
  $('#planner-options-desc').append(summary); 
  $('#planner-options-desc').append('<h5>'+getPrettyDate() +', '+getTime()+'</h5>'); //Add datetime info to load screen
  if (parent && Modernizr.history){ // Need parent node and ability to remember inputs
    parent.location.hash = jQuery.param(plannerreq);
    history.pushState(plannerreq, document.title, window.location.href);//Remember the user input in case he goes back to the form.
    planItinerary(plannerreq);//Go to the itinerary planner to make API call.
  }
}

// In case user returns to previously filled form, restore his old inputs.
function restoreFromHash(){
    var plannerreq = jQuery.unparam(window.location.hash);
    if ('time' in plannerreq){
      setTime(plannerreq['time']);
    }
    if ('date' in plannerreq){
      setDate(plannerreq['date']);
    }
    if ('mode' in plannerreq){
      setMode(plannerreq['mode']);
    }
    if ('fromPlace' in plannerreq){
        $('#planner-options-from').val(plannerreq['fromPlace']);
    }
    if ('fromLatLng' in plannerreq){
        $('#planner-options-from-latlng').val(plannerreq['fromLatLng']);
    }
    if ('toPlace' in plannerreq){
        $('#planner-options-dest').val(plannerreq['toPlace']);
    }
    if ('toLatLng' in plannerreq){
        $('#planner-options-dest-latlng').val(plannerreq['toLatLng']);
    }
    if ('arriveBy' in plannerreq && plannerreq['arriveBy'] == "true"){
        $('#planner-options-arrivebefore').click();
    }else{
        $('#planner-options-departureafter').click();
    }
    if (validate()){submit();}
}

// Check if form input is valid before actually submitting user input to process
function setupSubmit(){
    $(document).on('submit','.validateDontSubmit',function (e) {
        //prevent the form from doing a submit
        e.preventDefault();
        return false;
    });
    //On click of submit button, initiate validity check
    $('#planner-options-submit').click(function(e){
       var $theForm = $(this).closest('form');
       //Check if form valid
       if (( typeof($theForm[0].checkValidity) == "function" ) && !$theForm[0].checkValidity()) {
           return;
       }
       if (validate()){submit();} //If valid; submit for API call!
    });
}

// Set time based on iso8601
function setTime(iso8601){
    if(Modernizr.inputtypes.time){
        $('#planner-options-time').val(iso8601.slice(0,5));
    }else{
        var val = iso8601.split(':');
        var secs = parseInt(val[0],10)*60*60+parseInt(val[1],10)*60;
        var hours = String(Math.floor(secs / (60 * 60)) % 24);
        var divisor_for_minutes = secs % (60 * 60);
        var minutes = String(Math.floor(divisor_for_minutes / 60));
        var time = hours.lpad('0',2)+':'+minutes.lpad('0',2);
        $('#planner-options-time').val(time);
    }
}

// More date time stuff
function setupDatetime(){
    if(Modernizr.inputtypes.time){
        $('#planner-options-timeformat').hide();
        $('#planner-options-timeformat').attr('aria-hidden',true);
    }
    setTime(String(currentTime.getHours()).lpad('0',2)+':'+String(currentTime.getMinutes()).lpad('0',2));
    function pad(n) { return n < 10 ? '0' + n : n; }
    var date = currentTime.getFullYear() + '-' + pad(currentTime.getMonth() + 1) + '-' + pad(currentTime.getDate());
    setDate(date);
    $("#planner-options-date").datepicker( {
       dateFormat: Locale.dateFormat,
       dayNames: Locale.days,
       dayNamesMin : Locale.daysMin,
       monthNames: Locale.months,
       defaultDate: 0,
       hideIfNoPrevNext: true,
       minDate: whitelabel_minDate,
       maxDate: whitelabel_maxDate
    });

    /* Read aloud the selected dates */
    $(document).on("mouseenter", ".ui-state-default", function() {
        var text = $(this).text()+" "+$(".ui-datepicker-month",$(this).parents()).text()+" "+$(".ui-datepicker-year",$(this).parents()).text();
        $("#planner-options-date-messages").text(text);
    });

    if(Modernizr.inputtypes.date){
        $('#planner-options-dateformat').hide();
        $('#planner-options-dateformat').attr('aria-hidden',true);
    }
}

//Set date based on iso8601
function setDate(iso8601){
    parts = iso8601.split('-');
    var d = new Date(parts[0],parseInt(parts[1],10)-1,parts[2]);
    $('#planner-options-date').val(String(d.getDate()).lpad('0',2)+'-'+String((d.getMonth()+1)).lpad('0',2)+'-'+String(d.getFullYear()));
}

//Get date from form inputs
function getDate(){
    var elements = $('#planner-options-date').val().split('-');
    var month = null;
    var day = null;
    var year = String(currentTime.getFullYear());
    if (elements.length == 3){
      if (elements[2].length == 2){
        year = year.slice(0,2) + elements[2];
      }else if (elements[2].length == 4){
        year = elements[2];
      }
      if (parseInt(year,10) < 2013){ //What is going on here
        return null;
      }
    }
    if (parseInt(elements[1],10) >= 1 && parseInt(elements[1],10) <= 12){
      month = elements[1];
    }else{
      return null;
    }
    if (parseInt(elements[1],10) >= 1 && parseInt(elements[1],10) <= 31){
      day = elements[0];
    }else{
      return null;
    }
    setDate(year+'-'+month+'-'+day);
    return year+'-'+month+'-'+day;
}

//Get time from form inputs
function getTime(){
    if(Modernizr.inputtypes.time){
        return $('#planner-options-time').val();
    } else {
        var val = $('#planner-options-time').val().split(':');
        var hours;
        var time;
        if (val.length === 1 && val[0].length <= 2 && !isNaN(parseInt(val[0],10))){
            hours = val[0];
            time = hours.lpad('0',2)+':00';
            $('#planner-options-time').val(time);
            return time;
        }else if (val.length == 2 && !isNaN(parseInt(val[0],10)) && !isNaN(parseInt(val[1],10))){
            var secs = parseInt(val[0],10)*60*60+parseInt(val[1],10)*60;
            hours = String(Math.floor(secs / (60 * 60)) % 24);
            var divisor_for_minutes = secs % (60 * 60);
            var minutes = String(Math.floor(divisor_for_minutes / 60));
            time = hours.lpad('0',2)+':'+minutes.lpad('0',2);
            $('#planner-options-time').val(time);
            return time;
        }
        return null;
    }
}

//Method to autocomplete when user begins to type in form.

function setupAutoComplete(){
    $( "#planner-options-from" ).autocomplete({
        autoFocus: true,
        minLength: 3,
        //appendTo: "#planner-options-from-autocompletecontainer",
        messages : Locale.autocompleteMessages,
        source: Geocoder.geocoder,
        search: function( event, ui ) {
            $( "#planner-options-from-latlng" ).val( "" );
        },
        focus: function( event, ui ) {
            //$( "#planner-options-from" ).val( ui.item.label );
            //$( "#planner-options-from-latlng" ).val( ui.item.latlng );
            return false;
        },
        select: function( event, ui ) {
            $( "#planner-options-from" ).val( ui.item.label );
            $( "#planner-options-from-latlng" ).val( ui.item.latlng );
            return false;
        },
        response: function( event, ui ) {
           if ( ui.content.length === 1 &&
                ui.content[0].label.toLowerCase().indexOf( $( "#planner-options-from" ).val().toLowerCase() ) === 0 ) {
              $( "#planner-options-from" ).val( ui.content[0].label );
              $( "#planner-options-from-latlng" ).val( ui.content[0].latlng );
           }
        }
    }).data("ui-autocomplete")._renderItem = function (ul, item) {
    return $('<li class="ui-menu-item-with-icon"></li>')
        .data("item.autocomplete", item)
        .append('<a><i class="fa fa-' + item.type + '" aria-hidden="true"></i>&nbsp;' + item.label + '</a>')
        .appendTo(ul);
    };

    $( "#planner-options-via" ).autocomplete({
        autoFocus: true,
        minLength: 3,
        //appendTo: "#planner-options-via-autocompletecontainer",
        messages : Locale.autocompleteMessages,
        source: Geocoder.geocoder,
        search: function( event, ui ) {
            $( "#planner-options-from-latlng" ).val( "" );
        },
        focus: function( event, ui ) {
            //$( "#planner-options-via" ).val( ui.item.label );
            //$( "#planner-options-via-latlng" ).val( ui.item.latlng );
            return false;
        },
        select: function( event, ui ) {
            $( "#planner-options-via" ).val( ui.item.label );
            $( "#planner-options-via-latlng" ).val( ui.item.latlng );
            return false;
        },
        response: function( event, ui ) {
           if ( ui.content.length === 1 &&
                ui.content[0].label.toLowerCase().indexOf( $( "#planner-options-via" ).val().toLowerCase() ) === 0 ) {
              $( "#planner-options-via" ).val( ui.content[0].label );
              $( "#planner-options-via-latlng" ).val( ui.content[0].latlng );
           }
        }
    }).data("ui-autocomplete")._renderItem = function (ul, item) {
    return $('<li class="ui-menu-item-with-icon"></li>')
        .data("item.autocomplete", item)
        .append('<a><i class="fa fa-' + item.type + '" aria-hidden="true"></i>&nbsp;' + item.label + '</a>')
        .appendTo(ul);
    };

    $( "#planner-options-dest" ).autocomplete({
        autoFocus: true,
        minLength: 3,
        //appendTo: "#planner-options-dest-autocompletecontainer",
        messages : Locale.autocompleteMessages,
        source: Geocoder.geocoder,
        search: function( event, ui ) {
            $( "#planner-options-dest-latlng" ).val( "" );
        },
        focus: function( event, ui ) {
            //$( "#planner-options-dest" ).val( ui.item.label );
            //$( "#planner-options-dest-latlng" ).val( ui.item.latlng );
            return false;
        },
        select: function( event, ui ) {
            $( "#planner-options-dest" ).val( ui.item.label );
            $( "#planner-options-dest-latlng" ).val( ui.item.latlng );
            return false;
        },
        response: function( event, ui ) {
           if ( ui.content.length === 1 &&
                ui.content[0].label.toLowerCase().indexOf( $( "#planner-options-dest" ).val().toLowerCase() ) === 0 ) {
              $( "#planner-options-dest" ).val( ui.content[0].label );
              $( "#planner-options-dest-latlng" ).val( ui.content[0].latlng );
           }
        }
    }).data("ui-autocomplete")._renderItem = function (ul, item) {
    return $('<li class="ui-menu-item-with-icon"></li>')
        .data("item.autocomplete", item)
        .append('<a><i class="fa fa-' + item.type + '" aria-hidden="true"></i>&nbsp;' + item.label + '</a>')
        .appendTo(ul);
    };

}


//Change language 
function switchLocale() {
  // var _locale = $.extend({}, Locale);
  Locale = Locale[config['locale']] || Locale['en'];
  $(".label-from").text(Locale.from);
  $(".label-via").text(Locale.via);
  $(".label-dest").text(Locale.to);
  $(".label-time").text(Locale.time);
  $(".label-date").text(Locale.date);
  $(".label-edit").text(Locale.edit);
  $(".label-plan").text(Locale.plan);

  $(".planner-options-timeformat").text(Locale.timeFormat);

  $("#planner-options-date").datepicker('option', {
      dateFormat: Locale.dateFormat, /* Also need this on init */
      dayNames: Locale.days,
      dayNamesMin : Locale.daysMin,
      monthNames: Locale.months
  });

  $("#planner-options-date").attr('aria-label', Locale.dateAriaLabel);
  $("#planner-options-from").attr('placeholder', Locale.geocoderInput).attr('title', Locale.from);
  $("#planner-options-via").attr('placeholder', Locale.geocoderInput).attr('title', Locale.via);
  $("#planner-options-dest").attr('placeholder', Locale.geocoderInput).attr('title', Locale.to);
  $("#planner-options-submit").attr('data-loading-text', Locale.loading);
}


/**
 * DEBUG STUFF
 * TODO: Make sure these bindings and functions are set through the config aka: DEBUG:true || false;
 * 
 */

var DEBUG = {};
DEBUG['mrri_test_object'] = function () {
  alert(JSON.stringify(defaultRequestGenerators['mmri-tester'](makePlanRequest()), undefined, 4));
};

$(document).on("keypress", function(e) {
  if ( e.altKey && e.which === 181 ) {    /* alt-M */
    DEBUG['mrri_test_object']();
  }
});