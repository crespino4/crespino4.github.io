cd /var/www/html/Genesys/
forever stop index.js
forever start -o out.log -e err.log index.js

