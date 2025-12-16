import config from './config.js';

// Genesys Cloud Language Code to AWS Translate Language Code
const languageCodeMapping = {
    'cs': 'cs',
    'da': 'da',
    'de': 'de',
    'en-us': 'en',
    'es': 'es',
    'fr': 'fr',
    'it': 'it',
    'nl': 'nl',
    'no': 'no',
    'pl': 'pl',
    'pt-br': 'pt',
    'fi': 'fi',
    'sv': 'sv',
    'tr': 'tr',
    'th': 'th',
    'ja': 'ja',
    'zh-cn': 'zh',
    'zh-tw': 'zh-TW'
};

export default {
    translateText(text, language, callback) {
        if ( !config.translateServiceURI || config.translateServiceURI === '') {
            console.error('Translate Service URI is not configured. Echoing back original text.');
            callback({
                        translated_text: text
                    });
            return;
        }

        let language_code = languageCodeMapping[language] ? 
                    languageCodeMapping[language] : language;

        let data = {
            q: text,
            source: 'auto',
            target: language_code,
            format: 'text'
        };

        fetch(config.translateServiceURI,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }
        )
        .then(response => response.json())
        .then(translationData => {
            console.log(JSON.stringify(translationData));

            callback(translationData);
        })
        .catch(e => console.error(e));
    }
};
