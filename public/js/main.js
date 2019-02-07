/**
 * Created by Dylan on 15-Apr-16.
 * Updated by Chirtle in 2017-2018.
 */

var socket = io();
const debugLogs = false;

socket.on('connect', function() {

    socket.on('title', function(title) {
        if (debugLogs === true) { console.log(title); }
        $('#eventTitle').html(title);
        $('#eventTitle2').html(title);
        $('#eventTitle3').html(title);
    });

    socket.on('teams', function (data) {
        if (debugLogs === true) { console.log(data); }
        
        if (data.teamOne.name !== "") {
            var T1 = data.teamOne.alias
            var T2 = data.teamTwo.alias

            $('#T1Players').empty(); $('#T2Players').empty();

            $('#T1Board').addClass('faction' + data.teamOne.faction);
            $('#T2Board').addClass('faction' + data.teamTwo.faction);

            $('#outfitT1').html(T1).addClass('outfitAlias');
            $('#outfitT2').html(T2).addClass('outfitAlias');
            
            $('#T1Score').addClass('activeWhiteText');
            $('#T2Score').addClass('activeWhiteText');

            $('#T1Wedge').addClass('faction' + data.teamOne.faction + 'border');
            $('#T2Wedge').addClass('faction' + data.teamTwo.faction + 'border');

            //Faction Labels
            $('#T1Faction').addClass('faction' + data.teamOne.faction + 'DarkBackground');
            $('#T2Faction').addClass('faction' + data.teamTwo.faction + 'DarkBackground');
            
            $('#T1Faction').html(getFactionLabel(data.teamOne));
            $('#T2Faction').html(getFactionLabel(data.teamTwo));

            $('#T1Faction').addClass('faction' + data.teamOne.faction + 'flavor');
            $('#T2Faction').addClass('faction' + data.teamTwo.faction + 'flavor');

            $('#T1Players').addClass('faction' + data.teamOne.faction);
            $('#T2Players').addClass('faction' + data.teamTwo.faction);

            $('.timerContainer').addClass('faction' + data.teamOne.faction + 'DarkBorderLeft');
            $('.timerContainer').addClass('faction' + data.teamTwo.faction + 'DarkBorderRight');

            $('#killfeedContainer').removeClass('killfeedInactive');
            $('#killfeedContainer').addClass('killfeedActive');
        }
        else {
            $('#outfitT1').html("--").addClass();
            $('#outfitT2').html("--").addClass();

            $('#T1Faction').html('N<BR>S');
            $('#T2Faction').html('N<BR>S');

            $('#killfeedContainer').addClass('killfeedInactive');

            // Also empty the player containers
            $('#T1Players').empty();
            $('#T2Players').empty();
        }
    });

    socket.on ('time', function(data) {
        if (debugLogs === true) { console.log(data); }
        $('#timer').html(data.minutes + ':' + data.seconds);
    });

    socket.on('refresh', function () {
        console.log('refreshed');
        window.location.reload();
    });

    socket.on('killfeed', function (event) {
        if (debugLogs === true) { console.log(event); }
        
        if (event.is_kill === true && event.loser !== undefined) {
            var loserName = event.loser;
            addKillfeedRow(event);
            updatePlayerClasses(event);
            updatePlayerScores(event);
            playRespawning(loserName);
        }
        else if (event.is_revive === true && event.loser !== undefined && event.loser !== 'Random Pubbie') {
            var loserName = event.loser;
            addKillfeedRow(event);
            updatePlayerClasses(event);
            updatePlayerScores(event);
            playRevived(loserName);
        }
        else if (event.is_control === true && event.winner !== undefined) {
            var winnerName = event.winner;
            if (debugLogs === true) { addKillfeedRow(event);}
            updatePlayerClasses(event);
            updatePlayerScores(event);
            playContestingPoint(winnerName);
        }
        else {
            updatePlayerScores(event);
        }

        // addKillfeedRow(event);
        truncateKillfeed();

        // updatePlayerClasses(event);

        // if (event.weapon == 'Base Capture') {
        //    return;
        // }
        // else {
        //     playRespawning(event.loser, event.loser_loadout_id);
        // }
    });

    socket.on('score', function (event) {
        console.log(event);
        $('#T1Score').empty().html(event.teamOne.points);
        $('#T2Score').empty().html(event.teamTwo.points);
        
        var m = event.teamOne.members;
        for (keys in m) {
            if (m[keys].eventCount > 0) { // m[keys].kills > 0 || m[keys].deaths > 0) {
               if (m[keys].name === "") {return;}
                var nameEl = document.getElementById(m[keys].name);
                if (nameEl === null) {
                    $('<div class="playerClass ' + getClassFromLoadoutID(m[keys].ps2Class) + '" id="' + m[keys].name + 'class"></div>' + 
                      '<div class="playerStatsContainer" id="' + m[keys].name + '">' +
                        '<div class="playerStatsName" id="' + m[keys].name + 'name">' + m[keys].name + '</div>' +
                        '<div class="playerStatsScore" id="' + m[keys].name + 'Score">' + m[keys].netScore + '</div>'+
                        '<div class="playerEventMask" id="' + m[keys].name + 'EventMask"></div>' +
                      '</div>').appendTo($('#T1Players'));
                        // '<div class="playerRespawningBase" id="' + m[keys].name + 'respawn"></div>' + '</div>').appendTo($('#T1Players'));
                }
                else {
                    var scoreEl = document.getElementById(m[keys].name + 'Score');
                    scoreEl.textContent = m[keys].netScore;
                }
                if (m[keys].name == event.loser) {
                    var loserName = m[keys].loser;
                    playRespawning(loserName);
                }
            }
            else {
                $(m[keys].name).empty();
                // $('#' + m[keys].name).remove(); TODO: make each player row a grid row
            }
        }

        m = event.teamTwo.members;
        for (keys in m) {
            if (m[keys].eventCount > 0) { // m[keys].kills > 0 || m[keys].deaths > 0) {
                if (m[keys].name === "") {return;}
                var nameEl = document.getElementById(m[keys].name);
                if (nameEl === null) {
                    $('<div class="playerStatsContainer" id="' + m[keys].name + '">' +
                        '<div class="playerStatsScore" id="' + m[keys].name + 'Score">' + m[keys].netScore + '</div>' +
                        '<div class="playerStatsName" id="' + m[keys].name + 'name">' + m[keys].name + '</div>' + 
                        '<div class="playerEventMask" id="' + m[keys].name + 'EventMask"></div></div>' +
                        // '<div class="playerRespawningBase" id="' + m[keys].name + 'respawn"></div></div>' +
                      '<div class="playerClass ' + getClassFromLoadoutID(m[keys].ps2Class) + '" id="' + m[keys].name + 'class">' + 
                      '</div>').appendTo($('#T2Players'));
                }
                else {
                    var scoreEl = document.getElementById(m[keys].name + 'Score');
                    scoreEl.textContent = m[keys].netScore;
                }
                if (m[keys].name == event.loser) {
                    var loserName = m[keys].loser;
                    playRespawning(loserName);
                }
            }
            else {
                $(m[keys].name).empty();
                // $('#' + m[keys].name).remove(); TODO: make each player row a grid row
            }
        }
        updatePlayerClasses(event);
        updatePlayerScores(event);
    });
});

/* Prepend a new event to the top of the killfeed */
function addKillfeedRow(event) {
    var pointsString = "";
    if (Number(event.points) > 0) { 
        pointsString = '+' + event.points;
    }
    else if (Number(event.points) < 0) { 
        pointsString = event.points;
    }
    else {
        pointsString = '0';
    }
    
    $('<tr><td class="killfeedRowContainer">' + 
        '<div class="killfeedWinner killfeedPlayer killfeedCell faction' + event.winner_faction + '">' + event.winner + '</div>' +
        '<div class="killfeedPoints killfeedCell ">' + pointsString + '</div>' +
        '<div class="killfeedWeapon killfeedCell">' + event.weapon + '</div>' +
        '<div class="killfeedLoser killfeedPlayer killfeedCell faction' + event.loser_faction + '">' + event.loser + '</div>' +
      '</td></tr>').prependTo($('#killfeed'));
}

/* Remove the last row of the killfeed */
function truncateKillfeed() {
    var killTable = document.getElementById('killfeed');
    var killRows = killTable.getElementsByTagName('tr');
    if (killRows.length > 4) { killTable.deleteRow(4); }
}

function updatePlayerClasses(event) {
    var winnerID = event.winner + "class";
    var loserID = event.loser + "class";
   
   if (event.winner_class_id !== undefined && !($('#' + winnerID).length == 0)) {
       document.getElementById(winnerID).className = "playerClass " + getClassFromLoadoutID(event.winner_class_id);
   }

   if (event.loser_class_id !== undefined && !($('#' + loserID).length == 0)) {
    document.getElementById(loserID).className = "playerClass " + getClassFromLoadoutID(event.loser_class_id);
   }
}

// TODO: actually implement this
function updatePlayerScores(event) {
    var winnerID = event.winner + 'Score';
    var loserID = event.loser + 'Score';

    if (event.winner_net_score !== undefined && !($('#' + winnerID).length == 0)) {
        console.log(event.winner + ' Net: ' + event.winner_net_score);
        winnerID.textContent = m[keys].netScore;
       // document.getElementById(winnerID).className = getEmojiFromNetEventScore(event.winner_net_score);
    }
 
    if (event.loser_net_score !== undefined && !($('#' + loserID).length == 0) ) {
        console.log(event.loser + ' Net: ' + event.loser_net_score);
        loserID.textContent = m[keys].netScore;
        //document.getElementById(loserID).className = getEmojiFromNetEventScore(event.loser_net_score);
    }

}

function getFactionLabel(teamObject) {
   var factions = new Array();
   factions[1] = "V<BR>S";
   factions[2] = "N<BR>C";
   factions[3] = "T<BR>R";
   return factions[teamObject.faction];
};

function playRespawning(eventLoserName) {
    var loserID = eventLoserName + 'respawn';
    var eventMaskId = eventLoserName +'EventMask';
   
    var respawn = document.getElementById(loserID);
    respawn.className = "playerRespawningBase";
   
    var player = document.getElementById(eventLoserName);
    player.className = "playerStatsContainer";

    $('#' + eventLoserName).removeClass('deadTextPlay');

    emptyPlayersEventMask(eventLoserName);

    var shrinkDirection = $('#T1Players #'+ eventLoserName) ? 'shrinkRight' : 'shrinkLeft';
    window.requestAnimationFrame(function (time) {
        window.requestAnimationFrame(function (time) {
            respawn.className = "playerRespawningBar playerRespawningPlay " + shrinkDirection;
            player.className = "playerStatsContainer deadTextPlay";
        });
    });
}

// TODO: actually implement this
function playRevived(eventLoserName) {
    var classID = eventLoserName + 'class';
    
    var player = document.getElementById(eventLoserName);
    player.className = "playerStatsContainer";
    
    $('#' + classID).removeClass('deadIconPlay');
    $('#' + eventLoserName).removeClass('deadTextPlay');

    emptyPlayersEventMask(eventLoserName);

    window.requestAnimationFrame(function (time) {
        window.requestAnimationFrame(function (time) {
            player.className = 'playerStatsContainer revivedFlashPlay';
            $('#' + classID).addClass('revivedFlashPlay');

            $('#' + eventLoserName).one("webkitAnimationEnd oanimationend msAnimationEnd animationend",
                function() {
                    emptyPlayersEventMask(eventLoserName);
                    $('#' + eventLoserName).removeClass('revivedFlashPlay deadTextPlay');
                    $('#' + classID).removeClass('revivedFlashPlay deadIconPlay');

                });
        });
    });
}

// TODO: actually implement this
function playContestingPoint(eventWinnerName) {
    var eventMaskId = eventWinnerName +'EventMask';
    
    // Control Point events can only happen at a set interval, so don't worry about restting the animation gracefully
    emptyPlayersEventMask(eventWinnerName);

    window.requestAnimationFrame(function (time) {
        window.requestAnimationFrame(function (time) {
            $('<div class="stripe"></div><div class="stripe"></div>').appendTo($('#' + eventMaskId));
            $('#' + eventMaskId).one("webkitAnimationEnd oanimationend msAnimationEnd animationend",
                function() {
                    emptyPlayersEventMask(eventWinnerName);
                });
        });
    });
}

// TOD: actually implement this
function emptyPlayersEventMask(eventPlayerName) {
    var eventMaskId = eventPlayerName + 'EventMask';
    $('#' + eventMaskId).empty();
}

function getLoadoutIdMappings(loadoutID) {
    var classMap = [];
   classMap[0] = 'unknown';
    classMap[1] ='infil'; classMap[8] = 'infil'; classMap[15] = 'infil';
    classMap[3] = 'la'; classMap[10] = 'la'; classMap[17] = 'la';
    classMap[4] = 'medic'; classMap[11] = 'medic'; classMap[18] = 'medic';
    classMap[5] = 'engy'; classMap[12] = 'engy'; classMap[19] ='engy';
    classMap[6] = 'heavy'; classMap[13] = 'heavy'; classMap[20] = 'heavy';
    classMap[7] = 'max'; classMap[14] = 'max'; classMap[21] = 'max';
    return classMap[loadoutID];
}

function getClassFromLoadoutID(loadoutID) {
    return getLoadoutIdMappings(loadoutID);
}


function makeEmojiClassString(emoji) {
    let size =' sm';
    let prefix = 'fas fa-';
    return prefix + emoji + size;
}

socket.emit('backchat', { obj: 'New Connection' });