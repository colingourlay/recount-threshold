<script lang="ts">
  import type { Combined } from 'elections-us2020-results-data';
  import type { Scenarios, Datum } from '../../constants';
  import { StateName, STATES_SCENARIOS, PARTY_IDS, PARTY_CANDIDATES } from '../../constants';
  import { loadData } from '../../data';
  import { likelyRecounts, possibleRecounts } from '../../stores';
  import Card from '../Card/Card.svelte';

  const dataPromise = loadData();

  dataPromise.then(data => console.log(data));
</script>

<style lang="scss">
  .root {
    margin: var(--grid-gap);
  }

  .states {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(32ch, 1fr));
    grid-gap: var(--grid-gap);
  }

  article {
    border: 0.0625rem solid #ccc;
    padding: 1rem;

    &:not([data-has-possible]):not([data-has-likely]) {
      opacity: 0.5;
    }

    &[data-has-possible] {
      border: 0.125rem solid orange;
      background-color: rgb(253, 246, 239);
    }

    &[data-has-likely] {
      border: 0.25rem solid tomato;
      background-color: rgb(255, 233, 227);
    }
  }

  article > h2 {
    line-height: 1;
  }

  article > h2 > small {
    float: right;
    color: #666;
    font-size: 1rem;
    line-height: 1.75;
    white-space: nowrap;
  }
</style>

<div class="root">
  {#await dataPromise}
    <p>Loading...</p>
  {:then data}
    <div class="states">
      {#each data as { stateName, stateCode, electoralCollegeVotes, scenarios, result }}
        <article
          data-state={stateCode}
          data-has-possible={$possibleRecounts[stateCode] ? '' : undefined}
          data-has-likely={$likelyRecounts[stateCode] ? '' : undefined}>
          <h2>{stateName} <small>{electoralCollegeVotes} EC votes</small></h2>
          <h4>
            {`${result.leading}'s margin: ${result.marginVotes} votes (${((result.marginVotes / result.countedVotes) * 100).toFixed(2)}%)`}
          </h4>

          <Card {stateCode} {scenarios} {result} />
        </article>
      {/each}
    </div>
  {/await}
</div>
