import Recommender from './Recommender.mjs';

import plan from '../mock/mockProgramPlan.json' assert {type: 'json'};
import capacityInfo from '../mock/mockCapacityInfo.json' assert {type: 'json'};

const recommender = new Recommender({
  excludedWorkDates: ['2024-01-03'],
  considerScopes: false,
  considerCertifications: false,
  considerSkills: false,
  crewRecommended: true,
});

recommender.feedProgramPlan(plan);
recommender.feedCrewsCapacities(capacityInfo);

const r = recommender.recommendation;

console.log(JSON.stringify(r, null, 4));

// console.log(recommender.config);
