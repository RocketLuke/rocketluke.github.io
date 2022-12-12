import {hello as helloFunction} from "./test.js"

let typeMatrix = {};
let pokemonIdList = [];
let pokemonTeamList = [];
let masterPokemonList;

$(document).ready(function(){

    helloFunction();

    masterPokemonList = getMasterPokemonList();
    setTypeMatrix();

    // Retrieve any existing pokemon
    pokemonIdList = retrieveOrCreatePokemonIdsFromCookies();
    pokemonTeamList = retrievePokemonFromCookies(pokemonIdList);

    // Add existing pokemon to the current team
    refreshCurrentTeamContainer();

    // Initialize the "select2" package on any element with "select" as a class
    $('.select').select2();

    $("#raid-helper-button").on( "click", function() {
        $('#raid-helper-header-container').css('display', 'block');
        $('#raid-helper-results-container').css('display', 'block');
        $('#team-builder-button').css('display', 'inline');

        $('#team-builder-header-container').css('display', 'none');
        $('#team-builder-results-container').css('display', 'none');
        $('#raid-helper-button').css('display', 'none');
    });

    $("#team-builder-button").on( "click", function() {
        $('#raid-helper-header-container').css('display', 'none');
        $('#raid-helper-results-container').css('display', 'none');
        $('#team-builder-button').css('display', 'none');

        $('#team-builder-header-container').css('display', 'block');
        $('#team-builder-results-container').css('display', 'block');
        $('#raid-helper-button').css('display', 'inline');
    });

    $("#raid-helper-submit-button").on( "click", function() {
       let offensiveType1 = $('#raid-pokemon-offensive-type-1').val();
       let offensiveType2 = $('#raid-pokemon-offensive-type-2').val();
       let teraType = $('#raid-pokemon-tera-type').val();
       let raidPokemonName = $('#raid-pokemon-name').val();

       const results = calculateEffectiveness(offensiveType1, offensiveType2, teraType);
       setResultDisplay(results, offensiveType1, offensiveType2, teraType, raidPokemonName);
    });

    $("#add-pokemon-button").on( "click", function() {
        let newPokemonName = $('#new-pokemon-name').val();
        let newPokemonOffensiveType = $('#new-pokemon-offensive-type').val();

        createPokemonCookie(newPokemonName, newPokemonOffensiveType);
        refreshCurrentTeamContainer();

        $('#new-pokemon-offensive-type').val('Normal').trigger('change');;
    });

    $("#current-team-container").on( "click", '.result-container .remove-pokemon-button', function() {
        if (confirm('Are you sure you want to delete this Pok\u00E9mon?')) {
            const pokemonId = $(this).attr('id');
            deletePokemonCookie(pokemonId);
            refreshCurrentTeamContainer();
        }
    });

    $("#team-builder-button").on( "click", function() {
        $('#team-builder-button').css('display', 'none');
        $('#pokemon-picker-container').css('display', 'none');
        $('#pokemon-picker-button').css('display', 'inline');
        $('#team-builder-container').css('display', 'block');
    });

    // Set the current default raid pokemon image/types
    const currentRaidPokemonName = $('#raid-pokemon-name').find(':selected')[0].value;
    setRaidPokemonElements(currentRaidPokemonName);

    $('#raid-pokemon-name').on('select2:select', function (e) {
        const currentRaidPokemonName = $('#raid-pokemon-name').find(':selected')[0].value;
        setRaidPokemonElements(currentRaidPokemonName);
    });

    $('#new-pokemon-name').on('select2:select', function (e) {
        var pokemon = masterPokemonList[e.params.data.id];

        // Set the new pokemon's type fields
        $('#new-pokemon-defensive-type-1').val(pokemon.type1).trigger('change');
        $('#new-pokemon-defensive-type-2').val(pokemon.type2).trigger('change');
        $('#new-pokemon-offensive-type').val(pokemon.type1).trigger('change');
    });
    $('#new-pokemon-defensive-type-2').hide();

    $(document).on('select2:open', () => {
        document.querySelector('.select2-search__field').focus();
    });
});

/**
 * Represents a Type and how it reacts to other types
 */
class Type {
    constructor(name, strengths, weaknesses, resistances, immunities) {
        this.name = name;
        this.strengths = strengths;
        this.weaknesses = weaknesses;
        this.resistances = resistances;
        this.immunities = immunities;
    }
}

/**
 * Represents a pokemon on our team
 */
class Pokemon {
    constructor(id, name, teraType) {
        this.id = id;
        this.name = name;
        this.teraType = teraType;
    }
}

/**
 * This method will manually set how each Type reacts to other types, taking into consideration what they're strong, weak, and immune against
 */
function setTypeMatrix() {
    let normalStrengths = [];
    let normalWeaknesses = ['Fighting'];
    let normalResistances = [];
    let normalImmunities = ['Ghost'];
    typeMatrix.Normal = new Type('Normal', normalStrengths, normalWeaknesses, normalResistances, normalImmunities);

    let fireStrengths = ['Grass', 'Ice', 'Bug', 'Steel'];
    let fireWeaknesses = ['Water', 'Ground', 'Rock'];
    let fireResistances = ['Fire', 'Grass', 'Ice', 'Bug', 'Steel', 'Fairy'];
    let fireImmunities = [];
    typeMatrix.Fire = new Type('Fire', fireStrengths, fireWeaknesses, fireResistances, fireImmunities);

    let waterStrengths = ['Fire', 'Rock', 'Ground'];
    let waterWeaknesses = ['Electric', 'Grass'];
    let waterResistances = ['Fire', 'Water', 'Ice', 'Steel'];
    let waterImmunities = [];
    typeMatrix.Water = new Type('Water', waterStrengths, waterWeaknesses, waterResistances, waterImmunities);

    let electricStrengths = ['Water', 'Flying'];
    let electricWeaknesses = ['Ground'];
    let electricResistances = ['Electric', 'Flying', 'Steel'];
    let electricImmunities = [];
    typeMatrix.Electric = new Type('Electric', electricStrengths, electricWeaknesses, electricResistances, electricImmunities);
    
    let grassStrengths = ['Water', 'Ground', 'Rock'];
    let grassWeaknesses = ['Fire', 'Ice', 'Poision', 'Flying', 'Bug'];
    let grassResistances = ['Water', 'Electric', 'Grass', 'Ground'];
    let grassImmunities = [];
    typeMatrix.Grass = new Type('Grass', grassStrengths, grassWeaknesses, grassResistances, grassImmunities);

    let iceStrengths = ['Grass', 'Ground', 'Flying', 'Dragon'];
    let iceWeaknesses = ['Fire', 'Fighting', 'Rock', 'Steel'];
    let iceResistances = ['Ice'];
    let iceImmunities = [];
    typeMatrix.Ice = new Type('Ice', iceStrengths, iceWeaknesses, iceResistances, iceImmunities);

    let fightingStrengths = ['Normal', 'Ice', 'Rock', 'Dark', 'Steel'];
    let fightingWeaknesses = ['Flying', 'Psychic', 'Fairy'];
    let fightingResistances = ['Bug', 'Rock', 'Dark'];
    let fightingImmunities = [];
    typeMatrix.Fighting = new Type('Fighting', fightingStrengths, fightingWeaknesses, fightingResistances, fightingImmunities);

    let poisonStrengths = ['Grass', 'Fairy'];
    let poisonWeaknesses = ['Ground', 'Psychic'];
    let poisonResistances = ['Grass', 'Fighting', 'Poison', 'Bug', 'Fairy'];
    let poisonImmunities = [];
    typeMatrix.Poison = new Type('Poison', poisonStrengths, poisonWeaknesses, poisonResistances, poisonImmunities);

    let groundStrengths = ['Fire', 'Electric', 'Poison', 'Rock', 'Steel'];
    let groundWeaknesses = ['Water', 'Grass', 'Ice'];
    let groundResistances = ['Poison', 'Rock'];
    let groundImmunities = ['Electric'];
    typeMatrix.Ground = new Type('Ground', groundStrengths, groundWeaknesses, groundResistances, groundImmunities);

    let flyingStrengths = ['Grass', 'Fighting', 'Bug'];
    let flyingWeaknesses = ['Electric', 'Ice', 'Rock'];
    let flyingResistances = ['Grass', 'Fighting'];
    let flyingImmunities = ['Ground'];
    typeMatrix.Flying = new Type('Flying', flyingStrengths, flyingWeaknesses, flyingResistances, flyingImmunities);

    let psychicStrengths = ['Fighting', 'Poison'];
    let psychicWeaknesses = ['Bug', 'Ghost', 'Dark'];
    let psychicResistances = ['Fighting', 'Psychic'];
    let psychicImmunities = [];
    typeMatrix.Psychic = new Type('Psychic', psychicStrengths, psychicWeaknesses, psychicResistances, psychicImmunities);

    let bugStrengths = ['Grass', 'Psychic', 'Dark'];
    let bugWeaknesses = ['Fire', 'Flying', 'Rock'];
    let bugResistances = ['Grass', 'Fighting', 'Ground'];
    let bugImmunities = [];
    typeMatrix.Bug = new Type('Bug', bugStrengths, bugWeaknesses, bugResistances, bugImmunities);

    let rockStrengths = ['Fire', 'Ice', 'Flying', 'Bug'];
    let rockWeaknesses = ['Water', 'Grass', 'Fighting', 'Ground', 'Steel'];
    let rockResistances = ['Normal', 'Fire', 'Poison', 'Flying'];
    let rockImmunities = [];
    typeMatrix.Rock = new Type('Rock', rockStrengths, rockWeaknesses, rockResistances, rockImmunities);

    let ghostStrengths = ['Psychic', 'Ghost'];
    let ghostWeaknesses = ['Ghost', 'Dark'];
    let ghostResistances = ['Poison', 'Bug'];
    let ghostImmunities = ['Normal', 'Fighting'];
    typeMatrix.Ghost = new Type('Ghost', ghostStrengths, ghostWeaknesses, ghostResistances, ghostImmunities);

    let dragonStrengths = ['Dragon'];
    let dragonWeaknesses = ['Dragon', 'Fairy'];
    let dragonResistances = ['Fire', 'Water', 'Electric', 'Grass'];
    let dragonImmunities = [];
    typeMatrix.Dragon = new Type('Dragon', dragonStrengths, dragonWeaknesses, dragonResistances, dragonImmunities);

    let darkStrengths = ['Psychic', 'Ghost'];
    let darkWeaknesses = ['Fighting', 'Bug', 'Fairy'];
    let darkResistances = ['Ghost', 'Dark'];
    let darkImmunities = ['Psychic'];
    typeMatrix.Dark = new Type('Dark', darkStrengths, darkWeaknesses, darkResistances, darkImmunities);

    let steelStrengths = ['Ice', 'Rock', 'Fairy'];
    let steelWeaknesses = ['Fire', 'Fighting', 'Ground'];
    let steelResistances = ['Normal', 'Grass', 'Ice', 'Flying', 'Psychic', 'Bug', 'Rock', 'Dragon', 'Steel', 'Fairy'];
    let steelImmunities = ['Poison'];
    typeMatrix.Steel = new Type('Steel', steelStrengths, steelWeaknesses, steelResistances, steelImmunities);

    let fairyStrengths = ['Fighting', 'Dragon', 'Dark'];
    let fairyWeaknesses = ['Poison', 'Steel'];
    let fairyResistances = ['Fighting', 'Bug', 'Dark'];
    let fairyImmunities = ['Dragon'];
    typeMatrix.Fairy = new Type('Fairy', fairyStrengths, fairyWeaknesses, fairyResistances, fairyImmunities);

    let noneStrength = [];
    let noneWeaknesses = [];
    let noneResistances = [];
    let noneImmunities = [];
    typeMatrix.None = new Type('None', noneStrength, noneWeaknesses, noneResistances, noneImmunities);

}

/**
 * This function will calculate and return the offensive/defensive type effectiveness of every loaded in Pokemon VS the passed in offensive/tera types
 * @param {*} offensiveType1Label   The first offensive typing of the Raid Pokemon
 * @param {*} offensiveType2Label   The second, if present, offensive typing of the Raid Pokemon
 * @param {*} teraTypeLabel         The Tera typing of the Raid Pokemon
 * @returns                         Array of the results of each Pokemon VS the Raid Pokemon
 */
function calculateEffectiveness(offensiveType1Label, offensiveType2Label, teraTypeLabel) {
    const results = [];

    // Loop through all of our team's pokemon
    for (let i = 0; i < pokemonTeamList.length; i++) {
        const pokemon = pokemonTeamList[i];

        let hasStrength = false;
        let offensiveType1Status = 'Neutral';
        let offensiveType2Status = 'Neutral';

        let offensiveType1Object = typeMatrix[offensiveType1Label];
        let offensiveType2Object = typeMatrix[offensiveType2Label];
        let teraTypeObject = typeMatrix[teraTypeLabel];

        // Offensive Advantage?
        if (teraTypeObject.weaknesses.includes(pokemon.teraType)) {
            hasStrength = true;
        }

        // Retrieve the pokemon's defensive types from the master pokemon list
        const defensiveTypeLabels = [masterPokemonList[pokemon.name].type1, masterPokemonList[pokemon.name].type2];

        // Defensive Pros/Cons?
        for (let defensiveLoopCounter = 0; defensiveLoopCounter < defensiveTypeLabels.length; defensiveLoopCounter++) {
            const pokemonDefensiveTypeLabel = defensiveTypeLabels[defensiveLoopCounter];
            const pokemonDefensiveTypeObject = typeMatrix[pokemonDefensiveTypeLabel];

            // Weaknesses
            if (offensiveType1Object.strengths.includes(pokemonDefensiveTypeLabel)) {
                offensiveType1Status = setStatus(offensiveType1Status, 'Weak');
            }
            if (offensiveType2Object.strengths.includes(pokemonDefensiveTypeLabel)) {
                offensiveType2Status = setStatus(offensiveType2Status, 'Weak');
            }

            // Resistances
            if (pokemonDefensiveTypeObject.resistances.includes(offensiveType1Label)) {
                offensiveType1Status = setStatus(offensiveType1Status, 'Resisted');
            }
            if (pokemonDefensiveTypeObject.resistances.includes(offensiveType2Label)) {
                offensiveType2Status = setStatus(offensiveType2Status, 'Resisted');
            }

            // Immunities
            if (pokemonDefensiveTypeObject.immunities.includes(offensiveType1Label)) {
                offensiveType1Status = setStatus(offensiveType1Status, 'Immune');
            }
            if (pokemonDefensiveTypeObject.immunities.includes(offensiveType2Label)) {
                offensiveType2Status = setStatus(offensiveType2Status, 'Immune');
            }

            if (offensiveType2Label == 'None') {
                offensiveType2Status = 'N/A';
            }
        }

        const result = {};
        result.name = pokemon.name;
        result.hasStrength = hasStrength;
        result.offensiveType = pokemon.teraType;
        result.offensiveType1Status = offensiveType1Status;
        result.offensiveType2Status = offensiveType2Status;
        result.imageURL = masterPokemonList[pokemon.name].imageURL;
        results.push(result);
    }

    return results;
}

/**
 * This function takes a current status of how a Pokemon reacts against another Pokemon's typing(s), returning the new result.
 * This is used to calculate and keep track of whether or not a Pokemon is Neutral, Weak, Double Weak, Resisted, Double
 * Resisted, or Immune to another Pokemon's typing(s)
 * @param {*} currentStatus     How a pokemon currently fairs against another Pokemon
 * @param {*} newStatus         A new status to take into considering when calculating how a Pokemon fairs against another Pokemon
 * @returns                     How a pokemon fairs against another Pokemon after taking in new information (newStatus)
 */
function setStatus(currentStatus, newStatus) {
    if (currentStatus == 'Immune' || newStatus == 'Immune') {
        return 'Immune';
    }
    if (currentStatus == 'Neutral') {
        if (newStatus == 'Weak') {
            return 'Weak';
        }
        if (newStatus == 'Resisted') {
            return 'Resisted';
        }
    }
    if (currentStatus == 'Weak') {
        if (newStatus == 'Weak') {
            return 'Double Weak';
        }
        if (newStatus == 'Resisted') {
            return 'Neutral';
        }
    }
    if (currentStatus == 'Resisted') {
        if (newStatus == 'Weak') {
            return 'Neutral';
        }
        if (newStatus == 'Resisted') {
            return 'Double Resisted';
        }
    }
}

/**
 * This function will take a set of results and, using jQuery, set the results on specific parts of the HTML page
 * @param {*} results           Array of the results
 * @param {*} offensiveType1    One of the raid pokemon's offensive typings
 * @param {*} offensiveType2    If present, another of the raid pokemon's offensive typings
 * @param {*} teraType          The raid pokemon's Tera type
 */
function setResultDisplay(results, offensiveType1, offensiveType2, teraType, raidPokemonName) {
    resetResultsDisplays();

    if (raidPokemonName != null && raidPokemonName != '') {
        const raidPokemon = masterPokemonList[raidPokemonName];

        const raidPokemonAbilities = raidPokemon.abilities;
        if (raidPokemonAbilities.includes('Competitive')) {
            const warningMessage = 'Warning! This Pok&eacute;mon may have the ability Competitive. When a Pok&eacute;mon with Competitive has its stats lowered, it gains two stages of special attack, potentially bricking your raid!';
            $('#raid-pokemon-warning-container').append(warningMessage);
        }
        if (raidPokemonAbilities.includes('Defiant')) {
            const warningMessage = 'Warning! This Pok&eacute;mon may have the ability Defiant. When a Pok&eacute;mon with Defiant has its stats lowered, it gains two stages of attack, potentially bricking your raid!';
            $('#raid-pokemon-warning-container').append(warningMessage);
        }
    }

    const resultFlags = {};
    resultFlags.firstResultDisplayHasContent = false;
    resultFlags.secondResultDisplayHasContent = false;
    resultFlags.thirdResultDisplayHasContent = false;
    resultFlags.fourthResultDisplayHasContent = false;
    resultFlags.fifthResultDisplayHasContent = false;
    resultFlags.sixthResultDisplayHasContent = false;
    resultFlags.atLeastOneResultDisplayHasContent = false;

    // Loop through all our results, appending them onto our HTML page's results divs
    for (let i = 0; i < results.length; i++) {
        const pokemonResult = results[i];

        let isSupereffective;
        if (pokemonResult.hasStrength) {
            isSupereffective = 'Yes';
        } else {
            isSupereffective = 'No';
        }

        let htmlDisplay = '<div class="result-container">';
        htmlDisplay += '<div class="result-field-container"><label class="results-label">Pok&eacute;mon / Tera Type:</label><div class="results-value center">' + pokemonResult.name + ' / ' + pokemonResult.offensiveType + '</div></div>';
        htmlDisplay += '<div class="result-field-container"><label class="results-label">Is Tera Type Supereffective?</label><div class="results-value center">' + isSupereffective + '</div></div>';
        htmlDisplay += '<div class="result-field-container"><label class="results-label">Resists ' + offensiveType1 + '?</label><div class="results-value center">' + pokemonResult.offensiveType1Status + '</div></div>';
        if (offensiveType2 != 'None') {
            htmlDisplay += '<div class="result-field-container"><label class="results-label">Resists ' + offensiveType2 + '?</label><div class="results-value center">' + pokemonResult.offensiveType2Status + '</div></div>';
        }
        htmlDisplay += '<div class="result-field-container center"><img width="120" height="120" src="' + pokemonResult.imageURL + '"/></div>';
        htmlDisplay += '</div>';

        addHTMLDisplayToResultsContainer(htmlDisplay, pokemonResult.hasStrength, pokemonResult.offensiveType1Status, pokemonResult.offensiveType2Status, resultFlags);
        /*if (pokemonResult.hasStrength && pokemonResult.offensiveType1Status.includes('Resisted') && (pokemonResult.offensiveType2Status.includes('Resisted') || offensiveType2 == 'None')) {
            $('#type-advantage-and-all-resistances-results-container').append(htmlDisplay);
            firstResultDisplayHasContent = true;
            atLeastOneResultDisplayHasContent = true;
        } else if (pokemonResult.hasStrength && !pokemonResult.offensiveType1Status.includes('Weak') && !pokemonResult.offensiveType2Status.includes('Weak') && (pokemonResult.offensiveType1Status.includes('Resisted') || pokemonResult.offensiveType2Status.includes('Resisted') )) {
            $('#type-advantage-and-some-resistances-results-container').append(htmlDisplay);
            secondResultDisplayHasContent = true;
            atLeastOneResultDisplayHasContent = true;
        } else if (pokemonResult.hasStrength && !pokemonResult.offensiveType1Status.includes('Weak') && !pokemonResult.offensiveType2Status.includes('Weak')) {
            $('#type-advantage-and-no-resistances-results-container').append(htmlDisplay);
            thirdResultDisplayHasContent = true;
            atLeastOneResultDisplayHasContent = true;
        } else if (pokemonResult.offensiveType1Status.includes('Resisted') && (pokemonResult.offensiveType2Status.includes('Resisted') || offensiveType2 == 'None')) {
            $('#all-resistances-results-container').append(htmlDisplay);
            fourthResultDisplayHasContent = true;
            atLeastOneResultDisplayHasContent = true;
        } else if (!pokemonResult.offensiveType1Status.includes('Weak') && !pokemonResult.offensiveType2Status.includes('Weak') && (pokemonResult.offensiveType1Status.includes('Resisted') || pokemonResult.offensiveType2Status.includes('Resisted') )) {
            $('#some-resistances-results-container').append(htmlDisplay);
            fifthResultDisplayHasContent = true;
            atLeastOneResultDisplayHasContent = true;
        } else if (!pokemonResult.offensiveType1Status.includes('Weak') && !pokemonResult.offensiveType2Status.includes('Weak')) {
            $('#no-resistances-results-container').append(htmlDisplay);
            sixthResultDisplayHasContent = true;
            atLeastOneResultDisplayHasContent = true;
        }*/
    }

    displayResultsElementIfItHasContent('#type-advantage-and-all-resistances-results-container', resultFlags.firstResultDisplayHasContent);
    displayResultsElementIfItHasContent('#type-advantage-and-some-resistances-results-container', resultFlags.secondResultDisplayHasContent);
    displayResultsElementIfItHasContent('#type-advantage-and-no-resistances-results-container', resultFlags.thirdResultDisplayHasContent);
    displayResultsElementIfItHasContent('#all-resistances-results-container', resultFlags.fourthResultDisplayHasContent);
    displayResultsElementIfItHasContent('#some-resistances-results-container', resultFlags.fifthResultDisplayHasContent);
    displayResultsElementIfItHasContent('#no-resistances-results-container', resultFlags.sixthResultDisplayHasContent);

    $('.results-display').css('display', 'block');
}

function addHTMLDisplayToResultsContainer(htmlDisplay, hasStrength, offensiveType1Status, offensiveType2Status, resultFlags) {
    let offensiveType1Resisted = false;
    if (offensiveType1Status.includes('Resisted') || offensiveType1Status.includes('Immune')) {
        offensiveType1Resisted = true;
    }
    let offensiveType2Resisted = false;
    if (offensiveType2Status.includes('Resisted') || offensiveType2Status.includes('Immune') || offensiveType2Status.includes('N/A')) {
        offensiveType2Resisted = true;
    }
    const offensiveType1NotWeak = !offensiveType1Status.includes('Weak');
    const offensiveType2NotWeak = !offensiveType1Status.includes('Weak');

    // Has Strength + All Resistances/Immunities
    if (hasStrength && offensiveType1Resisted && offensiveType2Resisted) {
        $('#type-advantage-and-all-resistances-results-container').append(htmlDisplay);
        resultFlags.firstResultDisplayHasContent = true;
        resultFlags.atLeastOneResultDisplayHasContent = true;
    }
    // Has Strength + Some Resistance/Immunities, no Weaknesses
    if (hasStrength && offensiveType1NotWeak && offensiveType2NotWeak && (offensiveType1Resisted || offensiveType2Resisted)) {
        $('#type-advantage-and-some-resistances-results-container').append(htmlDisplay);
        resultFlags.secondResultDisplayHasContent = true;
        resultFlags.atLeastOneResultDisplayHasContent = true;
    }
    // Has Strength + No Weaknesses
    if (hasStrength && offensiveType1NotWeak && offensiveType2NotWeak) {
        $('#type-advantage-and-no-resistances-results-container').append(htmlDisplay);
        resultFlags.thirdResultDisplayHasContent = true;
        resultFlags.atLeastOneResultDisplayHasContent = true;
    }
    // No Strength + All Resistances/Immunities
    if (offensiveType1Resisted && offensiveType2Resisted) {
        $('#all-resistances-results-container').append(htmlDisplay);
        resultFlags.fourthResultDisplayHasContent = true;
        resultFlags.atLeastOneResultDisplayHasContent = true;
    }
    // No Strength + Some Resistances/Immunities, no Weaknesses
    if (offensiveType1NotWeak && offensiveType2NotWeak && (offensiveType1Resisted || offensiveType2Resisted)) {
        $('#some-resistances-results-container').append(htmlDisplay);
        resultFlags.fifthResultDisplayHasContent = true;
        resultFlags.atLeastOneResultDisplayHasContent = true;
    }
    // No Strength + No Weaknesses
    if (offensiveType1NotWeak && offensiveType2NotWeak) {
        $('#no-resistances-results-container').append(htmlDisplay);
        resultFlags.sixthResultDisplayHasContent = true;
        resultFlags.atLeastOneResultDisplayHasContent = true;
    }
}

function resetResultsDisplays() {
    // Update result headers to not display
    $('#type-advantage-and-all-resistances-results-container-header').css('display', 'none');
    $('#type-advantage-and-some-resistances-results-container-header').css('display', 'none');;
    $('#type-advantage-and-no-resistances-results-container-header').css('display', 'none');
    $('#all-resistances-results-container-header').css('display', 'none');
    $('#some-resistances-results-container-header').css('display', 'none');
    $('#no-resistances-results-container-header').css('display', 'none');
    // Update result containers to not display
    $('#type-advantage-and-all-resistances-results-container').css('display', 'none');
    $('#type-advantage-and-some-resistances-results-container').css('display', 'none');;
    $('#type-advantage-and-no-resistances-results-container').css('display', 'none');
    $('#all-resistances-results-container').css('display', 'none');
    $('#some-resistances-results-container').css('display', 'none');
    $('#no-resistances-results-container').css('display', 'none');

    // Empty out the result containers
    $('#type-advantage-and-all-resistances-results-container').empty();
    $('#type-advantage-and-some-resistances-results-container').empty();;
    $('#type-advantage-and-no-resistances-results-container').empty();
    $('#all-resistances-results-container').empty();
    $('#some-resistances-results-container').empty();
    $('#no-resistances-results-container').empty();
    // Reset the warning box
    $('#raid-pokemon-warning-container').empty();
}

function displayResultsElementIfItHasContent(containerId, hasContent) {
    if (hasContent) {
        $(containerId).css('display', 'flex');
        $(containerId + '-header').css('display', 'block');
    }
}

/**
 * This function will refresh the current-team-container element with the current array of pokemon in pokemonTeamList
 */
function refreshCurrentTeamContainer() {
    $('#current-team-container').empty();

    for (let i = 0; i < pokemonTeamList.length; i++) {
        const pokemonResult = pokemonTeamList[i];

        if (masterPokemonList[pokemonResult.name] != null) {
            let htmlDisplay = '<div class="result-container">';
            htmlDisplay += '<div class="result-field-container"><label class="results-label">Pok&eacute;mon:</label><div class="results-value center">' + pokemonResult.name + '</div></div>';
            htmlDisplay += '<div class="result-field-container"><label class="results-label">Offensive/Tera Type:</label><div class="results-value center">' + pokemonResult.teraType + '</div></div>';

            const defensiveType1 = masterPokemonList[pokemonResult.name].type1;
            const defensiveType2 = masterPokemonList[pokemonResult.name].type2;
            htmlDisplay += '<div class="result-field-container"><label class="results-label">Defensive Type 1:</label><div class="results-value center">' + defensiveType1 + '</div></div>';
            htmlDisplay += '<div class="result-field-container"><label class="results-label">Defensive Type 2:</label><div class="results-value center">' + defensiveType2 + '</div></div>';
            htmlDisplay += '<div class="result-field-container center"><img width="120" height="120" src="' + masterPokemonList[pokemonResult.name].imageURL + '"/></div>';
            htmlDisplay += '<div class="result-field-container center"><button id="' + pokemonResult.id + '" class="remove-pokemon-button">Remove Pokemon</button></div>';
            htmlDisplay += '</div>';

            $('#current-team-container').append(htmlDisplay);
        } else {
            // Pokemon is invalid, remove it from the cookies
            deletePokemonCookie(pokemonResult.id);
        }
    }

    if (pokemonTeamList.length == 0) {
        $('#current-team-container').append('<div class="result-container">No Pok&eacute;mon have been added to your team!</div>');
    }
}

/*
    Cookie Functions
*/
/**
 * Function for retrieving a specific cookie, copied via https://www.w3schools.com/js/js_cookies.asp
 * @param {*} cname     Name of the cookie
 * @returns             Value of the cookie
 */
function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

/**
 * This function retrieve an array of pokemon ids from the cookies, labeled "arrayOfPokemonIds"
 * @returns     The array of pokemon ids
 */
function retrieveOrCreatePokemonIdsFromCookies() {
    let pokemonIdListString = getCookie('pokemonIdList');
    if (pokemonIdListString != '') {
        return JSON.parse(pokemonIdListString);
    } else {
        // Cookie didn't exist, create a blank one
        let pokemonIdList = [];
        document.cookie = "pokemonIdList=" + JSON.stringify(pokemonIdList) + ";expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/;SameSite=Lax";
        return pokemonIdList;
    }
}

/**
 * This function takes an array of pokemon ids, looping through each one and creating/returning an array of their respective pokemon after being retrieved from cookies
 * @param {*} arrayOfPokemonIds     Array of pokemon ids to use to retrieve pokemon cookies
 * @returns                         Array of pokemon retrieved from cookies
 */
function retrievePokemonFromCookies(arrayOfPokemonIds) {
    const pokemonArray = [];

    for (let i = 0; i < arrayOfPokemonIds.length; i++) {
        const pokemonId = arrayOfPokemonIds[i];
        const pokemonValues = JSON.parse(getCookie(pokemonId));
        pokemonArray.push(new Pokemon(pokemonId, pokemonValues.name, pokemonValues.teraType));
    }

    return pokemonArray;
}

/**
 * This function will create a pokemon cookie, add its id to the pokemonIdList cookie, and adding it to the pokemonTeamList/pokemonIdList arrays
 * @param {*} name 
 * @param {*} offensiveType 
 * @param {*} defensiveTypes 
 * @param {*} imageURL 
 */
function createPokemonCookie(name, teraType) {
    const newPokemonId = 'pokemon' + new Date().getTime();
    const newPokemon = new Pokemon(newPokemonId, name, teraType);
    const newPokemonJSON = JSON.stringify(newPokemon);
    pokemonTeamList.push(newPokemon);
    document.cookie = newPokemonId + "=" + newPokemonJSON + ";expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/;SameSite=Lax";

    // Add the new pokemon id to the array of existing pokemon ids and update its cookie
    pokemonIdList.push(newPokemonId);
    document.cookie = "pokemonIdList=" + JSON.stringify(pokemonIdList) + ";expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/;SameSite=Lax";
}

/**
 * This function will delete a pokemon using the passed in pokemon id, removing its cookie, removing its id from the pokemoonIdList cookie, and removing
 * it from the pokemonTeamList and pokemonIdList
 * @param {*} pokemonId 
 */
function deletePokemonCookie(pokemonId) {
    document.cookie = pokemonId + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;SameSite=Lax";
    let pokemonTeamListIndex;
    // Find the pokemon's index
    for (let i = 0; i < pokemonTeamList.length; i++) {
        const pokemon = pokemonTeamList[i];
        if (pokemon.id == pokemonId) {
            pokemonTeamListIndex = i;
        }
    }
    pokemonTeamList.splice(pokemonTeamListIndex, 1);

    // Remove the id from the array of existing pokemon ids and update its cookie (snippet pulled from here https://stackoverflow.com/questions/5767325/how-can-i-remove-a-specific-item-from-an-array)
    const pokemonIdListIndex = pokemonIdList.indexOf(pokemonId);
    if (pokemonIdListIndex > -1) { // only splice array when item is found
        pokemonIdList.splice(pokemonIdListIndex, 1);
    }
    document.cookie = "pokemonIdList=" + JSON.stringify(pokemonIdList) + ";expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/;SameSite=Lax";
}

/**
 * Pokemon Master List
 * This would idealy be in an imported JS file
 */
 function getMasterPokemonList() {
    const masterPokemonList = {};

    // Build every pokemon in Paldea...
    masterPokemonList["Abomasnow"] = buildPokemon("Abomasnow","Grass","Ice","https://www.serebii.net/scarletviolet/pokemon/small/460.png","460",["Snow Warning","Soundproof"],"90","92","75","92","85","60");
    masterPokemonList["Alomomola"] = buildPokemon("Alomomola","Water","None","https://www.serebii.net/scarletviolet/pokemon/small/594.png","594",["Healer","Hydration","Regenerator"],"165","75","80","40","45","65");
    masterPokemonList["Altaria"] = buildPokemon("Altaria","Dragon","Flying","https://www.serebii.net/scarletviolet/pokemon/small/334.png","334",["Natural Cure","Cloud Nine"],"75","70","90","70","105","80");
    masterPokemonList["Amoonguss"] = buildPokemon("Amoonguss","Grass","None","https://www.serebii.net/scarletviolet/pokemon/small/591.png","591",["Effect Spore","Regenerator"],"114","85","70","85","80","30");
    masterPokemonList["Ampharos"] = buildPokemon("Ampharos","Electric","None","https://www.serebii.net/scarletviolet/pokemon/small/181.png","181",["Static","Plus"],"90","75","85","115","90","55");
    masterPokemonList["Annihilape"] = buildPokemon("Annihilape","Fighting","Ghost","https://www.serebii.net/scarletviolet/pokemon/small/1010.png","1010",["Vital Spirit","Inner Focus","Defiant"],"110","115","80","50","90","90");
    masterPokemonList["Appletun"] = buildPokemon("Appletun","Grass","Dragon","https://www.serebii.net/scarletviolet/pokemon/small/842.png","842",["Ripen","Gluttony","Thick Fat"],"110","85","80","100","80","30");
    masterPokemonList["Arboliva"] = buildPokemon("Arboliva","Grass","None","https://www.serebii.net/scarletviolet/pokemon/small/937.png","937",["Seed Sower","Harvest"],"78","69","90","125","109","39");
    masterPokemonList["Arcanine"] = buildPokemon("Arcanine","Fire","None","https://www.serebii.net/scarletviolet/pokemon/small/059.png","059",["Intimidate","Flash Fire","Justified"],"90","110","80","100","80","95");
    masterPokemonList["Armarouge"] = buildPokemon("Armarouge","Fire","Psychic","https://www.serebii.net/scarletviolet/pokemon/small/1004.png","1004",["Flash Fire","Weak Armor"],"85","60","100","125","80","75");
    masterPokemonList["Avalugg"] = buildPokemon("Avalugg","Ice","None","https://www.serebii.net/scarletviolet/pokemon/small/713.png","713",["Own Tempo","Ice Body","Sturdy"],"95","117","184","44","46","28");
    masterPokemonList["Azumarill"] = buildPokemon("Azumarill","Water","Fairy","https://www.serebii.net/scarletviolet/pokemon/small/184.png","184",["Thick Fat","Huge Power","Sap Sipper"],"100","50","80","60","80","50");
    masterPokemonList["Banette"] = buildPokemon("Banette","Ghost","None","https://www.serebii.net/scarletviolet/pokemon/small/354.png","354",["Insomnia","Frisk","Cursed Body"],"64","115","65","83","63","65");
    masterPokemonList["Barraskewda"] = buildPokemon("Barraskewda","Water","None","https://www.serebii.net/scarletviolet/pokemon/small/847.png","847",["Swift Swim","Propeller Tail"],"61","123","60","60","50","136");
    masterPokemonList["Basculin"] = buildPokemon("Basculin","Water","None","https://www.serebii.net/scarletviolet/pokemon/small/550.png","550",["Reckless","Adaptability","Mold Breaker"],"70","92","65","80","55","98");
    masterPokemonList["Baxcalibur"] = buildPokemon("Baxcalibur","Dragon","Ice","https://www.serebii.net/scarletviolet/pokemon/small/951.png","951",["Thermal Exchange","Ice Body"],"115","145","92","75","86","87");
    masterPokemonList["Beartic"] = buildPokemon("Beartic","Ice","None","https://www.serebii.net/scarletviolet/pokemon/small/614.png","614",["Snow Cloak","Slush Rush","Swift Swim"],"95","130","80","70","80","50");
    masterPokemonList["Bellibolt"] = buildPokemon("Bellibolt","Electric","None","https://www.serebii.net/scarletviolet/pokemon/small/941.png","941",["Electromorphosis","Static","Damp"],"109","64","91","103","83","45");
    masterPokemonList["Bisharp"] = buildPokemon("Bisharp","Steel","Dark","https://www.serebii.net/scarletviolet/pokemon/small/625.png","625",["Defiant","Inner Focus","Pressure"],"65","125","100","60","70","70");
    masterPokemonList["Blissey"] = buildPokemon("Blissey","Normal","None","https://www.serebii.net/scarletviolet/pokemon/small/242.png","242",["Natural Cure","Serene Grace","Healer"],"255","10","10","75","135","55");
    masterPokemonList["Bombirdier"] = buildPokemon("Bombirdier","Flying","Dark","https://www.serebii.net/scarletviolet/pokemon/small/959.png","959",["Big Pecks","Keen Eye","Rocky Payload"],"70","103","85","60","85","82");
    masterPokemonList["Brambleghast"] = buildPokemon("Brambleghast","Grass","Ghost","https://www.serebii.net/scarletviolet/pokemon/small/975.png","975",["Wind Rider","Infiltrator"],"55","115","70","80","70","90");
    masterPokemonList["Braviary"] = buildPokemon("Braviary","Flying","Normal","https://www.serebii.net/scarletviolet/pokemon/small/628.png","628",["Keen Eye","Sheer Force","Defiant"],"100","123","75","57","75","80");
    masterPokemonList["Breloom"] = buildPokemon("Breloom","Grass","Fighting","https://www.serebii.net/scarletviolet/pokemon/small/286.png","286",["Effect Spore","Poison Heal","Technician"],"60","130","80","60","60","70");
    masterPokemonList["Bronzong"] = buildPokemon("Bronzong","Steel","Psyhic","https://www.serebii.net/scarletviolet/pokemon/small/437.png","437",["Levitate","Heatproof","Heavy Metal"],"67","89","116","79","116","33");
    masterPokemonList["Brute Bonnet"] = buildPokemon("Brute Bonnet","Grass","Dark","https://www.serebii.net/scarletviolet/pokemon/small/979.png","979",["Protosynthesis"],"111","127","99","79","99","55");
    masterPokemonList["Bruxish"] = buildPokemon("Bruxish","Water","Psychic","https://www.serebii.net/scarletviolet/pokemon/small/779.png","779",["Dazzling","Strong Jaw","Wonder Skin"],"68","105","70","70","70","92");
    masterPokemonList["Cacturne"] = buildPokemon("Cacturne","Grass","Dark","https://www.serebii.net/scarletviolet/pokemon/small/332.png","332",["Sand Veil","Water Absorb"],"70","115","60","115","60","55");
    masterPokemonList["Camerupt"] = buildPokemon("Camerupt","Fire","Ground","https://www.serebii.net/scarletviolet/pokemon/small/323.png","323",["Magma Armor","Solid Rock","Anger Point"],"70","100","70","105","75","40");
    masterPokemonList["Ceruledge"] = buildPokemon("Ceruledge","Fire","Ghost","https://www.serebii.net/scarletviolet/pokemon/small/1005.png","1005",["Flash Fire","Weak Armor"],"75","125","80","60","100","85");
    masterPokemonList["Cetitan"] = buildPokemon("Cetitan","Ice","None","https://www.serebii.net/scarletviolet/pokemon/small/948.png","948",["Thick Fat","Slush Rush","Sheer Force"],"170","113","65","45","55","73");
    masterPokemonList["Charizard"] = buildPokemon("Charizard","Fire","Flying","https://www.serebii.net/scarletviolet/pokemon/small/006.png","6",["Blaze","Solar Power"],"78","84","78","109","85","100");
    masterPokemonList["Chansey"] = buildPokemon("Chansey","Normal","None","https://www.serebii.net/scarletviolet/pokemon/small/113.png","113",["Natural Cure","Serene Grace","Healer"],"250","5","5","35","105","50");
    masterPokemonList["Chi-Yu"] = buildPokemon("Chi-Yu","Dark","Fire","https://www.serebii.net/scarletviolet/pokemon/small/997.png","997",["Beads of Ruin"],"55","80","80","135","120","100");
    masterPokemonList["Chien-Pao"] = buildPokemon("Chien-Pao","Dark","Ice","https://www.serebii.net/scarletviolet/pokemon/small/995.png","995",["Sword of Ruin"],"80","120","80","90","65","135");
    masterPokemonList["Clawitzer"] = buildPokemon("Clawitzer","Water","None","https://www.serebii.net/scarletviolet/pokemon/small/693.png","693",["Mega Launcher"],"71","73","88","120","89","59");
    masterPokemonList["Clodsire"] = buildPokemon("Clodsire","Poison","Ground","https://www.serebii.net/scarletviolet/pokemon/small/1009.png","1009",["Poison Point","Water Absorb","Unaware"],"130","75","60","45","100","20");
    masterPokemonList["Cloyster"] = buildPokemon("Cloyster","Water","Ice","https://www.serebii.net/scarletviolet/pokemon/small/91.png","91",["Shell Armor","Skill Link","Overcoat"],"50","95","180","85","45","70");
    masterPokemonList["Coalossal"] = buildPokemon("Coalossal","Rock","Fire","https://www.serebii.net/scarletviolet/pokemon/small/839.png","839",["Steam Engine","Flame Body","Flash Fire"],"110","80","120","80","90","30");
    masterPokemonList["Copperajah"] = buildPokemon("Copperajah","Steel","None","https://www.serebii.net/scarletviolet/pokemon/small/879.png","879",["Sheer Force","Heavy Metal"],"122","130","69","80","69","30");
    masterPokemonList["Corviknight"] = buildPokemon("Corviknight","Flying","Steel","https://www.serebii.net/scarletviolet/pokemon/small/823.png","823",["Pressure","Unnerve","Mirror Armor"],"98","87","105","53","85","67");
    masterPokemonList["Crabominable"] = buildPokemon("Crabominable","Fighting","Ice","https://www.serebii.net/scarletviolet/pokemon/small/740.png","740",["Hyper Cutter","Iron Fist","Anger Point"],"97","132","77","62","67","43");
    masterPokemonList["Cryogonal"] = buildPokemon("Cryogonal","Ice","None","https://www.serebii.net/scarletviolet/pokemon/small/615.png","615",["Levitate"],"80","50","50","95","135","105");
    masterPokemonList["Cyclizar"] = buildPokemon("Cyclizar","Normal","None","https://www.serebii.net/scarletviolet/pokemon/small/953.png","953",["Shed Skin","Regenerator"],"70","95","65","85","65","121");
    masterPokemonList["Dachsbun"] = buildPokemon("Dachsbun","Fairy","None","https://www.serebii.net/scarletviolet/pokemon/small/971.png","971",["Well-Baked Body","Aroma Veil"],"57","80","115","50","80","95");
    masterPokemonList["Dedenne"] = buildPokemon("Dedenne","Electric","Fairy","https://www.serebii.net/scarletviolet/pokemon/small/702.png","702",["Cheek Pouch","Pickup","Plus"],"67","58","57","81","67","101");
    masterPokemonList["Delibird"] = buildPokemon("Delibird","Ice","None","https://www.serebii.net/scarletviolet/pokemon/small/225.png","225",["Vital Spirit","Hustle","Insomnia"],"45","55","45","65","45","75");
    masterPokemonList["Ditto"] = buildPokemon("Ditto","Normal","None","https://www.serebii.net/scarletviolet/pokemon/small/132.png","132",["Limber","Imposter"],"48","48","48","48","48","48");
    masterPokemonList["Dondozo"] = buildPokemon("Dondozo","Water","None","https://www.serebii.net/scarletviolet/pokemon/small/931.png","931",["Unaware","Oblivious","Water Veil"],"150","100","115","65","65","35");
    masterPokemonList["Donphan"] = buildPokemon("Donphan","Ground","None","https://www.serebii.net/scarletviolet/pokemon/small/232.png","232",["Sturdy","Sand Veil"],"90","120","120","60","60","50");
    masterPokemonList["Dragalge"] = buildPokemon("Dragalge","Dragon","Poison","https://www.serebii.net/scarletviolet/pokemon/small/691.png","691",["Poison Point","Poison Touch","Adaptability"],"65","75","90","97","123","44");
    masterPokemonList["Dragapult"] = buildPokemon("Dragapult","Dragon","Ghost","https://www.serebii.net/scarletviolet/pokemon/small/887.png","887",["Clear Body","Infiltrator","Cursed Body"],"88","120","75","100","75","142");
    masterPokemonList["Dragonite"] = buildPokemon("Dragonite","Dragon","Flying","https://www.serebii.net/scarletviolet/pokemon/small/149.png","149",["Inner Focus","Multiscale"],"91","134","95","100","100","80");
    masterPokemonList["Drednaw"] = buildPokemon("Drednaw","Water","Rock","https://www.serebii.net/scarletviolet/pokemon/small/834.png","834",["Strong Jaw","Shell Armor","Swift Swim"],"90","115","90","48","68","74");
    masterPokemonList["Drifblim"] = buildPokemon("Drifblim","Ghost","Flying","https://www.serebii.net/scarletviolet/pokemon/small/426.png","426",["Aftermath","Unburden","Flare Boost"],"150","80","44","90","54","80");
    masterPokemonList["Dudunsparce"] = buildPokemon("Dudunsparce","Normal","None","https://www.serebii.net/scarletviolet/pokemon/small/917.png","917",["Serene Grace","Run Away","Rattled"],"125","100","80","85","75","55");
    masterPokemonList["Dugtrio"] = buildPokemon("Dugtrio","Ground","None","https://www.serebii.net/scarletviolet/pokemon/small/51.png","51",["Sand Veil","Arena Trap","Sand Force"],"35","100","50","50","70","120");
    masterPokemonList["Dunsparce"] = buildPokemon("Dunsparce","Normal","None","https://www.serebii.net/scarletviolet/pokemon/small/206.png","206",["Serene Grace","Run Away","Rattled"],"100","70","70","65","65","45");
    masterPokemonList["Eelektross"] = buildPokemon("Eelektross","Electric","None","https://www.serebii.net/scarletviolet/pokemon/small/604.png","604",["Levitate"],"85","115","80","105","80","50");
    masterPokemonList["Eiscue"] = buildPokemon("Eiscue","Ice","None","https://www.serebii.net/scarletviolet/pokemon/small/875.png","875",["Ice Face"],"75","80","110","65","90","50");
    masterPokemonList["Electrode"] = buildPokemon("Electrode","Electric","None","https://www.serebii.net/scarletviolet/pokemon/small/101.png","101",["Soundproof","Static","Aftermath"],"60","50","70","80","80","150");
    masterPokemonList["Espathra"] = buildPokemon("Espathra","Psychic","None","https://www.serebii.net/scarletviolet/pokemon/small/927.png","927",["Opportunist","Frisk","Speed Boost"],"95","60","60","101","60","105");
    masterPokemonList["Espeon"] = buildPokemon("Espeon","Psychic","None","https://www.serebii.net/scarletviolet/pokemon/small/196.png","196",["Synchronize","Magic Bounce"],"65","65","60","130","95","110");
    masterPokemonList["Falinks"] = buildPokemon("Falinks","Fighting","None","https://www.serebii.net/scarletviolet/pokemon/small/870.png","870",["Battle Armor","Defiant"],"65","100","100","70","60","75");
    masterPokemonList["Farigiraf"] = buildPokemon("Farigiraf","Normal","Psychic","https://www.serebii.net/scarletviolet/pokemon/small/928.png","928",["Cud Chew","Armor Tail","Sap Sipper"],"120","90","70","110","70","60");
    masterPokemonList["Flamigo"] = buildPokemon("Flamigo","Flying","Fighting","https://www.serebii.net/scarletviolet/pokemon/small/961.png","961",["Scrappy","Tangled Feet","Costar"],"82","115","74","75","64","90");
    masterPokemonList["Flapple"] = buildPokemon("Flapple","Dragon","Grass","https://www.serebii.net/scarletviolet/pokemon/small/841.png","841",["Ripen","Gluttony","Hustle"],"70","110","80","95","60","70");
    masterPokemonList["Flareon"] = buildPokemon("Flareon","Fire","None","https://www.serebii.net/scarletviolet/pokemon/small/136.png","136",["Flash Fire","Guts"],"65","130","60","95","110","65");
    masterPokemonList["Floatzel"] = buildPokemon("Floatzel","Water","None","https://www.serebii.net/scarletviolet/pokemon/small/419.png","419",["Swift Swim","Water Veil"],"85","105","55","85","50","115");
    masterPokemonList["Florges"] = buildPokemon("Florges","Fairy","None","https://www.serebii.net/scarletviolet/pokemon/small/671.png","671",["Flower Veil","Symbiosis"],"78","65","68","112","154","75");
    masterPokemonList["Flutter Mane"] = buildPokemon("Flutter Mane","Fairy","Ghost","https://www.serebii.net/scarletviolet/pokemon/small/983.png","983",["Protosynthesis"],"55","55","55","135","135","135");
    masterPokemonList["Forretress"] = buildPokemon("Forretress","Bug","Steel","https://www.serebii.net/scarletviolet/pokemon/small/205.png","205",["Sturdy","Overcoat"],"75","90","140","60","60","40");
    masterPokemonList["Froslass"] = buildPokemon("Froslass","Ice","Ghost","https://www.serebii.net/scarletviolet/pokemon/small/478.png","478",["Snow Cloak","Cursed Body"],"70","80","70","80","70","110");
    masterPokemonList["Frosmoth"] = buildPokemon("Frosmoth","Ice","Bug","https://www.serebii.net/scarletviolet/pokemon/small/873.png","873",["Shield Dust","Ice Scales"],"70","65","60","125","90","65");
    masterPokemonList["Gallade"] = buildPokemon("Gallade","Psychic","Fighting","https://www.serebii.net/scarletviolet/pokemon/small/475.png","475",["Steadfast","Justified"],"68","125","65","65","115","80");
    masterPokemonList["Garchomp"] = buildPokemon("Garchomp","Ground","Dragon","https://www.serebii.net/scarletviolet/pokemon/small/445.png","445",["Sand Veil","Rough Skin"],"108","130","95","80","85","102");
    masterPokemonList["Gardevoir"] = buildPokemon("Gardevoir","Psychic","Fairy","https://www.serebii.net/scarletviolet/pokemon/small/282.png","282",["Synchronize","Trace","Telepathy"],"68","65","65","125","115","80");
    masterPokemonList["Garganacl"] = buildPokemon("Garganacl","Rock","None","https://www.serebii.net/scarletviolet/pokemon/small/965.png","965",["Purifying Salt","Sturdy","Clear Body"],"100","100","130","45","90","35");
    masterPokemonList["Gastrodon"] = buildPokemon("Gastrodon","Ground","Water","https://www.serebii.net/scarletviolet/pokemon/small/423.png","423",["Sticky Hold","Storm Drain","Sand Force"],"111","83","68","92","82","39");
    masterPokemonList["Gengar"] = buildPokemon("Gengar","Ghost","Poison","https://www.serebii.net/scarletviolet/pokemon/small/94.png","94",["Cursed Body"],"60","65","60","130","75","110");
    masterPokemonList["Gholdengo"] = buildPokemon("Gholdengo","Steel","Ghost","https://www.serebii.net/scarletviolet/pokemon/small/977.png","977",["Good as Gold"],"87","60","95","133","91","84");
    masterPokemonList["Girafarig"] = buildPokemon("Girafarig","Normal","Psychic","https://www.serebii.net/scarletviolet/pokemon/small/203.png","203",["Inner Focus","Early Bird","Sap Sipper"],"70","80","65","90","65","85");
    masterPokemonList["Glaceon"] = buildPokemon("Glaceon","Ice","None","https://www.serebii.net/scarletviolet/pokemon/small/471.png","471",["Snow Cloak","Ice Body"],"65","60","110","130","95","65");
    masterPokemonList["Glalie"] = buildPokemon("Glalie","Ice","None","https://www.serebii.net/scarletviolet/pokemon/small/362.png","362",["Inner Focus","Ice Body","Moody"],"80","80","80","80","80","80");
    masterPokemonList["Glimmora"] = buildPokemon("Glimmora","Rock","Poison","https://www.serebii.net/scarletviolet/pokemon/small/967.png","967",["Toxic Debris","Corrosion"],"83","55","90","130","81","86");
    masterPokemonList["Gogoat"] = buildPokemon("Gogoat","Grass","None","https://www.serebii.net/scarletviolet/pokemon/small/673.png","673",["Sap Sipper","Grass Pelt"],"123","100","62","97","81","68");
    masterPokemonList["Golduck"] = buildPokemon("Golduck","Water","None","https://www.serebii.net/scarletviolet/pokemon/small/55.png","55",["Damp","Cloud Nine","Swift Swim"],"80","82","78","95","80","85");
    masterPokemonList["Goodra"] = buildPokemon("Goodra","Dragon","None","https://www.serebii.net/scarletviolet/pokemon/small/706.png","706",["Sap Sipper","Hydration","Gooey"],"90","100","70","110","150","80");
    masterPokemonList["Gothitelle"] = buildPokemon("Gothitelle","Psychic","None","https://www.serebii.net/scarletviolet/pokemon/small/576.png","576",["Frisk","Competitive","Shadow Tag"],"70","55","95","95","110","65");
    masterPokemonList["Grafaiai"] = buildPokemon("Grafaiai","Poison","Normal","https://www.serebii.net/scarletviolet/pokemon/small/969.png","969",["Unburden","Poison Touch","Prankster"],"63","95","65","80","72","110");
    masterPokemonList["Great Tusk"] = buildPokemon("Great Tusk","Ground","Fighting","https://www.serebii.net/scarletviolet/pokemon/small/978.png","978",["Protosynthesis"],"115","131","131","53","53","87");
    masterPokemonList["Greedent"] = buildPokemon("Greedent","Normal","None","https://www.serebii.net/scarletviolet/pokemon/small/820.png","820",["Cheek Pouch","Gluttony"],"120","95","95","55","75","20");
    masterPokemonList["Grimmsnarl"] = buildPokemon("Grimmsnarl","Fairy","Dark","https://www.serebii.net/scarletviolet/pokemon/small/861.png","861",["Prankster","Frisk","Pickpocket"],"95","120","65","95","75","60");
    masterPokemonList["Grumpig"] = buildPokemon("Grumpig","Psychic","None","https://www.serebii.net/scarletviolet/pokemon/small/326.png","326",["Thick Fat","Own Tempo","Gluttony"],"80","45","65","90","110","80");
    masterPokemonList["Gumshoos"] = buildPokemon("Gumshoos","Normal","None","https://www.serebii.net/scarletviolet/pokemon/small/735.png","735",["Stakeout","Strong Jaw","Adaptability"],"88","110","60","55","60","45");
    masterPokemonList["Gyarados"] = buildPokemon("Gyarados","Water","Flying","https://www.serebii.net/scarletviolet/pokemon/small/130.png","130",["Intimidate","Moxie"],"95","125","79","60","100","81");
    masterPokemonList["Hariyama"] = buildPokemon("Hariyama","Fighting","None","https://www.serebii.net/scarletviolet/pokemon/small/297.png","297",["Thick Fat","Guts","Sheer Force"],"144","120","60","40","60","50");
    masterPokemonList["Hatterene"] = buildPokemon("Hatterene","Psychic","Fairy","https://www.serebii.net/scarletviolet/pokemon/small/858.png","858",["Healer","Anticipation","Magic Bounce"],"57","90","95","136","103","29");
    masterPokemonList["Hawlucha"] = buildPokemon("Hawlucha","Fighting","Flying","https://www.serebii.net/scarletviolet/pokemon/small/701.png","701",["Limber","Unburden","Mold Breaker"],"78","92","75","74","63","118");
    masterPokemonList["Haxorus"] = buildPokemon("Haxorus","Dragon","None","https://www.serebii.net/scarletviolet/pokemon/small/612.png","612",["Rivalry","Mold Breaker","Unnerve"],"76","147","90","60","70","97");
    masterPokemonList["Heracross"] = buildPokemon("Heracross","Bug","None","https://www.serebii.net/scarletviolet/pokemon/small/214.png","214",["Swarm","Guts","Moxie"],"80","125","75","40","95","85");
    masterPokemonList["Hippowdon"] = buildPokemon("Hippowdon","Ground","None","https://www.serebii.net/scarletviolet/pokemon/small/450.png","450",["Sand Stream","Sand Force"],"108","112","118","68","72","47");
    masterPokemonList["Honchkrow"] = buildPokemon("Honchkrow","Dark","Flying","https://www.serebii.net/scarletviolet/pokemon/small/430.png","430",["Insomnia","Super Luck","Moxie"],"100","125","52","105","52","71");
    masterPokemonList["Houndoom"] = buildPokemon("Houndoom","Dark","Fire","https://www.serebii.net/scarletviolet/pokemon/small/229.png","229",["Early Bird","Flash Fire","Unnerve"],"75","90","50","110","80","95");
    masterPokemonList["Houndstone"] = buildPokemon("Houndstone","Ghost","None","https://www.serebii.net/scarletviolet/pokemon/small/925.png","925",["Sand Rush","Fluffy"],"72","101","100","50","97","68");
    masterPokemonList["Hydreigon"] = buildPokemon("Hydreigon","Dragon","Dark","https://www.serebii.net/scarletviolet/pokemon/small/635.png","635",["Levitate"],"92","105","90","125","90","98");
    masterPokemonList["Hypno"] = buildPokemon("Hypno","Psychic","None","https://www.serebii.net/scarletviolet/pokemon/small/97.png","97",["Insomnia","Forewarn","Inner Focus"],"85","73","70","73","115","67");
    masterPokemonList["Indeedee"] = buildPokemon("Indeedee","Psyhic","Normal","https://www.serebii.net/scarletviolet/pokemon/small/876.png","876",["Inner Focus","Synchronize","Psychic Surge"],"60","65","55","105","95","95");
    masterPokemonList["Iron Bundle"] = buildPokemon("Iron Bundle","Water","Ice","https://www.serebii.net/scarletviolet/pokemon/small/992.png","992",["Quark Drive"],"56","80","114","124","60","136");
    masterPokemonList["Iron Hands"] = buildPokemon("Iron Hands","Electric","Fighting","https://www.serebii.net/scarletviolet/pokemon/small/989.png","989",["Quark Drive"],"154","140","108","50","68","50");
    masterPokemonList["Iron Jugulis"] = buildPokemon("Iron Jugulis","Dark","Flying","https://www.serebii.net/scarletviolet/pokemon/small/990.png","990",["Quark Drive"],"94","80","86","122","80","108");
    masterPokemonList["Iron Moth"] = buildPokemon("Iron Moth","Fire","Poison","https://www.serebii.net/scarletviolet/pokemon/small/988.png","988",["Quark Drive"],"80","70","60","140","110","110");
    masterPokemonList["Iron Thorns"] = buildPokemon("Iron Thorns","Rock","Electric","https://www.serebii.net/scarletviolet/pokemon/small/991.png","991",["Quark Drive"],"100","134","110","70","84","72");
    masterPokemonList["Iron Treads"] = buildPokemon("Iron Treads","Ground","Steel","https://www.serebii.net/scarletviolet/pokemon/small/986.png","986",["Quark Drive"],"90","112","120","72","70","106");
    masterPokemonList["Iron Valiant"] = buildPokemon("Iron Valiant","Fairy","Fighting","https://www.serebii.net/scarletviolet/pokemon/small/993.png","993",["Quark Drive"],"74","130","90","120","60","116");
    masterPokemonList["Jolteon"] = buildPokemon("Jolteon","Electric","None","https://www.serebii.net/scarletviolet/pokemon/small/135.png","135",["Volt Absorb","Quick Feet"],"65","65","60","110","95","130");
    masterPokemonList["Jumpluff"] = buildPokemon("Jumpluff","Grass","Flying","https://www.serebii.net/scarletviolet/pokemon/small/189.png","189",["Chlorophyll","Leaf Guard","Infiltrator"],"75","55","70","55","95","110");
    masterPokemonList["Kilowattrel"] = buildPokemon("Kilowattrel","Electric","Flying","https://www.serebii.net/scarletviolet/pokemon/small/958.png","958",["Wind Power","Volt Absorb","Competitive"],"70","70","60","105","60","125");
    masterPokemonList["Kingambit"] = buildPokemon("Kingambit","Dark","Steel","https://www.serebii.net/scarletviolet/pokemon/small/1008.png","1008",["Defiant","Supreme Overlord","Pressure"],"100","135","120","60","85","50");
    masterPokemonList["Klawf"] = buildPokemon("Klawf","Rock","None","https://www.serebii.net/scarletviolet/pokemon/small/962.png","962",["Anger Shell","Shell Armor","Regenerator"],"70","100","115","35","55","75");
    masterPokemonList["Klefki"] = buildPokemon("Klefki","Steel","Fairy","https://www.serebii.net/scarletviolet/pokemon/small/707.png","707",["Prankster","Magician"],"57","80","91","80","87","75");
    masterPokemonList["Komala"] = buildPokemon("Komala","Normal","None","https://www.serebii.net/scarletviolet/pokemon/small/775.png","775",["Comatose"],"65","115","65","75","95","65");
    masterPokemonList["Koraidon"] = buildPokemon("Koraidon","Dragon","Fighting","https://www.serebii.net/scarletviolet/pokemon/small/998.png","998",["Orichalcum Pulse"],"100","135","115","85","100","135");
    masterPokemonList["Kricketune"] = buildPokemon("Kricketune","Bug","None","https://www.serebii.net/scarletviolet/pokemon/small/402.png","402",["Swarm","Technician"],"77","85","51","55","51","65");
    masterPokemonList["Krookodile"] = buildPokemon("Krookodile","Dark","Ground","https://www.serebii.net/scarletviolet/pokemon/small/553.png","553",["Intimidate","Moxie","Anger Point"],"95","117","80","65","70","92");
    masterPokemonList["Leafeon"] = buildPokemon("Leafeon","Grass","None","https://www.serebii.net/scarletviolet/pokemon/small/470.png","470",["Leaf Guard","Chlorophyll"],"65","110","130","60","65","95");
    masterPokemonList["Lilligant"] = buildPokemon("Lilligant","Grass","None","https://www.serebii.net/scarletviolet/pokemon/small/549.png","549",["Chlorophyll","Own Tempo","Leaf Guard"],"70","60","75","110","75","90");
    masterPokemonList["Lokix"] = buildPokemon("Lokix","Bug","Dark","https://www.serebii.net/scarletviolet/pokemon/small/921.png","921",["Swarm","Tinted Lens"],"71","102","78","52","55","92");
    masterPokemonList["Lucario"] = buildPokemon("Lucario","Steel","Fighting","https://www.serebii.net/scarletviolet/pokemon/small/448.png","448",["Steadfast","Inner Focus","Justified"],"70","110","70","115","70","90");
    masterPokemonList["Lumineon"] = buildPokemon("Lumineon","Water","None","https://www.serebii.net/scarletviolet/pokemon/small/457.png","457",["Swift Swim","Storm Drain","Water Veil"],"69","69","76","69","86","91");
    masterPokemonList["Lurantis"] = buildPokemon("Lurantis","Grass","None","https://www.serebii.net/scarletviolet/pokemon/small/754.png","754",["Leaf Guard","Contrary"],"70","105","90","80","90","45");
    masterPokemonList["Luvdisc"] = buildPokemon("Luvdisc","Water","None","https://www.serebii.net/scarletviolet/pokemon/small/370.png","370",["Swift Swim","Hydration"],"43","30","55","40","65","97");
    masterPokemonList["Luxray"] = buildPokemon("Luxray","Electric","None","https://www.serebii.net/scarletviolet/pokemon/small/405.png","405",["Rivalry","Intimidate","Guts"],"80","120","79","95","79","70");
    masterPokemonList["Lycanroc"] = buildPokemon("Lycanroc","Rock","None","https://www.serebii.net/scarletviolet/pokemon/small/745.png","745",["Keen Eye","Sand Rush","Steadfast"],"75","115","65","55","65","112");
    masterPokemonList["Mabosstiff"] = buildPokemon("Mabosstiff","Dark","None","https://www.serebii.net/scarletviolet/pokemon/small/973.png","973",["Intimidate","Guard Dog","Stakeout"],"80","120","90","60","70","85");
    masterPokemonList["Magneton"] = buildPokemon("Magneton","Electric","Steel","https://www.serebii.net/scarletviolet/pokemon/small/82.png","82",["Magnet Pull","Sturdy","Analytic"],"50","60","95","120","70","70");
    masterPokemonList["Magnezone"] = buildPokemon("Magnezone","Electric","Steel","https://www.serebii.net/scarletviolet/pokemon/small/462.png","462",["Magnet Pull","Sturdy","Analytic"],"70","70","115","130","90","60");
    masterPokemonList["Masquerain"] = buildPokemon("Masquerain","Bug","Flying","https://www.serebii.net/scarletviolet/pokemon/small/284.png","284",["Intimidate","Unnerve"],"70","60","62","100","82","80");
    masterPokemonList["Maushold"] = buildPokemon("Maushold","Normal","None","https://www.serebii.net/scarletviolet/pokemon/small/946.png","946",["Friend Guard","Cheek Pouch","Technician"],"74","75","70","65","75","111");
    masterPokemonList["Medicham"] = buildPokemon("Medicham","Fighting","Psychic","https://www.serebii.net/scarletviolet/pokemon/small/308.png","308",["Pure Power","Telepathy"],"60","60","75","60","75","80");
    masterPokemonList["Meowscarada"] = buildPokemon("Meowscarada","Grass","Dark","https://www.serebii.net/scarletviolet/pokemon/small/908.png","908",["Overgrow","Protean"],"76","110","70","81","70","123");
    masterPokemonList["Mimikyu"] = buildPokemon("Mimikyu","Ghost","Fairy","https://www.serebii.net/scarletviolet/pokemon/small/778.png","778",["Disguise"],"55","90","80","50","105","96");
    masterPokemonList["Miraidon"] = buildPokemon("Miraidon","Dragon","Electric","https://www.serebii.net/scarletviolet/pokemon/small/999.png","999",["Hadron Engine"],"100","85","100","135","115","135");
    masterPokemonList["Misdreavus"] = buildPokemon("Misdreavus","Ghost","None","https://www.serebii.net/scarletviolet/pokemon/small/200.png","200",["Levitate"],"60","60","60","85","85","85");
    masterPokemonList["Mismagius"] = buildPokemon("Mismagius","ghost","None","https://www.serebii.net/scarletviolet/pokemon/small/429.png","429",["Levitate"],"60","60","60","105","105","105");
    masterPokemonList["Mudsdale"] = buildPokemon("Mudsdale","Ground","None","https://www.serebii.net/scarletviolet/pokemon/small/750.png","750",["Own Tempo","Stamina","Inner Focus"],"100","125","100","55","85","35");
    masterPokemonList["Muk"] = buildPokemon("Muk","Poison","None","https://www.serebii.net/scarletviolet/pokemon/small/89.png","89",["Stench","Sticky Hold","Poison Touch"],"105","105","75","65","100","50");
    masterPokemonList["Murkrow"] = buildPokemon("Murkrow","Dark","Flying","https://www.serebii.net/scarletviolet/pokemon/small/198.png","198",["Insomnia","Super Luck","Prankster"],"60","85","42","85","42","91");
    masterPokemonList["Noivern"] = buildPokemon("Noivern","Dragon","Flying","https://www.serebii.net/scarletviolet/pokemon/small/715.png","715",["Frisk","Infiltrator","Telepathy"],"85","70","80","97","80","123");
    masterPokemonList["Oinkologne"] = buildPokemon("Oinkologne","Normal","None","https://www.serebii.net/scarletviolet/pokemon/small/916.png","916",["Lingering Aroma","Gluttony","Thick Fat"],"110","100","75","59","80","65");
    masterPokemonList["Oranguru"] = buildPokemon("Oranguru","Psychic","Normal","https://www.serebii.net/scarletviolet/pokemon/small/765.png","765",["Inner Focus","Telepathy","Symbiosis"],"90","60","80","90","110","60");
    masterPokemonList["Oricorio-Electric"] = buildPokemon("Oricorio-Electric","Electric","Flying","https://www.serebii.net/scarletviolet/pokemon/small/741-p.png","741-p",["Dancer"],"75","70","70","98","70","93");
    masterPokemonList["Oricorio-Psychic"] = buildPokemon("Oricorio-Psychic","Psychic","Flying","https://www.serebii.net/scarletviolet/pokemon/small/741-pau.png","741-pau",["Dancer"],"75","70","70","98","70","93");
    masterPokemonList["Oricorio-Fire"] = buildPokemon("Oricorio-Fire","Fire","Flying","https://www.serebii.net/scarletviolet/pokemon/small/741.png","741",["Dancer"],"75","70","70","98","70","93");
    masterPokemonList["Oricorio-Ghost"] = buildPokemon("Oricorio-Ghost","Ghost","Flying","https://www.serebii.net/scarletviolet/pokemon/small/741-s.png","741-s",["Dancer"],"75","70","70","98","70","93");
    masterPokemonList["Orthworm"] = buildPokemon("Orthworm","Steel","None","https://www.serebii.net/scarletviolet/pokemon/small/944.png","944",["Earth Eater","Sand Veil"],"70","85","145","60","55","65");
    masterPokemonList["Pachirisu"] = buildPokemon("Pachirisu","Electric","None","https://www.serebii.net/scarletviolet/pokemon/small/417.png","417",["Run Away","Pickup","Volt Absorb"],"60","45","70","45","90","95");
    masterPokemonList["Palafin"] = buildPokemon("Palafin","Water","None","https://www.serebii.net/scarletviolet/pokemon/small/934.png","934",["Zero to Hero"],"100","70","72","53","62","100");
    masterPokemonList["Palossand"] = buildPokemon("Palossand","Ground","Ghost","https://www.serebii.net/scarletviolet/pokemon/small/770.png","770",["Water Compaction","Sand Veil"],"85","75","110","100","75","35");
    masterPokemonList["Passimian"] = buildPokemon("Passimian","Fighting","None","https://www.serebii.net/scarletviolet/pokemon/small/766.png","766",["Receiver","Defiant"],"100","120","90","40","60","80");
    masterPokemonList["Pawmot"] = buildPokemon("Pawmot","Electric","Fighting","https://www.serebii.net/scarletviolet/pokemon/small/956.png","956",["Volt Absorb","Natural Cure","Iron Fist"],"70","115","70","70","60","105");
    masterPokemonList["Pelipper"] = buildPokemon("Pelipper","Water","Flying","https://www.serebii.net/scarletviolet/pokemon/small/279.png","279",["Keen Eye","Drizzle","Rain Dish"],"60","50","100","95","70","65");
    masterPokemonList["Persian"] = buildPokemon("Persian","Normal","None","https://www.serebii.net/scarletviolet/pokemon/small/53.png","53",["Limber","Technician","Unnerve"],"65","70","60","65","65","115");
    masterPokemonList["Pincurchin"] = buildPokemon("Pincurchin","Electric","None","https://www.serebii.net/scarletviolet/pokemon/small/871.png","871",["Lightning Rod","Electric Surge"],"48","101","95","91","85","15");
    masterPokemonList["Polteageist"] = buildPokemon("Polteageist","Ghost","None","https://www.serebii.net/scarletviolet/pokemon/small/855.png","855",["Weak Armor","Cursed Body"],"60","65","65","134","114","70");
    masterPokemonList["Primeape"] = buildPokemon("Primeape","Fighting","None","https://www.serebii.net/scarletviolet/pokemon/small/57.png","57",["Vital Spirit","Anger Point","Defiant"],"65","105","60","60","70","95");
    masterPokemonList["Pyroar"] = buildPokemon("Pyroar","Normal","Fire","https://www.serebii.net/scarletviolet/pokemon/small/668.png","668",["Rivalry","Unnerve","Moxie"],"86","68","72","109","66","106");
    masterPokemonList["Quaquaval"] = buildPokemon("Quaquaval","Water","Fighting","https://www.serebii.net/scarletviolet/pokemon/small/914.png","914",["Torrent","Moxie"],"85","120","80","85","75","85");
    masterPokemonList["Qwilfish"] = buildPokemon("Qwilfish","Water","None","https://www.serebii.net/scarletviolet/pokemon/small/211.png","211",["Poison Point","Swift Swim","Intimidate"],"65","95","85","55","55","85");
    masterPokemonList["Rabsca"] = buildPokemon("Rabsca","Bug","Psychic","https://www.serebii.net/scarletviolet/pokemon/small/923.png","923",["Synchronize","Telepathy"],"75","50","85","115","100","45");
    masterPokemonList["Raichu"] = buildPokemon("Raichu","Electric","None","https://www.serebii.net/scarletviolet/pokemon/small/26.png","26",["Static","Lightning Rod"],"60","90","55","90","80","110");
    masterPokemonList["Revavroom"] = buildPokemon("Revavroom","Steel","Poison","https://www.serebii.net/scarletviolet/pokemon/small/943.png","943",["Overcoat","Filter"],"80","119","90","54","67","90");
    masterPokemonList["Roaring Moon"] = buildPokemon("Roaring Moon","Dragon","Dark","https://www.serebii.net/scarletviolet/pokemon/small/985.png","985",["Protosynthesis"],"105","139","71","55","101","119");
    masterPokemonList["Rotom"] = buildPokemon("Rotom","Electric","Ghost","https://www.serebii.net/scarletviolet/pokemon/small/479.png","479",["Levitate"],"50","50","77","95","77","91");
    masterPokemonList["Rotom-Fire"] = buildPokemon("Rotom-Fire","Electric","Fire","https://www.serebii.net/scarletviolet/pokemon/small/479-h.png","479-h",["Levitate"],"5065107","105","107","86");
    masterPokemonList["Rotom-Water"] = buildPokemon("Rotom-Water","Electric","Water","https://www.serebii.net/scarletviolet/pokemon/small/479-w.png","479-w",["Levitate"],"50","65","107","105","107","86");
    masterPokemonList["Rotom-Ice"] = buildPokemon("Rotom-Ice","Electric","Ice","https://www.serebii.net/scarletviolet/pokemon/small/479-f.png","479-f",["Levitate"],"50","65","107","105","107","86");
    masterPokemonList["Rotom-Flying"] = buildPokemon("Rotom-Flying","Electric","Flying","https://www.serebii.net/scarletviolet/pokemon/small/479-s.png","479-s",["Levitate"],"50","65","107","105","107","86");
    masterPokemonList["Rotom-Grass"] = buildPokemon("Rotom-Grass","Electric","Grass","https://www.serebii.net/scarletviolet/pokemon/small/479-m.png","479-m",["Levitate"],"50","65","107","105","107","86");
    masterPokemonList["Sableye"] = buildPokemon("Sableye","Ghost","Dark","https://www.serebii.net/scarletviolet/pokemon/small/302.png","302",["Keen Eye","Stall","Prankster"],"50","75","75","65","65","50");
    masterPokemonList["Salamence"] = buildPokemon("Salamence","Dragon","Flying","https://www.serebii.net/scarletviolet/pokemon/small/373.png","373",["Intimidate","Moxie"],"95","135","80","110","80","100");
    masterPokemonList["Salazzle"] = buildPokemon("Salazzle","Fire","Poison","https://www.serebii.net/scarletviolet/pokemon/small/758.png","758",["Corrosion","Oblivious"],"68","64","60","111","60","117");
    masterPokemonList["Sandaconda"] = buildPokemon("Sandaconda","Ground","None","https://www.serebii.net/scarletviolet/pokemon/small/844.png","844",["Sand Spit","Shed Skin","Sand Veil"],"72","107","125","65","70","71");
    masterPokemonList["Sandy Shocks"] = buildPokemon("Sandy Shocks","Ground","Electric","https://www.serebii.net/scarletviolet/pokemon/small/981.png","981",["Protosynthesis"],"85","81","97","121","85","101");
    masterPokemonList["Sawsbuck"] = buildPokemon("Sawsbuck","Normal","None","https://www.serebii.net/scarletviolet/pokemon/small/586.png","586",["Chlorophyll","Sap Sipper","Serene Grace"],"80","100","70","60","70","95");
    masterPokemonList["Scizor"] = buildPokemon("Scizor","Steel","Bug","https://www.serebii.net/scarletviolet/pokemon/small/212.png","212",["Swarm","Technician","Light Metal"],"70","130","100","55","80","65");
    masterPokemonList["Scovillain"] = buildPokemon("Scovillain","Grass","Fire","https://www.serebii.net/scarletviolet/pokemon/small/939.png","939",["Chlorophyll","Insomnia","Moody"],"65","108","65","108","65","75");
    masterPokemonList["Scream Tail"] = buildPokemon("Scream Tail","Fairy","Psychic","https://www.serebii.net/scarletviolet/pokemon/small/982.png","982",["Protosynthesis"],"115","65","99","65","115","111");
    masterPokemonList["Scyther"] = buildPokemon("Scyther","Flying","Bug","https://www.serebii.net/scarletviolet/pokemon/small/123.png","123",["Swarm","Technician","Steadfast"],"70","110","80","55","80","105");
    masterPokemonList["Seviper"] = buildPokemon("Seviper","Poison","None","https://www.serebii.net/scarletviolet/pokemon/small/336.png","336",["Shed Skin","Infiltrator"],"73","100","60","100","60","65");
    masterPokemonList["Skeledirge"] = buildPokemon("Skeledirge","Fire","Ghost","https://www.serebii.net/scarletviolet/pokemon/small/911.png","911",["Blaze","Unaware"],"104","75","100","110","75","66");
    masterPokemonList["Skuntank"] = buildPokemon("Skuntank","Poison","None","https://www.serebii.net/scarletviolet/pokemon/small/435.png","435",["Stench","Aftermath","Keen Eye"],"103","93","67","71","61","84");
    masterPokemonList["Slaking"] = buildPokemon("Slaking","Normal","None","https://www.serebii.net/scarletviolet/pokemon/small/289.png","289",["Truant"],"150","160","100","95","65","100");
    masterPokemonList["Slither Wing"] = buildPokemon("Slither Wing","Bug","Fighting","https://www.serebii.net/scarletviolet/pokemon/small/984.png","984",["Protosynthesis"],"85","135","79","85","105","81");
    masterPokemonList["Slowbro"] = buildPokemon("Slowbro","Water","Psychic","https://www.serebii.net/scarletviolet/pokemon/small/80.png","80",["Oblivious","Own Tempo","Regenerator"],"95","75","110","100","80","30");
    masterPokemonList["Slowking"] = buildPokemon("Slowking","Water","Psychic","https://www.serebii.net/scarletviolet/pokemon/small/199.png","199",["Oblivious","Own Tempo","Regenerator"],"95","75","80","100","110","30");
    masterPokemonList["Sneasel"] = buildPokemon("Sneasel","Dark","Ice","https://www.serebii.net/scarletviolet/pokemon/small/215.png","215",["Inner Focus","Keen Eye","Pickpocket"],"55","95","55","35","75","115");
    masterPokemonList["Spidops"] = buildPokemon("Spidops","Bug","None","https://www.serebii.net/scarletviolet/pokemon/small/919.png","919",["Insomnia","Stakeout"],"60","79","92","52","86","35");
    masterPokemonList["Spiritomb"] = buildPokemon("Spiritomb","Ghost","Dark","https://www.serebii.net/scarletviolet/pokemon/small/442.png","442",["Pressure","Infiltrator"],"50","92","108","92","108","35");
    masterPokemonList["Squawkabilly"] = buildPokemon("Squawkabilly","Flying","Normal","https://www.serebii.net/scarletviolet/pokemon/small/960.png","960",["Intimidate","Hustle","Guts"],"82","96","51","45","51","92");
    masterPokemonList["Stantler"] = buildPokemon("Stantler","Normal","None","https://www.serebii.net/scarletviolet/pokemon/small/234.png","234",["Intimidate","Frisk","Sap Sipper"],"73","95","62","85","65","85");
    masterPokemonList["Staraptor"] = buildPokemon("Staraptor","Flying","Normal","https://www.serebii.net/scarletviolet/pokemon/small/398.png","398",["Intimidate","Reckless"],"85","120","70","50","60","100");
    masterPokemonList["Stonjourner"] = buildPokemon("Stonjourner","Rock","None","https://www.serebii.net/scarletviolet/pokemon/small/874.png","874",["Power Spot"],"100","125","135","20","20","70");
    masterPokemonList["Sudowoodo"] = buildPokemon("Sudowoodo","Rock","None","https://www.serebii.net/scarletviolet/pokemon/small/185.png","185",["Sturdy","Rock Head","Rattled"],"70","100","115","30","65","30");
    masterPokemonList["Sunflora"] = buildPokemon("Sunflora","Grass","None","https://www.serebii.net/scarletviolet/pokemon/small/192.png","192",["Chlorophyll","Solar Power","Early Bird"],"75","75","55","105","85","30");
    masterPokemonList["Swalot"] = buildPokemon("Swalot","Poison","None","https://www.serebii.net/scarletviolet/pokemon/small/317.png","317",["Liquid Ooze","Sticky Hold","Gluttony"],"100","73","83","73","83","55");
    masterPokemonList["Sylveon"] = buildPokemon("Sylveon","Fairy","None","https://www.serebii.net/scarletviolet/pokemon/small/700.png","700",["Cute Charm","Pixilate"],"95","65","65","110","130","60");
    masterPokemonList["Talonflame"] = buildPokemon("Talonflame","Fire","Flying","https://www.serebii.net/scarletviolet/pokemon/small/663.png","663",["Flame Body","Gale Wings"],"78","81","71","74","69","126");
    masterPokemonList["Tatsugiri"] = buildPokemon("Tatsugiri","Water","Dragon","https://www.serebii.net/scarletviolet/pokemon/small/952.png","952",["Commander","Storm Drain"],"68","50","60","120","95","82");
    masterPokemonList["Tauros"] = buildPokemon("Tauros","Fighting","None","https://www.serebii.net/scarletviolet/pokemon/small/128-p.png","128-p",["Intimidate","Anger Point","Sheer Force"],"75","110","105","30","70","100");
    masterPokemonList["Tauros-Fire"] = buildPokemon("Tauros-Fire","Fighting","Fire","https://www.serebii.net/scarletviolet/pokemon/small/128-b.png","128-b",["Intimidate","Anger Point","Sheer Force"],"75","110","105","30","70","100");
    masterPokemonList["Tauros-Water"] = buildPokemon("Tauros-Water","Fighting","Water","https://www.serebii.net/scarletviolet/pokemon/small/128-a.png","128-a",["Intimidate","Anger Point","Sheer Force"],"75","110","105","30","70","100");
    masterPokemonList["Ting-Lu"] = buildPokemon("Ting-Lu","Dark","Ground","https://www.serebii.net/scarletviolet/pokemon/small/994.png","994",["Vessel of Ruin"],"155","110","125","55","80","45");
    masterPokemonList["Tinkaton"] = buildPokemon("Tinkaton","Steel","Fairy","https://www.serebii.net/scarletviolet/pokemon/small/1002.png","1002",["Mold Breaker","Own Tempo","Pickpocket"],"85","75","77","70","105","94");
    masterPokemonList["Toedscruel"] = buildPokemon("Toedscruel","Ground","Grass","https://www.serebii.net/scarletviolet/pokemon/small/1007.png","1007",["Mycelium Might"],"80","70","65","80","120","100");
    masterPokemonList["Torkoal"] = buildPokemon("Torkoal","Fire","None","https://www.serebii.net/scarletviolet/pokemon/small/324.png","324",["White Smoke","Drought","Shell Armor"],"70","85","140","85","70","20");
    masterPokemonList["Toxapex"] = buildPokemon("Toxapex","Poison","Water","https://www.serebii.net/scarletviolet/pokemon/small/748.png","748",["Merciless","Limber","Regenerator"],"50","63","152","53","142","35");
    masterPokemonList["Toxicroak"] = buildPokemon("Toxicroak","Poison","Fighting","https://www.serebii.net/scarletviolet/pokemon/small/454.png","454",["Anticipation","Dry Skin","Poison Touch"],"83","106","65","86","65","85");
    masterPokemonList["Toxtricity"] = buildPokemon("Toxtricity","Poison","Electric","https://www.serebii.net/scarletviolet/pokemon/small/849.png","849",["Punk Rock","Plus","Technician"],"75","98","70","114","70","75");
    masterPokemonList["Tropius"] = buildPokemon("Tropius","Grass","Flying","https://www.serebii.net/scarletviolet/pokemon/small/357.png","357",["Chlorophyll","Solar Power","Harvest"],"99","68","83","72","87","51");
    masterPokemonList["Tsareena"] = buildPokemon("Tsareena","Grass","None","https://www.serebii.net/scarletviolet/pokemon/small/763.png","763",["Leaf Guard","Queenly Majesty","Sweet Veil"],"72","120","98","50","98","72");
    masterPokemonList["Tyranitar"] = buildPokemon("Tyranitar","Rock","Dark","https://www.serebii.net/scarletviolet/pokemon/small/248.png","248",["Sand Stream","Unnerve"],"100","134","110","95","100","61");
    masterPokemonList["Umbreon"] = buildPokemon("Umbreon","Dark","None","https://www.serebii.net/scarletviolet/pokemon/small/197.png","197",["Synchronize","Inner Focus"],"95","65","110","60","130","65");
    masterPokemonList["Ursaring"] = buildPokemon("Ursaring","Normal","None","https://www.serebii.net/scarletviolet/pokemon/small/217.png","217",["Guts","Quick Feet","Unnerve"],"90","130","75","75","75","55");
    masterPokemonList["Vaporeon"] = buildPokemon("Vaporeon","Water","None","https://www.serebii.net/scarletviolet/pokemon/small/134.png","134",["Water Absorb","Hydration"],"130","65","60","110","95","65");
    masterPokemonList["Veluza"] = buildPokemon("Veluza","Water","Psychic","https://www.serebii.net/scarletviolet/pokemon/small/932.png","932",["Mold Breaker","Sharpness"],"90","102","73","78","65","70");
    masterPokemonList["Venomoth"] = buildPokemon("Venomoth","Poison","Bug","https://www.serebii.net/scarletviolet/pokemon/small/49.png","49",["Shield Dust","Tinted Lens","Wonder Skin"],"70","65","60","90","75","90");
    masterPokemonList["Vespiquen"] = buildPokemon("Vespiquen","Bug","Flying","https://www.serebii.net/scarletviolet/pokemon/small/416.png","416",["Pressure","Unnerve"],"70","80","102","80","102","40");
    masterPokemonList["Vivillon"] = buildPokemon("Vivillon","Bug","Flying","https://www.serebii.net/scarletviolet/pokemon/small/666.png","666",["Shield Dust","Compoundeyes","Friend Guard"],"80","52","50","90","50","89");
    masterPokemonList["Volcarona"] = buildPokemon("Volcarona","Bug","Fire","https://www.serebii.net/scarletviolet/pokemon/small/637.png","637",["Flame Body","Swarm"],"85","60","65","135","105","100");
    masterPokemonList["Weavile"] = buildPokemon("Weavile","Dark","Ice","https://www.serebii.net/scarletviolet/pokemon/small/461.png","461",["Pressure","Pickpocket"],"70","120","65","45","85","125");
    masterPokemonList["Whiscash"] = buildPokemon("Whiscash","Water","Ground","https://www.serebii.net/scarletviolet/pokemon/small/340.png","340",["Oblivious","Anticipation","Hydration"],"110","78","73","76","71","60");
    masterPokemonList["Wigglytuff"] = buildPokemon("Wigglytuff","Normal","Fairy","https://www.serebii.net/scarletviolet/pokemon/small/40.png","40",["Cute Charm","Competitive","Frisk"],"140","70","45","85","50","45");
    masterPokemonList["Wo-Chien"] = buildPokemon("Wo-Chien","Dark","Grass","https://www.serebii.net/scarletviolet/pokemon/small/996.png","996",["Tablets of Ruin"],"85","85","100","95","135","70");
    masterPokemonList["Zangoose"] = buildPokemon("Zangoose","Normal","None","https://www.serebii.net/scarletviolet/pokemon/small/335.png","335",["Immunity","Toxic Boost"],"73","115","60","60","60","90");
    masterPokemonList["Zoroark"] = buildPokemon("Zoroark","Dark","None","https://www.serebii.net/scarletviolet/pokemon/small/571.png","571",["Illusion"],"60","105","60","120","60","105");

    return masterPokemonList;
}

function buildPokemon(name, type1, type2, imageURL, serebiiNumber, abilities, baseHP, baseAttack, baseDefense, baseSpecialAttack, baseSpecialDefense, baseSpeed) {
    const newPokemon = {};
    newPokemon.name = name;
    newPokemon.type1 = type1;
    newPokemon.type2 = type2;
    newPokemon.imageURL = imageURL;
    newPokemon.serebiiNumber = serebiiNumber;
    newPokemon.abilities = abilities;
    newPokemon.baseHP = baseHP;
    newPokemon.baseAttack = baseAttack;
    newPokemon.baseDefense = baseDefense;
    newPokemon.baseSpecialAttack = baseSpecialAttack;
    newPokemon.baseSpecialDefense = baseSpecialDefense;
    newPokemon.baseSpeed = baseSpeed;
    return newPokemon;
}

function setRaidPokemonElements(raidPokemonName) {
    var pokemon = masterPokemonList[raidPokemonName];
    if (pokemon != null) {
        $('#raid-pokemon-offensive-type-1').val(pokemon.type1).trigger('change');
        $('#raid-pokemon-offensive-type-2').val(pokemon.type2).trigger('change');
        $('#raid-pokemon-image').attr('src', pokemon.imageURL);
        $('#raid-pokemon-image').css('display', 'inline')
    }
}