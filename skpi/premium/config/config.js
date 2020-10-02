
// https://login.mypurecloud.com/oauth/authorize?client_id=91bd4bb6-3e4f-4ca1-96fe-ace787983bee&response_type=code&redirect_uri=https://portal.successkpis.com/login
// https://login.mypurecloud.com/oauth/authorize?client_id=91bd4bb6-3e4f-4ca1-96fe-ace787983bee&response_type=token&redirect_uri=https://portal.successkpis.com/login

// https://login.mypurecloud.com/oauth/authorize?client_id=91bd4bb6-3e4f-4ca1-96fe-ace787983bee&response_type=token&redirect_uri=http://successkpis.dev.s3-website-us-east-1.amazonaws.com/login

// vendor-f51ca96b2188c143ec09d8b4940f7bc7.js:3 PUT https://login.mypurecloud.com/request 401 (Unauthorized)

// https://localhost/?environment=mypurecloud.com

export default {
    clientIDs: {
        'mypurecloud.com': '91bd4bb6-3e4f-4ca1-96fe-ace787983bee',
        'mypurecloud.ie': '637fe802-abfd-49cd-9951-55633a098669',
        'mypurecloud.com.au': 'c8a4d721-3fbb-4f50-b3e0-aa49bf86ac87',
        'usw2.pure.cloud': '9d020646-9dd0-4e46-ad5d-3d129bb13f4b',
        'mypurecloud.jp': '28dbeebd-8128-4fe0-8f42-f2eebb767a71'
    },
    "redirectUriBase": "https://gcloud.successkpis.com/premium/",

    /* Local host testing */
    // "redirectUriBase": "https://localhost/premium/",

    // PureCloud assigned name for the premium app
    // This should match the integration type name of the Premium App

    // Shouldn't change the following line; since this is used in the OAuth of PureCloud.
    "appName": "premium-app-successkpi",

    // Default Values for fail-safe/testing. Shouldn't have to be changed since the app
    // must be able to determine the environment from the query parameter 
    // of the integration's URL
    "defaultPcEnv": "mypurecloud.com",
    "defaultLangTag": "en-us",

    // Permissions required for running the Wizard App
    "setupPermissionsRequired": ['admin'],

    // To be added to names of PureCloud objects created by the wizard
    "prefix": "SuccessKPI_",

    //successKPI configuration
    "successkpiUri": "https://api.successkpis.com/v4/",
    "apiKey": "BvpqqrtX0o9tgOxqu2b5S5aNepFbFLO3BrF9Dsr0",

    // These are the PureCloud items that will be added and provisioned by the wizard
    "provisioningInfo": {
        "roles": [
            {
                "name": "Role",
                "description": "Generated role for access to the app.",
                "permissionPolicies": [
                    {
                        "domain": "integration",
                        "entityName": "examplePremiumApp",
                        "actionSet": ["*"],
                        "allowConditions": false
                    }
                ]
            }
        ],
        "groups": [
            // {
            //     "name": "Agents",
            //     "description": "Agents have access to a widget that gives US state information based on caller's number.",
            // },
            // {
            //     "name": "Supervisors",
            //     "description": "Supervisors have the ability to watch a queue for ACD conversations.",
            // }
        ],
        "appInstances": [
            // {
            //     "name": "Agent View",
            //     "url": "https://gcloud.successkpis.com/premium/index.html?lang={{pcLangTag}}&environment={{pcEnvironment}}",
            //     "type": "standalone",
            //     "groups": ["Agents"]
            // },
            // {
            //     "name": "Supervisor View",
            //     "url": "https://gcloud.successkpis.com/premium/index.html?lang={{pcLangTag}}&environment={{pcEnvironment}}",
            //     "type": "standalone",
            //     "groups": ["Supervisors"]
            // }
        ],
        "oauth": [
            {
                "name": "OAuth Client",
                "description": "Generated Client that's passed to the App Backend for SuccessKPI",
                "roles": ["Role"],
                "authorizedGrantType": "CLIENT_CREDENTIALS"
                //"authorizedGrantType":"TOKEN_IMPLICIT_GRANT"
                // "authorizedGrantType":"TOKEN_IMPLICIT"
                //"authorizedGrantType":"IMPLICIT_GRANT"
                //"authorizedGrantType":"TOKEN"
            }
        ]
    }
};