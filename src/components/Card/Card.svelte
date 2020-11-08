<script lang="ts">
  import { Scenario, Scenarios, Result, Remunerator } from '../../constants';
  import { Qualifier, SCENARIO_NAMES } from '../../constants';
  import { likelyRecounts, possibleRecounts } from '../../stores';

  export let stateCode: string;
  export let scenarios: Scenarios;
  export let result: Result;

  const {
    // date,
    leading,
    leadingVotes,
    // trailing,
    // trailingVotes,
    // uncountedVotes,
    marginVotes,
    countedVotes
    // expectedUncountedVotes,
    // expectedTotalVotes
  } = result;

  let hasPossibleRecount = false;
  let hasLikelyRecount = false;

  const resultScenarios = Object.keys(scenarios).map(name => {
    const scenario = scenarios[name] as Scenario;
    const { qualifier, margin, exception, remunerator, deadline } = scenario;

    let isRecountPossible = false;
    let condition =
      qualifier === Qualifier.EXCEPTION
        ? exception
        : `${
            name === 'petition'
              ? 'If a petition is lodged with the court, a recount may be enforced'
              : name === 'automatic'
              ? 'A recount is triggered'
              : `${name[0].toUpperCase()}${name.slice(1)}s can request a recount`
          }`;

    switch (qualifier) {
      case Qualifier.NONE:
        if (name !== 'petition') {
          condition = `${condition} regardless of the margin of victory`;
        }

        isRecountPossible = true;
        break;
      case Qualifier.ABSOLUTE_MARGIN:
        condition = `${condition} when the margin of victory between two candidates is less than or equal to ${
          margin || 0
        } votes.`;

        if (marginVotes <= (margin || 0)) {
          isRecountPossible = true;
        }
        break;
      case Qualifier.PERCENTAGE_MARGIN:
        condition = `${condition} when the margin of victory between two candidates is less than or equal to ${
          (margin || 0) * 100
        }% of the total vote.`;

        if (marginVotes / countedVotes <= (margin || 0)) {
          isRecountPossible = true;
        }
        break;
      default:
        break;
    }

    if (isRecountPossible) {
      possibleRecounts.update(states => ({
        ...states,
        [stateCode]: true
      }));

      if (name === 'automatic') {
        likelyRecounts.update(states => ({
          ...states,
          [stateCode]: true
        }));
      }
    }

    return {
      name,
      condition,
      isRecountPossible,
      remunerator:
        (typeof remunerator === 'function' ? remunerator(scenario) : remunerator) === Remunerator.STATE
          ? 'The state'
          : 'The requester',
      deadline
    };
  });
</script>

<style lang="scss">
  div + div {
    margin-top: 1em;
  }

  [data-possible] {
    color: orange;
  }
</style>

<div>
  {#each resultScenarios as scenario, scenarioIndex}
    <div>
      <h3>{SCENARIO_NAMES[scenario.name]} recount</h3>
      <p>{scenario.condition}</p>
      <h4>Who pays? <strong>{scenario.remunerator}</strong></h4>
      <h4>
        {scenario.name === 'automatic' ? 'Likely' : 'Possible'}? <strong
          data-possible={scenario.isRecountPossible ? '' : undefined}>{scenario.isRecountPossible ? 'Yes' : 'No'}</strong>
      </h4>
    </div>
  {/each}
  <!-- <pre>{JSON.stringify(result, null, 2)}</pre> -->
</div>
