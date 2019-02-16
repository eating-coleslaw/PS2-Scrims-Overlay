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

const debugLogs = false;

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
    '23' : { "action" : "Infantry v Max",          points : 12,  id : "class23"},
    '24' : { "action" : "Max TK",                  points : -15, id : "class24"},
    'name': 'Planetside Infantry League Ruleset'
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
    if (event.class24 !== '') { pointMap['24'].points = event.class24; }
    pointMap.name = 'Custom';
}

const objectivePointsMap = {
    revive: 2,
    kill: 3, //2,
    dmgAssist: 1,
    utilAssist: 1,
    control: 2, //3,
    death: -8, //-6, //-4,
    teamkill: -10, //-6, //-5,
    tkDeath: -2, //-1,
    suicide: -10, //-6, //-5,
    reviveTaken: 1
}


function getRound() { return roundTracker; }

function killfeedPlayer(obj) {
    app.send('killfeed', obj);
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
    team.twoBaseCap(points);
}

function dealWithTheData(raw) {
    raw = raw.replace(': :', ':');
    const data = JSON.parse(raw).payload;
    switch(data.event_name) {
        case "Death":
            itsPlayerData(data);
            break;
            
        case "PlayerFacilityCapture":
            itsPlayerFacilityData(data);
            break;

        case "PlayerFacilityDefend":
            itsPlayerFacilityData(data);
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

// deals with adding points to the correct player & team
function itsPlayerData(data) {
    //console.log(data);
    let item = items.lookupItem(data.attacker_weapon_id);
    var faction1 = teamOneObject.faction;
    var faction2 = teamTwoObject.faction;
    let points = items.lookupPointsfromCategory(item.category_id);
    let killerIsMax = isMaxLoadout(data.attacker_loadout_id);
    let victimIsMax = isMaxLoadout(data.character_id);


    // Team 1 Killer
    if (teamOneObject.members.hasOwnProperty(data.attacker_character_id)) {
        var name1 = teamOneObject.members[data.attacker_character_id].name;
        
        // One IVI Two || One Max Two
        if (teamTwoObject.members.hasOwnProperty(data.character_id)) {
            if (killerIsMax === true) {
                points = victimIsMax ? pointMap['12'].points : pointMap['11'].points;
            }
            else {
                points = victimIsMax ? pointMap['23'].points : points;
            }
            oneIvITwo(data, points, item);
        }
        
        //One Suicide || One Max Suicide
        else if (data.attacker_character_id === data.character_id) {
            points = killerIsMax ? pointMap['13'].points : pointMap['22'].points;
            teamOneSuicide(data, points, item);
        }

        // One TK || One TK Max
        else if (teamOneObject.members.hasOwnProperty(data.character_id)) {
            points = victimIsMax ? pointMap['24'].points : pointMap['21'].points;
            teamOneTeamkill(data, points, item);
        }
    }

    // Team 2 Killer
    else if (teamTwoObject.members.hasOwnProperty(data.attacker_character_id)) {
        var name2 = teamTwoObject.members[data.attacker_character_id].name;

        // Two IVI One || Two Max One
        if (teamOneObject.members.hasOwnProperty(data.character_id)) {
            if (killerIsMax === true) {
                points = victimIsMax ? pointMap['12'].points : pointMap['11'].points;
            }
            else {
                points = victimIsMax ? pointMap['23'].points : points;
            }
            twoIvIOne(data, points, item);
        }

        // Two Suicide || Two Max Suicide
        else if (data.attacker_character_id === data.character_id) {
            points = killerIsMax ? pointMap['13'].points : pointMap['22'].points;
            teamTwoSuicide(data, points, item);
        }
        
        // Two TK || Two TK Max
        else if (teamTwoObject.members.hasOwnProperty(data.character_id)) {
            points = victimIsMax ? pointMap['24'].points : pointMap['21'].points;
            teamTwoTeamkill(data, points, item);
        }
    }

    // One of the players isn't involved in the match
    else {
        if (debugLogs === true) {
            console.log(painter.gray('   !!! Possible Match Interruption !!!'));
            console.log(painter.gray('         winner: ' + data.attacker_character_id));
            console.log(painter.gray('         loser:  ' + data.character_id));
        }
        return;
    }

    teamOneObject = team.getT1();
    teamTwoObject = team.getT2();

}

function isMaxLoadout(loadout) {
    if ((loadout === '7') || (loadout === '14') || (loadout === '21')) { return true; }
    else { return false; }
}

//#region Discrete Player Event Handling

function oneIvITwo (data, points, item) {
    team.oneIvITwo(data.attacker_character_id, data.character_id, data.attacker_loadout_id, data.character_loadout_id, points);
    killfeedPlayer({
        winner: teamOneObject.members[data.attacker_character_id].name,
        winner_faction: teamOneObject.faction,
        winner_class_id: data.attacker_loadout_id,
        winner_net_score: teamOneObject.members[data.attacker_character_id].netScore,
        loser: teamTwoObject.members[data.character_id].name,
        loser_faction: teamTwoObject.faction,
        loser_class_id: data.character_loadout_id,
        loser_net_score: teamTwoObject.members[data.character_id].netScore,
        weapon: item.name,
        points: points,
        is_kill: true
    });
}

function twoIvIOne (data, points, item) {
    team.twoIvIOne(data.attacker_character_id, data.character_id, data.attacker_loadout_id, data.character_loadout_id, points);
    killfeedPlayer({
        winner: teamTwoObject.members[data.attacker_character_id].name,
        winner_faction: teamTwoObject.faction,
        winner_class_id: data.attacker_loadout_id,
        winner_net_score: teamTwoObject.members[data.attacker_character_id].netScore,
        loser: teamOneObject.members[data.character_id].name,
        loser_faction: teamOneObject.faction,
        loser_class_id: data.character_loadout_id,
        loser_net_score: teamOneObject.members[data.character_id].netScore,
        weapon: item.name,
        points: points,
        is_kill: true
    });
}

function teamOneSuicide (data, points, item) {
    team.oneSuicide(data.attacker_character_id, data.attacker_loadout_id, points);
    killfeedPlayer({
        winner: teamOneObject.members[data.attacker_character_id].name,
        winner_faction: teamOneObject.faction,
        winner_class_id: data.attacker_loadout_id,
        winner_net_score: teamOneObject.members[data.attacker_character_id].netScore,
        loser: teamOneObject.members[data.character_id].name,
        loser_faction: teamOneObject.faction,
        loser_class_id: data.character_loadout_id,
        loser_net_score: teamOneObject.members[data.character_id].netScore,
        weapon: item.name,
        points: points,
        is_kill: true
    });
}

function teamTwoSuicide (data, points, item) {
    team.twoSuicide(data.attacker_character_id, data.attacker_loadout_id, points);
    killfeedPlayer({
        winner: teamTwoObject.members[data.attacker_character_id].name,
        winner_faction: teamTwoObject.faction,
        winner_class_id: data.attacker_loadout_id,
        winner_net_score: teamTwoObject.members[data.attacker_character_id].netScore,
        loser: teamTwoObject.members[data.character_id].name,
        loser_faction: teamTwoObject.faction,
        loser_class_id: data.character_loadout_id,
        loser_net_score: teamTwoObject.members[data.character_id].netScore,
        weapon: item.name,
        points: points,
        is_kill: true
    });
}

function teamOneTeamkill (data, points, item) {
    team.oneTeamKill(data.attacker_character_id, data.character_id, data.attacker_loadout_id, data.character_loadout_id, points);
    killfeedPlayer({
        winner: teamOneObject.members[data.attacker_character_id].name,
        winner_faction: teamOneObject.faction,
        winner_class_id: data.attacker_loadout_id,
        winner_net_score: teamOneObject.members[data.attacker_character_id].netScore,
        loser: teamOneObject.members[data.character_id].name,
        loser_faction: teamOneObject.faction,
        loser_class_id: data.character_loadout_id,
        loser_net_score: teamOneObject.members[data.character_id].netScore,
        weapon: item.name,
        points: points,
        is_kill: true
    });
}

function teamTwoTeamkill (data, points, item) {
    team.twoTeamKill(data.attacker_character_id, data.character_id, data.attacker_loadout_id, data.character_loadout_id, points);
    killfeedPlayer({
        winner: teamTwoObject.members[data.attacker_character_id].name,
        winner_faction: teamTwoObject.faction,
        winner_class_id: data.attacker_loadout_id,
        winner_net_score: teamTwoObject.members[data.attacker_character_id].netScore,
        loser: teamTwoObject.members[data.character_id].name,
        loser_faction: teamTwoObject.faction,
        loser_class_id: data.character_loadout_id,
        loser_net_score: teamTwoObject.members[data.character_id].netScore,
        weapon: item.name,
        points: points,
        is_kill: true
    });
}

//#endregion

function itsPlayerFacilityData(data) {
    var char_id = data.character_id,
        t1 = teamOneObject,
        t2 = teamTwoObject;

    // Team 1 Captured or Defended the base
    if (t1.members.hasOwnProperty(char_id)) {
        console.log(painter.faction('Team 1 Player Facility Capture', t1.faction));
        foundRoundCapture = true;
    }
    else if (t2.members.hasOwnProperty(char_id)) {
        console.log(painter.faction('Team 2 Player Facility Capture', t2.faction));
        foundRoundCapture = true;
    }

    teamOneObject = team.getT1();
    teamTwoObject = team.getT2();

}

//TODO: Add working base capture logic
function itsFacilityData(data) {
    return;
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
        teamOneObject = team.getT1();
        teamTwoObject = team.getT2();
    }
}

function itsExperienceData(data) {
    if (teamOneObject.members.hasOwnProperty(data.character_id)) {
       let xpID = parseInt(data.experience_id);
       let characterName = teamOneObject.members[data.character_id].name;
       let faction = teamOneObject.faction;
       
       // Team 1 Revive
        if (allXpIdsRevives.includes(xpID && teamOneObject.members.hasOwnProperty(data.other_id))) {
            teamOneRevive(data);
            console.log(painter.lightGreen('Team 1 Revive: ') + painter.faction(characterName, faction));
        }
        
        // Team 1 Damage Assist
        else if (allXpIdsDmgAssists.includes(xpID)) {
            teamOneDmgAssist(data);
            console.log(painter.lightPurple('Team 1 Dmg Assist: ') + painter.faction(characterName, faction));
        }

        // Team 1 Utility Assist
        else if (allXpIdsUtilAssists.includes(xpID)) {
            teamOneUtilAssist(data);
            console.log(painter.lightYellow('Team 1 Util Assist: ') + painter.faction(characterName, faction));
        }

        // Team 1 Point Control Tick
        else if (allXpIdsPointControls.includes(xpID)) {
            teamOnePointControl(data);
            console.log(painter.yellow('Team 1 Point Control: ') + painter.faction(characterName, faction));
        }
    }

    else if (teamTwoObject.members.hasOwnProperty(data.character_id)) {
        let xpID = parseInt(data.experience_id);
        let characterName = teamTwoObject.members[data.character_id].name;
        let faction = teamTwoObject.faction;
        
        // Team 2 Revive
        if (allXpIdsRevives.includes(xpID) && teamTwoObject.members.hasOwnProperty(data.other_id)) {
            teamTwoRevive(data);
            console.log(painter.lightGreen('Team 2 Revive: ') + painter.faction(characterName, faction));
        }

        else if (allXpIdsDmgAssists.includes(xpID)) {
            teamTwoDmgAssist(data);
            console.log(painter.lightPurple('Team 2 Dmg Assist: ') + painter.faction(characterName, faction));
        }

        else if (allXpIdsUtilAssists.includes(xpID)) {
            teamTwoUtilAssist(data);
            console.log(painter.lightYellow('Team 2 Util Assist: ') + painter.faction(characterName, faction));
        }

        else if (allXpIdsPointControls.includes(xpID)) {
            teamTwoPointControl(data);
            console.log(painter.yellow('Team 2 Point Control: ') + painter.faction(characterName, faction));
        }
    }

    teamOneObject = team.getT1();
    teamTwoObject = team.getT2();
}

//#region Discrete Experience Event Handling

function teamOneRevive(data) {
    team.oneRevive(data.character_id, data.other_id, data.loadout_id);
    let loserName = teamOneObject.members.hasOwnProperty(data.other_id) ? teamOneObject.members[data.other_id].name : 'Random Pubbie';
    killfeedPlayer({
        winner: teamOneObject.members[data.character_id].name,
        winner_faction: teamOneObject.faction,
        winner_class_id: data.loadout_id,
        winner_net_score: teamOneObject.members[data.character_id].netScore,
        loser: loserName,
        loser_faction: teamOneObject.faction,
        loser_net_score: teamOneObject.members[data.other_id].netScore,
        weapon: 'Revive',
        is_revive: true
    });
}

function teamTwoRevive(data) {
    team.twoRevive(data.character_id, data.other_id, data.loadout_id);
    if (teamTwoObject.members.hasOwnProperty(data.other_id)) {
        var loserName = teamTwoObject.members[data.other_id].name;
        var loserScore = teamTwoObject.members[data.other_id].netScore;
    }
    else {
        var loserName = 'Random Pubbie'
        var loserScore = '';
    }
    killfeedPlayer({
        winner: teamTwoObject.members[data.character_id].name,
        winner_faction: teamTwoObject.faction,
        winner_class_id: data.loadout_id,
        winner_net_score: teamTwoObject.members[data.character_id].netScore,
        loser: loserName,
        loser_faction: teamTwoObject.faction,
        loser_net_score: loserScore,
        weapon: 'Revive',
        is_revive: true
    });
}

function teamOneDmgAssist(data) {
    team.oneDmgAssist(data.character_id, data.loadout_id);
    killfeedPlayer({
        winner: teamOneObject.members[data.character_id].name,
        winner_faction: teamOneObject.faction,
        winner_class_id: data.loadout_id,
        winner_net_score: teamOneObject.members[data.character_id].netScore,
        weapon: 'Dmg Assist',
        is_assist: true
    });
}

function teamTwoDmgAssist(data) {
    team.twoDmgAssist(data.character_id, data.loadout_id);
    killfeedPlayer({
        winner: teamTwoObject.members[data.character_id].name,
        winner_faction: teamTwoObject.faction,
        winner_class_id: data.loadout_id,
        winner_net_score: teamTwoObject.members[data.character_id].netScore,
        weapon: 'Dmg Assist',
        is_assist: true
    });
}

function teamOneUtilAssist(data) {
    team.oneUtilAssist(data.character_id, data.loadout_id);
    killfeedPlayer({
        winner: teamOneObject.members[data.character_id].name,
        winner_faction: teamOneObject.faction,
        winner_class_id: data.loadout_id,
        winner_net_score: teamOneObject.members[data.character_id].netScore,
        weapon: 'Util Assist',
        is_assist: true
    });
}

function teamTwoUtilAssist(data) {
    team.twoUtilAssist(data.character_id, data.loadout_id);
    killfeedPlayer({
        winner: teamTwoObject.members[data.character_id].name,
        winner_faction: teamTwoObject.faction,
        winner_class_id: data.loadout_id,
        winner_net_score: teamTwoObject.members[data.character_id].netScore,
        weapon: 'Util Assist',
        is_assist: true
    });
}

function teamOnePointControl(data) {
    team.onePointControl(data.character_id, data.loadout_id);
    killfeedPlayer({
        winner: teamOneObject.members[data.character_id].name,
        winner_faction: teamOneObject.faction,
        winner_class_id: data.loadout_id,
        winner_net_score: teamOneObject.members[data.character_id].netScore,
        weapon: 'PTFO',
        is_control: true
    });
}

function teamTwoPointControl(data) {
    team.twoPointControl(data.character_id, data.loadout_id);
    killfeedPlayer({
        winner: teamTwoObject.members[data.character_id].name,
        winner_faction: teamTwoObject.faction,
        winner_class_id: data.loadout_id,
        winner_net_score: teamTwoObject.members[data.character_id].netScore,
        weapon: 'PTFO',
        is_control: true
    });
}

//#endregion

function createStream() {
    const ws = new WebSocket('wss://push.planetside2.com/streaming?environment=ps2&service-id=s:' + api_key.KEY);
    ws.on('open', function open() {
        console.log('Stream opened...');
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

    console.log(painter.white('Subscribing to DBG websocket...'));

    //team1 subscribing
    teamOneObject.memberArray.forEach(function (member) {
        ws.send('{"service":"event","action":"subscribe","characters":["' + member.character_id + '"],"eventNames":["Death"]}');
        ws.send('{"service":"event","action":"subscribe","characters":["' + member.character_id + '"],"eventNames":[' + xpGainString + ']}');
        ws.send('{"service":"event","action":"subscribe","characters":["' + member.character_id + '"],"eventNames":["PlayerFacilityCapture","PlayerFacilityDefend"]}');
    });

    //team2 subscribing
    teamTwoObject.memberArray.forEach(function (member) {
        ws.send('{"service":"event","action":"subscribe","characters":["' + member.character_id + '"],"eventNames":["Death"]}');
        ws.send('{"service":"event","action":"subscribe","characters":["' + member.character_id + '"],"eventNames":[' + xpGainString + ']}');
        ws.send('{"service":"event","action":"subscribe","characters":["' + member.character_id + '"],"eventNames":["PlayerFacilityCapture","PlayerFacilityDefend"]}');
    });

    //facility Subscribing - subscribes to all capture data
    ws.send('{"service":"event","action":"subscribe","worlds":["1","10","13","17","19","25"],"eventNames":["FacilityControl"]}');
    
    //start timer
    startTimer(ws);

    console.log('Subscribed to facility and kill/death events between ' + painter.faction(' ' + teamOneObject.alias + ' ', teamOneObject.faction, true) + ' and ' + painter.faction(' ' + teamTwoObject.alias + ' ', teamTwoObject.faction, true));
}

function unsubscribe(ws) {
    // unsubscribes from all events
    ws.send('{"service":"event","action":"clearSubscribe","all":"true"}');
    console.log('Unsubscribed from facility and kill/death events between ' + painter.faction(' ' + teamOneObject.alias + ' ', teamOneObject.faction, true) + ' and ' + painter.faction(' ' + teamTwoObject.alias + ' ', teamTwoObject.faction, true));
}

function startTimer(ws) {
    console.log('Timer started...');
    roundTracker++;
    timeCounter = matchLength ? matchLength : 900;
    let time = setInterval(function () {
        if (timeCounter < 1) {
            clearInterval(time);
            unsubscribe(ws);
            logTeamStats();
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
    //playRoundEndAudio();
    timeCounter = 0;
}

function endRoundEarly(newFactionId, outfitTag) {
    console.log(painter.faction('Base Capture: [' + outfitTag + ']', newFactionId, true));
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
        console.log(painter.gray('====================================================================================================================================='));
        team.setTeams(oneObj, twoObj);
        teamOneObject = team.getT1();
        teamTwoObject = team.getT2();
        matchLength = secsInt;
        eventTitle = title ? title : '#BanNetcode'; //'PS2 IvI Scrims';
        createStream();
        app.send('refresh', '');
        app.send('title', String(eventTitle));
        console.log('Match Started: ' + painter.cyan(eventTitle));
        socket.setRunning(true);
    }).catch(function (err) {
        console.error(painter.red('Items did not initialise!!'));
        console.error(painter.red(err));
    });
}

function newRound() {
    console.log(painter.gray('====================================================================================================================================='));
    teamOneObject = team.getT1();
    teamTwoObject = team.getT2();
    createStream();
    app.send('refresh', '');
    app.send('title', getTitle());
    socket.setRunning(true);
}

function getTitle() {
    return eventTitle;
}

function logTeamStats() {
    console.log(painter.gray('_____'));
    console.log(painter.gray('==============================================================='));
    console.log(painter.white('                          ' + '   Pts   Net   Kll   Dth   Dmg   Utl'));
   
   var t1 = team.getT1();
   console.log(painter.faction('---------------------------------------------------------------', t1.faction));
   let name = ('[' + t1.alias + ']' + '                          ').slice(0,25);
   let stats = getStatsString(t1.points, t1.netScore, t1.kills, t1.deaths, t1.dmgAssists, t1.utilAssists);
   console.log(painter.faction(name, t1.faction) + ' ' + painter.white(stats));
   
   m = t1.members;
   for (keys in m) {
       player = m[keys];
       if (player.kills > 0 || player.deaths > 0 || player.teamKills > 0 || player.dmgAssists > 0 || player.utilAssists) {
            name = padLabelRight(player.name);
            stats = getStatsString(player.points, player.netScore, player.kills, player.deaths, player.dmgAssists, player.utilAssists);
            console.log(painter.white(name + ' ' + stats));
        }
    }

    var t2 = team.getT2();
    console.log(painter.faction('---------------------------------------------------------------', t2.faction));
    name = ('[' + t2.alias + ']' + '                          ').slice(0,25);
    stats = getStatsString(t2.points, t2.netScore, t2.kills, t2.deaths, t2.dmgAssists, t2.utilAssists);
    console.log(painter.faction(name, t2.faction) + ' ' + painter.white(stats));
    
    m = t2.members;
    for (keys in m) {
        player = m[keys];
        if (player.kills > 0 || player.deaths > 0 || player.teamKills > 0 || player.dmgAssists > 0 || player.utilAssists) {
            name = padLabelRight(player.name);
            stats = getStatsString(player.points, player.netScore, player.kills, player.deaths, player.dmgAssists, player.utilAssists);
            console.log(painter.white(name + ' ' + stats));
        }
    }

    console.log(painter.gray('==============================================================='));
    console.log(painter.gray('*****'));
}

function padLabelRight(label) {
    if (label.length > 25) {
        label = label.slice(0,22) + '...';
    }
    return ' ' + (label + '                          ').slice(0,24);
}

function getStatsString(points, netScore, kills, deaths, dmgAssists, utilAssists) {
    var pts = padStatLeft(points),
        net = padStatLeft(netScore),
        kll = padStatLeft(kills),
        dth = padStatLeft(deaths),
        dmg = padStatLeft(dmgAssists),
        utl = padStatLeft(utilAssists);
    return pts + net + kll + dth + dmg + utl; 
}

function padStatLeft(stat) {
    return ' ' + ('     ' + stat).slice(-5);
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

//#region Experience Gain ID Arrays

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
    36,     // Spot Kill (20xp)
    54,     // Squad Spot Kill (30xp)
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

//#endregion

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