let defaultConfigSettings = {
    
    clientIDs: {        
        //'mypurecloud.com': 'bda3d1f2-eb18-4804-9ec9-5673e2a4b5f4'
        'mypurecloud.com': 'e7de8a75-62bb-43eb-9063-38509f8c21af'


        // 'mypurecloud.ie': '939ab4dd-109f-4120-ba9f-051b973b9ecc',
        // 'mypurecloud.de': 'aa8efb84-a77f-4c43-8b37-ac0566d9f73e',
        // 'mypurecloud.com.au': 'c8a4d721-3fbb-4f50-b3e0-aa49bf86ac87',
        // 'mypurecloud.jp': '28dbeebd-8128-4fe0-8f42-f2eebb767a71',
        // 'usw2.pure.cloud': '2075921c-a285-4523-91df-7984f1268677'
    },

    //clientID: 'bda3d1f2-eb18-4804-9ec9-5673e2a4b5f4',
    clientID: 'e7de8a75-62bb-43eb-9063-38509f8c21af',

    'apiURL':'http://localhost/tethr_lite_video_streaming_platform_004475/WS/',
    'apiKey':'182eee79984415dc3f47510713b84c4c',
    
    'wizardUriBase': 'https://tethrlite.projectspreview.net:8080/wizard/',
    //'wizardUriBase': 'https://localhost:8080/wizard/',    
    // 'wizardUriBase': 'https://mypurecloud.github.io/purecloud-premium-app/wizard/',

    // The actual URL of the landing page of your web app.
    'premiumAppURL': 'https://tethrlite.projectspreview.net:8080/premium-app-sample/index.html',
    //'premiumAppURL': 'https://localhost:8080/premium-app-sample/index.html',    
    // 'premiumAppURL': 'https://mypurecloud.github.io/purecloud-premium-app/premium-app-sample/index.html',

    // PureCloud assigned name for the premium app
    // This should match the integration type name of the Premium App
    'appName': 'premium-app-example',
    //check the app id from this URL : https://developer.mypurecloud.com/developer-tools/#/api-explorer

    // Default Values for fail-safe/testing. Shouldn't have to be changed since the app
    // must be able to determine the environment from the query parameter 
    // of the integration's URL
    'defaultPcEnvironment': 'mypurecloud.com',
    'defaultLanguage': 'en-us',

    // The names of the query parameters to check in 
    // determining language and environment
    // Ex: www.electric-sheep-app.com?language=en-us&environment=mypurecloud.com
    'languageQueryParam': 'language',
    'pureCloudEnvironmentQueryParam': 'environment',

    // Permissions required for running the Wizard App
    'setupPermissionsRequired': ['admin'],

    // To be added to names of PureCloud objects created by the wizard
    'prefix': 'TethrIt_Now_',

    // These are the PureCloud items that will be added and provisioned by the wizard
    'provisioningInfo': {
        'role': [
            {
                'name': 'Role',
                'description': 'Generated role for access to the app.',
                'permissionPolicies': [
                    {
                        'domain': 'integration',
                        'entityName': 'tethrItApps',
                        'actionSet': ['*'],
                        'allowConditions': false
                    }
                ]
            }
        ],
        'group': [
            {
                'name': 'TethritNow Users',
                'description': 'Users can access TethritNow',
            }
        ],
        'app-instance': [
        ],
        'interaction-widget': [
            {
                'name': 'TethritNow Interaction Widget',
                'url': 'https://genesys.tethrit.com/wizard/index.html?conversationid={{pcConversationId}}&lang={{pcLangTag}}&environment={{pcEnvironment}}',
                'groups': ['TethritNow Users'],
                'communicationTypeFilter': 'chat, call'
            }
        ],
        'oauth-client': [
            {
                'name': 'OAuth Client',
                'description': 'Generated Client that\'s passed to the App Backend',
                'roles': ['Role'],
                'authorizedGrantType': 'CLIENT_CREDENTIALS',

                /**
                 * This function is for other processing that needs
                 * to be done after creating an object.
                 * 'finally' is available for all the other
                 * resources configured in this config file.
                 * NOTE: Finally functions must return a Promise.
                 * For Client Credentials, normally it means
                 * passing the details to the backend.
                 * @param {Object} installedData the PureCloud resource created
                 * @returns {Promise}    
                 */
                'finally': function (installedData) {
                    return new Promise((resolve, reject) => {
                        console.log('Fake Sending Credentials...');
                        setTimeout(() => resolve(), 2000);
                    });
                }
            }
        ]
    }
};

if(window.location.host == 'localhost:8080'){
    defaultConfigSettings.apiURL = 'http://localhost/tethr_lite_video_streaming_platform_004475/WS/';
    defaultConfigSettings.apiKey = '182eee79984415dc3f47510713b84c4c';
    defaultConfigSettings.wizardUriBase = 'https://localhost:8080/wizard/';
    defaultConfigSettings.premiumAppURL = 'https://localhost:8080/tethrit-now/index.html';
}else if(window.location.host == 'tethrlite.projectspreview.net:8080'){
    defaultConfigSettings.apiURL = 'https://tethrlite.projectspreview.net/WS/';
    defaultConfigSettings.apiKey = '182eee79984415dc3f47510713b84c4c';
    defaultConfigSettings.wizardUriBase = 'https://tethrlite.projectspreview.net:8080/wizard/';
    defaultConfigSettings.premiumAppURL = 'https://tethrlite.projectspreview.net:8080/tethrit-now/index.html';
}else if(window.location.host == 'tethrlitenow.projectspreview.net:8080'){
    defaultConfigSettings.apiURL = 'https://tethrlitenow.projectspreview.net/WS/';
    defaultConfigSettings.apiKey = '182eee79984415dc3f47510713b84c4c';
    defaultConfigSettings.wizardUriBase = 'https://tethrlitenow.projectspreview.net:8080/wizard/';
    defaultConfigSettings.premiumAppURL = 'https://tethrlitenow.projectspreview.net:8080/tethrit-now/index.html';    
}else if(window.location.host == 'stagingnow.tethrit.com:8080'){
    defaultConfigSettings.apiURL = 'https://stagingnow.tethrit.com/WS/';
    defaultConfigSettings.apiKey = '182eee79984415dc3f47510713b84c4c';
    defaultConfigSettings.wizardUriBase = 'https://stagingnow.tethrit.com:8080/wizard/';
    defaultConfigSettings.premiumAppURL = 'https://stagingnow.tethrit.com:8080/tethrit-now/index.html';    
}else{
    defaultConfigSettings.apiURL = 'https://now.tethrit.com/WS/';
    defaultConfigSettings.apiKey = '182eee79984415dc3f47510713b84c4c';
    defaultConfigSettings.wizardUriBase = 'https://genesys.tethrit.com/wizard/';
    defaultConfigSettings.premiumAppURL = 'https://genesys.tethrit.com/tethrit-now/index.html';
}
export default defaultConfigSettings;