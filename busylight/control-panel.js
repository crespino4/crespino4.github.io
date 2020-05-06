(function() {
  var ui = {
    busylight: null,
    green: null,
    red: null,
    alert: null,
    blink: null,
    pulse: null,
    flash: null,
    off: null,
  };

  var connection = -1;
  var busylightSDK;

  var initializeWindow = function() {
    for (var k in ui) {
      var id = k.replace(/([A-Z])/, '-$1').toLowerCase();
      var element = document.getElementById(id);
      if (!element) {
        throw "Missing UI element: " + k;
      }
      ui[k] = element;
    }
    enableIOControls(false);
    ui.busylight.addEventListener('click', onBusyLightClicked);
    ui.green.addEventListener('click', onGreenClicked);
    ui.red.addEventListener('click', onRedClicked);
    ui.alert.addEventListener('click', onAlertClicked);
    ui.blink.addEventListener('click', onBlinkClicked);
    ui.pulse.addEventListener('click', onPulseClicked);
    ui.flash.addEventListener('click', onFlashClicked);
    ui.off.addEventListener('click', onOffClicked);
  };

  var enableIOControls = function(ioEnabled) {
    ui.green.disabled = !ioEnabled;
    ui.red.disabled = !ioEnabled;
    ui.alert.disabled = !ioEnabled;
    ui.blink.disabled = !ioEnabled;
    ui.pulse.disabled = !ioEnabled;
    ui.flash.disabled = !ioEnabled;
    ui.off.disabled = !ioEnabled;
  };

  var onBusyLightClicked = function() {
    busylightSDK = new BusylightSDK(function() {
      busylightSDK.ColorRGB(0,100,0);
      enableIOControls(true);
    } );
  };

  var onGreenClicked = function() {
    busylightSDK.ColorRGB(0,100,0);
  };

  var onRedClicked = function() {
      busylightSDK.Color(BusylightColor_Red);
  };

  var onAlertClicked = function() {
      busylightSDK.Alert(BusylightColor_Red, BusylightSoundclips.KuandoTrain, BusylightVolume.Low);
  };

  var onBlinkClicked = function() {
    busylightSDK.Blink(BusylightColor_Blue,3,5);
  };

  var onPulseClicked = function () {
      busylightSDK.Pulse(BusylightPulseSeqence);
  };

  var onFlashClicked = function () {
      busylightSDK.ColorWithFlash(BusylightColor_Yellow, BusylightColor_Blue);
  };

  var onOffClicked = function() {
    busylightSDK.ColorRGB(0,0,0);
  };


  window.addEventListener('load', initializeWindow);
}());
