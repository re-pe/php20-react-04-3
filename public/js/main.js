// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';

const authorizeButton = document.getElementById('authorize_button');
const signoutButton = document.getElementById('signout_button');
const executeButton = document.getElementById('execute_button');
const allowedLabels = [
    'Label_3',
    'Label_16',
    'Label_17',
    'Label_26',
    'Label_37',
    'Label_41',
    'Label_43',
    'Label_6094322142763412575',
];

/**
  *  Called when the signed in status changes, to update the UI
  *  appropriately. After a sign-in, the API is called.
  */
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        authorizeButton.style.display = 'none';
        signoutButton.style.display = 'inline-block';
        executeButton.style.display = 'inline-block';
    } else {
        document.querySelector('#labels').innerHTML = '';
        document.querySelector('#threads').innerHTML = '';
        document.querySelector('#messages').innerHTML = '';
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
        executeButton.style.display = 'none';
    }
}

/**
  *  Sign in the user upon button click.
  */
function handleAuthClick() {
    window.gapi.auth2.getAuthInstance().signIn();
}

/**
  *  Sign out the user upon button click.
  */
function handleSignoutClick() {
    gapi.auth2.getAuthInstance().signOut(); // eslint-disable-line no-undef
}

function textNode(text) {
    return document.createTextNode(`${text}\n`);
}

function fieldElement(text) {
    const div = document.createElement('div');
    const textContent = textNode(text);
    div.appendChild(textContent);
    return div;
}

function rowElement(object) {
    const row = document.createElement('div');
    row.className = 'row';
    row.setAttribute('data-id', object.id);
    const field = fieldElement(JSON.stringify(object));
    row.appendChild(field);
    return row;
}

/**
  * Append a div container to the body containing the given object
  * as its div node. Used to display the results of the API call.
  *
  * @param {object} object to be placed in container element.
  * @param {string} containerId is id of container element.
  */
function appendToContainer(object, containerId) {
    const container = document.getElementById(containerId);
    const row = rowElement(object);
    container.appendChild(row);
}

/**
  * Append a container element to the body containing the given message
  * as its div node. Used to display the results of the API call.
  *
  * @param {object} tlabel to be placed in #labels element.
  */
function appendLabel(label) {
    appendToContainer(label, 'labels');
}

/**
  * Append a container element to the body containing the given message
  * as its div node. Used to display the results of the API call.
  *
  * @param {object} thread to be placed in #threads element.
  */
function appendThread(thread) {
    appendToContainer(thread, 'threads');
}

/**
  * Append a container element to the body containing the given message
  * as its div node. Used to display the results of the API call.
  *
  * @param {object} message to be placed in #messages element.
  */
function appendMessage(message) {
    appendToContainer(message, 'messages');
}

function getThreadMessages(id) {
    document.querySelector('#messages').innerHTML = '';
    return gapi.client.gmail.users.threads.get({ // eslint-disable-line no-undef
        userId: 'me',
        id,
    }).then(
        (response) => {
            // Handle the results here (response.result has the parsed body).
            // console.log('Response.result', response.result);

            response.result.messages.forEach((message) => {
                const {
                    threadId, snippet, payload,
                } = message;
                const { headers } = payload;
                const subject = headers.reduce(
                    (result, { name, value }) => result + ((name === 'Subject') ? value : ''),
                    '',
                );
                appendMessage({
                    id, threadId, snippet, subject,
                });
            });
        },
        (err) => {
            // console.error('Execute error', err);
            appendMessage(err);
        },
    );
}

/**
  * Print all threads in the authorized user's inbox. If no threads
  * are found an appropriate message is printed.
  */
function listThreads(labelId) {
    document.querySelector('#threads').innerHTML = '';
    document.querySelector('#messages').innerHTML = '';

    gapi.client.gmail.users.threads.list({ // eslint-disable-line no-undef
        userId: 'me',
        labelIds: [
            labelId,
        ],
    }).then((response) => {
        const { threads } = response.result;

        if (threads && threads.length > 0) {
            threads.forEach(
                (thread) => {
                    appendThread(thread);
                },
            );
        } else {
            appendThread({ id: 'No threads found.' });
        }
    }).then(() => {
        const threads = document.querySelector('#threads');
        const rows = threads.querySelectorAll('.row');
        if (rows) {
            rows.forEach(
                (row) => row.addEventListener('click', (event) => {
                    if (threads.hasChildNodes()) {
                        const selected = threads.querySelector('.selected');
                        if (selected) {
                            selected.classList.remove('selected');
                        }
                    }
                    getThreadMessages(event.currentTarget.getAttribute('data-id'));
                    event.currentTarget.classList.add('selected');
                }),
            );
        }
    });
}

/**
  * Print all Labels in the authorized user's inbox. If no labels
  * are found an appropriate message is printed.
  */
function listLabels() {
    document.querySelector('#labels').innerHTML = '';
    gapi.client.gmail.users.labels.list({ // eslint-disable-line no-undef
        userId: 'me',
    }).then((response) => {
        const { labels } = response.result;
        labels.sort((a, b) => {
            if (a.name > b.name) {
                return 1;
            }
            if (a.name < b.name) {
                return -1;
            }
            return 0;
        });

        if (labels && labels.length > 0) {
            labels.filter(
                (label) => allowedLabels.includes(label.id),
            ).forEach(
                (label) => appendLabel(label),
            );
        } else {
            appendLabel({ id: 'No Labels found.' });
        }
    }).then(() => {
        const labels = document.querySelector('#labels');
        const rows = labels.querySelectorAll('.row');
        if (rows) {
            rows.forEach(
                (row) => row.addEventListener('click', (event) => {
                    if (labels.hasChildNodes()) {
                        const selected = labels.querySelector('.selected');
                        if (selected) {
                            selected.classList.remove('selected');
                        }
                    }
                    listThreads(event.currentTarget.getAttribute('data-id'));
                    event.currentTarget.classList.add('selected');
                }),
            );
        }
    });
}

/**
  *  Called when the signed in status changes, to update the UI
  *  appropriately. After a sign-in, the API is called.
  */
function handleExecuteClick() {
    const isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get(); // eslint-disable-line no-undef
    if (isSignedIn) {
        listLabels();
        listThreads();
        // listMessages();
    }
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
    gapi.client.init({ // eslint-disable-line no-undef
        apiKey: API_KEY, // eslint-disable-line no-undef
        clientId: CLIENT_ID, // eslint-disable-line no-undef
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES,
    }).then(() => {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus); // eslint-disable-line no-undef

        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get()); // eslint-disable-line no-undef
        authorizeButton.onclick = handleAuthClick;
        signoutButton.onclick = handleSignoutClick;
        executeButton.onclick = handleExecuteClick;
    }, (error) => {
        // eslint-disable-next-line no-console
        console.log(error);
    });
}

/**
 * On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
    gapi.load('client:auth2', initClient); // eslint-disable-line no-undef
}

const apiScript = document.querySelector('#api_js');
apiScript.addEventListener('load', () => {
    // this.onload = () => {};
    handleClientLoad();
});
