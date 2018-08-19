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
            ps2Class: 0,
            revives: 0,
            dmgAssists: 0,
            utilAssists: 0,
            revivesTaken: 0
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
            ps2Class: 0,
            revives: 0,
            dmgAssists: 0,
            utilAssists: 0,
            revivesTaken: 0
        };
    });
}

function getT1() { return t1; }

function getT2() { return t2; }

function oneIvITwo(one, two, oneClass, twoClass) {
    t1.kills++;
    t1.members[one].kills++;
    t1.members[one].ps2Class = oneClass;

    t2.deaths++;
    t2.members[two].deaths++;
    t2.members[two].ps2Class = twoClass;

    logScore();
}

function twoIvIOne(two, one, oneClass, twoClass) {
    t2.kills++;
    t2.members[two].kills++;
    t2.members[two].ps2Class = twoClass;

    t1.deaths++;
    t1.members[one].deaths++;
    t1.members[one].ps2Class = oneClass;

    // logging
}

function oneSuicide(one, oneClass) {
    t1.deaths++;
    t1.members[one].deaths++;
    t1.members[one].ps2Class = oneClass;

    logScore();
}

function twoSuicide(two, twoClass) {
    t2.deaths++;
    t2.members[two].deaths++;
    t2.members[two].ps2Class = twoClass;

    logScore();
}

function oneTeamKill(killer, killed, killerClass, killedClass) {
    t1.deaths++;
    t1.members[killer].ps2Class = killerClass;

    t1.members[killed].deaths++;
    t1.members[killed].ps2Class = killedClass;

    logScore();
}

function twoTeamKill(killer, killed, killerClass, killedClass) {
    t2.deaths++;
    t2.members[killer].ps2Class = killerClass;

    t2.members[killed].deaths++;
    t2.members[killed].ps2Class = killedClass;

    logScore();
}

function oneRevive(medic, revived, medicClass) {
    t1.revives++;
    t1.members[medic].ps2Class = medicClass;

    t1.members[revived].revivesTaken++;
}

function twoRevive(medic, revived, medicClass) {
    t2.revives++;
    t2.members[medic].ps2Class = medicClass;

    t2.members[revived].revivesTaken++;
}

function oneBaseCap(points) {
    t1.baseCaps++;

    // logging
    console.log(t1.name + ' captured the base +' + points);
    logScore();
}

function twoBaseCap(points) {
    t2.baseCaps++;

    // logging
    console.log(t2.name + ' captured the base +' + points);
    logScore();
}

function logScore() {
    console.log(t1.points + ' ' + t2.points);
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