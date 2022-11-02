let defaultConfigSettings = {
    //basePath: 'https://mypurecloud.github.io/purecloud-premium-app/premium-app-sample/',
    basePath: 'https://localhost:8080/tethrit-now/',    
    'apiURL':'http://localhost/tethr_lite_video_streaming_platform_004475/WS/',
    'apiKey':'182eee79984415dc3f47510713b84c4c',
    'iframeURL':'http://localhost/tethr_lite_video_streaming_platform_004475/'
}

if(window.location.host == 'localhost:8080'){
    defaultConfigSettings.basePath = 'https://localhost:8080/tethrit-now/';
    defaultConfigSettings.apiURL = 'http://localhost/tethr_lite_video_streaming_platform_004475/WS/';
    defaultConfigSettings.apiKey = '182eee79984415dc3f47510713b84c4c';
    defaultConfigSettings.iframeURL = 'http://localhost/tethr_lite_video_streaming_platform_004475/';
}else if(window.location.host == 'tethrlite.projectspreview.net:8080'){
    defaultConfigSettings.basePath = 'https://tethrlite.projectspreview.net:8080/tethrit-now/';
    defaultConfigSettings.apiURL = 'https://tethrlite.projectspreview.net/WS/';
    defaultConfigSettings.apiKey = '182eee79984415dc3f47510713b84c4c';
    defaultConfigSettings.iframeURL = 'https://tethrlite.projectspreview.net/';
}else if(window.location.host == 'tethrlitenow.projectspreview.net:8080'){
    defaultConfigSettings.basePath = 'https://tethrlitenow.projectspreview.net:8080/tethrit-now/';
    defaultConfigSettings.apiURL = 'https://tethrlitenow.projectspreview.net/WS/';
    defaultConfigSettings.apiKey = '182eee79984415dc3f47510713b84c4c';
    defaultConfigSettings.iframeURL = 'https://tethrlitenow.projectspreview.net/';
}else if(window.location.host == 'stagingnow.tethrit.com:8080'){
    defaultConfigSettings.basePath = 'https://stagingnow.tethrit.com:8080/tethrit-now/';
    defaultConfigSettings.apiURL = 'https://stagingnow.tethrit.com/WS/';
    defaultConfigSettings.apiKey = '182eee79984415dc3f47510713b84c4c';
    defaultConfigSettings.iframeURL = 'https://stagingnow.tethrit.com/';
}else{
    defaultConfigSettings.basePath = 'https://genesys.tethrit.com/tethrit-now/';
    defaultConfigSettings.apiURL = 'https://now.tethrit.com/WS/';
    defaultConfigSettings.apiKey = '182eee79984415dc3f47510713b84c4c';
    defaultConfigSettings.iframeURL = 'https://now.tethrit.com/';
}

export default defaultConfigSettings;