/**
 * Created by dylancross on 4/04/17.
 */

const app     = require('./app');
const painter = require('./painter.js');

let t1 = {
    alias : '',
    outfit_id : '',
    name : '',
    faction : '',
    points : 0,
    netScore : 0,
    pointAdjustments: {},
    kills : 0,
    deaths : 0,
    headshots: 0,
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
    pointAdjustments: {},
    kills : 0,
    deaths : 0,
    headshots: 0,
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
            headshots: 0,
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
            headshots: 0,
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

//#region Kill/Death Handling

function oneIvITwo(killer, killed, killerClass, killedClass, points, isHeadshot) {
    t1.kills++;
    t1.points += points;
    t1.netScore += points;

    t1.members[killer].kills++;
    t1.members[killer].eventCount++;
    t1.members[killer].points += points;
    t1.members[killer].netScore += points;
    t1.members[killer].ps2Class = killerClass;

    if ( isHeadshot === true ) {
        t1.headshots += 1;
        t1.members[killer].headshots += 1;
    }

    t2.deaths++;
    t2.netScore -= points;
    
    t2.members[killed].deaths++;
    t2.members[killed].eventCount++;
    t2.members[killed].netScore -= points;
    t2.members[killed].ps2Class = killedClass;

    // logging
    // console.log(t1.members[one].name + ' (' + t1.members[one].ps2Class + ') -->  ' + t2.members[two].name + ' (' + t2.members[two].ps2Class + ') for ' + points + ' points (' + item.name + ')');
    logScore();
}

function twoIvIOne(killer, killed, killerClass, killedClass, points, isHeadshot) {
    t2.kills++;
    t2.points += points;
    t2.netScore += points;

    t2.members[killer].kills++;
    t2.members[killer].eventCount++;
    t2.members[killer].points += points;
    t2.members[killer].netScore += points;
    t2.members[killer].ps2Class = killerClass;

    if ( isHeadshot === true ) {
        t2.headshots += 1;
        t2.members[killer].headshots += 1;
    }

    t1.deaths++;
    t1.netScore -= points;

    t1.members[killed].deaths++;
    t1.members[killed].eventCount++;
    t1.members[killed].netScore -= points;
    t1.members[killed].ps2Class = killedClass;

    // logging
    // console.log(t2.members[two].name + ' -->  ' + t1.members[one].name + ' for ' + points + ' points (' + item.name + ')');
    logScore();
}

function oneSuicide(one, oneClass, points) {
    t1.deaths++;
    t1.points += points;
    t1.netScore += points;
    
    t1.members[one].deaths++;
    t1.members[one].eventCount++;
    t1.members[one].points += points;
    t1.members[one].netScore += points;
    t1.members[one].ps2Class = oneClass;

    // logging
    console.log(t1.members[one].name + ' killed themselves ' + points);
    logScore();
}

function twoSuicide(two, twoClass, points) {
    t2.deaths++;
    t2.points += points;
    t2.netScore += points;
    
    t2.members[two].deaths++;
    t2.members[two].eventCount++;
    t2.members[two].points += points;
    t2.members[two].netScore += points;
    t2.members[two].ps2Class = twoClass;

    //logging
    console.log(t2.members[two].name + ' killed themselves ' + points);
    logScore();
}

function oneTeamKill(killer, killed, killerClass, killedClass, points, isHeadshot) {
    t1.deaths++;
    t1.teamKills++;
    t1.points += points;
    t1.netScore += points;

    t1.members[killer].teamKills++;
    t1.members[killer].eventCount++;
    t1.members[killer].points += points;
    t1.members[killer].netScore += points;
    t1.members[killer].ps2Class = killerClass;
    
    if ( isHeadshot === true ) {
        t1.headshots += 1;
        t1.members[killer].headshots += 1;
    }

    t1.members[killed].deaths++;
    t1.members[killed].eventCount++;
    t1.members[killed].ps2Class = killedClass;

    // logging
    console.log(t1.members[killer].name + ' team killed ' + t1.members[killed].name + ' ' + points);
    logScore();
}

function twoTeamKill(killer, killed, killerClass, killedClass, points, isHeadshot) {
    t2.deaths++;
    t2.teamKills++;
    t2.points += points;
    t2.netScore += points;
    
    t2.members[killer].teamKills++;
    t2.members[killer].eventCount++;
    t2.members[killer].points += points;
    t2.members[killer].netScore += points;
    t2.members[killer].ps2Class = killerClass;

    if ( isHeadshot === true ) {
        t2.headshots += 1;
        t2.members[killer].headshots += 1;
    }

    t2.members[killed].deaths++;
    t2.members[killed].eventCount++;
    t2.members[killed].ps2Class = killedClass;

    // logging
    console.log(t2.members[killer].name + ' team killed ' + t2.members[killed].name + ' ' + points);
    logScore();
}

//#endregion Kill/Death Handling

//#region Revive Experience Handling

function oneRevive(medic, revived, medicClass) {
    t1.revives++;
    t1.members[medic].revives++;
    t1.members[medic].eventCount++;
    t1.members[medic].ps2Class = medicClass;
    
    if (t1.members.hasOwnProperty(revived)) {
        console.log(painter.faction(t1.members[revived].name, t1.faction) + painter.lightGreen(' took a revive!'));
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
        console.log(painter.faction(t2.members[revived].name, t2.faction) + painter.green(' took a revive!'));
        t2.members[revived].revivesTaken++;
        t2.members[revived].eventCount++;
    }
    logScore();
}

//#endregion Revive Experience Handling

//#region Assist Experience Handling

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

//#endregion Assist Experience Handling

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

function oneBaseCap(points) {
    t1.baseCaps++;
    t1.points += points;
    t1.netScore += points;
    t2.netScore -= points;

    // logging
    console.log(t1.name + ' captured the base +' + points);
    logScore();
}

function twoBaseCap(points) {
    t2.baseCaps++;
    t2.points += points;
    t2.netScore += points;
    t1.netScore -= points;

    // logging
    console.log(t2.name + ' captured the base +' + points);
    logScore();
}

// Adjust the scores, possibly due to sanctions imposed by an admin or other reasons...
function adjustScore(team1, team2, reason = 'other') {
    if (team1 !== '' && t1.outfit_id !== '') {
        if (!isNaN(team1)) {
            team1 = parseInt(team1);
            t1.points += team1;
            t1.netScore += team1;
            // t2.netScore -= team1;
            
            // Check if team has already been sanctioned
            if (t1.pointAdjustments.hasOwnProperty(reason)) {
                t1.pointAdjustments[reason].points += team1;
                t1.pointAdjustments[reason].netScore += team1;
            } else {
                t1.pointAdjustments[reason] = {
                    reason: reason,
                    points: team1,
                    netScore: team1,
                };
            }
        }
    }
    if (team2 !== '' && t2.outfit_id !== '') {
        if (!isNaN(team2)) {
            team2 = parseInt(team2);
            t2.points += team2;
            t2.netScore += team2;
            // t1.netScore -= team2;
            
            // Check if team has already been sanctioned
            if (t2.pointAdjustments.hasOwnProperty(reason)) {
                t2.pointAdjustments[reason].points += team2;
                t2.pointAdjustments[reason].netScore += team2;
            } else {
                t2.pointAdjustments[reason] = {
                    reason: reason,
                    points: team2,
                    netScore: team2,
                };
            }
        }
    }
}

function logScore() {
    // console.log(t1.points + ' ' + t2.points);
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
exports.adjustScore = adjustScore;
exports.oneRevive   = oneRevive;
exports.twoRevive   = twoRevive;
exports.oneDmgAssist = oneDmgAssist;
exports.twoDmgAssist = twoDmgAssist;
exports.oneUtilAssist = oneUtilAssist;
exports.twoUtilAssist = twoUtilAssist;
exports.onePointControl = onePointControl;
exports.twoPointControl = twoPointControl;