const REFRESH_TOKEN_KEY = "REFRESH_TOKEN_KEY";
const ACCESS_TOKEN_KEY = "ACCESS_TOKEN_KEY";
const CODE_KEY = "CODE_KEY";
const DOMAIN_KEY = "DOMAIN_KEY";
const LANE_KEY = "LANE_KEY";
const authorizeEndpoint = "https://oauth.my.workfront.com/integrations/oauth2/authorize";
const tokenEndpoint = "integrations/oauth2/api/v1/token";
const revokeEndpoint = "integrations/oauth2/api/v1/revoke";

const encrypt = (text, key) => CryptoJS.AES.encrypt(text, key).toString();
const decrypt = (cipherText, key) => {
    return (CryptoJS.AES.decrypt(cipherText, key)).toString(CryptoJS.enc.Utf8);
};
var params = new URLSearchParams(document.location.search);
var clientId = params.get("cid");

const setCookie = (cname, cvalue, exdays) => {
    localStorage.setItem(clientId + '_oauth_'+cname, cvalue);
};
const getCookie = (cname) => {
    return localStorage.getItem(clientId + '_oauth_'+cname);
};
const deleteCookie = (cname, path, domain) => {
    if (getCookie(cname)) {
        localStorage.removeItem(clientId + '_oauth_'+cname);
    }
};
const getUrl = () => {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';

    return url.href;
};


let login = async () => {
    const codeVerifier = generateRandomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    setCookie("code_verifier", codeVerifier);

    const args = new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        code_challenge_method: "S256",
        code_challenge: codeChallenge,
        redirect_uri: getUrl(),
        search: location.search
    });
    location = authorizeEndpoint + "?" + args;
}

if (clientId != null) {
    setCookie("clientId", clientId);
}
else {
    clientId = getCookie("clientId");
    login = null;
}

const generateRandomString = () => {
    const array = new Uint32Array(56 / 2);
    crypto.getRandomValues(array);

    return Array.from(array, dec2hex).join("");
};

const dec2hex = (dec) => {
    return ("0" + dec.toString(16)).substr(-2);
};

const sha256 = (plain) => {
    return crypto.subtle.digest("SHA-256", (new TextEncoder()).encode(plain));
};

const base64urlencode = (a) => {
    let str = "";
    const bytes = new Uint8Array(a);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        str += String.fromCharCode(bytes[i]);
    }

    return btoa(str)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
};

const generateCodeChallenge = async (v) => {
    hashed = await sha256(v);

    return base64urlencode(hashed);
};

const processError = (error) => {
    document.getElementById("error").innerHTML = "Error: " + error.message;
    document.getElementById("error").style = "display:block";
    console.log(error);
};

const hideError = () => {
    document.getElementById("notAuthenticated").style = "display:none";
    document.getElementById("authenticated").style = "display:none";
}

function updatePageState() {
    document.getElementById("error").style = "display:none";
    let s;
    const encrypted_access_token = getCookie("encrypted_access_token");
    if (encrypted_access_token && (s = decrypt(encrypted_access_token, ACCESS_TOKEN_KEY))) {
        launch(s);
    } else {
        hideError();

        const encrypted_refresh_token = getCookie("encrypted_refresh_token");
        if (encrypted_refresh_token && decrypt(encrypted_refresh_token, REFRESH_TOKEN_KEY)) {
            refreshToken();
        }else {
            login ? login() : console.log('logged in');
        }
    }
}

const getParams = () => {
    const args = new URLSearchParams(location.search);
    const code = args.get("code");
    const domain = args.get("domain");
    const lane = args.get("lane");

    return { code, domain, lane };
};

const setParamsCookie = ({ code, domain, lane }) => {
    setCookie("encrypted_code", encrypt(code, CODE_KEY));
    setCookie("encrypted_domain", encrypt(domain, DOMAIN_KEY));
    setCookie("encrypted_lane", encrypt(lane, LANE_KEY));
    setCookie("code", code);
    setCookie("domain", domain);
    setCookie("lane", lane);
};

const getParamsCookie = () => {
    return {
        code: decrypt(getCookie("encrypted_code"), CODE_KEY),
        domain: decrypt(getCookie("encrypted_domain"), DOMAIN_KEY),
        lane: decrypt(getCookie("encrypted_lane"), LANE_KEY),
    };
};

async function getToken() {
    console.log('get token');
    if (!getCookie("encrypted_code")) {
        login();
        return;
    }
    const { code, domain, lane } = getParamsCookie();
    try {
         fetch(
            `https://${domain}.${lane}.workfront.com/${tokenEndpoint}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json;charset=utf-8",
                },
                body: JSON.stringify({
                    client_id: clientId,
                    code_verifier: getCookie("code_verifier"),
                    grant_type: "authorization_code",
                    redirect_uri: getUrl(),
                    code: code,
                }),
            }
        ).then(response => {
            if (response.ok) {
                let data = response.json(); // or response.text() depending on the response type
                setCookie("encrypted_access_token", encrypt(data.access_token, ACCESS_TOKEN_KEY));
                setCookie("encrypted_refresh_token", encrypt(data.refresh_token, REFRESH_TOKEN_KEY));
                setCookie("access_token", data.access_token);
                setCookie("refresh_token", data.refresh_token);

                updatePageState();
            } else if (response.status === 400) {
                login();
            } else if (response.status === 404) {
                // Handle 404 Not Found
                throw new Error('Resource not found');
            } else {
                // Handle other status codes
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
        })
        .then(data => {
            console.log('Success:', data);
        })
        .catch(error => {
            console.error('Fetch error:', error);
        });

    } catch (error) {
        processError(error);
    }
}

async function refreshToken() {
    const { domain, lane } = getParamsCookie();
    const encrypted_refresh_token = getCookie("encrypted_refresh_token");
    const refresh_token = decrypt(encrypted_refresh_token, REFRESH_TOKEN_KEY);
    try {
        const response = await fetch(
            `https://${domain}.${lane}.workfront.com/${tokenEndpoint}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json;charset=utf-8",
                },
                body: JSON.stringify({
                    client_id: clientId,
                    refresh_token,
                    grant_type: "refresh_token",
                    redirect_uri: getUrl(),
                }),
            }
        );
        const data = await response.json();
        const encrypted_access_token = encrypt(data.access_token, ACCESS_TOKEN_KEY);
        const encrypted_refresh_token = encrypt(data.refresh_token, REFRESH_TOKEN_KEY);

        setCookie("encrypted_access_token", encrypted_access_token);
        setCookie("encrypted_refresh_token", encrypted_refresh_token);

        launch(decrypt(encrypted_access_token, ACCESS_TOKEN_KEY));
    } catch (error) {
        processError(error);
    }
}

async function revokeToken() {
    const { domain, lane } = getParamsCookie();
    const encrypted_refresh_token = getCookie("encrypted_refresh_token");
    const refresh_token = decrypt(encrypted_refresh_token, REFRESH_TOKEN_KEY);
    try {
        const response = await fetch(
            `https://${domain}.${lane}.workfront.com/${revokeEndpoint}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json;charset=utf-8",
                },
                body: JSON.stringify({
                    client_id: clientId,
                    refresh_token,
                    redirect_uri: getUrl(),
                }),
            }
        );
        updatePageState();
    } catch (error) {
        processError(error);
    }
}

async function logout() {
    await revokeToken();
    deleteCookie("encrypted_access_token");
    deleteCookie("encrypted_refresh_token");
}