import appConfig from '../../config/config.js';
class SuccessKpiApp {


    regitsrationToSuccessKPI(registerObj) {
        // console.log('clientObj', registerObj)
        var http = new XMLHttpRequest()
        http.open('POST', appConfig.successkpiUri + 'api/genesys/g_premium_registration', true)
        http.setRequestHeader('Content-type', 'application/json');
        http.setRequestHeader('x-api-key', appConfig.apiKey);
        http.onload = function () {
            // Begin accessing JSON data here
            var data = JSON.parse(this.response)

            if (http.status >= 200 && http.status < 400) {
                console.log(data)
            } else {
                console.log('error')
            }
        }

        http.send(registerObj)
    }


    logout() {
        return new Promise((resolve) => {
            console.log(localStorage.getItem("mstrAuthToken"))
            let mstr;
            if (localStorage.getItem("mstrAuthToken") != null && localStorage.getItem("accessToken") != null) {
                var http = new XMLHttpRequest()
                mstr = localStorage.getItem("mstrAuthToken");
                mstr = JSON.parse(mstr);
                let params = {
                    "mstrAuthToken": typeof (mstr) != 'undefined' ? mstr['authToken'] : null,
                    "accessToken": localStorage.getItem("accessToken"),
                    "cookie": typeof (mstr) != 'undefined' ? mstr['cookie'] : null
                }
                http.open('POST', appConfig.successkpiUri + 'api/genesys/g_premium_logout', true)
                http.setRequestHeader('Content-type', 'application/json');
                http.setRequestHeader('x-api-key', appConfig.apiKey);
                http.onload = function () {
                    // Begin accessing JSON data here
                    if (http.status >= 200 && http.status < 400) {
                        localStorage.removeItem('userToken');
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('mstrIdToken');
                        localStorage.removeItem('mstrAuthToken');
                        localStorage.removeItem("language");
                        localStorage.removeItem("_&rp&");
                        localStorage.removeItem("_&gr&");
                        resolve(null)
                    } else {
                        console.log('error');
                        localStorage.removeItem('userToken');
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('mstrIdToken');
                        localStorage.removeItem('mstrAuthToken');
                        localStorage.removeItem("language");
                        localStorage.removeItem("_&rp&");
                        localStorage.removeItem("_&gr&");
                        resolve(null)
                    }
                }
                http.send(JSON.stringify(params))
            }
            else {
                localStorage.removeItem('userToken');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('mstrIdToken');
                localStorage.removeItem('mstrAuthToken');
                localStorage.removeItem("language");
                localStorage.removeItem("_&rp&");
                localStorage.removeItem("_&gr&");
                resolve(null)
            }
        })
    }
}

export default SuccessKpiApp;