import { csvParse } from 'd3-dsv';
import type { Combined } from 'elections-us2020-results-data';
import type { Datum } from './constants';
import { StateCode, StateName, STATES_SCENARIOS, PARTY_IDS, PARTY_CANDIDATES } from './constants';

const ABC_RESULTS_URL_BASE = 'https://www.abc.net.au/dat/news/elections/international/us-2020/';
const FIREBASE_RESULTS_URL_BASE = 'https://elections-us2020-results-data.web.app/';
const CHANGES_URL =
  'https://raw.githubusercontent.com/alex/nyt-2020-election-scraper/master/battleground-state-changes.csv';

type DataPromises = {
  [key: string]: Promise<Datum[] | {}>;
};

const dataPromises: DataPromises = {};

type LoadDataOptions = {
  server?: 'abc' | 'firebase';
  forceRefresh?: boolean;
  test?: number;
};

export const loadData = ({ server, forceRefresh, test }: LoadDataOptions = {}) => {
  const resultsURL = `${server === 'abc' ? ABC_RESULTS_URL_BASE : FIREBASE_RESULTS_URL_BASE}${
    typeof test === 'number' && server === 'abc' ? `test/${test}` : 'latest'
  }.json`;

  if (!dataPromises[resultsURL] || forceRefresh) {
    dataPromises[resultsURL] = fetch(resultsURL)
      .then<Combined.Results>(response => response.json())
      .then(data =>
        Object.values<Datum>(
          Object.keys(data.s).reduce((memo, key) => {
            const result = data.s[key];
            const { id: stateCode, e: electoralCollegeVotes, t: timestamp, cp: countedPct } = result;
            const stateName = StateName[stateCode];

            if (!timestamp || !countedPct || !stateName || memo[stateCode]) {
              return memo;
            }

            const rankedParties = [...PARTY_IDS]
              .map<Combined.Party>(partyID => result[partyID])
              .sort((a, b) => b.v - a.v);
            const countedVotes = rankedParties.reduce((memo, { v }) => memo + v, 0);
            const expectedTotalVotes = Math.floor((countedVotes / countedPct) * 100);
            const [leadingParty, trailingParty] = rankedParties;

            memo[stateCode] = {
              stateCode,
              stateName,
              electoralCollegeVotes,
              scenarios: STATES_SCENARIOS[stateName],
              result: {
                date: new Date(timestamp),
                leading: PARTY_CANDIDATES[leadingParty.id],
                leadingVotes: leadingParty.v,
                trailing: PARTY_CANDIDATES[trailingParty.id],
                trailingVotes: trailingParty.v,
                marginVotes: leadingParty.v - trailingParty.v,
                countedVotes,
                expectedTotalVotes,
                expectedUncountedVotes: expectedTotalVotes - countedVotes
              }
            };

            return memo;
          }, {})
        )
      );
  }

  if (!dataPromises[CHANGES_URL] || forceRefresh) {
    dataPromises[CHANGES_URL] = fetch(CHANGES_URL)
      .then(response => response.text())
      .then(text => csvParse(text, null))
      .then(data =>
        data.reduce((memo, row) => {
          const {
            state,
            timestamp,
            leading_candidate_name: leading,
            vote_differential: marginVotes,
            votes_remaining: expectedUncountedVotes
          } = row;
          const stateCode = StateCode.get(state.split(' (EV: ')[0]);

          if (!stateCode) {
            return memo;
          }

          if (!memo[stateCode]) {
            memo[stateCode] = [];
          }

          memo[stateCode].push({
            date: new Date(timestamp),
            leading,
            marginVotes,
            expectedUncountedVotes
          });

          return memo;
        }, {})
      );
  }

  return Promise.all([dataPromises[resultsURL], dataPromises[CHANGES_URL]]).then<Datum[]>(
    ([resultsData, changesData]) =>
      (resultsData as Datum[]).map(d => {
        return {
          ...d,
          changes: changesData[d.stateCode]
        };
      })
  );
};
