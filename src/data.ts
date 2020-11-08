import type { Combined } from 'elections-us2020-results-data';
import type { Datum } from './constants';
import { StateName, STATES_SCENARIOS, PARTY_IDS, PARTY_CANDIDATES } from './constants';

const ABC_URL_BASE = 'https://www.abc.net.au/dat/news/elections/international/us-2020/';
const FIREBASE_URL_BASE = 'https://elections-us2020-results-data.web.app/';

type DataPromises = {
  [key: string]: Promise<Datum[]>;
};

const dataPromises: DataPromises = {};

type LoadDataOptions = {
  server?: 'abc' | 'firebase';
  forceRefresh?: boolean;
  test?: number;
};

export const loadData = ({ server, forceRefresh, test }: LoadDataOptions = {}) => {
  const id = typeof test === 'number' && server === 'abc' ? `test/${test}` : 'latest';

  if (!dataPromises[id] || forceRefresh) {
    dataPromises[id] = fetch(`${server === 'abc' ? ABC_URL_BASE : FIREBASE_URL_BASE}${id}.json`)
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

  return dataPromises[id];
};
