export default {
    clientIDs: {
        'mypurecloud.com': 'c9ce12a2-0deb-4358-9bc8-055580b212b4'
    },
    "redirectUriBase": "https://crespino4.github.io/",
    //"redirectUriBase": "https://localhost/",

    // PureCloud assigned name for the premium app
    // This should match the integration type name of the Premium App
    "appName": "CatchTheBalls",

    // Default Values for fail-safe/testing. Shouldn't have to be changed since the app
    // must be able to determine the environment from the query parameter
    // of the integration's URL
    "defaultPcEnv": "mypurecloud.com",
    "defaultLangTag": "en-us",
};