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
    revives: 0,
    damageAssists: 0,
    utilityAssists: 0,
    members : {},
    memberArray : [],
    classArray: []
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
    revives: 0,
    damageAssists: 0,
    utilityAssists: 0,
    members : {},
    memberArray : [],
    classArray: []
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
    setClasses(t1, t1.faction);
    t1.memberArray = one.members;
    one.members.forEach(function(member) {
        t1.members[member.character_id] = {
            name: member.name,
            points: 0,
            netScore: 0,
            kills: 0,
            deaths: 0,
            revives: 0,
            damageAssists: 0,
            utilityAssists: 0,
            ps2Class: 0,
            classArray: []
        };
        setClasses(t1.members[member.character_id], t1.faction);
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
    setClasses(t2, t2.faction);
    t2.memberArray = two.members;
    two.members.forEach(function(member) {
        t2.members[member.character_id] = {
            name: member.name,
            points: 0,
            netScore: 0,
            kills: 0,
            deaths: 0,
            revives: 0,
            damageAssists: 0,
            utilityAssists: 0,
            ps2Class: 0,
            classArray: []
        };
        setClasses(t2.members[member.character_id], t2.faction);
    });
}

function setClasses(object, faction) {
    // 1-VS, 2-NC, 3-TR
    for (i = 1; i <=7; i++) {
        if (i === 2) { continue; } //no class defined for this
        var classID = getFactionClass(i, faction);
        object.classArray[classID] = {
            name: getClassName(classID),
            points: 0,
            netScore: 0,
            kills: 0,
            deaths: 0,
            revives: 0,
            damageAssists: 0,
            utilityAssists: 0
        };
    }
}

function getClassName(classID) {
    if ( classID === 0 ) {return 'Unknown'; }
    if ( classID === 1 || classID === 8 || classID === 15 ) { return 'Infil'; }
    if ( classID === 3 || classID === 10 || classID === 17 ) { return 'LA'; }
    if ( classID === 4 || classID === 11|| classID === 18 ) { return 'Medic'; }
    if ( classID === 5 || classID === 12 || classID === 19 ) { return 'Engy'; }
    if ( classID === 6 || classID === 13 || classID === 20 ) { return 'Heavy'; }
    if ( classID === 7 || classID === 14 || classID === 21 ) { return 'Max'; }
}

function getFactionClass(baseID, faction) {
    return baseID + (7 * (faction - 1));
}

function getT1() { return t1; }

function getT2() { return t2; }

function oneIvITwo(one, two, points, item, oneClass, twoClass) {
    //Update Team 1 Stats For Kill
    t1.points += points;
    t1.netScore += points;
    t1.kills++;

    //Update Class-Specific Stats For Team 1 (Kill)
    t1.classArray[oneClass].points += points;
    t1.classArray[oneClass].netScore += points;
    t1.classArray[oneClass].kills++;

    //Update Player Stats For Killer
    t1.members[one].points += points;
    t1.members[one].netScore += points;
    t1.members[one].kills++;
    t1.members[one].ps2Class = oneClass; //Update the player's current class. Used for determining what to display on the overlay.

    //Update Class-Specific Player Stats For Killer
    t1.members[one].classArray[oneClass].points += points;
    t1.members[one].classArray[oneClass].netScore += points;
    t1.members[one].classArray[oneClass].kills++;

    //Update Team 2 Stats For Death
    t2.deaths++;
    t2.netScore -= points;

    //Update Class-Specific Stats For Team 2 (Death)
    t2.classArray[twoClass].deaths++;
    t2.classArray[twoClass].netScore -= points;

    //Update Player Stats For Victim
    t2.members[two].netScore -= points;
    t2.members[two].deaths++;
    t2.members[two].ps2Class = twoClass; //Update the player's current class.  Used for determining what to display on the overlay.

    //Update Class-Specific Player Stats For Victim
    t2.members[two].classArray[twoClass].deaths++;
    t2.members[two].classArray[twoClass].netScore -= points;

    // logging
    console.log(t1.members[one].name + ' (' + t1.members[one].ps2Class + ') -->  ' + t2.members[two].name + ' (' + t2.members[two].ps2Class + ') for ' + points + ' points (' + item.name + ')');
    logScore();
}

function twoIvIOne(two, one, points, item, oneClass, twoClass) {
    //Update Team 2 Stats For Kill
    t2.points += points;
    t2.netScore += points;
    t2.kills++;

    //Update Class-Specific Stats For Team 2 (Kill)
    t2.classArray[twoClass].points += points;
    t2.classArray[twoClass].netScore += points;
    t2.classArray[twoClass].kills++;

    //Update Player Stats For Killer
    t2.members[two].points += points;
    t2.members[two].netScore += points;
    t2.members[two].kills++;
    t2.members[two].ps2Class = twoClass; //Update the player's current class. Used for determining what to display on the overlay.

    //Update Class-Specific Player Stats For Killer
    t2.members[two].classArray[twoClass].points += points;
    t2.members[two].classArray[twoClass].netScore += points;
    t2.members[two].classArray[twoClass].kills++;

    //Update Team 1 Stats For Death
    t1.netScore -= points;
    t1.deaths++;

    //Update Class-Specific Stats For Team 1 (Death)
    t1.classArray[oneClass].deaths++;
    t1.classArray[oneClass].netScore -= points;

    //Update Player Stats For Victim
    t1.members[one].netScore -= points;
    t1.members[one].deaths++;
    t1.members[one].ps2Class = oneClass; //Update the player's current class. Used for determining what to display on the overlay.

    //Update Class-Specific Player Stats For Victim
    t1.members[one].classArray[oneClass].deaths++;
    t1.members[one].classArray[oneClass].netScore -= points;

    // logging
    console.log(t2.members[two].name + ' -->  ' + t1.members[one].name + ' for ' + points + ' points (' + item.name + ')');
    logScore();
}

function oneSuicide(one, points, oneClass) {
    //Team One Stats
    t1.points += points;
    t1.netScore += points;
    t1.deaths++;

    //Team One Class-Specific Stats
    t1.classArray[oneClass].points += points;
    t1.classArray[oneClass].netScore += points;
    t1.classArray[oneClass].deaths++;

    //Suicider Stats
    t1.members[one].points += points;
    t1.members[one].netScore += points;
    t1.members[one].deaths++;
    t1.members[one].ps2Class = oneClass;

    //Class-Specific Stats For Suicider
    t1.members[one].classArray[oneClass].points += points;
    t1.members[one].classArray[oneClass].points += points;
    t1.members[one].classArray[oneClass].deaths++;

    // logging
    console.log(t1.members[one].name + ' killed themselves ' + points);
    logScore();
}

function twoSuicide(two, points, twoClass) {
    //Team Two Stats
    t2.points += points;
    t2.netScore += points;
    t2.deaths++;

    //Team Two Class-Specific Stats
    t2.classArray[twoClass].points += points;
    t2.classArray[twoClass].netScore += points;
    t2.classArray[twoClass].deaths++;

    //Suicider Stats
    t2.members[two].points += points;
    t2.members[two].netScore += points;
    t2.members[two].deaths++;
    t2.members[two].ps2Class = twoClass;

    //Class-Specific Stats For Suicider
    t2.members[two].classArray[twoClass].points += points;
    t2.members[two].classArray[twoClass].points += points;
    t2.members[two].classArray[twoClass].deaths++;

    //logging
    console.log(t2.members[two].name + ' killed themselves ' + points);
    logScore();
}

function oneTeamKill(killer, killed, points, killerClass, killedClass) {
    //Team One Stats
    t1.points += points;
    t1.netScore += points;
    t1.deaths++;

    //Team One Class-Specific Stats For Killer
    t1.classArray[killerClass].points += points;
    t1.classArray[killerClass].netScore += points;

    //Team One Class-Specific Stats For Killed
    t1.classArray[killedClass].deaths++;

    //Killer Stats
    t1.members[killer].points += points;
    t1.members[killer].netScore += points;
    t1.members[killer].ps2Class = killerClass;
    
    //Killer Class-Specific Stats
    t1.members[killer].classArray[killerClass].points += points; 
    t1.members[killer].classArray[killerClass].netScore += points;

    //Killed Stats
    t1.members[killed].deaths++;
    t1.members[killed].ps2Class = killedClass;

    //Killed Class-Specific Stats
    t1.members[killed].classArray[killedClass].deaths++;

    // logging
    console.log(t1.members[killer].name + ' team killed ' + t1.members[killed].name + ' ' + points);
    logScore();
}

function twoTeamKill(killer, killed, points, killerClass, killedClass) {
    //Team Two Stats
    t2.points += points;
    t2.netScore += points;
    t2.deaths++;

    //Team Two Class-Specific Stats For Killer
    t2.classArray[killerClass].points += points;
    t2.classArray[killerClass].netScore += points;
    
    //Killer Stats
    t2.members[killer].points += points;
    t2.members[killer].netScore += points;
    t2.members[killer].ps2Class = killerClass;

    //Killer Class-Specific Stats
    t2.members[killer].classArray[killerClass].points += points; 
    t2.members[killer].classArray[killerClass].netScore += points;

    //Killed Stats
    t2.members[killed].deaths++;
    t2.members[killed].ps2Class = killedClass;

    //Killed Class-Specific Stats
    t2.members[killed].classArray[killedClass].deaths++;

    // logging
    console.log(t2.members[killer].name + ' team killed ' + t2.members[killed].name + ' ' + points);
    logScore();
}

function oneBaseCap(points) {
    t1.points += points;
    t1.netScore += points;
    t1.baseCaps++;
    t2.netScore -= points;

    // logging
    console.log(t1.name + ' captured the base +' + points);
    logScore();
}

function twoBaseCap(points) {
    t2.points += points;
    t2.netScore += points;
    t2.baseCaps++;
    t1.netScore -= points;

    // logging
    console.log(t2.name + ' captured the base +' + points);
    logScore();
}

// Adjust the scores, possibly due to sanctions imposed by an admin or other reasons...
function adjustScore(team1, team2, reason) {
    if (team1 !== '' && t1.outfit_id !== '') {
        if (!isNaN(team1)) {
            team1 = parseInt(team1);
            t1.points += team1;
            t1.netScore += team1;
            t2.netScore -= team1;
            // Check if team has already been sanctioned
            if (t1.members.hasOwnProperty(reason)) {
                t1.members[reason].points += team1;
                t1.members[reason].netScore += team1;
            } else {
                t1.members[reason] = {
                    name: reason,
                    points: team1,
                    netScore: team1,
                    kills: 0,
                    deaths: 0
                };
            }
        }
    }
    if (team2 !== '' && t2.outfit_id !== '') {
        if (!isNaN(team2)) {
            team2 = parseInt(team2);
            t2.points += team2;
            t2.netScore += team2;
            t1.netScore -= team2;
            // Check if team has already been sanctioned
            if (t2.members.hasOwnProperty(reason)) {
                t2.members[reason].points += team2;
                t2.members[reason].netScore += team2;
            } else {
                t2.members[reason] = {
                    name: reason,
                    points: team2,
                    netScore: team2,
                    kills: 0,
                    deaths: 0
                };
            }
        }
    }
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
exports.adjustScore = adjustScore;