<script lang="ts">
  import type { Scenario, Scenarios } from '../../constants';
  import { Period } from '../../constants';
  import { Remunerator } from '../../constants';
  import { Qualifier, SCENARIO_NAMES } from '../../constants';
  import { likelyRecounts, possibleRecounts } from '../../stores';

  export let stateCode: string;
  export let scenarios: Scenarios;
  export let marginVotes: number;
  export let countedVotes: number;

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
    let limit = deadline
      ? `${deadline.value} ${
          deadline.period === Period.DAYS_AFTER_ELECTION
            ? ' days after the election'
            : deadline.period === Period.DAYS_AFTER_CANVASS
            ? ' days after counting has ended'
            : deadline.period === Period.BUSINESS_DAYS_AFTER_CANVASS
            ? ' business days after counting has ended'
            : ''
        }`.replace('days', deadline.value === 1 ? 'day' : 'days')
      : null;

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
      limit
    };
  });
</script>

<style lang="scss">
  div + div {
    margin-top: 1em;
  }

  [data-possible] {
    color: red;
  }
</style>

<div>
  {#each resultScenarios as scenario, scenarioIndex}
    <div>
      <h3>{SCENARIO_NAMES[scenario.name]} recount</h3>
      <p>{scenario.condition}</p>
      <h4>Is a recount {scenario.name === 'automatic' ? 'likely' : 'possible'}?</h4>
      <p>
        {#if scenario.isRecountPossible}<strong data-possible>Yes</strong>{:else}No{/if}
      </p>
      <h4>Who pays for it?</h4>
      <p>{scenario.remunerator}</p>
      {#if scenario.name !== 'automatic'}
        <h4>Is there a time limit to request a recount?</h4>
        <p>{scenario.limit ? `Yes, ${scenario.limit}` : 'No'}</p>
      {/if}
    </div>
  {/each}
</div>
