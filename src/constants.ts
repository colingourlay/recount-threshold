// sources:
// - https://www.reuters.com/article/us-usa-election-recount-factbox-idUSKBN27K2OA
// - https://ballotpedia.org/Election_recount_laws_and_procedures_in_the_50_states,_2020

export enum StateName {
  AZ = 'Arizona',
  // FL = 'Florida',
  GA = 'Georgia',
  MI = 'Michigan',
  NC = 'North Carolina',
  NV = 'Nevada',
  PA = 'Pennsylvania',
  WI = 'Wisconsin'
}

export const StateCode = new Map(Object.entries(StateName).map(([k, v]) => [v, k]));

export enum Qualifier {
  NONE,
  EXCEPTION,
  PERCENTAGE_MARGIN,
  ABSOLUTE_MARGIN
}

export enum Remunerator {
  STATE,
  REQUESTER
}

export enum Period {
  DAYS_AFTER_ELECTION,
  DAYS_AFTER_CANVASS,
  BUSINESS_DAYS_AFTER_CANVASS
}

export type Deadline = {
  period: Period;
  value: number;
};

export type Scenario = {
  qualifier: Qualifier;
  margin?: number;
  exception?: string;
  remunerator: Remunerator | ((scenario: Scenario) => Remunerator);
  deadline?: Deadline;
};

// export const SCENARIO_NAMES = {
//   automatic: '📉 Automatic',
//   candidate: '🎩 Candidate-requested',
//   voter: '🗳 Voter-requested',
//   petition: '👩‍⚖️ Court petition-enforced'
// };

export const SCENARIO_NAMES = {
  automatic: 'Automatic',
  candidate: 'Candidate-requested',
  voter: 'Voter-requested',
  petition: 'Court petition-enforced'
};

export type Scenarios = {
  automatic?: Scenario;
  candidate?: Scenario;
  voter?: Scenario;
  petition?: Scenario;
};

export type StatesScenarios = {
  [key in StateName]: Scenarios;
};

export const STATES_SCENARIOS: StatesScenarios = {
  [StateName.AZ]: {
    automatic: {
      qualifier: Qualifier.PERCENTAGE_MARGIN,
      margin: 0.001,
      remunerator: Remunerator.STATE
    }
  },
  // [StateName.FL]: {
  //   automatic: {
  //     qualifier: Qualifier.PERCENTAGE_MARGIN,
  //     margin: 0.005,
  //     remunerator: Remunerator.STATE
  //   }
  // },
  [StateName.GA]: {
    candidate: {
      qualifier: Qualifier.PERCENTAGE_MARGIN,
      margin: 0.005,
      remunerator: Remunerator.STATE,
      deadline: {
        period: Period.DAYS_AFTER_CANVASS,
        value: 2
      }
    }
  },
  [StateName.MI]: {
    automatic: {
      qualifier: Qualifier.ABSOLUTE_MARGIN,
      margin: 2000,
      remunerator: Remunerator.STATE
    },
    candidate: {
      qualifier: Qualifier.NONE,
      remunerator: Remunerator.REQUESTER,
      deadline: {
        period: Period.DAYS_AFTER_CANVASS,
        value: 2
      }
    }
  },
  [StateName.NC]: {
    candidate: {
      qualifier: Qualifier.PERCENTAGE_MARGIN,
      margin: 0.01,
      remunerator: Remunerator.STATE,
      deadline: {
        period: Period.BUSINESS_DAYS_AFTER_CANVASS,
        value: 2
      }
    },
    automatic: {
      qualifier: Qualifier.EXCEPTION,
      exception:
        'Not triggered by a close vote margin. An automatic recount occurs if election officials discover a substantial error while conducting a random-sample partial recount as part of a requested recount.',
      remunerator: Remunerator.STATE
    }
  },
  [StateName.NV]: {
    candidate: {
      qualifier: Qualifier.NONE,
      remunerator: Remunerator.REQUESTER,
      deadline: {
        period: Period.BUSINESS_DAYS_AFTER_CANVASS,
        value: 3
      }
    }
  },
  [StateName.PA]: {
    automatic: {
      qualifier: Qualifier.PERCENTAGE_MARGIN,
      margin: 0.005,
      remunerator: Remunerator.STATE
    },
    voter: {
      qualifier: Qualifier.NONE,
      remunerator: Remunerator.REQUESTER,
      deadline: {
        period: Period.DAYS_AFTER_ELECTION,
        value: 5
      }
    },
    petition: {
      qualifier: Qualifier.NONE,
      remunerator: Remunerator.REQUESTER,
      deadline: {
        period: Period.DAYS_AFTER_ELECTION,
        value: 5
      }
    }
  },
  [StateName.WI]: {
    candidate: {
      qualifier: Qualifier.PERCENTAGE_MARGIN,
      margin: 0.01,
      remunerator: ({ margin }) => (margin && margin <= 0.0025 ? Remunerator.STATE : Remunerator.REQUESTER),
      deadline: {
        period: Period.BUSINESS_DAYS_AFTER_CANVASS,
        value: 1
      }
    }
  }
};

export const PARTY_IDS = ['dem', 'gop', 'oth'];

export const PARTY_CANDIDATES = {
  dem: 'Biden',
  gop: 'Trump',
  oth: 'Other'
};

export type Result = {
  date: Date;
  leading: string;
  leadingVotes: number;
  trailing: string;
  trailingVotes: number;
  marginVotes: number;
  countedVotes: number;
  expectedTotalVotes: number;
  expectedUncountedVotes: number;
};

export type Datum = {
  stateCode: string;
  stateName: string;
  electoralCollegeVotes: number;
  scenarios: Scenarios;
  result: Result;
};
