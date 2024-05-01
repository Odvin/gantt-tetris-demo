import * as fs from 'fs';

import {faker} from '@faker-js/faker';

import skills from './skills.json' assert {type: 'json'};
import certifications from './certifications.json' assert {type: 'json'};
import scopes from './scopes.json' assert {type: 'json'};

const config = {
  programStartDate: '2024-01-01',
  programEndDate: '2024-04-20',
  maxSites: 5,
  siteLocationProbability: 0.25,
  maxProjectPerSite: 5,
  projectDateFrameProbability: 0.5,
  maxActivityPerProject: 7,
  scopePresenceProbability: 0.3,
  skillsPresenceProbability: 0.3,
  maxSkillsRequired: 3,
  certificationsPresenceProbability: 0.3,
  maxCertificationsRequired: 2,
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
};

const getDates = (start, end) => {
  const dates = [];
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (startDate >= endDate) {
    throw Error('Incorrect days range');
  }

  let currentDate = startDate;

  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return dates;
};

const getInternalRange = (formDate, toDate) => {
  const dateA = faker.date.between({
    from: formDate,
    to: toDate,
  });

  const dateB = faker.date.between({
    from: formDate,
    to: toDate,
  });

  return dateA >= dateB
    ? {
        start: dateB.toISOString().split('T')[0],
        end: dateA.toISOString().split('T')[0],
      }
    : {
        start: dateA.toISOString().split('T')[0],
        end: dateB.toISOString().split('T')[0],
      };
};

class Generator {
  getProgram() {
    return {
      programId: faker.string.uuid(),
      programTitle: faker.company.catchPhrase(),
      programStartDate: config.programStartDate,
      programEndDate: config.programEndDate,
      customerId: faker.string.uuid(),
      customerTitle: faker.company.name(),
    };
  }

  getSites() {
    const sitesNumber = faker.number.int({min: 1, max: config.maxSites});
    const sites = [];

    for (let i = 0; i < sitesNumber; i++) {
      let location = faker.helpers.maybe(
        () => ({
          latitude: faker.location.latitude(),
          longitude: faker.location.longitude(),
        }),
        {probability: config.siteLocationProbability}
      );

      sites.push({
        siteId: faker.string.uuid(),
        siteTitle: faker.string.alpha({length: 7, casing: 'upper'}),
        countryCode: faker.location.countryCode('alpha-2'),
        state: faker.location.state(),
        city: faker.location.city(),
        address: faker.location.streetAddress(true),
        ...location,
      });
    }

    return sites;
  }

  getProjects(siteIds) {
    const projects = [];
    for (let siteId of siteIds) {
      const projectNumber = faker.number.int({
        min: 1,
        max: config.maxProjectPerSite,
      });
      for (let i = 0; i < projectNumber; i++) {
        let dateFrame = faker.helpers.maybe(
          () => {
            const {start, end} = getInternalRange(
              config.programStartDate,
              config.programEndDate
            );

            return {
              projectStarDate: start,
              projectEndDate: end,
            };
          },
          {probability: config.projectDateFrameProbability}
        );

        projects.push({
          projectId: faker.string.uuid(),
          siteId,
          projectTitle: faker.lorem.slug(3),
          ...dateFrame,
        });
      }
    }

    return projects;
  }

  getActivities(projects) {
    const activities = [];

    for (let project of projects) {
      const activityNumber = faker.number.int({
        min: 1,
        max: config.maxActivityPerProject,
      });

      for (let i = 0; i < activityNumber; i++) {
        let reqScope = faker.helpers.maybe(
          () => faker.helpers.arrayElement(scopes),
          {
            probability: config.scopePresenceProbability,
          }
        );

        let reqSkills = faker.helpers.maybe(
          () => {
            const ss = [];
            const s = faker.number.int(config.maxSkillsRequired);
            for (let i = 0; i < s; i++) {
              ss.push(faker.helpers.arrayElement(skills));
            }
            return ss;
          },
          {
            probability: config.skillsPresenceProbability,
          }
        );

        let reqCertifications = faker.helpers.maybe(
          () => {
            const cs = [];
            const c = faker.number.int(config.maxCertificationsRequired);
            for (let i = 0; i < c; i++) {
              cs.push(faker.helpers.arrayElement(certifications));
            }
            return cs;
          },
          {
            probability: config.certificationsPresenceProbability,
          }
        );

        const {start, end} = getInternalRange(
          project.projectStarDate
            ? project.projectStarDate
            : config.programStartDate,
          project.projectEndDate
            ? project.projectEndDate
            : config.programEndDate
        );

        activities.push({
          activityId: faker.string.uuid(),
          projectId: project.projectId,
          siteId: project.siteId,
          scope: reqScope,
          certifications: reqCertifications,
          skills: reqSkills,
          priority: faker.number.int({min: 1, max: 3}),
          capacity: faker.number.int({min: 1, max: 3}),
          activityStartDate: start,
          activityEndDate: end,
        });
      }
    }

    return activities;
  }
}

const generator = new Generator();

// console.log(JSON.stringify(generator.getProgram(), null, 4));

// console.log(JSON.stringify(generator.getSites(), null, 4));

// console.log(
//   JSON.stringify(
//     generator.getProjects([
//       '93408039-532b-4062-a478-5a2391504aac',
//       'cf61e840-e790-4e7b-9e81-adf3af98ce5e',
//     ]),
//     null,
//     4
//   )
// );

const projects = generator.getProjects([
  '93408039-532b-4062-a478-5a2391504aac',
  'cf61e840-e790-4e7b-9e81-adf3af98ce5e',
]);

console.log(JSON.stringify(generator.getActivities(projects), null, 4));
