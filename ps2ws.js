/* ps2ws.js */
//Created by Dylan on 03-Apr-16.
// Modules
const api_key   = require('./api_key.js'),
      items       = require('./items.js'),
      WebSocket   = require('ws'),
      app         = require('./app'),
      overlay     = require('./overlay.js'),
      team        = require('./team.js'),
      socket      = require('./socket.js');

// Variables
let  teamOneObject,
     teamTwoObject,
     captures = 0,
     roundTracker = 0,
     timeCounter = 0,
     matchLength = 900,
     eventTitle;

const pointNumbers = ['0','1','11','12','13','21','22','23'];

// Point Map defaults to thunderdome ruleset
let pointMap = {
    '0'  : { "action" : "First Base Capture",      points : 18, id : "class0"},
    '1'  : { "action" : "Subsequent Base Capture", points : 36, id : "class1"},
    '11' : { "action" : "Max v Infantry Kill",     points : 0,  id : "class11"},
    '12' : { "action" : "Max v Max Kill",          points : 0,  id : "class12"},
    '13' : { "action" : "Max Suicide",             points : -12, id : "class13"},
    '21' : { "action" : "Infantry TK",             points : -3, id : "class21"},
    '22' : { "action" : "Infantry Suicide",        points : -3, id : "class22"},
    '23' : { "action" : "InfanStry v Max",          points : 12,  id : "class23"},
    'name': 'Thunderdome Ruleset'
};

// Thunderdome (2016)
const thunderdomePointMap = {'0':10, '1':25, '11':1, '12':3, '13':-5, '21':-5, '22':-2, '23':5 };

// Emerald "Durdledome" (2016)
const emeraldPointMap = { '0':10, '1':25, '11':0, '12':3, '13':-4, '21':-3, '22':-3, '23':4 };

// Briggs OvO (2017)
const ovoPointMap = { '0':12, '1':24, '11':0, '12':2, '13':-12, '21':-3, '22':-3, '23':12 };

function getPointMaps() {
    return pointMap;
}

function updatePointMap(number) {
    pointNumbers.forEach(function (data) {
        if (number === 0) { pointMap[data].points = thunderdomePointMap[data]; }
        else if (number === 1) { pointMap[data].points = emeraldPointMap[data]; }
        else if (number === 2) { pointMap[data].points = ovoPointMap[data]; }
    });
    if (number === 0) { pointMap['name'] = 'Thunderdome'; }
    if (number === 1) { pointMap['name'] = 'Emerald'; }
    if (number === 2) { pointMap['name'] = 'Briggs OvO'; }
}

function individualPointUpdate(event) {
    if (event.class0  !== '') { pointMap['0'].points = event.class0; }
    if (event.class1  !== '') { pointMap['1'].points = event.class1; }
    if (event.class11 !== '') { pointMap['11'].points = event.class11; }
    if (event.class12 !== '') { pointMap['12'].points = event.class12; }
    if (event.class13 !== '') { pointMap['13'].points = event.class13; }
    if (event.class21 !== '') { pointMap['21'].points = event.class21; }
    if (event.class22 !== '') { pointMap['22'].points = event.class22; }
    if (event.class23 !== '') { pointMap['23'].points = event.class23; }
    pointMap.name = 'Custom';
}

function getRound() { return roundTracker; }

function killfeedPlayer(obj) {
    app.send('killfeed', obj);
    overlay.updateKillfeedPlayer(obj);
    teamOneObject = team.getT1();
    teamTwoObject = team.getT1();
}

function killfeedFacilityT1(points) {
    const obj = {
        winner: '[' + teamOneObject.alias + ']',
        winner_faction: teamOneObject.faction,
        loser: '[' + teamTwoObject.alias + ']',
        loser_faction: teamTwoObject.faction,
        weapon: 'Base Capture',
        points: points
    };
    app.send('killfeed', obj);
    overlay.updateKillfeedFacility(teamOneObject.alias, points);
    team.oneBaseCap(points);
}

function killfeedFacilityT2(points) {
    const obj = {
        winner: '[' + teamTwoObject.alias + ']',
        winner_faction: teamTwoObject.faction,
        loser: '[' + teamOneObject.alias + ']',
        loser_faction: teamOneObject.faction,
        weapon: 'Base Capture',
        points: points
    };
    app.send('killfeed', obj);
    overlay.updateKillfeedFacility(teamTwoObject.alias, points);
    team.twoBaseCap(points);
}

function dealWithTheData(raw) {
    raw = raw.replace(': :', ':');
    const data = JSON.parse(raw).payload;
    switch(data.event_name) {
        case "Death":
            console.log("it's player data");
            itsPlayerData(data);
            break;

        case "FacilityControl":
            // console.log("it's facility data"); 
            itsFacilityData(data);
            break;

        case "GainExperience":
            console.log("it's experience data"); 
            itsExperienceData(data);
            break;
        
        default:
            return;
    }
}

function itsPlayerData(data) {
    // deals with adding points to the correct player & team
    let item = items.lookupItem(data.attacker_weapon_id);
    let points = items.lookupPointsfromCategory(item.category_id);
    
    // Team 1 Killer
    if (teamOneObject.members.hasOwnProperty(data.attacker_character_id)) {
        
        // One IVI Two
        if (teamTwoObject.members.hasOwnProperty(data.character_id)) {
            oneIvITwo(data, points, item);
        }
        
        //One Suicide
        else if (data.attacker_character_id === data.character_id) {
            teamOneSuicide(data, points, item);
        }

        // One TK
        else if (teamOneObject.members.hasOwnProperty(data.character_id)) {
            teamOneTeamkill(data, pointMap['21'].points, item);
        }
    }

    // Team 2 Killer
    else if (teamTwoObject.members.hasOwnProperty(data.attacker_character_id)) {
        
        // Two IVI One
        if (teamOneObject.members.hasOwnProperty(data.character_id)) {
            twoIvIOne(data, points, item);
        }

        // Two Suicide
        else if (data.attacker_character_id === data.character_id) {
            teamTwoSuicide(data, points, item);
        }
        
        // Two TK
        else if (teamTwoObject.members.hasOwnProperty(data.character_id)) {
            teamTwoTeamkill(data, pointMap['21'].points, item);
        }
    }

    else {
        console.log("   --> Invalid Player Event <--");
    }

    overlay.updateScoreOverlay();
    teamOneObject = team.getT1();
    teamTwoObject = team.getT2();
}

function oneIvITwo (data, points, item) {
    team.oneIvITwo(data.attacker_character_id, data.character_id, data.attacker_loadout_id, data.attacker_loadout_id, data.character_loadout_id);
    killfeedPlayer({
        winner: teamOneObject.members[data.attacker_character_id].name,
        winner_faction: teamOneObject.faction,
        winner_class_id: data.attacker_loadout_id,
        loser: teamTwoObject.members[data.character_id].name,
        loser_faction: teamTwoObject.faction,
        loser_class_id: data.character_loadout_id,
        weapon: item.name,
        points: points
    });
}

function twoIvIOne (data, points, item) {
    team.twoIvIOne(data.attacker_character_id, data.character_id, data.attacker_loadout_id, data.character_loadout_id);
    killfeedPlayer({
        winner: teamTwoObject.members[data.attacker_character_id].name,
        winner_faction: teamTwoObject.faction,
        winner_class_id: data.attacker_loadout_id,
        loser: teamOneObject.members[data.character_id].name,
        loser_faction: teamOneObject.faction,
        loser_class_id: data.character_loadout_id,
        weapon: item.name,
        points: points,
    });
}

function teamOneSuicide (data, points, item) {
    team.oneSuicide(data.attacker_character_id, data.attacker_loadout_id);
    killfeedPlayer({
        winner: teamOneObject.members[data.attacker_character_id].name,
        winner_faction: teamOneObject.faction,
        winner_class_id: data.attacker_loadout_id,
        loser: teamOneObject.members[data.character_id].name,
        loser_faction: teamOneObject.faction,
        loser_class_id: data.character_loadout_id,
        weapon: item.name,
        points: points,
    });
}

function teamTwoSuicide (data, points, item) {
    team.twoSuicide(data.attacker_character_id, data.attacker_loadout_id);
    killfeedPlayer({
        winner: teamTwoObject.members[data.attacker_character_id].name,
        winner_faction: teamTwoObject.faction,
        winner_class_id: data.attacker_loadout_id,
        loser: teamTwoObject.members[data.character_id].name,
        loser_faction: teamTwoObject.faction,
        loser_class_id: data.character_loadout_id,
        weapon: item.name,
        points: points,
    });
}

function teamOneTeamkill (data, points, item) {
    team.oneTeamKill(data.attacker_character_id, data.character_id, data.attacker_loadout_id, data.character_loadout_id);
    killfeedPlayer({
        winner: teamOneObject.members[data.attacker_character_id].name,
        winner_faction: teamOneObject.faction,
        winner_class_id: data.attacker_loadout_id,
        loser: teamOneObject.members[data.character_id].name,
        loser_faction: teamOneObject.faction,
        loser_class_id: data.character_loadout_id,
        weapon: item.name,
        points: points,
    });
}

function teamTwoTeamkill (data, points, item) {
    team.twoTeamKill(data.attacker_character_id, data.character_id, data.attacker_loadout_id, data.character_loadout_id);
    killfeedPlayer({
        winner: teamTwoObject.members[data.attacker_character_id].name,
        winner_faction: teamTwoObject.faction,
        winner_class_id: data.attacker_loadout_id,
        loser: teamTwoObject.members[data.character_id].name,
        loser_faction: teamTwoObject.faction,
        loser_class_id: data.character_loadout_id,
        weapon: item.name,
        points: points,
    });
}

function itsFacilityData(data) {
    //deals with adding points to the correct team
    if (data.new_faction_id !== data.old_faction_id) {
        if (data.outfit_id === teamOneObject.outfit_id) {
            if (captures === 0) {
                killfeedFacilityT1(pointMap['0'].points);
            } else {
                killfeedFacilityT1(pointMap['1'].points);
            }
            app.send('score', { teamOne: team.getT1(), teamTwo: team.getT2() });
            captures++;
        } else if (data.outfit_id === teamTwoObject.outfit_id) {
            if (captures === 0) {
                killfeedFacilityT2(pointMap['0'].points);
            } else {
                killfeedFacilityT2(pointMap['1'].points);
            }
            app.send('score', { teamOne: team.getT1(), teamTwo: team.getT2() });
            captures++;
        }
        //else it was captured by neither outfit
        overlay.updateScoreOverlay();
        teamOneObject = team.getT1();
        teamTwoObject = team.getT2();
    }
    // Else it was a defense (no points awarded)
}

function itsExperienceData(data) {

    if (teamOneObject.members.hasOwnProperty(data.character_id)) {
        // Revive Data
        if (allXpIdsRevives.includes(data.experience_id)) {
            teamOneRevive(data);
            console.log("Team 1 Revive");
        }

        else if (allXpIdsPointControls.includes(data.experience_id)) {
        }
    }

    else if (teamTwoObject.members.hasOwnProperty(data.character_id)) {
        // Team 2 Revive
        if (allXpIdsRevives.includes(data.experience_id)) {
            teamTwoRevive(data);
            console.log("Team 2 Revive");
        }
        
        else if (allXpIdsPointControls.includes(data.experience_id)) {
        }
    }
}

function teamOneRevive(data) {
    team.oneRevive(data.character_id, data.other_id, data.loadout_id);
}

function teamTwoRevive(data) {
    team.twoRevive(data.character_id, data.other_id, data.loadout_id);
}

function createStream() {
    const ws = new WebSocket('wss://push.planetside2.com/streaming?environment=ps2&service-id=s:' + api_key.KEY);
    ws.on('open', function open() {
        console.log('stream opened');
        subscribe(ws);
    });
    ws.on('message', function (data) {
        if (data.indexOf("payload") === 2) {
            dealWithTheData(data);
        }
    });
    captures = 0;
}

function subscribe(ws) {
    var xpGainString = getExperienceIds(true, true, true, false, false, false);
    ws.send('{"service":"event","action":"subscribe","characters":["all"],"eventNames":["Death",' + xpGainString + ']}');

    //team1 subscribing
    teamOneObject.memberArray.forEach(function (member) {
        ws.send('{"service":"event","action":"subscribe","characters":["' + member.character_id + '"],"eventNames":["Death",' + xpGainString + ']}');
        // ws.send('{"service":"event","action":"subscribe","characters":["' + member.character_id + '"],"eventNames":[' + xpGainString + ']}');
    });

    //team2 subscribing
    teamTwoObject.memberArray.forEach(function (member) {
        ws.send('{"service":"event","action":"subscribe","characters":["' + member.character_id + '"],"eventNames":["Death"]}');
        ws.send('{"service":"event","action":"subscribe","characters":["' + member.character_id + '"],"eventNames":[' + xpGainString + ']}');
    });

    //facility Subscribing - subscribes to all capture data
    ws.send('{"service":"event","action":"subscribe","worlds":["1","10","13","17","19","25"],"eventNames":["FacilityControl"]}');
    
    //start timer
    startTimer(ws);

    console.log('Subscribed to facility and kill/death events between ' + teamOneObject.alias + ' and '  +teamTwoObject.alias);
}

function unsubscribe(ws) {
    // unsubscribes from all events
    ws.send('{"service":"event","action":"clearSubscribe","all":"true"}');
    console.log('Unsubscribed from facility and kill/death events between ' + teamOneObject.alias + ' and '  +teamTwoObject.alias);
}

function startTimer(ws) {
    console.log('timer started');
    roundTracker++;
    timeCounter = matchLength ? matchLength : 900;
    let time = setInterval(function () {
        if (timeCounter < 1) {
            clearInterval(time);
            unsubscribe(ws);
            overlay.writeFinalStats(teamOneObject,teamTwoObject);
            socket.setRunning(false);
        }
        overlay.updateTime(timeCounter);
        timeCounter--;
    }, 1000);
}

function stopTheMatch() {
    timeCounter = 0;
}

function startUp(oneObj, twoObj, secsInt, title) {
    // Initialising items determines whether a match can go ahead as it pulls from the API each time so requires the API to be functional
    items.initialise().then(function() {
        console.log('=====================================================================================================================================');
        team.setTeams(oneObj, twoObj);
        teamOneObject = team.getT1();
        teamTwoObject = team.getT2();
        matchLength = secsInt;
        eventTitle = title ? title : '#BanConcs'; //'PS2 IvI Scrims';
        createStream();
        overlay.startKillfeed();
        app.send('refresh', '');
        app.send('title', String(eventTitle));
        console.log('startUp title: ' + eventTitle);
        socket.setRunning(true);
    }).catch(function (err) {
        console.error('Items did not initialise!!');
        console.error(err);
    });
}

function newRound() {
    console.log('=====================================================================================================================================');
    teamOneObject = team.getT1();
    teamTwoObject = team.getT2();
    createStream();
    overlay.startKillfeed();
    app.send('refresh', '');
    app.send('title', getTitle());
    socket.setRunning(true);
}

function getTitle() {
    return eventTitle;
}

/**
 * Generates and returns a string of all experience gain IDs for the specified categories.
 *
 * @param {boolean} revives XP gains corresponding to medic revies
 * @param {boolean} spawns XP gains corresponding to respawning players
 * @param {boolean} pointControls XP gains corresponding to contesting and capturing control points and objectives 
 * @param {boolean} dmgAssists XP gains corresponding to kill assists via raw damage 
 * @param {boolean} utilAssists XP gains corresponding to kill assists and other support actions, such as spotting,
 *                              EMP/Flash/Conc assists, and medic heals
 * @param {boolean} bannedTicks XP gains corresponding to banned actions, such as motion spotter assists
 * @returns A string of the format '"GainExperience_experience_id_<xpID>","GainExperience_experience_id_<xpID>",...'
 */
function getExperienceIds(revives, spawns, pointControls, dmgAssists, utilAssists, bannedTicks) {
    var xpGainString = '';
    if (revives === true) {
        for (xpIdx = 0; xpIdx < allXpIdsRevives.length; xpIdx++) {
            let xpID = allXpIdsRevives[xpIdx];
            xpGainString = addXpIdToXpGainString(xpID, xpGainString);
        }
    }
    if (spawns === true) {
    }
    if (pointControls === true) {
        xpGainString = addXpIdToXpGainString(15, xpGainString);  // Control Point - Defend (100xp)
        xpGainString = addXpIdToXpGainString(16, xpGainString);  // Control Point - Attack (100xp)
        xpGainString = addXpIdToXpGainString(272, xpGainString); // Convert Capture Point (25xp)
        xpGainString = addXpIdToXpGainString(556, xpGainString); // Objective Pulse Defend (50xp)
        xpGainString = addXpIdToXpGainString(557, xpGainString); // Objective Pulse Capture (100xp)
    }
    if (dmgAssists === true) {
        xpGainString = addXpIdToXpGainString(2, xpGainString);    // Kill Player Assist (100xp)
        xpGainString = addXpIdToXpGainString(335, xpGainString);  // Savior Kill (Non MAX) (25xp)
        xpGainString = addXpIdToXpGainString(371, xpGainString);  // Kill Player Priority Assist (150xp)
        xpGainString = addXpIdToXpGainString(372, xpGainString);  // Kill Player High Priority Assist (300xp)
        
    }
    if (utilAssists === true) {
        xpGainString = addXpIdToXpGainString(5, xpGainString);    // Heal Assis (5xp)
        xpGainString = addXpIdToXpGainString(438, xpGainString);  // Shield Repair (10xp)
        xpGainString = addXpIdToXpGainString(439, xpGainString);  // Squad Shield Repair (15xp)
        xpGainString = addXpIdToXpGainString(550, xpGainString);  // Concussion Grenade Assist (50xp)
        xpGainString = addXpIdToXpGainString(551, xpGainString);  // Concussion Grenade Squad Assist (75xp)
        xpGainString = addXpIdToXpGainString(552, xpGainString);  // EMP Grenade Assist (50xp)
        xpGainString = addXpIdToXpGainString(553, xpGainString);  // EMP Grenade Squad Assist (75xp)
        xpGainString = addXpIdToXpGainString(554, xpGainString);  // Flashbang Assist (50xp)
        xpGainString = addXpIdToXpGainString(555, xpGainString);  // Flashbang Squad Assist (75xp)
        xpGainString = addXpIdToXpGainString(1393, xpGainString); // Hardlight Cover - Blocking Exp (placeholder until code is done) (50xp)
        xpGainString = addXpIdToXpGainString(1394, xpGainString); // Draw Fire Award (25xp)
    }
    if (bannedTicks === true) {
        xpGainString = addXpIdToXpGainString(293, xpGainString);  // Motion Detect (10xp)
        xpGainString = addXpIdToXpGainString(294, xpGainString);  // Squad Motion Spot (15xp)
        xpGainString = addXpIdToXpGainString(593, xpGainString);  // Bounty Kill Bonus (250xp)
        xpGainString = addXpIdToXpGainString(594, xpGainString);  // Bounty Kill Cashed In (400xp)
        xpGainString = addXpIdToXpGainString(594, xpGainString);  // Bounty Kill Cashed In (400xp)
        xpGainString = addXpIdToXpGainString(595, xpGainString);  // Bounty Kill Streak (595xp)
        xpGainString = addXpIdToXpGainString(582, xpGainString);  // Kill Assist - Spitfire Turret (25xp)
    }

    console.log(xpGainString);
    return xpGainString;
}

const allXpIdsRevives = [
    7,      // Revive (75xp)
    53      // Squad Revive (100xp) 
];

const allXpIdsSpawns = [
    56,     // Squad Spawn (10xp)
    223,    // Sunderer Spawn Bonus (5xp) - DOESN'T RETURN WHO SPAWNED
]

const allXpIdsPointControls = [
    15,     // Control Point - Defend (100xp)
    16,     // Control Point - Attack (100xp)
    272,    // Convert Capture Point (25xp)
    556,    // Objective Pulse Defend (50xp)
    557     // Objective Pulse Capture (100xp)
];

const allXpIdsDmgAssists = [
    2,      // Kill Player Assist (100xp)
    335,    // Savior Kill (Non MAX) (25xp)
    371,    // Kill Player Priority Assist (150xp)
    372     // Kill Player High Priority Assist (300xp)
];

const allXpIdsUtilAssists = [
    5,      // Heal Assis (5xp)
    438,    // Shield Repair (10xp)
    439,    // Squad Shield Repair (15xp)
    550,    // Concussion Grenade Assist (50xp)
    551,    // Concussion Grenade Squad Assist (75xp)
    552,    // EMP Grenade Assist (50xp)
    553,    // EMP Grenade Squad Assist (75xp)
    554,    // Flashbang Assist (50xp)
    555,    // Flashbang Squad Assist (75xp)
    1393,   // Hardlight Cover - Blocking Exp (placeholder until code is done) (50xp)
    1394,   // Draw Fire Award (25xp)
];

const allXpIdsBannedTicks = [
    293,    // Motion Detect (10xp)
    294,    // Squad Motion Spot (15xp)
    593,    // Bounty Kill Bonus (250xp)
    594,    // Bounty Kill Cashed In (400xp)
    594,    // Bounty Kill Cashed In (400xp)
    595,    // Bounty Kill Streak (595xp)
    582     // Kill Assist - Spitfire Turret (25xp)
];

function addXpIdToXpGainString(xpID, xpGainString) {
    if (xpGainString === '' || xpGainString === null || xpGainString === undefined) {
        return makeXpIdString(xpID);
    }
    return xpGainString.concat(',',makeXpIdString(xpID));
}

function makeXpIdString(xpID) {
    return '"GainExperience_experience_id_' + xpID + '"'; 
}

exports.getPointMaps          = getPointMaps;
exports.updatePointMap        = updatePointMap;
exports.individualPointUpdate = individualPointUpdate;
exports.getRound              = getRound;
exports.stopTheMatch          = stopTheMatch;
exports.startUp               = startUp;
exports.newRound              = newRound;
exports.getTitle              = getTitle;