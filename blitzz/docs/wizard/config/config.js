export default {
    clientID: '1da5ad3b-5250-49c9-97c5-6cddea1e48be',

    wizardUriBase: 'https://crespino4.github.io/blitzz/docs/wizard/',
    //JC4 wizardUriBase: 'https://install-genesys.blitzz.co/',
    // wizardUriBase: 'https://mypurecloud.github.io/purecloud-premium-app/wizard/',

    // The actual URL of the landing page of your web app or your web site (when wizard has been run).
    // previously - defined as premiumAppURL
    redirectURLOnWizardCompleted: 'https://genesys-ga.blitzz.co',
    // redirectURLOnWizardCompleted: 'https://mypurecloud.github.io/purecloud-premium-app/premium-app-sample/index.html',
    redirectURLWithParams: true,

    // Genesys Cloud assigned name for the premium app
    // This should match the integration type name of the Premium App
    // NOTE: During initial development please use ‘premium-app-blitzz’.
    //            Once your premium app is approved an integration type will be created
    //            by the Genesys Cloud product team and you can update the name at that time.
    // previously - defined as appName
    premiumAppIntegrationTypeId: 'premium-app-example',
    // JC4 premiumAppIntegrationTypeId: 'premium-app-blitzz',

    // Optional - Some Premium Applications leverage both a premium app and a premium widget
    premiumWidgetIntegrationTypeId: 'embedded-client-app-interaction-widget',
    // JC4 premiumWidgetIntegrationTypeId: 'premium-widget-blitzz',

    // The minimum permission required for a user to access the Premium App.
    // NOTE: During initial development please use the default permission 
    //      'integration:examplePremiumApp:view'. Once your premium app is approved,
    //      the unique integration domain will be generated and this must be updated.
    // previously - defined as viewPermission
    premiumAppViewPermission: 'integration:examplePremiumApp:view',
    // JC4 premiumAppViewPermission: 'integration:blitzz:view',
    // Permissions required for running the Wizard App
    // all, premium, wizard, none (default)
    checkInstallPermissions: 'none',
    checkProductBYOC: false,

    // Default Values for fail-safe/testing. Shouldn't have to be changed since the app
    // must be able to determine the environment from the query parameter 
    // of the integration's URL
    defaultPcEnvironment: 'usw2.pure.cloud',
    defaultLanguage: 'en-us',
    // List available language assets - manage pcLangTag with possible formats like: en, en-US, en_US, en-CA, en_CA, ...
    // Values in lower case, using - or no separator
    availableLanguageAssets: {
        'en-us': 'English',
        'es': 'Español'
    },
    enableLanguageSelection: true,

    // The names of the query parameters to check in 
    // determining language and environment
    // Ex: www.electric-sheep-app.com?langTag=en-us&environment=mypurecloud.com
    languageQueryParam: 'langTag',
    genesysCloudEnvironmentQueryParam: 'environment',

    // Enable the optional 'Step 2' in the provisoning process
    // If false, it will not show the page or the step in the wizard
    enableCustomSetupPageBeforeInstall: false,
    // Enable the optional Post Custom Setup module in the install process
    // If true, it will invoke the postCustomSetup module (configure method) after the Genesys Cloud ones (provisioningInfo).
    enableCustomSetupStepAfterInstall: false,

    // Enable the dynamic build of the Install Summary on install.html page
    enableDynamicInstallSummary: true,

    // Displays Text Area for Simplified Installed Data (Summary)
    displaySummarySimplifiedData: true,

    // Allows you to deprovision the installed object by adding the query parameter 'uninstall=true'
    // in the wizard URL. This is merely for testing and should be 'false' in production.
    enableUninstall: true,

    // To be added to names of Genesys Cloud objects created by the wizard
    prefix: 'Blitzz ',

    // These are the Genesys Cloud items that will be added and provisioned by the wizard
    // To see the sample configuration of all possible objects please consult
    // ./sample-provisioning-info.js on the same folder
    provisioningInfo: {
        'role': 
        [{
            'name': 'Agent',
            'description': 'Agents have access to a widget that gives US state information based on caller\'s number.',
            'permissionPolicies': [ {
                'domain': 'integration',
                'entityName': 'blitzz',
                'actionSet': ['*'],
                'allowConditions': false
            }],
            'assignToSelf': true
        }],
        'group': [
            {
                'name': 'Agents',
                'description': '',
                'assignToSelf': true
            }
        ],
        'app-instance': [
            {
                'name': 'Visual Remote Assistant (Standalone)',
                'url': 'https://genesys-ga.blitzz.co/auth?conversationId={{pcConversationId}}&environment={{pcEnvironment}}&langTag={{pcLangTag}}',
                'type': 'standalone',
                'sandbox': 'allow-forms,allow-modals,allow-popups,allow-presentation,allow-same-origin,allow-scripts,allow-downloads',
                'permissions': 'camera,microphone,geolocation,clipboard-write,display-capture,fullscreen',
                'groups': ['Agents'],
                'advanced': {
                   'lifecycle': {},
                    "icon": {
                      "vector": "https://3487281.fs1.hubspotusercontent-na1.net/hubfs/3487281/Blitzz%20Owl%20Logo%20Square%20272x272.png"
                    }      
                }
            }
        ],
        'interaction-widget': [
            {
                'name': 'Visual Remote Assistant (Widget)',
                'url': 'https://genesys-ga.blitzz.co/auth?conversationId={{pcConversationId}}&environment={{pcEnvironment}}&langTag={{pcLangTag}}',
                'sandbox': 'allow-forms,allow-modals,allow-popups,allow-presentation,allow-same-origin,allow-scripts,allow-downloads',
                'permissions': 'camera,microphone,geolocation,clipboard-write,display-capture,fullscreen',
                'groups': ['Agents'],
                'communicationTypeFilter': 'chat, call',
                'advanced': {
                    'lifecycle': {},
                    "icon": {
                        "vector": "https://3487281.fs1.hubspotusercontent-na1.net/hubfs/3487281/Blitzz%20Owl%20Logo%20Square%20272x272.png"
                    }
                }
            }
        ],
        // 'widget-instance': [
        //     {
        //         'name': 'Premium Widget',
        //         'url': 'https://genesys-ga.blitzz.co/auth?conversationId={{pcConversationId}}',
        //         'sandbox': 'allow-forms,allow-modals,allow-popups,allow-presentation,allow-same-origin,allow-scripts,allow-downloads',
        //         'permissions': 'camera,microphone,geolocation,clipboard-write,display-capture,fullscreen',
        //         'groups': ['Agents'],
        //         'communicationTypeFilter': 'chat, call, email',
        //         'advanced': {
        //             'lifecycle': {},
        //             "icon": {
        //                 "vector": "https://3487281.fs1.hubspotusercontent-na1.net/hubfs/3487281/Blitzz%20Owl%20Logo%20Square%20272x272.png"
        //             }
        //         }
        //     }
        // ],
        'oauth-client': [
            {
                'name': 'OAuth Client',
                'description': 'Generated Client that\'s passed to the App Backend',
                'roles': ['Agent'],
                'authorizedGrantType': 'CLIENT-CREDENTIALS',
                /** NOTE: 
                 * If you want to learn how you can send the created credentials back to your system,
                 * Please read about the Post Custom Setup module here:
                 * https://developer.genesys.cloud/appfoundry/premium-app-wizard/7-custom-setup#post-custom-setup-module
                 */
            }
        ]
    },

    // These are the necessary permissions that the user running the wizard must have to install or uninstall
    // Add your permissions to one of the modules, to post custom setup, or custom
    installPermissions: {
        'custom': [],
        'wizard': ['integrations:integration:view', 'integrations:integration:edit'],
        'postCustomSetup': [],
        'role': ['authorization:role:view', 'authorization:role:add', 'authorization:grant:add'],
        'group': ['directory:group:add'],
        'app-instance': ['integrations:integration:view', 'integrations:integration:add', 'integrations:integration:edit'],
        'widget-instance': ['integrations:integration:view', 'integrations:integration:add', 'integrations:integration:edit'],
        'interaction-widget': ['integrations:integration:view', 'integrations:integration:add', 'integrations:integration:edit'],
        'oauth-client': ['authorization:role:view', 'oauth:client:view', 'oauth:client:add', 'oauth:client:edit'],
        'widget-deployment': ['widgets:deployment:view', 'widgets:deployment:add', 'widgets:deployment:edit'],
        'open-messaging': ['messaging:integration:view', 'messaging:integration:add', 'messaging:integration:edit'],
        'ws-data-actions': ['integrations:integration:view', 'integrations:integration:add', 'integrations:integration:edit', 'integrations:action:add', 'integrations:action:edit'],
        'gc-data-actions': ['integrations:integration:view', 'integrations:integration:add', 'integrations:integration:edit', 'integrations:action:add', 'integrations:action:edit'],
        'data-table': ['architect:datatable:view', 'architect:datatable:add'],
        'byoc-cloud-trunk': ['telephony:plugin:all'],
        'audiohook': ['integrations:integration:view', 'integrations:integration:add', 'integrations:integration:edit'],
        'event-bridge': ['integrations:integration:view', 'integrations:integration:add', 'integrations:integration:edit']
    },
    uninstallPermissions: {
        'custom': [],
        'wizard': [],
        'postCustomSetup': [],
        'role': ['authorization:role:delete'],
        'group': ['directory:group:delete'],
        'app-instance': ['integrations:integration:delete'],
        'widget-instance': ['integrations:integration:delete'],
        'interaction-widget': ['integrations:integration:delete'],
        'oauth-client': ['oauth:client:edit', 'oauth:client:delete'],
        'widget-deployment': ['widgets:deployment:delete'],
        'open-messaging': ['messaging:integration:delete'],
        'ws-data-actions': ['integrations:integration:delete'],
        'gc-data-actions': ['integrations:integration:delete'],
        'data-table': ['architect:datatable:delete'],
        'byoc-cloud-trunk': ['telephony:plugin:all'],
        'audiohook': ['integrations:integration:delete'],
        'event-bridge': ['integrations:integration:delete']
    },

    // These are the necessary scopes that the Vendor Wizard's OAuth Client (defined in Vendor's org) must have to allow the wizard to install or uninstall
    // This is for information only, to make it easier to find what the Vendor Wizard's OAuth Client (Implicit Grant type, Authorization Code Grant type) needs to be set with 
    installScopes: {
        'custom': [],
        'wizard': ['user-basic-info', 'integrations'],
        'postCustomSetup': [],
        'role': ['authorization'],
        'group': ['groups'],
        'app-instance': ['integrations'],
        'widget-instance': ['integrations'],
        'interaction-widget': ['integrations'],
        'oauth-client': ['authorization:readonly', 'user-basic-info', 'oauth'],
        'widget-deployment': ['widgets'],
        'open-messaging': ['messaging'],
        'ws-data-actions': ['integrations'],
        'gc-data-actions': ['integrations'],
        'data-table': ['architect'],
        'byoc-cloud-trunk': ['telephony', 'organization:readonly'],
        'audiohook': ['integrations'],
        'event-bridge': ['integrations']
    },
    uninstallScopes: {
        'custom': [],
        'wizard': [],
        'postCustomSetup': [],
        'role': ['authorization'],
        'group': ['groups'],
        'app-instance': ['integrations'],
        'widget-instance': ['integrations'],
        'interaction-widget': ['integrations'],
        'oauth-client': ['oauth'],
        'widget-deployment': ['widgets'],
        'open-messaging': ['messaging'],
        'ws-data-actions': ['integrations'],
        'gc-data-actions': ['integrations'],
        'data-table': ['architect'],
        'byoc-cloud-trunk': ['telephony'],
        'audiohook': ['integrations'],
        'event-bridge': ['integrations']
    },
}
