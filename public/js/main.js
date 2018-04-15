/**
 * Created by Dylan on 15-Apr-16.
 * Updated by Chirtle in 2017-2018.
 */

var socket = io();
socket.on('connect', function() {

    socket.on('teams', function (data) {
        console.log(data);
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
        }
    });

    socket.on ('time', function(data) {
        console.log(data);
        $('#timer').html(data.minutes + ':' + data.seconds);
    });

    socket.on('refresh', function () {
        window.location.reload();
    });
    
    socket.on('killfeed', function (event) {
        console.log(event);
        var pointsString = "";
        if (Number(event.points) > 0) { 
            pointsString = '+' + event.points;
        } else if (Number(event.points) < 0) { 
            pointsString = event.points;
        } else {
            pointsString = '0';
        }
        $('<tr><td class="killfeedRowContainer"><div class="killfeedWinner killfeedPlayer killfeedCell faction' + event.winner_faction + '">' + event.winner + '</div>' +//event.winner_faction + '">' + event.winner + '</td>' +
            '<div class="killfeedPoints killfeedCell ">' + pointsString + '</div>' +
            '<div class="killfeedWeapon killfeedCell">' + event.weapon + '</div>' +
            '<div class="killfeedLoser killfeedPlayer killfeedCell faction' + event.loser_faction + '">' + event.loser + '</div>' +//event.loser_faction + '">' + event.loser + '</td>' +
           '</td></tr>') .prependTo($('#killfeed'));
        
        updatePlayerClasses(event);
       
        //Remove the last row of the killfeed before adding the new row
        var killTable = document.getElementById('killfeed');
        var killRows = killTable.getElementsByTagName('tr');
        if (killRows.length > 4) {
            killTable.deleteRow(4);
       } else {
           return;
       }

       if (event.weapon == 'Base Capture') {
           return;
        } else {
            playRespawning(event.loser, event.loser_loadout_id);
        }


    });

    socket.on('score', function (event) {
        console.log(event);
        $('#T1Score').empty().html(event.teamOne.points); $('#T2Score').empty().html(event.teamTwo.points);
        
        var m = event.teamOne.members;
        for (keys in m) {
            if (m[keys].kills > 0 || m[keys].deaths > 0) {
               if (m[keys].name == "") {return;}
                var nameEl = document.getElementById(m[keys].name);
                if (nameEl === null) {
                    $('<div class="playerClass ' + getClassFromLoadoutID(m[keys].ps2Class) + '" id="' + m[keys].name + 'class"></div>' + 
                        '<div class="playerStatsContainer" id="' + m[keys].name + '">' +
                        '<div class="playerStatsName" id="' + m[keys].name + 'name">' + m[keys].name + '</div>' +
                        '<div class="playerStatsScore" id="' + m[keys].name + 'score">' + m[keys].netScore + '</div>'+
                        '<div class="playerRespawningBase" id="' + m[keys].name + 'respawn"></div>' + '</div>').appendTo($('#T1Players'));
                } else {
                    var scoreEl = document.getElementById(m[keys].name + 'score');
                    scoreEl.textContent = m[keys].netScore;
                }
                if (m[keys].name == event.loser) {
                    var loserName = m[keys].loser;
                    playRespawning(loserName);
                }
            } else {
                $(m[keys].name).empty();
            }
        }

        m = event.teamTwo.members;
        for (keys in m) {
            if (m[keys].kills > 0 || m[keys].deaths > 0) {
                if (m[keys].name == "") {return;}
                var nameEl = document.getElementById(m[keys].name);
                if (nameEl === null) {
                    $('<div class="playerStatsContainer" id="' + m[keys].name + '">' +
                        '<div class="playerStatsScore" id="' + m[keys].name + 'score">' + m[keys].netScore + '</div>' +
                        '<div class="playerStatsName" id="' + m[keys].name + 'name">' + m[keys].name + '</div>' + 
                        '<div class="playerRespawningBase" id="' + m[keys].name + 'respawn"></div></div>' +
                        '<div class="playerClass ' + getClassFromLoadoutID(m[keys].ps2Class) + '" id="' + m[keys].name + 'class">' + 
                        '</div>').appendTo($('#T2Players'));
                } else {
                    var scoreEl = document.getElementById(m[keys].name + 'score');
                    scoreEl.textContent = m[keys].netScore;
                }
                if (m[keys].name == event.loser) {
                    var loserName = m[keys].loser;
                    playRespawning(loserName);
                }
            }
        }
        updatePlayerClasses(event);
    });
});


function updatePlayerClasses(event) {
    var winnerID = event.winner + "class";
    var loserID = event.loser + "class";
   
   if (!($('#'+winnerID).length == 0)) {
       document.getElementById(winnerID).className = "playerClass " + getClassFromLoadoutID(event.winner_class_id);
   }
   if (!($('#'+loserID).length == 0)) {
    document.getElementById(loserID).className = "playerClass " + getClassFromLoadoutID(event.loser_class_id);
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
   
    var respawn = document.getElementById(loserID);
    respawn.className = "playerRespawningBase";
   
    var player = document.getElementById(eventLoserName);
    player.className = "playerStatsContainer";

    var shrinkDirection = $('#T1Players #'+ eventLoserName) ? 'shrinkRight' : 'shrinkLeft';
    window.requestAnimationFrame(function (time) {
        window.requestAnimationFrame(function (time) {
            respawn.className = "playerRespawningBar playerRespawningPlay " + shrinkDirection;
            player.className = "playerStatsContainer deadTextPlay";
        });
    });
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

socket.emit('backchat', { obj: 'New Connection' });