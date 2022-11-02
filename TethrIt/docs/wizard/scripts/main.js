import config from '../config/config.js';
import view from './view.js';
import wizard from './wizard.js';

// PureCloud
const platformClient = require('platformClient');
const client = platformClient.ApiClient.instance;
const ClientApp = window.purecloud.apps.ClientApp;

// API 
const usersApi = new platformClient.UsersApi();
const integrationsApi = new platformClient.IntegrationsApi();

// Constants
const appName = config.appName;
        
// Variables
//let pcLanguage = localStorage.getItem(appName + ':language') || config.defaultLanguage;
//let pcEnvironment = localStorage.getItem(appName + ':environment') || config.defaultPcEnvironment;

let pcLanguage = config.defaultLanguage;
let pcEnvironment = config.defaultPcEnvironment;

let clientApp = null;
let userMe = null;


/**
 * Get query parameters for language and purecloud region
 */
function queryParamsConfig(){
    // Get Query Parameters
    const urlParams = new URLSearchParams(window.location.search);
    let tempLanguage = urlParams.get(config.languageQueryParam);
    let tempPcEnv = urlParams.get(config.pureCloudEnvironmentQueryParam); 

    // Override default and storage items with what's on search query
    if(tempLanguage){
        pcLanguage = tempLanguage;
        localStorage.setItem(appName + ':language', pcLanguage);
    }
    if(tempPcEnv){
        pcEnvironment = tempPcEnv;
        localStorage.setItem(appName + ':environment', pcEnvironment);
    }
}

/**
 * Authenticate with PureCloud
 */
function authenticatePureCloud(){
 client.setEnvironment(pcEnvironment);
 console.log("Getting from local storage "+pcEnvironment);
    client.setPersistSettings(true, appName);
    return client.loginImplicitGrant(                
                config.clientID, //config.clientIDs[pcEnvironment], 
                config.wizardUriBase + 'index.html'
            );
}

/**
 * Get user details with its roles
 * @returns {Promise} usersApi result
 */
function getUserDetails(){
    let opts = {'expand': ['authorization']};
    
    return usersApi.getUsersMe(opts);
}

/**
 * Checks if the PureCloud org has the premium app product enabled
 * @returns {Promise}
 */
function validateProductAvailability(){     
    return integrationsApi.getIntegrationsTypes({pageSize: 100})
    .then((data) => {
        if (data.entities.filter((integType) => integType.id === appName)[0]){
            console.log("PRODUCT AVAILABLE");
            return(true);
        } else {
           console.log("PRODUCT NOT AVAILABLE");
            return(false);
        }
    });
}

/**
 * Setup function
 * @returns {Promise}
 */
function setup(){
    view.showLoadingModal('Loading...');
    view.hideContent();

    queryParamsConfig();
    
    // Setup Client App
    clientApp = new ClientApp({
        pcEnvironment: pcEnvironment
    });

    return authenticatePureCloud()
    .then(() => {
        return getUserDetails();
    })
    .then((user) => {
        userMe = user;
        console.log('>>>>>>>>>>',user);
        view.showUserName(user);

        //return setPageLanguage();
    })  
    .then(() => {
        wizard.setup(client, userMe);

        return runPageScript();
    })  
    .then(() => {
        view.hideLoadingModal();
    })
    .catch((e) => console.error(e));    
}

/**
 * Sets and loads the language file based on the pcLanguage global var
 * @returns {Promise}
 */
function setPageLanguage(){
    return new Promise((resolve, reject) => {
        let fileUri = 
            `${config.wizardUriBase}assets/languages/${pcLanguage}.json`;
        $.getJSON(fileUri)
        .done(data => {
            Object.keys(data).forEach((key) => {
                let els = document.querySelectorAll(`.${key}`);
                for(let i = 0; i < els.length; i++){
                    els.item(i).innerText = data[key];
                    console.log(els.item(i));
                }
            })
            resolve();
        })
        .fail(xhr => {
            console.log('Language file not found.');
            resolve();
        }); 
    });
}

/**
 * Runs page specific script.
 * @returns {Promise}
 */
function runPageScript(){
    return new Promise((resolve, reject) => {
        let pathParts = window.location.pathname.split('/');
        let page = pathParts[pathParts.length - 1];

        // Run Page Specific Scripts
        switch(page){
            case 'index.html':
                // Button Handler
                let elNextBtn = document.getElementById('next');
                elNextBtn.addEventListener('click', () => {
                    window.location.href = './custom-setup.html';
                });

                validateProductAvailability()
                .then((isAvailable) => {
                    if(isAvailable){
                        view.showProductAvailable();
                    }else{
                        view.showProductUnavailable();
                    }

                    return wizard.isExisting();
                })
                // Check if has an existing installation
                .then((exists) => {
                    if(exists) {
                       window.location.href = config.premiumAppURL;
                    } else {
                        view.showContent();
                        resolve();
                    }
                });
                break;
            case 'custom-setup.html':
                // Button Handler
                let elSetupBtn = document.getElementById('next');                
                elSetupBtn.addEventListener('click', () => {
                    window.location.href = './install.html';
                });

                var ApiName = 'create_token';                   
                $.ajax({
                    type: "GET",
                    url: config.apiURL+ApiName,
                    crossDomain: true,
                    data: '',
                    dataType: 'json',        
                    beforeSend: function(xhr){
                        // xhr.setRequestHeader('X-Authorization-Api-Key', 'Bearer '+config.apiKey);
                        // xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
                        // xhr.setRequestHeader('Access-Control-Allow-Credentials', 'true');
                        // xhr.setRequestHeader('ssAccess-Control-Allow-Methodssssss', 'GET,HEAD,OPTIONS,POST,PUT');
                        // xhr.setRequestHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers');            
                    },
                    success: function (response) {
                        if(response.settings.success==1){                            
                            var access_token = response.data.ws_token;
                            $.ajax({
                                type: "POST",
                                url: config.apiURL+'get_genesys_expert',
                                crossDomain: true,
                                data: {ws_token:access_token,email:userMe.email},
                                dataType: 'json', 
                                success: function (expertResponse) {                        
                                    $('#err-msg').hide();                                    
                                    if(expertResponse.settings.success === "0"){
                                        $('#err-msg-cont').show();
                                    }else{
                                        $('#err-msg-cont').hide();
                                        $('#user-success-cng').show();
                                        $('#next').show();
                                    }
                                },
                                error: function (err) {                                    
                                    //alert('Something went wrong whle verfifying user.');
                                    $('#err-msg').text("Something went wrong whle verfifying user.");
                                    $('#err-msg').show();
                                }
                            });
                        }else{
                            //alert('unable to get token');                            
                            $('#err-msg').text("Unable to get token.");
                            $('#err-msg').show();
                        }            
                    },
                    error: function (err) {
                        //alert('Something went wrong.');                                                
                        $('#err-msg').text("Something went wrong.");
                        $('#err-msg').show();
                    }
                });
                                

                resolve();
                view.showContent();
                break;
            case 'install.html':
                // Button Handler
                let elStartBtn = document.getElementById('start');
                elStartBtn.addEventListener('click', () => {
                    view.showLoadingModal('Installing..');
                    wizard.install()
                    .then(() => {
                        window.location.href = './finish.html';
                    })
                    .catch(e => console.error(e))
                });

                resolve();
                view.showContent();
                break;
            case 'finish.html':
                view.showContent();
                setTimeout(() => {
                   window.location.href = config.premiumAppURL;
                }, 2000);

                resolve();
                break;
            case 'uninstall.html':
                alert("The uninstall button is for development purposes only. Remove this button before demo.");

                view.showContent();
                view.showLoadingModal('Uninstalling...');

                wizard.uninstall()
                .then(() => {
                    setTimeout(() => {
                        window.location.href = config.wizardUriBase 
                                        + 'index.html';
                    }, 2000);
                });
                resolve();
                break;
            default:
                reject('Unknown page');
                break;
        }
    });
}


setup();