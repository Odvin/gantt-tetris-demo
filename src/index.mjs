import * as fs from 'fs';
import * as path from 'path';

import Mustache from 'mustache';

import plan from './mock/mockProgramPlan.json' assert {type: 'json'};
import capacity from './mock/mockCapacityInfo.json' assert {type: 'json'};
import config from './config.json' assert {type: 'json'};

import Recommender from '../src/recommender/Recommender.mjs';

function getWorkDates(start, end, config) {
  let dates = [];
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (startDate > endDate) {
    throw Error('Incorrect days range');
  }

  let currentDate = startDate;

  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  if (config.excludeWeekends) {
    dates = dates.filter((d) => 0 < new Date(d).getUTCDate() < 6);
  }

  if (config.excludedWorkDates) {
    dates = dates.filter((d) => !config.excludedWorkDates.includes(d));
  }

  return dates.length;
}

const template = `
  <!DOCTYPE html>
  <html lang="en">
  {{>head}}
    <body>
      {{>program}}
      {{>sites}}
      {{>projects}}
      {{>activities}}
      <pre class="mermaid">
        {{>programPlan}}
      </pre>
      {{>programCap}}
      {{>companies}}
      {{>crews}}
      <pre class="mermaid">
        {{>capacity}}
      </pre>
      <pre class="mermaid">
        {{>compCapacity}}
      </pre>
      {{>scripts}}
    </body>
  </html>`;

const resultTemplate = `
<!DOCTYPE html>
<html lang="en">
{{>head}}
  <body>
    {{>program}}
    {{>summary}}
    <pre class="mermaid">
      {{>allocated}}
    </pre>
    {{>result}}
    {{>scripts}}
  </body>
</html>`;

const planActivities = [];
const siteSet = new Set();
const siteMap = new Map();

for (let a of plan.activities) {
  if (siteSet.has(a.siteId)) {
    siteMap.get(a.siteId).push({
      start: a.activityStartDate,
      end: a.activityEndDate,
      id: a.activityId.split('-')[0],
      activityId: a.activityId,
      c: a.capacity,
      p: a.priority,
    });
  } else {
    siteMap.set(a.siteId, [
      {
        start: a.activityStartDate,
        end: a.activityEndDate,
        id: a.activityId.split('-')[0],
        activityId: a.activityId,
        c: a.capacity,
        p: a.priority,
      },
    ]);
    siteSet.add(a.siteId);
  }
}

for (let siteKey of siteMap.keys()) {
  planActivities.push({
    site: plan.sites.find((s) => s.siteId === siteKey).siteTitle,
    activities: siteMap.get(siteKey),
  });
}

// console.log(JSON.stringify(planActivities, null, 4));

const {companies, allocations} = capacity;

let totalCompaniesCapacity = 0;

const companyCap = companies.map((c) => {
  let {activitiesPercentage, scopes} = allocations.find(
    (a) => a.companyId === c.companyId
  );
  let crews = 0;
  let crewCapacity = 0;

  for (let crew of capacity.crews) {
    if (crew.companyId === c.companyId) {
      crews += 1;
      for (let cap of capacity.capacities) {
        if (cap.companyId === c.companyId && cap.crewId === crew.crewId) {
          crewCapacity += cap.capacity;
          totalCompaniesCapacity += cap.capacity;
        }
      }
    }
  }

  return {
    ...c,
    activitiesPercentage,
    scopes,
    crews,
    capacity: crewCapacity,
  };
});

const {sites, activities, projects} = plan;
let programTotalActivities = 0;
let programTotalCapacities = 0;

const programCap = sites.map((s) => {
  let siteActivities = 0;
  let siteCapacity = 0;
  let projectCap = [];

  for (let p of projects) {
    if (s.siteId === p.siteId) {
      let projectActivities = 0;
      let projectCapacity = 0;

      for (let a of activities) {
        if (p.projectId === a.projectId) {
          const workDates = getWorkDates(
            a.activityStartDate,
            a.activityEndDate,
            config
          );

          siteCapacity += a.capacity * workDates;
          projectCapacity += a.capacity * workDates;
          siteActivities += 1;
          projectActivities += 1;

          programTotalActivities += 1;
          programTotalCapacities += a.capacity * workDates;
        }
      }
      projectCap.push({
        projectId: p.projectId,
        projectTitle: p.projectTitle,
        projectActivities,
        projectCapacity,
      });
    }
  }
  return {
    siteId: s.siteId,
    siteTitle: s.siteTitle,
    siteActivities,
    siteCapacity,
    projectCap,
  };
});

const companyCrews = companies.map((c) => {
  let crews = 0;
  let compCrews = [];
  for (let compCrew of capacity.crews) {
    if (c.companyId === compCrew.companyId) {
      compCrews.push(compCrew);
      crews += 1;
    }
  }
  return {
    ...c,
    crews,
    compCrews,
  };
});

const datesSet = new Set();
const crewsMap = new Map();
const crewsCap = [];
const compsCap = [];

for (let cap of capacity.capacities) {
  datesSet.add(cap.workDate);
  if (crewsMap.has(cap.workDate)) {
    crewsMap.get(cap.workDate).push({
      crewId: cap.crewId.split('-')[0],
      companyId: cap.companyId.split('-')[0],
      capacity: cap.capacity,
    });
  } else {
    crewsMap.set(cap.workDate, [
      {
        crewId: cap.crewId.split('-')[0],
        companyId: cap.companyId.split('-')[0],
        capacity: cap.capacity,
      },
    ]);
  }
}

for (let d of datesSet) {
  crewsCap.push({
    workDate: d,
    caps: [...crewsMap.get(d)],
  });
}

const tempMap = new Map();
for (let d of datesSet) {
  for (let cc of crewsMap.get(d)) {
    if (tempMap.has(cc.companyId)) {
      tempMap.set(cc.companyId, tempMap.get(cc.companyId) + cc.capacity);
    } else {
      tempMap.set(cc.companyId, cc.capacity);
    }
  }

  let cCaps = [];
  for (let e of tempMap) {
    cCaps.push({companyId: e[0], capacity: e[1]});
  }
  tempMap.clear();

  compsCap.push({
    workDate: d,
    caps: [...cCaps],
  });
}

const data = {
  plan,
  planActivities,
  companyCap,
  totalCompaniesCapacity,
  programCap,
  programTotalActivities,
  programTotalCapacities,
  companyCrews,
  crewsCap: crewsCap.slice(0, 10),
  compsCap: compsCap.slice(0, 10),
};

// +++++++ call recommender +++++++++
const recommender = new Recommender(config);

recommender.feedProgramPlan(plan);
recommender.feedCrewsCapacities(capacity);

const {result, stats} = recommender.recommendation;

// +++++++ call recommender +++++++++

const resultPlanActivities = [];

for (let planed of planActivities) {
  const allocatedJobs = [];
  for (let activity of planed.activities) {
    allocatedJobs.push(activity);
    let allocatedRes = result.filter(
      (r) => r.activityId === activity.activityId
    );

    if (allocatedRes.length) {
      allocatedRes = allocatedRes.map((a) => ({
        start: a.startDate,
        end: a.endDate,
        id: a.activityId.split('-')[0],
        c: a.crewId.split('-')[0],
        p: a.companyId.split('-')[0],
        mark: a.crewId === a.companyId ? 'active,' : 'done,',
      }));
    }

    allocatedJobs.push(...allocatedRes);
  }

  resultPlanActivities.push({
    site: planed.site,
    allocatedJobs,
  });
}

const resultView = [];
for (let site of sites) {
  let projectsOnSite = [];
  for (let project of projects) {
    if (project.siteId === site.siteId) {
      let location = {};
      if (site.latitude && site.longitude) {
        location = {
          lat: site.latitude,
          long: site.longitude,
        };
      }

      projectsOnSite.push({
        siteTitle: site.siteTitle,
        ...project,
        ...location,
      });
    }
  }

  for (let projectOnSite of projectsOnSite) {
    const projectActivities = activities
      .filter(
        (a) =>
          a.projectId == projectOnSite.projectId &&
          a.siteId === projectOnSite.siteId
      )
      .map((a) => ({
        ...a,
        totalCapacity:
          a.capacity *
          getWorkDates(a.activityStartDate, a.activityEndDate, config),
      }))
      .map((a) => {
        const recommendations = result.filter(
          (r) =>
            r.siteId === a.siteId &&
            r.projectId === a.projectId &&
            r.activityId === a.activityId
        );

        return {
          ...a,
          recommendations,
        };
      });

    resultView.push({
      ...projectOnSite,
      projectActivities,
    });
  }
}

const resultData = {
  plan,
  stats,
  resultPlanActivities,
  resultView,
};

function loadSharedPartials() {
  const partials = {};
  const files = fs.readdirSync('./src/templates');

  for (let file of files) {
    if (file.match(/\.partial\.mustache$/)) {
      let name = path.basename(file, '.partial.mustache');
      partials[name] = fs.readFileSync(`./src/templates/${file}`, {
        encoding: 'utf8',
      });
    }
  }

  return partials;
}

try {
  const output = Mustache.render(template, data, loadSharedPartials());
  const result = Mustache.render(
    resultTemplate,
    resultData,
    loadSharedPartials()
  );

  fs.writeFileSync('./src/index.html', output);
  fs.writeFileSync('./src/result.html', result);
} catch (error) {
  console.error(error);
  throw error;
}
