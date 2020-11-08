<script lang="ts">
  import type { Combined } from 'elections-us2020-results-data';
  import type { Scenarios, Datum } from '../../constants';
  import { StateName, STATES_SCENARIOS, PARTY_IDS, PARTY_CANDIDATES } from '../../constants';
  import { loadData } from '../../data';
  import { likelyRecounts, possibleRecounts } from '../../stores';
  import Card from '../Card/Card.svelte';

  const MONTH_SHORTNAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatTimeUpdated = (date: Date) => {
    const dateString = date.toString();
    const hours = date.getHours();

    return isToday(date)
      ? `${hours % 12 || 12}:${String(date.getMinutes()).padStart(2, '0')}${
          hours >= 12 ? 'p' : 'a'
        }m ${dateString.substring(dateString.indexOf('(')).replace(/([a-z\s]+)/g, '')}`
      : `${date.getDate()} ${MONTH_SHORTNAMES[date.getMonth()]}`;
  };

  const dataPromise = loadData();

  dataPromise.then(data => console.log(data));
</script>

<style lang="scss">
  .root {
    margin: 0 auto;
    max-width: 160ch;
  }

  h1,
  .loading {
    text-align: center;
    margin: var(--grid-gap) 0 0 0;
    padding: var(--grid-gap);
  }

  .states {
    margin: var(--grid-gap);
    display: grid;
    grid-template-columns: 1;
    grid-gap: var(--grid-gap);

    @media (min-width: 80ch) {
      grid-template-columns: repeat(auto-fit, minmax(35ch, 1fr));
      grid-gap: var(--grid-gap);
    }
  }

  article {
    border: 0.0625rem solid #ccc;
    padding: 1rem;

    &:not([data-has-possible]):not([data-has-likely]) {
      opacity: 0.667;
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

  table {
    width: 100%;
  }

  th {
    text-align: left;
  }

  [data-number] {
    text-align: right;
  }
</style>

<div class="root">
  <h1>Can I get a recount?</h1>
  {#await dataPromise}
    <p class="loading">Loading...</p>
  {:then data}
    <div class="states">
      {#each data as { stateName, stateCode, electoralCollegeVotes, scenarios, result, changes }}
        <article
          data-state={stateCode}
          data-has-possible={$possibleRecounts[stateCode] ? '' : undefined}
          data-has-likely={$likelyRecounts[stateCode] ? '' : undefined}>
          <h2>{stateName} <small>{electoralCollegeVotes} EC votes</small></h2>
          <h4>
            {`${result.leading}'s margin: ${result.marginVotes} votes (${((result.marginVotes / result.countedVotes) * 100).toFixed(2)}%)`}
          </h4>
          <Card {stateCode} {scenarios} marginVotes={result.marginVotes} countedVotes={result.countedVotes} />
          {#if changes}
            <details>
              <summary>Latest counts</summary>
              <table>
                <tr>
                  <th>Date</th>
                  <th>Leading</th>
                  <th data-number>Margin</th>
                  <th data-number>Uncounted</th>
                </tr>
                {#each changes as { date, leading, marginVotes, expectedUncountedVotes }}
                  <tr>
                    <td>{formatTimeUpdated(date)}</td>
                    <td>{leading}</td>
                    <td data-number>{marginVotes}</td>
                    <td data-number>{expectedUncountedVotes > 0 ? expectedUncountedVotes : 'Unknown'}</td>
                  </tr>
                {/each}
              </table>
              <!-- <pre>{JSON.stringify(changes, null, 2)}</pre> -->
            </details>
          {/if}
        </article>
      {/each}
    </div>
  {/await}
</div>
