/* team.js */
/**
 * Created by dylancross on 4/04/17.
 */

const app = require('./app');

let t1 = {
    alias : '',
    outfit_id : '',
    name : '',
    faction : '',
    points : 0,
    netScore : 0,
    kills : 0,
    deaths : 0,
    teamKills: 0,
    baseCaps: 0,
    members : {},
    memberArray : [],
    revives: 0,
    dmgAssists: 0,
    utilAssists: 0
};

let t2 = {
    alias : '',
    outfit_id : '',
    name : '',
    faction : '',
    points : 0,
    netScore : 0,
    kills : 0,
    deaths : 0,
    teamKills: 0,
    baseCaps: 0,
    members : {},
    memberArray : [],
    revives: 0,
    dmgAssists: 0,
    utilAssists: 0
};

function setTeams(one, two) {
    t1.alias = one.alias;
    t1.outfit_id = one.outfit_id;
    t1.name = one.name;
    t1.faction = one.faction;
    t1.points = 0;
    t1.netScore = 0;
    t1.kills = 0;
    t1.deaths = 0;
    t1.teamKills = 0;
    t1.baseCaps = 0;
    t1.revies = 0;
    t1.dmgAssists = 0;
    t1.utilAssists = 0;
    t1.memberArray = one.members;
    one.members.forEach(function(member) {
        t1.members[member.character_id] = {
            name: member.name,
            points: 0,
            netScore: 0,
            kills: 0,
            deaths: 0,
            teamKills: 0,
            ps2Class: 0,
            revives: 0,
            dmgAssists: 0,
            utilAssists: 0,
            revivesTaken: 0,
            eventCount: 0,
            eventNetScore: 0
        };
    });

    t2.alias = two.alias;
    t2.outfit_id = two.outfit_id;
    t2.name = two.name;
    t2.faction = two.faction;
    t2.points = 0;
    t2.netScore = 0;
    t2.kills = 0;
    t2.deaths = 0;
    t2.teamKills = 0;
    t2.baseCaps = 0;
    t2.revies = 0;
    t2.dmgAssists = 0;
    t2.utilAssists = 0;
    t2.memberArray = two.members;
    two.members.forEach(function(member) {
        t2.members[member.character_id] = {
            name: member.name,
            points: 0,
            netScore: 0,
            kills: 0,
            deaths: 0,
            teamKills: 0,
            ps2Class: 0,
            revives: 0,
            dmgAssists: 0,
            utilAssists: 0,
            revivesTaken: 0,
            eventCount: 0,
            eventNetScore: 0
        };
    });
}

function getT1() { return t1; }

function getT2() { return t2; }

function oneIvITwo(one, two, oneClass, twoClass, pointsMap) {
    t1.kills++;
    t1.members[one].kills++;
    t1.members[one].eventCount++;
    if (t1.members[one].eventNetScore !== undefined) { t1.members[one].eventNetScore += pointsMap.kill;}
    else { t1.members[one].eventNetScore = pointsMap.kill;}
    t1.members[one].ps2Class = oneClass;

    t2.deaths++;
    t2.members[two].deaths++;
    t2.members[two].eventCount++;
    if (t2.members[two].eventNetScore !== undefined) { t2.members[two].eventNetScore += pointsMap.death;}
    else { t2.members[two].eventNetScore = pointsMap.death;}
    t2.members[two].ps2Class = twoClass;

    logScore();
}

function twoIvIOne(two, one, oneClass, twoClass, pointsMap) {
    t2.kills++;
    t2.members[two].kills++;
    t2.members[two].eventCount++;
    if (t2.members[two].eventNetScore !== undefined) { t2.members[two].eventNetScore += pointsMap.kill;}
    else { t2.members[two].eventNetScore = pointsMap.kill;}
    t2.members[two].ps2Class = twoClass;

    t1.deaths++;
    t1.members[one].deaths++;
    t1.members[one].eventCount++;
    if (t1.members[one].eventNetScore !== undefined) { t1.members[one].eventNetScore += pointsMap.death;}
    else { t1.members[one].eventNetScore = pointsMap.death;}
    t1.members[one].ps2Class = oneClass;

    logScore();
}

function oneSuicide(one, oneClass, pointsMap) {
    t1.deaths++;
    t1.members[one].deaths++;
    t1.members[one].eventCount++;
    if (t1.members[one].eventNetScore !== undefined) { t1.members[one].eventNetScore += pointsMap.suicide;}
    else { t1.members[one].eventNetScore = pointsMap.suicide;}
    t1.members[one].ps2Class = oneClass;

    logScore();
}

function twoSuicide(two, twoClass, pointsMap) {
    t2.deaths++;
    t2.members[two].deaths++;
    t2.members[two].eventCount++;
    if (t2.members[two].eventNetScore !== undefined) { t2.members[two].eventNetScore += pointsMap.suicide;}
    else {t2.members[two].eventNetScore = pointsMap.suicide;}
    t2.members[two].ps2Class = twoClass;

    logScore();
}

function oneTeamKill(killer, killed, killerClass, killedClass, pointsMap) {
    t1.deaths++;
    t1.teamKills++;
    t1.members[killer].teamKills++;
    t1.members[killer].eventCount++;
    if (t1.members[killer].eventNetScore !== undefined) { t1.members[killer].eventNetScore += pointsMap.teamkill;}
    else {t1.members[killer].eventNetScore = pointsMap.teamkill;}
    t1.members[killer].ps2Class = killerClass;
    
    t1.members[killed].deaths++;
    t1.members[killed].eventCount++;
    if (t1.members[killed].eventNetScore !== undefined) { t1.members[killed].eventNetScore += pointsMap.tkDeath;}
    else {t1.members[killed].eventNetScore = pointsMap.tkDeath;}
    t1.members[killed].ps2Class = killedClass;

    logScore();
}

function twoTeamKill(killer, killed, killerClass, killedClass, pointsMap) {
    t2.deaths++;
    t2.teamKills++;
    t2.members[killer].teamKills++;
    t2.members[killer].eventCount++;
    if (t2.members[killer].eventNetScore !== undefined) { t2.members[killer].eventNetScore += pointsMap.teamkill;}
    else {t2.members[killer].eventNetScore = pointsMap.teamkill;}
    t2.members[killer].ps2Class = killerClass;

    t2.members[killed].deaths++;
    t2.members[killed].eventCount++;
    if (t2.members[killed].eventNetScore !== undefined) { t2.members[killed].eventNetScore += pointsMap.tkDeath;}
    else { t2.members[killed].eventNetScore = pointsMap.tkDeath;}
    t2.members[killed].ps2Class = killedClass;

    logScore();
}

function oneRevive(medic, revived, medicClass, pointsMap) {
    t1.revives++;
    t1.members[medic].revives++;
    t1.members[medic].eventCount++;
    if (t1.members[medic].eventNetScore !== undefined) { t1.members[medic].eventNetScore += pointsMap.revive;}
    else {t1.members[medic].eventNetScore = pointsMap.revive;}
    t1.members[medic].ps2Class = medicClass;
    
    if (t1.members.hasOwnProperty(revived)) {
        console.log(t1.members[revived].name + ' took a revive!');
        t1.members[revived].revivesTaken++;
        t1.members[revived].eventCount++;
        if (t1.members[revived].eventNetScore !== undefined) { t1.members[revived].eventNetScore += pointsMap.reviveTaken;}
        else { t1.members[revived].eventNetScore = pointsMap.reviveTaken;}
    }
    logScore();
}

function twoRevive(medic, revived, medicClass, pointsMap) {
    t2.revives++;
    t2.members[medic].revives++;
    t2.members[medic].eventCount++;
    if (t2.members[medic].eventNetScore !== undefined) { t2.members[medic].eventNetScore += pointsMap.revive;}
    else { t2.members[medic].eventNetScore = pointsMap.revive;};
    t2.members[medic].ps2Class = medicClass;

    if (t2.members.hasOwnProperty(revived)) {
        console.log(t2.members[revived].name + ' took a revive!');
        t2.members[revived].revivesTaken++;
        t2.members[revived].eventCount++;
        if (t2.members[revived].eventNetScore !== undefined) { t2.members[revived].eventNetScore += pointsMap.reviveTaken;}
        else {t2.members[revived].eventNetScore = pointsMap.reviveTaken;}
    }
    logScore();
}

function oneDmgAssist(player, playerClass, pointsMap) {
    t1.dmgAssists++;
    t1.members[player].dmgAssists++;
    t1.members[player].eventCount++;
    // t1.members[player].eventNetScore += pointsMap.dmgAssist;
    if (t1.members[player].eventNetScore !== undefined) { t1.members[player].eventNetScore += pointsMap.dmgAssist;}
    else { t1.members[player].eventNetScore = pointsMap.dmgAssist;}
    t1.members[player].ps2Class = playerClass;
    logScore();
}

function twoDmgAssist(player, playerClass, pointsMap) {
    t2.dmgAssists++;
    t2.members[player].dmgAssists++;
    t2.members[player].eventCount++;
    // t2.members[player].eventNetScore += pointsMap.dmgAssist;
    if (t2.members[player].eventNetScore !== undefined) { t2.members[player].eventNetScore += pointsMap.dmgAssist;}
    else { t2.members[player].eventNetScore = pointsMap.dmgAssist;}
    t2.members[player].ps2Class = playerClass;
    logScore();
}

function oneUtilAssist(player, playerClass, pointsMap) {
    t1.utilAssists++;
    t1.members[player].utilAssists++;
    t1.members[player].eventCount++;
    if (t1.members[player].eventNetScore !== undefined) { t1.members[player].eventNetScore += pointsMap.utilAssist;}
    else { t1.members[player].eventNetScore = pointsMap.utilAssist;};
    t1.members[player].ps2Class = playerClass;
    logScore();
}

function twoUtilAssist(player, playerClass, pointsMap) {
    t2.utilAssists++;
    t2.members[player].utilAssists++;
    t2.members[player].eventCount++;
    if (t2.members[player].eventNetScore !== undefined) { t2.members[player].eventNetScore += pointsMap.utilAssist;}
    else { t2.members[player].eventNetScore = pointsMap.utilAssist;};
    t2.members[player].ps2Class = playerClass;
    logScore();
}

function onePointControl(player, playerClass, pointsMap) {
    t1.members[player].eventCount++;
    if (t1.members[player].eventNetScore !== undefined) { t1.members[player].eventNetScore += pointsMap.control;}
    else { t1.members[player].eventNetScore = pointsMap.control;};
    t1.members[player].ps2Class = playerClass;
    logScore();
}

function twoPointControl(player, playerClass, pointsMap) {
    t2.members[player].eventCount++;
    if (t2.members[player].eventNetScore !== undefined) { t2.members[player].eventNetScore += pointsMap.control;}
    else { t2.members[player].eventNetScore = pointsMap.control;}
    t2.members[player].ps2Class = playerClass;
    logScore();
}


function oneBaseCap() {
    t1.baseCaps++;
    logScore();
}

function twoBaseCap() {
    t2.baseCaps++;
    logScore();
}

function logScore() {
    sendScores();
}

function sendScores() {
    app.send('score', { teamOne: t1, teamTwo: t2 });
}

exports.setTeams    = setTeams;
exports.getT1       = getT1;
exports.getT2       = getT2;
exports.oneIvITwo   = oneIvITwo;
exports.twoIvIOne   = twoIvIOne;
exports.oneSuicide  = oneSuicide;
exports.twoSuicide  = twoSuicide;
exports.oneTeamKill = oneTeamKill;
exports.twoTeamKill = twoTeamKill;
exports.oneBaseCap  = oneBaseCap;
exports.twoBaseCap  = twoBaseCap;
exports.oneRevive   = oneRevive;
exports.twoRevive   = twoRevive;
exports.oneDmgAssist = oneDmgAssist;
exports.twoDmgAssist = twoDmgAssist;
exports.oneUtilAssist = oneUtilAssist;
exports.twoUtilAssist = twoUtilAssist;
exports.onePointControl = onePointControl;
exports.twoPointControl = twoPointControl;
