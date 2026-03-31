/*
THIS IS A TEMPORARY TEST
*/


const ALIAS = ['Alpha','Bravo','Charlie','Delta','Echo','Foxtrot','Golf','Hotel',
    'India','Juliet','Kilo','Lima','Mike','November','Oscar','Papa',
    'Quebec','Romeo','Sierra','Tango','Uniform','Victor','Whiskey','Xray','Yankee','Zulu'];

const COLORS = [
    {bg:'#fff9a3',author:'#b8a800'},{bg:'#b5f0c0',author:'#2a7a3b'},
    {bg:'#ffd6a5',author:'#a05a00'},{bg:'#c5d8ff',author:'#1a4a9e'},
    {bg:'#f9c5d1',author:'#a0253a'},
];


const name = ALIAS[Math.floor(Math.random() * ALIAS.length)] + '-' + (100 + Math.floor(Math.random() * 900));
const userColor = COLORS[Math.floor(Math.random() * COLORS.length)];
// give color choice later?
document.getElementById('codename').textContent = name;

function setCookie(name, value) {
    document.cookie = name + "=" + encodeURIComponent(value) + "; path=/";
}
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i=0;i<ca.length;i++){
        let c = ca[i].trim();
        if(c.indexOf(nameEQ)===0) return decodeURIComponent(c.substring(nameEQ.length));
    }
    return null;
}

const termsModal = document.getElementById('terms-modal');
const acceptBtn = document.getElementById('accept-terms');
const aliasCookieName = `acceptedTerms_${name}`;

const welcomeModal = document.getElementById('welcome-modal');
const userNameSpan = document.getElementById('user-name');
const boardQuote = document.getElementById('board-quote');
const enterBtn = document.getElementById('enter-board');

function showWelcomeModal() {
    const userAliasP = document.getElementById('user-alias');
    const boardQuote = document.getElementById('board-quote');

    userAliasP.innerHTML = `This life, you are called <strong>${name}</strong>.`;

    const QUOTES = [
        'Honor your alias, for it is your identity.',
        '"I am fond of boards. Posters look up to us. Trolls look down on us. Boards treat us as equals,"   - Clavicular',
        '<strong>Board 3:16</strong> - For the Board so loved the world that it gave its one and only Board, that whoever post in it shall not be forgotten but echo eternally.',
        '<strong>Board 37:13</strong> - but the Board laughs at the trolls, for it knows their day is nigh.',
        '<strong>Bulletinippians 4:13</strong> - I can post everything through it who gives me strength.',
        '<strong>1 Boarder 5:7</strong> - Be joyful in hope, patient in affliction, faithful in posting.',
        '<strong>Boardverbs 3:5-3:6</strong> - Trust in the BOARD with all your heart and lean not on your own understanding; in all your ways submit to it, and it will make your posts straight.',
    ];

    const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    boardQuote.innerHTML = `<em>${quote}</em>`;

    const welcomeModal = document.getElementById('welcome-modal');
    welcomeModal.classList.add('show');
}

enterBtn.addEventListener('click', () => {
    const welcomeModal = document.getElementById('welcome-modal');
    welcomeModal.classList.remove('show');
    setTimeout(() => {
        welcomeModal.style.display = 'none';
        initBoard(name, userColor);
    }, 300);
});

if (!getCookie(aliasCookieName)) {
    termsModal.classList.add('show');
    acceptBtn.addEventListener('click', () => {
        setCookie(aliasCookieName, 'true');
        termsModal.classList.remove('show');
        setTimeout(() => {
            termsModal.style.display = 'none';
            showWelcomeModal(); // show welcome next
        }, 300);
        });
} else {
    showWelcomeModal();
}