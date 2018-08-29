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
      painter     = require('./painter.js');

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
 
const objectivePointsMap = {
    revive: 2,
    kill: 3, //2,
    dmgAssist: 1,
    utilAssist: 1,
    control: 3,
    death: -6, //-4,
    teamkill: -6, //-5,
    tkDeath: -1,
    suicide: -6, //-5,
    reviveTaken: 1
}

function getRound() { return roundTracker; }

function killfeedPlayer(obj) {
    app.send('killfeed', obj);
    // overlay.updateKillfeedPlayer(obj);
    teamOneObject = team.getT1();
    teamTwoObject = team.getT1();
}

function dealWithTheData(raw) {
    raw = raw.replace(': :', ':');
    const data = JSON.parse(raw).payload;
    switch(data.event_name) {
        case "Death":
            itsPlayerData(data);
            break;

        case "FacilityControl":
            itsFacilityData(data);
            break;

        case "GainExperience":
            itsExperienceData(data);
            break;
        
        default:
            //console.log(data.event_name);
            return;
    }
}

function itsPlayerData(data) {
    // deals with adding points to the correct player & team
    let item = items.lookupItem(data.attacker_weapon_id);
    // let points = items.lookupPointsfromCategory(item.category_id);
    
    // Team 1 Killer
    if (teamOneObject.members.hasOwnProperty(data.attacker_character_id)) {
        
        // One IVI Two
        if (teamTwoObject.members.hasOwnProperty(data.character_id)) {
            oneIvITwo(data, objectivePointsMap, item);
        }
        
        //One Suicide
        else if (data.attacker_character_id === data.character_id) {
            teamOneSuicide(data, objectivePointsMap, item);
        }

        // One TK
        else if (teamOneObject.members.hasOwnProperty(data.character_id)) {
            teamOneTeamkill(data, objectivePointsMap, item);
        }
    }

    // Team 2 Killer
    else if (teamTwoObject.members.hasOwnProperty(data.attacker_character_id)) {
        
        // Two IVI One
        if (teamOneObject.members.hasOwnProperty(data.character_id)) {
            twoIvIOne(data, objectivePointsMap, item);
        }

        // Two Suicide
        else if (data.attacker_character_id === data.character_id) {
            teamTwoSuicide(data, objectivePointsMap, item);
        }
        
        // Two TK
        else if (teamTwoObject.members.hasOwnProperty(data.character_id)) {
            teamTwoTeamkill(data, objectivePointsMap, item);
        }
    }

    else {
        console.log(painter.red('   --> Invalid Player Event <--'));
    }

    teamOneObject = team.getT1();
    teamTwoObject = team.getT2();
}

//#region Discrete Player Event Handling

function oneIvITwo (data, pointsMap, item) {
    team.oneIvITwo(data.attacker_character_id, data.character_id, data.attacker_loadout_id, data.attacker_loadout_id, data.character_loadout_id, pointsMap);
    killfeedPlayer({
        winner: teamOneObject.members[data.attacker_character_id].name,
        winner_faction: teamOneObject.faction,
        winner_class_id: data.attacker_loadout_id,
        winner_net_score: teamOneObject.members[data.attacker_character_id].netEventScore,
        loser: teamTwoObject.members[data.character_id].name,
        loser_faction: teamTwoObject.faction,
        loser_class_id: data.character_loadout_id,
        loser_net_score: teamTwoObject.members[data.character_id].eventNetScore,
        weapon: item.name,
        is_kill: true
    });
}

function twoIvIOne (data, pointsMap, item) {
    team.twoIvIOne(data.attacker_character_id, data.character_id, data.attacker_loadout_id, data.character_loadout_id, pointsMap);
    killfeedPlayer({
        winner: teamTwoObject.members[data.attacker_character_id].name,
        winner_faction: teamTwoObject.faction,
        winner_class_id: data.attacker_loadout_id,
        winner_net_score: teamTwoObject.members[data.attacker_character_id].netEventScore,
        loser: teamOneObject.members[data.character_id].name,
        loser_faction: teamOneObject.faction,
        loser_class_id: data.character_loadout_id,
        loser_net_score: teamOneObject.members[data.character_id].eventNetScore,
        weapon: item.name,
        is_kill: true
    });
}

function teamOneSuicide (data, pointsMap, item) {
    team.oneSuicide(data.attacker_character_id, data.attacker_loadout_id, pointsMap);
    killfeedPlayer({
        winner: teamOneObject.members[data.attacker_character_id].name,
        winner_faction: teamOneObject.faction,
        winner_class_id: data.attacker_loadout_id,
        winner_net_score: teamOneObject.members[data.attacker_character_id].netEventScore,
        loser: teamOneObject.members[data.character_id].name,
        loser_faction: teamOneObject.faction,
        loser_class_id: data.character_loadout_id,
        loser_net_score: teamOneObject.members[data.character_id].eventNetScore,
        weapon: item.name,
        is_kill: true
    });
}

function teamTwoSuicide (data, pointsMap, item) {
    team.twoSuicide(data.attacker_character_id, data.attacker_loadout_id, pointsMap);
    killfeedPlayer({
        winner: teamTwoObject.members[data.attacker_character_id].name,
        winner_faction: teamTwoObject.faction,
        winner_class_id: data.attacker_loadout_id,
        winner_net_score: teamTwoObject.members[data.attacker_character_id].netEventScore,
        loser: teamTwoObject.members[data.character_id].name,
        loser_faction: teamTwoObject.faction,
        loser_class_id: data.character_loadout_id,
        loser_net_score: teamTwoObject.members[data.character_id].eventNetScore,
        weapon: item.name,
        is_kill: true
    });
}

function teamOneTeamkill (data, pointsMap, item) {
    team.oneTeamKill(data.attacker_character_id, data.character_id, data.attacker_loadout_id, data.character_loadout_id, pointsMap);
    killfeedPlayer({
        winner: teamOneObject.members[data.attacker_character_id].name,
        winner_faction: teamOneObject.faction,
        winner_class_id: data.attacker_loadout_id,
        winner_net_score: teamOneObject.members[data.attacker_character_id].netEventScore,
        loser: teamOneObject.members[data.character_id].name,
        loser_faction: teamOneObject.faction,
        loser_class_id: data.character_loadout_id,
        loser_net_score: teamOneObject.members[data.character_id].eventNetScore,
        weapon: item.name,
        is_kill: true
    });
}

function teamTwoTeamkill (data, pointsMap, item) {
    team.twoTeamKill(data.attacker_character_id, data.character_id, data.attacker_loadout_id, data.character_loadout_id, pointsMap);
    killfeedPlayer({
        winner: teamTwoObject.members[data.attacker_character_id].name,
        winner_faction: teamTwoObject.faction,
        winner_class_id: data.attacker_loadout_id,
        winner_net_score: teamTwoObject.members[data.attacker_character_id].netEventScore,
        loser: teamTwoObject.members[data.character_id].name,
        loser_faction: teamTwoObject.faction,
        loser_class_id: data.character_loadout_id,
        loser_net_score: teamTwoObject.members[data.character_id].eventNetScore,
        weapon: item.name,
        is_kill: true
    });
}

//#endregion

function itsFacilityData(data) {
    var capturingOutfitName;

    // Only count Defenses as Captures on Jaeger
    if (data.new_faction_id !== data.old_faction_id || data.world_id === 17) {
        if (data.outfit_id === teamOneObject.outfit_id || data.outfit_id === teamTwoObject.outfit_id) {
            capturingOutfitName = data.outfit_id === teamOneObject.outfit_id ? teamOneObject.name : teamTwoObject.name;
            endRoundEarly(data.new_faction_id, capturingOutfitName);
        }
    } else if (data.world_id === 17) {
        if (data.outfit_id === teamOneObject.outfit_id || data.outfit_id === teamTwoObject.outfit_id) {
            capturingOutfitName = data.outfit_id === teamOneObject.outfit_id ? teamOneObject.name : teamTwoObject.name;
            endRoundEarly(data.new_faction_id, capturingOutfitName);
        }
    }
    
    teamOneObject = team.getT1();
    teamTwoObject = team.getT2();
}

function itsExperienceData(data) {
    // console.log('processing data: ' + data.experience_id + ' | ' + data.character_id + ' (' + data.loadout_id + ')');
    if (teamOneObject.members.hasOwnProperty(data.character_id)) {
       let xpID = parseInt(data.experience_id);
       let characterName = teamOneObject.members[data.character_id].name;
       // Revive Data
        if (allXpIdsRevives.includes(xpID && teamOneObject.members.hasOwnProperty(data.other_id))) {
            teamOneRevive(data, objectivePointsMap);
            console.log('Team 1 Revive: ' + characterName);
        }

        else if (allXpIdsDmgAssists.includes(xpID)) {
            teamOneDmgAssist(data, objectivePointsMap);
            console.log('Team 1 Dmg Assist: ' + characterName);
        }

        else if (allXpIdsUtilAssists.includes(xpID)) {
            teamOneUtilAssist(data, objectivePointsMap);
            console.log('Team 1 Util Assist: ' + characterName);
        }

        else if (allXpIdsPointControls.includes(xpID)) {
            teamOnePointControl(data, objectivePointsMap);
            console.log('Team 1 Point Control: ' + characterName);
        }
    }

    else if (teamTwoObject.members.hasOwnProperty(data.character_id)) {
        let xpID = parseInt(data.experience_id);
        let characterName = teamTwoObject.members[data.character_id].name;
        // Team 2 Revive
        if (allXpIdsRevives.includes(xpID) && teamTwoObject.members.hasOwnProperty(data.other_id)) {
            teamTwoRevive(data, objectivePointsMap);
            console.log('Team 2 Revive: ' + characterName);
        }

        else if (allXpIdsDmgAssists.includes(xpID)) {
            teamTwoDmgAssist(data, objectivePointsMap);
            console.log('Team 2 Dmg Assist: ' + characterName);
        }

        else if (allXpIdsUtilAssists.includes(xpID)) {
            teamTwoUtilAssist(data, objectivePointsMap);
            console.log('Team 2 Util Assist: ' + characterName);
        }

        else if (allXpIdsPointControls.includes(xpID)) {
            teamTwoPointControl(data, objectivePointsMap);
            console.log('Team 2 Point Control: ' + characterName);
        }
    }

    teamOneObject = team.getT1();
    teamTwoObject = team.getT2();
}

//#region Discrete Experience Event Handling

function teamOneRevive(data, pointsMap) {
    team.oneRevive(data.character_id, data.other_id, data.loadout_id, pointsMap);
    let loserName = teamOneObject.members.hasOwnProperty(data.other_id) ? teamOneObject.members[data.other_id].name : 'Random Pubbie';
    killfeedPlayer({
        winner: teamOneObject.members[data.character_id].name,
        winner_faction: teamOneObject.faction,
        winner_class_id: data.loadout_id,
        winner_net_score: teamOneObject.members[data.character_id].eventNetScore,
        loser: loserName,
        loser_faction: teamOneObject.faction,
        loser_net_score: teamOneObject.members[data.other_id].eventNetScore,
        weapon: 'Revive',
        is_revive: true
    });
}

function teamTwoRevive(data, pointsMap) {
    team.twoRevive(data.character_id, data.other_id, data.loadout_id, pointsMap);
    if (teamTwoObject.members.hasOwnProperty(data.other_id)) {
        var loserName = 'Random Pubbie';
        var score = 'loserName';
    }
    else {
        var loserName = teamTwoObject.members[data.other_id].name;
        var score = teamTwoObject.members[data.other_id].eventNetScore;
    }
    killfeedPlayer({
        winner: teamTwoObject.members[data.character_id].name,
        winner_faction: teamTwoObject.faction,
        winner_class_id: data.loadout_id,
        winner_net_score: teamTwoObject.members[data.character_id].eventNetScore,
        loser: loserName,
        loser_faction: teamTwoObject.faction,
        loser_net_score: teamTwoObject.members[data.other_id].eventNetScore,
        weapon: 'Revive',
        is_revive: true
    });
}

function teamOneDmgAssist(data, pointsMap) {
    team.oneDmgAssist(data.character_id, data.loadout_id, pointsMap);
    killfeedPlayer({
        winner: teamOneObject.members[data.character_id].name,
        winner_faction: teamOneObject.faction,
        winner_class_id: data.loadout_id,
        winner_net_score: teamOneObject.members[data.character_id].eventNetScore,
        weapon: 'Dmg Assist',
        is_assist: true
    });
}

function teamTwoDmgAssist(data, pointsMap) {
    team.twoDmgAssist(data.character_id, data.loadout_id, pointsMap);
    killfeedPlayer({
        winner: teamTwoObject.members[data.character_id].name,
        winner_faction: teamTwoObject.faction,
        winner_class_id: data.loadout_id,
        winner_net_score: teamTwoObject.members[data.character_id].eventNetScore,
        weapon: 'Dmg Assist',
        is_assist: true
    });
}

function teamOneUtilAssist(data, pointsMap) {
    team.oneUtilAssist(data.character_id, data.loadout_id, pointsMap);
    killfeedPlayer({
        winner: teamOneObject.members[data.character_id].name,
        winner_faction: teamOneObject.faction,
        winner_class_id: data.loadout_id,
        winner_net_score: teamOneObject.members[data.character_id].eventNetScore,
        weapon: 'Util Assist',
        is_assist: true
    });
}

function teamTwoUtilAssist(data, pointsMap) {
    team.twoUtilAssist(data.character_id, data.loadout_id, pointsMap);
    killfeedPlayer({
        winner: teamTwoObject.members[data.character_id].name,
        winner_faction: teamTwoObject.faction,
        winner_class_id: data.loadout_id,
        winner_net_score: teamTwoObject.members[data.character_id].eventNetScore,
        weapon: 'Util Assist',
        is_assist: true
    });
}

function teamOnePointControl(data, pointsMap) {
    team.onePointControl(data.character_id, data.loadout_id, pointsMap);
    killfeedPlayer({
        winner: teamOneObject.members[data.character_id].name,
        winner_faction: teamOneObject.faction,
        winner_class_id: data.loadout_id,
        winner_net_score: teamOneObject.members[data.character_id].eventNetScore,
        weapon: 'PTFO',
        is_control: true
    });
}

function teamTwoPointControl(data, pointsMap) {
    team.twoPointControl(data.character_id, data.loadout_id, pointsMap);
    killfeedPlayer({
        winner: teamTwoObject.members[data.character_id].name,
        winner_faction: teamTwoObject.faction,
        winner_class_id: data.loadout_id,
        winner_net_score: teamTwoObject.members[data.character_id].eventNetScore,
        weapon: 'PTFO',
        is_control: true
    });
}

//#endregion

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
    var xpGainString = getExperienceIds(true, false, true, true, true, false);
    //ws.send('{"service":"event","action":"subscribe","characters":["all"],"eventNames":["Death",' + xpGainString + ']}');

    //team1 subscribing
    teamOneObject.memberArray.forEach(function (member) {
        ws.send('{"service":"event","action":"subscribe","characters":["' + member.character_id + '"],"eventNames":["Death"]}');
        ws.send('{"service":"event","action":"subscribe","characters":["' + member.character_id + '"],"eventNames":[' + xpGainString + ']}');
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
        if (socket.getRunning() === true) timeCounter--;
    }, 1000);
}

function pauseTheMatch() {
    socket.setRunning(false);
}

function resumeTheMatch() {
    socket.setRunning(true);
}

function stopTheMatch() {
    playRoundEndAudio();
    timeCounter = 0;
}

function endRoundEarly(newFactionId, outfitTag) {
    console.log(painter.green('Base Capture: [' + outfitTag + ']'));
    app.send('base captured');
    stopTheMatch();
}

function playRoundEndAudio() {
    // var audio = new Audio('./public/audio/japanese_bell.mp3');
    // audio.play();
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
        // overlay.startKillfeed();
        app.send('refresh', '');
        app.send('title', String(eventTitle));
        console.log('Match Started: ' + painter.green(eventTitle));
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
    // overlay.startKillfeed();
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
 * @param {boolean} spawns (NOT IMPLEMENTED) XP gains corresponding to respawning players
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

    if (pointControls === true) {
        for (xpIdx = 0; xpIdx < allXpIdsPointControls.length; xpIdx++) {
            let xpID = allXpIdsPointControls[xpIdx];
            xpGainString = addXpIdToXpGainString(xpID, xpGainString);
        }
    }

    if (dmgAssists === true) {
        for (xpIdx = 0; xpIdx < allXpIdsDmgAssists.length; xpIdx++) {
            let xpID = allXpIdsDmgAssists[xpIdx];
            xpGainString = addXpIdToXpGainString(xpID, xpGainString);
        }
    }
    if (utilAssists === true) {
        for (xpIdx = 0; xpIdx < allXpIdsUtilAssists.length; xpIdx++) {
            let xpID = allXpIdsUtilAssists[xpIdx];
            xpGainString = addXpIdToXpGainString(xpID, xpGainString);
        }
    }

    if (bannedTicks === true) {
        for (xpIdx = 0; xpIdx < allXpIdsBannedTicks.length; xpIdx++) {
            let xpID = allXpIdsBannedTicks[xpIdx];
            xpGainString = addXpIdToXpGainString(xpID, xpGainString);
        }
    }

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