import Recommender from './Recommender.mjs';

import plan from '../mock/mockProgramPlan.json' assert {type: 'json'};
import capacityInfo from '../mock/mockCapacityInfo.json' assert {type: 'json'};

const recommender = new Recommender({
  excludedWorkDates: ['2024-01-03', '2024-01-05'],
  considerScopes: false,
  considerCertifications: false,
  considerSkills: false,
});

recommender.feedProgramPlan(plan);
recommender.feeCrewsCapacities(capacityInfo);

const r = recommender.recommendation;

// recommender.logCompanyCapacities('1e5b5fdc-c98a-42a4-9ed2-de9ab8eae754');

// console.log(recommender.config);
