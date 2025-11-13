const fs = require('fs').promises;
const path = require('path');
const qs = require('qs');
const platformClient = require('purecloud-platform-client-v2');

// DeleteDIDs/deleteDIDs.js
// Usage: node deleteDIDs.js /path/to/file.csv
// Requires environment variables: CLIENT_ID, CLIENT_SECRET
// Region fixed to us_east_1 per request.


if (process.argv.length < 3) {
    console.error('Usage: node deleteDIDs.js /path/to/file.csv <true|false (dry run)>');
    process.exit(1);
}

const CSV_PATH = path.resolve(process.argv[2]);
let DRY_RUN = true; // set to true to only log without making changes
if (process.argv[3]) {
    DRY_RUN = (process.argv[3].toLowerCase() === 'true') ? true : false;
}
const REGION = 'mypurecloud.com'; // us_east_1
const LOGIN_BASE = `https://login.${REGION}`;
const API_BASE = `https://api.${REGION}`;

const CLIENT_ID = 'd75e57b4-8604-4f06-8cd6-8cb31ac56751'; //process.env.CLIENT_ID;
const CLIENT_SECRET = 'ju7vN1n4EHJKHFVrcoXWqmyMlzXhcf4ePPKjU_Gq1LE'; //process.env.CLIENT_SECRET;
if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('Please set CLIENT_ID and CLIENT_SECRET environment variables.');
    process.exit(1);
}

const client = platformClient.ApiClient.instance;
client.setEnvironment(platformClient.PureCloudRegionHosts.us_east_1);

const RoutingApi = platformClient.RoutingApi;
const TelephonyApi = platformClient.TelephonyApi;
const TelephonyProvidersEdgeApi = new platformClient.TelephonyProvidersEdgeApi();

let token = null;
let didPools = [];

async function getToken() {
    try {
        await client.loginClientCredentialsGrant(CLIENT_ID, CLIENT_SECRET);
        console.log('Token retrieved successfully.');
    } catch (err) {
        console.error('Failed to retrieve token:', err);
        process.exit(1);
    }

    return token;
}

async function getDIDPools() {

    const pageSize = 100;
    let pageNumber = 1;

    let type = "ASSIGNED_AND_UNASSIGNED"; 
    let opts = { 
        'pageSize': pageSize,
        'pageNumber': pageNumber,
        'sortOrder': "ascending"
    };

    try {
        while (true) {
            const resp = await TelephonyProvidersEdgeApi.getTelephonyProvidersEdgesDidpoolsDids(type, opts)
            if (resp && Array.isArray(resp.entities) && resp.entities.length > 0) {
                didPools = didPools.concat(resp.entities);
            }
            if (!resp || !resp.pageCount || opts.pageNumber >= resp.pageCount) break;
            opts.pageNumber++;
        }
        return didPools;
    } catch (err) {
        console.error('Failed to retrieve DID Pools via SDK:', err && err.message ? err.message : err);
        throw err;
    }
}

function normalizeNumber(s) {
    if (!s) return '';
    return s.replace(/[^0-9+]/g, '');
}

async function findDidByNumber(number) {
    return didPools.find(did => normalizeNumber(did.number) === number);
}

async function unassignDid(did) {
    if (DRY_RUN === 'false') {
        await TelephonyProvidersEdgeApi.deleteTelephonyProvidersEdgesDidpoolsDid(did.id);
    }
}

async function deleteDidPool(did) {
    if (DRY_RUN === 'false') {
        await TelephonyProvidersEdgeApi.deleteTelephonyProvidersEdgesDidpool(did.didPool.id);
    }
}

(async () => {
    try {

        console.log('Starting DID deletion process...');
        console.log(`dry run mode: ${DRY_RUN}`);

        // ensure we have a token and the ApiClient is configured
        client.setEnvironment(REGION);
        await getToken();
        await getDIDPools();

        const csv = await fs.readFile(CSV_PATH, 'utf8');
        const lines = csv.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        console.log(`Processing ${lines.length} rows from ${CSV_PATH}...`);

        for (const raw of lines) {
            // assume CSV first column is number; split by comma and take first column
            const firstCol = raw.split(',')[0].trim();
            const phone = normalizeNumber(firstCol);
            if (!phone) continue;
            console.log(`Checking phone: ${phone}`);

            const did = await findDidByNumber(phone);
            if (did !== undefined && did.assigned === true) {
                // unassign DID
                await unassignDid(did);
                console.log(`  DID unassigned.`);   
            }

            if (did !== undefined) {
                // delete DID Pool
                await deleteDidPool(did);
                console.log(`  DID Pool deleted.`);
            } else {
                console.log(`  DID not found.`);
            }

            // small delay to be polite to API
            await new Promise(r => setTimeout(r, 300));
        }

        console.log('Done.');
    } catch (err) {
        console.error('Fatal error:', err.response ? err.response.data : err.message);
        process.exit(1);
    }
})();