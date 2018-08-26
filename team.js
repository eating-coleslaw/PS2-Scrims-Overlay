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

function oneIvITwo(one, two, oneClass, twoClass) {
    t1.kills++;
    t1.members[one].kills++;
    t1.members[one].eventCount++;
    t1.members[one].ps2Class = oneClass;

    t2.deaths++;
    t2.members[two].deaths++;
    t2.members[two].eventCount++;
    t2.members[two].ps2Class = twoClass;

    logScore();
}

function twoIvIOne(two, one, oneClass, twoClass) {
    t2.kills++;
    t2.members[two].kills++;
    t2.members[two].eventCount++;
    t2.members[two].ps2Class = twoClass;

    t1.deaths++;
    t1.members[one].deaths++;
    t1.members[one].eventCount++;
    t1.members[one].ps2Class = oneClass;

    logScore();
}

function oneSuicide(one, oneClass) {
    t1.deaths++;
    t1.members[one].deaths++;
    t1.members[one].eventCount++;
    t1.members[one].ps2Class = oneClass;

    logScore();
}

function twoSuicide(two, twoClass) {
    t2.deaths++;
    t2.members[two].deaths++;
    t2.members[two].eventCount++;
    t2.members[two].ps2Class = twoClass;

    logScore();
}

function oneTeamKill(killer, killed, killerClass, killedClass) {
    t1.deaths++;
    t1.teamKills++;
    t1.members[killer].teamKills++;
    t1.members[killer].eventCount++;
    t1.members[killer].ps2Class = killerClass;
    
    t1.members[killed].deaths++;
    t1.members[killed].eventCount++;
    t1.members[killed].ps2Class = killedClass;

    logScore();
}

function twoTeamKill(killer, killed, killerClass, killedClass) {
    t2.deaths++;
    t2.teamKills++;
    t2.members[killer].teamKills++;
    t2.members[killer].eventCount++;
    t2.members[killer].ps2Class = killerClass;

    t2.members[killed].deaths++;
    t2.members[killed].eventCount++;
    t2.members[killed].ps2Class = killedClass;

    logScore();
}

function oneRevive(medic, revived, medicClass) {
    t1.revives++;
    t1.members[medic].revives++;
    t1.members[medic].eventCount++;
    t1.members[medic].ps2Class = medicClass;
    
    if (t1.members.hasOwnProperty(revived)) {
        console.log(t1.members[revived].name + ' took a revive!');
        t1.members[revived].revivesTaken++;
        t1.members[revived].eventCount++;
    }
    logScore();
}

function twoRevive(medic, revived, medicClass) {
    t2.revives++;
    t2.members[medic].revives++;
    t2.members[medic].eventCount++;
    t2.members[medic].ps2Class = medicClass;

    if (t2.members.hasOwnProperty(revived)) {
        console.log(t2.members[revived].name + ' took a revive!');
        t2.members[revived].revivesTaken++;
        t2.members[revived].eventCount++;
    }
    logScore();
}

function oneDmgAssist(player, playerClass) {
    t1.dmgAssists++;
    t1.members[player].dmgAssists++;
    t1.members[player].eventCount++;
    t1.members[player].ps2Class = playerClass;
    logScore();
}

function twoDmgAssist(player, playerClass) {
    t2.dmgAssists++;
    t2.members[player].dmgAssists++;
    t2.members[player].eventCount++;
    t2.members[player].ps2Class = playerClass;
    logScore();
}

function oneUtilAssist(player, playerClass) {
    t1.utilAssists++;
    t1.members[player].utilAssists++;
    t1.members[player].eventCount++;
    t1.members[player].ps2Class = playerClass;
    logScore();
}

function twoUtilAssist(player, playerClass) {
    t2.utilAssists++;
    t2.members[player].utilAssists++;
    t2.members[player].eventCount++;
    t2.members[player].ps2Class = playerClass;
    logScore();
}

function onePointControl(player, playerClass) {
    t1.members[player].eventCount++;
    t1.members[player].ps2Class = playerClass;
    logScore();
}

function twoPointControl(player, playerClass) {
    t2.members[player].eventCount++;
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
